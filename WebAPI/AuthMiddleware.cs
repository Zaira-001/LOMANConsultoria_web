using Newtonsoft.Json;
using System.Text;

namespace WebAPI
{
    public class AuthMiddleware
    {
        private readonly RequestDelegate _next;
        private readonly ILogger<AuthMiddleware> _logger;

        public AuthMiddleware(RequestDelegate next, ILogger<AuthMiddleware> logger)
        {
            _next = next;
            _logger = logger;
        }

        public async Task InvokeAsync(HttpContext context)
        {
            var path = context.Request.Path.Value?.ToLower();

            // Rutas que requieren autenticación
            var protectedRoutes = new[] {
                "/admin",
                "/admin/citas"
            };

            // Rutas que NO necesitan verificación
            var excludedPaths = new[] {
                "/",
                "/login",
                "/api",
                "/_framework",
                "/css",
                "/js",
                "/_blazor",
                "/favicon.ico",
                "/_content",
                "/swagger",
                "/openapi",
                "/counter",
                "/weather",
                "/error"
            };

            // Verificar si es una ruta protegida
            bool isProtectedRoute = protectedRoutes.Any(route => path?.StartsWith(route) == true);
            bool isExcludedPath = excludedPaths.Any(excluded => path?.StartsWith(excluded) == true);

            if (isProtectedRoute && !isExcludedPath)
            {
                _logger.LogInformation($"[AUTH] 🔒 Verificando acceso a ruta protegida: {path}");

                var isAuthenticated = await IsAuthenticatedAsync(context);

                if (!isAuthenticated)
                {
                    _logger.LogWarning($"[AUTH] ❌ Acceso no autorizado a: {path}");

                    // Para peticiones AJAX/API, devolver 401
                    if (IsAjaxRequest(context) || path?.StartsWith("/api") == true)
                    {
                        context.Response.StatusCode = 401;
                        context.Response.ContentType = "application/json";
                        await context.Response.WriteAsync(JsonConvert.SerializeObject(new
                        {
                            error = "No autorizado",
                            message = "Sesión expirada. Por favor inicia sesión nuevamente.",
                            redirectTo = "/login"
                        }));
                        return;
                    }

                    // Para navegación normal, redirigir
                    _logger.LogInformation($"[AUTH] 🔄 Redirigiendo a /login");
                    context.Response.Redirect("/login");
                    return;
                }

                _logger.LogInformation($"[AUTH] ✅ Acceso autorizado a: {path}");
            }

            await _next(context);
        }

        private async Task<bool> IsAuthenticatedAsync(HttpContext context)
        {
            try
            {
                // Primera verificación de cookie
                if (context.Request.Cookies.TryGetValue("adminSession", out string sessionCookie))
                {
                    var isValid = ValidateSessionCookie(sessionCookie);
                    if (isValid)
                    {
                        _logger.LogInformation("[AUTH] ✅ Cookie válida en primera verificación");
                        return true;
                    }
                }

                // Segunda oportunidad: Si viene del admin, esperar un poco
                var referer = context.Request.Headers["Referer"].ToString();
                if (referer.Contains("/admin") && !referer.Contains("/login"))
                {
                    _logger.LogInformation("[AUTH] ⏳ Petición desde /admin, esperando sincronización...");
                    await Task.Delay(500);

                    // Verificar de nuevo
                    if (context.Request.Cookies.TryGetValue("adminSession", out string retryCookie))
                    {
                        var isValid = ValidateSessionCookie(retryCookie);
                        if (isValid)
                        {
                            _logger.LogInformation("[AUTH] ✅ Cookie válida en segunda verificación");
                            return true;
                        }
                    }
                }

                _logger.LogInformation("[AUTH] ❌ No autenticado después de todas las verificaciones");
                return false;
            }
            catch (Exception ex)
            {
                _logger.LogError($"[AUTH] Error: {ex.Message}");
                return false;
            }
        }

        private bool ValidateSessionCookie(string sessionCookie)
        {
            if (string.IsNullOrEmpty(sessionCookie))
                return false;

            try
            {
                var sessionJson = Encoding.UTF8.GetString(Convert.FromBase64String(sessionCookie));
                var session = JsonConvert.DeserializeObject<SessionData>(sessionJson);

                if (session == null)
                    return false;

                var expiresAt = DateTimeOffset.FromUnixTimeMilliseconds(session.ExpiresAt);
                return expiresAt > DateTimeOffset.UtcNow;
            }
            catch
            {
                return false;
            }
        }

        private void CleanupSession(HttpContext context)
        {
            try
            {
                context.Response.Cookies.Delete("adminSession", new CookieOptions
                {
                    Path = "/",
                    HttpOnly = true,
                    Secure = true,
                    SameSite = SameSiteMode.Strict
                });
                _logger.LogInformation("[AUTH] 🧹 Sesión limpiada");
            }
            catch (Exception ex)
            {
                _logger.LogError($"[AUTH] Error limpiando sesión: {ex.Message}");
            }
        }

        private bool IsAjaxRequest(HttpContext context)
        {
            return context.Request.Headers["X-Requested-With"] == "XMLHttpRequest" ||
                   context.Request.Headers["Content-Type"].ToString().Contains("application/json") ||
                   context.Request.Headers["Accept"].ToString().Contains("application/json");
        }

        // Clase auxiliar para deserializar la sesión
        private class SessionData
        {
            public int AdminId { get; set; }
            public string Username { get; set; } = "";
            public string Email { get; set; } = "";
            public long ExpiresAt { get; set; }
        }
    }

    public static class AuthMiddlewareExtensions
    {
        public static IApplicationBuilder UseAuthMiddleware(this IApplicationBuilder builder)
        {
            return builder.UseMiddleware<AuthMiddleware>();
        }
    }
}