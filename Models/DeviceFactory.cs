using System;

namespace GoudaWater.Models
{
    public static class DeviceFactory
    {
        public static Device CreateDevice(string deviceType, DeviceDto deviceDto, int adresId)
        {
            Device device = deviceType switch
            {
                "WaterSensor" => new WaterSensor
                {
                    OldID = deviceDto.OldID,
                    TubeNumber = deviceDto.TubeNumber,
                    SensorType = deviceDto.SensorType
                },
                "Pomp" => new Pomp(),
                "Waterklep" => new Waterklep(),
                "WaterBasin" => new WaterBasin(),
                "Weerstation" => new Weerstation(),
                "PLC" => new PLC { WaterHeight = deviceDto.WaterHeight ?? 0 }, 
                _ => throw new ArgumentException("Unknown device type", nameof(deviceType))
            };

            device.AdresID = adresId;
            device.APIID = deviceDto.APIID;
            device.Naam = deviceDto.Naam;

            if (deviceType == "WaterSensor" && deviceDto.SensorType == "Custom" && deviceDto.ApiUrl != null)
            {
                device.API = new API
                {
                    Url = deviceDto.ApiUrl
                };
            }

            return device;
        }
    }
}
