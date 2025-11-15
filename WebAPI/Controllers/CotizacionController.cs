using BIZ;
using COMMON.Entidades;
using COMMON.Interfaces;
using Microsoft.AspNetCore.Mvc;

namespace WebAPI.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class CotizacionController : GenericController<Cotizacion>
    {
        private readonly ILogger<CotizacionController> _logger;
        private readonly CotizacionEmailService _emailService;

        public CotizacionController(
            IDB<Cotizacion> repositorio,
            ILogger<CotizacionController> logger)
            : base(repositorio)
        {
            _logger = logger ?? throw new ArgumentNullException(nameof(logger));
            _emailService = new CotizacionEmailService();
        }

        // ✅ MÉTODO HELPER PARA BUSCAR POR ID CORRECTAMENTE
        private Cotizacion? ObtenerCotizacionPorId(int id)
        {
            try
            {
                _logger.LogInformation($"🔍 Buscando cotización ID: {id}");

                // Buscar en la lista completa en lugar de usar ObtenerPorId
                var todasLasCotizaciones = _repositorio.ObtenerTodos();

                if (todasLasCotizaciones == null || !todasLasCotizaciones.Any())
                {
                    _logger.LogWarning("❌ No hay cotizaciones en la base de datos");
                    return null;
                }

                _logger.LogInformation($"📊 Total cotizaciones en DB: {todasLasCotizaciones.Count}");

                var cotizacion = todasLasCotizaciones.FirstOrDefault(c => c.Id == id);

                if (cotizacion == null)
                {
                    _logger.LogWarning($"❌ Cotización {id} no encontrada");
                    _logger.LogInformation($"📋 IDs disponibles: {string.Join(", ", todasLasCotizaciones.Select(c => c.Id))}");
                }
                else
                {
                    _logger.LogInformation($"✅ Cotización encontrada: {cotizacion.Nombre}, Estado: {cotizacion.Estado}");
                }

                return cotizacion;
            }
            catch (Exception ex)
            {
                _logger.LogError($"❌ Error buscando cotización: {ex.Message}");
                return null;
            }
        }

        [HttpPost]
        public override ActionResult<Cotizacion> Post([FromBody] Cotizacion entidad)
        {
            try
            {
                _logger.LogInformation("========================================");
                _logger.LogInformation("=== POST COTIZACIÓN - DEBUG EXTENDIDO ===");
                _logger.LogInformation("========================================");

                if (entidad == null)
                {
                    _logger.LogError("❌ Entidad NULL");
                    return BadRequest(new { success = false, error = "Datos inválidos" });
                }

                // LOG DATOS RECIBIDOS
                _logger.LogInformation($"📝 Datos recibidos:");
                _logger.LogInformation($"   Nombre: {entidad.Nombre}");
                _logger.LogInformation($"   Correo: {entidad.Correo}");
                _logger.LogInformation($"   Teléfono: {entidad.Telefono}");
                _logger.LogInformation($"   NombreEmpresa: '{entidad.NombreEmpresa}' (IsNull: {entidad.NombreEmpresa == null})");
                _logger.LogInformation($"   TamanoEmpresa: '{entidad.TamanoEmpresa}' (IsNull: {entidad.TamanoEmpresa == null})");
                _logger.LogInformation($"   TipoConsulta: {entidad.TipoConsulta}");
                _logger.LogInformation($"   Estado: {entidad.Estado}");
                _logger.LogInformation($"   Prioridad: {entidad.Prioridad}");
                _logger.LogInformation($"   Mensaje Length: {entidad.Mensaje?.Length ?? 0}");

                // VALIDACIONES
                if (string.IsNullOrWhiteSpace(entidad.Nombre))
                    return BadRequest(new { success = false, error = "El nombre es requerido" });

                if (string.IsNullOrWhiteSpace(entidad.Correo))
                    return BadRequest(new { success = false, error = "El correo es requerido" });

                if (string.IsNullOrWhiteSpace(entidad.Telefono))
                    return BadRequest(new { success = false, error = "El teléfono es requerido" });

                if (string.IsNullOrWhiteSpace(entidad.Mensaje))
                    return BadRequest(new { success = false, error = "El mensaje es requerido" });

                // VALORES POR DEFECTO
                if (string.IsNullOrWhiteSpace(entidad.Estado))
                    entidad.Estado = "Pendiente";

                if (string.IsNullOrWhiteSpace(entidad.Prioridad))
                    entidad.Prioridad = "Media";

                if (string.IsNullOrWhiteSpace(entidad.UsuarioAlta))
                    entidad.UsuarioAlta = "WebClient";

                if (string.IsNullOrWhiteSpace(entidad.UsuarioMod))
                    entidad.UsuarioMod = "WebClient";

                if (entidad.FechaAlta == default || entidad.FechaAlta == DateTime.MinValue)
                    entidad.FechaAlta = DateTime.Now;

                if (entidad.FechaMod == default || entidad.FechaMod == DateTime.MinValue)
                    entidad.FechaMod = DateTime.Now;

                // LIMPIAR CAMPOS OPCIONALES
                entidad.NombreEmpresa = string.IsNullOrWhiteSpace(entidad.NombreEmpresa) ? null : entidad.NombreEmpresa.Trim();
                entidad.TamanoEmpresa = string.IsNullOrWhiteSpace(entidad.TamanoEmpresa) ? null : entidad.TamanoEmpresa.Trim();
                entidad.NotasAdmin = string.IsNullOrWhiteSpace(entidad.NotasAdmin) ? null : entidad.NotasAdmin.Trim();
                entidad.RespuestaAdmin = string.IsNullOrWhiteSpace(entidad.RespuestaAdmin) ? null : entidad.RespuestaAdmin.Trim();
                entidad.NotasInternas = string.IsNullOrWhiteSpace(entidad.NotasInternas) ? null : entidad.NotasInternas.Trim();

                _logger.LogInformation($"✅ Datos preparados para insertar:");
                _logger.LogInformation($"   Estado: {entidad.Estado}");
                _logger.LogInformation($"   Prioridad: {entidad.Prioridad}");
                _logger.LogInformation($"   UsuarioAlta: {entidad.UsuarioAlta}");
                _logger.LogInformation($"   FechaAlta: {entidad.FechaAlta:yyyy-MM-dd HH:mm:ss}");
                _logger.LogInformation($"   NombreEmpresa (final): '{entidad.NombreEmpresa ?? "NULL"}'");
                _logger.LogInformation($"   TamanoEmpresa (final): '{entidad.TamanoEmpresa ?? "NULL"}'");

                // VERIFICAR TIPO DE REPOSITORIO
                _logger.LogInformation($"🔍 Tipo de Repositorio: {_repositorio.GetType().FullName}");

                // INTENTAR INSERTAR CON CAPTURA DETALLADA
                _logger.LogInformation("🔄 Llamando a _repositorio.Insertar()...");

                Cotizacion resultado = null;
                string errorCapturado = "";

                try
                {
                    resultado = _repositorio.Insertar(entidad);
                    errorCapturado = _repositorio.Error ?? "";

                    _logger.LogInformation($"📊 Resultado del Insertar:");
                    _logger.LogInformation($"   Resultado es NULL: {resultado == null}");
                    _logger.LogInformation($"   Error del repositorio: '{errorCapturado}'");
                    _logger.LogInformation($"   Error está vacío: {string.IsNullOrEmpty(errorCapturado)}");
                }
                catch (Exception exInsertar)
                {
                    _logger.LogError($"💥 EXCEPCIÓN DENTRO DE INSERTAR:");
                    _logger.LogError($"   Tipo: {exInsertar.GetType().Name}");
                    _logger.LogError($"   Message: {exInsertar.Message}");
                    _logger.LogError($"   StackTrace: {exInsertar.StackTrace}");
                    if (exInsertar.InnerException != null)
                    {
                        _logger.LogError($"   InnerException: {exInsertar.InnerException.Message}");
                    }

                    return StatusCode(500, new
                    {
                        success = false,
                        error = $"Excepción capturada: {exInsertar.Message}",
                        type = exInsertar.GetType().Name,
                        innerError = exInsertar.InnerException?.Message
                    });
                }

                // VERIFICAR RESULTADO
                if (resultado == null)
                {
                    _logger.LogError("========================================");
                    _logger.LogError("❌ INSERTAR RETORNÓ NULL");
                    _logger.LogError("========================================");
                    _logger.LogError($"Error del Repositorio: '{errorCapturado}'");

                    string errorDetallado = string.IsNullOrEmpty(errorCapturado)
                        ? "Error desconocido en la base de datos"
                        : errorCapturado;

                    return StatusCode(500, new
                    {
                        success = false,
                        error = $"Error en base de datos: {errorDetallado}"
                    });
                }

                // ✅ ÉXITO - Generar ID si no existe
                int idFinal = resultado.Id > 0 ? resultado.Id : new Random().Next(100000, 999999);

                _logger.LogInformation("========================================");
                _logger.LogInformation($"✅ COTIZACIÓN GUARDADA EXITOSAMENTE");
                _logger.LogInformation($"✅ ID: {idFinal}");
                _logger.LogInformation($"✅ Nombre: {resultado.Nombre}");
                _logger.LogInformation($"✅ Correo: {resultado.Correo}");
                _logger.LogInformation("========================================");

                // ENVIAR EMAIL (sin bloquear respuesta)
                _ = Task.Run(async () =>
                {
                    try
                    {
                        _logger.LogInformation($"📧 Enviando email a: {resultado.Correo}");

                        // Asegurar que la cotización tiene ID para el email
                        if (resultado.Id <= 0)
                            resultado.Id = idFinal;

                        var emailEnviado = await _emailService.EnviarConfirmacionCotizacion(resultado);

                        if (emailEnviado)
                            _logger.LogInformation("✅ Email enviado exitosamente");
                        else
                            _logger.LogWarning("⚠️ Email no pudo ser enviado");
                    }
                    catch (Exception ex)
                    {
                        _logger.LogError($"❌ Error enviando email: {ex.Message}");
                    }
                });

                return Ok(new
                {
                    success = true,
                    id = idFinal,
                    nombre = resultado.Nombre,
                    correo = resultado.Correo,
                    estado = resultado.Estado,
                    message = "Cotización recibida exitosamente. Te contactaremos pronto.",
                    folio = $"#{idFinal:D6}"
                });
            }
            catch (Exception ex)
            {
                _logger.LogError("========================================");
                _logger.LogError("❌ EXCEPCIÓN EN POST");
                _logger.LogError("========================================");
                _logger.LogError($"Message: {ex.Message}");
                _logger.LogError($"Stack: {ex.StackTrace}");
                if (ex.InnerException != null)
                    _logger.LogError($"Inner: {ex.InnerException.Message}");
                _logger.LogError("========================================");

                return StatusCode(500, new
                {
                    success = false,
                    error = $"Error del servidor: {ex.Message}",
                    innerError = ex.InnerException?.Message,
                    stackTrace = ex.StackTrace
                });
            }
        }

        [HttpGet]
        public override ActionResult<List<Cotizacion>> Get()
        {
            try
            {
                var cotizaciones = _repositorio.ObtenerTodos();
                if (cotizaciones == null)
                    return Ok(new List<Cotizacion>());

                return Ok(cotizaciones.OrderByDescending(c => c.FechaAlta).ToList());
            }
            catch (Exception ex)
            {
                _logger.LogError($"Error en GET: {ex.Message}");
                return StatusCode(500, new { error = ex.Message });
            }
        }

        [HttpGet("test")]
        public ActionResult TestEndpoint()
        {
            try
            {
                var testConexion = _repositorio.ObtenerTodos();
                return Ok(new
                {
                    message = "Controller funcionando",
                    timestamp = DateTime.Now,
                    version = "7.0-PDF-Optional",
                    repositorioOK = testConexion != null,
                    totalRegistros = testConexion?.Count ?? 0,
                    error = _repositorio.Error ?? "Sin errores"
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { error = ex.Message });
            }
        }

        /// <summary>
        /// ENVIAR COTIZACIÓN AL CLIENTE (CON O SIN PDF ADJUNTO)
        /// El admin puede opcionalmente adjuntar un PDF con la cotización detallada
        /// </summary>
        [HttpPost("{id}/enviar-cotizacion")]
        [Consumes("multipart/form-data")]
        public async Task<ActionResult> EnviarCotizacion(int id, [FromForm] EnviarCotizacionFormDto dto)
        {
            try
            {
                _logger.LogInformation("========================================");
                _logger.LogInformation($"📨 EnviarCotizacion - ID: {id}");
                _logger.LogInformation($"📝 Respuesta length: {dto.Respuesta?.Length ?? 0}");
                _logger.LogInformation($"💰 Monto: {dto.MontoEstimado}");
                _logger.LogInformation($"📄 PDF: {dto.ArchivoPDF?.FileName ?? "ninguno"}");
                _logger.LogInformation("========================================");

                // ✅ USAR EL MÉTODO CORREGIDO
                var cotizacion = ObtenerCotizacionPorId(id);

                if (cotizacion == null)
                {
                    _logger.LogWarning($"❌ Cotización {id} no encontrada");
                    return NotFound(new { error = $"Cotización con ID {id} no encontrada" });
                }

                _logger.LogInformation($"✅ Cotización encontrada: {cotizacion.Nombre}");

                // VALIDAR RESPUESTA
                if (string.IsNullOrWhiteSpace(dto.Respuesta))
                {
                    _logger.LogWarning("❌ Respuesta vacía");
                    return BadRequest(new { error = "La respuesta es requerida" });
                }

                byte[] pdfBytes = null;
                string nombrePDF = null;

                // PROCESAR PDF SI EXISTE
                if (dto.ArchivoPDF != null && dto.ArchivoPDF.Length > 0)
                {
                    var extension = Path.GetExtension(dto.ArchivoPDF.FileName).ToLowerInvariant();
                    if (extension != ".pdf")
                    {
                        _logger.LogWarning($"⚠️ Archivo no es PDF: {extension}");
                        return BadRequest(new { error = "Solo se permiten archivos PDF" });
                    }

                    const int maxSize = 10 * 1024 * 1024; // 10MB
                    if (dto.ArchivoPDF.Length > maxSize)
                    {
                        _logger.LogWarning($"⚠️ Archivo muy grande: {dto.ArchivoPDF.Length} bytes");
                        return BadRequest(new { error = "El PDF no debe superar 10MB" });
                    }

                    _logger.LogInformation($"📎 Procesando PDF: {dto.ArchivoPDF.FileName} ({dto.ArchivoPDF.Length} bytes)");

                    using (var memoryStream = new MemoryStream())
                    {
                        await dto.ArchivoPDF.CopyToAsync(memoryStream);
                        pdfBytes = memoryStream.ToArray();
                    }

                    nombrePDF = dto.ArchivoPDF.FileName;
                    _logger.LogInformation($"✅ PDF convertido: {pdfBytes.Length} bytes");
                }

                // ACTUALIZAR COTIZACIÓN EN BD
                cotizacion.RespuestaAdmin = dto.Respuesta;
                cotizacion.MontoEstimado = dto.MontoEstimado;
                cotizacion.Estado = "Enviada";
                cotizacion.FechaCotizacion = DateTime.Now;
                cotizacion.UsuarioMod = "Admin";
                cotizacion.FechaMod = DateTime.Now;

                if (pdfBytes != null)
                {
                    cotizacion.NombreArchivoPDF = nombrePDF;
                }

                _logger.LogInformation("💾 Actualizando cotización en BD...");
                var actualizado = _repositorio.Actualizar(cotizacion);

                if (actualizado == null)
                {
                    var errorMsg = _repositorio.Error ?? "Error desconocido";
                    _logger.LogError($"❌ Error actualizando: {errorMsg}");
                    return StatusCode(500, new { error = errorMsg });
                }

                _logger.LogInformation("✅ Cotización actualizada en BD");

                // ENVIAR EMAIL
                bool emailEnviado = false;
                try
                {
                    if (pdfBytes != null && pdfBytes.Length > 0)
                    {
                        _logger.LogInformation($"📧 Enviando email CON PDF a {actualizado.Correo}...");
                        emailEnviado = await _emailService.EnviarCotizacionClienteConPDF(
                            actualizado,
                            dto.Respuesta,
                            dto.MontoEstimado,
                            pdfBytes,
                            nombrePDF
                        );
                    }
                    else
                    {
                        _logger.LogInformation($"📧 Enviando email SIN PDF a {actualizado.Correo}...");
                        emailEnviado = await _emailService.EnviarCotizacionCliente(
                            actualizado,
                            dto.Respuesta,
                            dto.MontoEstimado
                        );
                    }

                    if (emailEnviado)
                    {
                        _logger.LogInformation("✅ Email enviado exitosamente");
                    }
                    else
                    {
                        _logger.LogWarning("⚠️ Email no pudo ser enviado");
                    }
                }
                catch (Exception emailEx)
                {
                    _logger.LogError($"❌ Error enviando email: {emailEx.Message}");
                }

                _logger.LogInformation("✅ === PROCESO COMPLETADO ===");

                return Ok(new
                {
                    success = true,
                    message = pdfBytes != null
                        ? "Cotización enviada correctamente con PDF adjunto"
                        : "Cotización enviada correctamente",
                    emailEnviado,
                    pdfAdjunto = pdfBytes != null,
                    nombrePDF,
                    tamañoPDF = pdfBytes?.Length,
                    cotizacion = new
                    {
                        id = actualizado.Id,
                        nombre = actualizado.Nombre,
                        correo = actualizado.Correo,
                        estado = actualizado.Estado,
                        montoEstimado = actualizado.MontoEstimado,
                        fechaCotizacion = actualizado.FechaCotizacion
                    }
                });
            }
            catch (Exception ex)
            {
                _logger.LogError("========================================");
                _logger.LogError($"❌ EXCEPCIÓN en EnviarCotizacion");
                _logger.LogError($"Message: {ex.Message}");
                _logger.LogError($"StackTrace: {ex.StackTrace}");
                if (ex.InnerException != null)
                    _logger.LogError($"InnerException: {ex.InnerException.Message}");
                _logger.LogError("========================================");

                return StatusCode(500, new
                {
                    error = "Error al procesar la cotización",
                    details = ex.Message,
                    stackTrace = ex.StackTrace
                });
            }
        }


        [HttpPut("{id}/estado")]
        public ActionResult UpdateEstado(int id, [FromBody] EstadoCotizacionDto dto)
        {
            try
            {
                _logger.LogInformation($"📝 === PUT /api/Cotizacion/{id}/estado ===");
                _logger.LogInformation($"📝 Nuevo estado: '{dto.Estado}'");

                // ✅ USAR EL MÉTODO CORREGIDO
                var cotizacion = ObtenerCotizacionPorId(id);

                if (cotizacion == null)
                {
                    _logger.LogWarning($"❌ Cotización {id} no encontrada");
                    return NotFound(new { error = $"Cotización con ID {id} no encontrada" });
                }

                _logger.LogInformation($"✅ Cotización encontrada: {cotizacion.Nombre}");

                cotizacion.Estado = dto.Estado;
                cotizacion.UsuarioMod = "Admin";
                cotizacion.FechaMod = DateTime.Now;

                var resultado = _repositorio.Actualizar(cotizacion);
                if (resultado == null)
                {
                    var errorMsg = _repositorio.Error ?? "Error desconocido";
                    _logger.LogError($"❌ Error actualizando: {errorMsg}");
                    return StatusCode(500, new { error = errorMsg });
                }

                _logger.LogInformation("✅ Estado actualizado correctamente");

                return Ok(new { success = true, cotizacion = resultado });
            }
            catch (Exception ex)
            {
                _logger.LogError($"❌ Error: {ex.Message}");
                return StatusCode(500, new { error = ex.Message });
            }
        }

        [HttpPut("{id}/notas")]
        public ActionResult UpdateNotas(int id, [FromBody] NotasCotizacionDto dto)
        {
            try
            {
                var cotizacion = _repositorio.ObtenerPorId(id);
                if (cotizacion == null)
                    return NotFound(new { error = "Cotización no encontrada" });

                cotizacion.NotasInternas = dto.NotasInternas;
                cotizacion.UsuarioMod = "Admin";
                cotizacion.FechaMod = DateTime.Now;

                var resultado = _repositorio.Actualizar(cotizacion);
                if (resultado == null)
                    return StatusCode(500, new { error = _repositorio.Error });

                return Ok(new { success = true, cotizacion = resultado });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { error = ex.Message });
            }
        }
    }

    // ==================== DTOs ====================

    public class EstadoCotizacionDto
    {
        public string Estado { get; set; }
    }

    public class NotasCotizacionDto
    {
        public string NotasInternas { get; set; }
    }

    /// <summary>
    /// DTO para enviar cotización con archivo PDF opcional
    /// </summary>
    public class EnviarCotizacionFormDto
    {
        public string Respuesta { get; set; }
        public decimal? MontoEstimado { get; set; }
        public IFormFile? ArchivoPDF { get; set; }  // ← PDF OPCIONAL del admin
    }
}