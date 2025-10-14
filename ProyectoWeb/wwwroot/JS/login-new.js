// login-new.js - Versión mejorada con diseño moderno
console.log('🎨 Cargando sistema de login (VERSIÓN MEJORADA)...');

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
            if (window.adminSession && window.adminSession.expiresAt > Date.now()) {
                return { valid: true, data: window.adminSession, source: 'memory' };
            }

            const stored = localStorage.getItem('adminSession');
            if (stored) {
                const session = JSON.parse(stored);
                if (session && session.expiresAt > Date.now()) {
                    window.adminSession = session;
                    return { valid: true, data: session, source: 'localStorage' };
                } else {
                    localStorage.removeItem('adminSession');
                }
            }

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

        if (overlay) {
            overlay.style.display = show ? 'flex' : 'none';
        }

        if (button) {
            if (show) {
                button.innerHTML = `
                    <div style="display: flex; align-items: center; justify-content: center; gap: 10px;">
                        <div style="width: 18px; height: 18px; border: 3px solid rgba(255,255,255,0.3); border-top: 3px solid white; border-radius: 50%; animation: spin 1s linear infinite;"></div>
                        <span>Verificando...</span>
                    </div>
                `;
                button.disabled = true;
                button.style.opacity = '0.8';
            } else {
                button.innerHTML = `
                    <span style="display: flex; align-items: center; justify-content: center; gap: 8px;">
                        <span style="font-size: 20px;">🔐</span>
                        <span>Iniciar Sesión</span>
                    </span>
                `;
                button.disabled = false;
                button.style.opacity = '1';
            }
        }
    }

    function showError(message) {
        const errorDiv = document.getElementById('errorMessage');
        const errorText = document.getElementById('errorText');

        if (errorDiv && errorText) {
            errorText.innerHTML = `
                <div style="display: flex; align-items: center; gap: 12px; text-align: left;">
                    <div style="width: 40px; height: 40px; background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%); border-radius: 50%; display: flex; align-items: center; justify-content: center; flex-shrink: 0; font-size: 20px;">
                        ⚠️
                    </div>
                    <div style="flex: 1;">
                        <div style="font-weight: 600; margin-bottom: 4px;">Error de Autenticación</div>
                        <div style="font-size: 14px; opacity: 0.95;">${message}</div>
                    </div>
                </div>
            `;
            errorDiv.style.cssText = `
                background: linear-gradient(135deg, #fee2e2 0%, #fecaca 100%);
                border: 2px solid #fca5a5;
                color: #991b1b;
                padding: 18px 20px;
                border-radius: 12px;
                margin: 20px 0;
                display: block;
                box-shadow: 0 4px 12px rgba(239, 68, 68, 0.2);
                animation: slideDown 0.3s ease-out;
            `;
            setTimeout(() => {
                errorDiv.style.animation = 'slideUp 0.3s ease-out';
                setTimeout(() => errorDiv.style.display = 'none', 300);
            }, 5000);
        }
        console.error('Error:', message);
    }

    function showSuccess(message) {
        let successDiv = document.getElementById('successMessage');
        if (!successDiv) {
            successDiv = document.createElement('div');
            successDiv.id = 'successMessage';
            const loginCard = document.querySelector('.login-card');
            if (loginCard) loginCard.appendChild(successDiv);
        }

        successDiv.innerHTML = `
            <div style="display: flex; align-items: center; gap: 12px; text-align: left;">
                <div style="width: 40px; height: 40px; background: linear-gradient(135deg, #10b981 0%, #059669 100%); border-radius: 50%; display: flex; align-items: center; justify-content: center; flex-shrink: 0; font-size: 20px;">
                    ✓
                </div>
                <div style="flex: 1;">
                    <div style="font-weight: 600; margin-bottom: 4px;">¡Autenticación Exitosa!</div>
                    <div style="font-size: 14px; opacity: 0.95;">${message}</div>
                </div>
            </div>
        `;

        successDiv.style.cssText = `
            background: linear-gradient(135deg, #d1fae5 0%, #a7f3d0 100%);
            border: 2px solid #6ee7b7;
            color: #065f46;
            padding: 18px 20px;
            border-radius: 12px;
            margin: 20px 0;
            display: block;
            box-shadow: 0 4px 12px rgba(16, 185, 129, 0.2);
            animation: slideDown 0.3s ease-out;
        `;
    }

    function disableForm(disable) {
        const inputs = document.querySelectorAll('#loginForm input, #loginForm button');
        inputs.forEach(input => {
            input.disabled = disable;
            input.style.opacity = disable ? '0.6' : '1';
        });
    }

    function shakeForm() {
        const card = document.querySelector('.login-card');
        if (card) {
            card.style.animation = 'shake 0.5s ease-in-out';
            setTimeout(() => card.style.animation = '', 500);
        }
    }

    function redirectToAdmin() {
        if (isRedirecting) {
            console.log('⚠️ Redirección ya en progreso, ignorando...');
            return;
        }

        isRedirecting = true;
        console.log('🚀 Iniciando redirección...');

        const sessionCheck = checkSessionQuietly();
        if (!sessionCheck.valid) {
            console.error('❌ No hay sesión válida para redirigir');
            isRedirecting = false;
            return;
        }

        console.log('✅ Sesión válida confirmada');
        disableForm(true);

        setTimeout(() => {
            try {
                console.log('📄 Creando página de redirección...');

                const redirectPage = `
                <!DOCTYPE html>
                <html>
                <head>
                    <title>Redirigiendo...</title>
                    <meta http-equiv="refresh" content="0; url=/admin">
                    <style>
                        * { margin: 0; padding: 0; box-sizing: border-box; }
                        body {
                            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
                            display: flex;
                            justify-content: center;
                            align-items: center;
                            height: 100vh;
                            background: linear-gradient(135deg, #5B8DB3 0%, #1E3A5F 100%);
                        }
                        .container {
                            text-align: center;
                            background: white;
                            padding: 50px 40px;
                            border-radius: 20px;
                            box-shadow: 0 20px 60px rgba(0,0,0,0.3);
                            max-width: 400px;
                            animation: fadeIn 0.5s ease-out;
                        }
                        .icon {
                            width: 80px;
                            height: 80px;
                            background: linear-gradient(135deg, #10b981 0%, #059669 100%);
                            border-radius: 50%;
                            display: flex;
                            align-items: center;
                            justify-content: center;
                            margin: 0 auto 25px;
                            font-size: 40px;
                            animation: pulse 2s ease-in-out infinite;
                        }
                        h2 {
                            color: #2c3e50;
                            margin-bottom: 15px;
                            font-size: 26px;
                        }
                        p {
                            color: #7f8c8d;
                            margin-bottom: 30px;
                            font-size: 16px;
                        }
                        .spinner {
                            border: 4px solid #f0f0f0;
                            border-top: 4px solid #667eea;
                            border-radius: 50%;
                            width: 50px;
                            height: 50px;
                            animation: spin 1s linear infinite;
                            margin: 0 auto 25px;
                        }
                        .link {
                            color: #667eea;
                            text-decoration: none;
                            font-weight: 600;
                            transition: all 0.3s ease;
                        }
                        .link:hover {
                            color: #764ba2;
                            text-decoration: underline;
                        }
                        @keyframes spin {
                            0% { transform: rotate(0deg); }
                            100% { transform: rotate(360deg); }
                        }
                        @keyframes fadeIn {
                            from { opacity: 0; transform: translateY(20px); }
                            to { opacity: 1; transform: translateY(0); }
                        }
                        @keyframes pulse {
                            0%, 100% { transform: scale(1); }
                            50% { transform: scale(1.05); }
                        }
                    </style>
                </head>
                <body>
                    <div class="container">
                        <div class="icon">✓</div>
                        <h2>¡Login Exitoso!</h2>
                        <p>Cargando Panel de Administración...</p>
                        <div class="spinner"></div>
                        <p style="font-size: 13px; color: #95a5a6;">
                            Si no se redirige automáticamente, 
                            <a href="/admin" class="link">haz clic aquí</a>
                        </p>
                    </div>
                    <script>
                        console.log('Página de redirección cargada');
                        setTimeout(() => {
                            console.log('Redirigiendo a admin...');
                            window.location.replace('/admin');
                        }, 1000);
                        setTimeout(() => {
                            if (window.location.pathname !== '/admin') {
                                window.location.href = '/admin';
                            }
                        }, 3000);
                    </script>
                </body>
                </html>
            `;

                document.open();
                document.write(redirectPage);
                document.close();

            } catch (error) {
                console.error('❌ Error creando página de redirección:', error);
                window.location.href = '/admin?direct=true&t=' + Date.now();
            }
        }, 1500);
    }

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
            console.log('Datos recibidos del servidor:', data);

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
                    esAdminPrincipal: data.esAdminPrincipal || false,
                    loginTime: now,
                    expiresAt: now + (8 * 60 * 60 * 1000),
                    deviceFingerprint: deviceFingerprint
                };

                console.log('📦 Sesión a guardar:', {
                    ...sessionData,
                    esAdminPrincipal: sessionData.esAdminPrincipal ? '✅ SÍ' : '❌ NO'
                });

                console.log('💾 Guardando sesión...');
                await saveSessionData(sessionData);

                const verification = await verifySessionSaved(sessionData);
                if (!verification.success) {
                    throw new Error('Error guardando sesión: ' + verification.error);
                }

                console.log('✅ Sesión guardada correctamente');

                const rolIcon = sessionData.esAdminPrincipal ? '👑' : '👤';
                const rolText = sessionData.esAdminPrincipal ? 'Administrador Principal' : 'Administrador';
                const welcomeName = data.nombreCompleto || data.username;

                showSuccess(`Bienvenido ${welcomeName}<br><small>${rolIcon} ${rolText}</small>`);

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

    async function saveSessionData(sessionData) {
        return new Promise((resolve, reject) => {
            try {
                window.adminSession = sessionData;
                console.log('✅ Sesión guardada en window.adminSession');

                localStorage.setItem('adminSession', JSON.stringify(sessionData));
                console.log('✅ Sesión guardada en localStorage');

                sessionStorage.setItem('adminSession', JSON.stringify(sessionData));
                console.log('✅ Sesión guardada en sessionStorage');

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
                console.log('✅ Sesión guardada en cookie');

                setTimeout(resolve, 100);
            } catch (error) {
                console.error('❌ Error guardando sesión:', error);
                reject(error);
            }
        });
    }

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

                    console.log('🔍 Verificando flag de admin principal:', parsedData.esAdminPrincipal);

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
            displayMessage += `<br><small style="font-size: 13px; opacity: 0.9;">Intentos restantes: <strong>${remaining}</strong></small>`;
        }

        showError(displayMessage);
        shakeForm();

        if (remaining <= 0) {
            disableForm(true);
            showError('Demasiados intentos fallidos.<br><small>Por favor, recarga la página para intentar nuevamente.</small>');
        }
    }

    function handleLoginError(error) {
        loginAttempts++;

        let message = 'Error de conexión con el servidor';
        if (error.name === 'AbortError') {
            message = 'Tiempo de conexión agotado.<br><small>Por favor, verifica tu conexión e intenta nuevamente.</small>';
        } else if (error.message.includes('500')) {
            message = 'Error interno del servidor.<br><small>Intenta nuevamente en unos momentos.</small>';
        } else if (error.message.includes('network')) {
            message = 'Error de red.<br><small>Verifica tu conexión a internet.</small>';
        }

        showError(message);
        shakeForm();
    }

    function setupForm() {
        const form = document.getElementById('loginForm');
        if (!form) {
            setTimeout(setupForm, 100);
            return;
        }

        console.log('⚙️ Configurando formulario de login...');

        const oldForm = form.cloneNode(true);
        form.parentNode.replaceChild(oldForm, form);

        oldForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            e.stopPropagation();

            const username = document.getElementById('username')?.value?.trim();
            const password = document.getElementById('password')?.value;

            if (!username || !password) {
                showError('Por favor, completa todos los campos para continuar.');
                return;
            }

            if (loginAttempts >= MAX_ATTEMPTS) {
                showError('Demasiados intentos fallidos.<br><small>Recarga la página para intentar nuevamente.</small>');
                return;
            }

            await processLogin(username, password);
        });

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

    window.togglePasswordVisibility = function () {
        const input = document.getElementById('password');
        const icon = document.getElementById('passwordToggleIcon');

        if (input && icon) {
            if (input.type === 'password') {
                input.type = 'text';
                icon.textContent = '👁️';
            } else {
                input.type = 'password';
                icon.textContent = '🙈';
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
        sessionStorage.removeItem('adminSession');
        document.cookie = 'adminSession=; path=/; expires=Thu, 01 Jan 1970 00:00:00 UTC;';
        window.location.href = '/login';
    };

    function detectRedirectLoop() {
        const redirectHistory = sessionStorage.getItem('redirectHistory');
        const now = Date.now();

        let history = redirectHistory ? JSON.parse(redirectHistory) : [];
        history = history.filter(time => now - time < 30000);
        history.push(now);

        if (history.length > 3) {
            console.error('🚨 BUCLE DE REDIRECCIÓN DETECTADO');
            sessionStorage.removeItem('redirectHistory');
            localStorage.removeItem('adminSession');
            document.cookie = 'adminSession=; path=/; expires=Thu, 01 Jan 1970 00:00:00 UTC;';
            showError('Error: bucle de redirección detectado.<br><small>La página se recargará en 3 segundos...</small>');
            setTimeout(() => window.location.reload(), 3000);
            return true;
        }

        sessionStorage.setItem('redirectHistory', JSON.stringify(history));
        return false;
    }

    // ESTILOS CSS MEJORADOS
    if (!document.getElementById('login-styles')) {
        const style = document.createElement('style');
        style.id = 'login-styles';
        style.textContent = `
            @keyframes shake {
                0%, 100% { transform: translateX(0); }
                10%, 30%, 50%, 70%, 90% { transform: translateX(-10px); }
                20%, 40%, 60%, 80% { transform: translateX(10px); }
            }
            
            @keyframes slideDown {
                from {
                    opacity: 0;
                    transform: translateY(-20px);
                }
                to {
                    opacity: 1;
                    transform: translateY(0);
                }
            }
            
            @keyframes slideUp {
                from {
                    opacity: 1;
                    transform: translateY(0);
                }
                to {
                    opacity: 0;
                    transform: translateY(-20px);
                }
            }
            
            @keyframes spin {
                0% { transform: rotate(0deg); }
                100% { transform: rotate(360deg); }
            }
            
            .session-notice {
                background: linear-gradient(135deg, #d1fae5 0%, #a7f3d0 100%);
                border: 2px solid #6ee7b7;
                color: #065f46;
                padding: 18px 20px;
                border-radius: 12px;
                margin: 20px 0;
                text-align: center;
                cursor: pointer;
                transition: all 0.3s ease;
                box-shadow: 0 4px 12px rgba(16, 185, 129, 0.2);
            }
            
            .session-notice:hover {
                background: linear-gradient(135deg, #a7f3d0 0%, #6ee7b7 100%);
                transform: translateY(-2px);
                box-shadow: 0 6px 16px rgba(16, 185, 129, 0.3);
            }
            
            #loginButton {
                transition: all 0.3s ease;
            }
            
            #loginButton:hover:not(:disabled) {
                transform: translateY(-2px);
                box-shadow: 0 6px 20px rgba(102, 126, 234, 0.4);
            }
            
            #loginButton:active:not(:disabled) {
                transform: translateY(0);
            }
        `;
        document.head.appendChild(style);
    }

    function init() {
        console.log('🚀 Inicializando sistema de login...');

        if (!window.location.pathname.includes('/login')) {
            console.log('❌ No estamos en página de login');
            return;
        }

        if (detectRedirectLoop()) {
            return;
        }

        setupForm();
        console.log('✅ Sistema de login inicializado');
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        setTimeout(init, 100);
    }

    console.log('✅ Script de login mejorado cargado exitosamente 🎨');
}