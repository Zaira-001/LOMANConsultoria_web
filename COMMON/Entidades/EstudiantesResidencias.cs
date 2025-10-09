using System;
using System.Collections.Generic;
using System.Linq;
using System.Numerics;
using System.Text;
using System.Threading.Tasks;

namespace COMMON.Entidades
{
    public class EstudiantesResidencias: CamposControl
    {
        public int EstudianteId { get; set; }
        public string Nombre { get; set; }
        public string Correo { get; set; }
        public string Telefono { get; set; }
        public string Mensaje { get; set; }
        public string Universidad { get; set; }
        public string Carrera { get; set; }
        public string Semestre { get; set; } 
        public string AreaInteres { get; set; } // Área de interés para la residencia
        public string PeriodoResidencia { get; set; } // Ejemplo: "Enero - Junio 2024"
        public string NombreArchivoCV { get; set; } // Nombre del archivo del CV
        public string RutaArchivoCV { get; set; } // Ruta del archivo del CV en el servidor
        public BigInteger TamañoArchivoCV { get; set; } // Tamaño del archivo del CV en bytes
        public string TipoArchivoCV { get; set; } // Tipo MIME del archivo del CV, por ejemplo: "application/pdf"
        public DateTime FechaSolicitud { get; set; } // Fecha en que se realizó la solicitud de residencia
        public string EstadoSolicitud { get; set; } // Ejemplo: "Pendiente", "Aprobada", "Rechazada"
        public DateTime FechaRespuesta { get; set; } // Fecha en que se dio respuesta a la solicitud
        public string NotasEvaluacion { get; set; } // Notas o comentarios de la evaluación de la solicitud
        public int UsuarioEvaluador { get; set; } // ID del usuario que evaluó la solicitud
        public string IP_Address { get; set; } // Dirección IP desde donde se realizó el contacto
        public string UserAgent { get; set; } // Información del navegador o dispositivo utilizado para el contacto
    }
}
