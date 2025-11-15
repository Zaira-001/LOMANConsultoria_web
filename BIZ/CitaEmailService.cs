using System;
using System.Globalization;
using System.Net.Http;
using System.Text;
using System.Text.Json;
using System.Threading.Tasks;

namespace BIZ
{
    public class CitaEmailService
    {
        // ============================================
        // CONFIGURACIÓN BREVO API CON VARIABLES DE ENTORNO
        // ============================================
        private readonly string _brevoApiKey = Environment.GetEnvironmentVariable("BREVO_API_KEY") ?? "";
        private readonly string _fromEmail = "zaira7731479269@gmail.com";
        private readonly string _fromName = "Consultoría Integral SC";
        private readonly CultureInfo _culturaEspañol = new CultureInfo("es-MX");
        private readonly string _meetLinkEmpresa = "https://meet.google.com/fcn-ecqy-ebz";

        private static readonly HttpClient _httpClient = new HttpClient();

        public async Task<bool> EnviarNotificacionCita(NotificacionCita datos)
        {
            try
            {
                System.Diagnostics.Debug.WriteLine("📧 === ENVIANDO NOTIFICACIÓN DE CITA ===");
                System.Diagnostics.Debug.WriteLine($"📧 Cliente: {datos.NombreCliente}");
                System.Diagnostics.Debug.WriteLine($"📧 Email: {datos.EmailCliente}");
                System.Diagnostics.Debug.WriteLine($"📧 Estado: {datos.Estado}");
                System.Diagnostics.Debug.WriteLine($"📧 Modalidad: {datos.Modalidad}");
                System.Diagnostics.Debug.WriteLine($"📧 Fecha: {datos.FechaHora}");

                if (string.IsNullOrEmpty(_brevoApiKey))
                {
                    System.Diagnostics.Debug.WriteLine("❌ ERROR: BREVO_API_KEY no configurada");
                    return false;
                }

                var emailBody = GenerarEmailNotificacion(datos);

                string estadoIcono = datos.Estado.ToLower() switch
                {
                    "confirmada" => "✅",
                    "cancelada" => "❌",
                    "completada" => "✔️",
                    _ => "⏳"
                };

                string estadoTexto = datos.Estado.ToLower() switch
                {
                    "confirmada" => "confirmada",
                    "cancelada" => "cancelada",
                    "completada" => "completada",
                    _ => "pendiente"
                };

                await EnviarEmailViaBravo(
                    destinatario: datos.EmailCliente,
                    asunto: $"{estadoIcono} Tu cita {datos.Modalidad.ToLower()} ha sido {estadoTexto} - Consultoría Integral SC",
                    htmlContent: emailBody
                );

                System.Diagnostics.Debug.WriteLine("✅ Email de notificación enviado correctamente");
                return true;
            }
            catch (Exception ex)
            {
                System.Diagnostics.Debug.WriteLine($"❌ Error enviando notificación: {ex.Message}");
                System.Diagnostics.Debug.WriteLine($"❌ Stack trace: {ex.StackTrace}");
                return true; // No fallar si el email no se envía
            }
        }

        // ============================================
        // MÉTODO PRIVADO PARA ENVIAR VÍA BREVO API
        // ============================================

        private async Task EnviarEmailViaBravo(string destinatario, string asunto, string htmlContent)
        {
            var emailRequest = new
            {
                sender = new { name = _fromName, email = _fromEmail },
                to = new[] { new { email = destinatario } },
                subject = asunto,
                htmlContent = htmlContent
            };

            var jsonContent = JsonSerializer.Serialize(emailRequest, new JsonSerializerOptions
            {
                PropertyNamingPolicy = JsonNamingPolicy.CamelCase
            });

            var request = new HttpRequestMessage(HttpMethod.Post, "https://api.brevo.com/v3/smtp/email")
            {
                Content = new StringContent(jsonContent, Encoding.UTF8, "application/json")
            };

            request.Headers.Add("api-key", _brevoApiKey);
            request.Headers.Add("accept", "application/json");

            System.Diagnostics.Debug.WriteLine("📤 Enviando notificación de cita vía Brevo API...");

            var response = await _httpClient.SendAsync(request);
            var responseBody = await response.Content.ReadAsStringAsync();

            if (!response.IsSuccessStatusCode)
            {
                System.Diagnostics.Debug.WriteLine($"❌ Error Brevo: {responseBody}");
                throw new Exception($"Error Brevo API: {response.StatusCode} - {responseBody}");
            }

            System.Diagnostics.Debug.WriteLine("✅ Email enviado exitosamente vía Brevo");
        }

