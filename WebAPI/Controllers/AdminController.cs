using BIZ;
using COMMON.Entidades;
using COMMON.Interfaces;
using Microsoft.AspNetCore.Cors;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Identity.Data;
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
        private readonly IHttpContextAccessor _httpContextAccessor;

        public AdminController(IDB<Admin> repositorio, IHttpContextAccessor httpContextAccessor) : base(repositorio)
        {
            _adminManager = new AdminManager(repositorio);
            _httpContextAccessor = httpContextAccessor;
        }

        // GET: api/Admin
        [HttpGet]
        public override ActionResult<List<Admin>> Get()
        {
            try
            {
                Console.WriteLine("[GET] Obteniendo lista de administradores...");

                var admins = _repositorio.ObtenerTodos();

                if (admins != null)
                {
                    // Limpiar passwords antes de enviar
                    foreach (var admin in admins)
                    {
                        admin.PasswordHash = null;
                    }

                    Console.WriteLine($"[GET] ✅ Retornando {admins.Count} administradores");
                    return Ok(admins);
                }
                else
                {
                    Console.WriteLine($"[GET] ❌ Error: {_repositorio.Error}");
                    return BadRequest(new
                    {
                        message = _repositorio.Error ?? "Error desconocido",
                        codigo = "ERROR_OBTENIENDO_ADMINS"
                    });
                }
            }
            catch (Exception ex)
            {
                Console.WriteLine($"[GET] ❌ Excepción: {ex.Message}");
                return StatusCode(500, new
                {
                    message = ex.Message,
                    codigo = "ERROR_SERVIDOR"
                });
            }
        }

        // POST: api/Admin/login
        [HttpPost("login")]
        public async Task<ActionResult<LoginResponse>> Login([FromBody] LoginRequest request)
        {
            try
            {
                Console.WriteLine($"[LOGIN] Intento de login para usuario: {request.Username}");

                if (string.IsNullOrEmpty(request.Username) || string.IsNullOrEmpty(request.Password))
                {
                    return BadRequest(new LoginResponse
                    {
                        Success = false,
                        Message = "Usuario y contraseña son requeridos"
                    });
                }

                var admin = await _adminManager.Login(request.Username, request.Password);

                if (admin != null)
                {
                    Console.WriteLine($"[LOGIN] ✅ Login exitoso para admin ID: {admin.Id}");

                    return Ok(new LoginResponse
                    {
                        Success = true,
                        Message = "Login exitoso",
                        AdminId = admin.Id,
                        Username = admin.Username,
                        Email = admin.Email,
                        NombreCompleto = admin.NombreCompleto,
                        Rol = admin.Rol,
                        UltimoLogin = admin.UltimoLogin,
                        EsAdminPrincipal = admin.EsAdminPrincipal
                    });
                }
                else
                {
                    Console.WriteLine($"[LOGIN] ❌ Login fallido: {_adminManager.Error}");
                    return BadRequest(new LoginResponse
                    {
                        Success = false,
                        Message = _adminManager.Error ?? "Credenciales incorrectas"
                    });
                }
            }
            catch (Exception ex)
            {
                Console.WriteLine($"[LOGIN] ❌ Excepción: {ex.Message}");
                return StatusCode(500, new LoginResponse
                {
                    Success = false,
                    Message = $"Error interno: {ex.Message}"
                });
            }
        }

        // POST: api/Admin/crear
        [HttpPost("crear")]
        public async Task<ActionResult<Admin>> CrearAdmin([FromBody] CrearAdminRequest request)
        {
            try
            {
                Console.WriteLine($"[CREAR_ADMIN] Username: {request.Username}, Email: {request.Email}");

                // Validaciones...
                if (string.IsNullOrWhiteSpace(request.Username))
                    return BadRequest(new { message = "El nombre de usuario es requerido" });

                if (string.IsNullOrWhiteSpace(request.Email))
                    return BadRequest(new { message = "El email es requerido" });

                if (string.IsNullOrWhiteSpace(request.Password))
                    return BadRequest(new { message = "La contraseña es requerida" });

                // Crear admin
                var admin = await _adminManager.CrearAdmin(
                    request.Username,
                    request.Email,
                    request.Password,
                    request.NombreCompleto
                );

                if (admin != null)
                {
                    Console.WriteLine($"[CREAR_ADMIN] ✅ Admin creado con ID: {admin.Id}");

                    string baseUrl = ObtenerUrlBase();
                    Console.WriteLine($"[CREAR_ADMIN] 🌐 URL Base detectada: {baseUrl}");

                    try
                    {
                        var emailService = new AdminEmailService();
                        var datosCredenciales = new DatosCredencialesAdmin
                        {
                            Username = admin.Username,
                            Email = admin.Email,
                            PasswordTemporal = request.Password,
                            NombreCompleto = admin.NombreCompleto,
                            RolDescripcion = admin.EsAdminPrincipal
                                ? "Administrador Principal - Acceso Total"
                                : "Administrador - Gestión de Contenido",
                            EsAdminPrincipal = admin.EsAdminPrincipal
                        };

                        var emailEnviado = await emailService.EnviarCredencialesNuevoAdmin(
                            datosCredenciales,
                            baseUrl);

                        if (emailEnviado)
                        {
                            Console.WriteLine($"[CREAR_ADMIN] ✅ Email enviado a: {admin.Email}");
                        }
                        else
                        {
                            Console.WriteLine($"[CREAR_ADMIN] ⚠️ No se pudo enviar el email");
                        }
                    }
                    catch (Exception emailEx)
                    {
                        Console.WriteLine($"[CREAR_ADMIN] ⚠️ Error enviando email: {emailEx.Message}");
                    }

                    admin.PasswordHash = null;
                    return Ok(new
                    {
                        message = "Administrador creado exitosamente",
                        emailEnviado = true,
                        data = admin
                    });
                }
                else
                {
                    return BadRequest(new { message = _adminManager.Error });
                }
            }
            catch (Exception ex)
            {
                Console.WriteLine($"[CREAR_ADMIN] ❌ Excepción: {ex.Message}");
                return StatusCode(500, new { message = ex.Message });
            }
        }

        private string ObtenerUrlBase()
        {
            try
            {
                var request = _httpContextAccessor.HttpContext?.Request;

                if (request == null)
                {
                    Console.WriteLine("⚠️ HttpContext no disponible, usando fallback");
                    return "http://localhost:5067";
                }

                var scheme = request.Scheme;
                var host = request.Host.Host;
                var port = request.Host.Port;

                string baseUrl;

                if ((scheme == "http" && port == 80) || (scheme == "https" && port == 443) || !port.HasValue)
                {
                    baseUrl = $"{scheme}://{host}";
                }
                else
                {
                    baseUrl = $"{scheme}://{host}:{port}";
                }

                Console.WriteLine($"✅ URL Base construida: {baseUrl}");
                return baseUrl;
            }
            catch (Exception ex)
            {
                Console.WriteLine($"❌ Error obteniendo URL base: {ex.Message}");
                return "http://localhost:5067";
            }
        }

        [HttpGet("test-url-base")]
        public ActionResult TestUrlBase()
        {
            var baseUrl = ObtenerUrlBase();
            var request = _httpContextAccessor.HttpContext?.Request;

            return Ok(new
            {
                urlBase = baseUrl,
                urlLogin = $"{baseUrl}/login",
                urlAdmin = $"{baseUrl}/admin",
                detalles = new
                {
                    scheme = request?.Scheme,
                    host = request?.Host.Host,
                    port = request?.Host.Port,
                    path = request?.Path.Value,
                    fullUrl = $"{request?.Scheme}://{request?.Host}{request?.Path}"
                }
            });
        }

        // GET: api/Admin/{id}
        [HttpGet("{id}")]
        public override ActionResult<Admin> GetById(int id)
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
                    return NotFound(new { message = "Administrador no encontrado" });
                }
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = ex.Message });
            }
        }

        [HttpPut("{id}")]
        public ActionResult<Admin> Put(int id, [FromBody] Admin entidad)
        {
            try
            {
                if (entidad == null)
                    return BadRequest(new { message = "Entidad nula" });

                var adminActual = _repositorio.ObtenerPorId(id);
                if (adminActual == null)
                    return BadRequest(new { message = "Admin no existe" });

                if (string.IsNullOrWhiteSpace(entidad.PasswordHash))
                {
                    entidad.PasswordHash = adminActual.PasswordHash;
                }

                entidad.Id = id;
                var datos = _repositorio.Actualizar(entidad);

                if (datos != null)
                {
                    datos.PasswordHash = null;
                    return Ok(datos);
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

        [HttpPut("{id}/datos")]
        public async Task<ActionResult<Admin>> ActualizarDatos(int id, [FromBody] ActualizarDatosAdminRequest request)
        {
            try
            {
                Console.WriteLine($"[ACTUALIZAR_DATOS] Actualizando admin ID: {id}");
                Console.WriteLine($"[ACTUALIZAR_DATOS] Username: {request.Username}");
                Console.WriteLine($"[ACTUALIZAR_DATOS] Email: {request.Email}");

                // ✅ SOLUCIÓN SIMPLE: Buscar en la lista completa en lugar de usar ObtenerPorId
                var todosLosAdmins = _repositorio.ObtenerTodos();

                if (todosLosAdmins == null || !todosLosAdmins.Any())
                {
                    Console.WriteLine($"[ACTUALIZAR_DATOS] ❌ No hay admins en la base de datos");
                    return BadRequest(new { message = "No se pudo acceder a la base de datos de administradores" });
                }

                Console.WriteLine($"[ACTUALIZAR_DATOS] Total admins en DB: {todosLosAdmins.Count}");
                foreach (var a in todosLosAdmins)
                {
                    Console.WriteLine($"[ACTUALIZAR_DATOS]   - Admin: ID={a.Id}, Username={a.Username}");
                }

                var adminActual = todosLosAdmins.FirstOrDefault(a => a.Id == id);

                if (adminActual == null)
                {
                    Console.WriteLine($"[ACTUALIZAR_DATOS] ❌ Admin {id} no encontrado");
                    return BadRequest(new
                    {
                        message = $"Admin con ID {id} no encontrado en la base de datos",
                        idBuscado = id,
                        idsDisponibles = todosLosAdmins.Select(a => a.Id).ToList()
                    });
                }

                Console.WriteLine($"[ACTUALIZAR_DATOS] ✅ Admin encontrado: {adminActual.Username}");

                // Actualizar solo los campos permitidos
                adminActual.Username = request.Username;
                adminActual.Email = request.Email;
                adminActual.NombreCompleto = request.NombreCompleto;
                adminActual.Activo = request.Activo;
                adminActual.FechaMod = DateTime.Now;
                adminActual.UsuarioMod = request.UsuarioMod ?? "admin";

                Console.WriteLine($"[ACTUALIZAR_DATOS] Llamando a _repositorio.Actualizar...");
                var datos = _repositorio.Actualizar(adminActual);

                if (datos != null)
                {
                    Console.WriteLine($"[ACTUALIZAR_DATOS] ✅ Admin actualizado exitosamente");
                    datos.PasswordHash = null;
                    return Ok(datos);
                }
                else
                {
                    Console.WriteLine($"[ACTUALIZAR_DATOS] ❌ Error actualizando: {_repositorio.Error}");
                    return BadRequest(new { message = _repositorio.Error ?? "Error desconocido al actualizar" });
                }
            }
            catch (Exception ex)
            {
                Console.WriteLine($"[ACTUALIZAR_DATOS] ❌ Excepción: {ex.Message}");
                Console.WriteLine($"[ACTUALIZAR_DATOS] Stack: {ex.StackTrace}");
                return StatusCode(500, new { message = ex.Message });
            }
        }

        // PUT: api/Admin/{id}/estado
        [HttpPut("{id}/estado")]
        public async Task<ActionResult> CambiarEstado(int id, [FromBody] EstadoAdminRequest request)
        {
            try
            {
                Console.WriteLine($"[CAMBIAR_ESTADO] ID: {id}, Nuevo estado: {request.Activo}");

                var resultado = await _adminManager.CambiarEstadoAdmin(id, request.Activo);
                if (resultado)
                {
                    return Ok(new { mensaje = $"Estado cambiado a {(request.Activo ? "activo" : "inactivo")}" });
                }
                else
                {
                    return BadRequest(new { message = _adminManager.Error });
                }
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = ex.Message });
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

                var resultado = await _adminManager.CambiarPassword(
                    request.AdminId,
                    request.PasswordActual,
                    request.NuevaPassword
                );

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
                return StatusCode(500, new { message = ex.Message });
            }
        }

        // PUT: api/Admin/{id}/reset-password
        [HttpPut("{id}/reset-password")]
        public async Task<ActionResult> ResetPasswordAdmin(int id, [FromBody] ResetPasswordRequest request)
        {
            try
            {
                Console.WriteLine($"[RESET_PASSWORD] Admin ID: {id}");

                if (!AdminManager.EsPasswordValida(request.NuevaPassword))
                {
                    string mensaje = AdminManager.ObtenerMensajeValidacionPassword(request.NuevaPassword);
                    return BadRequest(new { message = $"Nueva contraseña no válida: {mensaje}" });
                }

                // ✅ Buscar en la lista completa
                var todosLosAdmins = _repositorio.ObtenerTodos();

                if (todosLosAdmins == null || !todosLosAdmins.Any())
                {
                    Console.WriteLine($"[RESET_PASSWORD] ❌ No hay admins en la base de datos");
                    return BadRequest(new { message = "No se pudo acceder a la base de datos" });
                }

                var adminActual = todosLosAdmins.FirstOrDefault(a => a.Id == id);

                if (adminActual == null)
                {
                    Console.WriteLine($"[RESET_PASSWORD] ❌ Admin {id} no encontrado");
                    return NotFound(new { message = "Administrador no encontrado" });
                }

                adminActual.PasswordHash = AdminManager.HashPassword(request.NuevaPassword);
                adminActual.FechaMod = DateTime.Now;
                adminActual.UsuarioMod = request.UsuarioMod ?? "admin";

                var resultado = _repositorio.Actualizar(adminActual);

                if (resultado != null)
                {
                    Console.WriteLine($"[RESET_PASSWORD] ✅ Contraseña actualizada para admin ID: {id}");
                    return Ok(new { mensaje = "Contraseña actualizada correctamente" });
                }
                else
                {
                    return BadRequest(new { message = _repositorio.Error });
                }
            }
            catch (Exception ex)
            {
                Console.WriteLine($"[RESET_PASSWORD] ❌ Error: {ex.Message}");
                return StatusCode(500, new { message = ex.Message });
            }
        }


        // GET: api/Admin/test-db
        [HttpGet("test-db")]
        public async Task<ActionResult> TestDatabase()
        {
            try
            {
                var admins = await _adminManager.ObtenerTodos();

                if (admins == null)
                {
                    return Ok(new
                    {
                        funciona = false,
                        count = 0,
                        error = _adminManager.Error ?? "Error desconocido"
                    });
                }

                return Ok(new
                {
                    funciona = true,
                    count = admins.Count,
                    usuarios = admins.Select(a => new {
                        a.Id,
                        a.Username,
                        a.Email,
                        a.Activo,
                        a.Rol
                    }).ToList()
                });
            }
            catch (Exception ex)
            {
                return Ok(new
                {
                    funciona = false,
                    error = ex.Message
                });
            }
        }
    }

    // DTOs
    public class LoginRequest
    {
        [Required]
        public string Username { get; set; } = "";

        [Required]
        public string Password { get; set; } = "";
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
        public bool EsAdminPrincipal { get; set; }
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

    public class ActualizarDatosAdminRequest
    {
        public string Username { get; set; }
        public string Email { get; set; }
        public string NombreCompleto { get; set; }
        public bool Activo { get; set; }
        public string UsuarioMod { get; set; }
    }

    public class ResetPasswordRequest
    {
        [Required]
        public string NuevaPassword { get; set; } = "";

        public string UsuarioMod { get; set; } = "";
    }
}