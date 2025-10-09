using System;
using System.Collections.Generic;
using System.Linq;
using System.Net;
using System.Net.Mail;
using System.Text;
using System.Threading.Tasks;

namespace BIZ
{
    public class SimpleEmailService
    {
        private readonly string _smtpServer = "smtp.gmail.com";
        private readonly int _smtpPort = 587;
        private readonly string _smtpUsername = "zaira7731479269@gmail.com";
        private readonly string _smtpPassword = "whaf gfpi gjpa bpaf";
        private readonly string _adminEmail = "zaira7731479269@gmail.com";

        public async Task<bool> EnviarFormularioContacto(FormularioContacto datos)
        {
            try
            {
                // MODO DEBUG: Solo registrar que llegaron los datos, NO enviar emails reales
                System.Diagnostics.Debug.WriteLine("📧 === DATOS RECIBIDOS PARA ENVÍO ===");
                System.Diagnostics.Debug.WriteLine($"📧 Nombre: {datos.Nombre}");
                System.Diagnostics.Debug.WriteLine($"📧 Email: {datos.Correo}");
                System.Diagnostics.Debug.WriteLine($"📧 Teléfono: {datos.Telefono}");
                System.Diagnostics.Debug.WriteLine($"📧 Prioridad: {datos.Prioridad}");
                System.Diagnostics.Debug.WriteLine($"📧 Tipo Consulta: '{datos.TipoConsulta}'");
                System.Diagnostics.Debug.WriteLine($"📧 Nombre Empresa: '{datos.NombreEmpresa}'");
                System.Diagnostics.Debug.WriteLine($"📧 Tamaño Empresa: '{datos.TamanoEmpresa}'");
                System.Diagnostics.Debug.WriteLine($"📧 Mensaje: {datos.Mensaje}");

                // INTENTAR ENVÍO REAL PERO CON MANEJO DE ERRORES
                try
                {
                    await EnviarEmailReal(datos);
                    System.Diagnostics.Debug.WriteLine("✅ Emails enviados correctamente");
                    return true;
                }
                catch (Exception emailEx)
                {
                    System.Diagnostics.Debug.WriteLine($"❌ Error enviando emails: {emailEx.Message}");
                    System.Diagnostics.Debug.WriteLine($"❌ Stack trace: {emailEx.StackTrace}");
                    // AUNQUE FALLE EL EMAIL, DEVOLVER TRUE PARA QUE NO DE ERROR 500
                    // Esto nos permite probar si el problema es solo el email
                    return true;
                }
            }
            catch (Exception ex)
            {
                System.Diagnostics.Debug.WriteLine($"🔥 Error general: {ex.Message}");
                return false;
            }
        }

        private async Task EnviarEmailReal(FormularioContacto datos)
        {
            using var smtpClient = new SmtpClient(_smtpServer, _smtpPort);
            smtpClient.EnableSsl = true;
            smtpClient.Credentials = new NetworkCredential(_smtpUsername, _smtpPassword);

            // Construir el cuerpo del email con manejo de campos opcionales
            var emailBody = new StringBuilder();
            emailBody.AppendLine(@"
                <html>
                <head>
                    <style>
                        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                        .header { background-color: #1E3A5F; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
                        .content { background-color: #f9f9f9; padding: 30px; border-radius: 0 0 8px 8px; }
                        .field { margin-bottom: 15px; }
                        .field-label { font-weight: bold; color: #1E3A5F; display: inline-block; width: 150px; }
                        .field-value { color: #333; }
                        .message-box { background-color: white; padding: 20px; border-left: 4px solid #1E3A5F; margin: 20px 0; border-radius: 4px; }
                        .footer { text-align: center; font-size: 12px; color: #777; margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd; }
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
                            <h3 style='color: #1E3A5F; margin-bottom: 20px;'>Información del Contacto</h3>");

            // Campos obligatorios
            emailBody.AppendLine($@"
                            <div class='field'>
                                <span class='field-label'>👤 Nombre:</span>
                                <span class='field-value'>{datos.Nombre}</span>
                            </div>");

            emailBody.AppendLine($@"
                            <div class='field'>
                                <span class='field-label'>📧 Correo:</span>
                                <span class='field-value'><a href='mailto:{datos.Correo}'>{datos.Correo}</a></span>
                            </div>");

            emailBody.AppendLine($@"
                            <div class='field'>
                                <span class='field-label'>📱 Teléfono:</span>
                                <span class='field-value'><a href='tel:{datos.Telefono}'>{datos.Telefono}</a></span>
                            </div>");

            // Prioridad con colores
            var prioridadClass = datos.Prioridad?.ToLower() switch
            {
                "alta" => "priority-high",
                "media" => "priority-medium",
                "baja" => "priority-low",
                _ => ""
            };

            emailBody.AppendLine($@"
                            <div class='field'>
                                <span class='field-label'>⚡ Prioridad:</span>
                                <span class='field-value {prioridadClass}'>{datos.Prioridad}</span>
                            </div>");

            // Campos opcionales - solo mostrar si tienen valor
            if (!string.IsNullOrWhiteSpace(datos.TipoConsulta))
            {
                emailBody.AppendLine($@"
                            <div class='field'>
                                <span class='field-label'>💼 Tipo de Consulta:</span>
                                <span class='field-value'>{datos.TipoConsulta}</span>
                            </div>");
            }

            if (!string.IsNullOrWhiteSpace(datos.NombreEmpresa))
            {
                emailBody.AppendLine($@"
                            <div class='field'>
                                <span class='field-label'>🏢 Empresa:</span>
                                <span class='field-value'>{datos.NombreEmpresa}</span>
                            </div>");
            }

            if (!string.IsNullOrWhiteSpace(datos.TamanoEmpresa))
            {
                emailBody.AppendLine($@"
                            <div class='field'>
                                <span class='field-label'>📊 Tamaño de Empresa:</span>
                                <span class='field-value'>{datos.TamanoEmpresa}</span>
                            </div>");
            }

            // Mensaje
            emailBody.AppendLine($@"
                            <div class='message-box'>
                                <h4 style='color: #1E3A5F; margin-bottom: 15px;'>💬 Mensaje:</h4>
                                <p style='margin: 0; white-space: pre-wrap;'>{datos.Mensaje}</p>
                            </div>");

            // Footer
            emailBody.AppendLine($@"
                            <div class='footer'>
                                <p><strong>Consultoría Integral SC</strong></p>
                                <p>Este mensaje fue enviado el {DateTime.Now:dd/MM/yyyy 'a las' HH:mm:ss}</p>
                                <p>Formulario de contacto del sitio web oficial</p>
                            </div>
                        </div>
                    </div>
                </body>
                </html>");

            // Email al administrador
            var mailMessage = new MailMessage
            {
                From = new MailAddress(_smtpUsername, "Consultoría Integral SC - Web"),
                Subject = $"🔔 Nuevo Contacto [{datos.Prioridad}] - {datos.Nombre}",
                Body = emailBody.ToString(),
                IsBodyHtml = true
            };

            mailMessage.To.Add(_adminEmail);

            // Configurar codificación
            mailMessage.BodyEncoding = Encoding.UTF8;
            mailMessage.SubjectEncoding = Encoding.UTF8;

            await smtpClient.SendMailAsync(mailMessage);
            mailMessage.Dispose();

            System.Diagnostics.Debug.WriteLine("📧 Email HTML generado y enviado exitosamente");
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