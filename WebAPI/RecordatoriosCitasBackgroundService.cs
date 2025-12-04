using BIZ;
using COMMON.Entidades;
using COMMON.Interfaces;

namespace WebAPI
{
    public class RecordatoriosCitasBackgroundService : BackgroundService
    {
        private readonly ILogger<RecordatoriosCitasBackgroundService> _logger;
        private readonly IServiceScopeFactory _serviceScopeFactory;

        // ⏰ Configuración de intervalos
        private readonly TimeSpan _intervaloGeneral = TimeSpan.FromHours(12); // Cada 12 horas
        private readonly TimeSpan _intervaloProximas = TimeSpan.FromHours(6);  // Cada 6 horas para citas próximas

        public RecordatoriosCitasBackgroundService(
            ILogger<RecordatoriosCitasBackgroundService> logger,
            IServiceScopeFactory serviceScopeFactory)
        {
            _logger = logger;
            _serviceScopeFactory = serviceScopeFactory;
        }
        
        protected override async Task ExecuteAsync(CancellationToken stoppingToken)
        {
            _logger.LogInformation("🚀 === SERVICIO DE RECORDATORIOS INTELIGENTE INICIADO ===");
            _logger.LogInformation($"⏰ Intervalo general: cada {_intervaloGeneral.TotalHours}h");
            _logger.LogInformation($"⚡ Intervalo citas próximas: cada {_intervaloProximas.TotalHours}h");

            while (!stoppingToken.IsCancellationRequested)
            {
                try
                {
                    _logger.LogInformation("🔄 === INICIANDO CICLO DE NOTIFICACIONES ===");
                    _logger.LogInformation($"📅 Fecha/Hora actual: {DateTime.Now:dd/MM/yyyy HH:mm:ss}");

                    await ProcesarNotificaciones();

                    _logger.LogInformation($"✅ Ciclo completado. Próxima ejecución en {_intervaloGeneral.TotalHours}h");

                    await Task.Delay(_intervaloGeneral, stoppingToken);
                }
                catch (OperationCanceledException)
                {
                    _logger.LogInformation("⚠️ Servicio detenido por solicitud");
                    break;
                }
                catch (Exception ex)
                {
                    _logger.LogError($"❌ Error en ciclo: {ex.Message}");
                    _logger.LogError($"Stack: {ex.StackTrace}");

                    await Task.Delay(TimeSpan.FromHours(1), stoppingToken);
                }
            }
        }

        private async Task ProcesarNotificaciones()
        {
            using var scope = _serviceScopeFactory.CreateScope();
            var repositorio = scope.ServiceProvider.GetRequiredService<IDB<Cita>>();
            var emailService = new CitaEmailService();

            var todasCitas = repositorio.ObtenerTodos();

            if (todasCitas == null || !todasCitas.Any())
            {
                _logger.LogInformation("📭 No hay citas en el sistema");
                return;
            }

            var ahora = DateTime.Now;

            // ============================================
            // 1️⃣ CITAS CRÍTICAS (próximas 24 horas)
            // ============================================
            var citasCriticas = todasCitas
                .Where(c =>
                    c.Estado == "Pendiente" &&
                    c.FechaHora >= ahora &&
                    c.FechaHora <= ahora.AddHours(24) &&
                    !string.IsNullOrWhiteSpace(c.Email)
                )
                .OrderBy(c => c.FechaHora)
                .ToList();

            _logger.LogInformation($"🚨 Citas CRÍTICAS (próximas 24h): {citasCriticas.Count}");

            foreach (var cita in citasCriticas)
            {
                await EnviarNotificacionesCitaProxima(cita, emailService, "CRÍTICA");
                await Task.Delay(2000); // 2 segundos entre emails
            }

            // ============================================
            // 2️⃣ CITAS PRÓXIMAS (24-48 horas)
            // ============================================
            var citasProximas = todasCitas
                .Where(c =>
                    c.Estado == "Pendiente" &&
                    c.FechaHora > ahora.AddHours(24) &&
                    c.FechaHora <= ahora.AddHours(48) &&
                    !string.IsNullOrWhiteSpace(c.Email)
                )
                .OrderBy(c => c.FechaHora)
                .ToList();

            _logger.LogInformation($"⚠️ Citas PRÓXIMAS (24-48h): {citasProximas.Count}");

            foreach (var cita in citasProximas)
            {
                await EnviarNotificacionesCitaProxima(cita, emailService, "PRÓXIMA");
                await Task.Delay(1500);
            }

            // ============================================
            // 3️⃣ RECORDATORIOS GENERALES (48-72 horas)
            // ============================================
            var citasGenerales = todasCitas
                .Where(c =>
                    c.Estado == "Pendiente" &&
                    c.FechaHora > ahora.AddHours(48) &&
                    c.FechaHora <= ahora.AddHours(72) &&
                    !string.IsNullOrWhiteSpace(c.Email)
                )
                .OrderBy(c => c.FechaHora)
                .ToList();

            _logger.LogInformation($"📅 Citas GENERALES (48-72h): {citasGenerales.Count}");

            foreach (var cita in citasGenerales)
            {
                await EnviarRecordatorioGeneral(cita, emailService);
                await Task.Delay(1000);
            }

            // ============================================
            // 📊 RESUMEN FINAL
            // ============================================
            _logger.LogInformation("📊 === RESUMEN DE NOTIFICACIONES ===");
            _logger.LogInformation($"🚨 Críticas: {citasCriticas.Count}");
            _logger.LogInformation($"⚠️ Próximas: {citasProximas.Count}");
            _logger.LogInformation($"📅 Generales: {citasGenerales.Count}");
            _logger.LogInformation($"✅ Total procesadas: {citasCriticas.Count + citasProximas.Count + citasGenerales.Count}");
        }

