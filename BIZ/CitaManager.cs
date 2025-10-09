using COMMON.Entidades;
using FluentValidation;

namespace BIZ
{
    public class CitaManager : GenericManager<Cita>
    {
        public CitaManager(AbstractValidator<Cita> validador)
            : base(validador)
        {
        }

        // Crear cita
        public override async Task<Cita> Agregar(Cita cita)
        {
            try
            {
                // Guardar en base de datos
                var resultado = await base.Agregar(cita);

                if (resultado == null)
                {
                    Error = "Error al guardar la cita en la base de datos";
                    return null;
                }

                // Enviar confirmación por email (opcional)
                await EnviarConfirmacionCita(resultado);

                return resultado;
            }
            catch (Exception ex)
            {
                Error = $"Error al crear la cita: {ex.Message}";
                Console.WriteLine($"Error en CitaManager.Agregar: {ex.Message}");
                return null;
            }
        }

        private async Task EnviarConfirmacionCita(Cita cita)
        {
            // Email de confirmación con detalles
            var mensaje = $@"
                <h2>Cita Confirmada - Consultoría Integral SC</h2>
                <p>Estimado/a {cita.NombreCompleto},</p>
                <p>Su consulta ha sido agendada con los siguientes detalles:</p>
                
                <div style='background: #f5f5f5; padding: 20px; border-radius: 5px;'>
                    <p><strong>Fecha:</strong> {cita.FechaHora:dddd, dd 'de' MMMM 'de' yyyy}</p>
                    <p><strong>Hora:</strong> {cita.FechaHora:HH:mm}</p>
                    <p><strong>Duración:</strong> 45 minutos</p>
                    <p><strong>Modalidad:</strong> {cita.Modalidad}</p>
                </div>
                
                <p>Nos contactaremos 30 minutos antes de la cita.</p>
                <p>Si necesita reprogramar, responda a este email.</p>
            ";

            // Aquí integrarías tu servicio de email
            Console.WriteLine($"Enviando confirmación a {cita.Email}");
            await Task.CompletedTask;
        }
    }
}