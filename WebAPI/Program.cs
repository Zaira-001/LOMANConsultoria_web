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
                    BaseAddress = new Uri("http://consultoriaintegralsc.somee.com/"),
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

            // Registrar validadores
            builder.Services.AddScoped<AbstractValidator<Cita>, CitaValidator>();
            builder.Services.AddScoped<AbstractValidator<Cotizacion>, CotizacionValidator>();

            builder.Services.AddHttpContextAccessor();

            // CONFIGURAR CORS
            builder.Services.AddCors(options =>
            {
                options.AddPolicy("AllowAll", policy =>
                {
                    policy.AllowAnyOrigin()
                          .AllowAnyMethod()
                          .AllowAnyHeader();
                });

                options.AddPolicy("AllowBlazorClient", policy =>
                {
                    policy.WithOrigins(
                            "http://localhost:5067",
                            "https://localhost:5067",
                            "http://localhost:5000",
                            "https://localhost:5001",
                            "http://www.consultoriaintegralsc.somee.com",
                            "https://www.consultoriaintegralsc.somee.com"
                        )
                        .AllowAnyMethod()
                        .AllowAnyHeader()
                        .AllowCredentials();
                });
            });

            builder.Services.AddAuthorization();
            builder.Services.AddEndpointsApiExplorer();
            builder.Services.AddSwaggerGen();
            builder.Services.AddOpenApi();

            var app = builder.Build();

            // ============================================
            // ORDEN CORRECTO DE MIDDLEWARES - CRÍTICO
            // ============================================

            // 1. CORS PRIMERO (ANTES que todo)
            app.UseCors("AllowAll");

            // 2. Manejo de errores
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

            // 3. HTTPS
            app.UseHttpsRedirection();

            // 4. Archivos estáticos
            app.UseStaticFiles();

            // 5. Routing
            app.UseRouting();

            // 6. Autenticación y Autorización
            app.UseAuthorization();

            // 7. Antiforgery ANTES de MapControllers
            app.UseAntiforgery();

            // 8. Middleware personalizado si existe
            if (typeof(Program).Assembly.GetTypes().Any(t => t.Name == "AuthMiddleware"))
            {
                app.UseAuthMiddleware();
            }

            // 9. Mapeo de controladores DESPUÉS de todos los middlewares
            app.MapControllers();

            // 10. ENDPOINT DE PRUEBA
            app.MapGet("/api/test/ping", () => Results.Ok(new
            {
                message = "API funcionando",
                timestamp = DateTime.Now,
                version = "2.0-Simplified",
                corsEnabled = true
            }));

            Console.WriteLine("===========================================");
            Console.WriteLine("API Simplificada - Sin Google Calendar");
            Console.WriteLine("Sistema de citas con gestión administrativa");
            Console.WriteLine("CORS HABILITADO - AllowAll");
            Console.WriteLine("===========================================");

            app.Run();
        }
    }
}