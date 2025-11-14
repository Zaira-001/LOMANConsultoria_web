using System;
using System.Net.Http;
using System.Text;
using System.Text.Json;
using System.Threading.Tasks;

namespace BIZ
{
    public class SimpleEmailService
    {
        // ============================================
        // CONFIGURACIÓN BREVO API CON VARIABLES DE ENTORNO
        // ============================================
        // La API key se obtiene de las variables de entorno de Render
        // NO la pongas directamente en el código (GitHub lo bloqueará)
        private readonly string _brevoApiKey = Environment.GetEnvironmentVariable("BREVO_API_KEY") ?? "";
        
        private readonly string _adminEmail = "zaira7731479269@gmail.com";
        private readonly string _fromEmail = "zaira7731479269@gmail.com";
        private readonly string _fromName = "Consultoría Integral SC";

        private static readonly HttpClient _httpClient = new HttpClient();

        public async Task<bool> EnviarFormularioContacto(FormularioContacto datos)
        {
            try
            {
                System.Diagnostics.Debug.WriteLine("📧 === DATOS RECIBIDOS PARA ENVÍO ===");
                System.Diagnostics.Debug.WriteLine($"📧 Nombre: {datos.Nombre}");
                System.Diagnostics.Debug.WriteLine($"📧 Email: {datos.Correo}");
                System.Diagnostics.Debug.WriteLine($"📧 Teléfono: {datos.Telefono}");
                System.Diagnostics.Debug.WriteLine($"📧 Prioridad: {datos.Prioridad}");
                System.Diagnostics.Debug.WriteLine($"📧 Tipo Consulta: '{datos.TipoConsulta}'");
                System.Diagnostics.Debug.WriteLine($"📧 Nombre Empresa: '{datos.NombreEmpresa}'");
                System.Diagnostics.Debug.WriteLine($"📧 Tamaño Empresa: '{datos.TamanoEmpresa}'");
                System.Diagnostics.Debug.WriteLine($"📧 Mensaje: {datos.Mensaje}");
                System.Diagnostics.Debug.WriteLine("📧 ========================================");
                System.Diagnostics.Debug.WriteLine("📧 ENVIANDO VÍA BREVO API (No SMTP)");
                System.Diagnostics.Debug.WriteLine("📧 ========================================");

                await EnviarEmailViaBravo(datos);
                
                System.Diagnostics.Debug.WriteLine("✅ ========================================");
                System.Diagnostics.Debug.WriteLine("✅ EMAIL ENVIADO EXITOSAMENTE");
                System.Diagnostics.Debug.WriteLine("✅ ========================================");
                return true;
            }
            catch (Exception ex)
            {
                System.Diagnostics.Debug.WriteLine($"🔥 ========================================");
                System.Diagnostics.Debug.WriteLine($"🔥 ERROR AL ENVIAR EMAIL");
                System.Diagnostics.Debug.WriteLine($"🔥 ========================================");
                System.Diagnostics.Debug.WriteLine($"🔥 Mensaje: {ex.Message}");
                System.Diagnostics.Debug.WriteLine($"🔥 Stack: {ex.StackTrace}");
                
                // Re-lanzar la excepción
                throw;
            }
        }
        
