using COMMON.Entidades;
using System;

namespace COMMON.Entidades
{
    public class SolicitudCV : CamposControl
    {
        public int Id { get; set; }
        public string NombreCompleto { get; set; } = "";
        public string Email { get; set; } = "";
        public string Telefono { get; set; } = "";
        public string TipoSolicitud { get; set; } = ""; // "residencia" o "trabajo"
        public string Carrera { get; set; } = "";
        public string Universidad { get; set; } = "";
        public string Experiencia { get; set; } = "";
        public string PosicionInteres { get; set; } = "";
        public string Mensaje { get; set; } = "";
        public byte[] ArchivoCV { get; set; } = null;
        public string NombreArchivoCV { get; set; } = "";
        public bool Procesado { get; set; } = false;
        public DateTime? FechaProcesado { get; set; }
        public string NotasAdmin { get; set; } = "";

        // 🆕 NUEVOS CAMPOS - INFORMACIÓN DE LAS 3 MODALIDADES
        public DateTime? FechaEntrevista { get; set; }
        public string HoraEntrevista { get; set; } = ""; // Formato "14:00"

        // Modalidad Virtual
        public string EnlaceVirtual { get; set; } = "";
        public string InstruccionesVirtual { get; set; } = "";

        // Modalidad Telefónica
        public string TelefonoContacto { get; set; } = ""; // Puede ser diferente al teléfono principal
        public string InstrucionesTelefonica { get; set; } = "";

        // Modalidad Presencial
        public string DireccionEntrevista { get; set; } = "";
        public string InstruccionesPresencial { get; set; } = "";

        // Mensaje general
        public string MensajePersonalizado { get; set; } = "";

        // 🆕 Modalidad seleccionada por el candidato (se actualiza después)
        public string ModalidadSeleccionada { get; set; } = ""; // "Virtual", "Telefonica", "Presencial"
        public DateTime? FechaSeleccionModalidad { get; set; }
    }
}