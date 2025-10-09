using COMMON.Entidades;
using FluentValidation;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace COMMON.Validadores
{
    public class AdminValidator : AbstractValidator<Admin>
    {
        public AdminValidator()
        {
            // Validación de Username
            RuleFor(x => x.Username)
                .NotEmpty().WithMessage("El nombre de usuario es requerido")
                .Length(3, 50).WithMessage("El nombre de usuario debe tener entre 3 y 50 caracteres")
                .Matches(@"^[a-zA-Z0-9_]+$").WithMessage("El nombre de usuario solo puede contener letras, números y guiones bajos")
                .Must(BeUniqueUsername).WithMessage("El nombre de usuario ya existe"); // Implementar lógica personalizada

            // Validación de Email
            RuleFor(x => x.Email)
                .NotEmpty().WithMessage("El email es requerido")
                .EmailAddress().WithMessage("El formato del email no es válido")
                .Length(1, 100).WithMessage("El email no puede exceder 100 caracteres");

            // Validación de NombreCompleto
            RuleFor(x => x.NombreCompleto)
                .Length(0, 100).WithMessage("El nombre completo no puede exceder 100 caracteres")
                .Matches(@"^[a-zA-ZáéíóúñÑüÜ\s]*$").WithMessage("El nombre solo puede contener letras y espacios")
                .When(x => !string.IsNullOrEmpty(x.NombreCompleto));

            // Validación de Rol
            RuleFor(x => x.Rol)
                .NotEmpty().WithMessage("El rol es requerido")
                .Must(BeValidRole).WithMessage("El rol especificado no es válido");

            // Validación de PasswordHash - Solo si se está creando
            RuleFor(x => x.PasswordHash)
                .NotEmpty().WithMessage("La contraseña es requerida")
                .When(x => x.Id == 0); // Solo para nuevos registros

            // Validación de IntentosLogin
            RuleFor(x => x.IntentosLogin)
                .GreaterThanOrEqualTo(0).WithMessage("Los intentos de login no pueden ser negativos");
        }

        private bool BeUniqueUsername(string username)
        {
            // Esta validación se debe implementar en el manager
            // consultando la base de datos
            return true; // Por ahora retorna true, se implementa en AdminManager
        }

        private bool BeValidRole(string rol)
        {
            var validRoles = new[] { "Admin", "SuperAdmin" };
            return Array.Exists(validRoles, r => r.Equals(rol, StringComparison.OrdinalIgnoreCase));
        }
    }
}