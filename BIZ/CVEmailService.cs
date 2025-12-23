using COMMON.Entidades;
using System;
using System.Globalization;
using System.Net.Http;
using System.Text;
using System.Text.Json;
using System.Threading.Tasks;

namespace BIZ
{
    public class CVEmailService
    {
        // ============================================
        // CONFIGURACIÓN BREVO API CON VARIABLES DE ENTORNO
        // ============================================
        private readonly string _brevoApiKey = Environment.GetEnvironmentVariable("BREVO_API_KEY") ?? "";
        private readonly string _fromEmail = "consultoriaempresarialsadecv@gmail.com";
        private readonly string _fromName = "Consultoría Integral SC - RH";
        private readonly string _rhEmail = "consultoriaempresarialsadecv@gmail.com";
        private readonly string _empresaTelefono = "56-5964-4304";
        private readonly CultureInfo _culturaEspañol = new CultureInfo("es-MX");

        private static readonly HttpClient _httpClient = new HttpClient();

        // Email de confirmación con las 3 modalidades
        public async Task<bool> EnviarConfirmacionEntrevista(SolicitudCV solicitud)
        {
            try
            {
                System.Diagnostics.Debug.WriteLine($"📧 Enviando confirmación de entrevista a: {solicitud.Email}");

                if (string.IsNullOrEmpty(_brevoApiKey))
                {
                    System.Diagnostics.Debug.WriteLine("❌ ERROR: BREVO_API_KEY no configurada");
                    return false;
                }

                var emailBody = GenerarEmailConfirmacionEntrevista(solicitud);
                var tipoSolicitud = solicitud.TipoSolicitud == "residencia" ? "Residencia" : "Oportunidad Laboral";

                await EnviarEmailViaBravo(
                    destinatario: solicitud.Email,
                    asunto: $"✅ ¡Entrevista Agendada! - {tipoSolicitud} - Elige tu Modalidad",
                    htmlContent: emailBody
                );

                System.Diagnostics.Debug.WriteLine("✅ Email de confirmación enviado");
                return true;
            }
            catch (Exception ex)
            {
                System.Diagnostics.Debug.WriteLine($"❌ Error enviando confirmación: {ex.Message}");
                return false;
            }
        }

        // Email con CV al administrador
        public async Task<bool> EnviarCV(SolicitudCV datos)
        {
            try
            {
                System.Diagnostics.Debug.WriteLine("📄 === DATOS DE CV RECIBIDOS ===");
                System.Diagnostics.Debug.WriteLine($"📄 Nombre: {datos.NombreCompleto}");
                System.Diagnostics.Debug.WriteLine($"📄 Email: {datos.Email}");
                System.Diagnostics.Debug.WriteLine($"📄 Teléfono: {datos.Telefono}");
                System.Diagnostics.Debug.WriteLine($"📄 Tipo Solicitud: {datos.TipoSolicitud}");
                System.Diagnostics.Debug.WriteLine($"📄 Archivo CV: {(datos.ArchivoCV != null ? "Adjunto" : "Sin archivo")}");

                if (string.IsNullOrEmpty(_brevoApiKey))
                {
                    System.Diagnostics.Debug.WriteLine("❌ ERROR: BREVO_API_KEY no configurada");
                    return false;
                }

                var emailBody = GenerarEmailCV(datos);
                string tipoSolicitudTexto = datos.TipoSolicitud == "residencia" ? "Residencias Profesionales" : "Oportunidad Laboral";

                // Si hay archivo CV, enviar con adjunto
                if (datos.ArchivoCV != null && datos.ArchivoCV.Length > 0)
                {
                    await EnviarEmailConAdjuntoViaBravo(
                        destinatario: _rhEmail,
                        asunto: $"🔔 Nuevo CV [{tipoSolicitudTexto}] - {datos.NombreCompleto}",
                        htmlContent: emailBody,
                        pdfBytes: datos.ArchivoCV,
                        nombreArchivo: datos.NombreArchivoCV
                    );
                }
                else
                {
                    await EnviarEmailViaBravo(
                        destinatario: _rhEmail,
                        asunto: $"🔔 Nuevo CV [{tipoSolicitudTexto}] - {datos.NombreCompleto}",
                        htmlContent: emailBody
                    );
                }

                System.Diagnostics.Debug.WriteLine("✅ Email de CV enviado correctamente");
                return true;
            }
            catch (Exception ex)
            {
                System.Diagnostics.Debug.WriteLine($"❌ Error enviando CV: {ex.Message}");
                System.Diagnostics.Debug.WriteLine($"❌ Stack: {ex.StackTrace}");
                return false;
            }
        }

