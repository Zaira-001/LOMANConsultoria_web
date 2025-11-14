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

        // ✅ HELPER: Obtener nombre de tabla con comillas para PostgreSQL
        private string GetTableName()
        {
            string tableName = typeof(T).Name;
            // Envolver en comillas dobles para preservar mayúsculas/minúsculas
            return $"\"{tableName}\"";
        }

        // ✅ HELPER: Obtener nombre de columna con comillas
        private string GetColumnName(string propertyName)
        {
            // Convertir PascalCase a snake_case si es necesario
            // Por ahora, solo envolver en comillas
            return $"\"{propertyName}\"";
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

                // ✅ CORREGIDO: Usar nombres con comillas
                string tableName = GetTableName();
                var propiedades = entidad.GetType().GetProperties().Where(p => p.Name != campoId);
                string setClause = string.Join(",", propiedades.Select(p => $"{GetColumnName(p.Name)}=@{p.Name}"));

                string sql = $"UPDATE {tableName} SET {setClause} WHERE {GetColumnName(campoId)}=@Id";

                Dictionary<string, object> parametros = new Dictionary<string, object>();

                foreach (var propiedad in propiedades)
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
                string tableName = GetTableName();
                string sql = $"DELETE FROM {tableName} WHERE {GetColumnName(campoId)}=@Id";
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
                string tableName = GetTableName();

                if (esAutonumerico)
                {
                    var propiedadesSinId = entidad.GetType().GetProperties().Where(p => p.Name != campoId);
                    string columnas = string.Join(",", propiedadesSinId.Select(p => GetColumnName(p.Name)));
                    string valores = string.Join(", ", propiedadesSinId.Select(p => "@" + p.Name));

                    sql = $"INSERT INTO {tableName} ({columnas}) VALUES ({valores}) RETURNING {GetColumnName(campoId)}";

                    foreach (var propiedad in propiedadesSinId)
                    {
                        var valor = propiedad.GetValue(entidad);
                        parametros.Add("@" + propiedad.Name, valor ?? DBNull.Value);
                    }
                }
                else
                {
                    var todasPropiedades = entidad.GetType().GetProperties();
                    string columnas = string.Join(",", todasPropiedades.Select(p => GetColumnName(p.Name)));
                    string valores = string.Join(", ", todasPropiedades.Select(p => "@" + p.Name));

                    sql = $"INSERT INTO {tableName} ({columnas}) VALUES ({valores})";

                    foreach (var propiedad in todasPropiedades)
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
                Console.WriteLine($"[DB PostgreSQL] ObtenerPorId: {id}");

                string tableName = GetTableName();
                string sql = $"SELECT * FROM {tableName} WHERE {GetColumnName(campoId)}=@Id";

                Console.WriteLine($"[DB PostgreSQL] SQL: {sql}");

                Dictionary<string, object> parametros = new Dictionary<string, object>();
                parametros.Add("@Id", id);

                var resultado = EjecutarConsulta(sql, parametros).FirstOrDefault();

                if (resultado != null)
                {
                    Console.WriteLine($"[DB PostgreSQL] ✅ Registro encontrado");
                }
                else
                {
                    Console.WriteLine($"[DB PostgreSQL] ❌ Registro NO encontrado");
                }

                return resultado;
            }
            catch (Exception ex)
            {
                Console.WriteLine($"[DB PostgreSQL] ❌ Error en ObtenerPorId: {ex.Message}");
                Error = ex.Message;
                return null;
            }
        }

        public List<T> ObtenerTodos()
        {
            Error = "";
            try
            {
                string tableName = GetTableName();
                string sql = $"SELECT * FROM {tableName}";

                Console.WriteLine($"[DB PostgreSQL] ObtenerTodos SQL: {sql}");

                Dictionary<string, object> parametros = new Dictionary<string, object>();
                return EjecutarConsulta(sql, parametros);
            }
            catch (Exception ex)
            {
                Console.WriteLine($"[DB PostgreSQL] ❌ Error en ObtenerTodos: {ex.Message}");
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
                                        var valor = reader[i]; // Usar índice en lugar de nombre

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
                                // No lanzar, continuar con los demás campos
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