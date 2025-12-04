using COMMON.Entidades;
using COMMON.Interfaces;
using BIZ;

namespace WebAPI
{
    public class RecordatoriosCitasBackgroundService : BackgroundService
    {
        private readonly ILogger<RecordatoriosCitasBackgroundService> _logger;
        private readonly IServiceProvider _serviceProvider;

        public RecordatoriosCitasBackgroundService(
            ILogger<RecordatoriosCitasBackgroundService> logger,
            IServiceProvider serviceProvider)
        {
            _logger = logger;
            _serviceProvider = serviceProvider;
        }

        protected override async Task ExecuteAsync(CancellationToken stoppingToken)
        {
            _logger.LogInformation("🚀 Servicio de recordatorios automáticos iniciado");

            // Esperar 1 minuto al inicio para que la app esté lista
            await Task.Delay(TimeSpan.FromMinutes(1), stoppingToken);

            while (!stoppingToken.IsCancellationRequested)
            {
                try
                {
                    var ahora = DateTime.Now;

                    // ⏰ EJECUTAR A LAS 9:00 AM Y 6:00 PM
                    if ((ahora.Hour == 9 || ahora.Hour == 18) && ahora.Minute < 5)
                    {
                        _logger.LogInformation($"⏰ === EJECUTANDO RECORDATORIOS {ahora:HH:mm} ===");

                        await EnviarRecordatoriosDiaSiguiente();

                        // Esperar hasta la siguiente hora válida
                        var proximaEjecucion = ahora.Hour == 9
                            ? ahora.Date.AddHours(18)
                            : ahora.Date.AddDays(1).AddHours(9);

                        var tiempoEspera = proximaEjecucion - ahora;

                        _logger.LogInformation($"✅ Completado. Próxima ejecución: {proximaEjecucion:dd/MM/yyyy HH:mm}");
                        _logger.LogInformation($"⏳ Esperando {tiempoEspera.TotalHours:F1} horas...");

                        await Task.Delay(tiempoEspera, stoppingToken);
                    }
                    else
                    {
                        // Verificar cada 5 minutos
                        await Task.Delay(TimeSpan.FromMinutes(5), stoppingToken);
                    }
                }
                catch (OperationCanceledException)
                {
                    _logger.LogInformation("⚠️ Servicio detenido por cancelación");
                    break;
                }
                catch (Exception ex)
                {
                    _logger.LogError($"❌ Error en servicio: {ex.Message}");
                    await Task.Delay(TimeSpan.FromMinutes(30), stoppingToken);
                }
            }
        }

        private async Task EnviarRecordatoriosDiaSiguiente()
        {
            using var scope = _serviceProvider.CreateScope();

            try
            {
                var repository = scope.ServiceProvider.GetRequiredService<IDB<Cita>>();
                var emailService = new CitaEmailService();

                var ahora = DateTime.Now;
                var mañana = ahora.AddDays(1).Date;
                var finMañana = mañana.AddDays(1);

                _logger.LogInformation($"📅 Buscando citas para: {mañana:dd/MM/yyyy}");

                var todasCitas = repository.ObtenerTodos();

                if (todasCitas == null || !todasCitas.Any())
                {
                    _logger.LogWarning("⚠️ No hay citas en el sistema");
                    return;
                }

                // 🎯 TIPO 1: Citas PENDIENTES (Recordatorio para ADMIN)
                var citasPendientesMañana = todasCitas
                    .Where(c =>
                        c.Estado == "Pendiente" &&
                        c.FechaHora >= mañana &&
                        c.FechaHora < finMañana &&
                        !string.IsNullOrWhiteSpace(c.Email)
                    )
                    .OrderBy(c => c.FechaHora)
                    .ToList();

                // 🎯 TIPO 2: Citas CONFIRMADAS (Recordatorio para CLIENTE)
                var citasConfirmadasMañana = todasCitas
                    .Where(c =>
                        c.Estado == "Confirmada" &&
                        c.FechaHora >= mañana &&
                        c.FechaHora < finMañana &&
                        !string.IsNullOrWhiteSpace(c.Email)
                    )
                    .OrderBy(c => c.FechaHora)
                    .ToList();

                _logger.LogInformation("═══════════════════════════════════");
                _logger.LogInformation($"📊 Citas pendientes (admin): {citasPendientesMañana.Count}");
                _logger.LogInformation($"📊 Citas confirmadas (cliente): {citasConfirmadasMañana.Count}");
                _logger.LogInformation("═══════════════════════════════════");

                int enviadosAdmin = 0;
                int enviadosCliente = 0;
                int fallidos = 0;

                // 📧 ENVIAR RECORDATORIOS A ADMIN (Citas pendientes)
                foreach (var cita in citasPendientesMañana)
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

                        _logger.LogInformation($"📧 [ADMIN] Recordatorio pendiente: {cita.NombreCompleto} ({cita.FechaHora:HH:mm})");

                        var resultado = await emailService.EnviarRecordatorioCitaPendiente(notificacion);

                        if (resultado)
                        {
                            enviadosAdmin++;
                            _logger.LogInformation($"✅ Enviado a admin");
                        }
                        else
                        {
                            fallidos++;
                            _logger.LogWarning($"⚠️ No enviado a admin");
                        }

                        await Task.Delay(1000);
                    }
                    catch (Exception ex)
                    {
                        fallidos++;
                        _logger.LogError($"❌ Error con {cita.NombreCompleto}: {ex.Message}");
                    }
                }

                // 📧 ENVIAR RECORDATORIOS A CLIENTES (Citas confirmadas)
                foreach (var cita in citasConfirmadasMañana)
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
                            NotasAdmin = cita.NotasAdmin ?? "",
                            EnlaceMeet = cita.Modalidad?.ToLower().Contains("virtual") == true
                                ? MeetLinkGenerator.GenerarEnlaceMeet(cita.Id)
                                : ""
                        };

                        _logger.LogInformation($"📧 [CLIENTE] Recordatorio confirmada: {cita.NombreCompleto} ({cita.FechaHora:HH:mm})");

                        // ✨ NUEVO: Enviar recordatorio específico para clientes
                        var resultado = await emailService.EnviarRecordatorioClienteCitaConfirmada(notificacion);

                        if (resultado)
                        {
                            enviadosCliente++;
                            _logger.LogInformation($"✅ Enviado a: {cita.Email}");
                        }
                        else
                        {
                            fallidos++;
                            _logger.LogWarning($"⚠️ No enviado a: {cita.Email}");
                        }

                        await Task.Delay(1000);
                    }
                    catch (Exception ex)
                    {
                        fallidos++;
                        _logger.LogError($"❌ Error con {cita.NombreCompleto}: {ex.Message}");
                    }
                }

                _logger.LogInformation("═══════════════════════════════════");
                _logger.LogInformation($"✅ RESUMEN DE RECORDATORIOS");
                _logger.LogInformation($"📅 Fecha objetivo: {mañana:dd/MM/yyyy}");
                _logger.LogInformation($"📧 Recordatorios a admin (pendientes): {enviadosAdmin}");
                _logger.LogInformation($"📧 Recordatorios a clientes (confirmadas): {enviadosCliente}");
                _logger.LogInformation($"❌ Fallidos: {fallidos}");
                _logger.LogInformation("═══════════════════════════════════");
            }
            catch (Exception ex)
            {
                _logger.LogError($"❌ Error crítico: {ex.Message}");
                _logger.LogError($"Stack: {ex.StackTrace}");
            }
        }
    }