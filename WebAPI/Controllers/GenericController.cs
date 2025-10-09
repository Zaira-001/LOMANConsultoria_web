using COMMON.Entidades;
using COMMON.Interfaces;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;

namespace WebAPI.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class GenericController<T> : ControllerBase where T : CamposControl
    {
        //CRUD
        //Create->Post
        //Read->Get
        //Update->Put
        //Delete->Delete

        protected IDB<T> _repositorio;

        public GenericController(IDB<T> repositorio)
        {
            _repositorio = repositorio;
        }

        [HttpGet]
        public virtual ActionResult<List<T>> Get()
        {
            try
            {
                var datos = _repositorio.ObtenerTodos();
                if (datos != null)
                {
                    return Ok(datos);
                }
                else
                {
                    return BadRequest(_repositorio.Error);
                }
            }
            catch (Exception ex)
            {
                return StatusCode(500, ex.Message);
            }
        }

        [HttpGet("{id:int}")]
        public virtual ActionResult<T> GetById(int id)
        {
            try
            {
                var datos = _repositorio.ObtenerPorId(id);
                if (datos != null)
                {
                    return Ok(datos);
                }
                else
                {
                    return NotFound($"No se encontró el elemento con ID {id}.");
                }
            }
            catch (Exception ex)
            {
                return StatusCode(500, $"Erro   r en el servidor: {ex.Message}");
            }
        }

        [HttpPost]
        public virtual ActionResult<T> Post(T entidad)
        {
            try
            {
                var datos = _repositorio.Insertar(entidad);
                if (datos != null)
                {
                    return Ok(datos);
                }
                else
                {
                    return BadRequest(_repositorio.Error);
                }
            }
            catch (Exception ex)
            {
                return StatusCode(500, ex.Message);
            }
        }


        [HttpPut]
        public virtual ActionResult<T> Put(T entidad)
        {
            try
            {
                var datos = _repositorio.Actualizar(entidad);
                if (datos != null)
                {
                    return Ok(datos);
                }
                else
                {
                    return BadRequest(_repositorio.Error);
                }
            }
            catch (Exception ex)
            {
                return StatusCode(500, ex.Message);
            }
        }

        [HttpDelete("{id:int}")]
        public virtual ActionResult Delete(int id)
        {
            try
            {
                var entidad = _repositorio.ObtenerPorId(id);
                if (entidad == null)
                {
                    return NotFound($"No se encontró el recurso con ID {id}.");
                }

                var resultado = _repositorio.Eliminar(entidad);
                if (resultado)
                {
                    return NoContent(); // 204
                }
                else
                {
                    return BadRequest($"No se pudo eliminar el recurso con ID {id}. Error: {_repositorio.Error}");
                }
            }
            catch (Exception ex)
            {
                return StatusCode(500, $"Error en el servidor: {ex.Message}");
            }
        }
    }
}