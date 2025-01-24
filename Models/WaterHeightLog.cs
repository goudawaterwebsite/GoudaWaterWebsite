using System;
using System.ComponentModel.DataAnnotations;

namespace GoudaWater.Models
{
    public class WaterHeightLog
    {
        [Key]
        public int Id { get; set; }
        public int DeviceId { get; set; }
        public decimal? WaterHeight { get; set; }
        public DateTime Timestamp { get; set; }
    }
}
