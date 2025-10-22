// admin-fixed.js - Versión corregida que evita bucles de carga
console.log('Cargando admin FIXED...');

// Prevenir múltiples inicializaciones
if (window.adminSystemActive) {
    console.log('Admin ya inicializado, usando instancia existente...');
} else {
    window.adminSystemActive = true;

    // Configuración de la API
    const API_CONFIG = {
        BASE_URL: 'http://consultoriaintegralsc.somee.com/api/Empleo',
        ADMIN_URL: 'http://consultoriaintegralsc.somee.com/api/Admin',
        TIMEOUT: 10000
    };

    // Variables globales
    let jobs = [];
    let filteredJobs = [];
    let editingJobId = null;
    let confirmAction = null;
    let isInitialized = false;
    let initPromise = null;

    // === FUNCIONES DE SESIÓN SIMPLIFICADAS ===
    function getSessionData() {
        try {
            if (window.adminSession && window.adminSession.expiresAt > Date.now()) {
                return window.adminSession;
            }

            const stored = localStorage.getItem('adminSession');
            if (stored) {
                const session = JSON.parse(stored);
                if (session && session.expiresAt > Date.now()) {
                    window.adminSession = session;
                    return session;
                }
            }
            return null;
        } catch (e) {
            console.error('Error obteniendo sesión:', e);
            return null;
        }
    }

    function isLoggedIn() {
        const session = getSessionData();
        return session !== null;
    }

    function logout() {
        try {
            window.adminSession = null;
            localStorage.removeItem('adminSession');
            sessionStorage.removeItem('adminSession');
            document.cookie = 'adminSession=; path=/; expires=Thu, 01 Jan 1970 00:00:00 UTC;';
            window.location.href = '/login';
        } catch (e) {
            console.error('Error en logout:', e);
            window.location.href = '/login';
        }
    }

    function esAdminPrincipal() {
        try {
            const session = getSessionData();
            if (!session) return false;

            // Verificación primaria: por flag
            if (session.esAdminPrincipal === true) {
                return true;
            }

            // Verificación secundaria: por username (backup)
            const adminPrincipales = ['admin', 'master', 'root'];
            if (adminPrincipales.includes(session.username?.toLowerCase())) {
                return true;
            }

            // Verificación terciaria: por rol
            if (session.rol === 'AdminPrincipal' || session.rol === 'SuperAdmin') {
                return true;
            }

            return false;
        } catch (error) {
            console.error('Error verificando admin principal:', error);
            return false;
        }
    }

    // Configurar visibilidad de elementos según permisos
    function configurarPermisos() {
        console.log('🔧 Configurando permisos de usuario...');

        const session = getSessionData();
        if (!session) {
            console.warn('No hay sesión activa');
            return;
        }

        const isPrincipal = esAdminPrincipal();
        console.log(`Usuario ${session.username}: ${isPrincipal ? 'ADMIN PRINCIPAL ✅' : 'Admin normal'}`);

        // Configurar botón de administradores
        const botonAdministradores = document.querySelector('.btn-administradores');
        if (botonAdministradores) {
            if (isPrincipal) {
                botonAdministradores.style.display = 'inline-block';
                botonAdministradores.style.visibility = 'visible';
                botonAdministradores.style.opacity = '1';
                botonAdministradores.disabled = false;
                console.log('✅ Botón Administradores: VISIBLE');
            } else {
                botonAdministradores.style.display = 'none';
                botonAdministradores.style.visibility = 'hidden';
                botonAdministradores.style.opacity = '0';
                botonAdministradores.disabled = true;
                console.log('🚫 Botón Administradores: OCULTO');
            }
        }

        // Agregar indicador visual en el header
        const welcomeElement = document.getElementById('adminWelcome');
        if (welcomeElement && isPrincipal) {
            const existingBadge = welcomeElement.querySelector('.badge-principal');
            if (!existingBadge) {
                const badge = document.createElement('span');
                badge.className = 'badge-principal';
                badge.textContent = '👑 Principal';
                badge.style.cssText = `
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                color: white;
                padding: 4px 12px;
                border-radius: 12px;
                font-size: 0.75em;
                margin-left: 10px;
                font-weight: 600;
                box-shadow: 0 2px 8px rgba(102, 126, 234, 0.3);
            `;
                welcomeElement.appendChild(badge);
            }
        }
    }

    // Función segura para abrir modal de administradores
    window.openAdministradoresModalSeguro = function () {
        console.log('🔐 Verificando permisos para gestión de administradores...');

        if (!esAdminPrincipal()) {
            console.warn('⛔ Acceso denegado: No eres administrador principal');

            showError('⛔ Acceso Denegado\n\nSolo el administrador principal puede gestionar otros administradores del sistema.');

            return;
        }

        console.log('✅ Permiso concedido, abriendo modal...');

        if (window.openAdministradoresModal && typeof window.openAdministradoresModal === 'function') {
            window.openAdministradoresModal();
        } else {
            console.error('❌ openAdministradoresModal no disponible');
            showError('Error: Módulo de administradores no cargado.');
        }
    };

    // === FUNCIONES DE API CORREGIDAS ===
    async function apiRequest(url, options = {}) {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), API_CONFIG.TIMEOUT);

        try {
            console.log('API Request:', url, options.method || 'GET');

            // AGREGAR DEBUG para ver qué estamos enviando
            if (options.body) {
                console.log('Datos enviados:', options.body);
                try {
                    const parsed = JSON.parse(options.body);
                    console.log('Datos parseados:', parsed);
                } catch (e) {
                    console.log('Body no es JSON válido');
                }
            }

            const response = await fetch(url, {
                ...options,
                signal: controller.signal,
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                    ...options.headers
                }
            });

            clearTimeout(timeoutId);

            // MEJOR MANEJO DE ERRORES CON DETALLES
            if (!response.ok) {
                let errorMessage = `HTTP ${response.status} ${response.statusText}`;

                try {
                    const errorBody = await response.text();
                    if (errorBody) {
                        console.error('Error body:', errorBody);
                        errorMessage += `: ${errorBody}`;
                    }
                } catch (e) {
                    console.warn('No se pudo leer el cuerpo del error');
                }

                throw new Error(errorMessage);
            }

            const data = await response.json();
            console.log('Respuesta exitosa:', data);
            return data;
        } catch (error) {
            clearTimeout(timeoutId);

            if (error.name === 'AbortError') {
                throw new Error('Timeout - servidor lento');
            }
            throw error;
        }
    }

    // === FUNCIONES DE EMPLEOS CORREGIDAS ===
    async function loadJobs() {
        try {
            showLoading(true);
            console.log('Cargando empleos...');

            const data = await apiRequest(API_CONFIG.BASE_URL);
            jobs = Array.isArray(data) ? data : [];
            filteredJobs = [...jobs];

            console.log(`${jobs.length} empleos cargados`);
            renderJobs();
            updateStats();

            showSuccessMessage(`${jobs.length} empleos cargados`);
        } catch (error) {
            console.error('Error cargando empleos:', error);
            showError(`Error: ${error.message}`);

            jobs = [];
            filteredJobs = [];
            renderJobs();
            updateStats();
        } finally {
            showLoading(false);
        }
    }

    // === FUNCIONES DE RENDERIZADO ===
    function renderJobs() {
        const grid = document.getElementById('jobsGrid');
        if (!grid) return;

        if (filteredJobs.length === 0) {
            grid.innerHTML = `
                <div class="no-jobs-message">
                    <h3>No hay empleos disponibles</h3>
                    <p>Agrega una nueva oportunidad laboral para comenzar.</p>
                    <button class="btn-add-job" onclick="openJobModal()">
                        Agregar Primera Oportunidad
                    </button>
                </div>
            `;
            return;
        }

        const fragment = document.createDocumentFragment();
        filteredJobs.forEach(job => {
            const card = createJobCard(job);
            fragment.appendChild(card);
        });

        grid.innerHTML = '';
        grid.appendChild(fragment);
    }

    function createJobCard(job) {
        const card = document.createElement('div');
        card.className = `job-card ${job.activo ? '' : 'inactive'}`;

        const createdDate = formatDate(job.fechaAlta);

        card.innerHTML = `
            <div class="status-indicator"></div>
            <div class="job-card-header">
                <div class="job-icon">${escapeHtml(job.icono || '💼')}</div>
                <div class="job-info">
                    <h3>${escapeHtml(job.titulo)}</h3>
                    <div class="job-level">${escapeHtml(job.nivel)}</div>
                </div>
            </div>
            
            ${job.area ? `<div class="job-area">📍 ${escapeHtml(job.area)}</div>` : ''}
            <div class="job-description">${escapeHtml(job.descripcion)}</div>
            
            <div class="job-meta">
                ${job.modalidad ? `<span>🏢 ${escapeHtml(job.modalidad)}</span>` : ''}
                ${job.salario ? `<span>💰 ${escapeHtml(job.salario)}</span>` : ''}
                <span>📅 ${createdDate}</span>
            </div>
            
            <div class="job-actions">
                <button class="btn-edit" onclick="editJob(${job.id})">
                    ✏️ Editar
                </button>
                <button class="btn-toggle" onclick="confirmToggleJob(${job.id})">
                    ${job.activo ? '⏸️ Desactivar' : '▶️ Activar'}
                </button>
                <button class="btn-delete" onclick="confirmDeleteJob(${job.id})">
                    🗑️ Eliminar
                </button>
            </div>
        `;

        return card;
    }

    function updateStats() {
        const totalElement = document.getElementById('totalJobs');
        const activeElement = document.getElementById('activeJobs');
        const inactiveElement = document.getElementById('inactiveJobs');
        const recentElement = document.getElementById('recentJobs');

        if (totalElement) totalElement.textContent = jobs.length;
        if (activeElement) activeElement.textContent = jobs.filter(j => j.activo).length;
        if (inactiveElement) inactiveElement.textContent = jobs.filter(j => !j.activo).length;
        if (recentElement) recentElement.textContent = 0;
    }

    // === FUNCIONES DE UI ===
    function showError(message) {
        const errorDiv = document.getElementById('errorMessage');
        const errorText = document.getElementById('errorText');
        if (errorDiv && errorText) {
            errorText.textContent = message;
            errorDiv.style.display = 'flex';
            setTimeout(() => hideError(), 8000);
        }
        console.error('Error:', message);
    }

    function hideError() {
        const errorDiv = document.getElementById('errorMessage');
        if (errorDiv) {
            errorDiv.style.display = 'none';
        }
    }

    function showSuccessMessage(message) {
        const successDiv = document.getElementById('successMessage');
        const successText = document.getElementById('successText');
        if (successDiv && successText) {
            successText.textContent = message;
            successDiv.style.display = 'block';
            setTimeout(() => successDiv.style.display = 'none', 4000);
        }
    }

    function showLoading(show) {
        const overlay = document.getElementById('loadingOverlay');
        if (overlay) {
            overlay.style.display = show ? 'flex' : 'none';
        }
    }

    // === FUNCIONES DE UTILIDAD ===
    function escapeHtml(text) {
        if (!text) return '';
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    function formatDate(dateString) {
        if (!dateString) return 'N/A';
        try {
            return new Date(dateString).toLocaleDateString('es-ES');
        } catch {
            return dateString;
        }
    }

    function displayAdminInfo() {
        const session = getSessionData();
        if (session) {
            const welcomeElement = document.getElementById('adminWelcome');
            if (welcomeElement) {
                const nombreMostrar = session.nombreCompleto || session.username;
                const isPrincipal = esAdminPrincipal();

                welcomeElement.textContent = `Bienvenido, ${nombreMostrar}`;

                // Agregar badge si es principal
                if (isPrincipal) {
                    const badge = document.createElement('span');
                    badge.className = 'badge-principal';
                    badge.textContent = '👑 Principal';
                    badge.style.cssText = `
                    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                    color: white;
                    padding: 4px 12px;
                    border-radius: 12px;
                    font-size: 0.75em;
                    margin-left: 10px;
                    font-weight: 600;
                    box-shadow: 0 2px 8px rgba(102, 126, 234, 0.3);
                `;
                    welcomeElement.appendChild(badge);
                }
            }
        }
    }

    // === FUNCIONES DE MODAL ===
    function openJobModal() {
        console.log('Abriendo modal de trabajo...');

        const modal = document.getElementById('jobModal');
        if (!modal) {
            console.error('Modal jobModal no encontrado');
            return;
        }

        try {
            // CORREGIR: Limpiar todos los estilos inline primero
            modal.removeAttribute('style');

            // Remover clases que podrían estar interfiriendo
            modal.classList.remove('modal-hidden', 'hiding');

            // Configurar estilos base del overlay
            modal.style.position = 'fixed';
            modal.style.top = '0';
            modal.style.left = '0';
            modal.style.right = '0';
            modal.style.bottom = '0';
            modal.style.width = '100vw';
            modal.style.height = '100vh';
            modal.style.backgroundColor = 'rgba(0, 0, 0, 0.8)';
            modal.style.zIndex = '1000000'; // Mayor que el modal de confirmación
            modal.style.display = 'flex';
            modal.style.justifyContent = 'center';
            modal.style.alignItems = 'center';
            modal.style.padding = '20px';
            modal.style.boxSizing = 'border-box';

            // Agregar clases para animación
            modal.classList.add('show', 'modal-active');

            // Configurar el contenido del modal
            const modalContent = modal.querySelector('.modal');
            if (modalContent) {
                modalContent.style.display = 'block';
                modalContent.style.visibility = 'visible';
                modalContent.style.opacity = '1';
                modalContent.style.position = 'relative';
                modalContent.style.zIndex = '1000001';
                modalContent.style.background = 'white';
                modalContent.style.borderRadius = '20px';
                modalContent.style.padding = '40px';
                modalContent.style.maxWidth = '600px';
                modalContent.style.width = '90%';
                modalContent.style.maxHeight = '90vh';
                modalContent.style.overflowY = 'auto';
                modalContent.style.boxShadow = '0 20px 60px rgba(0,0,0,0.5)';
            }

            // Resto del código...
            const form = document.getElementById('jobForm');
            if (form) {
                form.reset();
            }

            const titleElement = document.getElementById('modalTitle');
            if (titleElement) {
                titleElement.textContent = 'Agregar Nueva Oportunidad';
            }

            setupRequirementsContainer();
            editingJobId = null;

            // Reconfigurar emoji picker
            setTimeout(() => {
                try {
                    if (window.EmojiPicker) {
                        EmojiPicker.setupInput('jobIcon');
                    }
                } catch (error) {
                    console.error('Error reconfigurando EmojiPicker:', error);
                }
            }, 100);

            console.log('Modal abierto correctamente');

        } catch (error) {
            console.error('Error abriendo modal:', error);
            showError('Error abriendo el modal: ' + error.message);
        }
    }

    function closeJobModal() {
        console.log('Cerrando modal de trabajo...');

        const modal = document.getElementById('jobModal');
        if (modal) {
            modal.style.display = 'none';
            modal.classList.remove('show', 'modal-active');

            const form = document.getElementById('jobForm');
            if (form) {
                form.reset();
            }

            editingJobId = null;
        }
    }

    function closeAllModals() {
        console.log('Cerrando todos los modales...');

        // Cerrar modal de confirmación con animación específica
        closeConfirmModal();

        // Cerrar otros modales sin afectar las animaciones de confirmación
        const otherModals = ['jobModal', 'adminModal'];
        otherModals.forEach(modalId => {
            const modalElement = document.getElementById(modalId);
            if (modalElement) {
                modalElement.style.display = 'none';
                modalElement.classList.remove('show', 'modal-active');
            }
        });

        editingJobId = null;
    }

    function setupRequirementsContainer() {
        const container = document.getElementById('requirementsContainer');
        if (!container) return;

        if (container.children.length === 0) {
            const defaultRequirement = document.createElement('div');
            defaultRequirement.className = 'requirements-input';
            defaultRequirement.innerHTML = `
                <input type="text" placeholder="Ej: Licenciatura en Contaduría" style="flex: 1;">
                <button type="button" class="btn-add-requirement" onclick="addRequirement()" style="min-width: 50px; height: 50px;">+</button>
            `;
            container.appendChild(defaultRequirement);
        }
    }

    // === FUNCIÓN DE FORMULARIO CORREGIDA ===
    function handleJobFormSubmit(event) {
        event.preventDefault();
        console.log('=== ENVIANDO FORMULARIO DE TRABAJO ===');

        try {
            // PASO 1: OBTENER DATOS BÁSICOS DEL FORMULARIO
            const titulo = document.getElementById('jobTitle')?.value?.trim() || '';
            const icono = document.getElementById('jobIcon')?.value?.trim() || '💼';
            const nivel = document.getElementById('jobLevel')?.value || '';
            const area = document.getElementById('jobArea')?.value?.trim() || '';
            const modalidad = document.getElementById('jobModality')?.value || '';
            const salario = document.getElementById('jobSalary')?.value?.trim() || '';
            const descripcion = document.getElementById('jobDescription')?.value?.trim() || '';
            const activo = document.getElementById('jobStatus')?.value === 'true';

            console.log('Datos básicos del formulario:');
            console.log('- Título:', titulo);
            console.log('- Icono:', icono);
            console.log('- Nivel:', nivel);
            console.log('- Área:', area);
            console.log('- Modalidad:', modalidad);
            console.log('- Salario:', salario);
            console.log('- Descripción:', descripcion);
            console.log('- Activo:', activo);

            // PASO 2: RECOPILAR REQUISITOS DEL CONTENEDOR DINÁMICO
            const requirementInputs = document.querySelectorAll('#requirementsContainer input[type="text"]');
            console.log(`Encontrados ${requirementInputs.length} campos de requisitos`);

            const requisitos = [];
            requirementInputs.forEach((input, index) => {
                const value = input.value?.trim();
                console.log(`Requisito ${index + 1}: "${value}"`);

                if (value) {
                    requisitos.push(value);
                }
            });

            console.log('Requisitos recopilados:', requisitos);

            // PASO 3: CONVERTIR REQUISITOS A JSON
            let requisitosJson;
            try {
                requisitosJson = JSON.stringify(requisitos);
                console.log('Requisitos en JSON:', requisitosJson);
            } catch (jsonError) {
                console.error('Error creando JSON de requisitos:', jsonError);
                requisitosJson = '[]';
            }

            // PASO 4: VALIDACIONES DEL FRONTEND
            const errores = [];

            if (!titulo) {
                errores.push('El título del puesto es obligatorio');
            }
            if (!nivel) {
                errores.push('Selecciona un nivel para el puesto');
            }
            if (!descripcion) {
                errores.push('La descripción del puesto es obligatoria');
            } else if (descripcion.length < 20) {
                errores.push('La descripción debe tener al menos 20 caracteres');
            }

            if (errores.length > 0) {
                console.log('❌ Errores de validación frontend:', errores);
                showError('Errores de validación: ' + errores.join(', '));
                return;
            }

            // PASO 5: CREAR OBJETO DE DATOS FINAL
            const formData = {
                titulo: titulo,
                icono: icono,
                nivel: nivel,
                area: area,
                modalidad: modalidad,
                salario: salario,
                descripcion: descripcion,
                requisitos: requisitosJson,
                activo: activo
            };

            console.log('Datos finales del formulario:', formData);

            // PASO 6: DETERMINAR SI ES CREAR O ACTUALIZAR
            if (editingJobId) {
                console.log(`Actualizando trabajo ID: ${editingJobId}`);
                updateJob(editingJobId, formData);
            } else {
                console.log('Creando nuevo trabajo');
                createJob(formData);
            }

        } catch (error) {
            console.error('🔥 Error procesando formulario:', error);
            showError('Error procesando el formulario: ' + error.message);
        }
    }
    function addRequirement() {
        console.log('Agregando requisito...');

        const container = document.getElementById('requirementsContainer');
        if (!container) {
            console.error('Container de requisitos no encontrado');
            return;
        }

        const newRequirement = document.createElement('div');
        newRequirement.className = 'requirements-input';
        newRequirement.innerHTML = `
            <input type="text" placeholder="Ej: Experiencia en Excel" style="flex: 1;">
            <button type="button" class="btn-remove-requirement" onclick="removeRequirement(this)" style="min-width: 50px; height: 50px;">-</button>
        `;

        container.appendChild(newRequirement);
        console.log('Requisito agregado');
    }

    function removeRequirement(button) {
        console.log('Removiendo requisito...');

        const requirementDiv = button.parentElement;
        if (requirementDiv) {
            requirementDiv.remove();
            console.log('Requisito removido');
        }
    }

    function showConfirmModal(title, message, callback, confirmText = 'Confirmar', cancelText = 'Cancelar', iconType = 'warning') {
        console.log('Mostrando modal de confirmación específico...');

        const modal = document.getElementById('confirmModal');
        const titleElement = document.getElementById('confirmTitle');
        const messageElement = document.getElementById('confirmMessage');
        const confirmButton = document.getElementById('confirmButton');
        const cancelButton = modal.querySelector('.confirm-btn-cancel');
        const iconElement = document.getElementById('confirmIcon');
        const headerElement = document.getElementById('confirmModalHeader');

        if (!modal || !titleElement || !messageElement) {
            console.error('Elementos del modal de confirmación no encontrados');
            return;
        }

        try {
            // Configurar contenido
            titleElement.textContent = title;
            messageElement.textContent = message;
            confirmButton.textContent = confirmText;
            cancelButton.textContent = cancelText;

            // Configurar icono y colores según el tipo
            const iconConfig = {
                'warning': { icon: '⚠️', headerClass: '' },
                'danger': { icon: '🚨', headerClass: 'confirm-type-warning' },
                'delete': { icon: '🗑️', headerClass: 'confirm-type-delete' },
                'question': { icon: '❓', headerClass: 'confirm-type-info' },
                'info': { icon: 'ℹ️', headerClass: 'confirm-type-info' },
                'success': { icon: '✅', headerClass: 'confirm-type-success' }
            };

            const config = iconConfig[iconType] || iconConfig['warning'];
            iconElement.textContent = config.icon;

            // Limpiar clases anteriores del header
            headerElement.className = 'confirm-modal-header';
            if (config.headerClass) {
                headerElement.classList.add(config.headerClass);
            }

            // Configurar callback
            confirmAction = callback;

            // Mostrar modal con animaciones específicas
            modal.classList.remove('confirm-hiding');
            modal.style.display = 'flex';

            // Forzar reflow
            modal.offsetHeight;

            modal.classList.add('show');

            // Efecto de mouse específico para confirmación
            modal.addEventListener('mousemove', handleConfirmMouseMove);

            // Focus en cancelar por defecto
            setTimeout(() => {
                cancelButton.focus();
            }, 300);

            console.log('Modal de confirmación específico mostrado');

        } catch (error) {
            console.error('Error mostrando modal de confirmación:', error);
        }
    }


    function executeConfirmedAction() {
        console.log('Ejecutando acción confirmada específica...');

        if (confirmAction && typeof confirmAction === 'function') {
            const confirmButton = document.getElementById('confirmButton');

            try {
                // Agregar efecto de loading específico
                confirmButton.classList.add('confirm-loading');
                confirmButton.disabled = true; // Prevenir múltiples clics
                const originalText = confirmButton.textContent;
                confirmButton.textContent = '';

                // Ejecutar con delay para mostrar loading
                setTimeout(async () => {
                    try {
                        // EJECUTAR LA ACCIÓN DE FORMA ASÍNCRONA
                        await confirmAction();

                        // RESTAURAR BOTÓN ANTES DE CERRAR
                        confirmButton.classList.remove('confirm-loading');
                        confirmButton.disabled = false;
                        confirmButton.textContent = originalText;

                        // Cerrar modal después de restaurar
                        closeConfirmModal();
                        console.log('Acción ejecutada exitosamente');

                    } catch (error) {
                        console.error('Error ejecutando acción:', error);

                        // RESTAURAR BOTÓN EN CASO DE ERROR
                        confirmButton.classList.remove('confirm-loading');
                        confirmButton.disabled = false;
                        confirmButton.textContent = originalText;

                        showError('Error ejecutando la acción: ' + error.message);

                        // No cerrar el modal en caso de error para que el usuario pueda intentar de nuevo
                    }
                }, 200); // Reducir delay para mejor UX

            } catch (error) {
                console.error('Error preparando ejecución:', error);

                // RESTAURAR BOTÓN EN CASO DE ERROR DE PREPARACIÓN
                confirmButton.classList.remove('confirm-loading');
                confirmButton.disabled = false;
                confirmButton.textContent = 'Confirmar';
            }
        } else {
            console.log('No hay acción definida, cerrando modal');
            closeConfirmModal();
        }
    }

    function handleConfirmMouseMove(e) {
        const modal = e.currentTarget;
        const rect = modal.getBoundingClientRect();
        const x = ((e.clientX - rect.left) / rect.width) * 100;
        const y = ((e.clientY - rect.top) / rect.height) * 100;

        modal.style.setProperty('--x', x + '%');
        modal.style.setProperty('--y', y + '%');
    }

    // Event listeners específicos para el modal de confirmación
    document.addEventListener('DOMContentLoaded', function () {
        const confirmModal = document.getElementById('confirmModal');
        if (confirmModal) {
            // Cerrar con clic fuera del modal (solo confirmación)
            confirmModal.addEventListener('click', function (e) {
                if (e.target === this) {
                    closeConfirmModal();
                }
            });
        }

        // Manejar Escape solo para confirmación si es el único modal abierto
        document.addEventListener('keydown', function (e) {
            if (e.key === 'Escape') {
                const confirmModal = document.getElementById('confirmModal');
                if (confirmModal && confirmModal.classList.contains('show')) {
                    // Verificar si solo el modal de confirmación está abierto
                    const otherModalsOpen = ['jobModal', 'adminModal'].some(modalId => {
                        const modal = document.getElementById(modalId);
                        return modal && modal.classList.contains('show');
                    });

                    if (!otherModalsOpen) {
                        closeConfirmModal();
                    }
                }
            }
        });
    });

    function confirmDeleteJobSpecific(id) {
        const job = jobs.find(j => j.id === id);
        if (!job) return;

        showConfirmModal(
            'Eliminar Oportunidad',
            `¿Estás seguro de que quieres eliminar "${job.titulo}"? Esta acción no se puede deshacer.`,
            () => deleteJob(id),
            'Sí, eliminar',
            'Cancelar',
            'delete'
        );
    }

    function confirmToggleJobSpecific(id) {
        const job = jobs.find(j => j.id === id);
        if (!job) return;

        const action = job.activo ? 'desactivar' : 'activar';
        const actionCapitalized = action.charAt(0).toUpperCase() + action.slice(1);

        showConfirmModal(
            `${actionCapitalized} Oportunidad`,
            `¿Estás seguro de que quieres ${action} "${job.titulo}"?`,
            () => toggleJob(id),
            `Sí, ${action}`,
            'Cancelar',
            job.activo ? 'warning' : 'success'
        );
    }

    // Backward compatibility - mantener las funciones originales
    window.confirmDeleteJob = confirmDeleteJobSpecific;
    window.confirmToggleJob = confirmToggleJobSpecific;

    function handleModalClick(e) {
        if (e.target === e.currentTarget) {
            closeAllModals();
        }
    }

    function handleEscapeKey(e) {
        if (e.key === 'Escape') {
            closeAllModals();
        }
    }


    function closeConfirmModal() {
        console.log('Cerrando modal de confirmación específico...');

        const modal = document.getElementById('confirmModal');
        if (modal && modal.classList.contains('show')) {
            // LIMPIAR ESTADO DEL BOTÓN ANTES DE CERRAR
            const confirmButton = document.getElementById('confirmButton');
            if (confirmButton) {
                confirmButton.classList.remove('confirm-loading');
                confirmButton.disabled = false;
                confirmButton.textContent = 'Confirmar'; // Restaurar texto por defecto
            }

            // Animación de salida específica
            modal.classList.add('confirm-hiding');

            setTimeout(() => {
                modal.classList.remove('show', 'confirm-hiding');
                modal.style.display = 'none';
                modal.removeEventListener('mousemove', handleConfirmMouseMove);
            }, 300);
        }

        confirmAction = null;
    }

    // Función corregida para crear empleos - REEMPLAZAR en admin.js

    // FUNCIÓN MEJORADA PARA CREAR EMPLEOS - REEMPLAZAR en admin.js
async function createJob(jobData) {
    showLoading(true);
    try {
        console.log('=== CREANDO NUEVO TRABAJO ===');
        console.log('Datos originales recibidos:', jobData);

        if (!jobData) {
            throw new Error('Los datos del trabajo son requeridos');
        }

        // MEJORAR: Campos de auditoría con fechas en formato ISO completo
        const now = new Date();
        const cleanedData = {
            id: 0, // Siempre 0 para nuevos registros
            titulo: (jobData.titulo || '').trim(),
            icono: (jobData.icono || '💼').trim(),
            nivel: (jobData.nivel || '').trim(),
            area: (jobData.area || '').trim(),
            modalidad: (jobData.modalidad || '').trim(),
            salario: (jobData.salario || '').trim(),
            descripcion: (jobData.descripcion || '').trim(),
            requisitos: jobData.requisitos || '[]',
            activo: Boolean(jobData.activo),
            // FECHAS EN FORMATO ISO COMPLETO (no solo YYYY-MM-DD)
            usuarioAlta: 'admin',
            usuarioMod: 'admin', 
            fechaAlta: now.toISOString(),    // ISO completo: 2024-01-15T10:30:00.000Z
            fechaMod: now.toISOString()     // ISO completo: 2024-01-15T10:30:00.000Z
        };

        console.log('Datos limpiados CON fechas ISO completas:', cleanedData);
        console.log('FechaAlta ISO:', cleanedData.fechaAlta);
        console.log('FechaMod ISO:', cleanedData.fechaMod);

        // Resto de validaciones igual...
        const errores = [];
        if (!cleanedData.titulo) errores.push('El título es obligatorio');
        if (!cleanedData.nivel) errores.push('El nivel es obligatorio');
        if (!cleanedData.descripcion) errores.push('La descripción es obligatoria');
        else if (cleanedData.descripcion.length < 20) errores.push('La descripción debe tener al menos 20 caracteres');

        if (errores.length > 0) {
            throw new Error('Errores de validación: ' + errores.join(', '));
        }

        // Verificar JSON de requisitos
        try {
            if (cleanedData.requisitos && cleanedData.requisitos !== '[]') {
                JSON.parse(cleanedData.requisitos);
            }
            console.log('✓ JSON de requisitos válido');
        } catch (jsonError) {
            console.warn('⚠️ Requisitos no son JSON válido, corrigiendo...', jsonError);
            cleanedData.requisitos = '[]';
        }

        const requestOptions = {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            body: JSON.stringify(cleanedData)
        };

        console.log('JSON final a enviar:', requestOptions.body);

        const response = await fetch(API_CONFIG.BASE_URL, requestOptions);
        
        console.log(`Status: ${response.status} ${response.statusText}`);

        let responseText;
        try {
            responseText = await response.text();
            console.log('Respuesta del servidor:', responseText);
        } catch (readError) {
            console.error('Error leyendo respuesta:', readError);
            throw new Error('No se pudo leer la respuesta del servidor');
        }

        if (response.ok) {
            console.log('✅ Respuesta exitosa del servidor');
            
            let responseData;
            try {
                responseData = responseText ? JSON.parse(responseText) : null;
                console.log('Respuesta parseada:', responseData);
                
                // MEJORAR: Manejar diferentes formatos de respuesta exitosa
                let empleoCreado;
                if (responseData && responseData.data) {
                    empleoCreado = responseData.data; // Formato: { success: true, data: {...}, mensaje: "..." }
                } else if (responseData && responseData.id) {
                    empleoCreado = responseData; // Formato directo: { id: 1, titulo: "...", ... }
                } else {
                    empleoCreado = responseData;
                }
                
                if (empleoCreado && empleoCreado.id) {
                    console.log(`✅ Empleo creado con ID: ${empleoCreado.id}`);
                } else {
                    console.log('⚠️ Respuesta exitosa pero sin ID visible:', empleoCreado);
                }
                
            } catch (parseError) {
                console.error('Error parseando respuesta JSON:', parseError);
                console.log('Respuesta que causó error:', responseText);
                
                // Si no se puede parsear pero el status es OK, asumir éxito
                if (response.status >= 200 && response.status < 300) {
                    console.log('✅ Asumiendo éxito por status code OK');
                }
            }

            showSuccessMessage('Oportunidad laboral creada exitosamente');
            closeJobModal();
            await loadJobs();
            console.log('=== FIN CREAR TRABAJO (ÉXITO) ===');

        } else {
            console.log('❌ Error en la respuesta del servidor');
            
            let errorMessage = `Error HTTP ${response.status}`;
            
            try {
                const errorData = responseText ? JSON.parse(responseText) : null;
                console.log('Error del servidor parseado:', errorData);
                
                if (errorData) {
                    if (errorData.errors) {
                        // Errores de validación de ASP.NET Core
                        const errorMessages = [];
                        Object.keys(errorData.errors).forEach(field => {
                            const fieldErrors = errorData.errors[field];
                            if (Array.isArray(fieldErrors)) {
                                fieldErrors.forEach(err => {
                                    errorMessages.push(`${field}: ${err}`);
                                });
                            }
                        });
                        errorMessage = errorMessages.length > 0 ? errorMessages.join(', ') : errorData.title || errorMessage;
                    } else if (errorData.errores && Array.isArray(errorData.errores)) {
                        errorMessage = errorData.errores.join(', ');
                    } else if (errorData.error) {
                        errorMessage = errorData.error;
                        if (errorData.detalle) {
                            errorMessage += ': ' + errorData.detalle;
                        }
                    } else if (errorData.title) {
                        errorMessage = errorData.title;
                    }
                }
            } catch (parseError) {
                console.error('Error parseando respuesta de error:', parseError);
                errorMessage = `${errorMessage}: ${responseText}`;
            }

            console.log('=== FIN CREAR TRABAJO (ERROR) ===');
            throw new Error(errorMessage);
        }

    } catch (networkError) {
        console.error('🔥 Error de red o excepción:', networkError);

        let errorMessage = 'Error creando la oportunidad laboral';

        if (networkError.name === 'TypeError' && networkError.message.includes('fetch')) {
            errorMessage = 'Error de conexión. Verifica tu conexión a internet.';
        } else if (networkError.name === 'AbortError') {
            errorMessage = 'La petición fue cancelada por timeout.';
        } else {
            errorMessage = networkError.message || errorMessage;
        }

        console.log('=== FIN CREAR TRABAJO (ERROR DE RED) ===');
        showError(errorMessage);

    } finally {
        showLoading(false);
    }
}
    async function updateJob(id, jobData) {
        showLoading(true);
        try {
            console.log('=== ACTUALIZANDO TRABAJO ===');
            console.log('ID:', id);
            console.log('Datos originales recibidos:', jobData);

            if (!jobData) {
                throw new Error('Los datos del trabajo son requeridos');
            }

            if (!id || id <= 0) {
                throw new Error('ID del trabajo es requerido para actualización');
            }

            // LIMPIAR Y NORMALIZAR DATOS + AGREGAR CAMPOS DE AUDITORÍA
            const cleanedData = {
                id: parseInt(id), // ID del registro a actualizar
                titulo: (jobData.titulo || '').trim(),
                icono: (jobData.icono || '💼').trim(),
                nivel: (jobData.nivel || '').trim(),
                area: (jobData.area || '').trim(),
                modalidad: (jobData.modalidad || '').trim(),
                salario: (jobData.salario || '').trim(),
                descripcion: (jobData.descripcion || '').trim(),
                requisitos: jobData.requisitos || '[]',
                activo: Boolean(jobData.activo),
                // *** CAMPOS DE AUDITORÍA REQUERIDOS PARA UPDATE ***
                usuarioMod: 'admin',  // Campo requerido para modificación
                fechaMod: new Date().toISOString(),   // Fecha actual en ISO
                // Nota: usuarioAlta y fechaAlta se mantienen desde la base de datos
                usuarioAlta: 'admin', // Incluir por si acaso
                fechaAlta: new Date().toISOString() // Incluir por si acaso
            };

            console.log('Datos limpiados para actualización:', cleanedData);

            // Validaciones (mismas que en create)
            const errores = [];
            if (!cleanedData.titulo) errores.push('El título es obligatorio');
            if (!cleanedData.nivel) errores.push('El nivel es obligatorio');
            if (!cleanedData.descripcion) errores.push('La descripción es obligatoria');
            else if (cleanedData.descripcion.length < 20) errores.push('La descripción debe tener al menos 20 caracteres');

            if (errores.length > 0) {
                throw new Error('Errores de validación: ' + errores.join(', '));
            }

            // Verificar JSON de requisitos
            try {
                if (cleanedData.requisitos && cleanedData.requisitos !== '[]') {
                    JSON.parse(cleanedData.requisitos);
                }
            } catch (jsonError) {
                console.warn('⚠️ Requisitos no son JSON válido, corrigiendo...', jsonError);
                cleanedData.requisitos = '[]';
            }

            console.log('Datos finales para actualización:', cleanedData);

            const requestOptions = {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                },
                body: JSON.stringify(cleanedData)
            };

            console.log(`🌐 Enviando PUT a: ${API_CONFIG.BASE_URL}`);
            console.log('Body PUT:', requestOptions.body);

            const response = await fetch(API_CONFIG.BASE_URL, requestOptions);
            const responseText = await response.text();

            console.log(`📡 PUT Status: ${response.status}`);
            console.log(`📡 PUT Response:`, responseText);

            if (response.ok) {
                console.log('✅ Trabajo actualizado exitosamente');
                showSuccessMessage('Oportunidad laboral actualizada exitosamente');
                closeJobModal();
                await loadJobs();
            } else {
                let errorMessage = `Error HTTP ${response.status}`;

                try {
                    const errorData = responseText ? JSON.parse(responseText) : null;
                    if (errorData && errorData.errors) {
                        const errorMessages = [];
                        Object.keys(errorData.errors).forEach(field => {
                            const fieldErrors = errorData.errors[field];
                            if (Array.isArray(fieldErrors)) {
                                fieldErrors.forEach(err => {
                                    errorMessages.push(`${field}: ${err}`);
                                });
                            }
                        });
                        errorMessage = errorMessages.length > 0 ? errorMessages.join(', ') : errorData.title || errorMessage;
                    }
                } catch (parseError) {
                    errorMessage = `${errorMessage}: ${responseText}`;
                }

                throw new Error(errorMessage);
            }

        } catch (error) {
            console.error('🔥 Error actualizando trabajo:', error);
            showError(`Error actualizando la oportunidad: ${error.message}`);
        } finally {
            showLoading(false);
        }
    }

    function editJob(id) {
        const job = jobs.find(j => j.id === id);
        if (!job) {
            showError('Trabajo no encontrado');
            return;
        }

        console.log('Editando trabajo:', job);

        try {
            // PASO 1: ABRIR EL MODAL PRIMERO (sin configurar como nuevo)
            const modal = document.getElementById('jobModal');
            if (!modal) {
                console.error('Modal jobModal no encontrado');
                return;
            }

            // Limpiar y configurar el modal para mostrar
            modal.removeAttribute('style');
            modal.classList.remove('modal-hidden', 'hiding');

            modal.style.position = 'fixed';
            modal.style.top = '0';
            modal.style.left = '0';
            modal.style.right = '0';
            modal.style.bottom = '0';
            modal.style.width = '100vw';
            modal.style.height = '100vh';
            modal.style.backgroundColor = 'rgba(0, 0, 0, 0.8)';
            modal.style.zIndex = '1000000';
            modal.style.display = 'flex';
            modal.style.justifyContent = 'center';
            modal.style.alignItems = 'center';
            modal.style.padding = '20px';
            modal.style.boxSizing = 'border-box';

            modal.classList.add('show', 'modal-active');

            const modalContent = modal.querySelector('.modal');
            if (modalContent) {
                modalContent.style.display = 'block';
                modalContent.style.visibility = 'visible';
                modalContent.style.opacity = '1';
                modalContent.style.position = 'relative';
                modalContent.style.zIndex = '1000001';
                modalContent.style.background = 'white';
                modalContent.style.borderRadius = '20px';
                modalContent.style.padding = '40px';
                modalContent.style.maxWidth = '600px';
                modalContent.style.width = '90%';
                modalContent.style.maxHeight = '90vh';
                modalContent.style.overflowY = 'auto';
                modalContent.style.boxShadow = '0 20px 60px rgba(0,0,0,0.5)';
            }

            // PASO 2: CONFIGURAR COMO EDICIÓN ANTES DE LLENAR CAMPOS
            editingJobId = id;
            document.getElementById('modalTitle').textContent = 'Editar Oportunidad Laboral';

            // PASO 3: LLENAR LOS CAMPOS DEL FORMULARIO CON LOS DATOS EXISTENTES
            document.getElementById('jobTitle').value = job.titulo || '';
            document.getElementById('jobIcon').value = job.icono || '';
            document.getElementById('jobLevel').value = job.nivel || '';
            document.getElementById('jobArea').value = job.area || '';
            document.getElementById('jobModality').value = job.modalidad || '';
            document.getElementById('jobSalary').value = job.salario || '';
            document.getElementById('jobDescription').value = job.descripcion || '';
            document.getElementById('jobStatus').value = job.activo ? 'true' : 'false';

            // PASO 4: CONFIGURAR REQUISITOS
            const container = document.getElementById('requirementsContainer');
            if (container) {
                container.innerHTML = ''; // Limpiar primero

                let requisitos = [];
                try {
                    if (job.requisitos && job.requisitos !== '[]') {
                        requisitos = JSON.parse(job.requisitos);
                    }
                } catch {
                    // Si no es JSON válido, intentar separar por líneas
                    if (job.requisitos) {
                        requisitos = job.requisitos.split('\n').filter(r => r.trim());
                    }
                }

                if (requisitos.length === 0) {
                    // Si no hay requisitos, agregar un campo vacío
                    const div = document.createElement('div');
                    div.className = 'requirements-input';
                    div.innerHTML = `
                    <input type="text" placeholder="Ej: Licenciatura en Contaduría" style="flex: 1;">
                    <button type="button" class="btn-add-requirement" onclick="addRequirement()" style="min-width: 50px; height: 50px;">+</button>
                `;
                    container.appendChild(div);
                } else {
                    // Crear campos para cada requisito existente
                    requisitos.forEach((req, index) => {
                        const div = document.createElement('div');
                        div.className = 'requirements-input';
                        div.innerHTML = `
                        <input type="text" value="${escapeHtml(req)}" placeholder="Requisito" style="flex: 1;">
                        ${index === 0 ?
                                '<button type="button" class="btn-add-requirement" onclick="addRequirement()" style="min-width: 50px; height: 50px;">+</button>' :
                                '<button type="button" class="btn-remove-requirement" onclick="removeRequirement(this)" style="min-width: 50px; height: 50px;">-</button>'
                            }
                    `;
                        container.appendChild(div);
                    });
                }
            }

            // PASO 5: CONFIGURAR EMOJI PICKER DESPUÉS DE QUE EL MODAL ESTÉ VISIBLE
            setTimeout(() => {
                try {
                    if (window.EmojiPicker) {
                        EmojiPicker.setupInput('jobIcon');
                        console.log('EmojiPicker reconfigurado para edición');
                    }
                } catch (error) {
                    console.error('Error reconfigurando EmojiPicker:', error);
                }
            }, 200);

            console.log('Modal de edición configurado correctamente para ID:', id);

        } catch (error) {
            console.error('Error configurando edición:', error);
            showError('Error configurando la edición: ' + error.message);
        }
    }

    // FUNCIÓN SEPARADA PARA ABRIR MODAL NUEVO (sin datos)
    function openJobModal() {
        console.log('Abriendo modal para NUEVO trabajo...');

        const modal = document.getElementById('jobModal');
        if (!modal) {
            console.error('Modal jobModal no encontrado');
            return;
        }

        try {
            // Configurar modal para mostrar (misma lógica que en editJob pero sin llenar datos)
            modal.removeAttribute('style');
            modal.classList.remove('modal-hidden', 'hiding');

            modal.style.position = 'fixed';
            modal.style.top = '0';
            modal.style.left = '0';
            modal.style.right = '0';
            modal.style.bottom = '0';
            modal.style.width = '100vw';
            modal.style.height = '100vh';
            modal.style.backgroundColor = 'rgba(0, 0, 0, 0.8)';
            modal.style.zIndex = '1000000';
            modal.style.display = 'flex';
            modal.style.justifyContent = 'center';
            modal.style.alignItems = 'center';
            modal.style.padding = '20px';
            modal.style.boxSizing = 'border-box';

            modal.classList.add('show', 'modal-active');

            const modalContent = modal.querySelector('.modal');
            if (modalContent) {
                modalContent.style.display = 'block';
                modalContent.style.visibility = 'visible';
                modalContent.style.opacity = '1';
                modalContent.style.position = 'relative';
                modalContent.style.zIndex = '1000001';
                modalContent.style.background = 'white';
                modalContent.style.borderRadius = '20px';
                modalContent.style.padding = '40px';
                modalContent.style.maxWidth = '600px';
                modalContent.style.width = '90%';
                modalContent.style.maxHeight = '90vh';
                modalContent.style.overflowY = 'auto';
                modalContent.style.boxShadow = '0 20px 60px rgba(0,0,0,0.5)';
            }

            // CONFIGURAR COMO NUEVO (sin ID de edición)
            editingJobId = null;
            document.getElementById('modalTitle').textContent = 'Agregar Nueva Oportunidad';

            // LIMPIAR FORMULARIO
            const form = document.getElementById('jobForm');
            if (form) {
                form.reset();
            }

            // CONFIGURAR CONTENEDOR DE REQUISITOS VACÍO
            setupRequirementsContainer();

            // CONFIGURAR EMOJI PICKER
            setTimeout(() => {
                try {
                    if (window.EmojiPicker) {
                        EmojiPicker.setupInput('jobIcon');
                        console.log('EmojiPicker configurado para nuevo trabajo');
                    }
                } catch (error) {
                    console.error('Error configurando EmojiPicker:', error);
                }
            }, 200);

            console.log('Modal para nuevo trabajo abierto correctamente');

        } catch (error) {
            console.error('Error abriendo modal para nuevo trabajo:', error);
            showError('Error abriendo el modal: ' + error.message);
        }
    }

    async function toggleJob(id) {
        const job = jobs.find(j => j.id === id);
        if (!job) {
            const error = new Error('Trabajo no encontrado');
            showError(error.message);
            throw error;
        }

        showLoading(true);
        try {
            // Crear objeto actualizado
            const updatedJob = {
                ...job,
                activo: !job.activo,
                usuarioMod: 'admin',
                fechaMod: new Date().toISOString()
            };

            await apiRequest(API_CONFIG.BASE_URL, {
                method: 'PUT',
                body: JSON.stringify(updatedJob)
            });

            const action = updatedJob.activo ? 'activado' : 'desactivado';
            showSuccessMessage(`Trabajo ${action} exitosamente`);
            await loadJobs();

        } catch (error) {
            console.error('Error toggling trabajo:', error);
            showError(`Error cambiando el estado: ${error.message}`);
            throw error; // Re-lanzar para que executeConfirmedAction lo maneje
        } finally {
            showLoading(false);
        }
    }

    async function deleteJob(id) {
        console.log('=== ELIMINANDO TRABAJO ID:', id, '===');

        if (!id || id <= 0) {
            const error = new Error('ID de trabajo inválido');
            showError(error.message);
            throw error;
        }

        showLoading(true);
        try {
            console.log(`Enviando DELETE a: ${API_CONFIG.BASE_URL}/${id}`);

            const response = await fetch(`${API_CONFIG.BASE_URL}/${id}`, {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                }
            });

            console.log(`DELETE Response status: ${response.status}`);

            if (!response.ok) {
                let errorMessage = `Error HTTP ${response.status}`;
                try {
                    const errorBody = await response.text();
                    if (errorBody) {
                        errorMessage += `: ${errorBody}`;
                    }
                } catch (e) {
                    console.warn('No se pudo leer el error del servidor');
                }
                throw new Error(errorMessage);
            }

            console.log('✅ Trabajo eliminado exitosamente');
            showSuccessMessage('Oportunidad eliminada exitosamente');
            await loadJobs();

        } catch (error) {
            console.error('🔥 Error eliminando trabajo:', error);
            const errorMessage = error.message || 'Error desconocido eliminando la oportunidad';
            showError(`Error eliminando la oportunidad: ${errorMessage}`);
            throw error; // Re-lanzar para que executeConfirmedAction lo maneje
        } finally {
            showLoading(false);
        }
    }

    function confirmToggleJob(id) {
        const job = jobs.find(j => j.id === id);
        if (!job) return;

        const action = job.activo ? 'desactivar' : 'activar';
        const title = `${action.charAt(0).toUpperCase() + action.slice(1)} Oportunidad`;
        const message = `¿Estás seguro de que quieres ${action} "${job.titulo}"?`;

        showConfirmModal(title, message, async () => {
            await toggleJob(id);
        }, `Sí, ${action}`, 'Cancelar', job.activo ? 'warning' : 'success');
    }

    function confirmDeleteJob(id) {
        const job = jobs.find(j => j.id === id);
        if (!job) return;

        const title = 'Eliminar Oportunidad';
        const message = `¿Estás seguro de que quieres eliminar "${job.titulo}"? Esta acción no se puede deshacer.`;

        showConfirmModal(title, message, async () => {
            await deleteJob(id);
        }, 'Sí, eliminar', 'Cancelar', 'delete');
    }

    function showStats() {
        const panel = document.getElementById('statsPanel');
        if (panel) {
            panel.style.display = panel.style.display === 'none' ? 'block' : 'none';
        }
    }

    function showAdminManager() {
    console.log('Abriendo gestión de administradores...');
    
    // Llamar a la función del módulo admin-users.js
    if (window.showAdminManager && typeof window.showAdminManager === 'function') {
        // Ya existe la función correcta, no hacer nada
        return;
    }
    
    // Si no existe, intentar abrir el modal manualmente
    const modal = document.getElementById('adminModal');
    if (modal) {
        modal.style.display = 'flex';
        
        // Cargar lista de administradores si existe la función
        setTimeout(() => {
            if (window.loadAdminsList && typeof window.loadAdminsList === 'function') {
                window.loadAdminsList();
            } else {
                console.error('loadAdminsList no está disponible');
                showError('Módulo de administradores no cargado. Recarga la página.');
            }
        }, 100);
    } else {
        console.error('Modal adminModal no encontrado');
        showError('Modal de administradores no encontrado');
    }
}

    function filterJobs() {
        const levelFilter = document.getElementById('filterLevel')?.value;
        const statusFilter = document.getElementById('filterStatus')?.value;

        filteredJobs = jobs.filter(job => {
            let levelMatch = !levelFilter || job.nivel === levelFilter;
            let statusMatch = !statusFilter ||
                (statusFilter === 'active' && job.activo) ||
                (statusFilter === 'inactive' && !job.activo);

            return levelMatch && statusMatch;
        });

        renderJobs();
    }

    // === EVENT LISTENERS COMPLETOS ===
    function setupEventListeners() {
        console.log('Configurando event listeners completos...');

        const jobForm = document.getElementById('jobForm');
        if (jobForm) {
            jobForm.removeEventListener('submit', handleJobFormSubmit);
            jobForm.addEventListener('submit', handleJobFormSubmit);
            console.log('Form listener configurado');
        }

        try {
            EmojiPicker.init();
            EmojiPicker.setupInput('jobIcon');
            console.log('EmojiPicker configurado para jobIcon');
        } catch (error) {
            console.error('Error configurando EmojiPicker:', error);
        }

        document.removeEventListener('keydown', handleEscapeKey);
        document.addEventListener('keydown', handleEscapeKey);

        const modals = ['jobModal', 'adminModal', 'confirmModal'];
        modals.forEach(modalId => {
            const modal = document.getElementById(modalId);
            if (modal) {
                modal.removeEventListener('click', handleModalClick);
                modal.addEventListener('click', handleModalClick);
            }
        });

        console.log('Event listeners configurados correctamente');
    }

    // === FUNCIONES GLOBALES COMPLETAS ===
    window.logout = logout;
    window.isLoggedIn = isLoggedIn;
    window.getSessionData = getSessionData;
    window.openJobModal = openJobModal;
    window.closeJobModal = closeJobModal;
    window.loadJobs = loadJobs;
    window.hideError = hideError;
    window.editJob = editJob;
    window.confirmToggleJob = confirmToggleJob;
    window.confirmDeleteJob = confirmDeleteJob;
    window.executeConfirmedAction = executeConfirmedAction;
    window.closeAllModals = closeAllModals;
    window.showStats = showStats;
    window.showAdminManager = showAdminManager;
    window.filterJobs = filterJobs;
    window.addRequirement = addRequirement;
    window.removeRequirement = removeRequirement;

    // === INICIALIZACIÓN MEJORADA ===
    async function initializeAdmin() {
        if (isInitialized) {
            console.log('Admin ya inicializado');
            return true;
        }

        if (initPromise) {
            console.log('Inicialización en progreso, esperando...');
            return await initPromise;
        }

        initPromise = (async () => {
            try {
                console.log('Iniciando admin...');

                if (!isLoggedIn()) {
                    console.log('No autenticado, redirigiendo...');
                    logout();
                    return false;
                }

                isInitialized = true;

                // Mostrar información del admin
                displayAdminInfo();

                // ✅ CONFIGURAR PERMISOS (NUEVO)
                configurarPermisos();

                // Configurar event listeners
                setupEventListeners();

                // Cargar empleos
                const loadPromise = loadJobs();
                const timeoutPromise = new Promise((_, reject) =>
                    setTimeout(() => reject(new Error('Timeout inicial')), 8000)
                );

                try {
                    await Promise.race([loadPromise, timeoutPromise]);
                } catch (timeoutError) {
                    console.warn('Timeout cargando empleos, continuando...');
                    showError('Timeout cargando datos. Intenta actualizar.');
                }

                console.log('Admin inicializado correctamente');
                return true;

            } catch (error) {
                console.error('Error inicializando admin:', error);
                showError(`Error de inicialización: ${error.message}`);
                return false;
            }
        })();

        return await initPromise;
    }

    // === INICIALIZACIÓN AUTOMÁTICA ===
    function startAdmin() {
        console.log('Iniciando admin automáticamente...');

        if (!window.location.pathname.includes('/admin')) {
            console.log('No estamos en página de admin');
            return;
        }

        setTimeout(async () => {
            try {
                await initializeAdmin();
            } catch (error) {
                console.error('Error en inicialización automática:', error);
                showError('Error iniciando el panel. Recarga la página.');
            }
        }, 500);
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', startAdmin);
    } else {
        startAdmin();
    }

    console.log('Admin script cargado correctamente');

    // Funciones globales para compatibilidad (definidas ANTES que el objeto EmojiPicker)
    window.toggleEmojiPicker = function (inputId) {
        if (window.EmojiPicker) return EmojiPicker.toggle(inputId);
        console.warn('EmojiPicker no está listo');
    };

    window.closeEmojiPicker = function () {
        if (window.EmojiPicker) return EmojiPicker.close();
        console.warn('EmojiPicker no está listo');
    };

    window.showEmojiCategory = function (category) {
        if (window.EmojiPicker) return EmojiPicker.showCategory(category);
        console.warn('EmojiPicker no está listo');
    };

    window.searchEmojis = function (query) {
        if (window.EmojiPicker) return EmojiPicker.search(query);
        console.warn('EmojiPicker no está listo');
    };

    // Nuevas funciones globales para manejo de modales
    window.reconfigureEmojiPickers = function () {
        if (window.EmojiPicker) return EmojiPicker.reconfigure();
        console.warn('EmojiPicker no está listo');
    };

    window.cleanupEmojiPickers = function () {
        if (window.EmojiPicker) return EmojiPicker.cleanup();
        console.warn('EmojiPicker no está listo');
    };

    window.reinitEmojiPickers = function () {
        if (window.EmojiPicker) {
            EmojiPicker.cleanup();
            setTimeout(() => {
                EmojiPicker.reconfigure();
            }, 100);
        } else {
            console.warn('EmojiPicker no está listo');
        }
    };

    // === SELECTOR DE EMOJIS COMPLETO ===
    const EmojiPicker = {
        categories: {
            work: [
                '💼', '👔', '🧮', '📊', '📈', '📉', '💻', '🖥️',
                '📱', '⌨️', '🖨️', '📠', '📞', '📧', '📝', '✏️',
                '📋', '📁', '📂', '🗂️', '📄', '📃', '📑', '🗃️',
                '🏢', '🏦', '🏪', '🏬', '🏭', '🏛️', '🎯', '📌',
                '📍', '🔍', '🔎', '🔐', '🔒', '🔓', '🗝️', '⚖️',
                '💰', '💵', '💸', '💳', '💎', '⚡', '🔋', '🔌'
            ],
            people: [
                '😊', '😃', '😄', '😁', '😆', '😅', '🤣', '😂',
                '🙂', '🙃', '😉', '😇', '🥰', '😍', '🤩', '😘',
                '😗', '☺️', '😚', '😙', '🥲', '😋', '😛', '😜',
                '🤪', '😝', '🤑', '🤗', '🤭', '🤫', '🤔', '🤐',
                '👨‍💼', '👩‍💼', '👨‍💻', '👩‍💻', '👨‍🔧', '👩‍🔧',
                '👨‍🎓', '👩‍🎓', '👨‍🏫', '👩‍🏫', '👨‍⚖️', '👩‍⚖️'
            ],
            objects: [
                '🔧', '🔨', '⚒️', '🛠️', '⚙️', '🗜️', '⚗️', '🧪',
                '🧬', '🔬', '📡', '💡', '🔋', '🔌', '💾', '💿',
                '📀', '🧮', '📏', '📐', '✂️', '📎', '🖇️', '📍',
                '📌', '🗞️', '📰', '📓', '📔', '📒', '📕', '📗',
                '📘', '📙', '📚', '📖', '🔖', '🧾', '📋', '📊',
                '🖊️', '🖋️', '✒️', '🖌️', '🖍️', '📝', '💼', '👜'
            ],
            symbols: [
                '🔢', '🔣', '📶', '🔄', '🔃', '🔀', '🔁', '🔂',
                '▶️', '⏸️', '⏹️', '⏺️', '⏭️', '⏮️', '⏩', '⏪',
                '⏫', '⏬', '◀️', '🔼', '🔽', '➡️', '⬅️', '⬆️',
                '⬇️', '↗️', '↘️', '↙️', '↖️', '↕️', '↔️', '↪️',
                '↩️', '⤴️', '⤵️', '🎯', '✅', '❌', '⭐', '🌟',
                '💫', '⚡', '💥', '🔥', '💯', '✨', '🚀', '🎉'
            ],
            recent: []
        },

        currentCategory: 'work',
        isOpen: false,
        targetInput: null,

        init() {
            // Cargar emojis recientes del localStorage
            const saved = localStorage.getItem('recentEmojis');
            if (saved) {
                try {
                    this.categories.recent = JSON.parse(saved);
                } catch (e) {
                    console.warn('Error cargando emojis recientes:', e);
                }
            }

            // Configurar todos los inputs de emoji existentes
            this.setupAllEmojiInputs();

            // Observador para detectar cuando se agregan nuevos elementos al DOM
            this.setupMutationObserver();

            console.log('EmojiPicker inicializado');
        },

        setupMutationObserver() {
            // Observador para detectar cambios en el DOM
            const observer = new MutationObserver((mutations) => {
                let needsSetup = false;

                mutations.forEach((mutation) => {
                    if (mutation.type === 'childList') {
                        mutation.addedNodes.forEach((node) => {
                            if (node.nodeType === 1) { // Elemento
                                // Verificar si el nodo agregado contiene inputs de emoji
                                const emojiInputs = node.querySelectorAll ?
                                    node.querySelectorAll('.emoji-input') : [];

                                if (emojiInputs.length > 0 || node.classList?.contains('emoji-input')) {
                                    needsSetup = true;
                                }
                            }
                        });
                    }
                });

                if (needsSetup) {
                    console.log('DOM cambió, reconfigurando emoji pickers...');
                    setTimeout(() => {
                        this.setupAllEmojiInputs();
                    }, 100);
                }
            });

            // Observar cambios en todo el document
            observer.observe(document.body, {
                childList: true,
                subtree: true
            });

            console.log('Observador de mutaciones configurado');
        },

        setupAllEmojiInputs() {
            const inputs = document.querySelectorAll('.emoji-input');
            console.log(`Configurando ${inputs.length} emoji inputs...`);

            inputs.forEach((input, index) => {
                if (input.id) {
                    this.setupInput(input.id);
                } else {
                    // Si no tiene ID, crear uno
                    const newId = `emoji-input-${Date.now()}-${index}`;
                    input.id = newId;
                    this.setupInput(newId);
                }
            });
        },

        createPickerHTML() {
            return `
<div class="emoji-picker-popup">
    <div class="emoji-picker-header">
        <span>Seleccionar Emoji</span>
        <button type="button" class="emoji-picker-close">×</button>
    </div>
    
    <input type="text" class="emoji-search" placeholder="Buscar emoji...">
    
    <div class="emoji-categories">
        <button type="button" class="emoji-category-tab active" data-category="work">💼</button>
        <button type="button" class="emoji-category-tab" data-category="people">😊</button>
        <button type="button" class="emoji-category-tab" data-category="objects">🔧</button>
        <button type="button" class="emoji-category-tab" data-category="symbols">🔢</button>
        <button type="button" class="emoji-category-tab" data-category="recent">⏰</button>
    </div>
    
    <div class="emoji-grid-container">
        <div class="emoji-grid">
            <!-- Los emojis se cargan aquí -->
        </div>
    </div>
</div>
`;
        },

        setupInput(inputId) {
            const input = document.getElementById(inputId);
            if (!input) {
                console.error('Input no encontrado:', inputId);
                return;
            }

            if (input.dataset.emojiConfigured === 'true') {
                console.log('Input ya configurado:', inputId);
                return;
            }

            let container = input.closest('.emoji-picker-container');
            if (!container) {
                console.error('Container .emoji-picker-container no encontrado para:', inputId);
                return;
            }

            input.classList.add('emoji-input');
            input.setAttribute('readonly', 'readonly');
            input.style.cursor = 'pointer';

            let popup = container.querySelector('.emoji-picker-popup');
            if (!popup) {
                container.insertAdjacentHTML('beforeend', this.createPickerHTML());
                popup = container.querySelector('.emoji-picker-popup');

                // ✅ AGREGAR EVENT LISTENERS PROGRAMÁTICAMENTE (no inline)
                const closeBtn = popup.querySelector('.emoji-picker-close');
                closeBtn.addEventListener('click', () => this.close());

                const searchInput = popup.querySelector('.emoji-search');
                searchInput.addEventListener('input', (e) => this.search(e.target.value));

                const categoryTabs = popup.querySelectorAll('.emoji-category-tab');
                categoryTabs.forEach(tab => {
                    tab.addEventListener('click', () => {
                        const category = tab.dataset.category;
                        this.showCategory(category);
                    });
                });
            }

            const existingHandler = input._emojiClickHandler;
            if (existingHandler) {
                input.removeEventListener('click', existingHandler);
            }

            const newHandler = (e) => {
                e.preventDefault();
                e.stopPropagation();
                this.toggle(inputId);
            };

            input._emojiClickHandler = newHandler;
            input.addEventListener('click', newHandler);
            input.dataset.emojiConfigured = 'true';

            console.log('Emoji picker configurado para:', inputId);
        },

        // Método público para reconfigurar manualmente (útil después de abrir modales)
        reconfigure() {
            console.log('Reconfigurando emoji pickers manualmente...');
            this.setupAllEmojiInputs();
            return this;
        },

        // Método para limpiar configuraciones anteriores
        cleanup() {
            // Limpiar todos los event listeners existentes
            document.querySelectorAll('.emoji-input').forEach(input => {
                const handler = input._emojiClickHandler;
                if (handler) {
                    input.removeEventListener('click', handler);
                    delete input._emojiClickHandler;
                }
                input.dataset.emojiConfigured = 'false';
            });

            // Cerrar pickers abiertos
            this.close();

            console.log('Emoji pickers limpiados');
            return this;
        },

        // Remover el inputClickHandler que ya no se usa
        inputClickHandler(e) {
            // Esta función ya no se usa, pero la mantengo para compatibilidad
            e.preventDefault();
            e.stopPropagation();
            const inputId = e.target.id;
            EmojiPicker.toggle(inputId);
        },

        toggle(inputId) {
            if (this.isOpen && this.targetInput && this.targetInput.id === inputId) {
                this.close();
            } else {
                this.open(inputId);
            }
        },

        open(inputId) {
            this.targetInput = document.getElementById(inputId);
            if (!this.targetInput) {
                console.error('Target input no encontrado:', inputId);
                return;
            }

            const container = this.targetInput.closest('.emoji-picker-container');
            if (!container) {
                console.error('Container no encontrado para:', inputId);
                return;
            }

            const popup = container.querySelector('.emoji-picker-popup');
            if (!popup) {
                console.error('Popup no encontrado para:', inputId);
                return;
            }

            // Cerrar otros pickers abiertos
            document.querySelectorAll('.emoji-picker-popup.show').forEach(p => {
                if (p !== popup) p.classList.remove('show');
            });

            popup.classList.add('show');
            this.isOpen = true;

            // Mostrar categoría actual
            this.showCategory(this.currentCategory);

            // Focus en búsqueda después de un momento
            setTimeout(() => {
                const searchInput = popup.querySelector('.emoji-search');
                if (searchInput) searchInput.focus();
            }, 100);

            console.log('Emoji picker abierto para:', inputId);
        },

        close() {
            document.querySelectorAll('.emoji-picker-popup.show').forEach(popup => {
                popup.classList.remove('show');

                // Limpiar búsqueda
                const searchInput = popup.querySelector('.emoji-search');
                if (searchInput) searchInput.value = '';
            });

            this.isOpen = false;
            this.targetInput = null;
            console.log('Emoji picker cerrado');
        },

        showCategory(category) {
            this.currentCategory = category;

            // Actualizar tabs activos en el picker activo
            const activePopup = document.querySelector('.emoji-picker-popup.show');
            if (!activePopup) return;

            activePopup.querySelectorAll('.emoji-category-tab').forEach(tab => {
                tab.classList.remove('active');
                if (tab.dataset.category === category) {
                    tab.classList.add('active');
                }
            });

            // Mostrar emojis de la categoría
            const grid = activePopup.querySelector('.emoji-grid');
            if (!grid) return;

            const emojis = this.categories[category] || [];

            grid.innerHTML = '';

            if (emojis.length === 0 && category === 'recent') {
                grid.innerHTML = '<div class="emoji-no-results">No hay emojis recientes</div>';
                return;
            }

            emojis.forEach(emoji => {
                const item = document.createElement('div');
                item.className = 'emoji-item';
                item.textContent = emoji;
                item.onclick = () => this.selectEmoji(emoji);
                grid.appendChild(item);
            });
        },

        selectEmoji(emoji) {
            if (!this.targetInput) return;

            // Establecer valor
            this.targetInput.value = emoji;

            // Agregar a recientes
            this.addToRecent(emoji);

            // Disparar evento change
            this.targetInput.dispatchEvent(new Event('change', { bubbles: true }));
            this.targetInput.dispatchEvent(new Event('input', { bubbles: true }));

            // Cerrar picker
            this.close();

            console.log('Emoji seleccionado:', emoji);
        },

        addToRecent(emoji) {
            // Remover si ya existe
            this.categories.recent = this.categories.recent.filter(e => e !== emoji);

            // Agregar al inicio
            this.categories.recent.unshift(emoji);

            // Mantener solo los últimos 32
            this.categories.recent = this.categories.recent.slice(0, 32);

            // Guardar en localStorage
            try {
                localStorage.setItem('recentEmojis', JSON.stringify(this.categories.recent));
            } catch (e) {
                console.warn('Error guardando emojis recientes:', e);
            }
        },

        search(query) {
            if (!query.trim()) {
                this.showCategory(this.currentCategory);
                return;
            }

            // Encontrar el grid del picker activo
            const activePopup = document.querySelector('.emoji-picker-popup.show');
            if (!activePopup) return;

            const grid = activePopup.querySelector('.emoji-grid');
            if (!grid) return;

            // Mapeo extendido de palabras clave a emojis
            const keywords = {
                // Trabajo y oficina
                'contador': ['🧮', '💼', '📊', '📈', '💰', '📋', '✏️'],
                'contabilidad': ['🧮', '💼', '📊', '📋', '💰', '📈'],
                'contable': ['🧮', '💼', '📊', '📋'],
                'finanzas': ['💰', '📊', '📈', '💳', '🏦', '💵', '💸'],
                'dinero': ['💰', '💵', '💸', '💳', '💎', '🏦'],
                'banco': ['🏦', '💰', '💳', '💵'],
                'empresa': ['🏢', '💼', '👔', '🏛️'],
                'oficina': ['🏢', '💼', '📋', '🖥️', '💻'],
                'negocio': ['💼', '🏢', '💰', '📊', '🎯'],
                'trabajo': ['💼', '👔', '🏢', '💻', '⚒️'],
                'empleado': ['👨‍💼', '👩‍💼', '👔', '💼'],
                'jefe': ['👨‍💼', '👩‍💼', '👔', '💼'],
                'gerente': ['👨‍💼', '👩‍💼', '💼'],

                // Tecnología
                'computadora': ['💻', '🖥️', '⌨️', '🖱️', '💾'],
                'computer': ['💻', '🖥️', '⌨️'],
                'pc': ['💻', '🖥️', '⌨️', '🖱️'],
                'laptop': ['💻', '⌨️'],
                'telefono': ['📱', '📞', '☎️'],
                'celular': ['📱', '📞'],
                'movil': ['📱', '📞'],
                'email': ['📧', '✉️', '📮', '📪'],
                'correo': ['📧', '✉️', '📮'],
                'internet': ['🌐', '💻', '📱'],
                'web': ['🌐', '💻', '🖥️'],
                'software': ['💻', '🖥️', '⚙️'],
                'app': ['📱', '💻', '🖥️'],

                // Documentos y papelería
                'documento': ['📄', '📃', '📋', '📝', '📑'],
                'papel': ['📄', '📃', '📋', '📑'],
                'archivo': ['📁', '📂', '🗂️', '🗃️'],
                'carpeta': ['📁', '📂', '🗂️'],
                'reporte': ['📊', '📈', '📋', '📄'],
                'informe': ['📊', '📋', '📄', '📃'],
                'factura': ['🧾', '📄', '💳', '💰'],
                'recibo': ['🧾', '📄', '💳'],
                'contrato': ['📄', '📃', '✒️', '🖊️'],
                'firma': ['✒️', '🖊️', '📝'],
                'escribir': ['📝', '✏️', '🖊️', '✒️'],
                'nota': ['📝', '📄', '📋'],
                'lista': ['📋', '📝', '✏️'],

                // Herramientas
                'herramienta': ['🔧', '🔨', '🛠️', '⚒️', '⚙️'],
                'tool': ['🔧', '🔨', '🛠️'],
                'martillo': ['🔨', '⚒️'],
                'llave': ['🔧', '🗝️'],
                'engrane': ['⚙️', '🔧'],
                'configuracion': ['⚙️', '🔧', '🛠️'],
                'ajuste': ['⚙️', '🔧'],
                'reparar': ['🔧', '🔨', '🛠️'],
                'arreglar': ['🔧', '🔨', '🛠️'],

                // Transporte
                'carro': ['🚗', '🚙', '🚕', '🚐'],
                'auto': ['🚗', '🚙', '🚕'],
                'coche': ['🚗', '🚙', '🚕'],
                'vehiculo': ['🚗', '🚙', '🚕', '🚐'],
                'taxi': ['🚕', '🚗'],
                'bus': ['🚌', '🚐'],
                'camion': ['🚛', '🚚', '🚐'],
                'moto': ['🏍️', '🛵'],
                'bicicleta': ['🚲', '🚴‍♂️', '🚴‍♀️'],
                'avion': ['✈️', '🛩️'],
                'barco': ['🚢', '⛵', '🛥️'],
                'tren': ['🚂', '🚃', '🚄'],

                // Lugares
                'casa': ['🏠', '🏡', '🏘️'],
                'hogar': ['🏠', '🏡'],
                'edificio': ['🏢', '🏬', '🏭'],
                'tienda': ['🏪', '🏬', '🛒'],
                'hospital': ['🏥', '⚕️'],
                'escuela': ['🏫', '📚', '🎓'],
                'universidad': ['🏫', '🎓', '📚'],
                'restaurante': ['🍽️', '🍴', '🏪'],
                'hotel': ['🏨', '🛏️'],
                'gym': ['🏋️‍♂️', '🏋️‍♀️', '💪'],
                'gimnasio': ['🏋️‍♂️', '🏋️‍♀️', '💪'],

                // Emociones y personas
                'feliz': ['😊', '😃', '😄', '😁', '🥰', '😍'],
                'contento': ['😊', '😃', '😄', '🙂'],
                'alegre': ['😄', '😃', '😊', '🎉'],
                'triste': ['😢', '😭', '😞', '☹️'],
                'enojado': ['😠', '😡', '🤬'],
                'sorprendido': ['😲', '😱', '🤯'],
                'pensando': ['🤔', '💭', '🧠'],
                'idea': ['💡', '🧠', '✨', '🤔'],
                'genio': ['🧞‍♂️', '🧞‍♀️', '🤓'],
                'inteligente': ['🧠', '🤓', '💡'],
                'doctor': ['👨‍⚕️', '👩‍⚕️', '⚕️'],
                'profesor': ['👨‍🏫', '👩‍🏫', '📚'],
                'estudiante': ['👨‍🎓', '👩‍🎓', '📚'],
                'chef': ['👨‍🍳', '👩‍🍳', '🍳'],
                'policia': ['👮‍♂️', '👮‍♀️', '🚔'],

                // Tiempo y fechas
                'tiempo': ['⏰', '⏱️', '⏲️', '🕐', '📅'],
                'reloj': ['⏰', '⏱️', '🕐'],
                'hora': ['⏰', '🕐', '⏱️'],
                'calendario': ['📅', '📆', '🗓️'],
                'fecha': ['📅', '📆'],
                'año': ['📅', '🗓️'],
                'mes': ['📅', '📆'],
                'dia': ['📅', '📆', '🌅'],
                'mañana': ['🌅', '☀️', '🌄'],
                'noche': ['🌙', '🌃', '🌆'],
                'tarde': ['🌅', '🌆'],

                // Símbolos y acciones
                'ok': ['✅', '👍', '👌'],
                'bien': ['✅', '👍', '👌', '😊'],
                'mal': ['❌', '👎', '❗'],
                'error': ['❌', '⚠️', '❗'],
                'atencion': ['⚠️', '❗', '🚨'],
                'importante': ['❗', '⚠️', '🚨', '⭐'],
                'estrella': ['⭐', '🌟', '✨'],
                'fuego': ['🔥', '🚨'],
                'agua': ['💧', '🌊', '🚿'],
                'electricidad': ['⚡', '🔋', '💡'],
                'energia': ['⚡', '🔋', '💡'],
                'bateria': ['🔋', '⚡'],
                'luz': ['💡', '🔆', '✨'],
                'sol': ['☀️', '🌞', '🌅'],
                'luna': ['🌙', '🌛', '🌜'],

                // Ventas y marketing
                'venta': ['💰', '📈', '🛒', '💳'],
                'ventas': ['💰', '📈', '🎯', '📊'],
                'compra': ['🛒', '💳', '💰', '🛍️'],
                'cliente': ['👥', '🤝', '💼'],
                'servicio': ['🤝', '⚙️', '🛠️'],
                'marketing': ['📈', '📊', '🎯', '📢'],
                'publicidad': ['📢', '📺', '📻'],
                'promocion': ['🎉', '🎁', '💰'],
                'descuento': ['💰', '🏷️', '💸'],
                'precio': ['💰', '💵', '🏷️'],
                'meta': ['🎯', '📈', '⭐'],
                'objetivo': ['🎯', '📈', '🏆'],
                'exito': ['🏆', '🎉', '⭐', '👍'],

                // Educación y aprendizaje
                'libro': ['📚', '📖', '📕', '📗'],
                'leer': ['📖', '📚', '👓'],
                'estudiar': ['📚', '📖', '✏️'],
                'aprender': ['📚', '🧠', '💡'],
                'enseñar': ['👨‍🏫', '👩‍🏫', '📚'],
                'clase': ['👨‍🏫', '👩‍🏫', '📚', '🏫'],
                'examen': ['📝', '📋', '✏️'],
                'tarea': ['📝', '📋', '✏️'],
                'graduacion': ['🎓', '👨‍🎓', '👩‍🎓'],

                // Comida y restaurante
                'comida': ['🍽️', '🍴', '🍕', '🍔'],
                'comer': ['🍽️', '🍴', '😋'],
                'cocinar': ['👨‍🍳', '👩‍🍳', '🍳'],
                'pizza': ['🍕'],
                'hamburguesa': ['🍔'],
                'cafe': ['☕', '🥤'],
                'agua': ['💧', '🥤'],
                'bebida': ['🥤', '🍺', '🍷'],

                // Deportes y ejercicio
                'deporte': ['⚽', '🏀', '🎾', '🏋️‍♂️'],
                'futbol': ['⚽', '🥅'],
                'basketball': ['🏀', '🏀'],
                'ejercicio': ['🏋️‍♂️', '🏋️‍♀️', '💪'],
                'correr': ['🏃‍♂️', '🏃‍♀️', '👟'],
                'caminar': ['🚶‍♂️', '🚶‍♀️', '👟'],
                'nadar': ['🏊‍♂️', '🏊‍♀️', '🏊'],

                // Música y entretenimiento
                'musica': ['🎵', '🎶', '🎤', '🎸'],
                'cantar': ['🎤', '🎵', '🎶'],
                'guitarra': ['🎸'],
                'piano': ['🎹'],
                'pelicula': ['🎬', '🎭', '🍿'],
                'teatro': ['🎭', '🎪'],
                'fiesta': ['🎉', '🎊', '🥳'],
                'celebrar': ['🎉', '🎊', '🥳'],

                // Salud y medicina
                'salud': ['⚕️', '💊', '🏥'],
                'medicina': ['💊', '⚕️', '🩺'],
                'doctor': ['👨‍⚕️', '👩‍⚕️', '⚕️'],
                'enfermero': ['👨‍⚕️', '👩‍⚕️', '💉'],
                'pastilla': ['💊', '⚕️'],
                'inyeccion': ['💉', '⚕️'],
                'termometro': ['🌡️', '⚕️'],

                // Naturaleza y clima
                'naturaleza': ['🌿', '🌳', '🌱', '🍃'],
                'arbol': ['🌳', '🌲', '🌴'],
                'flor': ['🌸', '🌺', '🌻', '🌹'],
                'sol': ['☀️', '🌞'],
                'lluvia': ['🌧️', '☔', '💧'],
                'nube': ['☁️', '⛅', '🌤️'],
                'viento': ['💨', '🌪️'],
                'nieve': ['❄️', '☃️', '🌨️'],

                // Animales
                'perro': ['🐕', '🐶', '🦮'],
                'gato': ['🐱', '🐈', '😺'],
                'pajaro': ['🐦', '🕊️', '🦅'],
                'pez': ['🐟', '🐠', '🐡'],
                'caballo': ['🐎', '🐴'],
                'vaca': ['🐄', '🐮'],
                'cerdo': ['🐷', '🐖'],
                'pollo': ['🐔', '🐓'],
            };

            const lowerQuery = query.toLowerCase().trim();
            let foundEmojis = [];

            // 1. Buscar coincidencias exactas en palabras clave
            Object.entries(keywords).forEach(([keyword, emojis]) => {
                if (keyword === lowerQuery) {
                    foundEmojis.push(...emojis);
                }
            });

            // 2. Si no hay coincidencias exactas, buscar coincidencias parciales
            if (foundEmojis.length === 0) {
                Object.entries(keywords).forEach(([keyword, emojis]) => {
                    if (keyword.includes(lowerQuery) || lowerQuery.includes(keyword)) {
                        foundEmojis.push(...emojis);
                    }
                });
            }

            // 3. Buscar palabras que contengan la query
            if (foundEmojis.length === 0) {
                const queryWords = lowerQuery.split(/\s+/);
                Object.entries(keywords).forEach(([keyword, emojis]) => {
                    queryWords.forEach(word => {
                        if (word.length >= 2 && (keyword.includes(word) || word.includes(keyword))) {
                            foundEmojis.push(...emojis);
                        }
                    });
                });
            }

            // 4. Si aún no hay resultados, mostrar emojis populares
            if (foundEmojis.length === 0) {
                foundEmojis = [
                    '😊', '👍', '❤️', '💼', '🏢', '💻', '📱', '⚡',
                    '🎯', '💡', '🚀', '⭐', '🔥', '💪', '👌', '✨',
                    '📈', '💰', '🎉', '🏆', '🤝', '📊', '🎁', '🌟'
                ];
            }

            // Remover duplicados y limitar resultados
            foundEmojis = [...new Set(foundEmojis)].slice(0, 48);

            console.log(`Búsqueda "${query}": encontrados ${foundEmojis.length} emojis`);

            grid.innerHTML = '';

            if (foundEmojis.length === 0) {
                grid.innerHTML = '<div class="emoji-no-results">No se encontraron emojis para "' + query + '"</div>';
                return;
            }

            foundEmojis.forEach(emoji => {
                const item = document.createElement('div');
                item.className = 'emoji-item';
                item.textContent = emoji;
                item.onclick = () => this.selectEmoji(emoji);
                grid.appendChild(item);
            });
        }
    };

    // Event listeners globales para el emoji picker
    document.addEventListener('click', function (e) {
        // NUEVO: Ignorar clics en elementos de navegación y botones importantes
        if (e.target.closest('.btn-secondary') ||
            e.target.closest('button[onclick*="NavigateToCitas"]') ||
            e.target.closest('.nav-btn') ||
            e.target.closest('.admin-actions button')) {
            console.log('Clic en botón de navegación/acción, no cerrar emoji picker');
            return; // No interceptar este clic
        }

        // Cerrar picker si se hace clic fuera del contenedor
        if (!e.target.closest('.emoji-picker-container')) {
            if (EmojiPicker.isOpen) {
                console.log('Emoji picker cerrado');
                EmojiPicker.close();
            }
        }
    });

    document.addEventListener('keydown', function (e) {
        // Cerrar con Escape solo si el emoji picker está abierto
        if (e.key === 'Escape' && EmojiPicker.isOpen) {
            EmojiPicker.close();
        }
    });

    // Funciones globales para compatibilidad
    window.toggleEmojiPicker = (inputId) => EmojiPicker.toggle(inputId);
    window.closeEmojiPicker = () => EmojiPicker.close();
    window.showEmojiCategory = (category) => EmojiPicker.showCategory(category);
    window.searchEmojis = (query) => EmojiPicker.search(query);

    // Nuevas funciones globales para manejo de modales
    window.reconfigureEmojiPickers = () => EmojiPicker.reconfigure();
    window.cleanupEmojiPickers = () => EmojiPicker.cleanup();
    window.reinitEmojiPickers = () => {
        EmojiPicker.cleanup();
        setTimeout(() => {
            EmojiPicker.reconfigure();
        }, 100);
    };

    // Inicializar cuando el DOM esté listo
    document.addEventListener('DOMContentLoaded', function () {
        EmojiPicker.init();
    });

    // También inicializar si el DOM ya está listo
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', function () {
            EmojiPicker.init();
        });
    } else {
        EmojiPicker.init();
    }

    console.log('EmojiPicker cargado completamente');

    // Función de navegación que preserva la sesión
    window.navigateToAdminCitas = function () {
        console.log('🔄 Navegando a admin/citas preservando sesión...');

        // Cerrar cualquier modal abierto primero
        if (window.EmojiPicker && window.EmojiPicker.isOpen) {
            window.EmojiPicker.close();
        }
        if (window.closeAllModals) {
            window.closeAllModals();
        }

        // Verificar que la sesión esté activa
        if (!window.isLoggedIn || !window.isLoggedIn()) {
            console.log('❌ No hay sesión activa');
            window.location.href = '/login';
            return;
        }

        // Obtener datos de sesión
        const sessionData = window.getSessionData();
        if (!sessionData) {
            console.log('❌ No se pudo obtener datos de sesión');
            window.location.href = '/login';
            return;
        }

        console.log('✅ Sesión válida encontrada:', sessionData.username);

        // CRÍTICO: Guardar en TODOS los lugares posibles
        try {
            const sessionJson = JSON.stringify(sessionData);

            // 1. localStorage (principal)
            localStorage.setItem('adminSession', sessionJson);

            // 2. sessionStorage (respaldo)
            sessionStorage.setItem('adminSession', sessionJson);
            sessionStorage.setItem('sessionTimestamp', Date.now().toString());

            // 3. Mantener en memoria
            window.adminSession = sessionData;

            // 4. Cookie como último respaldo
            const expirationDate = new Date(sessionData.expiresAt);
            document.cookie = `adminSession=${btoa(sessionJson)}; expires=${expirationDate.toUTCString()}; path=/; SameSite=Strict`;

            console.log('✅ Sesión guardada en todos los lugares');

        } catch (e) {
            console.error('❌ Error guardando sesión:', e);
            alert('Error al guardar la sesión. Intenta recargar la página.');
            return;
        }

        // Pequeño delay para asegurar que todo se guardó
        setTimeout(() => {
            console.log('🚀 Navegando ahora...');
            window.location.href = '/admin/citas';
        }, 100);
    };



}

