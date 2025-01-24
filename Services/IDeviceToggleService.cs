using System.Threading.Tasks;

namespace GoudaWater.Services
{
    public interface IDeviceToggleService
    {
        Task ToggleDeviceAsync(int deviceId, string action); 
        Task<bool> SendWaterHeightChangeAsync(int deviceId, decimal waterHeight);
        Task LogWaterHeightChangeAsync(int deviceId, decimal waterHeight);

        Task<bool> SendWaterHeightBasinAsync(int deviceId, decimal waterHeight);
        Task<bool> SendToestemmingBoezemAsync(int deviceId, bool toestemming);
        Task<bool> SendNoodStopAsync(int deviceId, bool noodStop);
    }
}
