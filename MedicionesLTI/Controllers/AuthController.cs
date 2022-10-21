using System;
using System.IdentityModel.Tokens.Jwt;
using System.IO;
using System.Linq;
using System.Net.Http;
using System.Net.Http.Json;
using System.Text;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Configuration;
using Newtonsoft.Json.Linq;

namespace MedicionesLTI.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class AuthController : ControllerBase
    {
        protected readonly IConfiguration _configuration;

        public AuthController(IConfiguration configuration)
        {
            _configuration = configuration;
        }

        [HttpPost]
        public async Task<ActionResult> AuthLti()
        {
            try
            {
                string loquesea = HttpContext.Request.Form.ToString();
                string login_hint = HttpContext.Request.Form["login_hint"].ToString();
                string iss = HttpContext.Request.Form["iss"].ToString();
                string client_id = HttpContext.Request.Form["client_id"].ToString();
                string lti_message_hint = HttpContext.Request.Form["lti_message_hint"].ToString();
                string nonce = "qwerdewe";

                string autenticacion_url = _configuration["autenticacion_canvas_url"];
                string target_link_uri = HttpContext.Request.Form["target_link_uri"];

                JObject parametros = new JObject();
                parametros["client_id"] = client_id;
                parametros["login_hint"] = login_hint;
                parametros["lti_message_hint"] = lti_message_hint;
                parametros["nonce"] = nonce;
                parametros["prompt"] = "none";
                parametros["redirect_uri"] = target_link_uri;
                parametros["response_mode"] = "form_post";
                parametros["response_type"] = "id_token";
                parametros["scope"] = "openid";
                parametros["state"] = nonce;

                JObject parametrosCanvas = new JObject();
                string queryString = string.Empty;

                using (HttpClient cliente = new HttpClient())
                {

                    var postAutenticacion = await cliente.PostAsync(autenticacion_url, new StringContent(parametros.ToString(), Encoding.UTF8, "application/json"));
                    var response = await postAutenticacion.Content.ReadAsStringAsync();

                    string[] payload = response.Split("form");
                    string toklen_lti = string.Empty;

                    if (payload.Length == 6)
                    {
                        string[] form = response.Split("form");
                        try {
                            string[] values = form[2].Split("value=");
                            string[] delimiters = values[3].Split("/>");
                            payload = delimiters[0].Split('"');
                        }
                        catch
                        {
                            string[] values = form[3].Split("value=");
                            string[] delimiters = values[3].Split("/>");
                            payload = delimiters[0].Split('"');
                        }
                        
                        string strParametros = ObtenerParametros(payload[1]);
                        if (!string.IsNullOrEmpty(strParametros))
                        {
                            parametrosCanvas = JObject.Parse(strParametros);
                            queryString = string.Format("?user_id={0}&course_id={1}",
                                parametrosCanvas["user_id"].ToString(), parametrosCanvas["curso_id"].ToString());
                        }

                        using (StreamWriter writer = System.IO.File.AppendText("logfile.txt"))
                        {

                            writer.WriteLine("===============================");
                            writer.WriteLine("payload " + payload[1]);

                            foreach (var key in HttpContext.Request.Form.Keys)
                            {
                                writer.WriteLine("===============================");
                                writer.WriteLine("key " + key + " : " + HttpContext.Request.Form[key]);
                            }

                        }

                    }
                    else if (payload.Length == 5)
                    {
                        payload = response.Split("form")[2].Split("value=")[3].Split("/>")[0].Split('"');


                        string strParametros = ObtenerParametros(payload[1]);

                        if (!string.IsNullOrEmpty(strParametros))
                        {
                            parametrosCanvas = JObject.Parse(strParametros);
                            queryString = string.Format("?user_id={0}&course_id={1}",
                                parametrosCanvas["user_id"].ToString(), parametrosCanvas["curso_id"].ToString());
                        }

                        using (StreamWriter writer = System.IO.File.AppendText("logfile.txt"))
                        {

                            writer.WriteLine("===============================");
                            writer.WriteLine("payload " + payload[1]);

                            foreach (var key in HttpContext.Request.Form.Keys)
                            {
                                writer.WriteLine("===============================");
                                writer.WriteLine("key " + key + " : " + HttpContext.Request.Form[key]);
                            }

                        }

                    }

                    // return Redirect(string.Format("{0}?parametros={1}", target_link_uri, parametrosCanvas.ToString()));
                    return Redirect(string.Format("{0}{1}", target_link_uri, queryString));
                    // return Ok(response);
                }

            }
            catch (System.Exception ex)
            {
                using (StreamWriter writer = System.IO.File.AppendText("logfile.txt"))
                {
                    writer.WriteLine(ex.Message);
                }
            }

            return Ok();
        }

        private String ObtenerParametros(string token)
        {

            try
            {
                var handler = new JwtSecurityTokenHandler();
                JwtSecurityToken jwtSecurityToken = handler.ReadJwtToken(token);

                return jwtSecurityToken.Claims.First(claim => claim.Type == "https://purl.imsglobal.org/spec/lti/claim/custom").Value;
            }
            catch (Exception ex)
            {
                return string.Empty;
            }
        }
    }
}
