using COMMON;
using COMMON.Entidades;
using FluentValidation;
using Newtonsoft.Json;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace BIZ
{
    public abstract class GenericManager<T> where T : CamposControl
    {
        HttpClient _httpClient;
        public string Error { get; protected set; }
        AbstractValidator<T> _validador;

        protected GenericManager(AbstractValidator<T> validador)
        {
            _validador = validador;
            _httpClient = new HttpClient();
            _httpClient.BaseAddress = new Uri(Params.UrlAPI);
            _httpClient.DefaultRequestHeaders.Accept.Clear();
            _httpClient.DefaultRequestHeaders.Accept.Add(
                new System.Net.Http.Headers.MediaTypeWithQualityHeaderValue("application/json"));
        }

        public async Task<List<T>> ObtenerTodos()
        {
            try
            {
                HttpResponseMessage response = await _httpClient
                    .GetAsync($"api/{typeof(T).Name}")
                    .ConfigureAwait(false);

                var content = await response.Content.ReadAsStringAsync().ConfigureAwait(false);

                if (response.IsSuccessStatusCode)
                {
                    Error = "";
                    var respuesta = JsonConvert.DeserializeObject<List<T>>(content);
                    return respuesta;
                }
                else
                {
                    Error = content;
                    return null;
                }
            }
            catch (Exception ex)
            {
                Error = ex.Message;
                return null;
            }
        }

        public async Task<T> ObtenerPorId(string id)
        {
            try
            {
                HttpResponseMessage response = await _httpClient
                    .GetAsync($"api/{typeof(T).Name}/{id}")
                    .ConfigureAwait(false);

                var content = await response.Content.ReadAsStringAsync().ConfigureAwait(false);

                if (response.IsSuccessStatusCode)
                {
                    Error = "";
                    var respuesta = JsonConvert.DeserializeObject<T>(content);
                    return respuesta;
                }
                else
                {
                    Error = content;
                    return null;
                }
            }
            catch (Exception ex)
            {
                Error = ex.Message;
                return null;
            }
        }

        public async Task<T> ObtenerPorId(int id)
        {
            try
            {
                HttpResponseMessage response = await _httpClient
                    .GetAsync($"api/{typeof(T).Name}/{id}")
                    .ConfigureAwait(false);

                var content = await response.Content.ReadAsStringAsync().ConfigureAwait(false);

                if (response.IsSuccessStatusCode)
                {
                    Error = "";
                    var respuesta = JsonConvert.DeserializeObject<T>(content);
                    return respuesta;
                }
                else
                {
                    Error = content;
                    return null;
                }
            }
            catch (Exception ex)
            {
                Error = ex.Message;
                return null;
            }
        }

        public async Task<bool> Eliminar(string id)
        {
            try
            {
                HttpResponseMessage response = await _httpClient
                    .DeleteAsync($"api/{typeof(T).Name}/{id}")
                    .ConfigureAwait(false);

                var content = await response.Content.ReadAsStringAsync().ConfigureAwait(false);

                if (response.IsSuccessStatusCode)
                {
                    Error = "";
                    return true;
                }
                else
                {
                    Error = content;
                    return false;
                }
            }
            catch (Exception ex)
            {
                Error = ex.Message;
                return false;
            }
        }

        public virtual async Task<T> Agregar(T entidad)
        {
            try
            {
                Console.WriteLine($"=== GenericManager.Agregar para {typeof(T).Name} ===");

                // ✅ ASEGURAR campos de control con valores válidos
                entidad.UsuarioAlta = string.IsNullOrWhiteSpace(Params.UsuarioConectado)
                    ? "WebClient"
                    : Params.UsuarioConectado;

                entidad.UsuarioMod = string.IsNullOrWhiteSpace(Params.UsuarioConectado)
                    ? "WebClient"
                    : Params.UsuarioConectado;

                // ✅ IMPORTANTE: Usar DateTime.Now, NO DateTime.MinValue
                var ahora = DateTime.Now;
                entidad.FechaAlta = ahora;
                entidad.FechaMod = ahora;

                Console.WriteLine($"✅ Campos de control asignados:");
                Console.WriteLine($"   UsuarioAlta: {entidad.UsuarioAlta}");
                Console.WriteLine($"   UsuarioMod: {entidad.UsuarioMod}");
                Console.WriteLine($"   FechaAlta: {entidad.FechaAlta:yyyy-MM-dd HH:mm:ss}");
                Console.WriteLine($"   FechaMod: {entidad.FechaMod:yyyy-MM-dd HH:mm:ss}");

                // ✅ VALIDACIÓN
                if (_validador != null)
                {
                    var resultadoValidacion = _validador.Validate(entidad);
                    if (!resultadoValidacion.IsValid)
                    {
                        Error = string.Join(", ", resultadoValidacion.Errors.Select(e => e.ErrorMessage));
                        Console.WriteLine($"❌ Errores de validación: {Error}");
                        return null;
                    }
                    Console.WriteLine("✅ Validación exitosa");
                }

                // ✅ SERIALIZACIÓN con configuración correcta
                var jsonSettings = new JsonSerializerSettings
                {
                    DateFormatHandling = DateFormatHandling.IsoDateFormat,
                    DateTimeZoneHandling = DateTimeZoneHandling.Local,
                    NullValueHandling = NullValueHandling.Include,
                    DefaultValueHandling = DefaultValueHandling.Include,
                    // ✅ IMPORTANTE: Formato de fecha compatible con SQL Server
                    DateFormatString = "yyyy-MM-ddTHH:mm:ss"
                };

                var jsonBody = JsonConvert.SerializeObject(entidad, jsonSettings);
                Console.WriteLine($"📝 JSON a enviar: {jsonBody}");

                var body = new StringContent(jsonBody, Encoding.UTF8, "application/json");

                // ✅ ENVIAR REQUEST
                Console.WriteLine($"🌐 Enviando POST a: {_httpClient.BaseAddress}api/{typeof(T).Name}");
                HttpResponseMessage response = await _httpClient
                    .PostAsync($"api/{typeof(T).Name}", body)
                    .ConfigureAwait(false);

                var content = await response.Content.ReadAsStringAsync().ConfigureAwait(false);

                Console.WriteLine($"📥 Response Status: {response.StatusCode}");
                Console.WriteLine($"📥 Response Content: {content}");

                if (response.IsSuccessStatusCode)
                {
                    Error = "";
                    var respuesta = JsonConvert.DeserializeObject<T>(content);
                    Console.WriteLine($"✅ {typeof(T).Name} creado exitosamente");
                    return respuesta;
                }
                else
                {
                    Error = $"HTTP {response.StatusCode}: {content}";
                    Console.WriteLine($"❌ Error HTTP: {Error}");
                    return null;
                }
            }
            catch (Exception ex)
            {
                Error = ex.Message;
                Console.WriteLine($"🔥 Excepción en Agregar: {ex.Message}");
                Console.WriteLine($"🔥 Stack trace: {ex.StackTrace}");
                if (ex.InnerException != null)
                {
                    Console.WriteLine($"🔥 Inner Exception: {ex.InnerException.Message}");
                }
                return null;
            }
        }

        public async Task<T> Modificar(T entidad)
        {
            try
            {
                Console.WriteLine($"=== GenericManager.Modificar para {typeof(T).Name} ===");

                // ✅ Actualizar campos de modificación
                entidad.UsuarioMod = string.IsNullOrWhiteSpace(Params.UsuarioConectado)
                    ? "WebClient"
                    : Params.UsuarioConectado;

                entidad.FechaMod = DateTime.Now;

                Console.WriteLine($"✅ UsuarioMod: {entidad.UsuarioMod}");
                Console.WriteLine($"✅ FechaMod: {entidad.FechaMod:yyyy-MM-dd HH:mm:ss}");

                // ✅ VALIDACIÓN
                if (_validador != null)
                {
                    var resultadoValidacion = _validador.Validate(entidad);
                    if (!resultadoValidacion.IsValid)
                    {
                        Error = string.Join(", ", resultadoValidacion.Errors.Select(e => e.ErrorMessage));
                        Console.WriteLine($"❌ Errores de validación PUT: {Error}");
                        return null;
                    }
                }

                var jsonSettings = new JsonSerializerSettings
                {
                    DateFormatHandling = DateFormatHandling.IsoDateFormat,
                    DateTimeZoneHandling = DateTimeZoneHandling.Local,
                    NullValueHandling = NullValueHandling.Include,
                    DateFormatString = "yyyy-MM-ddTHH:mm:ss"
                };

                var jsonBody = JsonConvert.SerializeObject(entidad, jsonSettings);
                Console.WriteLine($"📝 JSON PUT: {jsonBody}");

                var body = new StringContent(jsonBody, Encoding.UTF8, "application/json");

                HttpResponseMessage response = await _httpClient
                    .PutAsync($"api/{typeof(T).Name}", body)
                    .ConfigureAwait(false);

                var content = await response.Content.ReadAsStringAsync().ConfigureAwait(false);

                Console.WriteLine($"📥 PUT Response Status: {response.StatusCode}");
                Console.WriteLine($"📥 PUT Response Content: {content}");

                if (response.IsSuccessStatusCode)
                {
                    Error = "";
                    var respuesta = JsonConvert.DeserializeObject<T>(content);
                    Console.WriteLine($"✅ {typeof(T).Name} modificado exitosamente");
                    return respuesta;
                }
                else
                {
                    Error = $"HTTP {response.StatusCode}: {content}";
                    Console.WriteLine($"❌ Error HTTP PUT: {Error}");
                    return null;
                }
            }
            catch (Exception ex)
            {
                Error = ex.Message;
                Console.WriteLine($"🔥 Excepción en Modificar: {ex.Message}");
                Console.WriteLine($"🔥 Stack trace: {ex.StackTrace}");
                return null;
            }
        }
    }
}