// test-auth.js - Script para probar el flujo sin bucles
console.log('Script de testing cargado');

// Función para testear el flujo completo
window.testAuthFlow = function () {
    console.log('\n=== TESTING FLUJO DE AUTENTICACIÓN ===\n');

    // 1. Estado inicial
    console.log('1. Estado inicial:');
    console.log('URL actual:', window.location.href);
    console.log('¿Hay sesión?', typeof window.isLoggedIn === 'function' ? window.isLoggedIn() : 'función no disponible');

    // 2. Limpiar todo
    console.log('\n2. Limpiando sesiones...');
    if (typeof window.clearAllSessions === 'function') {
        window.clearAllSessions();
    } else {
        localStorage.removeItem('adminSession');
        document.cookie = 'adminSession=; path=/; expires=Thu, 01 Jan 1970 00:00:00 UTC;';
        window.adminSession = null;
        console.log('Sesiones limpiadas manualmente');
    }

    // 3. Verificar limpieza
    console.log('\n3. Verificando limpieza:');
    console.log('localStorage:', localStorage.getItem('adminSession'));
    console.log('Cookie:', document.cookie.includes('adminSession'));
    console.log('Memoria:', window.adminSession);

    // 4. Simular login
    console.log('\n4. Simulando login exitoso...');
    const now = Date.now();
    const testSession = {
        adminId: 1,
        username: 'test_admin',
        email: 'test@admin.com',
        nombreCompleto: 'Administrador de Prueba',
        rol: 'Admin',
        loginTime: now,
        expiresAt: now + (8 * 60 * 60 * 1000), // 8 horas
        deviceFingerprint: 'test_device_123'
    };

    // Guardar en todas las ubicaciones
    window.adminSession = testSession;
    localStorage.setItem('adminSession', JSON.stringify(testSession));

    const cookieValue = btoa(JSON.stringify(testSession));
    const expires = new Date(testSession.expiresAt).toUTCString();
    document.cookie = `adminSession=${cookieValue}; path=/; expires=${expires}; samesite=lax`;

    console.log('Sesión de prueba creada:', testSession);

    // 5. Verificar que se guardó
    console.log('\n5. Verificando que se guardó:');
    console.log('localStorage:', localStorage.getItem('adminSession') ? 'OK' : 'FALLO');
    console.log('Cookie:', document.cookie.includes('adminSession') ? 'OK' : 'FALLO');
    console.log('Memoria:', window.adminSession ? 'OK' : 'FALLO');

    // 6. Probar funciones de sesión
    console.log('\n6. Probando funciones:');
    if (typeof window.isLoggedIn === 'function') {
        console.log('isLoggedIn():', window.isLoggedIn());
        console.log('getSessionData():', window.getSessionData());
    } else {
        console.log('Funciones de sesión no disponibles');
    }

    console.log('\n=== FIN DEL TEST ===\n');

    return testSession;
};

// Función para probar redirección manual
window.testRedirect = function () {
    console.log('Probando redirección manual...');

    // Asegurar que hay sesión
    if (!window.isLoggedIn || !window.isLoggedIn()) {
        console.log('No hay sesión, creando una de prueba...');
        window.testAuthFlow();
    }

    console.log('Redirigiendo a /admin en 2 segundos...');
    setTimeout(() => {
        console.log('Ejecutando redirección...');
        window.location.href = '/admin';
    }, 2000);
};

// Función para monitorear recargas
window.monitorReloads = function () {
    let reloadCount = 0;
    const startTime = Date.now();

    console.log('Monitoreando recargas de página...');

    // Guardar contador en sessionStorage (sobrevive recargas pero no pestañas nuevas)
    const stored = sessionStorage.getItem('reloadMonitor');
    if (stored) {
        const data = JSON.parse(stored);
        reloadCount = data.count + 1;
        console.log(`⚠️ Recarga detectada #${reloadCount}. Tiempo desde inicio: ${Date.now() - data.startTime}ms`);

        if (reloadCount > 3) {
            console.error('🚨 DEMASIADAS RECARGAS! Posible bucle detectado');
            console.log('Limpiando todo para detener bucle...');
            sessionStorage.removeItem('reloadMonitor');
            localStorage.removeItem('adminSession');
            document.cookie = 'adminSession=; path=/; expires=Thu, 01 Jan 1970 00:00:00 UTC;';
            return;
        }
    } else {
        console.log('Iniciando monitoreo de recargas...');
    }

    // Guardar estado actualizado
    sessionStorage.setItem('reloadMonitor', JSON.stringify({
        count: reloadCount,
        startTime: stored ? JSON.parse(stored).startTime : startTime,
        lastReload: Date.now()
    }));

    // Auto-limpiar después de 30 segundos sin recargas
    setTimeout(() => {
        sessionStorage.removeItem('reloadMonitor');
        console.log('Monitor de recargas limpiado (timeout)');
    }, 30000);
};

// Función para debuggear middleware
window.testMiddleware = async function () {
    console.log('Probando respuesta del middleware...');

    try {
        const response = await fetch('/admin', {
            method: 'GET',
            credentials: 'include',
            headers: {
                'Accept': 'text/html',
                'Cache-Control': 'no-cache'
            }
        });

        console.log('Respuesta del middleware:');
        console.log('Status:', response.status);
        console.log('Headers:', [...response.headers.entries()]);

        const content = await response.text();
        console.log('Content (primeros 500 chars):', content.substring(0, 500));

        if (content.includes('Redirigiendo')) {
            console.log('⚠️ Middleware redirigiendo - sesión no válida');
        } else if (content.includes('Panel de Administración')) {
            console.log('✅ Middleware permitió acceso');
        } else {
            console.log('🤔 Respuesta inesperada del middleware');
        }

    } catch (error) {
        console.error('Error probando middleware:', error);
    }
};

// Auto-inicializar monitor en páginas admin
if (window.location.pathname.includes('/admin') || window.location.pathname.includes('/login')) {
    window.monitorReloads();
}

// Mostrar ayuda
console.log('\n🧪 Funciones de testing disponibles:');
console.log('- testAuthFlow() - Probar flujo completo de autenticación');
console.log('- testRedirect() - Probar redirección manual');
console.log('- testMiddleware() - Probar respuesta del middleware');
console.log('- monitorReloads() - Monitorear recargas de página');
console.log('- debugSession() - Debug de sesión (si está disponible)');

console.log('\n💡 El monitor de recargas está activo automáticamente');