function NavigateToCotizaciones() {
    console.log('🔄 Navegando a cotizaciones...');

    // Asegurar que la sesión persista
    if (window.adminSession && !localStorage.getItem('adminSession')) {
        localStorage.setItem('adminSession', JSON.stringify(window.adminSession));
    }

    // Navegar
    window.location.href = '/admin/cotizaciones';
}

// === FUNCIÓN GLOBAL PARA ABRIR MODAL DE ADMINISTRADORES ===
window.openAdministradoresModal = function () {
    console.log('🔘 openAdministradoresModal llamada');

    const modal = document.getElementById('adminModal');
    if (!modal) {
        console.error('❌ Modal adminModal no encontrado');
        alert('Error: Modal no encontrado');
        return;
    }

    console.log('✅ Modal encontrado, configurando...');

    // Limpiar estilos previos
    modal.removeAttribute('style');
    modal.classList.remove('modal-hidden', 'hiding');

    // Configurar estilos del overlay
    modal.style.position = 'fixed';
    modal.style.top = '0';
    modal.style.left = '0';
    modal.style.right = '0';
    modal.style.bottom = '0';
    modal.style.width = '100vw';
    modal.style.height = '100vh';
    modal.style.backgroundColor = 'rgba(0, 0, 0, 0.8)';
    modal.style.zIndex = '9999';
    modal.style.display = 'flex';
    modal.style.justifyContent = 'center';
    modal.style.alignItems = 'center';
    modal.style.padding = '20px';
    modal.style.boxSizing = 'border-box';

    // Agregar clases de animación
    modal.classList.add('show', 'modal-active');

    // Configurar el contenido del modal
    const modalContent = modal.querySelector('.modal');
    if (modalContent) {
        modalContent.style.display = 'block';
        modalContent.style.visibility = 'visible';
        modalContent.style.opacity = '1';
        modalContent.style.position = 'relative';
        modalContent.style.zIndex = '10000';
        modalContent.style.background = 'white';
        modalContent.style.borderRadius = '20px';
        modalContent.style.padding = '40px';
        modalContent.style.maxWidth = '900px';
        modalContent.style.width = '90%';
        modalContent.style.maxHeight = '90vh';
        modalContent.style.overflowY = 'auto';
        modalContent.style.boxShadow = '0 20px 60px rgba(0,0,0,0.5)';
    }

    console.log('✅ Modal configurado, cargando lista en 300ms...');

    // Cargar lista de administradores
    setTimeout(() => {
        if (window.loadAdminsList && typeof window.loadAdminsList === 'function') {
            console.log('✅ Llamando a loadAdminsList...');
            window.loadAdminsList();
        } else {
            console.error('❌ loadAdminsList no disponible');
            console.log('Funciones disponibles:', Object.keys(window).filter(k => k.includes('Admin')));

            const container = document.getElementById('adminsListContainer');
            if (container) {
                container.innerHTML = `
                    <div style="text-align: center; padding: 40px;">
                        <div style="font-size: 48px; margin-bottom: 20px;">⚠️</div>
                        <h3 style="color: #e74c3c;">Módulo no cargado</h3>
                        <p style="color: #666; margin-bottom: 20px;">
                            El módulo de gestión de administradores no se cargó correctamente.
                        </p>
                        <button class="btn-primary" onclick="location.reload()" 
                                style="background: #667eea; color: white; border: none; 
                                       padding: 12px 30px; border-radius: 8px; cursor: pointer;">
                            🔄 Recargar Página
                        </button>
                    </div>
                `;
            }
        }
    }, 300);
};

