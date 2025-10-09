using DAL;
using static DAL.FabricRepository;

namespace WebAPI
{
    public class Parametros
    {
        public static string CadenaConexion = "workstation id=Consultoria.mssql.somee.com;packet size=4096;user id=LOMAN_SQLLogin_7;pwd=412hxvorib;data source=Consultoria.mssql.somee.com;persist security info=False;initial catalog=Consultoria;TrustServerCertificate=True";
        public static TipoBD TipoDB = TipoBD.SQLServer;
        public static FabricRepository FabricaRepository = new FabricRepository(CadenaConexion, TipoDB);

    }
}