// diagnostic.js - Script para diagnosticar el problema
console.log('Diagnostic script loaded');

// Función de debugging disponible globalmente
window.debugSession = function () {
    console.log('\n=== DEBUG SESSION ===');

    // 1. URL y routing
    console.log('URL actual:', window.location.href);
    console.log('Pathname:', window.location.pathname);
    console.log('Hash:', window.location.hash);
    console.log('Search:', window.location.search);

    // 2. Estado de sesión
    console.log('\nESTADO DE SESIÓN:');
    const stored = localStorage.getItem('adminSession');
    if (stored) {
        try {
            const session = JSON.parse(stored);
            console.log('LocalStorage session:', {
                username: session.username,
                expiresAt: new Date(session.expiresAt),
                isValid: session.expiresAt > Date.now()
            });
        } catch (e) {
            console.error('Error parsing localStorage:', e);
        }
    } else {
        console.log('No hay sesión en localStorage');
    }

    // 3. Cookies
    console.log('\nCOOKIES:');
    const cookies = document.cookie.split(';');
    const sessionCookie = cookies.find(c => c.trim().startsWith('adminSession='));
    if (sessionCookie) {
        console.log('Cookie encontrada:', sessionCookie.substring(0, 50) + '...');
    } else {
        console.log('No hay cookie de sesión');
    }

    // 4. Estado de Blazor
    console.log('\nBLAZOR INFO:');
    console.log('¿Blazor activo?', typeof Blazor !== 'undefined' ? 'Sí' : 'No');
    if (typeof Blazor !== 'undefined' && Blazor.start) {
        console.log('Blazor disponible');
    }

    // 5. Scripts cargados
    console.log('\nSCRIPTS:');
    console.log('loginSystemActive:', window.loginSystemActive);
    console.log('adminSystemActive:', window.adminSystemActive);

    // 6. DOM
    console.log('\nDOM:');
    console.log('Título página:', document.title);
    console.log('Body classes:', document.body.className);

    console.log('=== FIN DEBUG ===\n');
};

// Función para probar redirección directa
window.testDirectRedirect = function () {
    console.log('Probando redirección directa...');

    // Verificar sesión
    const session = localStorage.getItem('adminSession');
    if (!session) {
        console.log('No hay sesión, no se puede redirigir');
        return;
    }

    console.log('Sesión encontrada, redirigiendo...');

    // Estrategias múltiples
    console.log('1. Intentando location.assign...');
    try {
        window.location.assign('/admin');
    } catch (e) {
        console.error('Error con assign:', e);

        console.log('2. Intentando location.href...');
        setTimeout(() => {
            window.location.href = '/admin';
        }, 1000);
    }
};

// Función para verificar si el middleware está funcionando
window.testMiddleware = async function () {
    console.log('Probando middleware...');

    try {
        const response = await fetch('/admin', {
            method: 'GET',
            credentials: 'include',
            headers: {
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8'
            }
        });

        console.log('Respuesta middleware:');
        console.log('Status:', response.status);
        console.log('Headers:', Object.fromEntries(response.headers.entries()));

        const html = await response.text();
        console.log('Contenido (primeros 300 chars):', html.substring(0, 300));

        // Analizar respuesta
        if (html.includes('Redirigiendo al login')) {
            console.log('❌ Middleware rechazó - redirigiendo a login');
        } else if (html.includes('Panel de Administración') || html.includes('admin-container')) {
            console.log('✅ Middleware permitió acceso');
        } else if (html.includes('Login')) {
            console.log('❌ Devolvió página de login');
        } else {
            console.log('🤔 Respuesta inesperada');
        }

    } catch (error) {
        console.error('Error probando middleware:', error);
    }
};

// Función para forzar navegación usando Blazor NavigationManager
window.forceBlazorNavigation = function () {
    console.log('Intentando navegación con Blazor...');

    // Intentar usar el NavigationManager de Blazor si está disponible
    if (typeof DotNet !== 'undefined') {
        console.log('DotNet disponible, intentando invocar navegación...');
        try {
            // Esto requeriría una función C# expuesta, pero vamos a intentar
            DotNet.invokeMethod('ProyectoWeb', 'NavigateToAdmin');
        } catch (e) {
            console.error('Error con DotNet invoke:', e);
        }
    }

    // Alternativa: usar history API
    console.log('Intentando con History API...');
    try {
        window.history.pushState({}, '', '/admin');
        window.location.reload();
    } catch (e) {
        console.error('Error con History API:', e);
    }
};

// Monitor de navegación
window.startNavigationMonitor = function () {
    console.log('Iniciando monitor de navegación...');

    let navigationCount = 0;

    // Monitorear cambios de URL
    const originalPushState = history.pushState;
    const originalReplaceState = history.replaceState;

    history.pushState = function () {
        navigationCount++;
        console.log(`Navigation ${navigationCount}: pushState to`, arguments[2]);
        return originalPushState.apply(history, arguments);
    };

    history.replaceState = function () {
        navigationCount++;
        console.log(`Navigation ${navigationCount}: replaceState to`, arguments[2]);
        return originalReplaceState.apply(history, arguments);
    };

    // Monitorear eventos de navegación
    window.addEventListener('beforeunload', () => {
        console.log('Página a punto de descargar');
    });

    window.addEventListener('unload', () => {
        console.log('Página descargándose');
    });

    window.addEventListener('popstate', (e) => {
        console.log('Popstate event:', e.state);
    });

    console.log('Monitor de navegación activo');
};

// Función para probar diferentes estrategias de redirección
window.testAllRedirectionStrategies = function () {
    console.log('Probando todas las estrategias de redirección...');

    const strategies = [
        () => { window.location.replace('/admin'); console.log('Tried: location.replace'); },
        () => { window.location.href = '/admin'; console.log('Tried: location.href'); },
        () => { window.location.assign('/admin'); console.log('Tried: location.assign'); },
        () => { window.open('/admin', '_self'); console.log('Tried: window.open _self'); },
        () => {
            window.history.pushState({}, '', '/admin');
            window.location.reload();
            console.log('Tried: pushState + reload');
        }
    ];

    let strategyIndex = 0;

    function tryNextStrategy() {
        if (strategyIndex >= strategies.length) {
            console.log('Todas las estrategias probadas');
            return;
        }

        console.log(`Probando estrategia ${strategyIndex + 1}...`);

        try {
            strategies[strategyIndex]();
        } catch (e) {
            console.error(`Error con estrategia ${strategyIndex + 1}:`, e);
            strategyIndex++;
            setTimeout(tryNextStrategy, 2000);
        }
    }

    tryNextStrategy();
};

// Auto-inicializar el monitor si estamos navegando
if (window.location.pathname.includes('/login') || window.location.pathname.includes('/admin')) {
    window.startNavigationMonitor();
}

// Mostrar funciones disponibles
console.log('\n🔧 FUNCIONES DE DIAGNÓSTICO DISPONIBLES:');
console.log('debugSession() - Info completa de sesión y estado');
console.log('testDirectRedirect() - Probar redirección directa');
console.log('testMiddleware() - Probar respuesta del middleware');
console.log('forceBlazorNavigation() - Forzar navegación con Blazor');
console.log('testAllRedirectionStrategies() - Probar todas las estrategias');
console.log('startNavigationMonitor() - Monitor de navegación (ya activo)');

console.log('\n💡 Usa debugSession() para ver el estado actual');