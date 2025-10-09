using COMMON.Entidades;
using FluentValidation;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace COMMON.Validadores
{
    public class CotizacionValidator : AbstractValidator<Cotizacion>
    {
        public CotizacionValidator()
        {
            RuleFor(c => c.Nombre)
                .NotEmpty().WithMessage("El nombre es obligatorio")
                .MaximumLength(100).WithMessage("El nombre no puede exceder 100 caracteres")
                .MinimumLength(2).WithMessage("El nombre debe tener al menos 2 caracteres")
                .Matches(@"^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$").WithMessage("El nombre solo puede contener letras y espacios");

            RuleFor(c => c.Correo)
                .NotEmpty().WithMessage("El email es obligatorio")
                .EmailAddress().WithMessage("El formato del email no es válido")
                .MaximumLength(100).WithMessage("El email no puede exceder 100 caracteres");

            RuleFor(c => c.Telefono)
                .NotEmpty().WithMessage("El teléfono es obligatorio")
                .MaximumLength(20).WithMessage("El teléfono no puede exceder 20 caracteres")
                .MinimumLength(10).WithMessage("El teléfono debe tener al menos 10 dígitos")
                .Matches(@"^[\d\s\-\+\(\)]+$").WithMessage("El teléfono contiene caracteres no válidos");

            RuleFor(c => c.NombreEmpresa)
                .MaximumLength(100).WithMessage("El nombre de empresa no puede exceder 100 caracteres")
                .When(c => !string.IsNullOrWhiteSpace(c.NombreEmpresa));

            RuleFor(c => c.TamanoEmpresa)
                .MaximumLength(50).WithMessage("El tamaño de empresa no puede exceder 50 caracteres")
                .Must(BeValidCompanySize).WithMessage("El tamaño de empresa no es válido")
                .When(c => !string.IsNullOrWhiteSpace(c.TamanoEmpresa));

            RuleFor(c => c.TipoConsulta)
                .NotEmpty().WithMessage("El tipo de consulta es obligatorio")
                .MaximumLength(100).WithMessage("El tipo de consulta no puede exceder 100 caracteres");

            RuleFor(c => c.Prioridad)
                .NotEmpty().WithMessage("La prioridad es obligatoria")
                .MaximumLength(20).WithMessage("La prioridad no puede exceder 20 caracteres")
                .Must(BeValidPriority).WithMessage("La prioridad no es válida");

            RuleFor(c => c.Mensaje)
                .NotEmpty().WithMessage("El mensaje es obligatorio")
                .MaximumLength(2000).WithMessage("El mensaje no puede exceder 2000 caracteres")
                .MinimumLength(10).WithMessage("El mensaje debe tener al menos 10 caracteres");

            RuleFor(c => c.Estado)
                .MaximumLength(20).WithMessage("El estado no puede exceder 20 caracteres")
                .Must(BeValidEstado).WithMessage("El estado no es válido")
                .When(c => !string.IsNullOrEmpty(c.Estado));

            RuleFor(c => c.NotasAdmin)
                .MaximumLength(500).WithMessage("Las notas del admin no pueden exceder 500 caracteres")
                .When(c => !string.IsNullOrWhiteSpace(c.NotasAdmin));

            RuleFor(c => c.RespuestaAdmin)
                .MaximumLength(1000).WithMessage("La respuesta del admin no puede exceder 1000 caracteres")
                .When(c => !string.IsNullOrWhiteSpace(c.RespuestaAdmin));

            RuleFor(c => c.MontoEstimado)
                .GreaterThanOrEqualTo(0).WithMessage("El monto estimado debe ser mayor o igual a 0")
                .When(c => c.MontoEstimado.HasValue);
        }

        private bool BeValidCompanySize(string? tamano)
        {
            if (string.IsNullOrWhiteSpace(tamano)) return true;

            var tamanosValidos = new[]
            {
                "1-10 empleados",
                "11-50 empleados",
                "51-200 empleados",
                "200+ empleados"
            };

            return tamanosValidos.Contains(tamano);
        }

        private bool BeValidPriority(string prioridad)
        {
            var prioridadesValidas = new[] { "Media", "Alta", "Urgente" };
            return prioridadesValidas.Contains(prioridad);
        }

        private bool BeValidEstado(string estado)
        {
            // ✅ ACTUALIZADO: Agregados los estados que usa el frontend
            var estadosValidos = new[]
            {
                "Pendiente",
                "En Proceso",    // ⭐ NUEVO
                "Contactado",
                "Enviada",       // ⭐ NUEVO
                "Cotizado",
                "Rechazada",     // ⭐ NUEVO
                "Cerrado"
            };
            return estadosValidos.Contains(estado);
        }
    }
}