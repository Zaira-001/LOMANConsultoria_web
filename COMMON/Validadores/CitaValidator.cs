using COMMON.Entidades;
using FluentValidation;

namespace COMMON.Validadores
{
    public class CitaValidator : AbstractValidator<Cita>
    {
        public CitaValidator()
        {
            RuleFor(c => c.NombreCompleto)
                .NotEmpty().WithMessage("El nombre completo es obligatorio")
                .MaximumLength(100).WithMessage("El nombre no puede exceder 100 caracteres")
                .MinimumLength(2).WithMessage("El nombre debe tener al menos 2 caracteres")
                .Matches(@"^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$").WithMessage("El nombre solo puede contener letras y espacios");

            RuleFor(c => c.Empresa)
                .NotEmpty().WithMessage("El nombre de la empresa es obligatorio")
                .MaximumLength(100).WithMessage("El nombre de empresa no puede exceder 100 caracteres")
                .MinimumLength(2).WithMessage("El nombre de empresa debe tener al menos 2 caracteres");

            RuleFor(c => c.Email)
                .NotEmpty().WithMessage("El email es obligatorio")
                .EmailAddress().WithMessage("El formato del email no es válido")
                .MaximumLength(100).WithMessage("El email no puede exceder 100 caracteres");

            RuleFor(c => c.Telefono)
                .NotEmpty().WithMessage("El teléfono es obligatorio")
                .MaximumLength(20).WithMessage("El teléfono no puede exceder 20 caracteres")
                .MinimumLength(10).WithMessage("El teléfono debe tener al menos 10 dígitos")
                .Matches(@"^[\d\s\-\+\(\)]+$").WithMessage("El teléfono contiene caracteres no válidos");

            RuleFor(c => c.ServicioInteres)
                .NotEmpty().WithMessage("Debe seleccionar un servicio de interés")
                .MaximumLength(100).WithMessage("El servicio de interés no puede exceder 100 caracteres")
                .Must(BeValidService).WithMessage("El servicio seleccionado no es válido");

            RuleFor(c => c.FechaHora)
                .NotEmpty().WithMessage("La fecha y hora son obligatorias")
                .Must(BeValidFutureDate).WithMessage("La fecha debe ser en el futuro con al menos 2 horas de anticipación")
                .Must(BeValidBusinessDay).WithMessage("Solo se permiten citas en días laborables (Lunes a Viernes)")
                .Must(BeValidBusinessHour).WithMessage("Solo se permiten citas en horario laboral (9:00 AM - 6:00 PM)");

            RuleFor(c => c.Modalidad)
                .NotEmpty().WithMessage("Debe seleccionar una modalidad")
                .MaximumLength(20).WithMessage("La modalidad no puede exceder 20 caracteres")
                .Must(BeValidModalidad).WithMessage("La modalidad seleccionada no es válida (Presencial, Virtual, Telefonica)");

            RuleFor(c => c.Descripcion)
                .MaximumLength(500).WithMessage("La descripción no puede exceder 500 caracteres")
                .When(c => !string.IsNullOrEmpty(c.Descripcion));

            RuleFor(c => c.Estado)
                .MaximumLength(20).WithMessage("El estado no puede exceder 20 caracteres")
                .Must(BeValidEstado).WithMessage("El estado no es válido")
                .When(c => !string.IsNullOrEmpty(c.Estado));

            // FIX CRÍTICO: NotasAdmin es OPCIONAL y solo se valida si tiene valor
            RuleFor(c => c.NotasAdmin)
                .MaximumLength(500).WithMessage("Las notas del admin no pueden exceder 500 caracteres")
                .When(c => !string.IsNullOrWhiteSpace(c.NotasAdmin)); // Solo valida si NO está vacío
        }

        private bool BeValidFutureDate(DateTime fechaHora)
        {
            return fechaHora > DateTime.Now.AddHours(2);
        }

        private bool BeValidBusinessDay(DateTime fechaHora)
        {
            var dayOfWeek = fechaHora.DayOfWeek;
            return dayOfWeek >= DayOfWeek.Monday && dayOfWeek <= DayOfWeek.Friday;
        }

        private bool BeValidBusinessHour(DateTime fechaHora)
        {
            var hour = fechaHora.Hour;
            var minute = fechaHora.Minute;

            if (hour < 9 || hour >= 18)
                return false;

            if (hour == 18 && minute > 0)
                return false;

            return true;
        }

        private bool BeValidService(string servicio)
        {
            var serviciosValidos = new[]
            {
                "Servicios Administrativos",
                "Servicios Fiscales",
                "Servicios Legales",
                "Facturación 4.0",
                "Servicios Financieros",
                "Incubadora de Negocios",
                "Financiamiento PYME"
            };

            return serviciosValidos.Contains(servicio);
        }

        private bool BeValidModalidad(string modalidad)
        {
            var modalidadesValidas = new[] { "Presencial", "Virtual", "Telefonica" };
            return modalidadesValidas.Contains(modalidad);
        }

        private bool BeValidEstado(string estado)
        {
            var estadosValidos = new[]
            {
                "Pendiente",
                "Confirmada",
                "Completada",
                "Cancelada"
            };
            return estadosValidos.Contains(estado);
        }
    }
}