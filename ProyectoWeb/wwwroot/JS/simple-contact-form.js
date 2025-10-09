// JavaScript CORREGIDO para el formulario de contacto
console.log('🚀 Iniciando carga del script de contacto...');

// CONFIGURACIÓN DE LA API
const API_URL = 'http://consultoriaintegralsc.somee.com/api/Contacto';

// Variables globales
let form, submitBtn, btnText, formMessage;

// Inicialización inmediata del script (sin esperar DOMContentLoaded)
(function initFormScript() {
    console.log('📄 Iniciando configuración del formulario');

    // Función de inicialización que se ejecuta cuando el DOM está listo
    function setupForm() {
        // Obtener referencias a los elementos
        form = document.getElementById('contactForm');
        submitBtn = document.getElementById('submitBtn');
        btnText = document.getElementById('btnText');
        formMessage = document.getElementById('formMessage');

        // Verificar elementos
        console.log('🔍 Verificando elementos:', {
            form: !!form,
            submitBtn: !!submitBtn,
            btnText: !!btnText,
            formMessage: !!formMessage
        });

        if (!form) {
            console.error('❌ CRÍTICO: No se encontró el formulario');
            return;
        }

        if (!submitBtn) {
            console.error('❌ CRÍTICO: No se encontró el botón de submit');
            return;
        }

        // MÉTODO PRINCIPAL: Click en el botón (ya no es type="submit", es type="button")
        submitBtn.addEventListener('click', function (e) {
            console.log('🎯 Click en botón interceptado');
            e.preventDefault();
            e.stopPropagation();
            handleFormSubmit();
        });

        // MÉTODO DE RESPALDO: Prevenir submit del form (por si acaso)
        form.addEventListener('submit', function (e) {
            console.log('🎯 Submit del form interceptado (respaldo)');
            e.preventDefault();
            e.stopPropagation();
            return false;
        });

        // Configurar limpieza de errores al escribir
        setupErrorClearingListeners();

        // Agregar estilos CSS
        addFormStyles();

        console.log('✅ Configuración del formulario completada');
    }

    // Ejecutar setup cuando el DOM esté listo
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', setupForm);
    } else {
        // El DOM ya está listo, ejecutar inmediatamente
        setupForm();
    }
})();

// Función principal para manejar el envío del formulario
async function handleFormSubmit() {
    console.log('=== 🚀 INICIANDO ENVÍO DE FORMULARIO ===');

    if (!form) {
        console.error('❌ Formulario no encontrado');
        return false;
    }

    // Limpiar mensajes anteriores
    hideMessage();
    clearErrors();

    // Validar formulario
    if (!validateForm()) {
        console.log('❌ Validación falló');
        return false;
    }

    // Mostrar estado de carga
    setLoadingState(true);

    try {
        // Recopilar datos del formulario
        const formData = {
            nombre: getValue('nombre'),
            correo: getValue('correo'),
            telefono: getValue('telefono'),
            prioridad: getValue('prioridad'),
            tipoConsulta: getValue('tipoConsulta'),
            nombreEmpresa: getValue('nombreEmpresa'),
            tamanoEmpresa: getValue('tamanoEmpresa'),
            mensaje: getValue('mensaje')
        };

        console.log('📤 Datos a enviar:', formData);

        // Realizar petición a la API
        const response = await fetch(API_URL, {
            method: 'POST',
            mode: 'cors',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            body: JSON.stringify(formData)
        });

        console.log('📡 Respuesta recibida:', {
            status: response.status,
            ok: response.ok
        });

        if (response.ok || (response.status >= 200 && response.status < 300)) {
            // Éxito
            console.log('✅ Envío exitoso');
            showSuccessMessage();

            // Limpiar formulario después de 500ms
            setTimeout(() => {
                clearForm();
            }, 500);

        } else {
            // Error del servidor
            let errorText = 'No se pudo enviar el mensaje.';
            try {
                const errorData = await response.json();
                errorText = errorData.message || errorData.error || errorText;
            } catch {
                errorText = await response.text() || errorText;
            }

            console.error('❌ Error del servidor:', errorText);
            showMessage(`Error: ${errorText}`, 'error');
        }

    } catch (error) {
        console.error('❌ Error en la petición:', error);

        let errorMessage = 'Error de conexión. Por favor, intenta nuevamente.';

        if (error.message.includes('Failed to fetch') || error.message.includes('NetworkError')) {
            errorMessage = 'No se puede conectar con el servidor. Verifica tu conexión a internet.';
        }

        showMessage(errorMessage, 'error');
    } finally {
        setLoadingState(false);
    }

    return false;
}

// Función para obtener el valor de un campo
function getValue(id) {
    const element = document.getElementById(id);
    return element ? element.value.trim() : '';
}

