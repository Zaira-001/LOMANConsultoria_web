using COMMON.Entidades;
using COMMON.Validadores;
using FluentValidation;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Text.Json;
using System.Threading.Tasks;

namespace COMMON.Validadores
{
    public class EmpleoValidator : AbstractValidator<Empleo>
    {
        public EmpleoValidator()
        {
            // VALIDACIONES BÁSICAS REQUERIDAS
            RuleFor(x => x.Titulo)
                .NotEmpty()
                .WithMessage("El título del puesto es obligatorio")
                .MaximumLength(100)
                .WithMessage("El título no puede exceder 100 caracteres");

            RuleFor(x => x.Nivel)
                .NotEmpty()
                .WithMessage("El nivel del puesto es obligatorio")
                .MaximumLength(50)
                .WithMessage("El nivel no puede exceder 50 caracteres");

            RuleFor(x => x.Descripcion)
                .NotEmpty()
                .WithMessage("La descripción del puesto es obligatoria")
                .MinimumLength(20)
                .WithMessage("La descripción debe tener al menos 20 caracteres")
                .MaximumLength(1000)
                .WithMessage("La descripción no puede exceder 1000 caracteres");

            // VALIDACIONES DE LONGITUD PARA CAMPOS OPCIONALES
            RuleFor(x => x.Icono)
                .MaximumLength(10)
                .WithMessage("El icono no puede exceder 10 caracteres")
                .Must(BeValidEmoji)
                .When(x => !string.IsNullOrEmpty(x.Icono))
                .WithMessage("El icono debe ser un emoji válido");

            RuleFor(x => x.Area)
                .MaximumLength(100)
                .WithMessage("El área no puede exceder 100 caracteres");

            RuleFor(x => x.Salario)
                .MaximumLength(100)
                .WithMessage("El salario no puede exceder 100 caracteres");

            RuleFor(x => x.Modalidad)
                .MaximumLength(50)
                .WithMessage("La modalidad no puede exceder 50 caracteres")
                .Must(BeValidModalidad)
                .When(x => !string.IsNullOrEmpty(x.Modalidad))
                .WithMessage("La modalidad debe ser: Presencial, Remoto, Híbrido o estar vacía");

            // VALIDACIÓN DE REQUISITOS COMO JSON
            RuleFor(x => x.Requisitos)
                .Must(BeValidJsonArray)
                .WithMessage("Los requisitos deben estar en formato JSON válido")
                .When(x => !string.IsNullOrEmpty(x.Requisitos));

            // VALIDACIONES DE CAMPOS DE AUDITORÍA (solo si están presentes)
            RuleFor(x => x.UsuarioAlta)
                .MaximumLength(50)
                .WithMessage("El usuario de alta no puede exceder 50 caracteres")
                .When(x => !string.IsNullOrEmpty(x.UsuarioAlta));

            RuleFor(x => x.UsuarioMod)
                .MaximumLength(50)
                .WithMessage("El usuario de modificación no puede exceder 50 caracteres")
                .When(x => !string.IsNullOrEmpty(x.UsuarioMod));

            // VALIDACIÓN DE FECHAS
            RuleFor(x => x.FechaAlta)
                .Must(BeValidDate)
                .WithMessage("La fecha de alta debe ser válida")
                .When(x => x.FechaAlta != DateTime.MinValue);

            RuleFor(x => x.FechaMod)
                .Must(BeValidDate)
                .WithMessage("La fecha de modificación debe ser válida")
                .When(x => x.FechaMod != DateTime.MinValue);

            // VALIDACIÓN PERSONALIZADA PARA NIVEL
            RuleFor(x => x.Nivel)
                .Must(BeValidNivel)
                .When(x => !string.IsNullOrEmpty(x.Nivel))
                .WithMessage("El nivel debe ser uno de: Practicante, Nivel Junior, Especialista, Nivel Senior, Nivel Ejecutivo, Gerencial");
        }

        // MÉTODOS DE VALIDACIÓN PERSONALIZADOS
        private static bool BeValidEmoji(string icono)
        {
            if (string.IsNullOrEmpty(icono))
                return true;

            // Verificación básica de que contiene caracteres unicode de emoji
            // Este es un enfoque simplificado
            return icono.Length <= 10 && icono.Any(c => char.GetUnicodeCategory(c) == System.Globalization.UnicodeCategory.OtherSymbol ||
                                                       char.IsSurrogate(c));
        }

        private static bool BeValidModalidad(string modalidad)
        {
            if (string.IsNullOrEmpty(modalidad))
                return true;

            var modalidadesValidas = new[] { "Presencial", "Remoto", "Híbrido" };
            return modalidadesValidas.Contains(modalidad, StringComparer.OrdinalIgnoreCase);
        }

        private static bool BeValidNivel(string nivel)
        {
            if (string.IsNullOrEmpty(nivel))
                return false;

            var nivelesValidos = new[] {
                "Practicante",
                "Nivel Junior",
                "Especialista",
                "Nivel Senior",
                "Nivel Ejecutivo",
                "Gerencial"
            };

            return nivelesValidos.Contains(nivel, StringComparer.OrdinalIgnoreCase);
        }

        private static bool BeValidJsonArray(string requisitos)
        {
            if (string.IsNullOrEmpty(requisitos))
                return true;

            try
            {
                // Intentar deserializar como array de strings
                var array = JsonSerializer.Deserialize<string[]>(requisitos);
                return array != null;
            }
            catch (JsonException)
            {
                // Si falla, intentar como string simple y ver si se puede convertir
                try
                {
                    // Si contiene saltos de línea, podría ser un formato multilinea válido
                    if (requisitos.Contains('\n') || requisitos.Contains('\r'))
                    {
                        return true; // Permitir formato multilinea que se puede convertir después
                    }

                    // Si es una sola línea de texto, también es válido
                    return requisitos.Length <= 2000; // Límite razonable
                }
                catch
                {
                    return false;
                }
            }
            catch
            {
                return false;
            }
        }

        private static bool BeValidDate(DateTime fecha)
        {
            // Verificar que la fecha esté en un rango razonable
            var fechaMinima = new DateTime(1900, 1, 1);
            var fechaMaxima = DateTime.Now.AddYears(10);

            return fecha >= fechaMinima && fecha <= fechaMaxima;
        }
    }
}