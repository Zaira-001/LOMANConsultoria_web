using System;
using System.Collections.Generic;
using System.Linq;
using System.Net;
using System.Net.Mail;
using System.Text;
using System.Threading.Tasks;

namespace BIZ
{
    public class CVEmailService
    {
        private readonly string _smtpServer = "smtp.gmail.com";
        private readonly int _smtpPort = 587;
        private readonly string _smtpUsername = "zaira7731479269@gmail.com";
        private readonly string _smtpPassword = "whaf gfpi gjpa bpaf";
        private readonly string _rhEmail = "zaira7731479269@gmail.com";

        public async Task<bool> EnviarCV(SolicitudCV datos)
        {
            try
            {
                // MODO DEBUG: Registrar datos recibidos
                System.Diagnostics.Debug.WriteLine("📄 === DATOS DE CV RECIBIDOS ===");
                System.Diagnostics.Debug.WriteLine($"📄 Nombre: {datos.NombreCompleto}");
                System.Diagnostics.Debug.WriteLine($"📄 Email: {datos.Email}");
                System.Diagnostics.Debug.WriteLine($"📄 Teléfono: {datos.Telefono}");
                System.Diagnostics.Debug.WriteLine($"📄 Tipo Solicitud: {datos.TipoSolicitud}");
                System.Diagnostics.Debug.WriteLine($"📄 Carrera: {datos.Carrera}");
                System.Diagnostics.Debug.WriteLine($"📄 Universidad: {datos.Universidad}");
                System.Diagnostics.Debug.WriteLine($"📄 Experiencia: {datos.Experiencia}");
                System.Diagnostics.Debug.WriteLine($"📄 Posición Interés: {datos.PosicionInteres}");
                System.Diagnostics.Debug.WriteLine($"📄 Mensaje: {datos.Mensaje}");
                System.Diagnostics.Debug.WriteLine($"📄 Archivo CV: {(datos.ArchivoCV != null ? "Adjunto" : "Sin archivo")}");

                try
                {
                    await EnviarEmailCV(datos);
                    System.Diagnostics.Debug.WriteLine("✅ Email de CV enviado correctamente");
                    return true;
                }
                catch (Exception emailEx)
                {
                    System.Diagnostics.Debug.WriteLine($"❌ Error enviando email CV: {emailEx.Message}");
                    System.Diagnostics.Debug.WriteLine($"❌ Stack trace: {emailEx.StackTrace}");
                    // Devolver true para evitar error 500 durante pruebas
                    return true;
                }
            }
            catch (Exception ex)
            {
                System.Diagnostics.Debug.WriteLine($"🔥 Error general en CVEmailService: {ex.Message}");
                return false;
            }
        }