// Función de validación
function validateForm() {
    let isValid = true;

    // Validar nombre
    const nombre = getValue('nombre');
    if (!nombre) {
        showError('nombreError', 'El nombre es requerido');
        isValid = false;
    }

    // Validar correo
    const correo = getValue('correo');
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!correo) {
        showError('correoError', 'El correo es requerido');
        isValid = false;
    } else if (!emailRegex.test(correo)) {
        showError('correoError', 'El formato del correo no es válido');
        isValid = false;
    }

    // Validar teléfono
    const telefono = getValue('telefono');
    if (!telefono) {
        showError('telefonoError', 'El teléfono es requerido');
        isValid = false;
    }

    // Validar prioridad
    const prioridad = getValue('prioridad');
    if (!prioridad) {
        showError('prioridadError', 'La prioridad es requerida');
        isValid = false;
    }

    // Validar mensaje
    const mensaje = getValue('mensaje');
    if (!mensaje) {
        showError('mensajeError', 'El mensaje es requerido');
        isValid = false;
    }

    console.log('📋 Validación:', { isValid, nombre, correo, telefono, prioridad, mensaje });
    return isValid;
}

// Función para mostrar errores
function showError(errorElementId, message) {
    const errorElement = document.getElementById(errorElementId);
    if (errorElement) {
        errorElement.textContent = message;
        errorElement.style.display = 'block';
        console.log(`⚠️ Error mostrado: ${message}`);
    }
}

// Función para limpiar errores
function clearErrors() {
    const errorElements = document.querySelectorAll('.error-message, [id$="Error"]');
    errorElements.forEach(element => {
        element.textContent = '';
        element.style.display = 'none';
    });
}

// Función para mostrar mensaje de éxito animado y llamativo
function showSuccessMessage() {
    if (formMessage) {
        // Configurar el mensaje
        formMessage.innerHTML = `
            <div class="success-animation">
                <div class="success-checkmark">
                    <div class="check-icon">
                        <span class="icon-line line-tip"></span>
                        <span class="icon-line line-long"></span>
                        <div class="icon-circle"></div>
                        <div class="icon-fix"></div>
                    </div>
                </div>
                <div class="success-text">
                    <h3>¡Mensaje Enviado con Éxito!</h3>
                    <p>Gracias por contactarnos. Hemos recibido tu mensaje y nuestro equipo te responderá a la brevedad.</p>
                </div>
            </div>
        `;

        formMessage.className = 'form-message success-special';
        formMessage.style.display = 'block';
        formMessage.style.opacity = '0';
        formMessage.style.transform = 'scale(0.8) translateY(-20px)';

        // Animación de entrada
        setTimeout(() => {
            formMessage.style.transition = 'all 0.5s cubic-bezier(0.68, -0.55, 0.265, 1.55)';
            formMessage.style.opacity = '1';
            formMessage.style.transform = 'scale(1) translateY(0)';
        }, 10);

        // Scroll al mensaje con efecto suave
        setTimeout(() => {
            formMessage.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }, 300);

        // Efecto de confetti (opcional)
        createConfetti();

        // Auto-ocultar después de 10 segundos
        setTimeout(() => {
            hideMessage();
        }, 10000);

        console.log('🎉 Mensaje de éxito mostrado');
    }
}

// Función para crear efecto confetti
function createConfetti() {
    const colors = ['#28a745', '#20c997', '#17a2b8', '#ffc107', '#fd7e14'];
    const confettiCount = 50;

    for (let i = 0; i < confettiCount; i++) {
        setTimeout(() => {
            const confetti = document.createElement('div');
            confetti.className = 'confetti';
            confetti.style.left = Math.random() * 100 + '%';
            confetti.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
            confetti.style.animationDelay = Math.random() * 0.3 + 's';
            confetti.style.animationDuration = (Math.random() * 2 + 2) + 's';

            if (formMessage && formMessage.parentElement) {
                formMessage.parentElement.style.position = 'relative';
                formMessage.parentElement.appendChild(confetti);

                setTimeout(() => {
                    confetti.remove();
                }, 4000);
            }
        }, i * 30);
    }
}

// Función para mostrar mensajes (mantener para mensajes de error)
function showMessage(message, type) {
    if (formMessage) {
        formMessage.textContent = message;
        formMessage.className = `form-message ${type}`;
        formMessage.style.display = 'block';
        formMessage.style.opacity = '0';
        formMessage.style.transform = 'translateY(-10px)';

        setTimeout(() => {
            formMessage.style.transition = 'opacity 0.3s ease, transform 0.3s ease';
            formMessage.style.opacity = '1';
            formMessage.style.transform = 'translateY(0)';
        }, 10);

        // Scroll al mensaje
        setTimeout(() => {
            formMessage.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }, 200);

        // Auto-ocultar mensajes de éxito
        if (type === 'success') {
            setTimeout(() => {
                hideMessage();
            }, 8000);
        }

        console.log(`📢 Mensaje: [${type}] ${message}`);
    }
}

