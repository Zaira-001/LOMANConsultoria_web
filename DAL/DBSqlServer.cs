using COMMON;
using COMMON.Entidades;
using COMMON.Interfaces;
using FluentValidation;
using Microsoft.Data.SqlClient;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace DAL
{
    public class DBSqlServer<T> : IDB<T> where T : CamposControl
    {
        public string Error { get; private set; }
        private string cadenaDeConexion;
        private string campoId;
        private bool esAutonumerico;
        private AbstractValidator<T> validador;

        public DBSqlServer(string cadenaDeConexion, AbstractValidator<T> validador, string campoId, bool esAutonumerico)
        {
            this.cadenaDeConexion = cadenaDeConexion;
            this.campoId = campoId;
            this.esAutonumerico = esAutonumerico;
            Error = "";
            this.validador = validador;
        }

        public T Actualizar(T entidad)
        {
            Error = "";
            try
            {
                entidad.UsuarioMod = Params.UsuarioConectado;
                entidad.FechaMod = DateTime.Now;

                var resultadoValidacion = validador.Validate(entidad);
                if (!resultadoValidacion.IsValid)
                {
                    Error = string.Join(",", resultadoValidacion.Errors);
                    Console.WriteLine($"[DB] Errores de validación: {Error}");
                    return null;
                }

                string sql = $"UPDATE {typeof(T).Name} SET {string.Join(",", entidad.GetType().GetProperties().Where(p => p.Name != campoId).Select(p => p.Name + "=@" + p.Name))} WHERE {campoId}=@Id";

                Dictionary<string, object> parametros = new Dictionary<string, object>();

                foreach (var propiedad in entidad.GetType().GetProperties().Where(p => p.Name != campoId))
                {
                    var valor = propiedad.GetValue(entidad);
                    parametros.Add("@" + propiedad.Name, valor ?? DBNull.Value);
                }

                parametros.Add("@Id", entidad.GetType().GetProperty(campoId).GetValue(entidad));

                Console.WriteLine($"[DB] UPDATE SQL: {sql}");
                Console.WriteLine($"[DB] Parámetros: {string.Join(", ", parametros.Select(p => $"{p.Key}={p.Value}"))}");

                if (EjecutarComando(sql, parametros) == 1)
                {
                    return entidad;
                }
                else
                {
                    Error = "No se actualizó ninguna fila";
                    return null;
                }
            }
            catch (SqlException sqlEx)
            {
                Error = $"SQL Error {sqlEx.Number}: {sqlEx.Message}";
                Console.WriteLine($"[DB] ❌ SQL Exception en Actualizar:");
                Console.WriteLine($"[DB]    Number: {sqlEx.Number}");
                Console.WriteLine($"[DB]    Message: {sqlEx.Message}");
                return null;
            }
            catch (Exception ex)
            {
                Error = ex.Message;
                Console.WriteLine($"[DB] ❌ Error en Actualizar: {ex.Message}");
                return null;
            }
        }
        public List<M> EjecutarProcedimiento<M>(string nombre, Dictionary<string, string> parametros) where M : class
        {
            using (SqlConnection conexion = new SqlConnection(cadenaDeConexion))
            {
                conexion.Open();
                using (SqlCommand comando = new SqlCommand(nombre, conexion))
                {
                    comando.CommandType = System.Data.CommandType.StoredProcedure;
                    foreach (var parametro in parametros)
                    {
                        comando.Parameters.AddWithValue(parametro.Key, parametro.Value);
                    }
                    var reader = comando.ExecuteReader();
                    List<M> lista = new List<M>();
                    while (reader.Read())
                    {
                        M entidad = Activator.CreateInstance<M>();
                        foreach (var propiedad in entidad.GetType().GetProperties())
                        {
                            propiedad.SetValue(entidad, reader[propiedad.Name]);
                        }
                        lista.Add(entidad);
                    }
                    return lista;
                }
            }
        }

        public bool Eliminar(T entidad)
        {
            Error = "";
            try
            {
                string sql = $"DELETE FROM {typeof(T).Name} WHERE {campoId}=@Id";
                Dictionary<string, object> parametros = new Dictionary<string, object>();
                parametros.Add("@Id", entidad.GetType().GetProperty(campoId).GetValue(entidad));
                return EjecutarComando(sql, parametros) == 1;
            }
            catch (Exception ex)
            {
                Error = ex.Message;
                return false;
            }
        }

        private int EjecutarComando(string sql, Dictionary<string, object> parametros)
        {
            using (SqlConnection conexion = new SqlConnection(cadenaDeConexion))
            {
                conexion.Open();
                using (SqlCommand comando = new SqlCommand(sql, conexion))
                {
                    foreach (var parametro in parametros)
                    {
                        comando.Parameters.AddWithValue(parametro.Key, parametro.Value);
                    }
                    return comando.ExecuteNonQuery();
                }
            }
        }

        public T Insertar(T entidad)
        {
            Error = "";
            SqlConnection conexion = null;
            SqlCommand comando = null;

            try
            {
                entidad.UsuarioAlta = Params.UsuarioConectado;
                entidad.FechaAlta = DateTime.Now;
                entidad.UsuarioMod = Params.UsuarioConectado;
                entidad.FechaMod = DateTime.Now;

                var resultadoValidacion = validador.Validate(entidad);
                if (!resultadoValidacion.IsValid)
                {
                    Error = string.Join(",", resultadoValidacion.Errors);
                    Console.WriteLine($"[DB] Errores de validación: {Error}");
                    return null;
                }

                string sql;
                Dictionary<string, object> parametros = new Dictionary<string, object>();

                if (esAutonumerico)
                {
                    sql = $"INSERT INTO {typeof(T).Name} ({string.Join(",", entidad.GetType().GetProperties().Where(p => p.Name != campoId).Select(p => p.Name))}) VALUES " +
                        $"({string.Join(", ", entidad.GetType().GetProperties().Where(p => p.Name != campoId).Select(p => "@" + p.Name))})";

                    foreach (var propiedad in entidad.GetType().GetProperties().Where(p => p.Name != campoId))
                    {
                        var valor = propiedad.GetValue(entidad);
                        parametros.Add("@" + propiedad.Name, valor ?? DBNull.Value);
                    }
                }
                else
                {
                    sql = $"INSERT INTO {typeof(T).Name} ({string.Join(",", entidad.GetType().GetProperties().Select(p => p.Name))}) VALUES " +
                        $"({string.Join(", ", entidad.GetType().GetProperties().Select(p => "@" + p.Name))})";

                    foreach (var propiedad in entidad.GetType().GetProperties())
                    {
                        var valor = propiedad.GetValue(entidad);
                        parametros.Add("@" + propiedad.Name, valor ?? DBNull.Value);
                    }
                }

                Console.WriteLine($"[DB] SQL: {sql}");
                Console.WriteLine($"[DB] Parámetros: {string.Join(", ", parametros.Select(p => $"{p.Key}={p.Value}"))}");

                // IMPORTANTE: Mantener la conexión abierta para SCOPE_IDENTITY()
                conexion = new SqlConnection(cadenaDeConexion);
                conexion.Open();

                comando = new SqlCommand(sql, conexion);

                foreach (var parametro in parametros)
                {
                    comando.Parameters.AddWithValue(parametro.Key, parametro.Value);
                }

                int filasAfectadas = comando.ExecuteNonQuery();
                Console.WriteLine($"[DB] Filas afectadas: {filasAfectadas}");

                if (filasAfectadas == 1)
                {
                    if (esAutonumerico)
                    {
                        try
                        {
                            // OBTENER SOLO EL ID (más simple y rápido)
                            using (SqlCommand cmdIdentity = new SqlCommand("SELECT CAST(SCOPE_IDENTITY() AS INT)", conexion))
                            {
                                var idResult = cmdIdentity.ExecuteScalar();

                                if (idResult != null && idResult != DBNull.Value)
                                {
                                    int nuevoId = Convert.ToInt32(idResult);

                                    // ✅ ASIGNAR EL ID A LA ENTIDAD Y RETORNAR
                                    entidad.GetType().GetProperty(campoId)?.SetValue(entidad, nuevoId);

                                    System.Diagnostics.Debug.WriteLine($"[DB] ✅ Registro insertado con ID: {nuevoId}");
                                    Console.WriteLine($"[DB] ✅ Registro insertado con ID: {nuevoId}");

                                    return entidad;
                                }
                                else
                                {
                                    // Si SCOPE_IDENTITY falla pero el INSERT funcionó, igual retornamos la entidad
                                    System.Diagnostics.Debug.WriteLine($"[DB] ⚠️ SCOPE_IDENTITY NULL pero INSERT exitoso");
                                    return entidad;
                                }
                            }
                        }
                        catch (Exception exIdentity)
                        {
                            // Si hay error obteniendo el ID pero el INSERT funcionó, igual retornamos
                            System.Diagnostics.Debug.WriteLine($"[DB] ⚠️ Error en SCOPE_IDENTITY pero INSERT exitoso: {exIdentity.Message}");
                            return entidad;
                        }
                    }
                    else
                    {
                        return entidad;
                    }
                }
                else
                {
                    Error = $"Se esperaba insertar 1 fila pero se insertaron {filasAfectadas}";
                    Console.WriteLine($"[DB] ❌ {Error}");
                    return null;
                }
            }
            catch (SqlException sqlEx)
            {
                // CRÍTICO: Capturar errores específicos de SQL Server
                Error = $"SQL Error {sqlEx.Number}: {sqlEx.Message}";
                Console.WriteLine($"[DB] ❌ SQL Exception:");
                Console.WriteLine($"[DB]    Number: {sqlEx.Number}");
                Console.WriteLine($"[DB]    Message: {sqlEx.Message}");
                Console.WriteLine($"[DB]    LineNumber: {sqlEx.LineNumber}");
                Console.WriteLine($"[DB]    Procedure: {sqlEx.Procedure}");
                Console.WriteLine($"[DB]    State: {sqlEx.State}");
                Console.WriteLine($"[DB]    Source: {sqlEx.Source}");

                // Errores comunes:
                // 2627 = Violación de clave única
                // 547 = Violación de clave foránea
                // 515 = No se puede insertar NULL
                // 8152 = Dato truncado

                return null;
            }
            catch (Exception ex)
            {
                Error = ex.Message;
                Console.WriteLine($"[DB] ❌ Error general en Insertar: {ex.Message}");
                Console.WriteLine($"[DB] Stack: {ex.StackTrace}");
                if (ex.InnerException != null)
                {
                    Console.WriteLine($"[DB] Inner Exception: {ex.InnerException.Message}");
                }
                return null;
            }
            finally
            {
                // IMPORTANTE: Cerrar recursos manualmente
                comando?.Dispose();
                conexion?.Close();
                conexion?.Dispose();
            }
        }

       


        public T ObtenerPorId(int id)
        {
            return obtenerPorId(id.ToString());
        }

        public T obtenerPorId(string id)
        {
            try
            {
                string sql = $"SELECT * FROM {typeof(T).Name} WHERE {campoId}=@Id";
                Dictionary<string, object> parametros = new Dictionary<string, object>();
                parametros.Add("@Id", id);
                return EjecutarConsulta(sql, parametros).FirstOrDefault();
            }
            catch (Exception ex)
            {
                Error = ex.Message;
                return null;
            }
        }

        public List<T> ObtenerTodos()
        {
            Error = "";
            try
            {
                string sql = $"SELECT * FROM {typeof(T).Name}"; // Eliminado el WHERE @Id
                Dictionary<string, object> parametros = new Dictionary<string, object>();
                return EjecutarConsulta(sql, parametros);
            }
            catch (Exception ex)
            {
                Error = ex.Message;
                return null;
            }
        }

        private List<T> EjecutarConsulta(string sql, Dictionary<string, object> parametros)
        {
            Console.WriteLine($"[DB] Ejecutando consulta: {sql}");

            using (SqlConnection conexion = new SqlConnection(cadenaDeConexion))
            {
                conexion.Open();
                using (SqlCommand comando = new SqlCommand(sql, conexion))
                {
                    foreach (var parametro in parametros)
                    {
                        comando.Parameters.AddWithValue(parametro.Key, parametro.Value);
                    }

                    var reader = comando.ExecuteReader();
                    List<T> lista = new List<T>();

                    while (reader.Read())
                    {
                        Console.WriteLine($"[DB] Procesando fila...");
                        T entidad = Activator.CreateInstance<T>();

                        foreach (var propiedad in entidad.GetType().GetProperties())
                        {
                            try
                            {
                                // Buscar la columna
                                bool encontrada = false;
                                for (int i = 0; i < reader.FieldCount; i++)
                                {
                                    if (reader.GetName(i).Equals(propiedad.Name, StringComparison.OrdinalIgnoreCase))
                                    {
                                        encontrada = true;
                                        var valor = reader[propiedad.Name];

                                        Console.WriteLine($"[DB] Campo {propiedad.Name}: Valor={valor}, Tipo={valor?.GetType()}, IsDBNull={valor == DBNull.Value}");

                                        if (valor != DBNull.Value)
                                        {
                                            propiedad.SetValue(entidad, valor);
                                        }
                                        break;
                                    }
                                }

                                if (!encontrada)
                                {
                                    Console.WriteLine($"[DB] Campo {propiedad.Name} no encontrado en resultado");
                                }
                            }
                            catch (Exception ex)
                            {
                                Console.WriteLine($"[DB] ERROR en campo {propiedad.Name}: {ex.Message}");
                                throw; // Re-lanzar para ver el error completo
                            }
                        }
                        lista.Add(entidad);
                    }

                    Console.WriteLine($"[DB] Consulta completada: {lista.Count} registros");
                    return lista;
                }
            }
        }
    }
}
