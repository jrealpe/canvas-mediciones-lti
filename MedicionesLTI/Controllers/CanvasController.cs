using MedicionesLTI.Models;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Configuration;
using Newtonsoft.Json;
using Newtonsoft.Json.Linq;
using System;
using System.Net;
using System.Net.Http;
using System.Net.Http.Headers;
using System.Threading.Tasks;

namespace MedicionesLTI.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class CanvasController : ControllerBase
    {
        protected readonly IConfiguration _configuration;

        public CanvasController(IConfiguration configuration)
        {
            _configuration = configuration;
        }

        [HttpGet]
        [Route("curso/{course_id}")]
        public async Task<ActionResult<Course>> GetCourse(string course_id)
        {
            try
            {
                using (var cliente = new HttpClient())
                {
                    //cliente.BaseAddress = new Uri("https://testcanvas.espol.edu.ec/api/v1/courses/" + id);
                    cliente.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", _configuration["token_canvas"]);

                    //string url = string.Empty;
                    //url = string.Format("{0}", id);
                    string url = "https://testcanvas.espol.edu.ec/api/v1/courses/" + course_id;

                    var rptCurso = await cliente.GetAsync(url);

                    if (rptCurso.StatusCode != HttpStatusCode.OK)
                    {
                        return BadRequest();
                    }

                    var contenidoCurso = await rptCurso.Content.ReadAsStringAsync();
                    dynamic jsonCurso = JsonConvert.DeserializeObject(contenidoCurso);

                    return new Course
                    {
                        Id = jsonCurso.id,
                        Name = jsonCurso.name,
                        CourseCode = jsonCurso.course_code,
                        SisCourseId = jsonCurso.sis_course_id
                    };
                }
            }
            catch (Exception ex)
            {
                return BadRequest();
            }
        }
    }
}
