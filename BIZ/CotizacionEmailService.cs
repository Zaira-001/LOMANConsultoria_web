using COMMON.Entidades;
using System;
using System.Collections.Generic;
using System.Globalization;
using System.Linq;
using System.Net;
using System.Net.Mail;
using System.Text;
using System.Threading.Tasks;

namespace BIZ
{
    public class CotizacionEmailService
    {
        private readonly string _smtpServer = "smtp.gmail.com";
        private readonly int _smtpPort = 587;
        private readonly string _smtpUsername = "zaira7731479269@gmail.com";
        private readonly string _smtpPassword = "whaf gfpi gjpa bpaf";
        private readonly string _fromEmail = "zaira7731479269@gmail.com";
        private readonly CultureInfo _culturaEspañol = new CultureInfo("es-MX");

        // Email de confirmación al cliente
        public async Task<bool> EnviarConfirmacionCotizacion(Cotizacion cotizacion)
        {
            try
            {
                System.Diagnostics.Debug.WriteLine($"📧 Enviando confirmación de cotización a: {cotizacion.Correo}");

                using var smtpClient = new SmtpClient(_smtpServer, _smtpPort);
                smtpClient.EnableSsl = true;
                smtpClient.Credentials = new NetworkCredential(_smtpUsername, _smtpPassword);

                var emailBody = GenerarEmailConfirmacion(cotizacion);

                var mailMessage = new MailMessage
                {
                    From = new MailAddress(_fromEmail, "Consultoría Integral SC"),
                    Subject = $"✅ Solicitud de Cotización Recibida - Folio #{cotizacion.Id:D6}",
                    Body = emailBody,
                    IsBodyHtml = true
                };

                mailMessage.To.Add(cotizacion.Correo);
                mailMessage.BodyEncoding = Encoding.UTF8;
                mailMessage.SubjectEncoding = Encoding.UTF8;

                await smtpClient.SendMailAsync(mailMessage);
                mailMessage.Dispose();

                System.Diagnostics.Debug.WriteLine("✅ Email de confirmación enviado");
                return true;
            }
            catch (Exception ex)
            {
                System.Diagnostics.Debug.WriteLine($"❌ Error enviando confirmación: {ex.Message}");
                return false;
            }
        }

        // Email con la cotización al cliente
        public async Task<bool> EnviarCotizacionCliente(Cotizacion cotizacion, string respuesta, decimal? monto)
        {
            try
            {
                System.Diagnostics.Debug.WriteLine($"📧 Enviando cotización a: {cotizacion.Correo}");

                using var smtpClient = new SmtpClient(_smtpServer, _smtpPort);
                smtpClient.EnableSsl = true;
                smtpClient.Credentials = new NetworkCredential(_smtpUsername, _smtpPassword);

                var emailBody = GenerarEmailCotizacion(cotizacion, respuesta, monto);

                var mailMessage = new MailMessage
                {
                    From = new MailAddress(_fromEmail, "Consultoría Integral SC"),
                    Subject = $"📋 Tu Cotización está Lista - Folio #{cotizacion.Id:D6}",
                    Body = emailBody,
                    IsBodyHtml = true
                };

                mailMessage.To.Add(cotizacion.Correo);
                mailMessage.BodyEncoding = Encoding.UTF8;
                mailMessage.SubjectEncoding = Encoding.UTF8;

                await smtpClient.SendMailAsync(mailMessage);
                mailMessage.Dispose();

                System.Diagnostics.Debug.WriteLine("✅ Cotización enviada por email");
                return true;
            }
            catch (Exception ex)
            {
                System.Diagnostics.Debug.WriteLine($"❌ Error enviando cotización: {ex.Message}");
                return false;
            }
        }

