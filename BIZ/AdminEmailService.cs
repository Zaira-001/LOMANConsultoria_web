using System;
using System.Net;
using System.Net.Mail;
using System.Text;
using System.Threading.Tasks;

namespace BIZ
{
    public class AdminEmailService
    {
        private readonly string _smtpServer = "smtp.gmail.com";
        private readonly int _smtpPort = 587;
        private readonly string _smtpUsername = "zaira7731479269@gmail.com";
        private readonly string _smtpPassword = "whaf gfpi gjpa bpaf";
        private readonly string _fromEmail = "zaira7731479269@gmail.com";

        // 🆕 La URL base se pasa como parámetro cuando se envía el email
        public async Task<bool> EnviarCredencialesNuevoAdmin(
            DatosCredencialesAdmin datos,
            string baseUrl) // 👈 URL dinámica del servidor actual
        {
            try
            {
                System.Diagnostics.Debug.WriteLine("📧 === ENVIANDO CREDENCIAS DE ADMIN ===");
                System.Diagnostics.Debug.WriteLine($"📧 Para: {datos.Email}");
                System.Diagnostics.Debug.WriteLine($"📧 Usuario: {datos.Username}");
                System.Diagnostics.Debug.WriteLine($"📧 URL Base: {baseUrl}");

                using var smtpClient = new SmtpClient(_smtpServer, _smtpPort);
                smtpClient.EnableSsl = true;
                smtpClient.Credentials = new NetworkCredential(_smtpUsername, _smtpPassword);

                var emailBody = GenerarEmailCredenciales(datos, baseUrl);

                var mailMessage = new MailMessage
                {
                    From = new MailAddress(_fromEmail, "Consultoría Integral SC - Sistema"),
                    Subject = "🔐 Credenciales de Acceso al Panel de Administración",
                    Body = emailBody,
                    IsBodyHtml = true
                };

                mailMessage.To.Add(datos.Email);
                mailMessage.BodyEncoding = Encoding.UTF8;
                mailMessage.SubjectEncoding = Encoding.UTF8;

                await smtpClient.SendMailAsync(mailMessage);
                mailMessage.Dispose();

                System.Diagnostics.Debug.WriteLine("✅ Email de credenciales enviado correctamente");
                return true;
            }
            catch (Exception ex)
            {
                System.Diagnostics.Debug.WriteLine($"❌ Error enviando credenciales: {ex.Message}");
                System.Diagnostics.Debug.WriteLine($"❌ Stack trace: {ex.StackTrace}");
                return false;
            }
        }