        private async Task EnviarEmailViaBravo(FormularioContacto datos)
        {
            // Validar que existe la API key
            if (string.IsNullOrEmpty(_brevoApiKey))
            {
                System.Diagnostics.Debug.WriteLine("❌ ERROR: BREVO_API_KEY no está configurada");
                System.Diagnostics.Debug.WriteLine("💡 Configura la variable de entorno BREVO_API_KEY en Render");
                throw new Exception("BREVO_API_KEY no está configurada. Configúrala en las variables de entorno de Render.");
            }

            System.Diagnostics.Debug.WriteLine($"✅ API Key configurada (longitud: {_brevoApiKey.Length})");

            // Construir el HTML del email
            var htmlBody = ConstruirEmailHTML(datos);

            // Crear el payload para Brevo API
            var emailRequest = new
            {
                sender = new 
                { 
                    name = _fromName, 
                    email = _fromEmail 
                },
                to = new[] 
                { 
                    new 
                    { 
                        email = _adminEmail, 
                        name = "Administrador" 
                    } 
                },
                subject = $"🔔 Nuevo Contacto [{datos.Prioridad}] - {datos.Nombre}",
                htmlContent = htmlBody
            };

            var jsonContent = JsonSerializer.Serialize(emailRequest, new JsonSerializerOptions 
            { 
                PropertyNamingPolicy = JsonNamingPolicy.CamelCase 
            });

            System.Diagnostics.Debug.WriteLine($"📤 Tamaño del payload: {jsonContent.Length} bytes");

            // Crear la petición HTTP
            var request = new HttpRequestMessage(HttpMethod.Post, "https://api.brevo.com/v3/smtp/email")
            {
                Content = new StringContent(jsonContent, Encoding.UTF8, "application/json")
            };
            
            request.Headers.Add("api-key", _brevoApiKey);
            request.Headers.Add("accept", "application/json");

            System.Diagnostics.Debug.WriteLine("📤 Enviando petición a Brevo API...");

            // Enviar la petición
            var response = await _httpClient.SendAsync(request);
            var responseBody = await response.Content.ReadAsStringAsync();

            System.Diagnostics.Debug.WriteLine($"📥 Status HTTP: {(int)response.StatusCode} - {response.StatusCode}");
            System.Diagnostics.Debug.WriteLine($"📥 Response Body: {responseBody}");

            if (response.IsSuccessStatusCode)
            {
                System.Diagnostics.Debug.WriteLine("✅ Brevo API respondió exitosamente");
            }
            else
            {
                System.Diagnostics.Debug.WriteLine("❌ Error en Brevo API");
                
                // Diagnóstico de errores comunes
                if (responseBody.Contains("unauthorized") || responseBody.Contains("api-key"))
                {
                    System.Diagnostics.Debug.WriteLine("💡 PROBLEMA: API Key inválida");
                    System.Diagnostics.Debug.WriteLine("💡 SOLUCIÓN: Verifica que pegaste correctamente la API key de Brevo");
                }
                else if (responseBody.Contains("sender") || responseBody.Contains("not found"))
                {
                    System.Diagnostics.Debug.WriteLine("💡 PROBLEMA: Email de origen no verificado en Brevo");
                    System.Diagnostics.Debug.WriteLine("💡 SOLUCIÓN: Ve a https://app.brevo.com/senders y verifica tu email");
                }
                
                throw new Exception($"Error Brevo API: {response.StatusCode} - {responseBody}");
            }
        }

