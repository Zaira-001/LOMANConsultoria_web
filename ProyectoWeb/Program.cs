using ProyectoWeb.Components;
using Radzen;

namespace ProyectoWeb
{
    public class Program
    {
        public static void Main(string[] args)
        {
            var builder = WebApplication.CreateBuilder(args);

            // Add services to the container.
            builder.Services.AddRazorComponents()
                .AddInteractiveServerComponents();

            // ✅ CONFIGURAR HttpClient CON BaseAddress para Blazor Server
            var apiBaseUrl = builder.Configuration["API_BASE_URL"]
                 ?? "https://lomanconsultoria-web.onrender.com/";

            builder.Services.AddScoped(sp => new HttpClient
            {
                BaseAddress = new Uri(apiBaseUrl),
                Timeout = TimeSpan.FromSeconds(30)
            });


            // ✅ También registrar IHttpClientFactory por si acaso
            builder.Services.AddHttpClient();

            builder.Services.AddRadzenComponents();

            var app = builder.Build();

            // Configure the HTTP request pipeline.
            if (!app.Environment.IsDevelopment())
            {
                app.UseExceptionHandler("/Error");
                app.UseHsts(); // ✅ Agregar HSTS para seguridad en producción
            }

            // ✅ Middleware para manejar peticiones HEAD (UptimeRobot)
            app.Use(async (context, next) =>
            {
                if (context.Request.Method == "HEAD")
                {
                    context.Response.StatusCode = 200;
                    return;
                }
                await next();
            });

            // ✅ Importante para archivos estáticos (CSS, JS, imágenes)
            app.UseStaticFiles();

            app.UseAntiforgery();

            app.MapStaticAssets();
            app.MapRazorComponents<App>()
                .AddInteractiveServerRenderMode();

            app.Run();
        }
    }
}