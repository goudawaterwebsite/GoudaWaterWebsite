using Microsoft.AspNetCore.Mvc;
using GoudaWater.Data;
using GoudaWater.Models;
using Microsoft.EntityFrameworkCore;
using Newtonsoft.Json.Linq;

namespace GoudaWater.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class DevicesController : ControllerBase
    {
        private readonly ApplicationDbContext _context;
        private readonly IHttpClientFactory _clientFactory;

        public DevicesController(ApplicationDbContext context, IHttpClientFactory clientFactory)
        {
            _context = context;
            _clientFactory = clientFactory;
        }

        private async Task<List<DeviceDto>> GetDevices<T>() where T : Device
        {
            var devices = await _context.Device.OfType<T>()
                .Include(d => d.Adres)
                .Select(d => new DeviceDto
                {
                    ID = d.ID,
                    DeviceType = typeof(T).Name,
                    Naam = d.Naam,
                    AdresID = d.AdresID,
                    APIID = d.APIID,
                    Straatnaam = d.Adres.Straatnaam,
                    Huisnummer = d.Adres.Huisnummer.HasValue ? d.Adres.Huisnummer.Value.ToString() : null,
                    Postcode = d.Adres.Postcode,
                    Woonplaats = d.Adres.Woonplaats,
                    X = d.Adres.X,
                    Y = d.Adres.Y
                })
                .ToListAsync();

            if (typeof(T) == typeof(PLC))
            {
                foreach (var device in devices)
                {
                    var latestLog = await _context.WaterHeightLogs
                        .Where(log => log.DeviceId == device.ID)
                        .OrderByDescending(log => log.Timestamp)
                        .FirstOrDefaultAsync();

                    if (latestLog != null)
                    {
                        device.LatestWaterHeight = latestLog.WaterHeight;
                        device.LatestTimestamp = latestLog.Timestamp;
                    }
                }
            }

            return devices;
        }

        [HttpGet("all")]
        public async Task<IActionResult> GetAllDevices()
        {
            var allDevices = (await GetDevices<WaterSensor>())
                .Concat(await GetDevices<Pomp>())
                .Concat(await GetDevices<Waterklep>())
                .Concat(await GetDevices<WaterBasin>())
                .Concat(await GetDevices<Weerstation>())
                .Concat(await GetDevices<PLC>())
                .ToList();

            return Ok(allDevices);
        }

        [HttpPost("create")]
        public async Task<IActionResult> CreateDevice([FromBody] DeviceDto deviceDto)
        {
            if (deviceDto == null) return BadRequest("Devicegegevens zijn vereist.");

            if (deviceDto.X < -9999.999999m || deviceDto.X > 9999.999999m || deviceDto.Y < -9999.999999m || deviceDto.Y > 9999.999999m)
                return BadRequest("Coördinaten X of Y zijn buiten bereik.");

            var newAdres = new Adres
            {
                Straatnaam = string.IsNullOrEmpty(deviceDto.Straatnaam) ? null : deviceDto.Straatnaam,
                Huisnummer = string.IsNullOrEmpty(deviceDto.Huisnummer) ? (int?)null : int.Parse(deviceDto.Huisnummer),
                Postcode = string.IsNullOrEmpty(deviceDto.Postcode) ? null : deviceDto.Postcode,
                Woonplaats = string.IsNullOrEmpty(deviceDto.Woonplaats) ? null : deviceDto.Woonplaats,
                X = deviceDto.X,
                Y = deviceDto.Y
            };

            _context.Adres.Add(newAdres);
            await _context.SaveChangesAsync();

            var device = DeviceFactory.CreateDevice(deviceDto.DeviceType, deviceDto, newAdres.ID);

            if (device is WaterSensor waterSensor)
            {
                if (deviceDto.SensorType == "Custom" && !string.IsNullOrEmpty(deviceDto.ApiUrl))
                {
                    var api = new API { Url = deviceDto.ApiUrl };
                    _context.API.Add(api);
                    await _context.SaveChangesAsync();
                    waterSensor.APIID = api.ID;
                }
                else if (deviceDto.SensorType?.ToLower() == "acaciadata" && !string.IsNullOrEmpty(deviceDto.TubeName))
                {
                    var client = _clientFactory.CreateClient();
                    var response = await client.GetStringAsync($"https://gouda.acaciadata.com/api/v1/wells/?search={deviceDto.TubeName}");
                    var result = JObject.Parse(response)["results"]?.FirstOrDefault();

                    if (result != null)
                    {
                        waterSensor.TubeNumber = result["id"]?.ToString();
                        waterSensor.TubeName = result["name"]?.ToString();
                    }
                    else return BadRequest("Geen bijpassende tube gevonden in Acaciadata.");
                }
            }

            if (device is PLC plc && !string.IsNullOrEmpty(deviceDto.ApiUrl))
            {
                var api = new API { Url = deviceDto.ApiUrl };
                _context.API.Add(api);
                await _context.SaveChangesAsync();
                plc.APIID = api.ID;
            }

            _context.Device.Add(device);
            await _context.SaveChangesAsync();

            return Ok(device);
        }

        private async Task<IActionResult> EditDeviceGeneric<T>(int id, DeviceDto deviceDto) where T : Device
        {
            var device = await _context.Device.OfType<T>()
                .Include(d => d.Adres)
                .FirstOrDefaultAsync(d => d.ID == id);
            if (device == null) return NotFound("Apparaat niet gevonden.");

            device.Naam = deviceDto.Naam;
            device.Adres.Straatnaam = deviceDto.Straatnaam;
            device.Adres.Huisnummer = string.IsNullOrWhiteSpace(deviceDto.Huisnummer) ? (int?)null : int.Parse(deviceDto.Huisnummer);
            device.Adres.Postcode = deviceDto.Postcode;
            device.Adres.Woonplaats = deviceDto.Woonplaats;
            device.Adres.X = deviceDto.X;
            device.Adres.Y = deviceDto.Y;
            device.APIID = deviceDto.APIID;

            _context.Update(device);
            await _context.SaveChangesAsync();

            return Ok(device);
        }

        [HttpPut("{id}")]
        public async Task<IActionResult> EditDevice(int id, [FromBody] DeviceDto deviceDto)
        {
            if (deviceDto == null) return BadRequest("Devicegegevens zijn vereist.");

            return deviceDto.DeviceType switch
            {
                "WaterSensor" => await EditDeviceGeneric<WaterSensor>(id, deviceDto),
                "Pomp" => await EditDeviceGeneric<Pomp>(id, deviceDto),
                "Waterklep" => await EditDeviceGeneric<Waterklep>(id, deviceDto),
                "WaterBasin" => await EditDeviceGeneric<WaterBasin>(id, deviceDto),
                "Weerstation" => await EditDeviceGeneric<Weerstation>(id, deviceDto),
                "PLC" => await EditDeviceGeneric<PLC>(id, deviceDto),
                _ => BadRequest("Ongeldig apparaat type.")
            };
        }

        [HttpDelete("delete/{id}")]
        public async Task<IActionResult> DeleteDevice(int id, [FromQuery] string deviceType)
        {
            if (string.IsNullOrEmpty(deviceType)) return BadRequest("Apparaattype is vereist.");

            Device device = deviceType switch
            {
                "WaterSensor" => await _context.Device.OfType<WaterSensor>().Include(d => d.Adres).FirstOrDefaultAsync(d => d.ID == id),
                "Pomp" => await _context.Device.OfType<Pomp>().Include(d => d.Adres).FirstOrDefaultAsync(d => d.ID == id),
                "Waterklep" => await _context.Device.OfType<Waterklep>().Include(d => d.Adres).FirstOrDefaultAsync(d => d.ID == id),
                "WaterBasin" => await _context.Device.OfType<WaterBasin>().Include(d => d.Adres).FirstOrDefaultAsync(d => d.ID == id),
                "Weerstation" => await _context.Device.OfType<Weerstation>().Include(d => d.Adres).FirstOrDefaultAsync(d => d.ID == id),
                "PLC" => await _context.Device.OfType<PLC>().Include(d => d.Adres).FirstOrDefaultAsync(d => d.ID == id),
                _ => null
            };

            if (device == null) return NotFound("Apparaat niet gevonden.");

            _context.Adres.Remove(device.Adres);
            _context.Device.Remove(device);
            await _context.SaveChangesAsync();

            return Ok("Apparaat en bijbehorend adres zijn verwijderd.");
        }
    }
}