        private async Task EnviarNotificacionesCitaProxima(Cita cita, CitaEmailService emailService, string tipoUrgencia)
        {
            try
            {
                var horasRestantes = (cita.FechaHora - DateTime.Now).TotalHours;

                _logger.LogInformation($"📧 [{tipoUrgencia}] Procesando cita ID {cita.Id}: {cita.NombreCompleto}");
                _logger.LogInformation($"   ⏰ Faltan {(int)horasRestantes}h - {cita.FechaHora:dd/MM/yyyy HH:mm}");

                var notificacion = new NotificacionCita
                {
                    NombreCliente = cita.NombreCompleto,
                    EmailCliente = cita.Email,
                    TelefonoCliente = cita.Telefono,
                    FechaHora = cita.FechaHora,
                    ServicioInteres = cita.ServicioInteres ?? "Consultoría General",
                    Modalidad = cita.Modalidad ?? "Presencial",
                    Estado = cita.Estado,
                    NotasAdmin = cita.NotasAdmin ?? "",
                    EnlaceMeet = cita.Modalidad?.ToLower().Contains("virtual") == true
                        ? MeetLinkGenerator.GenerarEnlaceMeet(cita.Id)
                        : ""
                };

                // 📧 Email al cliente
                var clienteOk = await emailService.EnviarNotificacionCitaProxima(notificacion);
                if (clienteOk)
                {
                    _logger.LogInformation($"   ✅ Email al cliente enviado");
                }
                else
                {
                    _logger.LogWarning($"   ⚠️ Error enviando email al cliente");
                }

                await Task.Delay(500);

                // 📧 Alerta al admin
                var adminOk = await emailService.EnviarAlertaAdminCitaProxima(notificacion);
                if (adminOk)
                {
                    _logger.LogInformation($"   ✅ Alerta al admin enviada");
                }
                else
                {
                    _logger.LogWarning($"   ⚠️ Error enviando alerta al admin");
                }
            }
            catch (Exception ex)
            {
                _logger.LogError($"❌ Error procesando cita {cita.Id}: {ex.Message}");
            }
        }

        private async Task EnviarRecordatorioGeneral(Cita cita, CitaEmailService emailService)
        {
            try
            {
                _logger.LogInformation($"📧 [GENERAL] Recordatorio: {cita.NombreCompleto} - {cita.FechaHora:dd/MM/yyyy HH:mm}");

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

                var enviado = await emailService.EnviarRecordatorioCitaPendiente(notificacion);

                if (enviado)
                {
                    _logger.LogInformation($"   ✅ Recordatorio enviado");
                }
                else
                {
                    _logger.LogWarning($"   ⚠️ Error enviando recordatorio");
                }
            }
            catch (Exception ex)
            {
                _logger.LogError($"❌ Error: {ex.Message}");
            }
        }

        public override async Task StopAsync(CancellationToken stoppingToken)
        {
            _logger.LogInformation("🛑 Deteniendo servicio de recordatorios...");
            await base.StopAsync(stoppingToken);
            _logger.LogInformation("✅ Servicio detenido correctamente");
        }
    }
}