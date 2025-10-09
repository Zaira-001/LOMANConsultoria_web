// login-fixed.js - Versión SIN BUCLES de redirección
console.log('Cargando sistema de login (VERSIÓN CORREGIDA SIN BUCLES)...');

if (window.loginSystemActive) {
    console.log('Sistema de login ya activo');
} else {
    window.loginSystemActive = true;

    const CONFIG = {
        API_URL: 'http://consultoriaintegralsc.somee.com/api/Admin',
        TIMEOUT: 15000,
        MAX_REDIRECT_ATTEMPTS: 3
    };

    let deviceFingerprint = null;
    let loginAttempts = 0;
    const MAX_ATTEMPTS = 3;
    let isRedirecting = false;
    let redirectAttempts = 0;

    function generateFingerprint() {
        try {
            const data = {
                userAgent: navigator.userAgent,
                language: navigator.language,
                platform: navigator.platform,
                screen: `${screen.width}x${screen.height}`,
                timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
                timestamp: Date.now()
            };
            return btoa(JSON.stringify(data)).substring(0, 64);
        } catch {
            return btoa(`fallback_${Date.now()}_${Math.random()}`).substring(0, 64);
        }
    }

    function checkSessionQuietly() {
        try {
            // 1. Verificar memoria primero
            if (window.adminSession && window.adminSession.expiresAt > Date.now()) {
                return { valid: true, data: window.adminSession, source: 'memory' };
            }

            // 2. Verificar localStorage
            const stored = localStorage.getItem('adminSession');
            if (stored) {
                const session = JSON.parse(stored);
                if (session && session.expiresAt > Date.now()) {
                    window.adminSession = session; // Restaurar en memoria
                    return { valid: true, data: session, source: 'localStorage' };
                } else {
                    localStorage.removeItem('adminSession');
                }
            }

            // 3. Verificar cookie
            const cookies = document.cookie.split(';');
            const sessionCookie = cookies.find(c => c.trim().startsWith('adminSession='));
            if (sessionCookie) {
                try {
                    const sessionValue = sessionCookie.split('=')[1];
                    const sessionData = JSON.parse(atob(sessionValue));
                    if (sessionData.expiresAt > Date.now()) {
                        window.adminSession = sessionData;
                        localStorage.setItem('adminSession', JSON.stringify(sessionData));
                        return { valid: true, data: sessionData, source: 'cookie' };
                    } else {
                        document.cookie = 'adminSession=; path=/; expires=Thu, 01 Jan 1970 00:00:00 UTC;';
                    }
                } catch (e) {
                    document.cookie = 'adminSession=; path=/; expires=Thu, 01 Jan 1970 00:00:00 UTC;';
                }
            }

            return { valid: false };
        } catch (error) {
            console.error('Error verificando sesión:', error);
            return { valid: false };
        }
    }

    function showLoading(show) {
        const overlay = document.getElementById('loadingOverlay');
        const button = document.getElementById('loginButton');
        if (overlay) overlay.style.display = show ? 'flex' : 'none';
        if (button) button.textContent = show ? 'Verificando...' : 'Iniciar Sesión';
    }

    function showError(message) {
        const errorDiv = document.getElementById('errorMessage');
        const errorText = document.getElementById('errorText');
        if (errorDiv && errorText) {
            errorText.textContent = message;
            errorDiv.style.display = 'block';
            setTimeout(() => errorDiv.style.display = 'none', 5000);
        }
        console.error('Error:', message);
    }

    function showSuccess(message) {
        let successDiv = document.getElementById('successMessage');
        if (!successDiv) {
            successDiv = document.createElement('div');
            successDiv.id = 'successMessage';
            successDiv.style.cssText = `
                background: #d4edda; border: 1px solid #c3e6cb; color: #155724;
                padding: 12px 16px; border-radius: 8px; margin: 10px 0; display: block;
                text-align: center; font-weight: 500;
            `;
            const loginCard = document.querySelector('.login-card');
            if (loginCard) loginCard.appendChild(successDiv);
        }
        successDiv.textContent = message;
        successDiv.style.display = 'block';
    }

    function disableForm(disable) {
        const inputs = document.querySelectorAll('#loginForm input, #loginForm button');
        inputs.forEach(input => input.disabled = disable);
    }

    function shakeForm() {
        const card = document.querySelector('.login-card');
        if (card) {
            card.style.animation = 'shake 0.5s ease-in-out';
            setTimeout(() => card.style.animation = '', 500);
        }
    }

    // *** FUNCIÓN DE REDIRECCIÓN COMPLETAMENTE REESCRITA ***
    // Reemplaza la función redirectToAdmin en tu login-new.js con esta versión
    function redirectToAdmin() {
        if (isRedirecting) {
            console.log('⚠️ Redirección ya en progreso, ignorando...');
            return;
        }

        isRedirecting = true;
        console.log('🚀 Iniciando redirección DIRECTA (evitando Blazor)...');

        // Verificar sesión
        const sessionCheck = checkSessionQuietly();
        if (!sessionCheck.valid) {
            console.error('❌ No hay sesión válida para redirigir');
            isRedirecting = false;
            return;
        }

        console.log('✅ Sesión válida confirmada');

        // Mostrar mensaje de éxito
        showSuccess('¡Login exitoso! Redirigiendo...');
        disableForm(true);

        // CREAR PÁGINA INTERMEDIA QUE EVITE BLAZOR
        setTimeout(() => {
            try {
                console.log('📄 Creando página de redirección directa...');

                // Crear HTML que redirige ANTES de que Blazor se inicie
                const redirectPage = `
                <!DOCTYPE html>
                <html>
                <head>
                    <title>Redirigiendo...</title>
                    <meta http-equiv="refresh" content="0; url=/admin">
                    <style>
                        body {
                            font-family: Arial, sans-serif;
                            display: flex;
                            justify-content: center;
                            align-items: center;
                            height: 100vh;
                            background: #f0f0f0;
                            margin: 0;
                        }
                        .container {
                            text-align: center;
                            background: white;
                            padding: 30px;
                            border-radius: 10px;
                            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
                        }
                        .spinner {
                            border: 3px solid #f3f3f3;
                            border-top: 3px solid #007bff;
                            border-radius: 50%;
                            width: 30px;
                            height: 30px;
                            animation: spin 1s linear infinite;
                            margin: 20px auto;
                        }
                        @keyframes spin {
                            0% { transform: rotate(0deg); }
                            100% { transform: rotate(360deg); }
                        }
                    </style>
                </head>
                <body>
                    <div class="container">
                        <h2>✅ Login Exitoso</h2>
                        <p>Cargando Panel de Administración...</p>
                        <div class="spinner"></div>
                        <p><small>Si no se redirige automáticamente, <a href="/admin">haz clic aquí</a></small></p>
                    </div>
                    <script>
                        console.log('Página de redirección cargada');
                        
                        // Múltiples estrategias de redirección
                        setTimeout(() => {
                            console.log('Redirigiendo a admin...');
                            window.location.replace('/admin');
                        }, 1000);
                        
                        // Backup
                        setTimeout(() => {
                            if (window.location.pathname !== '/admin') {
                                window.location.href = '/admin';
                            }
                        }, 3000);
                    </script>
                </body>
                </html>
            `;

                // Abrir en la misma ventana
                document.open();
                document.write(redirectPage);
                document.close();

            } catch (error) {
                console.error('❌ Error creando página de redirección:', error);

                // Fallback: redirección simple
                console.log('🔄 Fallback: redirección simple...');
                window.location.href = '/admin?direct=true&t=' + Date.now();
            }
        }, 1500);
    }

    // PROCESO DE LOGIN (sin cambios importantes)
    async function processLogin(username, password) {
        console.log('Procesando login para:', username);

        if (!deviceFingerprint) {
            deviceFingerprint = generateFingerprint();
        }

        showLoading(true);
        disableForm(true);

        try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), CONFIG.TIMEOUT);

            const response = await fetch(`${CONFIG.API_URL}/login`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                    'Cache-Control': 'no-cache'
                },
                signal: controller.signal,
                body: JSON.stringify({
                    username: username,
                    password: password,
                    fingerprintDispositivo: deviceFingerprint
                })
            });

            clearTimeout(timeoutId);
            console.log('Respuesta HTTP:', response.status);

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`Error ${response.status}: ${errorText}`);
            }

            const data = await response.json();
            console.log('Datos recibidos:', data);

            if (data.success) {
                console.log('✅ Login exitoso en API');

                const now = Date.now();
                const sessionData = {
                    adminId: data.adminId,
                    username: data.username,
                    email: data.email,
                    nombreCompleto: data.nombreCompleto,
                    rol: data.rol,
                    ultimoLogin: data.ultimoLogin,
                    loginTime: now,
                    expiresAt: now + (8 * 60 * 60 * 1000), // 8 horas
                    deviceFingerprint: deviceFingerprint
                };

                console.log('💾 Guardando sesión...');
                await saveSessionData(sessionData);

                // Verificar que se guardó
                const verification = await verifySessionSaved(sessionData);
                if (!verification.success) {
                    throw new Error('Error guardando sesión: ' + verification.error);
                }

                console.log('✅ Sesión guardada correctamente');

                // Redirección con delay
                setTimeout(() => {
                    redirectToAdmin();
                }, 500);

            } else {
                handleLoginFailure(data.message || 'Credenciales incorrectas');
            }

        } catch (error) {
            console.error('❌ Error en login:', error);
            handleLoginError(error);
        } finally {
            showLoading(false);
            disableForm(false);
        }
    }

    // Guardar sesión (sin cambios)
    async function saveSessionData(sessionData) {
        return new Promise((resolve, reject) => {
            try {
                window.adminSession = sessionData;
                localStorage.setItem('adminSession', JSON.stringify(sessionData));

                const cookieValue = btoa(JSON.stringify(sessionData));
                const expires = new Date(sessionData.expiresAt);

                const cookieOptions = [
                    `adminSession=${cookieValue}`,
                    'path=/',
                    `expires=${expires.toUTCString()}`,
                    'samesite=lax'
                ];

                if (window.location.protocol === 'https:') {
                    cookieOptions.push('secure');
                }

                document.cookie = cookieOptions.join('; ');
                console.log('🍪 Cookie configurada');

                setTimeout(resolve, 100);
            } catch (error) {
                reject(error);
            }
        });
    }

    // Verificar sesión guardada (sin cambios)
    async function verifySessionSaved(originalData) {
        return new Promise((resolve) => {
            setTimeout(() => {
                try {
                    const storedData = localStorage.getItem('adminSession');
                    if (!storedData) {
                        resolve({ success: false, error: 'No se guardó en localStorage' });
                        return;
                    }

                    const parsedData = JSON.parse(storedData);
                    if (parsedData.username !== originalData.username) {
                        resolve({ success: false, error: 'Datos inconsistentes' });
                        return;
                    }

                    resolve({ success: true });
                } catch (error) {
                    resolve({ success: false, error: error.message });
                }
            }, 200);
        });
    }

    function handleLoginFailure(message) {
        loginAttempts++;
        const remaining = MAX_ATTEMPTS - loginAttempts;

        let displayMessage = message;
        if (remaining > 0) {
            displayMessage += `. Intentos restantes: ${remaining}`;
        }

        showError(displayMessage);
        shakeForm();

        if (remaining <= 0) {
            disableForm(true);
            showError('Demasiados intentos. Recarga la página.');
        }
    }

    function handleLoginError(error) {
        loginAttempts++;

        let message = 'Error de conexión con el servidor';
        if (error.name === 'AbortError') {
            message = 'Tiempo de conexión agotado.';
        } else if (error.message.includes('500')) {
            message = 'Error interno del servidor.';
        } else if (error.message.includes('network')) {
            message = 'Error de red. Verifica tu conexión.';
        }

        showError(message);
        shakeForm();
    }

    // CONFIGURACIÓN DEL FORMULARIO
    function setupForm() {
        const form = document.getElementById('loginForm');
        if (!form) {
            setTimeout(setupForm, 100);
            return;
        }

        console.log('⚙️ Configurando formulario de login...');

        // Remover listeners previos clonando el elemento
        const oldForm = form.cloneNode(true);
        form.parentNode.replaceChild(oldForm, form);

        oldForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            e.stopPropagation();

            const username = document.getElementById('username')?.value?.trim();
            const password = document.getElementById('password')?.value;

            if (!username || !password) {
                showError('Complete todos los campos');
                return;
            }

            if (loginAttempts >= MAX_ATTEMPTS) {
                showError('Demasiados intentos fallidos');
                return;
            }

            await processLogin(username, password);
        });

        // Navegación con Enter
        const usernameInput = document.getElementById('username');
        const passwordInput = document.getElementById('password');

        if (usernameInput && passwordInput) {
            usernameInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    e.preventDefault();
                    passwordInput.focus();
                }
            });

            passwordInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    e.preventDefault();
                    oldForm.dispatchEvent(new Event('submit'));
                }
            });
        }
    }

    // FUNCIONES GLOBALES
    window.togglePasswordVisibility = function () {
        const input = document.getElementById('password');
        const icon = document.getElementById('passwordToggleIcon');

        if (input && icon) {
            if (input.type === 'password') {
                input.type = 'text';
                icon.textContent = '🙈';
            } else {
                input.type = 'password';
                icon.textContent = '👁️';
            }
        }
    };

    window.isLoggedIn = function () {
        const sessionCheck = checkSessionQuietly();
        return sessionCheck.valid;
    };

    window.getSessionData = function () {
        const sessionCheck = checkSessionQuietly();
        return sessionCheck.valid ? sessionCheck.data : null;
    };

    window.logout = function () {
        console.log('🚪 Cerrando sesión...');
        window.adminSession = null;
        localStorage.removeItem('adminSession');
        document.cookie = 'adminSession=; path=/; expires=Thu, 01 Jan 1970 00:00:00 UTC;';
        window.location.href = '/login';
    };

    // DETECCIÓN DE BUCLES
    function detectRedirectLoop() {
        const redirectHistory = sessionStorage.getItem('redirectHistory');
        const now = Date.now();

        let history = redirectHistory ? JSON.parse(redirectHistory) : [];

        // Limpiar historia antigua (más de 30 segundos)
        history = history.filter(time => now - time < 30000);

        // Agregar timestamp actual
        history.push(now);

        // Si hay más de 3 redirecciones en 30 segundos = bucle
        if (history.length > 3) {
            console.error('🚨 BUCLE DE REDIRECCIÓN DETECTADO');
            sessionStorage.removeItem('redirectHistory');

            // Limpiar todo y mostrar mensaje
            localStorage.removeItem('adminSession');
            document.cookie = 'adminSession=; path=/; expires=Thu, 01 Jan 1970 00:00:00 UTC;';

            showError('Error: bucle de redirección detectado. Página recargada.');
            setTimeout(() => window.location.reload(), 3000);
            return true;
        }

        sessionStorage.setItem('redirectHistory', JSON.stringify(history));
        return false;
    }

    // ESTILOS CSS
    if (!document.getElementById('login-styles')) {
        const style = document.createElement('style');
        style.id = 'login-styles';
        style.textContent = `
            @keyframes shake {
                0%, 100% { transform: translateX(0); }
                25% { transform: translateX(-10px); }
                75% { transform: translateX(10px); }
            }
            .session-notice {
                background: #e8f5e8;
                border: 1px solid #4caf50;
                color: #2e7d32;
                padding: 15px;
                border-radius: 8px;
                margin: 15px 0;
                text-align: center;
                cursor: pointer;
                transition: all 0.3s ease;
            }
            .session-notice:hover {
                background: #c8e6c9;
                transform: translateY(-2px);
            }
        `;
        document.head.appendChild(style);
    }

    // INICIALIZACIÓN
    function init() {
        console.log('🚀 Inicializando sistema de login...');

        if (!window.location.pathname.includes('/login')) {
            console.log('❌ No estamos en página de login');
            return;
        }

        // Detectar bucles de redirección
        if (detectRedirectLoop()) {
            return;
        }

        setupForm();
        console.log('✅ Sistema de login inicializado');
    }

    // Inicializar
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        setTimeout(init, 100);
    }

    console.log('✅ Script de login corregido cargado (SIN BUCLES)');
}