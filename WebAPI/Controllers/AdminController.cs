using BIZ;
using COMMON.Entidades;
using COMMON.Interfaces;
using Microsoft.AspNetCore.Cors;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using System.ComponentModel.DataAnnotations;
using System.Security.Cryptography;
using System.Text;

namespace WebAPI.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class AdminController : GenericController<Admin>
    {
        private readonly AdminManager _adminManager;
        private const string LLAVE_MAESTRA_HASH = "PgfWeRepd1+Hjjo0Cessx5wDtpOq5dAiOx5xvX+MpVo="; // Hash de "Lom4n2025#"

        // Constructor que recibe y pasa el repositorio
        public AdminController(IDB<Admin> repositorio) : base(repositorio)
        {
            _adminManager = new AdminManager(repositorio); // Pasar el repositorio al AdminManager
        }

        // POST: api/Admin/login
        [HttpPost("login")]
        public async Task<ActionResult<LoginResponse>> Login([FromBody] LoginRequest request)
        {
            try
            {
                Console.WriteLine($"[LOGIN] =========================");
                Console.WriteLine($"[LOGIN] Intento de login para usuario: {request.Username}");
                Console.WriteLine($"[LOGIN] Fingerprint recibido: {request.FingerprintDispositivo?.Substring(0, Math.Min(10, request.FingerprintDispositivo?.Length ?? 0))}...");

                if (string.IsNullOrEmpty(request.Username) || string.IsNullOrEmpty(request.Password))
                {
                    Console.WriteLine("[LOGIN] Error: Usuario y contraseña son requeridos");
                    return BadRequest(new LoginResponse
                    {
                        Success = false,
                        Message = "Usuario y contraseña son requeridos"
                    });
                }

                // Verificar conexión a base de datos
                Console.WriteLine("[LOGIN] Verificando conexión a base de datos...");
                try
                {
                    var testConnection = await _adminManager.ObtenerTodos();
                    Console.WriteLine($"[LOGIN] Conexión OK. Encontrados {testConnection?.Count ?? 0} administradores en total");

                    if (testConnection != null && testConnection.Count > 0)
                    {
                        Console.WriteLine("[LOGIN] Usuarios encontrados:");
                        foreach (var adminItem in testConnection)
                        {
                            Console.WriteLine($"[LOGIN] - ID: {adminItem.Id}, Username: '{adminItem.Username}', Email: '{adminItem.Email}', Activo: {adminItem.Activo}");
                        }
                    }
                    else
                    {
                        Console.WriteLine("[LOGIN] ⚠️ No se encontraron administradores en la base de datos");
                        return BadRequest(new LoginResponse
                        {
                            Success = false,
                            Message = "Sistema no inicializado. Contacte al administrador."
                        });
                    }
                }
                catch (Exception dbEx)
                {
                    Console.WriteLine($"[LOGIN] ERROR DE CONEXIÓN: {dbEx.Message}");
                    Console.WriteLine($"[LOGIN] Stack trace: {dbEx.StackTrace}");
                    return StatusCode(500, new LoginResponse
                    {
                        Success = false,
                        Message = $"Error de conexión a base de datos: {dbEx.Message}"
                    });
                }

                // Intentar login
                Console.WriteLine($"[LOGIN] Intentando login para usuario '{request.Username}'...");
                var admin = await _adminManager.Login(request.Username, request.Password);

                if (admin != null)
                {
                    Console.WriteLine($"[LOGIN] ✅ Login exitoso para admin ID: {admin.Id}");

                    var response = new LoginResponse
                    {
                        Success = true,
                        Message = "Login exitoso",
                        AdminId = admin.Id,
                        Username = admin.Username,
                        Email = admin.Email,
                        NombreCompleto = admin.NombreCompleto,
                        Rol = admin.Rol,
                        UltimoLogin = admin.UltimoLogin,
                        RequiereClaveMaestra = false // Por ahora false para testing
                    };

                    Console.WriteLine($"[LOGIN] Respuesta enviada exitosamente");
                    return Ok(response);
                }
                else
                {
                    Console.WriteLine($"[LOGIN] ❌ Login fallido");
                    string errorMessage = _adminManager.Error ?? "Credenciales incorrectas";
                    Console.WriteLine($"[LOGIN] Error: '{errorMessage}'");

                    // Si el error está vacío, proporcionar un mensaje genérico
                    if (string.IsNullOrEmpty(errorMessage))
                    {
                        errorMessage = "Usuario o contraseña incorrectos";
                    }

                    return BadRequest(new LoginResponse
                    {
                        Success = false,
                        Message = errorMessage
                    });
                }
            }
            catch (Exception ex)
            {
                Console.WriteLine($"[LOGIN] ❌ Excepción no controlada: {ex.Message}");
                Console.WriteLine($"[LOGIN] Stack trace: {ex.StackTrace}");
                return StatusCode(500, new LoginResponse
                {
                    Success = false,
                    Message = $"Error interno del servidor: {ex.Message}"
                });
            }
        }

        // POST: api/Admin/test-db - Endpoint de diagnóstico MEJORADO
        [HttpPost("test-db")]
        public async Task<ActionResult> TestDatabase()
        {
            try
            {
                Console.WriteLine("[TEST] =========================");
                Console.WriteLine("[TEST] Iniciando diagnóstico completo...");

                // Test 1: Verificar repositorio
                Console.WriteLine("[TEST] 1. Verificando repositorio...");
                if (_repositorio == null)
                {
                    return Ok(new { error = "Repositorio es null" });
                }
                Console.WriteLine("[TEST] ✅ Repositorio inicializado correctamente");

                // Test 2: Verificar AdminManager
                Console.WriteLine("[TEST] 2. Verificando AdminManager...");
                if (_adminManager == null)
                {
                    return Ok(new { error = "AdminManager es null" });
                }
                Console.WriteLine("[TEST] ✅ AdminManager inicializado correctamente");

                // Test 3: Probar conexión directa
                Console.WriteLine("[TEST] 3. Probando conexión directa...");
                var adminsDirecto = _repositorio.ObtenerTodos();
                Console.WriteLine($"[TEST] Resultado directo: {adminsDirecto?.Count ?? 0} registros");

                // Test 4: Probar through AdminManager
                Console.WriteLine("[TEST] 4. Probando through AdminManager...");
                var adminsManager = await _adminManager.ObtenerTodos();
                Console.WriteLine($"[TEST] Resultado AdminManager: {adminsManager?.Count ?? 0} registros");

                // Test 5: Información detallada
                var resultado = new
                {
                    repositorioFunciona = adminsDirecto != null,
                    adminManagerFunciona = adminsManager != null,
                    countDirecto = adminsDirecto?.Count ?? 0,
                    countManager = adminsManager?.Count ?? 0,
                    errorRepositorio = _repositorio.Error,
                    errorAdminManager = _adminManager.Error,
                    usuarios = adminsManager?.Select(a => new {
                        a.Id,
                        a.Username,
                        a.Email,
                        a.Activo,
                        PasswordLength = a.PasswordHash?.Length ?? 0,
                        PasswordStart = a.PasswordHash?.Substring(0, Math.Min(10, a.PasswordHash?.Length ?? 0)) ?? ""
                    }).ToList(),
                    mensaje = "Diagnóstico completado"
                };

                Console.WriteLine("[TEST] ✅ Diagnóstico completado");
                return Ok(resultado);
            }
            catch (Exception ex)
            {
                Console.WriteLine($"[TEST] ❌ Error en diagnóstico: {ex.Message}");
                return Ok(new
                {
                    error = ex.Message,
                    stackTrace = ex.StackTrace,
                    innerException = ex.InnerException?.Message
                });
            }
        }

        // POST: api/Admin/test-hash - Nuevo endpoint para verificar hashing
        [HttpPost("test-hash")]
        public ActionResult TestHash([FromBody] TestHashRequest request)
        {
            try
            {
                Console.WriteLine("[HASH] =========================");
                Console.WriteLine($"[HASH] Probando hash para: '{request?.Password ?? "NULL"}'");

                if (string.IsNullOrEmpty(request?.Password))
                {
                    return BadRequest(new
                    {
                        error = "Password es requerido",
                        ejemplo = "{ \"password\": \"LOMAN567#Consultoria\" }"
                    });
                }

                var hashCalculado = AdminManager.HashPassword(request.Password);
                Console.WriteLine($"[HASH] Hash calculado: {hashCalculado}");

                var hashEsperado = "PgfWeRepd1+Hjjo0Cessx5wDtpOq5dAiOx5xvX+MpVo="; // Hash de LOMAN567#Consultoria
                var coincide = hashCalculado == hashEsperado;

                Console.WriteLine($"[HASH] Hash esperado: {hashEsperado}");
                Console.WriteLine($"[HASH] Coinciden: {coincide}");

                return Ok(new
                {
                    password = request.Password,
                    hashCalculado = hashCalculado,
                    hashEsperado = hashEsperado,
                    coinciden = coincide,
                    verificacion = AdminManager.VerificarPassword(request.Password, hashEsperado),
                    nota = coincide ? "✅ Contraseña correcta" : "❌ Contraseña incorrecta"
                });
            }
            catch (Exception ex)
            {
                Console.WriteLine($"[HASH] Error: {ex.Message}");
                return BadRequest(new { error = ex.Message });
            }
        }

        // También agrega este método GET para probar sin body
        [HttpGet("test-hash-simple")]
        public ActionResult TestHashSimple()
        {
            try
            {
                var password = "LOMAN567#Consultoria";
                var hashCalculado = AdminManager.HashPassword(password);
                var hashEsperado = "PgfWeRepd1+Hjjo0Cessx5wDtpOq5dAiOx5xvX+MpVo=";
                var coincide = hashCalculado == hashEsperado;

                return Ok(new
                {
                    password = password,
                    hashCalculado = hashCalculado,
                    hashEsperado = hashEsperado,
                    coinciden = coincide,
                    mensaje = coincide ? "Hash correcto" : "Hash incorrecto"
                });
            }
            catch (Exception ex)
            {
                return BadRequest(new { error = ex.Message });
            }
        }

        // POST: api/Admin/verificar-clave-maestra
        [HttpPost("verificar-clave-maestra")]
        public async Task<ActionResult> VerificarClaveMaestra([FromBody] VerificarClaveMaestraRequest request)
        {
            try
            {
                Console.WriteLine("[CLAVE_MAESTRA] Verificando clave maestra...");

                string hashClaveRecibida = HashPassword(request.ClaveMaestra);
                if (hashClaveRecibida != LLAVE_MAESTRA_HASH)
                {
                    Console.WriteLine("[CLAVE_MAESTRA] Clave maestra incorrecta");
                    return BadRequest(new { message = "Clave maestra incorrecta" });
                }

                Console.WriteLine("[CLAVE_MAESTRA] Clave maestra correcta");
                return Ok(new { mensaje = "Dispositivo agregado como confiable" });
            }
            catch (Exception ex)
            {
                Console.WriteLine($"[CLAVE_MAESTRA] Excepción: {ex.Message}");
                return StatusCode(500, new { message = $"Error en el servidor: {ex.Message}" });
            }
        }

        // POST: api/Admin/crear
        [HttpPost("crear")]
        public async Task<ActionResult<Admin>> CrearAdmin([FromBody] CrearAdminRequest request)
        {
            try
            {
                Console.WriteLine($"[CREAR_ADMIN] Creando admin: {request.Username}");

                if (!AdminManager.EsPasswordValida(request.Password))
                {
                    string mensaje = AdminManager.ObtenerMensajeValidacionPassword(request.Password);
                    return BadRequest(new { message = $"Contraseña no válida: {mensaje}" });
                }

                var admin = await _adminManager.CrearAdmin(
                    request.Username,
                    request.Email,
                    request.Password,
                    request.NombreCompleto
                );

                if (admin != null)
                {
                    Console.WriteLine($"[CREAR_ADMIN] Admin creado exitosamente: {admin.Id}");
                    admin.PasswordHash = null;
                    return Ok(admin);
                }
                else
                {
                    Console.WriteLine($"[CREAR_ADMIN] Error creando admin: {_adminManager.Error}");
                    return BadRequest(new { message = _adminManager.Error });
                }
            }
            catch (Exception ex)
            {
                Console.WriteLine($"[CREAR_ADMIN] Excepción: {ex.Message}");
                return StatusCode(500, new { message = $"Error en el servidor: {ex.Message}" });
            }
        }

        // PUT: api/Admin/cambiar-password
        [HttpPut("cambiar-password")]
        public async Task<ActionResult> CambiarPassword([FromBody] CambiarPasswordRequest request)
        {
            try
            {
                if (!AdminManager.EsPasswordValida(request.NuevaPassword))
                {
                    string mensaje = AdminManager.ObtenerMensajeValidacionPassword(request.NuevaPassword);
                    return BadRequest(new { message = $"Nueva contraseña no válida: {mensaje}" });
                }

                var resultado = await _adminManager.CambiarPassword(request.AdminId, request.PasswordActual, request.NuevaPassword);
                if (resultado)
                {
                    return Ok(new { mensaje = "Contraseña cambiada correctamente" });
                }
                else
                {
                    return BadRequest(new { message = _adminManager.Error });
                }
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = $"Error en el servidor: {ex.Message}" });
            }
        }

        // PUT: api/Admin/5/estado
        [HttpPut("{id}/estado")]
        public async Task<ActionResult> CambiarEstado(int id, [FromBody] EstadoAdminRequest request)
        {
            try
            {
                var resultado = await _adminManager.CambiarEstadoAdmin(id, request.Activo);
                if (resultado)
                {
                    return Ok(new { mensaje = $"Estado del administrador cambiado a {(request.Activo ? "activo" : "inactivo")}" });
                }
                else
                {
                    return BadRequest(new { message = _adminManager.Error });
                }
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = $"Error en el servidor: {ex.Message}" });
            }
        }

        // GET: api/Admin
        [HttpGet]
        public new ActionResult<List<Admin>> Get()
        {
            try
            {
                var admins = _repositorio.ObtenerTodos();
                if (admins != null)
                {
                    foreach (var admin in admins)
                    {
                        admin.PasswordHash = null;
                    }
                    return Ok(admins);
                }
                else
                {
                    return BadRequest(new { message = _repositorio.Error });
                }
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = ex.Message });
            }
        }

        // GET: api/Admin/5
        [HttpGet("{id}")]
        public new ActionResult<Admin> Get(int id)
        {
            try
            {
                var admin = _repositorio.ObtenerPorId(id);
                if (admin != null)
                {
                    admin.PasswordHash = null;
                    return Ok(admin);
                }
                else
                {
                    return BadRequest(new { message = _repositorio.Error });
                }
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = ex.Message });
            }
        }

        // Método auxiliar para hashear
        private static string HashPassword(string password)
        {
            using (var sha256 = SHA256.Create())
            {
                var salt = "ConsultoriaIntegralSC_2024";
                var saltedPassword = password + salt;
                var hashedBytes = sha256.ComputeHash(Encoding.UTF8.GetBytes(saltedPassword));
                return Convert.ToBase64String(hashedBytes);
            }
        }
    }

    // Clases para las requests y responses
    public class LoginRequest
    {
        [Required]
        public string Username { get; set; } = "";

        [Required]
        public string Password { get; set; } = "";

        public string FingerprintDispositivo { get; set; } = "";
    }

    public class LoginResponse
    {
        public bool Success { get; set; }
        public string Message { get; set; } = "";
        public int AdminId { get; set; }
        public string Username { get; set; } = "";
        public string Email { get; set; } = "";
        public string NombreCompleto { get; set; } = "";
        public string Rol { get; set; } = "";
        public DateTime? UltimoLogin { get; set; }
        public bool RequiereClaveMaestra { get; set; } = false;
    }

    public class VerificarClaveMaestraRequest
    {
        [Required]
        public int AdminId { get; set; }

        [Required]
        public string ClaveMaestra { get; set; } = "";

        [Required]
        public string FingerprintDispositivo { get; set; } = "";

        public string NombreDispositivo { get; set; } = "";
    }

    public class CrearAdminRequest
    {
        [Required]
        public string Username { get; set; } = "";

        [Required]
        [EmailAddress]
        public string Email { get; set; } = "";

        [Required]
        public string Password { get; set; } = "";

        public string NombreCompleto { get; set; } = "";
    }

    public class CambiarPasswordRequest
    {
        [Required]
        public int AdminId { get; set; }

        [Required]
        public string PasswordActual { get; set; } = "";

        [Required]
        public string NuevaPassword { get; set; } = "";
    }

    public class EstadoAdminRequest
    {
        public bool Activo { get; set; }
    }

    public class TestHashRequest
    {
        [Required]
        public string Password { get; set; } = "";
    }
}