        // ============================================
        // MÉTODOS PRIVADOS PARA ENVIAR VÍA BREVO API
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

            System.Diagnostics.Debug.WriteLine("📤 Enviando email vía Brevo API...");

            var response = await _httpClient.SendAsync(request);
            var responseBody = await response.Content.ReadAsStringAsync();

            if (!response.IsSuccessStatusCode)
            {
                System.Diagnostics.Debug.WriteLine($"❌ Error Brevo: {responseBody}");
                throw new Exception($"Error Brevo API: {response.StatusCode} - {responseBody}");
            }

            System.Diagnostics.Debug.WriteLine("✅ Email enviado exitosamente vía Brevo");
        }

        private async Task EnviarEmailConAdjuntoViaBravo(
            string destinatario,
            string asunto,
            string htmlContent,
            byte[] pdfBytes,
            string nombreArchivo)
        {
            // Convertir archivo a Base64
            string base64Content = Convert.ToBase64String(pdfBytes);

            var emailRequest = new
            {
                sender = new { name = _fromName, email = _fromEmail },
                to = new[] { new { email = destinatario } },
                subject = asunto,
                htmlContent = htmlContent,
                attachment = new[]
                {
                    new
                    {
                        name = nombreArchivo,
                        content = base64Content
                    }
                }
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

            System.Diagnostics.Debug.WriteLine($"📤 Enviando email con CV adjunto vía Brevo API...");
            System.Diagnostics.Debug.WriteLine($"📎 Archivo: {nombreArchivo} ({pdfBytes.Length} bytes)");

            var response = await _httpClient.SendAsync(request);
            var responseBody = await response.Content.ReadAsStringAsync();

            if (!response.IsSuccessStatusCode)
            {
                System.Diagnostics.Debug.WriteLine($"❌ Error Brevo: {responseBody}");
                throw new Exception($"Error Brevo API: {response.StatusCode} - {responseBody}");
            }

            System.Diagnostics.Debug.WriteLine("✅ Email con CV enviado exitosamente vía Brevo");
        }

        // ============================================
        // GENERADORES DE HTML (Sin cambios en estructura)
        // ============================================

        private string GenerarEmailConfirmacionEntrevista(SolicitudCV solicitud)
        {
            var tipoSolicitud = solicitud.TipoSolicitud == "residencia" ? "Residencias Profesionales" : "Oportunidad Laboral";
            var iconoTipo = solicitud.TipoSolicitud == "residencia" ? "🎓" : "💼";
            var colorTipo = solicitud.TipoSolicitud == "residencia" ? "#28a745" : "#1E3A5F";

            string fechaEntrevistaTexto = "Por definir";
            if (solicitud.FechaEntrevista.HasValue)
            {
                fechaEntrevistaTexto = solicitud.FechaEntrevista.Value.ToString("dddd, dd 'de' MMMM 'de' yyyy", _culturaEspañol);
                fechaEntrevistaTexto = char.ToUpper(fechaEntrevistaTexto[0]) + fechaEntrevistaTexto.Substring(1);
            }

            string horaEntrevista = !string.IsNullOrWhiteSpace(solicitud.HoraEntrevista)
                ? solicitud.HoraEntrevista
                : "Por definir";

            string whatsappMessage = $"Hola, recibí la confirmación de entrevista para {tipoSolicitud}. Mi nombre es {solicitud.NombreCompleto}.";
            string whatsappLink = $"https://wa.me/5215659644304?text={Uri.EscapeDataString(whatsappMessage)}";

            string modalidadesHTML = GenerarModalidadesHTML(solicitud);

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
                            background: linear-gradient(135deg, {colorTipo} 0%, #2c5282 100%);
                            color: white;
                            padding: 30px 20px;
                            text-align: center;
                        }}
                        .header h1 {{
                            margin: 0;
                            font-size: 28px;
                            font-weight: 700;
                        }}
                        .header .subtitle {{
                            font-size: 16px;
                            opacity: 0.9;
                            margin-top: 10px;
                        }}
                        .content {{
                            padding: 30px 25px;
                        }}
                        .greeting {{
                            font-size: 18px;
                            color: {colorTipo};
                            font-weight: 600;
                            margin-bottom: 15px;
                        }}
                        .intro-text {{
                            color: #666;
                            margin-bottom: 25px;
                            line-height: 1.8;
                        }}
                        .interview-box {{
                            background: linear-gradient(135deg, #e3f2fd 0%, #f3e5f5 100%);
                            padding: 25px;
                            border-radius: 12px;
                            border-left: 5px solid {colorTipo};
                            margin: 25px 0;
                        }}
                        .interview-box h3 {{
                            margin: 0 0 20px 0;
                            color: {colorTipo};
                            font-size: 20px;
                        }}
                        .detail-row {{
                            background: white;
                            padding: 15px;
                            border-radius: 8px;
                            margin-bottom: 12px;
                            display: flex;
                            align-items: center;
                            gap: 12px;
                        }}
                        .detail-icon {{
                            font-size: 24px;
                            width: 40px;
                            text-align: center;
                        }}
                        .detail-content {{
                            flex: 1;
                        }}
                        .detail-label {{
                            font-weight: 600;
                            color: #555;
                            font-size: 13px;
                            text-transform: uppercase;
                            letter-spacing: 0.5px;
                            margin-bottom: 4px;
                        }}
                        .detail-value {{
                            font-size: 16px;
                            color: #333;
                            font-weight: 500;
                        }}
                        .modality-options {{
                            margin: 30px 0;
                        }}
                        .modality-options h3 {{
                            color: {colorTipo};
                            font-size: 22px;
                            margin-bottom: 20px;
                            text-align: center;
                        }}
                        .modality-card {{
                            background: white;
                            border: 2px solid #e0e0e0;
                            border-radius: 12px;
                            padding: 20px;
                            margin-bottom: 20px;
                            transition: all 0.3s ease;
                        }}
                        .modality-card:hover {{
                            border-color: {colorTipo};
                            box-shadow: 0 4px 12px rgba(0,0,0,0.1);
                        }}
                        .modality-header {{
                            display: flex;
                            align-items: center;
                            gap: 12px;
                            margin-bottom: 15px;
                            padding-bottom: 15px;
                            border-bottom: 2px solid #f0f0f0;
                        }}
                        .modality-icon {{
                            font-size: 32px;
                        }}
                        .modality-title {{
                            font-size: 20px;
                            font-weight: 700;
                            color: {colorTipo};
                        }}
                        .modality-details {{
                            padding: 10px 0;
                        }}
                        .modality-detail-item {{
                            margin: 10px 0;
                            padding: 8px 0;
                        }}
                        .modality-detail-label {{
                            font-weight: 600;
                            color: #666;
                            font-size: 14px;
                            margin-bottom: 5px;
                        }}
                        .modality-detail-value {{
                            color: #333;
                            font-size: 15px;
                            line-height: 1.6;
                        }}
                        .personal-message {{
                            background: #e8f5e9;
                            border-left: 4px solid #4caf50;
                            padding: 20px;
                            border-radius: 8px;
                            margin: 20px 0;
                        }}
                        .personal-message h4 {{
                            margin: 0 0 10px 0;
                            color: #2e7d32;
                        }}
                        .personal-message p {{
                            margin: 0;
                            white-space: pre-wrap;
                            line-height: 1.8;
                        }}
                        .next-steps {{
                            background: #f8f9fa;
                            padding: 20px;
                            border-radius: 8px;
                            margin: 20px 0;
                        }}
                        .next-steps h4 {{
                            margin: 0 0 15px 0;
                            color: {colorTipo};
                        }}
                        .next-steps ul {{
                            margin: 0;
                            padding-left: 20px;
                        }}
                        .next-steps li {{
                            margin: 10px 0;
                            color: #555;
                        }}
                        .important-box {{
                            background: #fff3cd;
                            border-left: 4px solid #ffc107;
                            padding: 15px;
                            border-radius: 8px;
                            margin: 20px 0;
                        }}
                        .important-box strong {{
                            color: #856404;
                        }}
                        .cta-container {{
                            text-align: center;
                            padding: 30px 0;
                        }}
                        .cta-button {{
                            display: inline-block;
                            background: {colorTipo};
                            color: white;
                            padding: 15px 35px;
                            border-radius: 25px;
                            text-decoration: none;
                            font-weight: 600;
                            margin: 10px;
                        }}
                        .whatsapp-button {{
                            display: inline-block;
                            background: #25D366;
                            color: white;
                            padding: 15px 35px;
                            border-radius: 25px;
                            text-decoration: none;
                            font-weight: 600;
                            margin: 10px;
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
                        @media only screen and (max-width: 480px) {{
                            .container {{
                                margin: 0;
                                border-radius: 0;
                            }}
                            .content {{
                                padding: 20px 15px;
                            }}
                            .modality-card {{
                                padding: 15px;
                            }}
                        }}
                    </style>
                </head>
                <body>
                    <div class='container'>
                        <div class='header'>
                            <h1>{iconoTipo} ¡Entrevista Agendada!</h1>
                            <div class='subtitle'>{tipoSolicitud}</div>
                        </div>
                        
                        <div class='content'>
                            <p class='greeting'>¡Hola {EscapeHtml(solicitud.NombreCompleto)}!</p>
                            
                            <p class='intro-text'>
                                Nos complace informarte que hemos revisado tu solicitud y queremos 
                                conocerte mejor. Hemos agendado una entrevista contigo para discutir 
                                la {tipoSolicitud.ToLower()}.
                            </p>
                            
                            <div class='interview-box'>
                                <h3>📅 Fecha y Hora de tu Entrevista</h3>
                                
                                <div class='detail-row'>
                                    <div class='detail-icon'>📆</div>
                                    <div class='detail-content'>
                                        <div class='detail-label'>Fecha</div>
                                        <div class='detail-value'>{fechaEntrevistaTexto}</div>
                                    </div>
                                </div>
                                
                                <div class='detail-row'>
                                    <div class='detail-icon'>⏰</div>
                                    <div class='detail-content'>
                                        <div class='detail-label'>Hora</div>
                                        <div class='detail-value'>{horaEntrevista}</div>
                                    </div>
                                </div>
                            </div>
                            
                            <div class='modality-options'>
                                <h3>🎯 Elige la Modalidad que Prefieras</h3>
                                <p style='text-align: center; color: #666; margin-bottom: 25px;'>
                                    Tenemos 3 opciones disponibles. Responde a este email indicando tu preferencia.
                                </p>
                                
                                {modalidadesHTML}
                            </div>
                            
                            {(!string.IsNullOrWhiteSpace(solicitud.MensajePersonalizado) ? $@"
                            <div class='personal-message'>
                                <h4>💬 Mensaje de nuestro equipo:</h4>
                                <p>{EscapeHtml(solicitud.MensajePersonalizado)}</p>
                            </div>
                            " : "")}
                            
                            <div class='next-steps'>
                                <h4>📋 Qué necesitas preparar:</h4>
                                <ul>
                                    <li>Ten a la mano tu CV y documentos relevantes</li>
                                    <li>Prepara preguntas sobre la {tipoSolicitud.ToLower()}</li>
                                    <li>Revisa información sobre nuestra empresa</li>
                                    {(solicitud.TipoSolicitud == "residencia"
                                        ? "<li>Trae tu carta de presentación de la universidad</li>"
                                        : "<li>Prepara ejemplos de tu experiencia profesional</li>")}
                                </ul>
                            </div>
                            
                            <div class='important-box'>
                                <p style='margin: 0; color: #856404;'>
                                    <strong>⚠️ Importante:</strong> Por favor, responde a este email indicando 
                                    qué modalidad de entrevista prefieres (Virtual, Telefónica o Presencial). 
                                    Si necesitas reprogramar, avísanos con al menos 24 horas de anticipación.
                                </p>
                            </div>
                            
                            <div class='cta-container'>
                                <p style='color: #666; margin-bottom: 15px;'>¿Tienes alguna pregunta?</p>
                                <a href='tel:5659644304' class='cta-button' style='color: white;'>📞 Llamar</a>
                                <a href='{whatsappLink}' class='whatsapp-button' style='color: white;'>💬 WhatsApp</a>
                            </div>
                        </div>
                        
                        <div class='footer'>
                            <h4>Consultoría Integral SC</h4>
                            <p>Departamento de Recursos Humanos</p>
                            <p style='margin-top: 15px;'>
                                📞 56-5964-4304 | 📧 consultoriaempresarialsadecv@gmail.com
                            </p>
                            <p style='margin-top: 20px; font-size: 11px; opacity: 0.6;'>
                                Enviado el {DateTime.Now.ToString("dd/MM/yyyy 'a las' HH:mm:ss", _culturaEspañol)}
                            </p>
                        </div>
                    </div>
                </body>
                </html>
            ");

            return emailBody.ToString();
        }

        private string GenerarModalidadesHTML(SolicitudCV solicitud)
        {
            var html = new StringBuilder();

            // MODALIDAD 1: VIRTUAL
            html.AppendLine(@"
                <div class='modality-card'>
                    <div class='modality-header'>
                        <div class='modality-icon'>💻</div>
                        <div class='modality-title'>Opción 1: Entrevista Virtual</div>
                    </div>
                    <div class='modality-details'>");

            if (!string.IsNullOrWhiteSpace(solicitud.EnlaceVirtual))
            {
                html.AppendLine($@"
                        <div class='modality-detail-item'>
                            <div class='modality-detail-label'>🔗 Enlace de la reunión:</div>
                            <div class='modality-detail-value'>
                                <a href='{solicitud.EnlaceVirtual}' style='color: #1976d2; text-decoration: none;'>
                                    {solicitud.EnlaceVirtual}
                                </a>
                            </div>
                        </div>");
            }
            else
            {
                html.AppendLine(@"
                        <div class='modality-detail-item'>
                            <div class='modality-detail-label'>🔗 Enlace de la reunión:</div>
                            <div class='modality-detail-value'>Se te enviará 1 hora antes de la entrevista</div>
                        </div>");
            }

            html.AppendLine(@"
                        <div class='modality-detail-item'>
                            <div class='modality-detail-label'>✅ Requisitos:</div>
                            <div class='modality-detail-value'>
                                • Conexión estable a internet<br>
                                • Cámara y micrófono funcionando<br>
                                • Lugar tranquilo con buena iluminación
                            </div>
                        </div>");

            if (!string.IsNullOrWhiteSpace(solicitud.InstruccionesVirtual))
            {
                html.AppendLine($@"
                        <div class='modality-detail-item'>
                            <div class='modality-detail-label'>📝 Instrucciones adicionales:</div>
                            <div class='modality-detail-value'>{EscapeHtml(solicitud.InstruccionesVirtual)}</div>
                        </div>");
            }

            html.AppendLine("</div></div>");

            // MODALIDAD 2: TELEFÓNICA
            html.AppendLine(@"
                <div class='modality-card'>
                    <div class='modality-header'>
                        <div class='modality-icon'>📞</div>
                        <div class='modality-title'>Opción 2: Entrevista Telefónica</div>
                    </div>
                    <div class='modality-details'>");

            string telefonoMostrar = !string.IsNullOrWhiteSpace(solicitud.TelefonoContacto)
                ? solicitud.TelefonoContacto
                : solicitud.Telefono;

            html.AppendLine($@"
                        <div class='modality-detail-item'>
                            <div class='modality-detail-label'>📱 Nosotros te llamaremos al:</div>
                            <div class='modality-detail-value' style='font-size: 18px; font-weight: 600; color: #1976d2;'>
                                {EscapeHtml(telefonoMostrar)}
                            </div>
                        </div>
                        <div class='modality-detail-item'>
                            <div style='font-size: 14px; margin-bottom: 5px;'>
                                <strong>📞 Desde el número de la empresa:</strong>
                            </div>
                            <div style='font-size: 18px; font-weight: 700; color: #92400e;'>
                                {_empresaTelefono}
                            </div>
                            <div style='font-size: 12px; color: #78350f; margin-top: 8px; font-style: italic;'>
                                ℹ️ Guarda este número para identificar nuestra llamada
                            </div>
                        </div>
                        <div class='modality-detail-item'>
                            <div class='modality-detail-label'>✅ Requisitos:</div>
                            <div class='modality-detail-value'>
                                • Mantén tu teléfono disponible<br>
                                • Asegura buena señal y batería<br>
                                • Busca un lugar tranquilo
                            </div>
                        </div>");

            if (!string.IsNullOrWhiteSpace(solicitud.InstrucionesTelefonica))
            {
                html.AppendLine($@"
                        <div class='modality-detail-item'>
                            <div class='modality-detail-label'>📝 Instrucciones adicionales:</div>
                            <div class='modality-detail-value'>{EscapeHtml(solicitud.InstrucionesTelefonica)}</div>
                        </div>");
            }

            html.AppendLine("</div></div>");

            // MODALIDAD 3: PRESENCIAL
            html.AppendLine(@"
                <div class='modality-card'>
                    <div class='modality-header'>
                        <div class='modality-icon'>🏢</div>
                        <div class='modality-title'>Opción 3: Entrevista Presencial</div>
                    </div>
                    <div class='modality-details'>");

            string direccion = !string.IsNullOrWhiteSpace(solicitud.DireccionEntrevista)
                ? solicitud.DireccionEntrevista
                : "Rio Sena #94, 3er. Piso Col. Rio Lerma Cuauhtémoc, Ciudad de México C.P.06500";

            html.AppendLine($@"
                        <div class='modality-detail-item'>
                            <div class='modality-detail-label'>📍 Dirección:</div>
                            <div class='modality-detail-value'>{EscapeHtml(direccion)}</div>
                        </div>
                        <div class='modality-detail-item'>
                            <div class='modality-detail-label'>✅ Requisitos:</div>
                            <div class='modality-detail-value'>
                                • Llega 10 minutos antes<br>
                                • Trae identificación oficial<br>
                                • Viste de forma profesional<br>
                                • Trae copias impresas de tu CV
                            </div>
                        </div>");

            if (!string.IsNullOrWhiteSpace(solicitud.InstruccionesPresencial))
            {
                html.AppendLine($@"
                        <div class='modality-detail-item'>
                            <div class='modality-detail-label'>📝 Instrucciones adicionales:</div>
                            <div class='modality-detail-value'>{EscapeHtml(solicitud.InstruccionesPresencial)}</div>
                        </div>");
            }

            html.AppendLine("</div></div>");

            return html.ToString();
        }

        private string GenerarEmailCV(SolicitudCV datos)
        {
            string tipoSolicitudTexto = datos.TipoSolicitud == "residencia" ? "Residencias Profesionales" : "Oportunidad Laboral";
            string iconoTipo = datos.TipoSolicitud == "residencia" ? "🎓" : "💼";
            string colorTipo = datos.TipoSolicitud == "residencia" ? "#28a745" : "#1E3A5F";

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
                     -webkit-text-size-adjust: 100%;
                     -ms-text-size-adjust: 100%;
                 }}
                 .container {{ 
                     max-width: 100%; 
                     width: 100%;
                     margin: 0 auto; 
                     padding: 0; 
                     background: #ffffff; 
                 }}
                 .header {{ 
                     background: linear-gradient(135deg, {colorTipo} 0%, #2c5282 100%); 
                     color: white; 
                     padding: 20px 15px; 
                     text-align: center; 
                 }}
                 .header h2 {{ 
                     margin: 0; 
                     font-size: 20px; 
                     font-weight: 600; 
                     word-wrap: break-word;
                 }}
                 .header .subtitle {{ 
                     font-size: 14px; 
                     opacity: 0.9; 
                     margin-top: 8px; 
                 }}
                 .content {{ 
                     padding: 20px 15px; 
                     background: #f8f9fa; 
                 }}
                 .section {{ 
                     background: white; 
                     margin-bottom: 20px; 
                     padding: 20px 15px; 
                     border-radius: 8px; 
                     box-shadow: 0 2px 8px rgba(0,0,0,0.1); 
                 }}
                 .section-title {{ 
                     color: {colorTipo}; 
                     font-size: 16px; 
                     font-weight: 600; 
                     margin-bottom: 15px; 
                     padding-bottom: 8px; 
                     border-bottom: 2px solid #e9ecef; 
                 }}
                 .field {{ 
                     margin-bottom: 12px; 
                     display: block;
                 }}
                 .field-label {{ 
                     font-weight: 600; 
                     color: #495057; 
                     display: block;
                     margin-bottom: 4px;
                     font-size: 14px;
                 }}
                 .field-value {{ 
                     color: #333; 
                     display: block;
                     word-wrap: break-word;
                     overflow-wrap: break-word;
                 }}
                 .highlight-box {{ 
                     background: linear-gradient(135deg, #e3f2fd 0%, #f3e5f5 100%); 
                     padding: 15px; 
                     border-radius: 8px; 
                     border-left: 4px solid {colorTipo}; 
                     margin: 15px 0; 
                 }}
                 .footer {{ 
                     background: #343a40; 
                     color: white; 
                     padding: 20px 15px; 
                     text-align: center; 
                 }}
                 .footer h4 {{ 
                     margin: 0 0 10px 0; 
                     color: #fff; 
                     font-size: 16px;
                 }}
                 .footer p {{ 
                     margin: 5px 0; 
                     opacity: 0.8; 
                     font-size: 12px;
                 }}
                 .tipo-badge {{ 
                     display: inline-block; 
                     background: {colorTipo}; 
                     color: white; 
                     padding: 8px 12px; 
                     border-radius: 20px; 
                     font-size: 12px; 
                     font-weight: 600; 
                     margin-bottom: 15px; 
                 }}
                 .experiencia-nivel {{ 
                     padding: 6px 12px; 
                     border-radius: 6px; 
                     display: inline-block; 
                     font-weight: 600;
                     color: white;
                     font-size: 12px;
                 }}
                 .exp-0-1 {{ background: #28a745; }}
                 .exp-2-3 {{ background: #fd7e14; }}
                 .exp-4-plus {{ background: #dc3545; }}
                 .contact-info {{ 
                     background: #e8f5e8; 
                     padding: 12px; 
                     border-radius: 8px; 
                     margin: 10px 0; 
                 }}
                 .alert-box {{
                     padding: 12px;
                     border-radius: 6px;
                     margin-top: 10px;
                     font-size: 14px;
                 }}
                 .alert-info {{
                     background: #d1ecf1;
                     color: #0c5460;
                     border-left: 4px solid #17a2b8;
                 }}
                 .alert-warning {{
                     background: #f8d7da;
                     color: #721c24;
                     border-left: 4px solid #dc3545;
                 }}
                 
                 @media only screen and (max-width: 480px) {{
                     .container {{
                         width: 100% !important;
                         max-width: 100% !important;
                     }}
                     .header {{
                         padding: 15px 10px !important;
                     }}
                     .header h2 {{
                         font-size: 18px !important;
                         line-height: 1.3;
                     }}
                     .content {{
                         padding: 15px 10px !important;
                     }}
                     .section {{
                         padding: 15px 12px !important;
                         margin-bottom: 15px !important;
                     }}
                     .section-title {{
                         font-size: 15px !important;
                     }}
                     .field-label {{
                         font-size: 13px !important;
                     }}
                     .highlight-box {{
                         padding: 12px !important;
                         margin: 10px 0 !important;
                     }}
                     .tipo-badge {{
                         font-size: 11px !important;
                         padding: 6px 10px !important;
                     }}
                     .experiencia-nivel {{
                         font-size: 11px !important;
                         padding: 5px 10px !important;
                     }}
                     .footer {{
                         padding: 15px 10px !important;
                     }}
                     .footer h4 {{
                         font-size: 14px !important;
                     }}
                     .footer p {{
                         font-size: 11px !important;
                     }}
                 }}
             </style>
         </head>
         <body>
             <div class='container'>
                 <div class='header'>
                     <h2>{iconoTipo} Nueva Solicitud<br>{tipoSolicitudTexto}</h2>
                     <div class='subtitle'>Consultoría Integral SC</div>
                 </div>
                 
                 <div class='content'>
                     <div class='tipo-badge'>{iconoTipo} {tipoSolicitudTexto}</div>
                     
                     <!-- Información Personal -->
                     <div class='section'>
                         <h3 class='section-title'>👤 Información Personal</h3>
                         <div class='field'>
                             <span class='field-label'>Nombre Completo:</span>
                             <span class='field-value'><strong>{datos.NombreCompleto}</strong></span>
                         </div>
                         <div class='contact-info'>
                             <div class='field'>
                                 <span class='field-label'>📧 Email:</span>
                                 <span class='field-value'><a href='mailto:{datos.Email}' style='color: #007bff; text-decoration: none; word-break: break-all;'>{datos.Email}</a></span>
                             </div>
                             <div class='field'>
                                 <span class='field-label'>📱 Teléfono:</span>
                                 <span class='field-value'><a href='tel:{datos.Telefono}' style='color: #007bff; text-decoration: none;'>{datos.Telefono}</a></span>
                             </div>
                         </div>
                     </div>");

            // Sección académica (SOLO para residencias)
            if (datos.TipoSolicitud == "residencia" && (!string.IsNullOrWhiteSpace(datos.Carrera) || !string.IsNullOrWhiteSpace(datos.Universidad)))
            {
                emailBody.AppendLine(@"
                     <!-- Información Académica -->
                     <div class='section'>
                         <h3 class='section-title'>🎓 Información Académica</h3>");

                if (!string.IsNullOrWhiteSpace(datos.Carrera))
                {
                    emailBody.AppendLine($@"
                         <div class='field'>
                             <span class='field-label'>Carrera:</span>
                             <span class='field-value'>{datos.Carrera}</span>
                         </div>");
                }

                if (!string.IsNullOrWhiteSpace(datos.Universidad))
                {
                    emailBody.AppendLine($@"
                         <div class='field'>
                             <span class='field-label'>Universidad:</span>
                             <span class='field-value'>{datos.Universidad}</span>
                         </div>");
                }

                emailBody.AppendLine("</div>");
            }

            // Sección profesional (SOLO para trabajos)
            if (datos.TipoSolicitud == "trabajo" && (!string.IsNullOrWhiteSpace(datos.Experiencia) || !string.IsNullOrWhiteSpace(datos.PosicionInteres)))
            {
                emailBody.AppendLine(@"
                     <!-- Información Profesional -->
                     <div class='section'>
                         <h3 class='section-title'>💼 Información Profesional</h3>");

                if (!string.IsNullOrWhiteSpace(datos.Experiencia))
                {
                    string experienciaClass = datos.Experiencia switch
                    {
                        "0-1 años" => "exp-0-1",
                        "2-3 años" => "exp-2-3",
                        "4+ años" => "exp-4-plus",
                        _ => "exp-0-1"
                    };

                    emailBody.AppendLine($@"
                         <div class='field'>
                             <span class='field-label'>Experiencia:</span>
                             <span class='field-value'>
                                 <span class='experiencia-nivel {experienciaClass}'>{datos.Experiencia}</span>
                             </span>
                         </div>");
                }

                if (!string.IsNullOrWhiteSpace(datos.PosicionInteres))
                {
                    emailBody.AppendLine($@"
                         <div class='field'>
                             <span class='field-label'>Posición de Interés:</span>
                             <span class='field-value'><strong>{datos.PosicionInteres}</strong></span>
                         </div>");
                }

                emailBody.AppendLine("</div>");
            }

            // Mensaje personalizado
            if (!string.IsNullOrWhiteSpace(datos.Mensaje))
            {
                emailBody.AppendLine($@"
                     <!-- Mensaje -->
                     <div class='section'>
                         <h3 class='section-title'>💬 Mensaje del Candidato</h3>
                         <div class='highlight-box'>
                             <p style='margin: 0; white-space: pre-wrap; line-height: 1.6; word-wrap: break-word;'>{datos.Mensaje}</p>
                         </div>
                     </div>");
            }

            // Información del archivo CV
            emailBody.AppendLine(@"
                     <!-- Archivo CV -->
                     <div class='section'>
                         <h3 class='section-title'>📄 Curriculum Vitae</h3>");

            if (datos.ArchivoCV != null && datos.ArchivoCV.Length > 0)
            {
                emailBody.AppendLine($@"
                         <div class='field'>
                             <span class='field-label'>Archivo:</span>
                             <span class='field-value'>
                                 📎 <strong>{datos.NombreArchivoCV}</strong> 
                                 <span style='color: #6c757d;'>({datos.ArchivoCV.Length / 1024:F1} KB)</span>
                             </span>
                         </div>
                         <div class='alert-box alert-info'>
                             ℹ️ El archivo CV se encuentra adjunto a este correo electrónico.
                         </div>");
            }
            else
            {
                emailBody.AppendLine(@"
                         <div class='alert-box alert-warning'>
                             ⚠️ No se adjuntó archivo de CV con esta solicitud.
                         </div>");
            }

            emailBody.AppendLine("</div>");

            // Footer
            emailBody.AppendLine($@"
                 </div>
                 
                 <div class='footer'>
                     <h4>Consultoría Integral SC</h4>
                     <p>Departamento de Recursos Humanos</p>
                     <p>Solicitud recibida el {DateTime.Now:dd/MM/yyyy 'a las' HH:mm:ss}</p>
                     <p>Sistema automatizado de recepción de CV</p>
                 </div>
             </div>
         </body>
         </html>");

            return emailBody.ToString();
        }

        private string EscapeHtml(string text)
        {
            if (string.IsNullOrEmpty(text)) return "";
            return text
                .Replace("&", "&amp;")
                .Replace("<", "&lt;")
                .Replace(">", "&gt;")
                .Replace("\"", "&quot;")
                .Replace("'", "&#39;");
        }
    }
}