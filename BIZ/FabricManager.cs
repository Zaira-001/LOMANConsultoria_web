using COMMON.Validadores;

namespace BIZ
{
    public static class FabricManager
    {
        public static EmpleoManager EmpleoManager => new EmpleoManager();
        public static CotizacionManager CotizacionManager => new CotizacionManager();
    }

}

