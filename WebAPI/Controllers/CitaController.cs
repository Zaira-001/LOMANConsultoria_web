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

        public CitaController(IDB<Cita> repositorio, ILogger<CitaController> logger)
            : base(repositorio)
        {
            _logger = logger ?? throw new ArgumentNullException(nameof(logger));
            _emailService = new CitaEmailService();
            _logger.LogInformation("CitaController inicializado con servicio de email");
        }

        // ✅ MÉTODO HELPER PARA BUSCAR POR ID CORRECTAMENTE
        private Cita? ObtenerCitaPorId(int id)
        {
            try
            {
                _logger.LogInformation($"🔍 Buscando cita ID: {id}");

                var todasLasCitas = _repositorio.ObtenerTodos();

                if (todasLasCitas == null || !todasLasCitas.Any())
                {
                    _logger.LogWarning("❌ No hay citas en la base de datos");
                    return null;
                }

                _logger.LogInformation($"📊 Total citas en DB: {todasLasCitas.Count}");

                var cita = todasLasCitas.FirstOrDefault(c => c.Id == id);

                if (cita == null)
                {
                    _logger.LogWarning($"❌ Cita {id} no encontrada");
                    _logger.LogInformation($"📋 IDs disponibles: {string.Join(", ", todasLasCitas.Select(c => c.Id))}");
                }
                else
                {
                    _logger.LogInformation($"✅ Cita encontrada: {cita.NombreCompleto}, Fecha: {cita.FechaHora:yyyy-MM-dd HH:mm}");
                }

                return cita;
            }
            catch (Exception ex)
            {
                _logger.LogError($"❌ Error buscando cita: {ex.Message}");
                return null;
            }
        }

        [HttpPost]
        public override ActionResult<Cita> Post([FromBody] Cita entidad)
        {
            try
            {
                _logger.LogInformation($"POST cita recibido: {entidad?.NombreCompleto}");

                if (entidad == null)
                    return BadRequest(new { error = "Los datos de la cita son inválidos" });

                if (string.IsNullOrWhiteSpace(entidad.NombreCompleto))
                    return BadRequest(new { error = "El nombre completo es requerido" });

                if (string.IsNullOrWhiteSpace(entidad.Email))
                    return BadRequest(new { error = "El email es requerido" });

                if (string.IsNullOrWhiteSpace(entidad.Telefono))
                    return BadRequest(new { error = "El teléfono es requerido" });

                if (entidad.FechaHora < DateTime.Now.AddHours(2))
                    return BadRequest(new { error = "La cita debe ser al menos 2 horas en el futuro" });

                var hora = entidad.FechaHora.Hour;
                if (hora < 9 || hora >= 18)
                    return BadRequest(new { error = "Las citas solo pueden ser entre 9:00 AM y 6:00 PM" });

                var dia = entidad.FechaHora.DayOfWeek;
                if (dia == DayOfWeek.Saturday || dia == DayOfWeek.Sunday)
                    return BadRequest(new { error = "Las citas solo pueden ser en días laborables" });

                var citasExistentes = _repositorio.ObtenerTodos();
                var conflicto = citasExistentes?.Any(c =>
                    c.Estado != "Cancelada" &&
                    Math.Abs((c.FechaHora - entidad.FechaHora).TotalMinutes) < 45
                );

                if (conflicto == true)
                    return BadRequest(new { error = "Este horario ya está ocupado" });

                entidad.Estado = "Pendiente";
                entidad.UsuarioAlta = "WebClient";
                entidad.UsuarioMod = "WebClient";
                entidad.FechaAlta = DateTime.Now;
                entidad.FechaMod = DateTime.Now;

                var resultado = _repositorio.Insertar(entidad);

                if (resultado == null)
                {
                    var errorDb = _repositorio.Error ?? "Error al guardar en la base de datos";
                    _logger.LogError($"Error al insertar en BD: {errorDb}");
                    return StatusCode(500, new { error = errorDb });
                }

                _logger.LogInformation($"Cita guardada con ID: {resultado.Id}");

                return Ok(new
                {
                    id = resultado.Id,
                    nombreCompleto = resultado.NombreCompleto,
                    fechaHora = resultado.FechaHora,
                    estado = resultado.Estado,
                    message = "Cita creada exitosamente"
                });
            }
            catch (Exception ex)
            {
                _logger.LogError($"Error en POST: {ex.Message}");
                return StatusCode(500, new { error = ex.Message });
            }
        }

        [HttpGet("available-slots-by-day")]
        public ActionResult<Dictionary<string, List<string>>> GetAvailableSlotsByDay(
            [FromQuery] DateTime startDate,
            [FromQuery] int days = 14)
        {
            try
            {
                _logger.LogInformation($"Recibiendo startDate: {startDate:yyyy-MM-dd}, days: {days}");

                if (startDate < DateTime.Now.Date)
                    startDate = DateTime.Now.Date;

                if (days <= 0 || days > 90)
                    days = 90;

                var slotsByDay = GenerateAvailableSlots(startDate, days);

                _logger.LogInformation($"Generados {slotsByDay.Count} días con slots");

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

        [HttpPut("{id}/estado")]
        public async Task<ActionResult> UpdateEstado(int id, [FromBody] EstadoCitaDto dto)
        {
            try
            {
                _logger.LogInformation($"📝 === PUT /api/Cita/{id}/estado ===");
                _logger.LogInformation($"📝 Nuevo estado: '{dto.Estado}'");
                _logger.LogInformation($"📝 Notas: '{dto.NotasAdmin ?? "sin notas"}'");

                // ✅ USAR EL MÉTODO CORREGIDO
                var cita = ObtenerCitaPorId(id);

                if (cita == null)
                {
                    _logger.LogWarning($"❌ Cita {id} no encontrada");
                    return NotFound(new { error = $"Cita con ID {id} no encontrada" });
                }

                var estadoAnterior = cita.Estado;
                _logger.LogInformation($"✅ Cita encontrada: {cita.NombreCompleto}");
                _logger.LogInformation($"📊 Estado anterior: '{estadoAnterior}' -> Nuevo estado: '{dto.Estado}'");

                // Actualizar cita
                cita.Estado = dto.Estado;
                cita.NotasAdmin = dto.NotasAdmin ?? "";
                cita.UsuarioMod = "Admin";
                cita.FechaMod = DateTime.Now;

                _logger.LogInformation("💾 Guardando cambios en BD...");

                // ✅ SOLUCIÓN: Actualizar directamente sin validación completa
                var resultado = ActualizarEstadoCitaDirecto(cita);

                if (!resultado)
                {
                    var errorMsg = _repositorio.Error ?? "Error desconocido al actualizar";
                    _logger.LogError($"❌ Error actualizando en BD: {errorMsg}");
                    return StatusCode(500, new { error = errorMsg });
                }

                _logger.LogInformation("✅ Cita actualizada exitosamente en BD");

                // ENVIAR EMAIL DE NOTIFICACIÓN
                bool emailEnviado = false;
                if (estadoAnterior != dto.Estado && !string.IsNullOrWhiteSpace(cita.Email))
                {
                    _logger.LogInformation($"📧 Estado cambió, enviando email a: {cita.Email}");

                    // Generar enlace de Meet si es cita virtual
                    string enlaceMeet = "";
                    if (cita.Modalidad?.ToLower().Contains("virtual") == true)
                    {
                        enlaceMeet = MeetLinkGenerator.GenerarEnlaceMeet(cita.Id);
                        _logger.LogInformation($"🔗 Enlace Meet generado: {enlaceMeet}");
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

                    // Enviar email en segundo plano
                    _ = Task.Run(async () =>
                    {
                        try
                        {
                            var enviado = await _emailService.EnviarNotificacionCita(notificacion);
                            if (enviado)
                            {
                                _logger.LogInformation($"✅ Email enviado exitosamente a: {cita.Email}");
                            }
                            else
                            {
                                _logger.LogWarning($"⚠️ No se pudo enviar email a: {cita.Email}");
                            }
                        }
                        catch (Exception emailEx)
                        {
                            _logger.LogError($"❌ Error enviando email: {emailEx.Message}");
                        }
                    });

                    emailEnviado = true;
                    _logger.LogInformation("📨 Email programado para envío en segundo plano");
                }
                else if (string.IsNullOrWhiteSpace(cita.Email))
                {
                    _logger.LogWarning("⚠️ No se puede enviar email: cliente sin correo electrónico");
                }
                else
                {
                    _logger.LogInformation("ℹ️ Estado no cambió, no se envía email");
                }

                _logger.LogInformation("✅ === ACTUALIZACIÓN COMPLETADA ===");

                return Ok(new
                {
                    success = true,
                    message = "Estado actualizado correctamente",
                    cita = new
                    {
                        id = cita.Id,
                        nombreCompleto = cita.NombreCompleto,
                        fechaHora = cita.FechaHora,
                        estado = cita.Estado,
                        modalidad = cita.Modalidad,
                        notasAdmin = cita.NotasAdmin
                    },
                    emailEnviado = emailEnviado,
                    timestamp = DateTime.Now
                });
            }
            catch (Exception ex)
            {
                _logger.LogError($"🔥 ERROR: {ex.Message}");
                _logger.LogError($"Stack trace: {ex.StackTrace}");
                return StatusCode(500, new
                {
                    error = "Error interno del servidor",
                    message = ex.Message,
                    timestamp = DateTime.Now
                });
            }
        }

        private Dictionary<string, List<string>> GenerateAvailableSlots(DateTime startDate, int days)
        {
            var slots = new Dictionary<string, List<string>>();
            var citasExistentes = _repositorio.ObtenerTodos() ?? new List<Cita>();

            _logger.LogInformation($"Generando slots desde {startDate:yyyy-MM-dd} por {days} días");

            for (int i = 0; i < days; i++)
            {
                var date = startDate.AddDays(i);

                // Solo días laborables
                if (date.DayOfWeek != DayOfWeek.Saturday &&
                    date.DayOfWeek != DayOfWeek.Sunday)
                {
                    var dateStr = date.ToString("yyyy-MM-dd");
                    var availableSlots = new List<string>();

                    for (int hour = 9; hour < 18; hour++)
                    {
                        if (hour == 14) continue; // Hora de comida

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

            _logger.LogInformation($"Slots generados: {slots.Count} días disponibles");
            return slots;
        }

        // ✅ MÉTODO PRIVADO: Actualizar estado sin pasar por validación completa
        private bool ActualizarEstadoCitaDirecto(Cita cita)
        {
            try
            {
                _logger.LogInformation($"🔄 Actualizando estado directamente para cita ID: {cita.Id}");

                // Usar System.Data para ejecutar SQL directo
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

                        _logger.LogInformation($"✅ Filas afectadas: {filasAfectadas}");

                        return filasAfectadas > 0;
                    }
                }
            }
            catch (Exception ex)
            {
                _logger.LogError($"❌ Error en ActualizarEstadoCitaDirecto: {ex.Message}");
                _logger.LogError($"Stack trace: {ex.StackTrace}");
                return false;
            }
        }

        // Método helper para obtener cadena de conexión
        private string ObtenerCadenaConexion()
        {
            // Esto debería venir de tu configuración
            // Ajusta según tu implementación
            var configuration = new ConfigurationBuilder()
                .SetBasePath(Directory.GetCurrentDirectory())
                .AddJsonFile("appsettings.json", optional: false)
                .Build();

            return configuration.GetConnectionString("DefaultConnection")
                ?? Environment.GetEnvironmentVariable("DATABASE_URL")
                ?? throw new InvalidOperationException("No se encontró cadena de conexión");
        }

        [HttpGet("test")]
        public ActionResult TestEndpoint()
        {
            return Ok(new
            {
                message = "CitaController funcionando correctamente",
                timestamp = DateTime.Now,
                version = "3.1-Fix-Validacion",
                emailServiceActive = _emailService != null
            });
        }
    }

    public class EstadoCitaDto
    {
        public string Estado { get; set; }
        public string NotasAdmin { get; set; }
    }
}