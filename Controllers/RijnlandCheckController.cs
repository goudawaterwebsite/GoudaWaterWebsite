using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Caching.Memory;
using Newtonsoft.Json.Linq;
using System;
using System.Net.Http;
using System.Text.RegularExpressions;
using System.Threading.Tasks;
using GoudaWater.Services; 
using Microsoft.Extensions.Logging;

namespace GoudaWater.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
public class RijnlandCheckController : ControllerBase
{
    private readonly IWaterDataService _waterDataService;
    private readonly IDeviceToggleService _deviceToggleService;
    private readonly ILogger<RijnlandCheckController> _logger;
    private static bool? _lastAllowedState = null;
    private const int BoezemDeviceId = 123;

    public RijnlandCheckController(IWaterDataService waterDataService, IDeviceToggleService deviceToggleService, ILogger<RijnlandCheckController> logger)
    {
        _waterDataService = waterDataService;
        _deviceToggleService = deviceToggleService;
        _logger = logger;
    }

    [HttpGet("check")]
    public async Task<IActionResult> CheckConditions()
    {
        var lastWaterpeilValue = await _waterDataService.GetLatestWaterpeilValueAsync();
        if (lastWaterpeilValue == null)
        {
            return StatusCode(500, "Kon de laatste waterpeil waarde niet bepalen.");
        }

        var lastChlorideValue = await _waterDataService.GetLatestChlorideValueAsync();
        if (lastChlorideValue == null)
        {
            return StatusCode(500, "Kon de laatste chloride waarde niet bepalen.");
        }

        bool allowed = (lastWaterpeilValue > -0.75) && (lastChlorideValue < 250);

        if (_lastAllowedState.HasValue && _lastAllowedState.Value != allowed)
        {
            _logger.LogInformation($"Toestemming veranderd van {_lastAllowedState.Value} naar {allowed}. Verstuur naar PLC...");
            var success = await _deviceToggleService.SendToestemmingBoezemAsync(BoezemDeviceId, allowed);
            if (!success)
            {
                _logger.LogWarning("Het versturen van de nieuwe boezemtoestemming naar de PLC is mislukt.");
            }
        }

        _lastAllowedState = allowed;

        return Ok(new
        {
            Allowed = allowed,
            Waterpeil = lastWaterpeilValue,
            Chloride = lastChlorideValue
        });
    }
}
}