        private string GenerarEmailCredenciales(DatosCredencialesAdmin datos, string baseUrl)
        {
            // 🆕 Construir URL de login dinámica
            var loginUrl = $"{baseUrl}/login";

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
                        .welcome-badge {{
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
                        .greeting {{
                            font-size: 18px;
                            color: #667eea;
                            font-weight: 600;
                            margin-bottom: 15px;
                        }}
                        .intro-text {{
                            color: #666;
                            margin-bottom: 25px;
                            line-height: 1.8;
                        }}
                        .credentials-box {{
                            background: linear-gradient(135deg, #e3f2fd 0%, #f3e5f5 100%);
                            padding: 25px;
                            border-radius: 12px;
                            border-left: 5px solid #667eea;
                            margin: 25px 0;
                        }}
                        .credentials-box h3 {{
                            margin: 0 0 20px 0;
                            color: #667eea;
                            font-size: 18px;
                        }}
                        .credential-item {{
                            background: white;
                            padding: 15px;
                            border-radius: 8px;
                            margin-bottom: 15px;
                            border: 1px solid #e0e0e0;
                        }}
                        .credential-item:last-child {{
                            margin-bottom: 0;
                        }}
                        .credential-label {{
                            font-weight: 600;
                            color: #555;
                            font-size: 13px;
                            text-transform: uppercase;
                            letter-spacing: 0.5px;
                            margin-bottom: 5px;
                        }}
                        .credential-value {{
                            font-size: 18px;
                            color: #333;
                            font-weight: 700;
                            font-family: 'Courier New', monospace;
                            word-break: break-all;
                        }}
                        .warning-box {{
                            background: #fff8e1;
                            border-left: 4px solid #ffc107;
                            padding: 20px;
                            border-radius: 8px;
                            margin: 20px 0;
                        }}
                        .warning-box h4 {{
                            margin: 0 0 10px 0;
                            color: #f57c00;
                            font-size: 16px;
                        }}
                        .warning-box ul {{
                            margin: 10px 0;
                            padding-left: 20px;
                        }}
                        .warning-box li {{
                            margin: 8px 0;
                            color: #856404;
                        }}
                        .instructions {{
                            background: #f8f9fa;
                            padding: 20px;
                            border-radius: 8px;
                            margin: 20px 0;
                        }}
                        .instructions h4 {{
                            margin: 0 0 15px 0;
                            color: #667eea;
                        }}
                        .instructions ol {{
                            margin: 0;
                            padding-left: 20px;
                        }}
                        .instructions li {{
                            margin: 10px 0;
                            color: #555;
                        }}
                        .cta-button {{
                            display: inline-block;
                            background: #667eea;
                            color: white;
                            padding: 15px 35px;
                            border-radius: 25px;
                            text-decoration: none;
                            font-weight: 600;
                            margin: 20px 0;
                            text-align: center;
                        }}
                        .url-display {{
                            background: #f8f9fa;
                            padding: 15px;
                            border-radius: 8px;
                            border: 1px solid #e0e0e0;
                            margin: 20px 0;
                            word-break: break-all;
                        }}
                        .url-display code {{
                            color: #667eea;
                            font-family: 'Courier New', monospace;
                            font-size: 14px;
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
                            .credential-value {{
                                font-size: 16px;
                            }}
                        }}
                    </style>
                </head>
                <body>
                    <div class='container'>
                        <div class='header'>
                            <h1>🔐 Bienvenido al Sistema</h1>
                            <div class='welcome-badge'>Panel de Administración</div>
                        </div>
                        
                        <div class='content'>
                            <p class='greeting'>¡Hola {escapeHtml(datos.NombreCompleto ?? datos.Username)}!</p>
                            
                            <p class='intro-text'>
                                Se ha creado una cuenta de administrador para ti en el sistema de 
                                <strong>Consultoría Integral SC</strong>. A continuación encontrarás 
                                tus credenciales de acceso:
                            </p>
                            
                            <div class='credentials-box'>
                                <h3>🔑 Tus Credenciales de Acceso</h3>
                                
                                <div class='credential-item'>
                                    <div class='credential-label'>👤 Usuario</div>
                                    <div class='credential-value'>{escapeHtml(datos.Username)}</div>
                                </div>
                                
                                <div class='credential-item'>
                                    <div class='credential-label'>🔒 Contraseña</div>
                                    <div class='credential-value'>{escapeHtml(datos.PasswordTemporal)}</div>
                                </div>
                                
                                <div class='credential-item'>
                                    <div class='credential-label'>📧 Email</div>
                                    <div class='credential-value'>{escapeHtml(datos.Email)}</div>
                                </div>
                            </div>
                            
                            <div class='warning-box'>
                                <h4>⚠️ Importante - Seguridad</h4>
                                <ul>
                                    <li>Esta es una <strong>contraseña</strong> asignada a tu cuenta.</li>
                                    <li>Por motivos de seguridad, <strong>solo el administrador principal</strong> puede modificar contraseñas.</li>
                                    <li>No compartas tus credenciales con nadie.</li>
                                    <li>Si necesitas actualizar tu contraseña, deberás solicitar el cambio al administrador principal.</li>
                                </ul>
                            </div>
                            
                           <div class='instructions'>
                                <h4>📋 Cómo Acceder</h4>
                                <ol>
                                    <li>Dirígete a la página de login del sistema</li>
                                    <li>Ingresa tu <strong>usuario</strong> y la <strong>contraseña temporal</strong></li>
                                    <li>Una vez dentro, podrás usar el sistema según los permisos de tu rol</li>
                                    <li>Para cambios de contraseña, contacta al administrador principal</li>
                                </ol>
                            </div>
                            
                            <div style='text-align: center; margin: 30px 0;'>
                                <a href='{loginUrl}' class='cta-button' style='color: white;'>
                                    🚀 Acceder al Panel de Administración
                                </a>
                            </div>
                            
                            
                             <div style='background: #e8f5e9; padding: 15px; border-radius: 8px; border-left: 4px solid #4caf50; margin-top: 20px;'>
                                <p style='margin: 0; color: #2e7d32;'>
                                    <strong>💡 Consejo:</strong> Mantén tus credenciales en un lugar seguro y no las compartas con nadie.
                                </p>
                            </div>
                            
                            {(!string.IsNullOrWhiteSpace(datos.RolDescripcion) ? $@"
                            <div style='margin-top: 20px; padding: 15px; background: #f0f8ff; border-radius: 8px;'>
                                <p style='margin: 0; color: #0066cc;'>
                                    <strong>👔 Tu Rol:</strong> {escapeHtml(datos.RolDescripcion)}
                                </p>
                            </div>
                            " : "")}
                        </div>
                        
                        <div class='footer'>
                            <h4>Consultoría Integral SC</h4>
                            <p>Panel de Administración del Sistema</p>
                            <p style='margin-top: 15px;'>
                                📞 56-5964-4304 | 📧 lomanconsultoria2025@gmail.com
                            </p>
                            <p style='margin-top: 20px; font-size: 11px; opacity: 0.6;'>
                                Este correo fue enviado el {DateTime.Now:dd/MM/yyyy 'a las' HH:mm:ss}<br>
                                Credenciales generadas automáticamente - Notificación del sistema<br>
                                URL del sistema: {baseUrl}
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
    }

    public class DatosCredencialesAdmin
    {
        public string Username { get; set; } = "";
        public string Email { get; set; } = "";
        public string PasswordTemporal { get; set; } = "";
        public string NombreCompleto { get; set; } = "";
        public string RolDescripcion { get; set; } = "";
        public bool EsAdminPrincipal { get; set; } = false;
    }
}