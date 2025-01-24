using Microsoft.AspNetCore.Mvc;
using GoudaWater.Data;
using GoudaWater.Models;
using Microsoft.EntityFrameworkCore;

namespace GoudaWater.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class APIController : ControllerBase
    {
        private readonly ApplicationDbContext _context;

        public APIController(ApplicationDbContext context)
        {
            _context = context;
        }

        [HttpGet]
        public async Task<IActionResult> GetAllAPIs()
        {
            var apis = await _context.API.ToListAsync();
            return Ok(apis);
        }

        [HttpGet("{id}")]
        public async Task<IActionResult> GetAPI(int id)
        {
            var api = await _context.API.FindAsync(id);
            if (api == null)
            {
                return NotFound();
            }

            return Ok(api);
        }

        [HttpPost("create")]
        public async Task<IActionResult> CreateAPI([FromBody] API newApi)
        {
            if (string.IsNullOrEmpty(newApi.Url))
            {
                return BadRequest("API Url is verplicht.");
            }

            _context.API.Add(newApi);
            await _context.SaveChangesAsync();

            return CreatedAtAction(nameof(GetAPI), new { id = newApi.ID }, newApi);
        }

        [HttpPut("edit/{id}")]
        public async Task<IActionResult> EditAPI(int id, [FromBody] API updatedApi)
        {
            var api = await _context.API.FindAsync(id);
            if (api == null)
            {
                return NotFound();
            }

            if (string.IsNullOrEmpty(updatedApi.Url))
            {
                return BadRequest("API Url is verplicht.");
            }

            api.Url = updatedApi.Url;
            _context.API.Update(api);
            await _context.SaveChangesAsync();

            return Ok(api);
        }

        [HttpDelete("delete/{id}")]
        public async Task<IActionResult> DeleteAPI(int id)
        {
            var api = await _context.API.FindAsync(id);
            if (api == null)
            {
                return NotFound();
            }

            _context.API.Remove(api);
            await _context.SaveChangesAsync();

            return Ok();
        }
    }
}
