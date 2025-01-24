using Microsoft.AspNetCore.Mvc;
using GoudaWater.Data;
using GoudaWater.Models;
using Microsoft.EntityFrameworkCore;
using Newtonsoft.Json.Linq;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace GoudaWater.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class WaterpeilController : ControllerBase
    {
        private readonly ApplicationDbContext _context;
        private readonly IHttpClientFactory _clientFactory;

        public WaterpeilController(ApplicationDbContext context, IHttpClientFactory clientFactory)
        {
            _context = context;
            _clientFactory = clientFactory;
        }

        [HttpGet("getWaterpeilByTube/{tubeNumber}")]
        public async Task<IActionResult> GetWaterpeilByTube(
            string tubeNumber,
            [FromQuery] DateTime? startDate,
            [FromQuery] DateTime? endDate)
        {

            var waterSensor = await _context.Device.OfType<WaterSensor>()
                .FirstOrDefaultAsync(ws => ws.TubeNumber == tubeNumber);

            if (waterSensor == null)
            {
                return NotFound($"Geen water sensor gevonden met tube nummer: {tubeNumber}");
            }
            startDate ??= DateTime.UtcNow.AddMonths(-3).Date;
            endDate ??= DateTime.UtcNow.Date;

            var existingData = await _context.Waterpeil
                .Where(wp => wp.WaterSensorID == waterSensor.ID && wp.Tijdstip >= startDate && wp.Tijdstip <= endDate)
                .Select(wp => wp.Tijdstip.Date)
                .ToListAsync();

            var missingDates = Enumerable.Range(0, (endDate.Value - startDate.Value).Days + 1)
                                         .Select(d => startDate.Value.AddDays(d))
                                         .Where(d => !existingData.Contains(d))
                                         .ToList();

            if (missingDates.Any())
            {
                var apiUrl = $"https://gouda.acaciadata.com/tube/{tubeNumber}/level?reference=NAP&resample=D";

                try
                {
                    var client = _clientFactory.CreateClient();
                    var response = await client.GetStringAsync(apiUrl);
                    var jsonData = JObject.Parse(response);

                    var series = jsonData["series"];
                    if (series == null)
                    {
                        return StatusCode(500, "Fout bij het ophalen van de waterpeil data: geen series gevonden.");
                    }

                    var dataPoints = series["data"].ToObject<double?[]>();
                    var pointStart = series["pointStart"].ToObject<long>();
                    var pointInterval = series["pointInterval"].ToObject<long>();

                    var apiStartDate = DateTimeOffset.FromUnixTimeMilliseconds(pointStart).UtcDateTime;

                    var newWaterpeils = new List<Waterpeil>();
                    for (int i = 0; i < dataPoints.Length; i++)
                    {
                        var datum = apiStartDate.AddMilliseconds(i * pointInterval);
                        var napValue = dataPoints[i];
                        if (datum >= startDate && datum <= endDate && napValue.HasValue && missingDates.Contains(datum.Date))
                        {
                            newWaterpeils.Add(new Waterpeil
                            {
                                WaterSensorID = waterSensor.ID,
                                NAP = napValue.Value,
                                Tijdstip = datum
                            });
                        }
                    }

                    if (newWaterpeils.Any())
                    {
                        _context.Waterpeil.AddRange(newWaterpeils);
                        await _context.SaveChangesAsync();
                    }
                }
                catch (Exception ex)
                {
                    return StatusCode(500, $"Fout bij het ophalen van de waterpeil data: {ex.Message}");
                }
            }

            var resultData = await _context.Waterpeil
                .Where(wp => wp.WaterSensorID == waterSensor.ID && wp.Tijdstip >= startDate && wp.Tijdstip <= endDate)
                .Select(wp => new { Datum = wp.Tijdstip.ToString("yyyy-MM-dd"), Waterpeil = wp.NAP })
                .ToListAsync();

            return Ok(resultData);
        }

        [HttpGet("getTubes")]
        public async Task<IActionResult> GetTubes()
        {
            var tubes = await _context.Device.OfType<WaterSensor>()
                .Select(ws => new 
                {
                    ws.TubeName,
                    ws.TubeNumber
                })
                .ToListAsync();

            return Ok(tubes);
        }

        [HttpGet("predictWaterpeilWeek/{tubeNumber}")]
        public async Task<IActionResult> PredictWaterpeilWeek(string tubeNumber)
        {
            var waterSensor = await _context.Device.OfType<WaterSensor>()
                .FirstOrDefaultAsync(ws => ws.TubeNumber == tubeNumber);

            if (waterSensor == null)
            {
                return NotFound($"Geen water sensor gevonden met tube nummer: {tubeNumber}");
            }

            var endDate = DateTime.UtcNow;
            var startDate = endDate.AddDays(-90);

            var waterpeilData = await _context.Waterpeil
                .Where(wp => wp.WaterSensorID == waterSensor.ID
                          && wp.Tijdstip >= startDate
                          && wp.Tijdstip <= endDate)
                .OrderBy(wp => wp.Tijdstip)
                .ToListAsync();

            if (!waterpeilData.Any())
            {
                return BadRequest("Onvoldoende historische waterpeil-data om een voorspelling te maken.");
            }

            var weatherHistory = await _context.WeerGeschiedenis
                .Where(w => w.Datum >= startDate.Date && w.Datum <= endDate.Date)
                .OrderBy(w => w.Datum)
                .ToListAsync();

            if (!weatherHistory.Any())
            {
                return BadRequest("Onvoldoende historische weersdata om voorspelling te maken.");
            }

            var trainingList = new List<(double precipitation, double waterpeil)>();
            foreach (var wp in waterpeilData)
            {
                var sameDayWeather = weatherHistory
                    .FirstOrDefault(w => w.Datum.Date == wp.Tijdstip.Date);

                if (sameDayWeather != null)
                {
                    trainingList.Add((sameDayWeather.TotaalRegen, wp.NAP));
                }
            }

            if (trainingList.Count < 2)
            {
                return BadRequest("Onvoldoende gekoppelde data (waterpeil + neerslag) om te trainen.");
            }

            var predictor = new SimpleWaterLevelPredictor();
            predictor.Train(trainingList);

            var forecastPrecipitations = await GetNext7DaysPrecipitation();

            var predictions = new List<object>();
            var startPredictDate = DateTime.UtcNow.Date.AddDays(1);

            for (int i = 0; i < 7; i++)
            {
                var date = startPredictDate.AddDays(i);
                var predictedRain = forecastPrecipitations.ContainsKey(date)
                    ? forecastPrecipitations[date]
                    : 0.0;

                double predictedLevel = predictor.Predict(predictedRain);

                predictions.Add(new
                {
                    Date = date.ToString("yyyy-MM-dd"),
                    PredictedRain = predictedRain,
                    PredictedWaterpeil = predictedLevel
                });
            }

            return Ok(predictions);
        }

        private async Task<Dictionary<DateTime, double>> GetNext7DaysPrecipitation()
        {
            var client = _clientFactory.CreateClient();

            var apiUrl = "https://api.open-meteo.com/v1/forecast?" +
                         "latitude=52.0167&longitude=4.7083&daily=precipitation_sum&forecast_days=7&timezone=Europe%2FAmsterdam";

            var response = await client.GetStringAsync(apiUrl);
            var json = JObject.Parse(response);

            var daily = json["daily"];
            if (daily == null)
                return new Dictionary<DateTime, double>();

            var dates = daily["time"]?.ToObject<List<string>>() ?? new List<string>();
            var precipitation = daily["precipitation_sum"]?.ToObject<List<double>>() ?? new List<double>();

            var result = new Dictionary<DateTime, double>();
            for (int i = 0; i < dates.Count; i++)
            {
                if (DateTime.TryParse(dates[i], out var parsedDate))
                {
                    result[parsedDate.Date] = precipitation[i];
                }
            }

            return result;
        }
    }

    public class SimpleWaterLevelPredictor
    {
        private double _intercept; 
        private double _coef;       
        private bool _isTrained = false;

        public void Train(List<(double precipitation, double waterpeil)> trainingData)
        {
            if (trainingData == null || trainingData.Count < 2)
                throw new ArgumentException("Onvoldoende trainingsdata");

            double avgRain = trainingData.Average(d => d.precipitation);
            double avgWater = trainingData.Average(d => d.waterpeil);

            double numerator = trainingData.Sum(d => (d.precipitation - avgRain) * (d.waterpeil - avgWater));
            double denominator = trainingData.Sum(d => Math.Pow(d.precipitation - avgRain, 2));

            if (denominator == 0)
            {
                _coef = 0;
            }
            else
            {
                _coef = numerator / denominator;
            }

            _intercept = avgWater - _coef * avgRain;

            _isTrained = true;
        }
        public double Predict(double predictedPrecipitation)
        {
            if (!_isTrained)
                throw new InvalidOperationException("Model is nog niet getraind.");

            return _intercept + _coef * predictedPrecipitation;
        }
    }
}
