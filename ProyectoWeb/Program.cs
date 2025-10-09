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
            builder.Services.AddScoped(sp => new HttpClient
            {
                BaseAddress = new Uri("http://consultoriaintegralsc.somee.com/"),
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
            }

            app.UseAntiforgery();

            app.MapStaticAssets();
            app.MapRazorComponents<App>()
                .AddInteractiveServerRenderMode();

            app.Run();
        }
    }
}