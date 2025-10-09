using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace COMMON.Entidades
{
    public class Empleo:  CamposControl
    {
        public int Id { get; set; }

        [Required]
        [StringLength(100)]
        public string Titulo { get; set; } = "";

        [StringLength(10)]
        public string Icono { get; set; } = "💼";

        [Required]
        [StringLength(50)]
        public string Nivel { get; set; } = "";

        [StringLength(100)]
        public string Area { get; set; } = "";

        [Required]
        [StringLength(1000)]
        public string Descripcion { get; set; } = "";

        public string Requisitos { get; set; } = ""; // JSON string array

        public bool Activo { get; set; } = true;

        public string Salario { get; set; } = "";

        public string Modalidad { get; set; } = ""; // Presencial, Remoto, Híbrido
    }
}