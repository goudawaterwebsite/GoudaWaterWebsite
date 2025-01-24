using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace GoudaWater.Models
{
    public class Waterpeil
    {
        [Key]
        public int ID { get; set; }
        public double NAP { get; set; }
        public DateTime Tijdstip { get; set; }

        public int WaterSensorID { get; set; }
        [ForeignKey("WaterSensorID")]
        public Device WaterSensor { get; set; }
    }
}
