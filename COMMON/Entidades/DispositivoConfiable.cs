using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace COMMON.Entidades
{
    public class DispositivoConfiable : CamposControl
    {
            public int Id { get; set; }

            [Required]
            public int AdminId { get; set; }

            [Required]
            [StringLength(255)]
            public string FingerprintDispositivo { get; set; } = "";

            [StringLength(100)]
            public string NombreDispositivo { get; set; } = "";

            public DateTime FechaRegistro { get; set; } = DateTime.Now;

            public DateTime UltimoAcceso { get; set; } = DateTime.Now;

        }
    }
