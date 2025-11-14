using COMMON.Entidades;
using COMMON.Interfaces;
using COMMON.Validadores;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Security.Cryptography;
using System.Text;
using System.Threading.Tasks;

namespace BIZ
{
    public class AdminManager
    {
        private const int MAX_INTENTOS_LOGIN = 5;
        private const int MINUTOS_BLOQUEO = 30;

        private readonly IDB<Admin> _repositorio;
        public string Error { get; private set; }

        public AdminManager(IDB<Admin> repositorio)
        {
            _repositorio = repositorio ?? throw new ArgumentNullException(nameof(repositorio));
        }

        public async Task<Admin> Login(string username, string password)
        {
            try
            {
                Console.WriteLine($"[AdminManager.Login] Buscando usuario: {username}");

                var admin = await BuscarPorUsername(username);
                if (admin == null)
                {
                    Error = "Usuario no encontrado";
                    Console.WriteLine($"[AdminManager.Login] Usuario '{username}' no encontrado");
                    return null;
                }

                Console.WriteLine($"[AdminManager.Login] Usuario encontrado: ID={admin.Id}, Activo={admin.Activo}");

                if (admin.BloqueoHasta.HasValue && admin.BloqueoHasta > DateTime.Now)
                {
                    var tiempoRestante = admin.BloqueoHasta.Value - DateTime.Now;
                    Error = $"Usuario bloqueado. Intente nuevamente en {tiempoRestante.Minutes} minutos";
                    Console.WriteLine($"[AdminManager.Login] Usuario bloqueado hasta: {admin.BloqueoHasta}");
                    return null;
                }

                if (!admin.Activo)
                {
                    Error = "Usuario desactivado";
                    Console.WriteLine($"[AdminManager.Login] Usuario desactivado");
                    return null;
                }

                Console.WriteLine($"[AdminManager.Login] Verificando contraseña...");
                if (!VerificarPassword(password, admin.PasswordHash))
                {
                    Console.WriteLine($"[AdminManager.Login] Contraseña incorrecta");
                    await RegistrarIntentoFallido(admin);
                    Error = "Contraseña incorrecta";
                    return null;
                }

                Console.WriteLine($"[AdminManager.Login] Login exitoso");
                await RegistrarLoginExitoso(admin);
                return admin;
            }
            catch (Exception ex)
            {
                Console.WriteLine($"[AdminManager.Login] Excepción: {ex.Message}");
                Error = ex.Message;
                return null;
            }
        }

        public async Task<Admin> CrearAdmin(string username, string email, string password, string nombreCompleto = "")
        {
            try
            {
                Console.WriteLine($"[AdminManager.CrearAdmin] =========================");
                Console.WriteLine($"[AdminManager.CrearAdmin] Iniciando creación de admin");
                Console.WriteLine($"[AdminManager.CrearAdmin]   Username: {username}");
                Console.WriteLine($"[AdminManager.CrearAdmin]   Email: {email}");
                Console.WriteLine($"[AdminManager.CrearAdmin]   NombreCompleto: {nombreCompleto}");

                if (string.IsNullOrWhiteSpace(username))
                {
                    Error = "El nombre de usuario es requerido";
                    Console.WriteLine($"[AdminManager.CrearAdmin] ❌ {Error}");
                    return null;
                }

                if (string.IsNullOrWhiteSpace(email))
                {
                    Error = "El email es requerido";
                    Console.WriteLine($"[AdminManager.CrearAdmin] ❌ {Error}");
                    return null;
                }

                if (string.IsNullOrWhiteSpace(password))
                {
                    Error = "La contraseña es requerida";
                    Console.WriteLine($"[AdminManager.CrearAdmin] ❌ {Error}");
                    return null;
                }

                Console.WriteLine($"[AdminManager.CrearAdmin] Verificando si usuario existe...");
                var existeUsuario = await BuscarPorUsername(username);
                if (existeUsuario != null)
                {
                    Error = "El nombre de usuario ya existe";
                    Console.WriteLine($"[AdminManager.CrearAdmin] ❌ {Error}");
                    return null;
                }

                Console.WriteLine($"[AdminManager.CrearAdmin] Verificando si email existe...");
                var existeEmail = await BuscarPorEmail(email);
                if (existeEmail != null)
                {
                    Error = "El email ya está registrado";
                    Console.WriteLine($"[AdminManager.CrearAdmin] ❌ {Error}");
                    return null;
                }

                Console.WriteLine($"[AdminManager.CrearAdmin] ✅ Validaciones pasadas, creando objeto Admin...");

                var admin = new Admin
                {
                    Username = username,
                    Email = email,
                    PasswordHash = HashPassword(password),
                    NombreCompleto = nombreCompleto,
                    Rol = "Admin",
                    Activo = true,
                    FechaAlta = DateTime.Now,
                    FechaMod = DateTime.Now,
                    UsuarioAlta = "Sistema",
                    UsuarioMod = "Sistema",
                    IntentosLogin = 0
                };

                Console.WriteLine($"[AdminManager.CrearAdmin] Insertando en base de datos...");

                var resultado = _repositorio.Insertar(admin);

                if (resultado != null)
                {
                    Console.WriteLine($"[AdminManager.CrearAdmin] ✅ Admin insertado con ID: {resultado.Id}");
                    Error = null;
                    return resultado;
                }
                else
                {
                    Error = _repositorio.Error ?? "Error desconocido al insertar en la base de datos";
                    Console.WriteLine($"[AdminManager.CrearAdmin] ❌ Error insertando: {Error}");
                    return null;
                }
            }
            catch (Exception ex)
            {
                Error = $"Excepción al crear administrador: {ex.Message}";
                Console.WriteLine($"[AdminManager.CrearAdmin] ❌ Excepción: {Error}");
                Console.WriteLine($"[AdminManager.CrearAdmin] Stack: {ex.StackTrace}");

                if (ex.InnerException != null)
                {
                    Console.WriteLine($"[AdminManager.CrearAdmin] InnerException: {ex.InnerException.Message}");
                }

                return null;
            }
        }

