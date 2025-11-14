using DAL;
using System.Linq;
using System.Net;
using System.Net.Sockets;
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
        /// 2. Resuelve DNS a IPv4 si es necesario
        /// 3. Si no existe, usa la conexión local por defecto
        /// </summary>
        private static string ObtenerCadenaConexion()
        {
            // 1️⃣ Intentar obtener de Render (DATABASE_URL)
            var databaseUrl = Environment.GetEnvironmentVariable("DATABASE_URL");
            if (!string.IsNullOrEmpty(databaseUrl))
            {
                Console.WriteLine("✅ DATABASE_URL encontrada");

                // 🔧 FORZAR RESOLUCIÓN IPv4 para Supabase
                if (databaseUrl.Contains("db.qtgcgariprlgxgqhndck.supabase.co"))
                {
                    try
                    {
                        Console.WriteLine("🔍 Resolviendo DNS de Supabase a IPv4...");

                        var hostEntry = Dns.GetHostEntry("db.qtgcgariprlgxgqhndck.supabase.co");
                        var ipv4 = hostEntry.AddressList
                            .FirstOrDefault(ip => ip.AddressFamily == AddressFamily.InterNetwork);

                        if (ipv4 != null)
                        {
                            var ipv4String = ipv4.ToString();
                            databaseUrl = databaseUrl.Replace(
                                "db.qtgcgariprlgxgqhndck.supabase.co",
                                ipv4String
                            );
                            Console.WriteLine($"✅ DNS resuelto a IPv4: {ipv4String}");
                            Console.WriteLine($"✅ Nueva cadena: {OcultarPassword(databaseUrl)}");
                        }
                        else
                        {
                            Console.WriteLine("⚠️ No se encontró dirección IPv4, usando hostname original");
                        }
                    }
                    catch (Exception ex)
                    {
                        Console.WriteLine($"⚠️ Error resolviendo DNS (usando hostname): {ex.Message}");
                        // Continuar con el hostname original si falla
                    }
                }

                Console.WriteLine("✅ Usando DATABASE_URL procesada");
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
                try
                {
                    var uri = new Uri(connectionString);
                    return $"postgresql://{uri.UserInfo.Split(':')[0]}:****@{uri.Host}:{uri.Port}{uri.PathAndQuery}";
                }
                catch
                {
                    return "postgresql://****";
                }
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