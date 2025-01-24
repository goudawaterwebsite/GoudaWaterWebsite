namespace GoudaWater.Models
{
    public class ToggleDeviceDTO
    {
        public int DeviceId { get; set; }
        public decimal? WaterHeight { get; set; }
        public string? Action { get; set; }

        public decimal? WaterHeightBasin { get; set; }
        public bool? ToestemmingBoezem { get; set; }
        public bool? NoodStop { get; set; }
    }
}