// ============================================
// AGREGAR AL FINAL DE admin.js
// ============================================

// Función de navegación mejorada para Solicitudes
window.navigateToSolicitudes = function () {
    console.log('🔄 Navegando a /admin/solicitudes preservando sesión...');

    // 1. Cerrar cualquier modal abierto primero
    if (window.EmojiPicker && window.EmojiPicker.isOpen) {
        window.EmojiPicker.close();
    }
    if (window.closeAllModals) {
        window.closeAllModals();
    }

    // 2. Verificar que la sesión esté activa
    if (!window.isLoggedIn || !window.isLoggedIn()) {
        console.log('❌ No hay sesión activa');
        window.location.href = '/login';
        return;
    }

    // 3. Obtener datos de sesión
    const sessionData = window.getSessionData();
    if (!sessionData) {
        console.log('❌ No se pudo obtener datos de sesión');
        window.location.href = '/login';
        return;
    }

    console.log('✅ Sesión válida encontrada:', sessionData.username);

    // 4. CRÍTICO: Guardar en TODOS los lugares posibles
    try {
        const sessionJson = JSON.stringify(sessionData);

        // a) localStorage (principal)
        localStorage.setItem('adminSession', sessionJson);

        // b) sessionStorage (respaldo)
        sessionStorage.setItem('adminSession', sessionJson);
        sessionStorage.setItem('sessionTimestamp', Date.now().toString());

        // c) Mantener en memoria
        window.adminSession = sessionData;

        // d) Cookie como último respaldo
        const expirationDate = new Date(sessionData.expiresAt);
        document.cookie = `adminSession=${btoa(sessionJson)}; expires=${expirationDate.toUTCString()}; path=/; SameSite=Strict`;

        console.log('✅ Sesión guardada en todos los lugares');

        // 5. NUEVO: Marcar que venimos de navegación interna
        sessionStorage.setItem('navigatedFrom', 'admin');
        sessionStorage.setItem('navigationTimestamp', Date.now().toString());

        // 6. Pequeño delay para asegurar que todo se guardó
        setTimeout(() => {
            console.log('🚀 Navegando a /admin/solicitudes...');
            window.location.href = '/admin/solicitudes';
        }, 100);

    } catch (e) {
        console.error('❌ Error guardando sesión:', e);
        alert('Error al guardar la sesión. Intenta recargar la página.');
        return;
    }
};