        public async Task<bool> CambiarPassword(int adminId, string passwordActual, string nuevaPassword)
        {
            try
            {
                var admin = await ObtenerPorId(adminId);
                if (admin == null)
                {
                    Error = "Administrador no encontrado";
                    return false;
                }

                if (!VerificarPassword(passwordActual, admin.PasswordHash))
                {
                    Error = "La contraseña actual es incorrecta";
                    return false;
                }

                admin.PasswordHash = HashPassword(nuevaPassword);
                admin.FechaMod = DateTime.Now;
                var resultado = _repositorio.Actualizar(admin);
                return resultado != null;
            }
            catch (Exception ex)
            {
                Error = ex.Message;
                return false;
            }
        }

        public async Task<bool> CambiarEstadoAdmin(int adminId, bool activo)
        {
            try
            {
                var admin = await ObtenerPorId(adminId);
                if (admin == null)
                {
                    Error = "Administrador no encontrado";
                    return false;
                }

                admin.Activo = activo;
                admin.FechaMod = DateTime.Now;
                var resultado = _repositorio.Actualizar(admin);
                return resultado != null;
            }
            catch (Exception ex)
            {
                Error = ex.Message;
                return false;
            }
        }

        public async Task<List<Admin>> ObtenerTodos()
        {
            try
            {
                return _repositorio.ObtenerTodos();
            }
            catch (Exception ex)
            {
                Error = ex.Message;
                return null;
            }
        }

        // ✅ CORREGIDO: Método async que busca por ID correctamente
        // ✅ SOLUCIÓN TEMPORAL: Usar ObtenerTodos y filtrar
        public async Task<Admin> ObtenerPorId(int id)
        {
            try
            {
                Console.WriteLine($"[AdminManager.ObtenerPorId] Buscando admin con ID: {id}");

                // ✅ USAR SIEMPRE ObtenerTodos() Y FILTRAR (más confiable con PostgreSQL)
                var todos = _repositorio.ObtenerTodos();

                if (todos != null && todos.Any())
                {
                    Console.WriteLine($"[AdminManager.ObtenerPorId] Total admins en DB: {todos.Count}");

                    var admin = todos.FirstOrDefault(a => a.Id == id);

                    if (admin != null)
                    {
                        Console.WriteLine($"[AdminManager.ObtenerPorId] ✅ Admin encontrado: {admin.Username} (ID: {admin.Id})");
                        return admin;
                    }
                    else
                    {
                        Console.WriteLine($"[AdminManager.ObtenerPorId] ❌ Admin con ID {id} no existe");
                        Console.WriteLine($"[AdminManager.ObtenerPorId] IDs disponibles: {string.Join(", ", todos.Select(a => a.Id))}");
                    }
                }
                else
                {
                    Console.WriteLine($"[AdminManager.ObtenerPorId] ❌ No hay admins en la base de datos");
                }

                Error = $"Admin con ID {id} no encontrado";
                return null;
            }
            catch (Exception ex)
            {
                Console.WriteLine($"[AdminManager.ObtenerPorId] ❌ Excepción: {ex.Message}");
                Console.WriteLine($"[AdminManager.ObtenerPorId] Stack: {ex.StackTrace}");
                Error = ex.Message;
                return null;
            }
        }

