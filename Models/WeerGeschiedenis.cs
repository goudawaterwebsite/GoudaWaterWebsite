using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace GoudaWater.Models
{
    public class WeerGeschiedenis
    {
        [Key]
        public int ID { get; set; }
        public double MaxTemp { get; set; }
        public double MinTemp { get; set; }
        public double TotaalDaglicht { get; set; }
        public double TotaalZonlicht { get; set; }
        public double TotaalRegen { get; set; }
        public DateTime Datum { get; set; }

        public int WeerStationID { get; set; }

        [ForeignKey("WeerStationID")]
        public Device? WeerStation { get; set; }
    }
}
