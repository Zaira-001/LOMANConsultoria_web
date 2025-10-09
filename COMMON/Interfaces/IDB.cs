using COMMON.Entidades;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace COMMON.Interfaces
{
    public interface IDB<T> where T : CamposControl
    {
        /// <summary>
        /// Obtiene el error, si es que existe, al ejecutar alguna operacion
        /// </summary>
        string Error { get; }
        /// <summary>
        /// Obtiene todods los registros de la tabla
        /// </summary>
        /// <returns> Lista de objetos que representan los resgistros</returns>
        List<T> ObtenerTodos();
        /// <summary>
        /// Obtiene el registro correspondiente al id proporcionado
        /// </summary>
        /// <param name="id">Id del registro a obtener</param>
        /// <returns>Objeto correspondiente al id proporcionado</returns>
        T ObtenerPorId(int id);
        /// <summary>
        /// 
        /// </summary>
        /// <param name="id"></param>
        /// <returns></returns>
        T obtenerPorId(string id);
        bool Eliminar(T entidad);
        T Insertar(T entidad);
        T Actualizar(T entidad);
        List<M> EjecutarProcedimiento<M>(string nombre, Dictionary<string, string> parametros) where M : class;
    }
}