        public async Task<bool> ExisteAlgunAdmin()
        {
            try
            {
                var admins = _repositorio.ObtenerTodos();
                return admins != null && admins.Any();
            }
            catch
            {
                return false;
            }
        }

        public async Task<Admin> BuscarPorUsername(string username)
        {
            try
            {
                Console.WriteLine($"[AdminManager.BuscarPorUsername] Buscando: {username}");
                var admins = _repositorio.ObtenerTodos();
                Console.WriteLine($"[AdminManager.BuscarPorUsername] Total admins en DB: {admins?.Count ?? 0}");

                if (admins != null)
                {
                    foreach (var a in admins)
                    {
                        Console.WriteLine($"[AdminManager.BuscarPorUsername] DB Admin: '{a.Username}' (ID: {a.Id})");
                    }
                }

                var admin = admins?.FirstOrDefault(a => a.Username.Equals(username, StringComparison.OrdinalIgnoreCase));
                Console.WriteLine($"[AdminManager.BuscarPorUsername] Encontrado: {admin != null}");
                return admin;
            }
            catch (Exception ex)
            {
                Console.WriteLine($"[AdminManager.BuscarPorUsername] Error: {ex.Message}");
                Error = ex.Message;
                return null;
            }
        }

        private async Task<Admin> BuscarPorEmail(string email)
        {
            try
            {
                var admins = _repositorio.ObtenerTodos();
                return admins?.FirstOrDefault(a => a.Email.Equals(email, StringComparison.OrdinalIgnoreCase));
            }
            catch (Exception ex)
            {
                Error = ex.Message;
                return null;
            }
        }

        private async Task RegistrarIntentoFallido(Admin admin)
        {
            try
            {
                admin.IntentosLogin++;

                if (admin.IntentosLogin >= MAX_INTENTOS_LOGIN)
                {
                    admin.BloqueoHasta = DateTime.Now.AddMinutes(MINUTOS_BLOQUEO);
                }

                admin.FechaMod = DateTime.Now;
                _repositorio.Actualizar(admin);
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Error registrando intento fallido: {ex.Message}");
            }
        }

        private async Task RegistrarLoginExitoso(Admin admin)
        {
            try
            {
                admin.UltimoLogin = DateTime.Now;
                admin.IntentosLogin = 0;
                admin.BloqueoHasta = null;
                admin.FechaMod = DateTime.Now;

                _repositorio.Actualizar(admin);
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Error registrando login exitoso: {ex.Message}");
            }
        }

        public static string HashPassword(string password)
        {
            using (var sha256 = SHA256.Create())
            {
                var salt = "ConsultoriaIntegralSC_2024";
                var saltedPassword = password + salt;
                var hashedBytes = sha256.ComputeHash(Encoding.UTF8.GetBytes(saltedPassword));
                return Convert.ToBase64String(hashedBytes);
            }
        }

        public static bool VerificarPassword(string password, string hash)
        {
            var hashedPassword = HashPassword(password);
            return hashedPassword.Equals(hash);
        }

        public static bool EsPasswordValida(string password)
        {
            if (string.IsNullOrEmpty(password) || password.Length < 8)
                return false;

            var tieneMinuscula = password.Any(char.IsLower);
            var tieneMayuscula = password.Any(char.IsUpper);
            var tieneDigito = password.Any(char.IsDigit);
            var tieneEspecial = password.Any(c => !char.IsLetterOrDigit(c));

            return tieneMinuscula && tieneMayuscula && tieneDigito && tieneEspecial;
        }

        public static string ObtenerMensajeValidacionPassword(string password)
        {
            if (string.IsNullOrEmpty(password))
                return "La contraseña es requerida";

            if (password.Length < 8)
                return "La contraseña debe tener al menos 8 caracteres";

            if (!password.Any(char.IsLower))
                return "La contraseña debe contener al menos una letra minúscula";

            if (!password.Any(char.IsUpper))
                return "La contraseña debe contener al menos una letra mayúscula";

            if (!password.Any(char.IsDigit))
                return "La contraseña debe contener al menos un número";

            if (!password.Any(c => !char.IsLetterOrDigit(c)))
                return "La contraseña debe contener al menos un carácter especial";

            return "";
        }
    }
}