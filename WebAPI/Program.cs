using COMMON.Entidades;
using COMMON.Interfaces;
using COMMON.Validadores;
using DAL;
using FluentValidation;

namespace WebAPI
{
    public class Program
    {
        public static void Main(string[] args)
        {
            var builder = WebApplication.CreateBuilder(args);

            // DIAGNÓSTICO - Mostrar controladores encontrados
            var controllerTypes = typeof(Program).Assembly
                .GetTypes()
                .Where(t => t.Name.EndsWith("Controller"))
                .ToList();

            Console.WriteLine($"=== CONTROLADORES ENCONTRADOS: {controllerTypes.Count} ===");
            foreach (var controller in controllerTypes)
            {
                Console.WriteLine($"  - {controller.Name}");
            }
            Console.WriteLine("=====================================");

            builder.Services.AddControllers()
                .AddApplicationPart(typeof(Program).Assembly)
                .AddControllersAsServices();

            builder.Services.AddRazorComponents()
               .AddInteractiveServerComponents();

            // CONFIGURAR HttpClient para Blazor Server con BaseAddress
            builder.Services.AddScoped(sp =>
            {
                var httpClient = new HttpClient
                {
                    BaseAddress = new Uri("https://lomanconsultoria-web.onrender.com/"),
                    Timeout = TimeSpan.FromSeconds(30)
                };
                return httpClient;
            });

            builder.Services.AddRazorComponents()
                .AddInteractiveServerComponents(options =>
                {
                    options.DisconnectedCircuitMaxRetained = 100;
                    options.DisconnectedCircuitRetentionPeriod = TimeSpan.FromMinutes(3);
                });

            builder.Services.AddHttpClient();

            // Registrar la fábrica
            builder.Services.AddSingleton<FabricRepository>(_ => Parametros.FabricaRepository);

            // Registrar repositorios
            builder.Services.AddScoped<IDB<Admin>>(provider =>
            {
                var fabric = provider.GetRequiredService<FabricRepository>();
                return fabric.AdminRepository();
            });

            builder.Services.AddScoped<IDB<Empleo>>(provider =>
            {
                var fabric = provider.GetRequiredService<FabricRepository>();
                return fabric.EmpleoRepository();
            });

            builder.Services.AddScoped<IDB<Cita>>(provider =>
            {
                var fabric = provider.GetRequiredService<FabricRepository>();
                return fabric.CitaRepository();
            });

            builder.Services.AddScoped<IDB<Cotizacion>>(provider =>
            {
                var fabric = provider.GetRequiredService<FabricRepository>();
                return fabric.CotizacionRepository();
            });

            builder.Services.AddScoped<IDB<SolicitudCV>>(provider =>
            {
                var fabric = provider.GetRequiredService<FabricRepository>();
                return fabric.SolicitudCVRepository();
            });

            // Registrar validadores
            builder.Services.AddScoped<AbstractValidator<Cita>, CitaValidator>();
            builder.Services.AddScoped<AbstractValidator<Cotizacion>, CotizacionValidator>();
            builder.Services.AddScoped<AbstractValidator<SolicitudCV>, SolicitudCVValidator>();

            builder.Services.AddHttpContextAccessor();

            // ============================================
            // 🔧 CONFIGURAR CORS - SOLUCIÓN COMPLETA
            // ============================================
            builder.Services.AddCors(options =>
            {
                // Política permisiva para desarrollo y producción
                options.AddPolicy("AllowAll", policy =>
                {
                    policy.AllowAnyOrigin()
                          .AllowAnyMethod()
                          .AllowAnyHeader()
                          .WithExposedHeaders("*");
                });

                // Política específica para Blazor
                options.AddPolicy("AllowBlazorClient", policy =>
                {
                    policy.WithOrigins(
                            "http://localhost:5067",
                            "https://localhost:5067",
                            "http://localhost:5000",
                            "https://localhost:5001",
                            "https://lomanconsultoria-web.onrender.com",
                            "http://www.consultoriaintegralsc.somee.com",
                            "https://www.consultoriaintegralsc.somee.com",
                            "http://consultoriaintegralsc.somee.com",
                            "https://consultoriaintegralsc.somee.com"
                        )
                        .AllowAnyMethod()
                        .AllowAnyHeader()
                        .AllowCredentials()
                        .WithExposedHeaders("*");
                });
            });

            builder.Services.AddAuthorization();
            builder.Services.AddEndpointsApiExplorer();
            builder.Services.AddSwaggerGen();
            builder.Services.AddOpenApi();

            var app = builder.Build();

            // ============================================
            // ⚠️ ORDEN CRÍTICO DE MIDDLEWARES
            // ============================================

            // 1. CORS DEBE SER LO PRIMERO
            app.UseCors("AllowAll");

            // 2. Exception Handling
            if (app.Environment.IsDevelopment())
            {
                app.MapOpenApi();
                app.UseSwaggerUI();
                app.UseSwagger();
            }
            else
            {
                app.UseExceptionHandler("/Error", createScopeForErrors: true);
                app.UseHsts();
            }

            // 3. HTTPS Redirection
            app.UseHttpsRedirection();

            // 4. Static Files
            app.UseStaticFiles();

            // 5. Routing
            app.UseRouting();

            // 6. Authorization
            app.UseAuthorization();

            // 7. Antiforgery
            app.UseAntiforgery();

            // 8. Controllers
            app.MapControllers();


            // ============================================
            // 🧪 ENDPOINT DE PRUEBA CORS
            // ============================================
            app.MapGet("/api/test/ping", () => Results.Ok(new
            {
                message = "API funcionando",
                timestamp = DateTime.Now,
                version = "3.0-CORS-Fixed",
                corsEnabled = true
            }));

            app.MapGet("/api/test/cors", (HttpContext context) =>
            {
                var origin = context.Request.Headers["Origin"].ToString();
                return Results.Ok(new
                {
                    message = "CORS Test OK",
                    yourOrigin = origin,
                    allowedOrigins = new[]
                    {
                        "http://localhost:5067",
                        "http://consultoriaintegralsc.somee.com"
                    },
                    timestamp = DateTime.Now
                });
            });

            Console.WriteLine("===========================================");
            Console.WriteLine("✅ API Iniciada con CORS Habilitado");
            Console.WriteLine("✅ Política: AllowAll (todos los orígenes)");
            Console.WriteLine("✅ Métodos: GET, POST, PUT, DELETE, OPTIONS");
            Console.WriteLine("✅ Headers: Todos permitidos");
            Console.WriteLine("===========================================");
            Console.WriteLine($"🌐 Escuchando en: {string.Join(", ", builder.WebHost.GetSetting("urls")?.Split(';') ?? new[] { "http://localhost:5067" })}");
            Console.WriteLine("===========================================");

            app.Run();
        }
    }
}