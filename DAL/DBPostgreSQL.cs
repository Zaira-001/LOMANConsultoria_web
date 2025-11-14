using COMMON;
using COMMON.Entidades;
using COMMON.Interfaces;
using FluentValidation;
using Npgsql;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace DAL
{
    public class DBPostgreSQL<T> : IDB<T> where T : CamposControl
    {
        public string Error { get; private set; }
        private string cadenaDeConexion;
        private string campoId;
        private bool esAutonumerico;
        private AbstractValidator<T> validador;

        public DBPostgreSQL(string cadenaDeConexion, AbstractValidator<T> validador, string campoId, bool esAutonumerico)
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
            catch (NpgsqlException sqlEx)
            {
                Error = $"PostgreSQL Error {sqlEx.SqlState}: {sqlEx.Message}";
                Console.WriteLine($"[DB] ❌ PostgreSQL Exception en Actualizar:");
                Console.WriteLine($"[DB]    SqlState: {sqlEx.SqlState}");
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
            using (NpgsqlConnection conexion = new NpgsqlConnection(cadenaDeConexion))
            {
                conexion.Open();
                using (NpgsqlCommand comando = new NpgsqlCommand(nombre, conexion))
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
            using (NpgsqlConnection conexion = new NpgsqlConnection(cadenaDeConexion))
            {
                conexion.Open();
                using (NpgsqlCommand comando = new NpgsqlCommand(sql, conexion))
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
            NpgsqlConnection conexion = null;
            NpgsqlCommand comando = null;

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
                    // ✅ POSTGRESQL: Usar RETURNING en lugar de SCOPE_IDENTITY()
                    sql = $"INSERT INTO {typeof(T).Name} ({string.Join(",", entidad.GetType().GetProperties().Where(p => p.Name != campoId).Select(p => p.Name))}) VALUES " +
                        $"({string.Join(", ", entidad.GetType().GetProperties().Where(p => p.Name != campoId).Select(p => "@" + p.Name))}) RETURNING {campoId}";

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

                conexion = new NpgsqlConnection(cadenaDeConexion);
                conexion.Open();

                comando = new NpgsqlCommand(sql, conexion);

                foreach (var parametro in parametros)
                {
                    comando.Parameters.AddWithValue(parametro.Key, parametro.Value);
                }

                if (esAutonumerico)
                {
                    // ✅ POSTGRESQL: ExecuteScalar con RETURNING obtiene el ID directamente
                    var idResult = comando.ExecuteScalar();

                    if (idResult != null && idResult != DBNull.Value)
                    {
                        int nuevoId = Convert.ToInt32(idResult);
                        entidad.GetType().GetProperty(campoId)?.SetValue(entidad, nuevoId);

                        System.Diagnostics.Debug.WriteLine($"[DB] ✅ Registro insertado con ID: {nuevoId}");
                        Console.WriteLine($"[DB] ✅ Registro insertado con ID: {nuevoId}");

                        return entidad;
                    }
                    else
                    {
                        Error = "No se pudo obtener el ID generado";
                        Console.WriteLine($"[DB] ❌ {Error}");
                        return null;
                    }
                }
                else
                {
                    int filasAfectadas = comando.ExecuteNonQuery();
                    Console.WriteLine($"[DB] Filas afectadas: {filasAfectadas}");

                    if (filasAfectadas == 1)
                    {
                        return entidad;
                    }
                    else
                    {
                        Error = $"Se esperaba insertar 1 fila pero se insertaron {filasAfectadas}";
                        Console.WriteLine($"[DB] ❌ {Error}");
                        return null;
                    }
                }
            }
            catch (NpgsqlException sqlEx)
            {
                Error = $"PostgreSQL Error {sqlEx.SqlState}: {sqlEx.Message}";
                Console.WriteLine($"[DB] ❌ PostgreSQL Exception:");
                Console.WriteLine($"[DB]    SqlState: {sqlEx.SqlState}");
                Console.WriteLine($"[DB]    Message: {sqlEx.Message}");

                // Errores comunes PostgreSQL:
                // 23505 = Violación de clave única
                // 23503 = Violación de clave foránea
                // 23502 = Not null violation

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
                string sql = $"SELECT * FROM {typeof(T).Name}";
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

            using (NpgsqlConnection conexion = new NpgsqlConnection(cadenaDeConexion))
            {
                conexion.Open();
                using (NpgsqlCommand comando = new NpgsqlCommand(sql, conexion))
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
                                throw;
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