        private string GenerarEmailConfirmacion(Cotizacion cotizacion)
        {
            string prioridadColor = cotizacion.Prioridad switch
            {
                "Urgente" => "#dc3545",
                "Alta" => "#ff9800",
                _ => "#2196F3"
            };

            string tiempoRespuesta = cotizacion.Prioridad switch
            {
                "Urgente" => "inmediato (dentro de 2 horas)",
                "Alta" => "en las próximas 24 horas",
                _ => "en 24-48 horas"
            };

            string whatsappMessage = $"Hola, solicité una cotización con folio #{cotizacion.Id:D6}. Mi nombre es {cotizacion.Nombre}.";
            string whatsappLink = $"https://wa.me/5215659644304?text={Uri.EscapeDataString(whatsappMessage)}";

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
                            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                            color: white;
                            padding: 30px 20px;
                            text-align: center;
                        }}
                        .header h1 {{
                            margin: 0;
                            font-size: 28px;
                            font-weight: 700;
                        }}
                        .folio-badge {{
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
                            border-left: 5px solid {prioridadColor};
                            margin-bottom: 25px;
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
                        .prioridad-box {{
                            background: {prioridadColor};
                            color: white;
                            padding: 15px;
                            border-radius: 8px;
                            text-align: center;
                            margin: 20px 0;
                            font-weight: 600;
                        }}
                        .next-steps {{
                            background: #fff8e1;
                            border-left: 4px solid #ffc107;
                            padding: 20px;
                            border-radius: 8px;
                            margin: 20px 0;
                        }}
                        .next-steps h4 {{
                            margin: 0 0 15px 0;
                            color: #f57c00;
                        }}
                        .next-steps ul {{
                            margin: 0;
                            padding-left: 20px;
                        }}
                        .next-steps li {{
                            margin: 8px 0;
                        }}
                        .cta-button {{
                            display: inline-block;
                            background: #667eea;
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
                        @media only screen and (max-width: 480px) {{
                            .container {{
                                margin: 0;
                                border-radius: 0;
                            }}
                            .content {{
                                padding: 20px 15px;
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
                            <h1>✅ Solicitud Recibida</h1>
                            <div class='folio-badge'>Folio #{cotizacion.Id:D6}</div>
                        </div>
                        
                        <div class='content'>
                            <div class='message-box'>
                                <p><strong>Hola {escapeHtml(cotizacion.Nombre)},</strong></p>
                                <p style='margin-top: 10px;'>
                                    ¡Gracias por tu interés en nuestros servicios! Hemos recibido tu solicitud 
                                    de cotización y estamos revisando todos los detalles.
                                </p>
                            </div>
                            
                            <div class='info-section'>
                                <h3 style='margin-top: 0; color: #1E3A5F;'>📋 Resumen de tu Solicitud</h3>
                                
                                <div class='info-row'>
                                    <div class='info-label'>📋 Servicio:</div>
                                    <div class='info-value'>{escapeHtml(cotizacion.TipoConsulta)}</div>
                                </div>
                                
                                <div class='info-row'>
                                    <div class='info-label'>📱 Teléfono:</div>
                                    <div class='info-value'>{escapeHtml(cotizacion.Telefono)}</div>
                                </div>
                                
                                {(!string.IsNullOrWhiteSpace(cotizacion.NombreEmpresa) ? $@"
                                <div class='info-row'>
                                    <div class='info-label'>🏢 Empresa:</div>
                                    <div class='info-value'>{escapeHtml(cotizacion.NombreEmpresa)}</div>
                                </div>
                                " : "")}
                                
                                <div class='info-row'>
                                    <div class='info-label'>⚡ Prioridad:</div>
                                    <div class='info-value'><strong style='color: {prioridadColor};'>{cotizacion.Prioridad}</strong></div>
                                </div>
                            </div>
                            
                            <div class='prioridad-box'>
                                ⏱️ Tiempo de respuesta estimado: <strong>{tiempoRespuesta}</strong>
                            </div>
                            
                            <div class='next-steps'>
                                <h4>📌 Próximos Pasos</h4>
                                <ul>
                                    <li>Nuestro equipo revisará tu solicitud de inmediato</li>
                                    <li>Te contactaremos {tiempoRespuesta}</li>
                                    <li>Recibirás una cotización detallada por email</li>
                                    <li>Podrás resolver todas tus dudas con un asesor</li>
                                </ul>
                            </div>
                            
                            <div style='text-align: center; padding: 20px 0;'>
                                <p style='color: #666; margin-bottom: 15px;'>¿Necesitas contactarnos ahora?</p>
                                <a href='tel:5659644304' class='cta-button'>📞 Llamar</a>
                                <a href='{whatsappLink}' class='whatsapp-button'>💬 WhatsApp</a>
                            </div>
                            
                            <div style='background: #e8f5e9; padding: 15px; border-radius: 8px; border-left: 4px solid #4caf50;'>
                                <p style='margin: 0; color: #2e7d32;'>
                                    <strong>💡 Consejo:</strong> Mantén este correo para futuras referencias. 
                                    Tu número de folio es: <strong>#{cotizacion.Id:D6}</strong>
                                </p>
                            </div>
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
                                Sistema automatizado de notificaciones - No responder a este correo
                            </p>
                        </div>
                    </div>
                </body>
                </html>
            ");

            return emailBody.ToString();
        }

        private string GenerarEmailCotizacion(Cotizacion cotizacion, string respuesta, decimal? monto)
        {
            string montoTexto = monto.HasValue
                ? $"${monto.Value:N2} MXN"
                : "A consultar según especificaciones";

            string whatsappMessage = $"Hola, recibí la cotización #{cotizacion.Id:D6} y me gustaría agendar una reunión para discutir los detalles.";
            string whatsappLink = $"https://wa.me/5215659644304?text={Uri.EscapeDataString(whatsappMessage)}";

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
                            background: linear-gradient(135deg, #28a745 0%, #20c997 100%);
                            color: white;
                            padding: 30px 20px;
                            text-align: center;
                        }}
                        .header h1 {{
                            margin: 0;
                            font-size: 28px;
                            font-weight: 700;
                        }}
                        .content {{
                            padding: 30px 25px;
                        }}
                        .monto-box {{
                            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                            color: white;
                            padding: 25px;
                            border-radius: 12px;
                            text-align: center;
                            margin: 25px 0;
                            box-shadow: 0 4px 15px rgba(102, 126, 234, 0.4);
                        }}
                        .monto-box h3 {{
                            margin: 0 0 10px 0;
                            font-size: 18px;
                            opacity: 0.9;
                        }}
                        .monto-box .monto {{
                            font-size: 36px;
                            font-weight: 700;
                            margin: 10px 0;
                        }}
                        .respuesta-box {{
                            background: #f8f9fa;
                            padding: 20px;
                            border-radius: 8px;
                            border-left: 4px solid #28a745;
                            margin: 20px 0;
                            white-space: pre-wrap;
                            line-height: 1.8;
                        }}
                        .info-section {{
                            background: #fff3cd;
                            padding: 20px;
                            border-radius: 8px;
                            border-left: 4px solid #ffc107;
                            margin: 20px 0;
                        }}
                        .cta-container {{
                            text-align: center;
                            padding: 30px 0;
                            background: linear-gradient(135deg, #e3f2fd 0%, #f3e5f5 100%);
                            border-radius: 10px;
                            margin: 25px 0;
                        }}
                        .cta-button {{
                            display: inline-block;
                            background: #28a745;
                            color: white;
                            padding: 15px 35px;
                            border-radius: 25px;
                            text-decoration: none;
                            font-weight: 600;
                            margin: 10px;
                            font-size: 16px;
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
                            font-size: 16px;
                        }}
                        .footer {{
                            background: #343a40;
                            color: white;
                            padding: 25px;
                            text-align: center;
                        }}
                        @media only screen and (max-width: 480px) {{
                            .container {{
                                margin: 0;
                                border-radius: 0;
                            }}
                            .monto-box .monto {{
                                font-size: 28px;
                            }}
                            .cta-button, .whatsapp-button {{
                                display: block;
                                margin: 10px auto;
                            }}
                        }}
                    </style>
                </head>
                <body>
                    <div class='container'>
                        <div class='header'>
                            <h1>📋 Tu Cotización está Lista</h1>
                            <p style='margin: 10px 0 0 0; opacity: 0.9;'>Folio #{cotizacion.Id:D6}</p>
                        </div>
                        
                        <div class='content'>
                            <p style='font-size: 18px; color: #28a745; font-weight: 600;'>
                                ¡Hola {escapeHtml(cotizacion.Nombre)}!
                            </p>
                            
                            <p>
                                Hemos preparado tu cotización para <strong>{escapeHtml(cotizacion.TipoConsulta)}</strong>. 
                                A continuación encontrarás todos los detalles:
                            </p>
                            
                            <div class='monto-box'>
                                <h3>💰 Inversión Estimada</h3>
                                <div class='monto'>{montoTexto}</div>
                                <p style='margin: 5px 0 0 0; opacity: 0.9; font-size: 14px;'>
                                    {(monto.HasValue ? "IVA incluido" : "Cotización personalizada según necesidades")}
                                </p>
                            </div>
                            
                            <div class='respuesta-box'>
                                <h4 style='margin-top: 0; color: #28a745;'>📝 Detalles de la Cotización</h4>
                                {escapeHtml(respuesta)}
                            </div>
                            
                            <div class='info-section'>
                                <h4 style='margin-top: 0; color: #856404;'>✨ ¿Qué incluye?</h4>
                                <ul style='margin: 10px 0;'>
                                    <li>Asesoría personalizada de inicio a fin</li>
                                    <li>Soporte durante todo el proceso</li>
                                    <li>Garantía de calidad y cumplimiento</li>
                                    <li>Seguimiento post-servicio</li>
                                </ul>
                            </div>
                            
                            <div class='cta-container'>
                                <h3 style='margin-top: 0; color: #667eea;'>¿Listo para comenzar?</h3>
                                <p style='color: #666; margin: 15px 0;'>
                                    Agenda una reunión con nosotros para resolver cualquier duda
                                </p>
       
                                <a href='{whatsappLink}' class='whatsapp-button'>💬 Hablar por WhatsApp</a>
                                <p style='margin-top: 20px; font-size: 13px; color: #999;'>
                                    O llámanos al: <strong style='color: #333;'>56-5964-4304</strong>
                                </p>
                            </div>
                            
                            <div style='background: #e8f5e9; padding: 15px; border-radius: 8px; border-left: 4px solid #4caf50;'>
                                <p style='margin: 0; color: #2e7d32;'>
                                    <strong>⏰ Esta cotización es válida por 30 días</strong><br>
                                    Folio de referencia: <strong>#{cotizacion.Id:D6}</strong>
                                </p>
                            </div>
                        </div>
                        
                        <div class='footer'>
                            <h4>Consultoría Integral SC</h4>
                            <p>Tu socio estratégico en soluciones empresariales</p>
                            <p style='margin-top: 15px;'>
                                📞 56-5964-4304 | 📧 lomanconsultoria2025@gmail.com
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

        private string escapeHtml(string text)
        {
            if (string.IsNullOrEmpty(text)) return "";
            return text
                .Replace("&", "&amp;")
                .Replace("<", "&lt;")
                .Replace(">", "&gt;")
                .Replace("\"", "&quot;")
                .Replace("'", "&#39;");
        }


        // Agrega este método al final de tu CotizacionEmailService.cs

        public async Task<bool> EnviarCotizacionClienteConPDF(Cotizacion cotizacion, string respuesta, decimal? monto)
        {
            try
            {
                System.Diagnostics.Debug.WriteLine($"📧 Enviando cotización con PDF a: {cotizacion.Correo}");

                using var smtpClient = new SmtpClient(_smtpServer, _smtpPort);
                smtpClient.EnableSsl = true;
                smtpClient.Credentials = new NetworkCredential(_smtpUsername, _smtpPassword);

                var emailBody = GenerarEmailCotizacion(cotizacion, respuesta, monto);

                var mailMessage = new MailMessage
                {
                    From = new MailAddress(_fromEmail, "Consultoría Integral SC"),
                    Subject = $"📋 Tu Cotización está Lista - Folio #{cotizacion.Id:D6}",
                    Body = emailBody,
                    IsBodyHtml = true
                };

                mailMessage.To.Add(cotizacion.Correo);
                mailMessage.BodyEncoding = Encoding.UTF8;
                mailMessage.SubjectEncoding = Encoding.UTF8;

                // ADJUNTAR PDF SI EXISTE
                if (cotizacion.NombreArchivoPDF != null && cotizacion.NombreArchivoPDF.Length > 0)
                {
                    string nombreArchivo = cotizacion.NombreArchivoPDF ?? $"Cotizacion_{cotizacion.Id:D6}.pdf";
                    var attachment = new Attachment(
                        nombreArchivo,
                        "application/pdf"
                    );
                    mailMessage.Attachments.Add(attachment);
                    System.Diagnostics.Debug.WriteLine($"📎 PDF adjuntado: {nombreArchivo} ({cotizacion.NombreArchivoPDF.Length} bytes)");
                }

                await smtpClient.SendMailAsync(mailMessage);
                mailMessage.Dispose();

                System.Diagnostics.Debug.WriteLine("✅ Cotización con PDF enviada por email");
                return true;
            }
            catch (Exception ex)
            {
                System.Diagnostics.Debug.WriteLine($"❌ Error enviando cotización con PDF: {ex.Message}");
                return false;
            }
        }
    }
}