// MEJORAR: Función de verificación de sesión más robusta
window.verifySessionForNavigation = function () {
    console.log('🔍 Verificando sesión para navegación...');

    // Intentar desde múltiples fuentes
    let session = null;

    // 1. Primero desde memoria
    if (window.adminSession && window.adminSession.expiresAt > Date.now()) {
        console.log('✅ Sesión encontrada en memoria');
        session = window.adminSession;
    }

    // 2. Luego desde localStorage
    if (!session) {
        try {
            const stored = localStorage.getItem('adminSession');
            if (stored) {
                const parsed = JSON.parse(stored);
                if (parsed && parsed.expiresAt > Date.now()) {
                    console.log('✅ Sesión encontrada en localStorage');
                    session = parsed;
                    window.adminSession = session; // Sincronizar a memoria
                }
            }
        } catch (e) {
            console.warn('Error parseando localStorage:', e);
        }
    }

    // 3. Luego desde sessionStorage
    if (!session) {
        try {
            const stored = sessionStorage.getItem('adminSession');
            if (stored) {
                const parsed = JSON.parse(stored);
                if (parsed && parsed.expiresAt > Date.now()) {
                    console.log('✅ Sesión encontrada en sessionStorage');
                    session = parsed;
                    window.adminSession = session; // Sincronizar a memoria
                }
            }
        } catch (e) {
            console.warn('Error parseando sessionStorage:', e);
        }
    }

    // 4. Como último recurso, desde cookie
    if (!session) {
        try {
            const cookies = document.cookie.split(';');
            const adminCookie = cookies.find(c => c.trim().startsWith('adminSession='));
            if (adminCookie) {
                const encoded = adminCookie.split('=')[1];
                const decoded = atob(encoded);
                const parsed = JSON.parse(decoded);
                if (parsed && parsed.expiresAt > Date.now()) {
                    console.log('✅ Sesión encontrada en cookie');
                    session = parsed;
                    window.adminSession = session; // Sincronizar a memoria
                }
            }
        } catch (e) {
            console.warn('Error parseando cookie:', e);
        }
    }

    if (session) {
        console.log('✅ Sesión válida:', {
            username: session.username,
            expiresIn: Math.round((session.expiresAt - Date.now()) / 60000) + ' minutos'
        });
        return session;
    } else {
        console.log('❌ No se encontró sesión válida');
        return null;
    }
};

