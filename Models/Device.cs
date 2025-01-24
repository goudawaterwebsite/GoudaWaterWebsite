using System.ComponentModel.DataAnnotations;

namespace GoudaWater.Models
{
    public abstract class Device
    {
        [Key]
        public int ID { get; set; }
        public int AdresID { get; set; }
        public string Naam { get; set; }
        public int? APIID { get; set; }

        public Adres? Adres { get; set; }
        public API? API { get; set; }
    }

    public class WaterSensor : Device
    {
        public int? OldID { get; set; }
        public string? TubeName { get; set; }
        public string? TubeNumber { get; set; }

        [Required]
        public string SensorType { get; set; }
    }

    public class Pomp : Device
    {
    }

    public class Waterklep : Device
    {
    }

    public class WaterBasin : Device
    {
    }

    public class Weerstation : Device
    {
    }

    public class PLC : Device
    {
        public decimal? WaterHeight { get; set; }
        public string IoTHubDeviceId { get; set; }
    }
}
