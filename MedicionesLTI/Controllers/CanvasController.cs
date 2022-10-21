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
using System.Text;
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

        /*[HttpGet]
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
        }*/


        [HttpGet]
        [Route("courses/{courseId}")]
        public async Task<ActionResult<string>> GetCourse(string courseId)
        {
            try
            {
                using (var cliente = new HttpClient())
                {
                    cliente.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", _configuration["canvas_token"]);

                    string url = _configuration["canvas_url"] + "/courses/" + courseId;
                    var response = await cliente.GetAsync(url);
                    if (response.StatusCode != HttpStatusCode.OK)
                    {
                        return BadRequest();
                    }
                    var contenidoCurso = await response.Content.ReadAsStringAsync();                    
                    return contenidoCurso;
                }
            }
            catch (Exception ex)
            {
                Console.WriteLine(ex);
                return BadRequest(ex);
            }
        }

        [HttpGet]
        [Route("courses/{courseId}/users/")]
        public async Task<ActionResult<string>> GetStudents(string courseId)
        {
            try
            {
                using (var cliente = new HttpClient())
                {
                    cliente.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", _configuration["canvas_token"]);

                    string url = _configuration["canvas_url"] + "/courses/" + courseId + "/users/?enrollment_type=student";
                    var response = await cliente.GetAsync(url);
                    if (response.StatusCode != HttpStatusCode.OK)
                    {
                        return BadRequest();
                    }
                    var contenidoCurso = await response.Content.ReadAsStringAsync();
                    return contenidoCurso;
                }
            }
            catch (Exception ex)
            {
                Console.WriteLine(ex);
                return BadRequest(ex);
            }
        }

        [HttpGet]
        [Route("courses/{courseId}/outcome_rollups/")]
        public async Task<ActionResult<string>> GetOutcomeRollups(string courseId)
        {
            try
            {
                using (var cliente = new HttpClient())
                {
                    cliente.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", _configuration["canvas_token"]);

                    string url = _configuration["canvas_url"] + "/courses/" + courseId + "/outcome_rollups/";
                    var response = await cliente.GetAsync(url);
                    if (response.StatusCode != HttpStatusCode.OK)
                    {
                        return BadRequest();
                    }
                    var contenidoCurso = await response.Content.ReadAsStringAsync();
                    return contenidoCurso;
                }
            }
            catch (Exception ex)
            {
                Console.WriteLine(ex);
                return BadRequest(ex);
            }
        }

        [HttpGet]
        [Route("courses/{courseId}/outcome_groups/")]
        public async Task<ActionResult<string>> GetAssignedOutcomeGroups(string courseId)
        {
            try
            {
                using (var cliente = new HttpClient())
                {
                    cliente.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", _configuration["canvas_token"]);

                    string url = _configuration["canvas_url"] + "/courses/" + courseId + "/outcome_groups/?outcome_style=full";
                    var response = await cliente.GetAsync(url);
                    if (response.StatusCode != HttpStatusCode.OK)
                    {
                        return BadRequest();
                    }
                    var contenidoCurso = await response.Content.ReadAsStringAsync();
                    return contenidoCurso;
                }
            }
            catch (Exception ex)
            {
                Console.WriteLine(ex);
                return BadRequest(ex);
            }
        }

        [HttpGet]
        [Route("courses/{courseId}/outcome_groups/{outcomeGroupId}/outcomes/")]
        public async Task<ActionResult<string>> GetOutcomes(string courseId, string outcomeGroupId)
        {
            try
            {
                using (var cliente = new HttpClient())
                {
                    cliente.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", _configuration["canvas_token"]);

                    string url = _configuration["canvas_url"] + "/courses/" + courseId + "/outcome_groups/" + outcomeGroupId + "/outcomes/?outcome_style=full";
                    var response = await cliente.GetAsync(url);
                    if (response.StatusCode != HttpStatusCode.OK)
                    {
                        return BadRequest();
                    }
                    var contenidoCurso = await response.Content.ReadAsStringAsync();
                    return contenidoCurso;
                }
            }
            catch (Exception ex)
            {
                Console.WriteLine(ex);
                return BadRequest(ex);
            }
        }

        [HttpPost]
        [Route("courses/{courseId}/outcome_groups/{outcomeGroupId}/subgroups/")]
        public async Task<ActionResult<string>> PostSubgroups(string courseId, string outcomeGroupId, Group group)
        {
            try
            {
                using (var cliente = new HttpClient())
                {
                    cliente.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", _configuration["canvas_token"]);

                    string url = _configuration["canvas_url"] + "/courses/" + courseId + "/outcome_groups/" + outcomeGroupId + "/subgroups/";

                    //string loquesea = HttpContext.Request.Form.ToString();

                    JObject parametros = new JObject();
                    parametros["title"] = group.Title;
                    parametros["vendor_guid"] = group.VendorId;

                    var response = await cliente.PostAsync(url, new StringContent(parametros.ToString(), Encoding.UTF8, "application/json"));
                    if (response.StatusCode != HttpStatusCode.OK)
                    {
                        return BadRequest();
                    }
                    var contenidoCurso = await response.Content.ReadAsStringAsync();
                    return contenidoCurso;
                }
            }
            catch (Exception ex)
            {
                Console.WriteLine(ex);
                return BadRequest(ex);
            }
        }
    }
}
