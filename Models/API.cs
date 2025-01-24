using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace GoudaWater.Models
{
    [Table("API")]
    public class API
    {
        [Key]
        public int ID { get; set; }

        [Required]
        public string Url { get; set; }
    }
}