console.log('✅ Funciones de navegación a Solicitudes configuradas');

// ==================== DIAGNÓSTICO DE SESIÓN ====================
// Agregar esto TEMPORALMENTE al final de admin.js para ver qué está pasando

function diagnosticarSesion() {
    console.log('🔍 ==================== DIAGNÓSTICO DE SESIÓN ====================');

    // 1. Verificar localStorage
    console.log('📦 localStorage:');
    const localSession = localStorage.getItem('adminSession');
    if (localSession) {
        try {
            const parsed = JSON.parse(localSession);
            console.log('  ✅ Existe en localStorage');
            console.log('  - Username:', parsed.username);
            console.log('  - ExpiresAt:', new Date(parsed.expiresAt).toLocaleString());
            console.log('  - Tiempo restante:', Math.round((parsed.expiresAt - Date.now()) / 60000), 'minutos');
            console.log('  - ¿Válida?', parsed.expiresAt > Date.now() ? 'SÍ ✅' : 'NO ❌ (EXPIRADA)');
        } catch (e) {
            console.error('  ❌ Error parseando:', e);
        }
    } else {
        console.log('  ❌ NO existe en localStorage');
    }

    // 2. Verificar sessionStorage
    console.log('📦 sessionStorage:');
    const sessionSession = sessionStorage.getItem('adminSession');
    if (sessionSession) {
        console.log('  ✅ Existe en sessionStorage');
    } else {
        console.log('  ❌ NO existe en sessionStorage');
    }

    // 3. Verificar window.adminSession
    console.log('🪟 window.adminSession:');
    if (window.adminSession) {
        console.log('  ✅ Existe en memoria');
        console.log('  - Username:', window.adminSession.username);
    } else {
        console.log('  ❌ NO existe en memoria');
    }

    // 4. Verificar cookies
    console.log('🍪 Cookies:');
    const cookies = document.cookie.split(';');
    const adminCookie = cookies.find(c => c.trim().startsWith('adminSession='));
    if (adminCookie) {
        console.log('  ✅ Cookie adminSession existe');
    } else {
        console.log('  ❌ Cookie adminSession NO existe');
    }

    // 5. Verificar función isLoggedIn
    console.log('🔐 Estado de autenticación:');
    if (typeof window.isLoggedIn === 'function') {
        const loggedIn = window.isLoggedIn();
        console.log('  - isLoggedIn():', loggedIn ? '✅ SÍ' : '❌ NO');
    } else {
        console.log('  ❌ Función isLoggedIn no existe');
    }

    // 6. Verificar getSessionData
    if (typeof window.getSessionData === 'function') {
        const sessionData = window.getSessionData();
        console.log('  - getSessionData():', sessionData ? '✅ Retorna datos' : '❌ Retorna null');
    } else {
        console.log('  ❌ Función getSessionData no existe');
    }

    console.log('🔍 ============================================================');
}

// Ejecutar diagnóstico automáticamente
setTimeout(() => {
    console.log('🚀 Ejecutando diagnóstico automático...');
    diagnosticarSesion();
}, 2000);

// Hacer función global para llamarla manualmente
window.diagnosticarSesion = diagnosticarSesion;

console.log('💡 Puedes ejecutar diagnosticarSesion() en la consola en cualquier momento');

// ============================================
// EXPORTAR FUNCIONES GLOBALES
// ============================================
window.esAdminPrincipal = esAdminPrincipal;
window.configurarPermisos = configurarPermisos;
window.openAdministradoresModalSeguro = openAdministradoresModalSeguro;

console.log('✅ Sistema de permisos configurado');

console.log('✅ openAdministradoresModal registrada globalmente');