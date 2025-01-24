using Microsoft.AspNetCore.Mvc;
using GoudaWater.Models;
using GoudaWater.Data;
using Microsoft.EntityFrameworkCore;
using GoudaWater.Services;
using System.Threading.Tasks;

namespace GoudaWater.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class ToggleDeviceController : ControllerBase
    {
        private readonly ApplicationDbContext _context;
        private readonly IDeviceToggleService _deviceToggleService;

        public ToggleDeviceController(ApplicationDbContext context, IDeviceToggleService deviceToggleService)
        {
            _context = context;
            _deviceToggleService = deviceToggleService;
        }

        [HttpPost("toggle")]
        public async Task<IActionResult> ToggleDevice([FromBody] ToggleDeviceDTO toggleDto)
        {
            if (toggleDto == null || string.IsNullOrEmpty(toggleDto.Action))
                return BadRequest("Ongeldige schakelverzoek voor apparaat");

            try
            {
                await _deviceToggleService.ToggleDeviceAsync(toggleDto.DeviceId, toggleDto.Action);
                return Ok($"Apparaat {toggleDto.DeviceId} {toggleDto.Action} succesvol");
            }
            catch (System.Exception ex)
            {
                return StatusCode(500, $"Fout bij het schakelen van apparaat {toggleDto.DeviceId}: {ex.Message}");
            }
        }

        [HttpPost("setWaterHeight")]
        public async Task<IActionResult> SetWaterHeight([FromBody] ToggleDeviceDTO toggleDto)
        {
            if (toggleDto == null || toggleDto.WaterHeight == null)
                return BadRequest("Ongeldig verzoek voor het instellen van waterhoogte.");

            await _deviceToggleService.LogWaterHeightChangeAsync(toggleDto.DeviceId, toggleDto.WaterHeight.Value);

            var device = await _context.Device.OfType<PLC>()
                .FirstOrDefaultAsync(d => d.ID == toggleDto.DeviceId);

            if (device == null)
                return BadRequest("Geen PLC apparaat gevonden met deze ID.");

            var result = await _deviceToggleService.SendWaterHeightChangeAsync(toggleDto.DeviceId, toggleDto.WaterHeight.Value);

            return result
                ? Ok($"Waterhoogte ingesteld voor apparaat {toggleDto.DeviceId}")
                : StatusCode(500, "Fout bij het instellen van waterhoogte.");
        }

        [HttpPost("setWaterHeightBasin")]
        public async Task<IActionResult> SetWaterHeightBasin([FromBody] ToggleDeviceDTO toggleDto)
        {
            if (toggleDto == null || toggleDto.WaterHeightBasin == null)
                return BadRequest("Ongeldig verzoek voor het instellen van waterhoogte van het bassin.");

            var device = await _context.Device.OfType<PLC>()
                .FirstOrDefaultAsync(d => d.ID == toggleDto.DeviceId);

            if (device == null)
                return BadRequest("Geen PLC apparaat gevonden met deze ID.");

            var result = await _deviceToggleService.SendWaterHeightBasinAsync(toggleDto.DeviceId, toggleDto.WaterHeightBasin.Value);

            return result
                ? Ok($"Waterhoogte voor bassin ingesteld voor apparaat {toggleDto.DeviceId}")
                : StatusCode(500, "Fout bij het instellen van de waterhoogte voor het bassin.");
        }

        [HttpPost("toestemmingBoezem")]
        public async Task<IActionResult> SetToestemmingBoezem([FromBody] ToggleDeviceDTO toggleDto)
        {
            if (toggleDto == null || toggleDto.ToestemmingBoezem == null)
                return BadRequest("Ongeldig verzoek voor het instellen van toestemming boezem.");

            var device = await _context.Device.OfType<PLC>()
                .FirstOrDefaultAsync(d => d.ID == toggleDto.DeviceId);

            if (device == null)
                return BadRequest("Geen PLC apparaat gevonden met deze ID.");

            var result = await _deviceToggleService.SendToestemmingBoezemAsync(toggleDto.DeviceId, toggleDto.ToestemmingBoezem.Value);

            return result
                ? Ok($"Toestemming boezem ingesteld op {toggleDto.ToestemmingBoezem} voor apparaat {toggleDto.DeviceId}")
                : StatusCode(500, "Fout bij het instellen van toestemming boezem.");
        }

        [HttpPost("noodStop")]
        public async Task<IActionResult> SetNoodStop([FromBody] ToggleDeviceDTO toggleDto)
        {
            if (toggleDto == null || toggleDto.NoodStop == null)
                return BadRequest("Ongeldig verzoek voor het instellen van noodstop.");

            var device = await _context.Device.OfType<PLC>()
                .FirstOrDefaultAsync(d => d.ID == toggleDto.DeviceId);

            if (device == null)
                return BadRequest("Geen PLC apparaat gevonden met deze ID.");

            var result = await _deviceToggleService.SendNoodStopAsync(toggleDto.DeviceId, toggleDto.NoodStop.Value);

            return result
                ? Ok($"Noodstop ingesteld op {toggleDto.NoodStop} voor apparaat {toggleDto.DeviceId}")
                : StatusCode(500, "Fout bij het instellen van noodstop.");
        }
    }
}