// Función para ocultar mensajes
function hideMessage() {
    if (formMessage) {
        formMessage.style.opacity = '0';
        formMessage.style.transform = 'translateY(-10px)';
        setTimeout(() => {
            formMessage.style.display = 'none';
        }, 300);
    }
}

// Función para cambiar el estado de carga
function setLoadingState(loading) {
    if (submitBtn && btnText) {
        if (loading) {
            submitBtn.disabled = true;
            btnText.textContent = '⏳ Enviando...';
            submitBtn.style.opacity = '0.7';
            submitBtn.style.cursor = 'not-allowed';
            console.log('⏳ Cargando...');
        } else {
            submitBtn.disabled = false;
            btnText.textContent = 'Enviar';
            submitBtn.style.opacity = '1';
            submitBtn.style.cursor = 'pointer';
            console.log('✅ Listo');
        }
    }
}

// Función para limpiar el formulario
function clearForm() {
    console.log('🧹 Limpiando formulario...');

    try {
        // Método 1: Limpiar campos específicos
        const fieldIds = ['nombre', 'correo', 'telefono', 'prioridad', 'tipoConsulta', 'nombreEmpresa', 'tamanoEmpresa', 'mensaje'];

        fieldIds.forEach(fieldId => {
            const field = document.getElementById(fieldId);
            if (field) {
                if (field.tagName === 'SELECT') {
                    field.selectedIndex = 0;
                } else {
                    field.value = '';
                }
            }
        });

        // Método 2: Reset del form
        if (form && typeof form.reset === 'function') {
            form.reset();
        }

        // Limpiar errores
        clearErrors();

        console.log('✅ Formulario limpiado');

    } catch (error) {
        console.error('❌ Error al limpiar formulario:', error);
    }
}

// Función para configurar los listeners de limpieza de errores
function setupErrorClearingListeners() {
    const fields = ['nombre', 'correo', 'telefono', 'prioridad', 'mensaje'];

    fields.forEach(fieldId => {
        const field = document.getElementById(fieldId);
        if (field) {
            field.addEventListener('input', function () {
                const errorElement = document.getElementById(fieldId + 'Error');
                if (errorElement && this.value.trim()) {
                    errorElement.style.display = 'none';
                }
            });
        }
    });
}

