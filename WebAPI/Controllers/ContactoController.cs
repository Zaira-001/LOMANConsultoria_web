using BIZ;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;

namespace WebAPI.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class ContactoController : ControllerBase
    {
        private readonly SimpleEmailService _emailService;

        public ContactoController()
        {
            _emailService = new SimpleEmailService();
        }

        [HttpPost]
        public async Task<ActionResult> EnviarContacto([FromBody] FormularioContacto datos)
        {
            try
            {
                System.Diagnostics.Debug.WriteLine("🔄 === PETICIÓN RECIBIDA ===");
                System.Diagnostics.Debug.WriteLine($"🔄 Datos: {System.Text.Json.JsonSerializer.Serialize(datos)}");

                // Asegurar que los campos opcionales no sean null
                datos.TipoConsulta = datos.TipoConsulta ?? "";
                datos.NombreEmpresa = datos.NombreEmpresa ?? "";
                datos.TamanoEmpresa = datos.TamanoEmpresa ?? "";

                // Validaciones básicas solo de campos requeridos
                if (string.IsNullOrWhiteSpace(datos.Nombre))
                {
                    System.Diagnostics.Debug.WriteLine("❌ Error: Nombre requerido");
                    return BadRequest("El nombre es requerido");
                }

                if (string.IsNullOrWhiteSpace(datos.Correo))
                {
                    System.Diagnostics.Debug.WriteLine("❌ Error: Correo requerido");
                    return BadRequest("El correo es requerido");
                }

                if (string.IsNullOrWhiteSpace(datos.Telefono))
                {
                    System.Diagnostics.Debug.WriteLine("❌ Error: Teléfono requerido");
                    return BadRequest("El teléfono es requerido");
                }

                if (string.IsNullOrWhiteSpace(datos.Mensaje))
                {
                    System.Diagnostics.Debug.WriteLine("❌ Error: Mensaje requerido");
                    return BadRequest("El mensaje es requerido");
                }

                if (string.IsNullOrWhiteSpace(datos.Prioridad))
                {
                    System.Diagnostics.Debug.WriteLine("❌ Error: Prioridad requerida");
                    return BadRequest("La prioridad es requerida");
                }

                // Validar formato de email
                if (!IsValidEmail(datos.Correo))
                {
                    System.Diagnostics.Debug.WriteLine($"❌ Error: Email inválido: {datos.Correo}");
                    return BadRequest("El formato del correo no es válido");
                }

                System.Diagnostics.Debug.WriteLine("✅ Validaciones OK, enviando a servicio de email...");

                // Enviar emails
                var resultado = await _emailService.EnviarFormularioContacto(datos);

                if (resultado)
                {
                    System.Diagnostics.Debug.WriteLine("✅ Servicio de email completado exitosamente");
                    return Ok(new
                    {
                        message = "Mensaje enviado correctamente",
                        timestamp = DateTime.Now,
                        debug = "Petición procesada correctamente"
                    });
                }
                else
                {
                    System.Diagnostics.Debug.WriteLine("❌ Servicio de email falló");
                    return StatusCode(500, "Error interno al enviar el mensaje");
                }
            }
            catch (Exception ex)
            {
                System.Diagnostics.Debug.WriteLine($"🔥 EXCEPCIÓN: {ex.Message}");

                // En producción, devolver información de debug
                return StatusCode(500, new
                {
                    error = "Error interno del servidor",
                    message = ex.Message,
                    timestamp = DateTime.Now
                });
            }
        }

        private bool IsValidEmail(string email)
        {
            try
            {
                var addr = new System.Net.Mail.MailAddress(email);
                return addr.Address == email;
            }
            catch
            {
                return false;
            }
        }
    }
}