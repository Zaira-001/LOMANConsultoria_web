using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace COMMON.Entidades
{
    public class Admin : CamposControl
    {
        public int Id { get; set; }

        [Required]
        [StringLength(50)]
        public string Username { get; set; } = "";

        [Required]
        [StringLength(255)]
        public string PasswordHash { get; set; } = "";

        [Required]
        [StringLength(100)]
        [EmailAddress]
        public string Email { get; set; } = "";

        [StringLength(100)]
        public string NombreCompleto { get; set; } = "";

        public bool Activo { get; set; } = true;

        public DateTime? UltimoLogin { get; set; }

        [StringLength(50)]
        public string Rol { get; set; } = "Admin"; // Solo un tipo de rol: Admin

        public int IntentosLogin { get; set; } = 0;

        public DateTime? BloqueoHasta { get; set; }

        // Nueva propiedad para dispositivos confiables
        public virtual ICollection<DispositivoConfiable> DispositivosConfiables { get; set; } = new List<DispositivoConfiable>();
    }

   
        // Navegación hacia Admin
      //  public virtual Admin Admin { get; set; }
    }
