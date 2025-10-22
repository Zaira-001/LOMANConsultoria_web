using BIZ;
using COMMON.Interfaces;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using COMMON.Entidades;

namespace WebAPI.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class CVController : ControllerBase
    {
        private readonly CVEmailService _cvEmailService;
        private readonly IDB<SolicitudCV> _solicitudCVRepository;
        private readonly ILogger<CVController> _logger;
        private const int MAX_FILE_SIZE = 10 * 1024 * 1024;
        private readonly string[] ALLOWED_EXTENSIONS = { ".pdf", ".doc", ".docx" };

        public CVController(
            IDB<SolicitudCV> solicitudCVRepository,
            ILogger<CVController> logger)
        {
            _cvEmailService = new CVEmailService();
            _solicitudCVRepository = solicitudCVRepository;
            _logger = logger;
        }

        // ✅ OBTENER TODAS LAS SOLICITUDES
        [HttpGet]
        public ActionResult<List<SolicitudCV>> GetAll()
        {
            try
            {
                _logger.LogInformation("📥 GET /api/CV - Obteniendo todas las solicitudes");

                var solicitudes = _solicitudCVRepository.ObtenerTodos();
                if (solicitudes != null)
                {
                    solicitudes = solicitudes.OrderByDescending(s => s.FechaAlta).ToList();
                    _logger.LogInformation($"✅ Retornando {solicitudes.Count} solicitudes");
                    return Ok(solicitudes);
                }
                else
                {
                    _logger.LogError($"❌ Error: {_solicitudCVRepository.Error}");
                    return BadRequest(_solicitudCVRepository.Error);
                }
            }
            catch (Exception ex)
            {
                _logger.LogError($"🔥 Error en GetAll: {ex.Message}");
                return StatusCode(500, new { error = ex.Message });
            }
        }

        // ✅ OBTENER POR ID
        [HttpGet("{id:int}")]
        public ActionResult<SolicitudCV> GetById(int id)
        {
            try
            {
                _logger.LogInformation($"📥 GET /api/CV/{id}");

                var solicitud = _solicitudCVRepository.ObtenerPorId(id);
                if (solicitud != null)
                {
                    _logger.LogInformation($"✅ Solicitud {id} encontrada");
                    return Ok(solicitud);
                }
                else
                {
                    _logger.LogWarning($"⚠️ Solicitud {id} no encontrada");
                    return NotFound($"Solicitud con ID {id} no encontrada");
                }
            }
            catch (Exception ex)
            {
                _logger.LogError($"🔥 Error en GetById: {ex.Message}");
                return StatusCode(500, new { error = ex.Message });
            }
        }

        // ✅ DESCARGAR CV
        [HttpGet("{id:int}/descargar-cv")]
        public ActionResult DescargarCV(int id)
        {
            try
            {
                _logger.LogInformation($"📥 GET /api/CV/{id}/descargar-cv");

                var solicitud = _solicitudCVRepository.ObtenerPorId(id);

                if (solicitud == null)
                {
                    _logger.LogWarning($"⚠️ Solicitud {id} no encontrada");
                    return NotFound("Solicitud no encontrada");
                }

                if (solicitud.ArchivoCV == null || solicitud.ArchivoCV.Length == 0)
                {
                    _logger.LogWarning($"⚠️ Solicitud {id} sin CV");
                    return NotFound("Esta solicitud no tiene CV adjunto");
                }

                var extension = Path.GetExtension(solicitud.NombreArchivoCV).ToLowerInvariant();
                string contentType = extension switch
                {
                    ".pdf" => "application/pdf",
                    ".doc" => "application/msword",
                    ".docx" => "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
                    _ => "application/octet-stream"
                };

                _logger.LogInformation($"✅ Descargando {solicitud.NombreArchivoCV}");
                return File(solicitud.ArchivoCV, contentType, solicitud.NombreArchivoCV);
            }
            catch (Exception ex)
            {
                _logger.LogError($"🔥 Error descargando CV: {ex.Message}");
                return StatusCode(500, new { error = ex.Message });
            }
        }

        // ✅ PROCESAR SOLICITUD Y AGENDAR ENTREVISTA - OPTIMIZADO
        [HttpPut("{id:int}/procesar")]
        public async Task<ActionResult> MarcarProcesado(
            int id,
            [FromBody] ProcesarSolicitudRequest request)
        {
            try
            {
                _logger.LogInformation($"📝 === PUT /api/CV/{id}/procesar ===");
                _logger.LogInformation($"📝 Request: {System.Text.Json.JsonSerializer.Serialize(request)}");

                // VALIDACIONES BÁSICAS
                if (request == null)
                {
                    _logger.LogError("❌ Request nulo");
                    return BadRequest(new { error = "Datos de entrevista requeridos" });
                }

                if (!request.FechaEntrevista.HasValue)
                {
                    _logger.LogError("❌ Fecha vacía");
                    return BadRequest(new { error = "La fecha de entrevista es requerida" });
                }

                if (string.IsNullOrWhiteSpace(request.HoraEntrevista))
                {
                    _logger.LogError("❌ Hora vacía");
                    return BadRequest(new { error = "La hora de entrevista es requerida" });
                }

                // BUSCAR SOLICITUD
                var solicitud = _solicitudCVRepository.ObtenerPorId(id);

                if (solicitud == null)
                {
                    _logger.LogWarning($"❌ Solicitud {id} no encontrada");
                    return NotFound(new { error = $"Solicitud {id} no encontrada" });
                }

                _logger.LogInformation($"✅ Solicitud: {solicitud.NombreCompleto}");
                _logger.LogInformation($"📧 Email: {solicitud.Email}");

                // ACTUALIZAR SOLICITUD CON LAS 3 MODALIDADES
                solicitud.Procesado = true;
                solicitud.FechaProcesado = DateTime.Now;
                solicitud.UsuarioMod = "admin";
                solicitud.FechaMod = DateTime.Now;

                // Fecha y hora general
                solicitud.FechaEntrevista = request.FechaEntrevista;
                solicitud.HoraEntrevista = request.HoraEntrevista;

                // Modalidad Virtual
                solicitud.EnlaceVirtual = request.EnlaceVirtual ?? "";
                solicitud.InstruccionesVirtual = request.InstruccionesVirtual ?? "";

                // Modalidad Telefónica
                solicitud.TelefonoContacto = request.TelefonoContacto ?? solicitud.Telefono;
                solicitud.InstrucionesTelefonica = request.InstrucionesTelefonica ?? "";

                // Modalidad Presencial
                solicitud.DireccionEntrevista = request.DireccionEntrevista ??
                    "Rio Sena #94, 3er. Piso Col. Rio Lerma Cuauhtémoc, Ciudad de México C.P.06500";
                solicitud.InstruccionesPresencial = request.InstruccionesPresencial ?? "";

                // Mensaje personalizado y notas
                solicitud.MensajePersonalizado = request.MensajePersonalizado ?? "";
                solicitud.NotasAdmin = request.Notas ?? "";

                _logger.LogInformation($"📅 Fecha: {solicitud.FechaEntrevista:yyyy-MM-dd}");
                _logger.LogInformation($"⏰ Hora: {solicitud.HoraEntrevista}");

                // GUARDAR EN BD
                _logger.LogInformation("💾 Guardando en BD...");
                var resultado = _solicitudCVRepository.Actualizar(solicitud);

                if (resultado == null)
                {
                    var errorMsg = _solicitudCVRepository.Error ?? "Error desconocido";
                    _logger.LogError($"❌ Error BD: {errorMsg}");
                    return StatusCode(500, new { error = errorMsg });
                }

                _logger.LogInformation("✅ Guardado exitoso");

                // 🆕 ENVIAR EMAIL DE FORMA ASÍNCRONA (SIN BLOQUEAR LA RESPUESTA)
                _ = Task.Run(async () =>
                {
                    try
                    {
                        _logger.LogInformation($"📧 Enviando email en segundo plano a: {resultado.Email}");
                        var emailEnviado = await _cvEmailService.EnviarConfirmacionEntrevista(resultado);

                        if (emailEnviado)
                        {
                            _logger.LogInformation("✅ Email con 3 modalidades enviado exitosamente");
                        }
                        else
                        {
                            _logger.LogWarning("⚠️ Email no pudo ser enviado");
                        }
                    }
                    catch (Exception emailEx)
                    {
                        _logger.LogError($"❌ Error enviando email en segundo plano: {emailEx.Message}");
                    }
                });

                // RETORNAR RESPUESTA INMEDIATA (sin esperar el email)
                _logger.LogInformation("✅ === PROCESAMIENTO COMPLETADO ===");

                return Ok(new
                {
                    success = true,
                    message = "Entrevista agendada exitosamente. El email de confirmación se está enviando.",
                    solicitud = new
                    {
                        id = resultado.Id,
                        nombreCompleto = resultado.NombreCompleto,
                        email = resultado.Email,
                        telefono = resultado.Telefono,
                        procesado = resultado.Procesado,
                        fechaEntrevista = resultado.FechaEntrevista,
                        horaEntrevista = resultado.HoraEntrevista,
                        modalidades = new
                        {
                            @virtual = new
                            {
                                enlace = resultado.EnlaceVirtual,
                                instrucciones = resultado.InstruccionesVirtual
                            },
                            telefonica = new
                            {
                                telefono = resultado.TelefonoContacto,
                                instrucciones = resultado.InstrucionesTelefonica
                            },
                            presencial = new
                            {
                                direccion = resultado.DireccionEntrevista,
                                instrucciones = resultado.InstruccionesPresencial
                            }
                        }
                    },
                    emailStatus = "sending", // 🆕 Indica que el email se está enviando
                    timestamp = DateTime.Now
                });
            }
            catch (Exception ex)
            {
                _logger.LogError($"🔥 ERROR: {ex.Message}");
                _logger.LogError($"Stack: {ex.StackTrace}");

                return StatusCode(500, new
                {
                    error = "Error interno del servidor",
                    message = ex.Message,
                    type = ex.GetType().Name,
                    timestamp = DateTime.Now
                });
            }
        }


        // ✅ ELIMINAR SOLICITUD
        [HttpDelete("{id:int}")]
        public ActionResult Eliminar(int id)
        {
            try
            {
                _logger.LogInformation($"🗑️ DELETE /api/CV/{id}");

                var solicitud = _solicitudCVRepository.ObtenerPorId(id);

                if (solicitud == null)
                {
                    _logger.LogWarning($"⚠️ Solicitud {id} no encontrada");
                    return NotFound("Solicitud no encontrada");
                }

                var resultado = _solicitudCVRepository.Eliminar(solicitud);

                if (resultado)
                {
                    _logger.LogInformation($"✅ Solicitud {id} eliminada");
                    return NoContent();
                }
                else
                {
                    _logger.LogError($"❌ Error: {_solicitudCVRepository.Error}");
                    return BadRequest(_solicitudCVRepository.Error);
                }
            }
            catch (Exception ex)
            {
                _logger.LogError($"🔥 Error en Eliminar: {ex.Message}");
                return StatusCode(500, new { error = ex.Message });
            }
        }

        // ✅ ENVIAR CV (DESDE FRONTEND)
        [HttpPost("enviar")]
        public async Task<ActionResult> EnviarCV([FromForm] SolicitudCVRequest request)
        {
            try
            {
                _logger.LogInformation("📨 POST /api/CV/enviar");
                _logger.LogInformation($"👤 Nombre: {request.NombreCompleto}");
                _logger.LogInformation($"📧 Email: {request.Email}");
                _logger.LogInformation($"🎯 Tipo: {request.TipoSolicitud}");

                // Validaciones
                if (string.IsNullOrWhiteSpace(request.NombreCompleto))
                    return BadRequest(new { error = "El nombre completo es requerido" });

                if (string.IsNullOrWhiteSpace(request.Email))
                    return BadRequest(new { error = "El email es requerido" });

                if (string.IsNullOrWhiteSpace(request.Telefono))
                    return BadRequest(new { error = "El teléfono es requerido" });

                if (string.IsNullOrWhiteSpace(request.TipoSolicitud))
                    return BadRequest(new { error = "El tipo de solicitud es requerido" });

                if (request.TipoSolicitud != "residencia" && request.TipoSolicitud != "trabajo")
                    return BadRequest(new { error = "El tipo debe ser 'residencia' o 'trabajo'" });

                // Procesar archivo
                byte[] archivoBytes = null;
                string nombreArchivo = "";

                if (request.ArchivoCV != null)
                {
                    _logger.LogInformation($"📎 Archivo: {request.ArchivoCV.FileName}");

                    var validationResult = ValidateFile(request.ArchivoCV);
                    if (!validationResult.IsValid)
                    {
                        _logger.LogWarning($"⚠️ Archivo inválido: {validationResult.ErrorMessage}");
                        return BadRequest(new { error = validationResult.ErrorMessage });
                    }

                    using (var memoryStream = new MemoryStream())
                    {
                        await request.ArchivoCV.CopyToAsync(memoryStream);
                        archivoBytes = memoryStream.ToArray();
                        nombreArchivo = request.ArchivoCV.FileName;
                    }

                    _logger.LogInformation($"✅ Archivo: {archivoBytes.Length / 1024} KB");
                }

                // Crear entidad
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
                    NombreArchivoCV = nombreArchivo,
                    Procesado = false,
                    UsuarioAlta = "WebClient",
                    UsuarioMod = "WebClient",
                    FechaAlta = DateTime.Now,
                    FechaMod = DateTime.Now
                };

                // Guardar
                _logger.LogInformation("💾 Guardando...");
                var solicitudGuardada = _solicitudCVRepository.Insertar(solicitudCV);

                if (solicitudGuardada == null)
                {
                    var errorMsg = _solicitudCVRepository.Error ?? "Error desconocido";
                    _logger.LogError($"❌ Error: {errorMsg}");
                    return StatusCode(500, new { error = "Error al guardar" });
                }

                _logger.LogInformation($"✅ Guardado ID: {solicitudGuardada.Id}");

                // Enviar email admin
                _ = Task.Run(async () =>
                {
                    try
                    {
                        await _cvEmailService.EnviarCV(solicitudCV);
                        _logger.LogInformation("✅ Email admin enviado");
                    }
                    catch (Exception emailEx)
                    {
                        _logger.LogWarning($"⚠️ Error email: {emailEx.Message}");
                    }
                });

                return Ok(new
                {
                    success = true,
                    message = "CV enviado correctamente",
                    id = solicitudGuardada.Id,
                    tipo = request.TipoSolicitud,
                    conArchivo = archivoBytes != null,
                    timestamp = DateTime.Now
                });
            }
            catch (Exception ex)
            {
                _logger.LogError($"🔥 Error: {ex.Message}");

                return StatusCode(500, new
                {
                    error = "Error interno",
                    message = ex.Message
                });
            }
        }

        // ✅ VALIDAR ARCHIVO
        private (bool IsValid, string ErrorMessage) ValidateFile(IFormFile file)
        {
            if (file == null)
                return (false, "No se ha seleccionado ningún archivo");

            if (file.Length > MAX_FILE_SIZE)
                return (false, $"El archivo excede {MAX_FILE_SIZE / 1024 / 1024} MB");

            if (file.Length == 0)
                return (false, "El archivo está vacío");

            var extension = Path.GetExtension(file.FileName).ToLowerInvariant();
            if (!ALLOWED_EXTENSIONS.Contains(extension))
                return (false, $"Solo se aceptan: {string.Join(", ", ALLOWED_EXTENSIONS)}");

            return (true, "");
        }
    }

    // ============================================
    // CLASES DE REQUEST
    // ============================================

    public class SolicitudCVRequest
    {
        public string NombreCompleto { get; set; } = "";
        public string Email { get; set; } = "";
        public string Telefono { get; set; } = "";
        public string TipoSolicitud { get; set; } = "";
        public string? Carrera { get; set; }
        public string? Universidad { get; set; }
        public string? Experiencia { get; set; }
        public string? PosicionInteres { get; set; }
        public string? Mensaje { get; set; }
        public IFormFile? ArchivoCV { get; set; }
    }

    public class ProcesarSolicitudRequest
    {
        // Información general
        public DateTime? FechaEntrevista { get; set; }
        public string HoraEntrevista { get; set; } = "";

        // Modalidad Virtual
        public string? EnlaceVirtual { get; set; }
        public string? InstruccionesVirtual { get; set; }

        // Modalidad Telefónica
        public string? TelefonoContacto { get; set; }
        public string? InstrucionesTelefonica { get; set; }

        // Modalidad Presencial
        public string? DireccionEntrevista { get; set; }
        public string? InstruccionesPresencial { get; set; }

        // Mensaje general
        public string? MensajePersonalizado { get; set; }
        public string? Notas { get; set; }
    }
}