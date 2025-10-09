using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace COMMON.Entidades
{
    public class CamposControl
    {
        public string UsuarioAlta { get; set; }
        public string UsuarioMod { get; set; }
        public DateTime FechaAlta { get; set; } = DateTime.MinValue;
        public DateTime FechaMod { get; set; } = DateTime.MinValue;

    }
}
