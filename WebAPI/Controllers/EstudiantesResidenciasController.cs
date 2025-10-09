using COMMON.Entidades;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;

namespace WebAPI.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class EstudiantesResidenciasController : GenericController<EstudiantesResidencias>
    {
        public EstudiantesResidenciasController() : base(Parametros.FabricaRepository.EstudiantesResidenciasRepository())
        {
        }
    }
}
