using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace COMMON.Entidades
{
    public class Cita : CamposControl
    {
        public int Id { get; set; }

        [Required]
        [MaxLength(100)]
        public string NombreCompleto { get; set; }

        [Required]
        [MaxLength(100)]
        public string Empresa { get; set; }

        [Required]
        [EmailAddress]
        [MaxLength(100)]
        public string Email { get; set; }

        [Required]
        [MaxLength(20)]
        public string Telefono { get; set; }

        [Required]
        [MaxLength(100)]
        public string ServicioInteres { get; set; }

        [Required]
        public DateTime FechaHora { get; set; }

        [Required]
        [MaxLength(20)]
        public string Modalidad { get; set; } // Presencial, Virtual, Telefonica

        [MaxLength(500)]
        public string Descripcion { get; set; }

        [MaxLength(20)]
        public string Estado { get; set; } = "Pendiente"; // Pendiente, Confirmada, Completada, Cancelada

        [MaxLength(500)]
        public string? NotasAdmin { get; set; } // Notas internas del administrador
    }
}