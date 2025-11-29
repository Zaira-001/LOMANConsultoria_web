namespace WebAPI
{
    public class RecordatoriosCitasBackgroundService : BackgroundService
    {
        private readonly ILogger<RecordatoriosCitasBackgroundService> _logger;
        private readonly IHttpClientFactory _httpClientFactory;
        private readonly TimeSpan _intervalo = TimeSpan.FromHours(1); // Ejecutar cada 12 horas

        public RecordatoriosCitasBackgroundService(
            ILogger<RecordatoriosCitasBackgroundService> logger,
            IHttpClientFactory httpClientFactory)
        {
            _logger = logger;
            _httpClientFactory = httpClientFactory;
        }

        protected override async Task ExecuteAsync(CancellationToken stoppingToken)
        {
            _logger.LogInformation("🚀 RecordatoriosCitasBackgroundService iniciado");
            _logger.LogInformation($"⏰ Intervalo de ejecución: cada {_intervalo.TotalHours} horas");

            while (!stoppingToken.IsCancellationRequested)
            {
                try
                {
                    _logger.LogInformation("⏰ === EJECUTANDO TAREA DE RECORDATORIOS ===");

                    await EnviarRecordatorios();

                    _logger.LogInformation($"✅ Tarea completada. Próxima ejecución en {_intervalo.TotalHours} horas");

                    // Esperar el intervalo antes de la siguiente ejecución
                    await Task.Delay(_intervalo, stoppingToken);
                }
                catch (OperationCanceledException)
                {
                    _logger.LogInformation("⚠️ Servicio de recordatorios detenido");
                    break;
                }
                catch (Exception ex)
                {
                    _logger.LogError($"❌ Error en servicio de recordatorios: {ex.Message}");
                    _logger.LogError($"Stack: {ex.StackTrace}");

                    // Esperar 1 hora antes de reintentar si hay error
                    await Task.Delay(TimeSpan.FromHours(1), stoppingToken);
                }
            }
        }

        private async Task EnviarRecordatorios()
        {
            try
            {
                var httpClient = _httpClientFactory.CreateClient();

                // Llamar al endpoint de recordatorios
                var response = await httpClient.PostAsync(
                    "https://lomanconsultoria-web.onrender.com/api/Cita/enviar-recordatorios",
                    null
                );

                if (response.IsSuccessStatusCode)
                {
                    var content = await response.Content.ReadAsStringAsync();
                    _logger.LogInformation($"✅ Recordatorios enviados exitosamente");
                    _logger.LogInformation($"📊 Respuesta: {content}");
                }
                else
                {
                    _logger.LogWarning($"⚠️ Error al enviar recordatorios: {response.StatusCode}");
                    var errorContent = await response.Content.ReadAsStringAsync();
                    _logger.LogWarning($"📋 Detalles: {errorContent}");
                }
            }
            catch (Exception ex)
            {
                _logger.LogError($"❌ Error enviando recordatorios: {ex.Message}");
                throw;
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