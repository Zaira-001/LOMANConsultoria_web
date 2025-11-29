using BIZ;
using COMMON.Entidades;
using COMMON.Interfaces;
using Microsoft.AspNetCore.Mvc;

namespace WebAPI.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class CitaController : GenericController<Cita>
    {
        private readonly ILogger<CitaController> _logger;
        private readonly CitaEmailService _emailService;
        private readonly IHttpContextAccessor _httpContextAccessor;

        public CitaController(
            IDB<Cita> repositorio,
            ILogger<CitaController> logger,
            IHttpContextAccessor httpContextAccessor)
            : base(repositorio)
        {
            _logger = logger ?? throw new ArgumentNullException(nameof(logger));
            _httpContextAccessor = httpContextAccessor ?? throw new ArgumentNullException(nameof(httpContextAccessor));
            _emailService = new CitaEmailService();

            // Configurar URL base desde el request actual
            var request = _httpContextAccessor.HttpContext?.Request;
            if (request != null)
            {
                var baseUrl = $"{request.Scheme}://{request.Host}";
                Environment.SetEnvironmentVariable("ADMIN_PANEL_URL", $"{baseUrl}/admin/citas");
                _logger.LogInformation($"✅ URL base configurada: {baseUrl}/admin/citas");
            }

            _logger.LogInformation("✅ CitaController inicializado con servicio de email");
        }

        // ============================================
        // 📝 POST: Crear nueva cita + NOTIFICACIONES AUTOMÁTICAS
        // ============================================
        [HttpPost]
        public override ActionResult<Cita> Post([FromBody] Cita entidad)
        {
            try
            {
                _logger.LogInformation($"📝 POST cita recibido: {entidad?.NombreCompleto}");

                // Validaciones básicas
                if (entidad == null)
                    return BadRequest(new { error = "Los datos de la cita son inválidos" });

                if (string.IsNullOrWhiteSpace(entidad.NombreCompleto))
                    return BadRequest(new { error = "El nombre completo es requerido" });

                if (string.IsNullOrWhiteSpace(entidad.Email))
                    return BadRequest(new { error = "El email es requerido" });

                if (string.IsNullOrWhiteSpace(entidad.Telefono))
                    return BadRequest(new { error = "El teléfono es requerido" });

                // Validar fecha
                if (entidad.FechaHora < DateTime.Now.AddHours(2))
                    return BadRequest(new { error = "La cita debe ser al menos 2 horas en el futuro" });

                var hora = entidad.FechaHora.Hour;
                if (hora < 9 || hora >= 18)
                    return BadRequest(new { error = "Las citas solo pueden ser entre 9:00 AM y 6:00 PM" });

                var dia = entidad.FechaHora.DayOfWeek;
                if (dia == DayOfWeek.Saturday || dia == DayOfWeek.Sunday)
                    return BadRequest(new { error = "Las citas solo pueden ser en días laborables" });

                // Verificar conflictos
                var citasExistentes = _repositorio.ObtenerTodos();
                var conflicto = citasExistentes?.Any(c =>
                    c.Estado != "Cancelada" &&
                    Math.Abs((c.FechaHora - entidad.FechaHora).TotalMinutes) < 45
                );

                if (conflicto == true)
                    return BadRequest(new { error = "Este horario ya está ocupado" });

                // Establecer valores por defecto
                entidad.Estado = "Pendiente";
                entidad.UsuarioAlta = "WebClient";
                entidad.UsuarioMod = "WebClient";
                entidad.FechaAlta = DateTime.Now;
                entidad.FechaMod = DateTime.Now;

                // Guardar en BD
                var resultado = _repositorio.Insertar(entidad);

                if (resultado == null)
                {
                    var errorDb = _repositorio.Error ?? "Error al guardar en la base de datos";
                    _logger.LogError($"❌ Error al insertar en BD: {errorDb}");
                    return StatusCode(500, new { error = errorDb });
                }

                _logger.LogInformation($"✅ Cita guardada con ID: {resultado.Id}");

                // ============================================
                // 🔔 ENVIAR NOTIFICACIONES INMEDIATAMENTE
                // ============================================
                var notificacion = new NotificacionCita
                {
                    NombreCliente = resultado.NombreCompleto,
                    EmailCliente = resultado.Email,
                    TelefonoCliente = resultado.Telefono,
                    FechaHora = resultado.FechaHora,
                    ServicioInteres = resultado.ServicioInteres ?? "Consultoría General",
                    Modalidad = resultado.Modalidad ?? "Presencial",
                    Estado = resultado.Estado,
                    NotasAdmin = ""
                };

                _logger.LogInformation("📧 === INICIANDO ENVÍO DE NOTIFICACIONES ===");

                // Enviar emails en segundo plano
                _ = Task.Run(async () =>
                {
                    try
                    {
                        _logger.LogInformation("📧 [1/2] Enviando confirmación al CLIENTE...");
                        var confirmacionCliente = await _emailService.EnviarConfirmacionCliente(notificacion);

                        if (confirmacionCliente)
                        {
                            _logger.LogInformation($"✅ [1/2] Confirmación enviada al cliente: {resultado.Email}");
                        }
                        else
                        {
                            _logger.LogWarning($"⚠️ [1/2] No se pudo enviar confirmación al cliente: {resultado.Email}");
                        }

                        await Task.Delay(1000);

                        _logger.LogInformation("📧 [2/2] Enviando notificación al ADMINISTRADOR...");
                        var notificacionAdmin = await _emailService.EnviarNotificacionNuevaCitaAdmin(notificacion);

                        if (notificacionAdmin)
                        {
                            _logger.LogInformation("✅ [2/2] Notificación enviada al administrador");
                        }
                        else
                        {
                            _logger.LogWarning("⚠️ [2/2] No se pudo enviar notificación al administrador");
                        }

                        _logger.LogInformation("✅ === NOTIFICACIONES COMPLETADAS ===");
                    }
                    catch (Exception emailEx)
                    {
                        _logger.LogError($"❌ Error en proceso de notificaciones: {emailEx.Message}");
                        _logger.LogError($"Stack: {emailEx.StackTrace}");
                    }
                });

                return Ok(new
                {
                    id = resultado.Id,
                    nombreCompleto = resultado.NombreCompleto,
                    fechaHora = resultado.FechaHora,
                    estado = resultado.Estado,
                    message = "Cita creada exitosamente. Recibirás un email de confirmación.",
                    notificacionesEnviadas = true
                });
            }
            catch (Exception ex)
            {
                _logger.LogError($"❌ Error en POST: {ex.Message}");
                _logger.LogError($"Stack: {ex.StackTrace}");
                return StatusCode(500, new { error = ex.Message });
            }
        }

        // ============================================
        // 📧 ENDPOINT: Enviar recordatorios
        // ============================================
        [HttpPost("enviar-recordatorios")]
        public async Task<ActionResult> EnviarRecordatoriosCitasPendientes()
        {
            try
            {
                _logger.LogInformation("⏰ === INICIANDO ENVÍO DE RECORDATORIOS ===");

                var todasCitas = _repositorio.ObtenerTodos();
                if (todasCitas == null || !todasCitas.Any())
                {
                    _logger.LogWarning("⚠️ No hay citas en el sistema");
                    return Ok(new { message = "No hay citas registradas", enviados = 0 });
                }

                var ahora = DateTime.Now;
                var limiteInferior = ahora;
                var limiteSuperior = ahora.AddDays(3);

                var citasPendientes = todasCitas
                    .Where(c =>
                        c.Estado == "Pendiente" &&
                        c.FechaHora >= limiteInferior &&
                        c.FechaHora <= limiteSuperior &&
                        !string.IsNullOrWhiteSpace(c.Email)
                    )
                    .OrderBy(c => c.FechaHora)
                    .ToList();

                _logger.LogInformation($"📊 Citas pendientes encontradas: {citasPendientes.Count}");

                if (!citasPendientes.Any())
                {
                    _logger.LogInformation("✅ No hay citas pendientes próximas");
                    return Ok(new { message = "No hay citas pendientes en los próximos 3 días", enviados = 0 });
                }

                int emailsEnviados = 0;
                int emailsFallidos = 0;

                foreach (var cita in citasPendientes)
                {
                    try
                    {
                        var notificacion = new NotificacionCita
                        {
                            NombreCliente = cita.NombreCompleto,
                            EmailCliente = cita.Email,
                            TelefonoCliente = cita.Telefono,
                            FechaHora = cita.FechaHora,
                            ServicioInteres = cita.ServicioInteres ?? "Consultoría General",
                            Modalidad = cita.Modalidad ?? "Presencial",
                            Estado = cita.Estado,
                            NotasAdmin = cita.NotasAdmin ?? ""
                        };

                        _logger.LogInformation($"📧 Enviando recordatorio a: {cita.NombreCompleto} ({cita.Email})");

                        var enviado = await _emailService.EnviarRecordatorioCitaPendiente(notificacion);

                        if (enviado)
                        {
                            emailsEnviados++;
                            _logger.LogInformation($"✅ Recordatorio enviado: {cita.NombreCompleto}");
                        }
                        else
                        {
                            emailsFallidos++;
                            _logger.LogWarning($"⚠️ No se pudo enviar recordatorio a: {cita.NombreCompleto}");
                        }

                        await Task.Delay(1000);
                    }
                    catch (Exception ex)
                    {
                        emailsFallidos++;
                        _logger.LogError($"❌ Error enviando recordatorio a {cita.NombreCompleto}: {ex.Message}");
                    }
                }

                _logger.LogInformation($"✅ === RECORDATORIOS COMPLETADOS ===");
                _logger.LogInformation($"✅ Exitosos: {emailsEnviados}/{citasPendientes.Count}");

                return Ok(new
                {
                    message = "Proceso de recordatorios completado",
                    totalCitasPendientes = citasPendientes.Count,
                    emailsEnviados = emailsEnviados,
                    emailsFallidos = emailsFallidos
                });
            }
            catch (Exception ex)
            {
                _logger.LogError($"❌ Error: {ex.Message}");
                return StatusCode(500, new { error = ex.Message });
            }
        }

        // ============================================
        // 🔄 PUT: Actualizar estado
        // ============================================
        [HttpPut("{id}/estado")]
        public async Task<ActionResult> UpdateEstado(int id, [FromBody] EstadoCitaDto dto)
        {
            try
            {
                _logger.LogInformation($"📝 === PUT /api/Cita/{id}/estado ===");

                var cita = ObtenerCitaPorId(id);
                if (cita == null)
                {
                    _logger.LogWarning($"❌ Cita {id} no encontrada");
                    return NotFound(new { error = $"Cita con ID {id} no encontrada" });
                }

                var estadoAnterior = cita.Estado;
                cita.Estado = dto.Estado;
                cita.NotasAdmin = dto.NotasAdmin ?? "";
                cita.UsuarioMod = "Admin";
                cita.FechaMod = DateTime.Now;

                var resultado = ActualizarEstadoCitaDirecto(cita);

                if (!resultado)
                {
                    var errorMsg = _repositorio.Error ?? "Error desconocido al actualizar";
                    _logger.LogError($"❌ Error actualizando: {errorMsg}");
                    return StatusCode(500, new { error = errorMsg });
                }

                _logger.LogInformation("✅ Cita actualizada exitosamente");

                // Enviar notificación al cliente
                bool emailEnviado = false;
                if (estadoAnterior != dto.Estado && !string.IsNullOrWhiteSpace(cita.Email))
                {
                    _logger.LogInformation($"📧 Enviando notificación a: {cita.Email}");

                    string enlaceMeet = "";
                    if (cita.Modalidad?.ToLower().Contains("virtual") == true)
                    {
                        enlaceMeet = MeetLinkGenerator.GenerarEnlaceMeet(cita.Id);
                    }

                    var notificacion = new NotificacionCita
                    {
                        NombreCliente = cita.NombreCompleto,
                        EmailCliente = cita.Email,
                        TelefonoCliente = cita.Telefono,
                        FechaHora = cita.FechaHora,
                        ServicioInteres = cita.ServicioInteres ?? "Consultoría General",
                        Modalidad = cita.Modalidad ?? "Presencial",
                        Estado = dto.Estado,
                        NotasAdmin = dto.NotasAdmin ?? "",
                        EnlaceMeet = enlaceMeet
                    };

                    _ = Task.Run(async () =>
                    {
                        try
                        {
                            var enviado = await _emailService.EnviarNotificacionCita(notificacion);
                            if (enviado)
                            {
                                _logger.LogInformation($"✅ Email enviado a: {cita.Email}");
                            }
                        }
                        catch (Exception emailEx)
                        {
                            _logger.LogError($"❌ Error enviando email: {emailEx.Message}");
                        }
                    });

                    emailEnviado = true;
                }

                return Ok(new
                {
                    success = true,
                    message = "Estado actualizado correctamente",
                    emailEnviado = emailEnviado
                });
            }
            catch (Exception ex)
            {
                _logger.LogError($"❌ ERROR: {ex.Message}");
                return StatusCode(500, new { error = ex.Message });
            }
        }

        // ============================================
        // MÉTODOS AUXILIARES
        // ============================================

        private Cita? ObtenerCitaPorId(int id)
        {
            try
            {
                var todasLasCitas = _repositorio.ObtenerTodos();
                return todasLasCitas?.FirstOrDefault(c => c.Id == id);
            }
            catch (Exception ex)
            {
                _logger.LogError($"❌ Error buscando cita: {ex.Message}");
                return null;
            }
        }

        private bool ActualizarEstadoCitaDirecto(Cita cita)
        {
            try
            {
                using (var conexion = new Npgsql.NpgsqlConnection(ObtenerCadenaConexion()))
                {
                    conexion.Open();

                    var sql = @"
                        UPDATE Cita 
                        SET Estado = @Estado, 
                            NotasAdmin = @NotasAdmin, 
                            UsuarioMod = @UsuarioMod, 
                            FechaMod = @FechaMod 
                        WHERE Id = @Id";

                    using (var comando = new Npgsql.NpgsqlCommand(sql, conexion))
                    {
                        comando.Parameters.AddWithValue("@Estado", cita.Estado);
                        comando.Parameters.AddWithValue("@NotasAdmin", cita.NotasAdmin ?? "");
                        comando.Parameters.AddWithValue("@UsuarioMod", cita.UsuarioMod ?? "Admin");
                        comando.Parameters.AddWithValue("@FechaMod", cita.FechaMod);
                        comando.Parameters.AddWithValue("@Id", cita.Id);

                        var filasAfectadas = comando.ExecuteNonQuery();
                        return filasAfectadas > 0;
                    }
                }
            }
            catch (Exception ex)
            {
                _logger.LogError($"❌ Error en ActualizarEstadoCitaDirecto: {ex.Message}");
                return false;
            }
        }

        private string ObtenerCadenaConexion()
        {
            var configuration = new ConfigurationBuilder()
                .SetBasePath(Directory.GetCurrentDirectory())
                .AddJsonFile("appsettings.json", optional: false)
                .Build();

            return configuration.GetConnectionString("DefaultConnection")
                ?? Environment.GetEnvironmentVariable("DATABASE_URL")
                ?? throw new InvalidOperationException("No se encontró cadena de conexión");
        }

        [HttpGet("available-slots-by-day")]
        public ActionResult<Dictionary<string, List<string>>> GetAvailableSlotsByDay(
            [FromQuery] DateTime startDate,
            [FromQuery] int days = 14)
        {
            try
            {
                if (startDate < DateTime.Now.Date)
                    startDate = DateTime.Now.Date;

                if (days <= 0 || days > 90)
                    days = 90;

                var slotsByDay = GenerateAvailableSlots(startDate, days);
                return Ok(slotsByDay);
            }
            catch (Exception ex)
            {
                _logger.LogError($"Error en GetAvailableSlotsByDay: {ex.Message}");
                return StatusCode(500, new { error = ex.Message });
            }
        }

        [HttpGet("by-date-range")]
        public ActionResult<List<Cita>> GetByDateRange(
            [FromQuery] DateTime startDate,
            [FromQuery] DateTime endDate)
        {
            try
            {
                var todasCitas = _repositorio.ObtenerTodos();

                if (todasCitas == null)
                    return Ok(new List<Cita>());

                var citasRango = todasCitas
                    .Where(c => c.FechaHora >= startDate && c.FechaHora <= endDate)
                    .OrderBy(c => c.FechaHora)
                    .ToList();

                return Ok(citasRango);
            }
            catch (Exception ex)
            {
                _logger.LogError($"Error en GetByDateRange: {ex.Message}");
                return StatusCode(500, new { error = ex.Message });
            }
        }

        private Dictionary<string, List<string>> GenerateAvailableSlots(DateTime startDate, int days)
        {
            var slots = new Dictionary<string, List<string>>();
            var citasExistentes = _repositorio.ObtenerTodos() ?? new List<Cita>();

            for (int i = 0; i < days; i++)
            {
                var date = startDate.AddDays(i);

                if (date.DayOfWeek != DayOfWeek.Saturday &&
                    date.DayOfWeek != DayOfWeek.Sunday)
                {
                    var dateStr = date.ToString("yyyy-MM-dd");
                    var availableSlots = new List<string>();

                    for (int hour = 9; hour < 18; hour++)
                    {
                        if (hour == 14) continue;

                        for (int minute = 0; minute < 60; minute += 45)
                        {
                            var slotTime = new DateTime(date.Year, date.Month, date.Day, hour, minute, 0);

                            var ocupado = citasExistentes.Any(c =>
                                c.Estado != "Cancelada" &&
                                Math.Abs((c.FechaHora - slotTime).TotalMinutes) < 45
                            );

                            if (!ocupado)
                            {
                                availableSlots.Add($"{hour:D2}:{minute:D2}");
                            }
                        }
                    }

                    if (availableSlots.Any())
                        slots[dateStr] = availableSlots;
                }
            }

            return slots;
        }

        [HttpGet("test")]
        public ActionResult TestEndpoint()
        {
            var request = _httpContextAccessor.HttpContext?.Request;
            var baseUrl = request != null ? $"{request.Scheme}://{request.Host}" : "unknown";

            return Ok(new
            {
                message = "CitaController con detección automática de URL",
                timestamp = DateTime.Now,
                version = "6.0-Auto-URL",
                detectedBaseUrl = baseUrl,
                adminPanelUrl = $"{baseUrl}/admin/citas",
                emailServiceActive = _emailService != null,
                brevoApiKeyConfigured = !string.IsNullOrEmpty(Environment.GetEnvironmentVariable("BREVO_API_KEY"))
            });
        }
    }

    public class EstadoCitaDto
    {
        public string Estado { get; set; }
        public string NotasAdmin { get; set; }
    }
}