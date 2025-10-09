using BIZ;
using COMMON.Entidades;
using COMMON.Interfaces;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;

namespace WebAPI.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class EmpleoController : GenericController<Empleo>
    {
        private readonly EmpleoManager _empleoManager;

        public EmpleoController(IDB<Empleo> repositorio) : base(repositorio)
        {
            _empleoManager = new EmpleoManager();
        }

        // GET: api/Empleo/activos
        [HttpGet("activos")]
        public async Task<ActionResult<List<Empleo>>> GetEmpleosActivos()
        {
            try
            {
                var empleos = await _empleoManager.ObtenerEmpleosActivos();
                if (empleos != null)
                {
                    return Ok(empleos);
                }
                else
                {
                    return BadRequest(_empleoManager.Error);
                }
            }
            catch (Exception ex)
            {
                return StatusCode(500, $"Error en el servidor: {ex.Message}");
            }
        }

        // PUT: api/Empleo/5/estado
        [HttpPut("{id}/estado")]
        public async Task<ActionResult> CambiarEstado(int id, [FromBody] EstadoRequest request)
        {
            try
            {
                var resultado = await _empleoManager.CambiarEstado(id, request.Activo);
                if (resultado)
                {
                    return Ok(new { mensaje = $"Estado del empleo {id} cambiado a {(request.Activo ? "activo" : "inactivo")}" });
                }
                else
                {
                    return BadRequest(_empleoManager.Error);
                }
            }
            catch (Exception ex)
            {
                return StatusCode(500, $"Error en el servidor: {ex.Message}");
            }
        }

        // GET: api/Empleo/nivel/senior
        [HttpGet("nivel/{nivel}")]
        public async Task<ActionResult<List<Empleo>>> GetPorNivel(string nivel)
        {
            try
            {
                var empleos = await _empleoManager.BuscarPorNivel(nivel);
                return Ok(empleos);
            }
            catch (Exception ex)
            {
                return StatusCode(500, $"Error en el servidor: {ex.Message}");
            }
        }

        // POST: api/Empleo (Override con auditoría y manejo robusto de errores)
        public override ActionResult<Empleo> Post([FromBody] Empleo entidad)
        {
            try
            {
                Console.WriteLine($"📝 Iniciando creación de empleo: '{entidad.Titulo}'");

                // PASO 6: Establecer campos de auditoría
                if (string.IsNullOrEmpty(entidad.UsuarioAlta))
                {
                    entidad.UsuarioAlta = "admin";
                }
                if (string.IsNullOrEmpty(entidad.UsuarioMod))
                {
                    entidad.UsuarioMod = "admin";
                }

                DateTime fechaActual = DateTime.Now;

                if (entidad.FechaAlta == DateTime.MinValue || entidad.FechaAlta == default(DateTime))
                {
                    entidad.FechaAlta = fechaActual;
                }

                if (entidad.FechaMod == DateTime.MinValue || entidad.FechaMod == default(DateTime))
                {
                    entidad.FechaMod = fechaActual;
                }

                Console.WriteLine($"✓ Campos de auditoría establecidos:");
                Console.WriteLine($"  - UsuarioAlta: '{entidad.UsuarioAlta}'");
                Console.WriteLine($"  - UsuarioMod: '{entidad.UsuarioMod}'");
                Console.WriteLine($"  - FechaAlta: {entidad.FechaAlta:yyyy-MM-dd HH:mm:ss}");
                Console.WriteLine($"  - FechaMod: {entidad.FechaMod:yyyy-MM-dd HH:mm:ss}");

                // PASO 7: Mostrar objeto final antes de insertar
                Console.WriteLine("=== OBJETO FINAL PARA INSERTAR ===");
                Console.WriteLine($"ID: {entidad.Id}");
                Console.WriteLine($"Título: '{entidad.Titulo}'");
                Console.WriteLine($"Icono: '{entidad.Icono}'");
                Console.WriteLine($"Nivel: '{entidad.Nivel}'");
                Console.WriteLine($"Área: '{entidad.Area}'");
                Console.WriteLine($"Modalidad: '{entidad.Modalidad}'");
                Console.WriteLine($"Salario: '{entidad.Salario}'");
                Console.WriteLine($"Descripción: '{entidad.Descripcion}'");
                Console.WriteLine($"Requisitos: '{entidad.Requisitos}'");
                Console.WriteLine($"Activo: {entidad.Activo}");
                Console.WriteLine($"UsuarioAlta: '{entidad.UsuarioAlta}'");
                Console.WriteLine($"UsuarioMod: '{entidad.UsuarioMod}'");
                Console.WriteLine($"FechaAlta: {entidad.FechaAlta:yyyy-MM-dd HH:mm:ss}");
                Console.WriteLine($"FechaMod: {entidad.FechaMod:yyyy-MM-dd HH:mm:ss}");

                // PASO 8: Intentar insertar con manejo mejorado de errores
                Console.WriteLine("📝 Llamando a repositorio.Insertar...");
                try
                {
                    var resultado = _repositorio.Insertar(entidad);

                    if (resultado != null)
                    {
                        Console.WriteLine($"✅ Repositorio devolvió resultado exitoso:");
                        Console.WriteLine($"  - ID asignado: {resultado.Id}");
                        Console.WriteLine($"  - Título: '{resultado.Titulo}'");
                    }
                    else
                    {
                        Console.WriteLine("❌ Repositorio devolvió NULL");
                        Console.WriteLine($"❌ Error del repositorio: '{_repositorio.Error ?? "Sin mensaje de error"}'");

                        try
                        {
                            var ultimoRegistro = _repositorio.ObtenerTodos()?.LastOrDefault();
                            if (ultimoRegistro != null && ultimoRegistro.Titulo == entidad.Titulo)
                            {
                                Console.WriteLine("⚠️ INCONSISTENCIA: El registro parece haberse insertado pero el repositorio devolvió null");
                                return Ok(new
                                {
                                    success = true,
                                    data = ultimoRegistro,
                                    mensaje = "Empleo creado exitosamente (recuperado de BD)",
                                    advertencia = "El repositorio devolvió null pero el registro se insertó correctamente"
                                });
                            }
                        }
                        catch (Exception checkEx)
                        {
                            Console.WriteLine($"⚠️ Error verificando inserción: {checkEx.Message}");
                        }
                    }

                    // PASO 9: Verificar resultado
                    if (resultado != null)
                    {
                        Console.WriteLine($"✅ ÉXITO: Empleo creado con ID {resultado.Id}");
                        Console.WriteLine("=== FIN POST EMPLEO (ÉXITO) ===");

                        return Ok(new
                        {
                            success = true,
                            data = resultado,
                            mensaje = "Empleo creado exitosamente"
                        });
                    }
                    else
                    {
                        string errorDetalle = _repositorio.Error ?? "Error desconocido del repositorio";
                        Console.WriteLine($"❌ ERROR DEL REPOSITORIO: {errorDetalle}");
                        Console.WriteLine("=== FIN POST EMPLEO (ERROR REPOSITORIO) ===");

                        return BadRequest(new
                        {
                            error = "Error creando el empleo en la base de datos",
                            detalle = errorDetalle,
                            codigo = "ERROR_REPOSITORIO"
                        });
                    }
                }
                catch (Exception repoEx)
                {
                    Console.WriteLine($"🔥 EXCEPCIÓN EN REPOSITORIO: {repoEx.Message}");
                    Console.WriteLine($"🔥 Stack trace repositorio: {repoEx.StackTrace}");

                    return StatusCode(500, new
                    {
                        error = "Excepción en el repositorio",
                        detalle = repoEx.Message,
                        codigo = "ERROR_REPOSITORIO_EXCEPCION"
                    });
                }
            }
            catch (Exception ex)
            {
                Console.WriteLine($"🔥 Excepción inesperada: {ex.Message}");
                return StatusCode(500, new
                {
                    error = "Excepción general en el controlador",
                    detalle = ex.Message,
                    codigo = "ERROR_GENERAL"
                });
            }
        }
    }

    // Clase auxiliar para cambio de estado
    public class EstadoRequest
    {
        public bool Activo { get; set; }
    }
}