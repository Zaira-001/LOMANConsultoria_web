// debug-session.js - Helper para debugging
console.log('Cargando debug helper...');

window.debugSession = function () {
    console.log('\n=== 🔍 DEBUG SESIÓN COMPLETO ===');

    // 1. Estado de memoria
    console.log('📝 MEMORIA:');
    console.log('window.adminSession:', window.adminSession);

    // 2. Estado de localStorage
    console.log('\n💾 LOCALSTORAGE:');
    try {
        const stored = localStorage.getItem('adminSession');
        if (stored) {
            const parsed = JSON.parse(stored);
            console.log('Datos:', parsed);
            console.log('Expiración:', new Date(parsed.expiresAt));
            console.log('Válido:', parsed.expiresAt > Date.now());
        } else {
            console.log('No hay datos en localStorage');
        }
    } catch (e) {
        console.error('Error leyendo localStorage:', e);
    }

    // 3. Estado de cookies
    console.log('\n🍪 COOKIES:');
    try {
        const cookies = document.cookie.split(';');
        const sessionCookie = cookies.find(c => c.trim().startsWith('adminSession='));
        if (sessionCookie) {
            console.log('Cookie encontrada:', sessionCookie.substring(0, 50) + '...');
            try {
                const sessionValue = sessionCookie.split('=')[1];
                const sessionData = JSON.parse(atob(sessionValue));
                console.log('Datos decodificados:', sessionData);
                console.log('Expiración:', new Date(sessionData.expiresAt));
                console.log('Válida:', sessionData.expiresAt > Date.now());
            } catch (e) {
                console.error('Error decodificando cookie:', e);
            }
        } else {
            console.log('No hay cookie de sesión');
        }
    } catch (e) {
        console.error('Error leyendo cookies:', e);
    }

    // 4. Funciones de sesión
    console.log('\n🔧 FUNCIONES:');
    console.log('isLoggedIn():', typeof window.isLoggedIn === 'function' ? window.isLoggedIn() : 'función no disponible');
    console.log('getSessionData():', typeof window.getSessionData === 'function' ? window.getSessionData() : 'función no disponible');

    // 5. Info del navegador
    console.log('\n🌐 NAVEGADOR:');
    console.log('URL actual:', window.location.href);
    console.log('User Agent:', navigator.userAgent.substring(0, 100) + '...');
    console.log('Timestamp actual:', Date.now());

    console.log('=== FIN DEBUG ===\n');
};

// Función para limpiar sesión completamente
window.clearAllSessions = function () {
    console.log('🧹 Limpiando todas las sesiones...');

    // Limpiar memoria
    window.adminSession = null;

    // Limpiar localStorage
    localStorage.removeItem('adminSession');

    // Limpiar cookie
    document.cookie = 'adminSession=; path=/; expires=Thu, 01 Jan 1970 00:00:00 UTC;';

    console.log('✅ Todas las sesiones limpiadas');
    window.debugSession();
};

// Función para simular login exitoso (solo para testing)
window.simulateLogin = function (username = 'test_user') {
    console.log(`🧪 Simulando login para: ${username}`);

    const now = Date.now();
    const sessionData = {
        adminId: 1,
        username: username,
        email: `${username}@test.com`,
        nombreCompleto: `Usuario ${username}`,
        rol: 'Admin',
        loginTime: now,
        expiresAt: now + (8 * 60 * 60 * 1000), // 8 horas
        deviceFingerprint: 'test_device'
    };

    // Guardar en todas las ubicaciones
    window.adminSession = sessionData;
    localStorage.setItem('adminSession', JSON.stringify(sessionData));

    const cookieValue = btoa(JSON.stringify(sessionData));
    const expires = new Date(sessionData.expiresAt).toUTCString();
    document.cookie = `adminSession=${cookieValue}; path=/; expires=${expires}; samesite=lax`;

    console.log('✅ Login simulado completado');
    window.debugSession();

    return sessionData;
};

// Función para verificar conectividad con la API
window.testAPI = async function () {
    console.log('🔌 Probando conectividad con API...');

    try {
        const response = await fetch('https://lomanconsultoria-web.onrender.com/api/Empleo', {
            method: 'GET',
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json'
            }
        });

        console.log(`📡 Respuesta API: ${response.status} ${response.statusText}`);

        if (response.ok) {
            const data = await response.text();
            console.log('📊 Datos recibidos (primeros 200 chars):', data.substring(0, 200));
            return true;
        } else {
            console.error('❌ Error en API:', response.status);
            return false;
        }
    } catch (error) {
        console.error('❌ Error de conexión:', error.message);
        return false;
    }
};

// Auto-ejecutar debug si estamos en desarrollo
if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
    console.log('🔧 Modo desarrollo detectado - funciones debug disponibles:');
    console.log('- debugSession() - Mostrar estado completo de sesión');
    console.log('- clearAllSessions() - Limpiar todas las sesiones');
    console.log('- simulateLogin(username) - Simular login exitoso');
    console.log('- testAPI() - Probar conectividad con API');
}

console.log('✅ Debug helper cargado');