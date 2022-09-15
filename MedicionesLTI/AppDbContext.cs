using MedicionesLTI.Models;
using Microsoft.EntityFrameworkCore;

namespace MedicionesLTI
{
    public class AppDbContext : DbContext
    {
        public AppDbContext(DbContextOptions options) : base(options)
        {
        }

        public DbSet<Observation> Observations { get; set; }
    }
}