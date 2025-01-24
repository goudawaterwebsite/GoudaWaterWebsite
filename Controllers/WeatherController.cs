using Microsoft.AspNetCore.Mvc;
using GoudaWater.Data;
using GoudaWater.Models;
using Microsoft.EntityFrameworkCore;
using System;
using System.Linq;
using System.Net.Http;
using System.Threading.Tasks;
using Newtonsoft.Json.Linq;

namespace GoudaWater.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class WeatherController : ControllerBase
    {
        private readonly ApplicationDbContext _context;
        private readonly IHttpClientFactory _clientFactory;

        private static dynamic _currentWeatherCache;
        private static DateTime _cacheTimestamp;

        public WeatherController(ApplicationDbContext context, IHttpClientFactory clientFactory)
        {
            _context = context;
            _clientFactory = clientFactory;
        }

        private bool IsCacheValid()
        {
            return _currentWeatherCache != null && _cacheTimestamp.Date == DateTime.Now.Date;
        }

        private async Task<dynamic> FetchWeatherFromApi()
        {
            var apiUrl = "https://weerlive.nl/api/weerlive_api_v2.php?key=e99172ba12&locatie=Gouda";
            var client = _clientFactory.CreateClient();
            var response = await client.GetStringAsync(apiUrl);
            return JObject.Parse(response);
        }

        [HttpGet("getCurrentWeather")]
        public async Task<IActionResult> GetCurrentWeather()
        {
            if (IsCacheValid())
            {
                return Ok(_currentWeatherCache); 
            }

            try
            {
                var weatherData = await FetchWeatherFromApi();
                _currentWeatherCache = weatherData;
                _cacheTimestamp = DateTime.Now;

                return Ok(weatherData);
            }
            catch (Exception ex)
            {
                return StatusCode(500, $"Fout bij het ophalen van de weersvoorspelling: {ex.Message}");
            }
        }

        [HttpGet("syncWeather")]
        public async Task<IActionResult> SyncWeatherData()
        {
            var endDate = DateTime.Today;
            var startDate = endDate.AddMonths(-3);

            var weerstation = await _context.Device.OfType<Weerstation>()
                .Include(ws => ws.Adres)
                .FirstOrDefaultAsync(ws => ws.Naam == "open-meteo");

            if (weerstation == null)
            {
                var newAdres = new Adres
                {
                    Straatnaam = "Unknown",
                    Huisnummer = null,
                    Postcode = "Unknown",
                    Woonplaats = "Gouda",
                    X = 52.0167M,
                    Y = 4.7083M
                };
                _context.Adres.Add(newAdres);
                await _context.SaveChangesAsync();

                weerstation = new Weerstation
                {
                    Naam = "open-meteo",
                    AdresID = newAdres.ID
                };
                _context.Device.Add(weerstation);
                await _context.SaveChangesAsync();
            }

            var existingWeatherData = await _context.WeerGeschiedenis
                .Where(wg => wg.Datum >= startDate && wg.Datum <= endDate && wg.WeerStationID == weerstation.ID)
                .Select(wg => wg.Datum)
                .ToListAsync();

            var missingDates = Enumerable.Range(0, (endDate - startDate).Days + 1)
                                         .Select(d => startDate.AddDays(d))
                                         .Where(d => !existingWeatherData.Contains(d))
                                         .ToList();

            if (!missingDates.Any())
                return Ok("Geen ontbrekende data om te importeren.");

            foreach (var date in missingDates)
            {
                var apiUrl = $"https://archive-api.open-meteo.com/v1/archive?latitude=52.0167&longitude=4.7083&start_date={date:yyyy-MM-dd}&end_date={date:yyyy-MM-dd}&daily=temperature_2m_max,temperature_2m_min,daylight_duration,sunshine_duration,precipitation_sum";

                var client = _clientFactory.CreateClient();
                var response = await client.GetStringAsync(apiUrl);
                var weatherData = JObject.Parse(response);

                var dailyData = weatherData["daily"];
                if (dailyData != null)
                {
                    var maxTemp = GetSafeValue(dailyData, "temperature_2m_max");
                    var minTemp = GetSafeValue(dailyData, "temperature_2m_min");
                    var daylightDuration = GetSafeValue(dailyData, "daylight_duration");
                    var sunshineDuration = GetSafeValue(dailyData, "sunshine_duration");
                    var precipitationSum = GetSafeValue(dailyData, "precipitation_sum");

                    var newWeerData = new WeerGeschiedenis
                    {
                        Datum = date,
                        MaxTemp = maxTemp,
                        MinTemp = minTemp,
                        TotaalDaglicht = daylightDuration,
                        TotaalZonlicht = sunshineDuration,
                        TotaalRegen = precipitationSum,
                        WeerStationID = weerstation.ID
                    };

                    _context.WeerGeschiedenis.Add(newWeerData);
                }
            }

            await _context.SaveChangesAsync();
            return Ok("Weerdata succesvol bijgewerkt tot vandaag.");
        }

        [HttpGet("getWeatherHistory")]
        public async Task<IActionResult> GetWeatherHistory()
        {
            var hasWeatherData = await _context.WeerGeschiedenis.AnyAsync();

            if (!hasWeatherData)
            {
                var syncResult = await SyncWeatherData();
                if (syncResult is OkObjectResult syncOk && syncOk.Value.ToString() == "Weerdata succesvol bijgewerkt tot vandaag.")
                {
                    var weatherData = await _context.WeerGeschiedenis
                        .Include(wg => wg.WeerStation)
                        .ToListAsync();
                    return Ok(weatherData);
                }

                return syncResult;
            }

            var existingWeatherData = await _context.WeerGeschiedenis
                .Include(wg => wg.WeerStation)
                .ToListAsync();
            return Ok(existingWeatherData);
        }

        double GetSafeValue(JToken token, string key)
        {
            var valueArray = token[key];
            var firstValue = valueArray?.FirstOrDefault();
            double? result = firstValue?.ToObject<double?>();
            return result ?? 0.0;
        }

        [HttpGet("getForecastForTomorrow")]
        public async Task<IActionResult> GetForecastForTomorrow()
        {
            try
            {
                var apiUrl = "https://weerlive.nl/api/weerlive_api_v2.php?key=e99172ba12&locatie=Gouda";
                var client = _clientFactory.CreateClient();
                var response = await client.GetStringAsync(apiUrl);
                var weatherData = JObject.Parse(response);

                var forecast = weatherData["wk_verw"]?.FirstOrDefault(d => d["dag"]?.ToString() == DateTime.Today.AddDays(1).ToString("dd-MM-yyyy"));

                if (forecast == null)
                {
                    return NotFound("Geen weersvoorspelling gevonden voor morgen.");
                }

                var forecastData = new
                {
                    minTemp = forecast["min_temp"]?.ToString(),
                    maxTemp = forecast["max_temp"]?.ToString(),
                    description = forecast["image"]?.ToString(),
                    windSpeed = forecast["windkmh"]?.ToString(),
                    rainChance = forecast["neersl_perc_dag"]?.ToString(),
                };

                return Ok(forecastData);
            }
            catch (Exception ex)
            {
                return StatusCode(500, $"Fout bij het ophalen van de weersvoorspelling: {ex.Message}");
            }
        }
    }
}
