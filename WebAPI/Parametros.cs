using DAL;
using static DAL.FabricRepository;

namespace WebAPI
{
    public class Parametros
    {
        // 🔧 CONFIGURACIÓN AUTOMÁTICA: Lee de variables de entorno o usa local
        public static string CadenaConexion = ObtenerCadenaConexion();

        public static TipoBD TipoDB = DetectarTipoBD();

        public static FabricRepository FabricaRepository = new FabricRepository(CadenaConexion, TipoDB);

        /// <summary>
        /// Obtiene la cadena de conexión de forma automática
        /// 1. Primero intenta leer de variables de entorno (Render)
        /// 2. Si no existe, usa la conexión local por defecto
        /// </summary>
        private static string ObtenerCadenaConexion()
        {
            // 1️⃣ Intentar obtener de Render (DATABASE_URL)
            var databaseUrl = Environment.GetEnvironmentVariable("DATABASE_URL");
            if (!string.IsNullOrEmpty(databaseUrl))
            {
                Console.WriteLine("✅ Usando DATABASE_URL de Render");
                return databaseUrl;
            }

            // 2️⃣ Intentar obtener formato alternativo (ConnectionStrings__DefaultConnection)
            var connectionString = Environment.GetEnvironmentVariable("ConnectionStrings__DefaultConnection");
            if (!string.IsNullOrEmpty(connectionString))
            {
                Console.WriteLine("✅ Usando ConnectionStrings__DefaultConnection de Render");
                return connectionString;
            }

            // 3️⃣ Desarrollo LOCAL - PostgreSQL local
            Console.WriteLine("⚠️ Usando conexión LOCAL de desarrollo");
            return "Host=localhost;Database=consultoria;Username=postgres;Password=123456;Port=5432";

            // 🔴 OPCIÓN: Si quieres seguir usando SQL Server en local, usa:
            // return "Server=localhost;Database=Consultoria;Integrated Security=True;TrustServerCertificate=True";
        }

        /// <summary>
        /// Detecta automáticamente el tipo de base de datos según la cadena de conexión
        /// </summary>
        private static TipoBD DetectarTipoBD()
        {
            var connectionString = CadenaConexion.ToLower();

            if (connectionString.Contains("host=") ||
                connectionString.Contains("postgresql") ||
                connectionString.Contains("postgres://"))
            {
                Console.WriteLine("🐘 Tipo de BD detectado: PostgreSQL");
                return TipoBD.PostgreSQL;
            }

            if (connectionString.Contains("server=") ||
                connectionString.Contains("data source=") ||
                connectionString.Contains("sqlserver"))
            {
                Console.WriteLine("🔷 Tipo de BD detectado: SQL Server");
                return TipoBD.SQLServer;
            }

            // Por defecto PostgreSQL (para Render)
            Console.WriteLine("⚠️ No se pudo detectar, usando PostgreSQL por defecto");
            return TipoBD.PostgreSQL;
        }

        /// <summary>
        /// Muestra la configuración actual (para debugging)
        /// </summary>
        public static void MostrarConfiguracion()
        {
            Console.WriteLine("===========================================");
            Console.WriteLine("🔧 CONFIGURACIÓN DE BASE DE DATOS");
            Console.WriteLine("===========================================");
            Console.WriteLine($"Ambiente: {Environment.GetEnvironmentVariable("ASPNETCORE_ENVIRONMENT") ?? "Development"}");
            Console.WriteLine($"Tipo BD: {TipoDB}");
            Console.WriteLine($"Connection String: {OcultarPassword(CadenaConexion)}");
            Console.WriteLine("===========================================");
        }

        /// <summary>
        /// Oculta el password de la cadena de conexión para los logs
        /// </summary>
        private static string OcultarPassword(string connectionString)
        {
            if (string.IsNullOrEmpty(connectionString))
                return "NO CONFIGURADA";

            // PostgreSQL: postgresql://user:PASSWORD@host/db
            if (connectionString.StartsWith("postgresql://"))
            {
                var uri = new Uri(connectionString);
                return $"postgresql://{uri.UserInfo.Split(':')[0]}:****@{uri.Host}{uri.PathAndQuery}";
            }

            // Formato estándar: Password=xxx o pwd=xxx
            var parts = connectionString.Split(';');
            for (int i = 0; i < parts.Length; i++)
            {
                var lower = parts[i].ToLower();
                if (lower.Contains("password=") || lower.Contains("pwd="))
                {
                    var keyValue = parts[i].Split('=');
                    if (keyValue.Length == 2)
                        parts[i] = $"{keyValue[0]}=****";
                }
            }
            return string.Join(";", parts);
        }
    }
}
