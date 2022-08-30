using MedicionesLTI.Models;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Configuration;
using Newtonsoft.Json;
using Newtonsoft.Json.Linq;
using System;
using System.Collections.Generic;
using System.Net;
using System.Net.Http;
using System.Net.Http.Headers;
using System.Threading.Tasks;

namespace MedicionesLTI.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class RoutesController : ControllerBase
    {
        protected readonly IConfiguration _configuration;

        public RoutesController(IConfiguration configuration)
        {
            _configuration = configuration;
        }

        [HttpGet]
        [Route("{course_id}")]
        public async Task<ActionResult<List<Route>>> GetCourse(string course_id)
        {
            try
            {
                string baseUrl = _configuration["routes_url"];

                using (var cliente = new HttpClient())
                {
                    string url = baseUrl + "/TblRutaMedicionMateriums/GetResultadosMedirporCurso/" + course_id;

                    var rptRoutes = await cliente.GetAsync(url);

                    if (rptRoutes.StatusCode != HttpStatusCode.OK)
                    {
                        return BadRequest();
                    }

                    var contentRoute = await rptRoutes.Content.ReadAsStringAsync();
                    dynamic jsonArrayRoutes = JsonConvert.DeserializeObject(contentRoute);

                    var routes = new List<Route>();
                    foreach (var jsonRoute in jsonArrayRoutes.listData)
                    {
                        var route = new Route
                        {
                            Id = jsonRoute.iddetallecarrera,
                            Title = jsonRoute.descripcion,
                            Type = jsonRoute.medicion
                        };
                        routes.Add(route);
                    }

                    return routes;
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
