using System;
using System.ComponentModel.DataAnnotations;

namespace GoudaWater.Models 
{
public class DeviceDto
{
    public int ID { get; set; }
    public string DeviceType { get; set; }
    public string Naam { get; set; }

    public int? AdresID { get; set; }
    public int? APIID { get; set; }

    public string? Straatnaam { get; set; }
    public string? Huisnummer { get; set; }
    public string? Postcode { get; set; }
    public string? Woonplaats { get; set; }
    public decimal? X { get; set; }
    public decimal? Y { get; set; }

    public int? OldID { get; set; }
    
    public string? TubeName { get; set; } 
    
    public string? TubeNumber { get; set; }
    public string? ApiUrl { get; set; }
    public string SensorType { get; set; }

    public decimal? WaterHeight { get; set; }
    public decimal? LatestWaterHeight { get; set; }
    public DateTime? LatestTimestamp { get; set; }
}


}
