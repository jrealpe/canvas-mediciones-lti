using System;
using System.Threading.Tasks;
using MedicionesLTI.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace MedicionesLTI.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class OutcomesController
    {
        private readonly AppDbContext _db;

        public OutcomesController(AppDbContext db)
        {
            _db = db;
        }

        [HttpGet]
        [Route("{outcome_id}/observation/")]
        public async Task<IActionResult> Get(int outcome_id)
        {
            var observation = await _db.Observations.FirstOrDefaultAsync(o => o.OutcomeId == outcome_id);

            return new JsonResult(observation);
        }

        [HttpPost]
        [Route("observation")]
        public async Task<IActionResult> Post(Observation observation)
        {
            var success = false;
            var existingObservation = await _db.Observations.FirstOrDefaultAsync(o => o.OutcomeId == observation.OutcomeId);
            if (existingObservation != null)
            {
                existingObservation.Row = observation.Row;
                success = (await _db.SaveChangesAsync()) > 0;
            }
            else {
                _db.Observations.Add(observation);
                success = (await _db.SaveChangesAsync()) > 0;
            }

            return new JsonResult(success);
        }
    }
}