// Función para agregar estilos CSS
function addFormStyles() {
    if (!document.getElementById('contact-form-styles')) {
        const styleSheet = document.createElement('style');
        styleSheet.id = 'contact-form-styles';
        styleSheet.textContent = `
            .form-message {
                padding: 20px;
                border-radius: 8px;
                margin: 20px 0;
                font-weight: 500;
                text-align: center;
                display: none;
                font-size: 16px;
                line-height: 1.5;
                box-shadow: 0 2px 10px rgba(0,0,0,0.1);
                transition: opacity 0.3s ease, transform 0.3s ease;
            }

            .form-message.success {
                background: linear-gradient(135deg, #d4edda 0%, #c3e6cb 100%);
                color: #155724;
                border: 2px solid #28a745;
                border-left: 6px solid #28a745;
            }

            .form-message.success::before {
                content: "✅ ";
                font-size: 18px;
                margin-right: 8px;
            }

            /* NUEVO: Estilos para mensaje de éxito especial */
            .form-message.success-special {
                background: linear-gradient(135deg, #e8f5e9 0%, #c8e6c9 50%, #a5d6a7 100%);
                border: none;
                border-radius: 16px;
                padding: 30px;
                box-shadow: 0 10px 40px rgba(40, 167, 69, 0.3);
                position: relative;
                overflow: hidden;
            }

            .form-message.success-special::before {
                content: '';
                position: absolute;
                top: -50%;
                left: -50%;
                width: 200%;
                height: 200%;
                background: radial-gradient(circle, rgba(255,255,255,0.3) 0%, transparent 70%);
                animation: shimmer 3s infinite;
            }

            @keyframes shimmer {
                0% { transform: translate(-50%, -50%) rotate(0deg); }
                100% { transform: translate(-50%, -50%) rotate(360deg); }
            }

            .success-animation {
                display: flex;
                flex-direction: column;
                align-items: center;
                gap: 20px;
                position: relative;
                z-index: 1;
            }

            .success-checkmark {
                width: 80px;
                height: 80px;
                margin: 0 auto;
            }

            .check-icon {
                width: 80px;
                height: 80px;
                position: relative;
                border-radius: 50%;
                box-sizing: content-box;
                border: 4px solid #28a745;
                background-color: #fff;
                animation: checkmarkPop 0.6s cubic-bezier(0.68, -0.55, 0.265, 1.55);
            }

            @keyframes checkmarkPop {
                0% { transform: scale(0); opacity: 0; }
                50% { transform: scale(1.2); }
                100% { transform: scale(1); opacity: 1; }
            }

            .icon-line {
                height: 5px;
                background-color: #28a745;
                display: block;
                border-radius: 2px;
                position: absolute;
                z-index: 10;
            }

            .icon-line.line-tip {
                top: 46px;
                left: 14px;
                width: 25px;
                transform: rotate(45deg);
                animation: checkmarkTip 0.75s 0.3s cubic-bezier(0.68, -0.55, 0.265, 1.55) forwards;
                opacity: 0;
            }

            .icon-line.line-long {
                top: 38px;
                right: 8px;
                width: 47px;
                transform: rotate(-45deg);
                animation: checkmarkLong 0.75s 0.5s cubic-bezier(0.68, -0.55, 0.265, 1.55) forwards;
                opacity: 0;
            }

            @keyframes checkmarkTip {
                0% { width: 0; left: 1px; top: 19px; opacity: 0; }
                54% { width: 0; left: 1px; top: 19px; opacity: 1; }
                70% { width: 50px; left: -8px; top: 37px; opacity: 1; }
                100% { width: 25px; left: 14px; top: 46px; opacity: 1; }
            }

            @keyframes checkmarkLong {
                0% { width: 0; right: 46px; top: 54px; opacity: 0; }
                65% { width: 0; right: 46px; top: 54px; opacity: 1; }
                84% { width: 55px; right: 0; top: 35px; opacity: 1; }
                100% { width: 47px; right: 8px; top: 38px; opacity: 1; }
            }

            .icon-circle {
                top: -4px;
                left: -4px;
                z-index: 10;
                width: 80px;
                height: 80px;
                border-radius: 50%;
                position: absolute;
                box-sizing: content-box;
                border: 4px solid rgba(40, 167, 69, 0.2);
                animation: pulseCircle 1.5s infinite;
            }

            @keyframes pulseCircle {
                0%, 100% { transform: scale(1); opacity: 1; }
                50% { transform: scale(1.1); opacity: 0.8; }
            }

            .icon-fix {
                top: 8px;
                width: 5px;
                left: 26px;
                z-index: 1;
                height: 85px;
                position: absolute;
                transform: rotate(-45deg);
                background-color: #fff;
            }

            .success-text {
                text-align: center;
            }

            .success-text h3 {
                color: #155724;
                font-size: 24px;
                font-weight: 700;
                margin: 0 0 10px 0;
                animation: fadeInUp 0.6s 0.3s backwards;
            }

            .success-text p {
                color: #155724;
                font-size: 16px;
                margin: 0;
                line-height: 1.6;
                animation: fadeInUp 0.6s 0.5s backwards;
            }

            @keyframes fadeInUp {
                from {
                    opacity: 0;
                    transform: translateY(20px);
                }
                to {
                    opacity: 1;
                    transform: translateY(0);
                }
            }

            /* Confetti */
            .confetti {
                position: absolute;
                width: 10px;
                height: 10px;
                top: -10px;
                z-index: 1000;
                animation: confettiFall linear forwards;
                pointer-events: none;
            }

            @keyframes confettiFall {
                0% {
                    transform: translateY(0) rotateZ(0deg);
                    opacity: 1;
                }
                100% {
                    transform: translateY(600px) rotateZ(720deg);
                    opacity: 0;
                }
            }

            .form-message.error {
                background: linear-gradient(135deg, #f8d7da 0%, #f5c6cb 100%);
                color: #721c24;
                border: 2px solid #dc3545;
                border-left: 6px solid #dc3545;
            }

            .form-message.error::before {
                content: "❌ ";
                font-size: 18px;
                margin-right: 8px;
            }

            .error-message, [id$="Error"] {
                display: none;
                color: #dc3545;
                font-size: 14px;
                margin-top: 5px;
                font-weight: normal;
            }

            #submitBtn:disabled {
                opacity: 0.7 !important;
                cursor: not-allowed !important;
            }

            #submitBtn {
                transition: all 0.3s ease;
            }

            #submitBtn:hover:not(:disabled) {
                transform: translateY(-2px);
                box-shadow: 0 4px 15px rgba(30, 58, 95, 0.3);
            }
        `;
        document.head.appendChild(styleSheet);
        console.log('🎨 Estilos CSS agregados');
    }
}

console.log('📜 Script de contacto cargado completamente');