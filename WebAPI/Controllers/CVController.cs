using BIZ;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using System.Text.Json;

namespace WebAPI.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class CVController : ControllerBase
    {
        private readonly CVEmailService _cvEmailService;
        private const int MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB
        private readonly string[] ALLOWED_EXTENSIONS = { ".pdf", ".doc", ".docx" };

        public CVController()
        {
            _cvEmailService = new CVEmailService();
        }

        [HttpPost("enviar")]
        public async Task<ActionResult> EnviarCV([FromForm] SolicitudCVRequest request)
        {
            try
            {
                System.Diagnostics.Debug.WriteLine("🔄 === PETICIÓN CV RECIBIDA ===");
                System.Diagnostics.Debug.WriteLine($"🔄 Nombre: {request.NombreCompleto}");
                System.Diagnostics.Debug.WriteLine($"🔄 Email: {request.Email}");
                System.Diagnostics.Debug.WriteLine($"🔄 Tipo: {request.TipoSolicitud}");
                System.Diagnostics.Debug.WriteLine($"🔄 Archivo: {(request.ArchivoCV != null ? request.ArchivoCV.FileName : "Sin archivo")}");

                // Validaciones básicas de campos requeridos
                if (string.IsNullOrWhiteSpace(request.NombreCompleto))
                {
                    return BadRequest("El nombre completo es requerido");
                }

                if (string.IsNullOrWhiteSpace(request.Email))
                {
                    return BadRequest("El email es requerido");
                }

                if (string.IsNullOrWhiteSpace(request.Telefono))
                {
                    return BadRequest("El teléfono es requerido");
                }

                if (string.IsNullOrWhiteSpace(request.TipoSolicitud))
                {
                    return BadRequest("El tipo de solicitud es requerido");
                }

                if (request.TipoSolicitud != "residencia" && request.TipoSolicitud != "trabajo")
                {
                    return BadRequest("El tipo de solicitud debe ser 'residencia' o 'trabajo'");
                }

                // Validar formato de email
                if (!IsValidEmail(request.Email))
                {
                    return BadRequest("El formato del email no es válido");
                }

                // Validar archivo CV si se proporciona
                byte[] archivoBytes = null;
                string nombreArchivo = "";

                if (request.ArchivoCV != null)
                {
                    var validationResult = ValidateFile(request.ArchivoCV);
                    if (!validationResult.IsValid)
                    {
                        return BadRequest(validationResult.ErrorMessage);
                    }

                    // Convertir archivo a bytes
                    using (var memoryStream = new MemoryStream())
                    {
                        await request.ArchivoCV.CopyToAsync(memoryStream);
                        archivoBytes = memoryStream.ToArray();
                        nombreArchivo = request.ArchivoCV.FileName;
                    }

                    System.Diagnostics.Debug.WriteLine($"📎 Archivo procesado: {nombreArchivo} ({archivoBytes.Length} bytes)");
                }

                // Validaciones específicas por tipo de solicitud
                if (request.TipoSolicitud == "residencia")
                {
                    if (string.IsNullOrWhiteSpace(request.Carrera))
                    {
                        return BadRequest("La carrera es requerida para solicitudes de residencia");
                    }
                    if (string.IsNullOrWhiteSpace(request.Universidad))
                    {
                        return BadRequest("La universidad es requerida para solicitudes de residencia");
                    }
                }
                else if (request.TipoSolicitud == "trabajo")
                {
                    if (string.IsNullOrWhiteSpace(request.Experiencia))
                    {
                        return BadRequest("La experiencia es requerida para solicitudes de trabajo");
                    }
                    if (string.IsNullOrWhiteSpace(request.PosicionInteres))
                    {
                        return BadRequest("La posición de interés es requerida para solicitudes de trabajo");
                    }
                }

                // Crear objeto para el servicio de email
                var solicitudCV = new SolicitudCV
                {
                    NombreCompleto = request.NombreCompleto.Trim(),
                    Email = request.Email.Trim(),
                    Telefono = request.Telefono.Trim(),
                    TipoSolicitud = request.TipoSolicitud.Trim(),
                    Carrera = request.Carrera?.Trim() ?? "",
                    Universidad = request.Universidad?.Trim() ?? "",
                    Experiencia = request.Experiencia?.Trim() ?? "",
                    PosicionInteres = request.PosicionInteres?.Trim() ?? "",
                    Mensaje = request.Mensaje?.Trim() ?? "",
                    ArchivoCV = archivoBytes,
                    NombreArchivoCV = nombreArchivo
                };

                // Enviar email
                var resultado = await _cvEmailService.EnviarCV(solicitudCV);

                if (resultado)
                {
                    System.Diagnostics.Debug.WriteLine("✅ CV enviado exitosamente");
                    return Ok(new
                    {
                        message = "CV enviado correctamente",
                        tipo = request.TipoSolicitud,
                        conArchivo = archivoBytes != null,
                        timestamp = DateTime.Now
                    });
                }
                else
                {
                    System.Diagnostics.Debug.WriteLine("❌ Error al enviar CV");
                    return StatusCode(500, "Error interno al enviar el CV");
                }
            }
            catch (Exception ex)
            {
                System.Diagnostics.Debug.WriteLine($"🔥 EXCEPCIÓN en CVController: {ex.Message}");
                System.Diagnostics.Debug.WriteLine($"🔥 Stack trace: {ex.StackTrace}");

                return StatusCode(500, new
                {
                    error = "Error interno del servidor",
                    message = ex.Message,
                    timestamp = DateTime.Now
                });
            }
        }

        private (bool IsValid, string ErrorMessage) ValidateFile(IFormFile file)
        {
            if (file == null)
            {
                return (false, "No se ha seleccionado ningún archivo");
            }

            // Validar tamaño
            if (file.Length > MAX_FILE_SIZE)
            {
                return (false, $"El archivo excede el tamaño máximo permitido de {MAX_FILE_SIZE / 1024 / 1024} MB");
            }

            if (file.Length == 0)
            {
                return (false, "El archivo está vacío");
            }

            // Validar extensión
            var extension = Path.GetExtension(file.FileName).ToLowerInvariant();
            if (!ALLOWED_EXTENSIONS.Contains(extension))
            {
                return (false, $"Tipo de archivo no permitido. Solo se permiten: {string.Join(", ", ALLOWED_EXTENSIONS)}");
            }

            // Validar nombre del archivo
            if (string.IsNullOrWhiteSpace(file.FileName))
            {
                return (false, "El nombre del archivo no es válido");
            }

            return (true, "");
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

    // Clase para recibir los datos del formulario con archivo - CORREGIDA
    public class SolicitudCVRequest
    {
        public string NombreCompleto { get; set; } = "";
        public string Email { get; set; } = "";
        public string Telefono { get; set; } = "";
        public string TipoSolicitud { get; set; } = ""; // "residencia" o "trabajo"

        // Campos opcionales según el tipo - SIN VALIDACIONES REQUERIDAS
        public string? Carrera { get; set; } = "";
        public string? Universidad { get; set; } = "";
        public string? Experiencia { get; set; } = "";
        public string? PosicionInteres { get; set; } = "";
        public string? Mensaje { get; set; } = "";

        public IFormFile? ArchivoCV { get; set; }
    }
}