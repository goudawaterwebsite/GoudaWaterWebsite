using Microsoft.EntityFrameworkCore;
using GoudaWater.Models;

namespace GoudaWater.Data
{
    public class ApplicationDbContext : DbContext
    {
        public ApplicationDbContext(DbContextOptions<ApplicationDbContext> options)
            : base(options) { }

        public DbSet<API> API { get; set; }
        public DbSet<Adres> Adres { get; set; }
        public DbSet<Device> Device { get; set; }
        public DbSet<WeerGeschiedenis> WeerGeschiedenis { get; set; }
        public DbSet<Waterpeil> Waterpeil { get; set; }
        public DbSet<WaterHeightLog> WaterHeightLogs { get; set; }
        public DbSet<User> Users { get; set; }

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);
            modelBuilder.Entity<WaterSensor>();
            modelBuilder.Entity<Pomp>();
            modelBuilder.Entity<Waterklep>();
            modelBuilder.Entity<WaterBasin>();
            modelBuilder.Entity<Weerstation>();
            modelBuilder.Entity<PLC>();

            modelBuilder.Entity<Device>().HasDiscriminator<string>("Discriminator")
                .HasValue<WaterSensor>("WaterSensor")
                .HasValue<Pomp>("Pomp")
                .HasValue<Waterklep>("Waterklep")
                .HasValue<WaterBasin>("WaterBasin")
                .HasValue<Weerstation>("Weerstation")
                .HasValue<PLC>("PLC");
        }
    }
}