        // ============================================
        // GENERADOR DE HTML (Sin cambios en estructura)
        // ============================================

        // ============================================
        // ACTUALIZAR ESTE MÉTODO EN CitaEmailService.cs
        // ============================================

        private string GenerarEmailNotificacion(NotificacionCita datos)
        {
            string estadoColor = datos.Estado.ToLower() switch
            {
                "confirmada" => "#28a745",
                "cancelada" => "#dc3545",
                "completada" => "#2196F3",
                _ => "#ff9800"
            };

            string estadoIcono = datos.Estado.ToLower() switch
            {
                "confirmada" => "✅",
                "cancelada" => "❌",
                "completada" => "✔️",
                _ => "⏳"
            };

            string estadoTexto = datos.Estado.ToLower() switch
            {
                "confirmada" => "CONFIRMADA",
                "cancelada" => "CANCELADA",
                "completada" => "COMPLETADA",
                _ => "PENDIENTE"
            };

            string mensaje = datos.Estado.ToLower() switch
            {
                "confirmada" => "¡Excelente noticia! Tu cita ha sido confirmada. Te esperamos en la fecha y hora acordadas.",
                "cancelada" => "Lamentamos informarte que tu cita ha sido cancelada.",
                "completada" => "¡Gracias por tu visita! Esperamos que hayas tenido una excelente experiencia con nosotros.",
                _ => "Tu cita está pendiente de confirmación. Te notificaremos pronto."
            };

            string fechaFormateada = datos.FechaHora.ToString("dddd, dd 'de' MMMM 'de' yyyy 'a las' HH:mm", _culturaEspañol);
            fechaFormateada = char.ToUpper(fechaFormateada[0]) + fechaFormateada.Substring(1);

            string modalidadContenido = GenerarContenidoModalidad(datos);

            string mensajeWhatsApp = $"Hola, deseo reagendar mi cita del {fechaFormateada} para el servicio de {datos.ServicioInteres}.";
            string whatsappLink = $"https://wa.me/5215659644304?text={Uri.EscapeDataString(mensajeWhatsApp)}";

            // ✅ AGREGAR SECCIÓN DE MOTIVO DE CANCELACIÓN
            string motivoCancelacionHtml = "";
            if (datos.Estado.ToLower() == "cancelada" && !string.IsNullOrWhiteSpace(datos.NotasAdmin))
            {
                motivoCancelacionHtml = $@"
            <div style='background: #fff3cd; border-left: 5px solid #ffc107; padding: 25px; border-radius: 10px; margin: 25px 0;'>
                <h3 style='margin: 0 0 15px 0; color: #856404; display: flex; align-items: center; gap: 10px;'>
                    <span style='font-size: 24px;'>💬</span>
                    Motivo de la Cancelación
                </h3>
                <div style='background: white; padding: 20px; border-radius: 8px; color: #333; line-height: 1.6; white-space: pre-wrap;'>
                    {System.Net.WebUtility.HtmlEncode(datos.NotasAdmin)}
                </div>
            </div>
        ";
            }

            var emailBody = new StringBuilder();
            emailBody.AppendLine($@"
        <html>
        <head>
            <meta charset='UTF-8'>
            <meta name='viewport' content='width=device-width, initial-scale=1.0'>
            <style>
                body {{
                    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
                    line-height: 1.6;
                    color: #333;
                    margin: 0;
                    padding: 0;
                    background-color: #f4f4f4;
                }}
                .container {{
                    max-width: 600px;
                    margin: 20px auto;
                    background: #ffffff;
                    border-radius: 10px;
                    overflow: hidden;
                    box-shadow: 0 4px 15px rgba(0,0,0,0.1);
                }}
                .header {{
                    background: linear-gradient(135deg, {estadoColor} 0%, {AdjustColor(estadoColor, -20)} 100%);
                    color: white;
                    padding: 30px 20px;
                    text-align: center;
                }}
                .header h1 {{
                    margin: 0;
                    font-size: 28px;
                    font-weight: 700;
                }}
                .status-badge {{
                    display: inline-block;
                    background: rgba(255,255,255,0.2);
                    padding: 8px 20px;
                    border-radius: 20px;
                    margin-top: 15px;
                    font-size: 16px;
                    font-weight: 600;
                }}
                .content {{
                    padding: 30px 25px;
                }}
                .message-box {{
                    background: linear-gradient(135deg, #e3f2fd 0%, #f3e5f5 100%);
                    padding: 20px;
                    border-radius: 10px;
                    border-left: 5px solid {estadoColor};
                    margin-bottom: 25px;
                }}
                .message-box p {{
                    margin: 0;
                    font-size: 16px;
                    color: #333;
                }}
                .info-section {{
                    background: #f8f9fa;
                    padding: 20px;
                    border-radius: 8px;
                    margin-bottom: 20px;
                }}
                .info-row {{
                    display: flex;
                    padding: 12px 0;
                    border-bottom: 1px solid #e0e0e0;
                }}
                .info-row:last-child {{
                    border-bottom: none;
                }}
                .info-label {{
                    font-weight: 600;
                    color: #555;
                    min-width: 120px;
                }}
                .info-value {{
                    color: #333;
                    flex: 1;
                }}
                .footer {{
                    background: #343a40;
                    color: white;
                    padding: 25px;
                    text-align: center;
                }}
                .footer h4 {{
                    margin: 0 0 10px 0;
                    font-size: 18px;
                }}
                .footer p {{
                    margin: 5px 0;
                    opacity: 0.8;
                    font-size: 13px;
                }}
                .contact-info {{
                    margin-top: 15px;
                    padding-top: 15px;
                    border-top: 1px solid rgba(255,255,255,0.1);
                }}
                .cta-button {{
                    display: inline-block;
                    background: {estadoColor};
                    color: white;
                    padding: 12px 30px;
                    border-radius: 25px;
                    text-decoration: none;
                    font-weight: 600;
                    margin-top: 20px;
                    margin-right: 10px;
                }}
                .whatsapp-button {{
                    display: inline-block;
                    background: #25D366;
                    color: white;
                    padding: 12px 30px;
                    border-radius: 25px;
                    text-decoration: none;
                    font-weight: 600;
                    margin-top: 20px;
                }}
                @media only screen and (max-width: 480px) {{
                    .container {{
                        margin: 0;
                        border-radius: 0;
                    }}
                    .header h1 {{
                        font-size: 24px;
                    }}
                    .content {{
                        padding: 20px 15px;
                    }}
                    .info-row {{
                        flex-direction: column;
                    }}
                    .info-label {{
                        margin-bottom: 5px;
                    }}
                    .cta-button, .whatsapp-button {{
                        display: block;
                        margin: 10px 0;
                    }}
                }}
            </style>
        </head>
        <body>
            <div class='container'>
                <div class='header'>
                    <h1>{estadoIcono} Estado de tu Cita</h1>
                    <div class='status-badge'>{estadoTexto}</div>
                </div>
                
                <div class='content'>
                    <div class='message-box'>
                        <p><strong>Hola {datos.NombreCliente},</strong></p>
                        <p style='margin-top: 10px;'>{mensaje}</p>
                    </div>
                    
                    {motivoCancelacionHtml}
                    
                    <div class='info-section'>
                        <h3 style='margin-top: 0; color: #1E3A5F;'>📋 Detalles de la Cita</h3>
                        
                        <div class='info-row'>
                            <div class='info-label'>📅 Fecha y Hora:</div>
                            <div class='info-value'><strong>{fechaFormateada}</strong></div>
                        </div>
                        
                        <div class='info-row'>
                            <div class='info-label'>💼 Servicio:</div>
                            <div class='info-value'>{datos.ServicioInteres}</div>
                        </div>
                        
                        <div class='info-row'>
                            <div class='info-label'>📍 Modalidad:</div>
                            <div class='info-value'><strong>{datos.Modalidad}</strong></div>
                        </div>
                    </div>
                    
                    {modalidadContenido}
                    
                    {(datos.Estado.ToLower() == "confirmada" ? $@"
                    <div style='text-align: center; padding: 20px 0;'>
                        <p style='color: #666; margin-bottom: 15px;'>¿Necesitas hacer cambios o tienes alguna duda?</p>
                        <a href='tel:5659644304' class='cta-button' style='color: white;'>📞 Llamar</a>
                        <a href='{whatsappLink}' class='whatsapp-button' style='color: white;'>💬 WhatsApp</a>
                    </div>
                    " : "")}
                    
                    {(datos.Estado.ToLower() == "cancelada" ? $@"
                    <div style='background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 25px; border-radius: 12px; margin: 25px 0; text-align: center; color: white;'>
                        <h3 style='margin: 0 0 15px 0; font-size: 20px;'>📅 ¿Deseas Reagendar?</h3>
                        <p style='margin: 0 0 20px 0; opacity: 0.95;'>
                            Estamos disponibles para ayudarte a encontrar una nueva fecha que se ajuste a tus necesidades.
                        </p>
                        <a href='{whatsappLink}' class='whatsapp-button' style='color: white; background: #25D366; display: inline-block; margin: 5px;'>
                            💬 Reagendar por WhatsApp
                        </a>
                        <a href='tel:5659644304' style='background: rgba(255,255,255,0.2); color: white; border: 2px solid white; padding: 12px 30px; border-radius: 25px; text-decoration: none; font-weight: 600; display: inline-block; margin: 5px;'>
                            📞 Llamar
                        </a>
                    </div>
                    " : "")}
                </div>
                
                <div class='footer'>
                    <h4>Consultoría Integral SC</h4>
                    <p>Tu socio estratégico en soluciones empresariales</p>
                    
                    <div class='contact-info'>
                        <p>📞 Teléfono: 56-5964-4304</p>
                        <p>📧 Email: lomanconsultoria2025@gmail.com</p>
                    </div>
                    
                    <p style='margin-top: 20px; font-size: 11px; opacity: 0.6;'>
                        Este correo fue enviado el {DateTime.Now.ToString("dd/MM/yyyy 'a las' HH:mm:ss", _culturaEspañol)}<br>
                        Sistema automatizado de notificaciones
                    </p>
                </div>
            </div>
        </body>
        </html>
    ");

            return emailBody.ToString();
        }

        private string GenerarContenidoModalidad(NotificacionCita datos)
        {
            if (datos.Estado.ToLower() != "confirmada")
                return "";

            var modalidadLower = datos.Modalidad?.ToLower() ?? "";

            if (modalidadLower.Contains("virtual"))
            {
                string enlaceMeet = !string.IsNullOrWhiteSpace(datos.EnlaceMeet)
                    ? datos.EnlaceMeet
                    : _meetLinkEmpresa;

                return $@"
                    <div class='modalidad-box'>
                        <h3>💻 Instrucciones para tu Cita Virtual</h3>
                        <p style='margin: 10px 0;'>Tu consulta será por videollamada a través de Google Meet.</p>
                        
                        <div style='text-align: center; margin: 20px 0;'>
                            <a href='{enlaceMeet}' class='meet-button' style='color: white;'>
                                🎥 Unirse a la Videollamada
                            </a>
                        </div>
                        
                        <p style='margin-top: 15px; font-size: 14px; opacity: 0.9; text-align: center;'>
                            <strong>Enlace de la reunión:</strong><br>
                            <code style='background: rgba(255,255,255,0.2); padding: 5px 10px; border-radius: 4px; display: inline-block; margin-top: 5px; font-size: 13px;'>{enlaceMeet}</code>
                        </p>
                        
                        <ul style='margin-top: 15px;'>
                            <li><strong>Guarda este enlace</strong> - Lo necesitarás el día de tu cita</li>
                            <li><strong>Prueba tu conexión</strong> antes de la hora agendada</li>
                            <li><strong>Verifica tu cámara y micrófono</strong> funcionan correctamente</li>
                            <li><strong>Busca un lugar tranquilo</strong> sin interrupciones</li>
                            <li><strong>Ten a mano</strong> documentos o información relevante</li>
                        </ul>
                        
                        <p style='margin-top: 15px; font-size: 14px; opacity: 0.9;'>
                            💡 <strong>Tip:</strong> Puedes unirte desde tu navegador (Chrome, Firefox, Safari) o descargando la app de Google Meet.
                        </p>
                        
                        <p style='margin-top: 10px; font-size: 13px; opacity: 0.8;'>
                            ⏰ Te recomendamos conectarte 5 minutos antes de la hora agendada.
                        </p>
                    </div>
                ";
            }
            else if (modalidadLower.Contains("telefon") || modalidadLower.Contains("teléfon"))
            {
                string telefonoFormateado = datos.TelefonoCliente ?? "tu número registrado";

                return $@"
                    <div class='modalidad-box'>
                        <h3>📞 Instrucciones para tu Cita Telefónica</h3>
                        <p style='margin: 10px 0;'>Uno de nuestros consultores te llamará a la hora agendada.</p>
                        
                        <div class='phone-highlight'>
                            📱 Te llamaremos al: <strong>{telefonoFormateado}</strong>
                        </div>
                        
                        <div style='text-align: center; margin: 20px 0;'>
                            <p style='margin-bottom: 10px; font-size: 14px;'>Si prefieres llamarnos tú:</p>
                            <a href='tel:+525659644304' style='display: inline-block; background: white; color: #25D366; padding: 12px 30px; border-radius: 25px; text-decoration: none; font-weight: 600; margin: 5px;'>
                                📞 Llamar a Consultoría Integral
                            </a>
                            <p style='margin-top: 10px; font-size: 13px; opacity: 0.8;'>
                                Teléfono: +52 (565) 964-4304
                            </p>
                        </div>
                        
                        <ul style='margin-top: 15px;'>
                            <li><strong>Mantén tu teléfono disponible</strong> a la hora agendada</li>
                            <li><strong>Verifica que tienes buena señal</strong> o batería suficiente</li>
                            <li><strong>Guarda nuestro número:</strong> +52 (565) 964-4304</li>
                            <li><strong>Si no contestas,</strong> te enviaremos un mensaje por WhatsApp</li>
                            <li><strong>Prepara tus preguntas</strong> o temas a tratar con anticipación</li>
                        </ul>
                        
                        <p style='margin-top: 15px; font-size: 14px; opacity: 0.9;'>
                            💡 <strong>Importante:</strong> Si hay algún cambio en tu número de teléfono, 
                            <a href='https://wa.me/5215659644304' style='color: white; text-decoration: underline;'>avísanos por WhatsApp</a> lo antes posible.
                        </p>
                        
                        <p style='margin-top: 10px; font-size: 13px; opacity: 0.8;'>
                            ⏰ La llamada se realizará puntualmente a la hora agendada. Te recomendamos estar en un lugar tranquilo.
                        </p>
                    </div>
                ";
            }
            else if (modalidadLower.Contains("presencial"))
            {
                return $@"
                    <div class='modalidad-box'>
                        <h3>🏢 Instrucciones para tu Cita Presencial</h3>
                        <p style='margin: 10px 0;'>Te esperamos en nuestras oficinas a la hora agendada.</p>
                        
                        <ul style='margin-top: 15px;'>
                            <li><strong>Dirección:</strong> Rio Sena #94, 3er. Piso Col. Rio Lerma Cuauhtémoc, Ciudad de México C.P.06500</li>
                            <li><strong>Llega 10 minutos antes</strong> para el registro</li>
                            <li><strong>Trae identificación oficial</strong></li>
                            <li><strong>Estacionamiento disponible</strong></li>
                            <li><strong>Si llegas tarde,</strong> avísanos por WhatsApp</li>
                        </ul>
                        
                        <div style='text-align: center; margin: 20px 0;'>
                            <a href='https://maps.app.goo.gl/KdAYdZXMLxiqqK2v9' class='highlight-link' style='color: white;'>
                                📍 Ver Ubicación en Maps
                            </a>
                        </div>
                    </div>
                ";
            }

            return "";
        }

        private string AdjustColor(string hexColor, int percent)
        {
            return hexColor; // Simplificado
        }
    }

    public class NotificacionCita
    {
        public string NombreCliente { get; set; } = "";
        public string EmailCliente { get; set; } = "";
        public string TelefonoCliente { get; set; } = "";
        public DateTime FechaHora { get; set; }
        public string ServicioInteres { get; set; } = "";
        public string Modalidad { get; set; } = "";
        public string Estado { get; set; } = "";
        public string NotasAdmin { get; set; } = "";
        public string ReferenciaCita { get; set; } = "";
        public string EnlaceMeet { get; set; } = "";
    }

    public static class MeetLinkGenerator
    {
        public const string MEET_LINK_EMPRESA = "https://meet.google.com/fcn-ecqy-ebz";

        public static string GenerarEnlaceMeet(int citaId)
        {
            return MEET_LINK_EMPRESA;
        }
    }
}