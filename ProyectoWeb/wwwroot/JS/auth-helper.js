// auth-helper.js - Funciones auxiliares para autenticación

// Verificar si existe una sesión almacenada
window.checkStoredSession = function () {
    try {
        const stored = localStorage.getItem('adminSession');
        if (!stored) {
            console.log('No hay sesión almacenada');
            return false;
        }

        const session = JSON.parse(stored);
        const isValid = session && session.expiresAt > Date.now();

        console.log('Verificando sesión almacenada:', {
            exists: true,
            valid: isValid,
            expiresAt: session?.expiresAt,
            now: Date.now()
        });

        return isValid;
    } catch (error) {
        console.error('Error verificando sesión:', error);
        localStorage.removeItem('adminSession');
        return false;
    }
};

// Obtener datos de la sesión almacenada
window.getStoredSessionData = function () {
    try {
        const stored = localStorage.getItem('adminSession');
        if (!stored) return null;

        const session = JSON.parse(stored);
        const isValid = session && session.expiresAt > Date.now();

        if (isValid) {
            return session;
        } else {
            localStorage.removeItem('adminSession');
            return null;
        }
    } catch (error) {
        console.error('Error obteniendo datos de sesión:', error);
        localStorage.removeItem('adminSession');
        return null;
    }
};

// Obtener nombre de usuario actual
window.getCurrentUsername = function () {
    try {
        const session = window.getStoredSessionData();
        return session?.nombreCompleto || session?.username || null;
    } catch (error) {
        console.error('Error obteniendo username:', error);
        return null;
    }
};

// Limpiar sesión
window.clearSession = function () {
    try {
        localStorage.removeItem('adminSession');
        window.adminSession = null;
        console.log('Sesión limpiada');
        return true;
    } catch (error) {
        console.error('Error limpiando sesión:', error);
        return false;
    }
};

// Verificar autenticación y redirigir si es necesario
window.requireAuthentication = function () {
    const isAuth = window.checkStoredSession();
    if (!isAuth) {
        console.log('Autenticación requerida, redirigiendo al login...');
        window.location.href = '/login';
        return false;
    }
    return true;
};

// Auto-ejecutar verificación cuando se carga la página
document.addEventListener('DOMContentLoaded', function () {
    // Solo verificar en páginas de admin
    if (window.location.pathname.includes('/admin')) {
        console.log('Página de admin detectada, verificando autenticación...');

        // Dar tiempo para que Blazor se inicialice
        setTimeout(() => {
            if (!window.checkStoredSession()) {
                console.log('Sin autenticación válida, redirigiendo...');
                window.location.href = '/login';
            }
        }, 500);
    }
});

console.log('✅ Auth helper cargado');