        private string ConstruirEmailHTML(FormularioContacto datos)
        {
            var prioridadClass = datos.Prioridad?.ToLower() switch
            {
                "alta" => "priority-high",
                "media" => "priority-medium",
                "baja" => "priority-low",
                _ => ""
            };

            var prioridadEmoji = datos.Prioridad?.ToLower() switch
            {
                "alta" => "🔴",
                "media" => "🟡",
                "baja" => "🟢",
                _ => "⚪"
            };

            var html = new StringBuilder();
            
            html.AppendLine(@"
<!DOCTYPE html>
<html>
<head>
    <meta charset='UTF-8'>
    <meta name='viewport' content='width=device-width, initial-scale=1.0'>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; background-color: #f4f4f4; }
        .container { max-width: 600px; margin: 20px auto; background: #fff; border-radius: 10px; overflow: hidden; box-shadow: 0 0 20px rgba(0,0,0,0.1); }
        .header { background: linear-gradient(135deg, #1E3A5F 0%, #2c5282 100%); color: white; padding: 30px 20px; text-align: center; }
        .header h2 { margin: 0; font-size: 24px; }
        .content { padding: 30px; }
        .section-title { color: #1E3A5F; font-size: 18px; font-weight: bold; margin-bottom: 20px; padding-bottom: 10px; border-bottom: 2px solid #1E3A5F; }
        .field { margin-bottom: 15px; padding: 12px; background: #f9f9f9; border-left: 4px solid #1E3A5F; border-radius: 4px; }
        .field-label { font-weight: bold; color: #1E3A5F; display: block; margin-bottom: 5px; }
        .field-value { color: #333; word-break: break-word; }
        .field-value a { color: #1E3A5F; text-decoration: none; }
        .message-box { background-color: #f8f9fa; padding: 20px; border-left: 4px solid #17a2b8; margin: 20px 0; border-radius: 4px; }
        .message-box h4 { color: #17a2b8; margin: 0 0 15px 0; }
        .message-text { color: #333; white-space: pre-wrap; word-wrap: break-word; }
        .footer { text-align: center; font-size: 12px; color: #777; margin-top: 30px; padding: 20px; background: #f9f9f9; border-top: 1px solid #ddd; }
        .priority-high { color: #dc3545; font-weight: bold; }
        .priority-medium { color: #fd7e14; font-weight: bold; }
        .priority-low { color: #28a745; font-weight: bold; }
    </style>
</head>
<body>
    <div class='container'>
        <div class='header'>
            <h2>📩 Nuevo Contacto - Consultoría Integral SC</h2>
        </div>
        <div class='content'>
            <div class='section-title'>Información del Contacto</div>");

            // Campo: Nombre
            html.AppendLine($@"
            <div class='field'>
                <span class='field-label'>👤 Nombre</span>
                <span class='field-value'>{datos.Nombre}</span>
            </div>");

            // Campo: Correo
            html.AppendLine($@"
            <div class='field'>
                <span class='field-label'>📧 Correo</span>
                <span class='field-value'><a href='mailto:{datos.Correo}'>{datos.Correo}</a></span>
            </div>");

            // Campo: Teléfono
            html.AppendLine($@"
            <div class='field'>
                <span class='field-label'>📱 Teléfono</span>
                <span class='field-value'><a href='tel:{datos.Telefono}'>{datos.Telefono}</a></span>
            </div>");

            // Campo: Prioridad
            html.AppendLine($@"
            <div class='field'>
                <span class='field-label'>⚡ Prioridad</span>
                <span class='field-value {prioridadClass}'>{prioridadEmoji} {datos.Prioridad?.ToUpper()}</span>
            </div>");

            // Campos opcionales
            if (!string.IsNullOrWhiteSpace(datos.TipoConsulta))
            {
                html.AppendLine($@"
            <div class='field'>
                <span class='field-label'>💼 Tipo de Consulta</span>
                <span class='field-value'>{datos.TipoConsulta}</span>
            </div>");
            }

            if (!string.IsNullOrWhiteSpace(datos.NombreEmpresa))
            {
                html.AppendLine($@"
            <div class='field'>
                <span class='field-label'>🏢 Empresa</span>
                <span class='field-value'>{datos.NombreEmpresa}</span>
            </div>");
            }

            if (!string.IsNullOrWhiteSpace(datos.TamanoEmpresa))
            {
                html.AppendLine($@"
            <div class='field'>
                <span class='field-label'>📊 Tamaño de Empresa</span>
                <span class='field-value'>{datos.TamanoEmpresa}</span>
            </div>");
            }

            // Mensaje
            html.AppendLine($@"
            <div class='message-box'>
                <h4>💬 Mensaje</h4>
                <div class='message-text'>{datos.Mensaje}</div>
            </div>");

            // Footer
            html.AppendLine($@"
            <div class='footer'>
                <p><strong>Consultoría Integral SC</strong></p>
                <p>Enviado el {DateTime.Now:dd/MM/yyyy} a las {DateTime.Now:HH:mm:ss}</p>
                <p>Formulario de contacto del sitio web oficial</p>
            </div>
        </div>
    </div>
</body>
</html>");

            return html.ToString();
        }
    }

    public class FormularioContacto
    {
        public string Nombre { get; set; } = "";
        public string Correo { get; set; } = "";
        public string Telefono { get; set; } = "";
        public string Prioridad { get; set; } = "";
        public string TipoConsulta { get; set; } = "";
        public string NombreEmpresa { get; set; } = "";
        public string TamanoEmpresa { get; set; } = "";
        public string Mensaje { get; set; } = "";
    }
}