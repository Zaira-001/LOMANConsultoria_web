using COMMON.Entidades;
using COMMON.Validadores;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace BIZ
{
    public class CotizacionManager : GenericManager<Cotizacion>
    {
        private readonly CotizacionEmailService _emailService;

        public CotizacionManager() : base(new CotizacionValidator())
        {
            _emailService = new CotizacionEmailService();
        }

        public override async Task<Cotizacion> Agregar(Cotizacion entidad)
        {
            try
            {
                Console.WriteLine("=== INICIANDO PROCESO DE COTIZACIÓN ===");

                // PASO 1: Asegurar campos de control
                entidad.UsuarioAlta = "WebClient";
                entidad.UsuarioMod = "WebClient";
                entidad.FechaAlta = DateTime.Now;
                entidad.FechaMod = DateTime.Now;

                // PASO 2: Establecer valores por defecto
                entidad.Estado = "Pendiente";
                if (string.IsNullOrWhiteSpace(entidad.Prioridad))
                {
                    entidad.Prioridad = "Media";
                }

                // PASO 3: Limpiar campos opcionales (evitar strings vacíos)
                if (string.IsNullOrWhiteSpace(entidad.NombreEmpresa))
                    entidad.NombreEmpresa = null;

                if (string.IsNullOrWhiteSpace(entidad.TamanoEmpresa))
                    entidad.TamanoEmpresa = null;

                if (string.IsNullOrWhiteSpace(entidad.NotasAdmin))
                    entidad.NotasAdmin = null;

                if (string.IsNullOrWhiteSpace(entidad.RespuestaAdmin))
                    entidad.RespuestaAdmin = null;

                if (string.IsNullOrWhiteSpace(entidad.NotasInternas))
                    entidad.NotasInternas = null;

                Console.WriteLine($"📝 Datos preparados:");
                Console.WriteLine($"   Nombre: {entidad.Nombre}");
                Console.WriteLine($"   Correo: {entidad.Correo}");
                Console.WriteLine($"   Teléfono: {entidad.Telefono}");
                Console.WriteLine($"   Empresa: {entidad.NombreEmpresa ?? "NULL"}");
                Console.WriteLine($"   TamañoEmpresa: {entidad.TamanoEmpresa ?? "NULL"}");
                Console.WriteLine($"   Estado: {entidad.Estado}");
                Console.WriteLine($"   Prioridad: {entidad.Prioridad}");

                // PASO 4: Llamar al método base
                var resultado = await base.Agregar(entidad);

                if (resultado == null)
                {
                    Console.WriteLine($"❌ Error en base.Agregar: {Error}");
                    return null;
                }

                Console.WriteLine($"✅ Cotización guardada con ID: {resultado.Id}");

                // PASO 5: Enviar email de confirmación (sin bloquear)
                _ = Task.Run(async () =>
                {
                    try
                    {
                        Console.WriteLine($"📧 Enviando email de confirmación a: {resultado.Correo}");
                        var emailEnviado = await _emailService.EnviarConfirmacionCotizacion(resultado);

                        if (emailEnviado)
                            Console.WriteLine("✅ Email de confirmación enviado");
                        else
                            Console.WriteLine("⚠️ Email de confirmación no pudo ser enviado");
                    }
                    catch (Exception ex)
                    {
                        Console.WriteLine($"❌ Error enviando email: {ex.Message}");
                    }
                });

                return resultado;
            }
            catch (Exception ex)
            {
                Error = ex.Message;
                Console.WriteLine($"🔥 Excepción en CotizacionManager.Agregar: {ex.Message}");
                Console.WriteLine($"🔥 Stack trace: {ex.StackTrace}");
                return null;
            }
        }

        public async Task<bool> EnviarCotizacionAlCliente(int cotizacionId, string respuesta, decimal? monto)
        {
            try
            {
                // Obtener la cotización
                var cotizacion = await ObtenerPorId(cotizacionId);
                if (cotizacion == null)
                {
                    Error = "Cotización no encontrada";
                    return false;
                }

                // Actualizar datos
                cotizacion.RespuestaAdmin = respuesta;
                cotizacion.MontoEstimado = monto;
                cotizacion.Estado = "Enviada";
                cotizacion.FechaCotizacion = DateTime.Now;
                cotizacion.UsuarioMod = "Admin";
                cotizacion.FechaMod = DateTime.Now;

                // Guardar cambios
                var actualizado = await Modificar(cotizacion);
                if (actualizado == null)
                {
                    return false;
                }

                // Enviar email
                var emailEnviado = await _emailService.EnviarCotizacionCliente(
                    actualizado,
                    respuesta,
                    monto);

                return emailEnviado;
            }
            catch (Exception ex)
            {
                Error = ex.Message;
                Console.WriteLine($"❌ Error en EnviarCotizacionAlCliente: {ex.Message}");
                return false;
            }
        }
    }
}