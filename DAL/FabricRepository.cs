using COMMON.Entidades;
using COMMON.Interfaces;
using COMMON.Validadores;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace DAL
{
    public class FabricRepository
    {
        private string _cadenaConexion;
        private TipoBD _tipo;

        public FabricRepository(string cadenaConexion, TipoBD tipo)
        {
            _cadenaConexion = cadenaConexion;
            _tipo = tipo;
        }
       
        public IDB<Admin> AdminRepository()
        {
            switch (_tipo)
            {
                case TipoBD.SQLServer:

                    return new DBSqlServer<Admin>(_cadenaConexion, new AdminValidator(), "Id", true);
                    break;
                default:
                    return null;
                    break;
            }
        }
        public IDB<DispositivoConfiable> DispositivoConfiableRepository()
        {
            switch (_tipo)
            {
                case TipoBD.SQLServer:

                    return new DBSqlServer<DispositivoConfiable>(_cadenaConexion, new DispositivoConfiableValidator(), "Id", true);
                    break;
                default:
                    return null;
                    break;
            }
        }
       
       
        public IDB<EstudiantesResidencias> EstudiantesResidenciasRepository()
        {
            switch (_tipo)
            {
                case TipoBD.SQLServer:
                    return new DBSqlServer<EstudiantesResidencias>(_cadenaConexion, new EstudiantesResidenciasValidator(), "EstuadianteID", true);
                    break;
                default:
                    return null;
                    break;
            }
        }
       

        public IDB<Cita> CitaRepository()
        {
            switch (_tipo)
            {
                case TipoBD.SQLServer:
                    return new DBSqlServer<Cita>(_cadenaConexion, new CitaValidator(), "Id", true);
                default:
                    return null;
                    break;
            }
        }
        public IDB<Empleo> EmpleoRepository()
        {
            switch (_tipo)
            {
                case TipoBD.SQLServer:
                    return new DBSqlServer<Empleo>(_cadenaConexion, new EmpleoValidator(), "Id", true);
                default:
                    return null;
                    break;
            }
        }
        public IDB<Cotizacion> CotizacionRepository()
        {
            switch (_tipo)
            {
                case TipoBD.SQLServer:
                    return new DBSqlServer<Cotizacion>(_cadenaConexion, new CotizacionValidator(), "Id", true);
                default:
                    return null;
                    break;
            }
        }

        public enum TipoBD
        {
            SQLServer,
            MySql,
            Oracle

        }
    }
}