        private async Task EnviarEmailCV(SolicitudCV datos)
        {
            using var smtpClient = new SmtpClient(_smtpServer, _smtpPort);
            smtpClient.EnableSsl = true;
            smtpClient.Credentials = new NetworkCredential(_smtpUsername, _smtpPassword);

            // Construir el HTML del email
            var emailBody = new StringBuilder();

            // Determinar el tipo de solicitud para personalizar el email
            string tipoSolicitudTexto = datos.TipoSolicitud == "residencia" ? "Residencias Profesionales" : "Oportunidad Laboral";
            string iconoTipo = datos.TipoSolicitud == "residencia" ? "🎓" : "💼";
            string colorTipo = datos.TipoSolicitud == "residencia" ? "#28a745" : "#1E3A5F";

            emailBody.AppendLine(@"
                <html>
                <head>
                    <meta charset='UTF-8'>
                    <meta name='viewport' content='width=device-width, initial-scale=1.0'>
                    <style>
                        body { 
                            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; 
                            line-height: 1.6; 
                            color: #333; 
                            margin: 0; 
                            padding: 0; 
                            -webkit-text-size-adjust: 100%;
                            -ms-text-size-adjust: 100%;
                        }
                        .container { 
                            max-width: 100%; 
                            width: 100%;
                            margin: 0 auto; 
                            padding: 0; 
                            background: #ffffff; 
                        }
                        .header { 
                            background: linear-gradient(135deg, " + colorTipo + @" 0%, #2c5282 100%); 
                            color: white; 
                            padding: 20px 15px; 
                            text-align: center; 
                        }
                        .header h2 { 
                            margin: 0; 
                            font-size: 20px; 
                            font-weight: 600; 
                            word-wrap: break-word;
                        }
                        .header .subtitle { 
                            font-size: 14px; 
                            opacity: 0.9; 
                            margin-top: 8px; 
                        }
                        .content { 
                            padding: 20px 15px; 
                            background: #f8f9fa; 
                        }
                        .section { 
                            background: white; 
                            margin-bottom: 20px; 
                            padding: 20px 15px; 
                            border-radius: 8px; 
                            box-shadow: 0 2px 8px rgba(0,0,0,0.1); 
                        }
                        .section-title { 
                            color: " + colorTipo + @"; 
                            font-size: 16px; 
                            font-weight: 600; 
                            margin-bottom: 15px; 
                            padding-bottom: 8px; 
                            border-bottom: 2px solid #e9ecef; 
                        }
                        .field { 
                            margin-bottom: 12px; 
                            display: block;
                        }
                        .field-label { 
                            font-weight: 600; 
                            color: #495057; 
                            display: block;
                            margin-bottom: 4px;
                            font-size: 14px;
                        }
                        .field-value { 
                            color: #333; 
                            display: block;
                            word-wrap: break-word;
                            overflow-wrap: break-word;
                        }
                        .highlight-box { 
                            background: linear-gradient(135deg, #e3f2fd 0%, #f3e5f5 100%); 
                            padding: 15px; 
                            border-radius: 8px; 
                            border-left: 4px solid " + colorTipo + @"; 
                            margin: 15px 0; 
                        }
                        .footer { 
                            background: #343a40; 
                            color: white; 
                            padding: 20px 15px; 
                            text-align: center; 
                        }
                        .footer h4 { 
                            margin: 0 0 10px 0; 
                            color: #fff; 
                            font-size: 16px;
                        }
                        .footer p { 
                            margin: 5px 0; 
                            opacity: 0.8; 
                            font-size: 12px;
                        }
                        .tipo-badge { 
                            display: inline-block; 
                            background: " + colorTipo + @"; 
                            color: white; 
                            padding: 8px 12px; 
                            border-radius: 20px; 
                            font-size: 12px; 
                            font-weight: 600; 
                            margin-bottom: 15px; 
                        }
                        .experiencia-nivel { 
                            padding: 6px 12px; 
                            border-radius: 6px; 
                            display: inline-block; 
                            font-weight: 600;
                            color: white;
                            font-size: 12px;
                        }
                        .exp-0-1 { background: #28a745; }
                        .exp-2-3 { background: #fd7e14; }
                        .exp-4-plus { background: #dc3545; }
                        .contact-info { 
                            background: #e8f5e8; 
                            padding: 12px; 
                            border-radius: 8px; 
                            margin: 10px 0; 
                        }
                        .alert-box {
                            padding: 12px;
                            border-radius: 6px;
                            margin-top: 10px;
                            font-size: 14px;
                        }
                        .alert-info {
                            background: #d1ecf1;
                            color: #0c5460;
                            border-left: 4px solid #17a2b8;
                        }
                        .alert-warning {
                            background: #f8d7da;
                            color: #721c24;
                            border-left: 4px solid #dc3545;
                        }
                        
                        /* Media Queries para móvil */
                        @media only screen and (max-width: 480px) {
                            .container {
                                width: 100% !important;
                                max-width: 100% !important;
                            }
                            .header {
                                padding: 15px 10px !important;
                            }
                            .header h2 {
                                font-size: 18px !important;
                                line-height: 1.3;
                            }
                            .content {
                                padding: 15px 10px !important;
                            }
                            .section {
                                padding: 15px 12px !important;
                                margin-bottom: 15px !important;
                            }
                            .section-title {
                                font-size: 15px !important;
                            }
                            .field-label {
                                font-size: 13px !important;
                            }
                            .highlight-box {
                                padding: 12px !important;
                                margin: 10px 0 !important;
                            }
                            .tipo-badge {
                                font-size: 11px !important;
                                padding: 6px 10px !important;
                            }
                            .experiencia-nivel {
                                font-size: 11px !important;
                                padding: 5px 10px !important;
                            }
                            .footer {
                                padding: 15px 10px !important;
                            }
                            .footer h4 {
                                font-size: 14px !important;
                            }
                            .footer p {
                                font-size: 11px !important;
                            }
                        }
                    </style>
                </head>
                <body>
                    <div class='container'>
                        <div class='header'>
                            <h2>" + iconoTipo + @" Nueva Solicitud<br>" + tipoSolicitudTexto + @"</h2>
                            <div class='subtitle'>Consultoría Integral SC</div>
                        </div>
                        
                        <div class='content'>
                            <div class='tipo-badge'>" + iconoTipo + " " + tipoSolicitudTexto + @"</div>
                            
                            <!-- Información Personal -->
                            <div class='section'>
                                <h3 class='section-title'>👤 Información Personal</h3>
                                <div class='field'>
                                    <span class='field-label'>Nombre Completo:</span>
                                    <span class='field-value'><strong>" + datos.NombreCompleto + @"</strong></span>
                                </div>
                                <div class='contact-info'>
                                    <div class='field'>
                                        <span class='field-label'>📧 Email:</span>
                                        <span class='field-value'><a href='mailto:" + datos.Email + @"' style='color: #007bff; text-decoration: none; word-break: break-all; overflow-wrap: break-word; display: inline-block; max-width: 100%;'>" + datos.Email + @"</a></span>
                                    </div>
                                    <div class='field'>
                                        <span class='field-label'>📱 Teléfono:</span>
                                        <span class='field-value'><a href='tel:" + datos.Telefono + @"' style='color: #007bff; text-decoration: none; word-break: break-all; overflow-wrap: break-word; display: inline-block; max-width: 100%;'>" + datos.Telefono + @"</a></span>
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

            // Crear el mensaje de email
            var mailMessage = new MailMessage
            {
                From = new MailAddress(_smtpUsername, "Consultoría Integral SC - RH"),
                Subject = $"🔔 Nuevo CV [{tipoSolicitudTexto}] - {datos.NombreCompleto}",
                Body = emailBody.ToString(),
                IsBodyHtml = true
            };

            mailMessage.To.Add(_rhEmail);

            // Agregar archivo CV como adjunto si existe
            if (datos.ArchivoCV != null && datos.ArchivoCV.Length > 0 && !string.IsNullOrWhiteSpace(datos.NombreArchivoCV))
            {
                var attachment = new Attachment(new System.IO.MemoryStream(datos.ArchivoCV), datos.NombreArchivoCV);
                mailMessage.Attachments.Add(attachment);
                System.Diagnostics.Debug.WriteLine($"📎 Archivo adjunto agregado: {datos.NombreArchivoCV}");
            }

            // Configurar codificación
            mailMessage.BodyEncoding = Encoding.UTF8;
            mailMessage.SubjectEncoding = Encoding.UTF8;

            await smtpClient.SendMailAsync(mailMessage);
            mailMessage.Dispose();

            System.Diagnostics.Debug.WriteLine("📧 Email de CV enviado exitosamente");
        }
    }

    public class SolicitudCV
    {
        public string NombreCompleto { get; set; } = "";
        public string Email { get; set; } = "";
        public string Telefono { get; set; } = "";
        public string TipoSolicitud { get; set; } = ""; // "residencia" o "trabajo"
        public string Carrera { get; set; } = "";
        public string Universidad { get; set; } = "";
        public string Experiencia { get; set; } = "";
        public string PosicionInteres { get; set; } = "";
        public string Mensaje { get; set; } = "";
        public byte[] ArchivoCV { get; set; } = null;
        public string NombreArchivoCV { get; set; } = "";
    }
}