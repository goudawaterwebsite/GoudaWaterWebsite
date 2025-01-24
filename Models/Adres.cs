using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace GoudaWater.Models
{
    [Table("Adres")]
    public class Adres
    {
        [Key]
        public int ID { get; set; }
        public string? Straatnaam { get; set; }
        public int? Huisnummer { get; set; }
        public string? Postcode { get; set; }
        public string? Woonplaats { get; set; }
        public decimal? X { get; set; }
        public decimal? Y { get; set; }
    }
}
