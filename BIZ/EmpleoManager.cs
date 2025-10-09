using COMMON.Entidades;
using COMMON.Validadores;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace BIZ
{
    public class EmpleoManager: GenericManager<Empleo>
    {
        public EmpleoManager() : base(new EmpleoValidator())
        {
        }

        public async Task<List<Empleo>> ObtenerEmpleosActivos()
        {
            try
            {
                var todosLosEmpleos = await ObtenerTodos();
                if (todosLosEmpleos == null)
                    return new List<Empleo>();

                return todosLosEmpleos.Where(e => e.Activo).ToList();
            }
            catch (Exception ex)
            {
                Error = ex.Message;
                return new List<Empleo>();
            }
        }

        public async Task<bool> CambiarEstado(int empleoId, bool nuevoEstado)
        {
            try
            {
                var empleo = await ObtenerPorId(empleoId);
                if (empleo == null)
                {
                    Error = "Empleo no encontrado";
                    return false;
                }

                empleo.Activo = nuevoEstado;
                var resultado = await Modificar(empleo);
                return resultado != null;
            }
            catch (Exception ex)
            {
                Error = ex.Message;
                return false;
            }
        }

        public async Task<List<Empleo>> BuscarPorNivel(string nivel)
        {
            try
            {
                var empleos = await ObtenerEmpleosActivos();
                return empleos.Where(e => e.Nivel.Equals(nivel, StringComparison.OrdinalIgnoreCase)).ToList();
            }
            catch (Exception ex)
            {
                Error = ex.Message;
                return new List<Empleo>();
            }
        }
    }
}