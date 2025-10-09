// admin-session-bridge.js - Bridge para asegurar comunicación entre JS y C#
console.log('Cargando bridge de sesión para Admin...');

// Asegurar que las funciones estén disponibles globalmente
window.ensureSessionFunctions = function () {
    // Si las funciones no están disponibles, crearlas
    if (typeof window.isLoggedIn !== 'function') {
        console.log('Creando funciones de sesión de emergencia...');

        window.isLoggedIn = function () {
            try {
                // Verificar localStorage
                const stored = localStorage.getItem('adminSession');
                if (stored) {
                    const session = JSON.parse(stored);
                    return session && session.expiresAt > Date.now();
                }

                // Verificar cookie
                const cookies = document.cookie.split(';');
                const sessionCookie = cookies.find(c => c.trim().startsWith('adminSession='));
                if (sessionCookie) {
                    const sessionValue = sessionCookie.split('=')[1];
                    const sessionData = JSON.parse(atob(sessionValue));
                    return sessionData.expiresAt > Date.now();
                }

                return false;
            } catch (error) {
                console.error('Error verificando sesión:', error);
                return false;
            }
        };

        window.getSessionData = function () {
            try {
                // Verificar memoria
                if (window.adminSession && window.adminSession.expiresAt > Date.now()) {
                    return window.adminSession;
                }

                // Verificar localStorage
                const stored = localStorage.getItem('adminSession');
                if (stored) {
                    const session = JSON.parse(stored);
                    if (session && session.expiresAt > Date.now()) {
                        window.adminSession = session;
                        return session;
                    }
                }

                // Verificar cookie
                const cookies = document.cookie.split(';');
                const sessionCookie = cookies.find(c => c.trim().startsWith('adminSession='));
                if (sessionCookie) {
                    const sessionValue = sessionCookie.split('=')[1];
                    const sessionData = JSON.parse(atob(sessionValue));
                    if (sessionData.expiresAt > Date.now()) {
                        window.adminSession = sessionData;
                        localStorage.setItem('adminSession', JSON.stringify(sessionData));
                        return sessionData;
                    }
                }

                return null;
            } catch (error) {
                console.error('Error obteniendo datos de sesión:', error);
                return null;
            }
        };
    }

    console.log('Funciones de sesión verificadas y disponibles');
    return true;
};

// Auto-ejecutar al cargar
window.ensureSessionFunctions();

// Función específica para Admin.razor
window.getAdminSessionStatus = function () {
    try {
        console.log('[BRIDGE] Verificando estado de sesión para Admin...');

        const isValid = window.isLoggedIn();
        const sessionData = isValid ? window.getSessionData() : null;

        console.log('[BRIDGE] Resultado:', { isValid, user: sessionData?.username });

        return {
            valid: isValid,
            data: sessionData
        };
    } catch (error) {
        console.error('[BRIDGE] Error:', error);
        return {
            valid: false,
            error: error.message
        };
    }
};

console.log('Bridge de sesión cargado correctamente');