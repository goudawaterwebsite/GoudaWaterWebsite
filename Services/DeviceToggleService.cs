using System;
using System.Net.Http;
using System.Text;
using System.Text.Json;
using System.Threading.Tasks;
using GoudaWater.Data;
using GoudaWater.Models;
using Microsoft.EntityFrameworkCore;

namespace GoudaWater.Services
{
    public class DeviceToggleService : IDeviceToggleService
    {
        private readonly ApplicationDbContext _context;
        private readonly IHttpClientFactory _httpClientFactory;

        private const string PlcApiBaseUrl = "https://waterplc.azurewebsites.net/api/plc";

        public DeviceToggleService(ApplicationDbContext context, IHttpClientFactory httpClientFactory)
        {
            _context = context;
            _httpClientFactory = httpClientFactory;
        }

        public async Task ToggleDeviceAsync(int deviceId, string action)
        {
            throw new NotImplementedException("Toggle device functionality not implemented using the new PLC API.");
        }

        public async Task<bool> SendWaterHeightChangeAsync(int deviceId, decimal waterHeight)
        {
            return await SendPutRequestAsync(1, waterHeight);
        }

        public async Task LogWaterHeightChangeAsync(int deviceId, decimal waterHeight)
        {
            var logEntry = new WaterHeightLog
            {
                DeviceId = deviceId,
                WaterHeight = waterHeight,
                Timestamp = DateTime.UtcNow
            };

            await _context.WaterHeightLogs.AddAsync(logEntry);
            await _context.SaveChangesAsync();
        }

        public async Task<bool> SendWaterHeightBasinAsync(int deviceId, decimal waterHeight)
        {
            return await SendPutRequestAsync(2, waterHeight);
        }

        public async Task<bool> SendToestemmingBoezemAsync(int deviceId, bool toestemming)
        {
            var waarde = toestemming ? 1 : 0;
            return await SendPutRequestAsync(3, waarde);
        }

        public async Task<bool> SendNoodStopAsync(int deviceId, bool noodStop)
        {
            var waarde = noodStop ? 1 : 0;
            return await SendPutRequestAsync(4, waarde);
        }

        private async Task<bool> SendPutRequestAsync(int plcId, object waarde)
        {
            var client = _httpClientFactory.CreateClient();
            var payload = new { waarde = waarde };

            var content = new StringContent(JsonSerializer.Serialize(payload), Encoding.UTF8, "application/json");

            var url = $"{PlcApiBaseUrl}/{plcId}";
            var response = await client.PutAsync(url, content);

            return response.IsSuccessStatusCode;
        }
    }
}
