using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace COMMON.Entidades
{
    public class Cotizacion : CamposControl
    {
        public int Id { get; set; }

        [Required]
        [MaxLength(100)]
        public string Nombre { get; set; }

        [Required]
        [EmailAddress]
        [MaxLength(100)]
        public string Correo { get; set; }

        [Required]
        [MaxLength(20)]
        public string Telefono { get; set; }

        [MaxLength(100)]
        public string? NombreEmpresa { get; set; }  // ← NULLABLE

        [MaxLength(50)]
        public string? TamanoEmpresa { get; set; }  // ← NULLABLE

        [Required]
        [MaxLength(100)]
        public string TipoConsulta { get; set; }

        [Required]
        [MaxLength(20)]
        public string Prioridad { get; set; } = "Media";

        [Required]
        [MaxLength(2000)]
        public string Mensaje { get; set; }

        [MaxLength(20)]
        public string Estado { get; set; } = "Pendiente";

        [MaxLength(500)]
        public string? NotasAdmin { get; set; }  // ← NULLABLE

        [MaxLength(1000)]
        public string? RespuestaAdmin { get; set; }  // ← NULLABLE

        public DateTime? FechaContacto { get; set; }  // ← NULLABLE

        public DateTime? FechaCotizacion { get; set; }  // ← NULLABLE

        public decimal? MontoEstimado { get; set; }  // ← NULLABLE

        [MaxLength(1000)]
        public string? NotasInternas { get; set; }  // ← NULLABLE

        // NUEVAS PROPIEDADES PARA ARCHIVO PDF
        [NotMapped] // No se guarda en BD, solo para transferencia
        public byte[]? ArchivoPDF { get; set; }

        [MaxLength(255)]
        public string? NombreArchivoPDF { get; set; }
    }
}