// Evitar ejecución múltiple
(function () {
    'use strict';

    // Verificar si ya se cargó
    if (window.cvFormLoaded) {
        return;
    }
    window.cvFormLoaded = true;

    const API_URL = 'https://lomanconsultoria-web.onrender.com/api/CV/enviar';

    // Esperar a que el DOM esté listo
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initializeCVForm);
    } else {
        initializeCVForm();
    }

    function initializeCVForm() {
        console.log('🚀 Iniciando sistema CV...');
        setupModalEventListeners();
        setupFormEventListeners();
        setupFileUploadListeners();
        console.log('✅ Sistema CV cargado correctamente');
    }

    // FUNCIONES GLOBALES PARA LOS MODALES
    window.openResidenciaModal = function () {
        const modal = document.getElementById('residenciaModal');
        if (modal) {
            modal.classList.add('show');
            document.body.style.overflow = 'hidden';
            console.log('🎓 Modal Residencia abierto');

            // Animar form groups
            setTimeout(() => {
                const formGroups = modal.querySelectorAll('.form-group');
                formGroups.forEach((group, index) => {
                    group.style.animationDelay = `${index * 0.1}s`;
                });
            }, 100);
        }
    };

    window.closeResidenciaModal = function () {
        const modal = document.getElementById('residenciaModal');
        if (modal) {
            modal.classList.remove('show');
            document.body.style.overflow = 'auto';
            clearForm(document.getElementById('residenciaForm'));
            console.log('🎓 Modal Residencia cerrado');
        }
    };

    // Variable global para almacenar datos del trabajo actual
    let currentJobData = null;

    window.openTrabajoModal = function (jobData = null) {
        const modal = document.getElementById('trabajoModal');
        if (modal) {
            modal.classList.add('show');
            document.body.style.overflow = 'hidden';
            console.log('💼 Modal Trabajo abierto', jobData ? 'con datos de trabajo' : 'sin datos específicos');

            // Almacenar datos del trabajo actual
            currentJobData = jobData;

            // Si se proporciona información del trabajo, pre-llenar solo el puesto
            if (jobData) {
                setTimeout(() => preloadJobPosition(jobData), 100);
            } else {
                setTimeout(() => resetJobPosition(), 100);
            }
        }
    };

    // Función simplificada para pre-cargar solo la posición
    function preloadJobPosition(jobData) {
        const posicionInput = document.getElementById('posicionInteresTrab');

        if (posicionInput && jobData.titulo) {
            posicionInput.value = jobData.titulo;
            console.log('✅ Posición cargada:', jobData.titulo);
        }
    }

    // Función para limpiar la posición
    function resetJobPosition() {
        const posicionInput = document.getElementById('posicionInteresTrab');

        if (posicionInput) {
            posicionInput.value = '';
            posicionInput.placeholder = "Aplica desde una oportunidad específica para ver el puesto aquí";
        }
    }

    window.closeTrabajoModal = function () {
        const modal = document.getElementById('trabajoModal');
        if (modal) {
            modal.classList.remove('show');
            document.body.style.overflow = 'auto';

            // Limpiar formulario y posición
            const form = document.getElementById('trabajoForm');
            clearForm(form);
            resetJobPosition();

            // Limpiar datos del trabajo actual
            currentJobData = null;

            console.log('💼 Modal Trabajo cerrado');
        }
    };

    // FUNCIONES GLOBALES PARA MODAL DE ÉXITO
    window.showSuccessModal = function (tipo) {
        const modal = document.getElementById('successModal');
        if (!modal) {
            console.error('❌ Modal de éxito no encontrado');
            return;
        }

        const title = document.getElementById('successTitle');
        const subtitle = document.getElementById('successSubtitle');
        const message = document.getElementById('successMessage');
        const stepsList = document.getElementById('nextStepsList');

        // Personalizar contenido según el tipo
        if (tipo === 'residencia') {
            title.textContent = '🎓 ¡Solicitud de Residencia Enviada!';
            subtitle.textContent = 'Tu solicitud de residencia profesional ha sido recibida';
            message.textContent = 'Tu solicitud de residencia profesional ha sido enviada exitosamente. Nuestro equipo la revisará y te contactaremos pronto para coordinar tu proceso de residencia.';

            stepsList.innerHTML = `
                <li>Evaluaremos tu perfil académico y CV</li>
                <li>Te asignaremos a un proyecto de residencia</li>
                <li>Coordinaremos fechas de inicio</li>
                <li>Te contactaremos en máximo 3 días hábiles</li>
            `;
        } else {
            title.textContent = '💼 ¡CV Enviado para Oportunidad Laboral!';
            subtitle.textContent = 'Tu postulación ha sido recibida exitosamente';
            message.textContent = 'Tu CV ha sido enviado exitosamente para la oportunidad laboral. Nuestro equipo de RH lo revisará y te contactaremos si tu perfil se ajusta a nuestras necesidades actuales.';

            stepsList.innerHTML = `
                <li>Revisaremos tu CV y experiencia profesional</li>
                <li>Evaluaremos el ajuste con nuestras vacantes</li>
                <li>Te contactaremos para una entrevista inicial</li>
                <li>Proceso de selección y seguimiento</li>
            `;
        }

        // Mostrar modal con animación
        modal.classList.add('show');
        document.body.style.overflow = 'hidden';

        console.log(`✨ Modal de éxito mostrado para: ${tipo}`);
    };

    window.closeSuccessModal = function () {
        const modal = document.getElementById('successModal');
        if (modal) {
            modal.classList.remove('show');
            document.body.style.overflow = 'auto';
            console.log('✨ Modal de éxito cerrado');
        }
    };

    window.toggleUniversidadCustom = function () {
        const universidadSelect = document.getElementById('universidadRes');
        const customDiv = document.getElementById('universidadCustomRes');
        const customInput = document.getElementById('universidadOtraRes');

        if (!universidadSelect || !customDiv || !customInput) {
            console.error('❌ Elementos universidad personalizada no encontrados');
            return;
        }

        if (universidadSelect.value === 'Otra') {
            // Mostrar campo personalizado con animación
            customDiv.style.display = 'block';
            setTimeout(() => {
                customDiv.classList.add('show');
            }, 10);

            customInput.required = true;
            customInput.focus();

            // Limpiar error de universidad principal si existe
            clearFieldError(universidadSelect);
            console.log('✅ Campo universidad personalizada activado');
        } else {
            // Ocultar campo personalizado
            customDiv.classList.remove('show');
            setTimeout(() => {
                if (!customDiv.classList.contains('show')) {
                    customDiv.style.display = 'none';
                }
            }, 300);

            customInput.required = false;
            customInput.value = '';
            clearFieldError(customInput);
            console.log('🔽 Campo universidad personalizada desactivado');
        }
    };

    function setupModalEventListeners() {
        // Cerrar modales con click en overlay (residencia / trabajo)
        const modals = document.querySelectorAll('.cv-modal-overlay');
        modals.forEach(modal => {
            modal.addEventListener('click', function (e) {
                if (e.target === this) {
                    if (this.id === 'residenciaModal') {
                        window.closeResidenciaModal();
                    } else if (this.id === 'trabajoModal') {
                        window.closeTrabajoModal();
                    }
                }
            });
        });

        // ÚNICO event listener para Escape - maneja TODOS los modales
        document.addEventListener('keydown', function (e) {
            if (e.key === 'Escape') {
                // Verificar modal de éxito primero
                const successModal = document.getElementById('successModal');
                if (successModal && successModal.classList.contains('show')) {
                    window.closeSuccessModal();
                    return;
                }

                // Luego verificar otros modales abiertos
                const openModals = document.querySelectorAll('.cv-modal-overlay.show');
                openModals.forEach(modal => {
                    if (modal.id === 'residenciaModal') {
                        window.closeResidenciaModal();
                    } else if (modal.id === 'trabajoModal') {
                        window.closeTrabajoModal();
                    }
                });
            }
        });

        // Event listener para cerrar modal de éxito con click en overlay
        // Usar setTimeout para asegurar que el modal existe
        setTimeout(() => {
            const successModal = document.getElementById('successModal');
            if (successModal) {
                successModal.addEventListener('click', function (e) {
                    if (e.target === this) {
                        window.closeSuccessModal();
                    }
                });
            }
        }, 100);

        // Botones de cerrar
        const closeButtons = document.querySelectorAll('.close-modal-btn');
        closeButtons.forEach(btn => {
            btn.addEventListener('click', function () {
                const modal = this.closest('.cv-modal-overlay');
                if (modal) {
                    if (modal.id === 'residenciaModal') {
                        window.closeResidenciaModal();
                    } else if (modal.id === 'trabajoModal') {
                        window.closeTrabajoModal();
                    }
                }
            });
        });
    }

    function setupFormEventListeners() {
        // Formulario residencia
        const formRes = document.getElementById('residenciaForm');
        if (formRes) {
            formRes.addEventListener('submit', function (e) {
                e.preventDefault();
                handleFormSubmit(this, 'residencia');
            });
        }

        // Formulario trabajo
        const formTrab = document.getElementById('trabajoForm');
        if (formTrab) {
            formTrab.addEventListener('submit', function (e) {
                e.preventDefault();
                handleFormSubmit(this, 'trabajo');
            });
        }

        // Efectos en campos
        const fields = document.querySelectorAll('input, select, textarea');
        fields.forEach(field => {
            field.addEventListener('input', function () {
                clearFieldError(this);

                if (this.checkValidity()) {
                    this.style.borderColor = '#28a745';
                } else {
                    this.style.borderColor = '';
                }
            });
        });

        // Event listener específico para universidad personalizada
        const universidadOtraInput = document.getElementById('universidadOtraRes');
        if (universidadOtraInput) {
            universidadOtraInput.addEventListener('input', function () {
                if (this.value.trim()) {
                    clearFieldError(this);
                }
            });
            console.log('✅ Event listener universidad personalizada configurado');
        }

        // Event listener para el select de universidad
        const universidadSelect = document.getElementById('universidadRes');
        if (universidadSelect) {
            universidadSelect.addEventListener('change', function () {
                clearFieldError(this);
                window.toggleUniversidadCustom();
            });
            console.log('✅ Event listener select universidad configurado');
        }
    }

    function setupFileUploadListeners() {
        console.log('🔧 Configurando file uploads...');

        // Residencia
        const fileInputRes = document.getElementById('archivoCVRes');
        const fileUploadDivRes = fileInputRes?.closest('.file-upload');

        if (fileInputRes && fileUploadDivRes) {
            fileInputRes.addEventListener('change', function (e) {
                console.log('📎 Archivo residencia seleccionado:', e.target.files[0]?.name || 'ninguno');
                handleFileSelect(this, 'fileInfoRes');
            });

            fileUploadDivRes.addEventListener('click', function (e) {
                if (e.target !== fileInputRes) {
                    console.log('🖱️ Click en área de upload residencia');
                    fileInputRes.click();
                }
            });

            console.log('✅ File upload residencia configurado');
        } else {
            console.error('❌ No se encontró file upload residencia');
        }

        // Trabajo
        const fileInputTrab = document.getElementById('archivoCVTrab');
        const fileUploadDivTrab = fileInputTrab?.closest('.file-upload');

        if (fileInputTrab && fileUploadDivTrab) {
            fileInputTrab.addEventListener('change', function (e) {
                console.log('📎 Archivo trabajo seleccionado:', e.target.files[0]?.name || 'ninguno');
                handleFileSelect(this, 'fileInfoTrab');
            });

            fileUploadDivTrab.addEventListener('click', function (e) {
                if (e.target !== fileInputTrab) {
                    console.log('🖱️ Click en área de upload trabajo');
                    fileInputTrab.click();
                }
            });

            console.log('✅ File upload trabajo configurado');
        } else {
            console.error('❌ No se encontró file upload trabajo');
        }

        setupDragAndDrop();
    }

    function setupDragAndDrop() {
        const fileUploads = document.querySelectorAll('.file-upload');

        fileUploads.forEach(upload => {
            ['dragover', 'dragenter'].forEach(eventName => {
                upload.addEventListener(eventName, function (e) {
                    e.preventDefault();
                    e.stopPropagation();
                    this.style.borderColor = '#667eea';
                    this.style.background = '#f0f8ff';
                });
            });

            ['dragleave', 'dragend'].forEach(eventName => {
                upload.addEventListener(eventName, function (e) {
                    e.preventDefault();
                    e.stopPropagation();
                    this.style.borderColor = '';
                    this.style.background = '';
                });
            });

            upload.addEventListener('drop', function (e) {
                e.preventDefault();
                e.stopPropagation();

                this.style.borderColor = '';
                this.style.background = '';

                const files = e.dataTransfer.files;
                if (files.length > 0) {
                    const fileInput = this.querySelector('input[type="file"]');
                    if (fileInput) {
                        const dt = new DataTransfer();
                        dt.items.add(files[0]);
                        fileInput.files = dt.files;

                        const event = new Event('change', { bubbles: true });
                        fileInput.dispatchEvent(event);
                    }
                }
            });
        });
    }

    function handleFileSelect(fileInput, infoElementId) {
        const file = fileInput.files[0];
        const infoElement = document.getElementById(infoElementId);

        console.log(`📁 Procesando archivo:`, {
            inputId: fileInput.id,
            infoId: infoElementId,
            hasFile: !!file,
            hasInfoElement: !!infoElement
        });

        if (!infoElement) {
            console.error(`❌ No se encontró elemento de info: ${infoElementId}`);
            return;
        }

        if (file) {
            const validation = validateFile(file);

            if (validation.isValid) {
                infoElement.innerHTML = `
                    <strong>✅ ${file.name}</strong><br>
                    <small>Tamaño: ${(file.size / 1024 / 1024).toFixed(2)} MB</small>
                `;
                infoElement.classList.add('show');
                infoElement.style.display = 'block';
                infoElement.style.background = 'linear-gradient(135deg, #d4edda 0%, #c3e6cb 100%)';
                infoElement.style.color = '#155724';
                infoElement.style.borderColor = '#28a745';

                console.log(`✅ Archivo mostrado: ${file.name}`);
            } else {
                infoElement.innerHTML = `<strong>❌ ${validation.error}</strong>`;
                infoElement.classList.add('show');
                infoElement.style.display = 'block';
                infoElement.style.background = 'linear-gradient(135deg, #f8d7da 0%, #f5c6cb 100%)';
                infoElement.style.color = '#721c24';
                infoElement.style.borderColor = '#dc3545';
                fileInput.value = '';

                console.log(`❌ Archivo inválido: ${validation.error}`);
            }
        } else {
            infoElement.classList.remove('show');
            infoElement.style.display = 'none';
            console.log('🗑️ Archivo removido');
        }
    }

    function validateFile(file) {
        const maxSize = 10 * 1024 * 1024; // 10MB
        const allowedTypes = ['.pdf', '.doc', '.docx'];

        if (!file) {
            return { isValid: false, error: 'No se ha seleccionado ningún archivo' };
        }

        if (file.size > maxSize) {
            return { isValid: false, error: 'El archivo excede el tamaño máximo de 10MB' };
        }

        if (file.size === 0) {
            return { isValid: false, error: 'El archivo está vacío' };
        }

        const extension = '.' + file.name.split('.').pop().toLowerCase();
        if (!allowedTypes.includes(extension)) {
            return { isValid: false, error: 'Solo se permiten archivos PDF, DOC y DOCX' };
        }

        return { isValid: true };
    }

    async function handleFormSubmit(form, tipo) {
        console.log(`🚀 Enviando formulario: ${tipo}`);

        const submitBtn = form.querySelector('button[type="submit"]');

        // Limpiar mensajes anteriores
        hideMessages(form);
        clearAllErrors(form);

        // Validar
        if (!validateForm(form, tipo)) {
            console.log('❌ Validación fallida');
            const firstError = form.querySelector('.error-message[style*="block"]');
            if (firstError) {
                firstError.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }
            return;
        }

        // Estado de carga
        setLoadingState(submitBtn, true);

        try {
            // Crear FormData
            const formData = new FormData();

            formData.append('nombreCompleto', getFieldValue(form, 'nombreCompleto'));
            formData.append('email', getFieldValue(form, 'email'));
            formData.append('telefono', getFieldValue(form, 'telefono'));
            formData.append('tipoSolicitud', tipo);
            formData.append('mensaje', getFieldValue(form, 'mensaje') || '');

            if (tipo === 'residencia') {
                formData.append('carrera', getFieldValue(form, 'carrera'));

                // Manejar universidad con lógica para "Otra"
                const universidadSelect = getFieldValue(form, 'universidad');
                const universidadOtra = getUniversidadOtraValue(form);
                const universidadFinal = universidadSelect === 'Otra' && universidadOtra
                    ? universidadOtra
                    : universidadSelect;
                formData.append('universidad', universidadFinal);

                formData.append('experiencia', '');
                formData.append('posicionInteres', '');
            } else {
                formData.append('carrera', '');
                formData.append('universidad', '');
                formData.append('experiencia', getFieldValue(form, 'experiencia'));
                formData.append('posicionInteres', getFieldValue(form, 'posicionInteres'));
            }

            // Archivo
            const fileInput = form.querySelector('input[type="file"]');
            if (fileInput?.files[0]) {
                formData.append('archivoCV', fileInput.files[0]);
                console.log('📎 Archivo adjunto:', fileInput.files[0].name);
            }

            // Mostrar datos en consola
            console.log('📊 Datos a enviar:');
            for (let [key, value] of formData.entries()) {
                if (value instanceof File) {
                    console.log(`  ${key}: [Archivo] ${value.name} (${value.size} bytes)`);
                } else {
                    console.log(`  ${key}: "${value}"`);
                }
            }

            // ENVÍO REAL
            console.log(`🌐 Enviando a: ${API_URL}`);

            const response = await fetch(API_URL, {
                method: 'POST',
                body: formData
            });

            console.log(`📡 Respuesta: ${response.status} ${response.statusText}`);

            if (response.ok) {
                const result = await response.json();
                console.log('✅ Éxito:', result);

                // Mostrar modal de éxito AUTOMÁTICAMENTE
                window.showSuccessModal(tipo);

                // Limpiar y cerrar formulario después de un momento
                setTimeout(() => {
                    clearForm(form);
                    if (tipo === 'residencia') {
                        window.closeResidenciaModal();
                    } else {
                        window.closeTrabajoModal();
                    }
                }, 1000);

            } else {
                const errorText = await response.text();
                console.error('❌ Error servidor:', response.status, errorText);

                showMessage(form,
                    `⚠️ Error del servidor (${response.status}). Por favor, intenta nuevamente.`,
                    'error'
                );
            }

        } catch (error) {
            console.error('❌ Error red:', error);
            showMessage(form, '⚠️ Error de conexión. Verifica tu internet e intenta nuevamente.', 'error');
        } finally {
            setLoadingState(submitBtn, false);
        }
    }

    function validateForm(form, tipo) {
        let isValid = true;

        // Nombre
        const nombre = getFieldValue(form, 'nombreCompleto');
        if (!nombre) {
            showFieldError(form, 'nombreCompleto', 'El nombre completo es requerido');
            isValid = false;
        } else if (nombre.length < 2) {
            showFieldError(form, 'nombreCompleto', 'El nombre debe tener al menos 2 caracteres');
            isValid = false;
        }

        // Email
        const email = getFieldValue(form, 'email');
        if (!email) {
            showFieldError(form, 'email', 'El email es requerido');
            isValid = false;
        } else if (!isValidEmail(email)) {
            showFieldError(form, 'email', 'El formato del email no es válido');
            isValid = false;
        }

        // Teléfono
        const telefono = getFieldValue(form, 'telefono');
        if (!telefono) {
            showFieldError(form, 'telefono', 'El teléfono es requerido');
            isValid = false;
        } else if (telefono.length < 10) {
            showFieldError(form, 'telefono', 'El teléfono debe tener al menos 10 dígitos');
            isValid = false;
        }

        // Campos específicos
        if (tipo === 'residencia') {
            if (!getFieldValue(form, 'carrera')) {
                showFieldError(form, 'carrera', 'La carrera es requerida');
                isValid = false;
            }

            if (!validateUniversidadField(form)) {
                isValid = false;
            }
        } else {
            if (!getFieldValue(form, 'experiencia')) {
                showFieldError(form, 'experiencia', 'La experiencia es requerida');
                isValid = false;
            }
            if (!getFieldValue(form, 'posicionInteres')) {
                showFieldError(form, 'posicionInteres', 'La posición de interés es requerida');
                isValid = false;
            }

            // CV obligatorio para trabajo
            const fileInput = form.querySelector('input[type="file"]');
            if (!fileInput?.files[0]) {
                showFieldError(form, 'archivoCV', 'El CV es requerido para solicitudes de trabajo');
                isValid = false;
            }
        }

        // Validar archivo si existe
        const fileInput = form.querySelector('input[type="file"]');
        if (fileInput?.files[0]) {
            const fileValidation = validateFile(fileInput.files[0]);
            if (!fileValidation.isValid) {
                showFieldError(form, 'archivoCV', fileValidation.error);
                isValid = false;
            }
        }

        return isValid;
    }

    function validateUniversidadField(form) {
        const universidadSelect = document.getElementById('universidadRes');
        const universidadOtraInput = document.getElementById('universidadOtraRes');

        if (!universidadSelect) {
            console.error('❌ Select universidad no encontrado');
            return false;
        }

        const universidad = universidadSelect.value;
        const universidadOtra = universidadOtraInput ? universidadOtraInput.value.trim() : '';

        // Limpiar errores previos
        clearFieldError(universidadSelect);
        if (universidadOtraInput) {
            clearFieldError(universidadOtraInput);
        }

        if (!universidad) {
            showFieldError(form, 'universidad', 'La universidad es requerida');
            return false;
        }

        if (universidad === 'Otra' && !universidadOtra) {
            showFieldError(form, 'universidadOtra', 'Por favor especifica el nombre de tu universidad');
            return false;
        }

        if (universidadOtra && universidadOtra.length < 3) {
            showFieldError(form, 'universidadOtra', 'El nombre de la universidad debe tener al menos 3 caracteres');
            return false;
        }

        return true;
    }

    function getUniversidadOtraValue(form) {
        const universidadOtraInput = document.getElementById('universidadOtraRes');
        return universidadOtraInput ? universidadOtraInput.value.trim() : '';
    }

    function getFieldValue(form, fieldName) {
        if (fieldName === 'universidadOtra') {
            return getUniversidadOtraValue(form);
        }

        const field = form.querySelector(`[name="${fieldName}"], #${fieldName}Res, #${fieldName}Trab`);
        return field?.value.trim() || '';
    }

    function showFieldError(form, fieldName, message) {
        const field = form.querySelector(`[name="${fieldName}"], #${fieldName}Res, #${fieldName}Trab`);
        if (!field) return;

        let errorElement = form.querySelector(`#${field.id}Error`);
        if (!errorElement) {
            errorElement = document.createElement('div');
            errorElement.className = 'error-message';
            errorElement.id = `${field.id}Error`;
            field.parentNode.appendChild(errorElement);
        }

        errorElement.textContent = message;
        errorElement.style.display = 'block';

        field.style.borderColor = '#fc466b';
        field.style.boxShadow = '0 0 0 3px rgba(252, 70, 107, 0.1)';
    }

    function clearFieldError(field) {
        const errorElement = field.parentNode.querySelector('.error-message');
        if (errorElement) {
            errorElement.style.display = 'none';
        }
        field.style.borderColor = '';
        field.style.boxShadow = '';
    }

    function clearAllErrors(form) {
        const errorElements = form.querySelectorAll('.error-message');
        errorElements.forEach(el => el.style.display = 'none');

        const fields = form.querySelectorAll('input, select, textarea');
        fields.forEach(field => {
            field.style.borderColor = '';
            field.style.boxShadow = '';
        });
    }

    function showMessage(form, message, type) {
        let messageDiv = form.querySelector('.form-message');
        if (!messageDiv) {
            messageDiv = document.createElement('div');
            messageDiv.className = 'form-message';
            form.insertBefore(messageDiv, form.firstChild);
        }

        messageDiv.textContent = message;
        messageDiv.className = `form-message ${type}`;
        messageDiv.style.display = 'block';
    }

    function hideMessages(form) {
        const messageDiv = form.querySelector('.form-message');
        if (messageDiv) {
            messageDiv.style.display = 'none';
        }
    }

    function clearForm(form) {
        if (!form) return;

        form.reset();

        // Limpiar file info
        const fileInfos = form.querySelectorAll('.file-info');
        fileInfos.forEach(info => {
            info.classList.remove('show');
            info.style.display = 'none';
        });

        // Limpiar campo universidad personalizada
        const customDiv = document.getElementById('universidadCustomRes');
        const customInput = document.getElementById('universidadOtraRes');

        if (customDiv && customDiv.classList.contains('show')) {
            customDiv.classList.remove('show');
            setTimeout(() => {
                customDiv.style.display = 'none';
            }, 300);
        }

        if (customInput) {
            customInput.required = false;
            customInput.value = '';
        }

        clearAllErrors(form);
        hideMessages(form);
    }

    function setLoadingState(button, loading) {
        if (!button) return;

        if (loading) {
            button.disabled = true;
            button.textContent = '⏳ Enviando CV...';
            button.style.opacity = '0.7';
        } else {
            button.disabled = false;
            button.textContent = button.closest('#residenciaForm') ?
                '🚀 Enviar Solicitud de Residencia' :
                '🚀 Enviar CV para Trabajo';
            button.style.opacity = '1';
        }
    }

    function isValidEmail(email) {
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    }

})();

// AGREGAR ESTE CÓDIGO SOLO PARA PRUEBAS DE DESARROLLO
// REMOVER ANTES DE SUBIR A PRODUCCIÓN
/*
document.addEventListener('DOMContentLoaded', function() {
    // Botones de demo para pruebas - REMOVER EN PRODUCCIÓN
    if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
        document.body.innerHTML += `
            <div style="position: fixed; top: 20px; right: 20px; z-index: 11000; background: rgba(255,255,255,0.9); padding: 10px; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
                <div style="font-size: 12px; color: #666; margin-bottom: 5px;">🧪 MODO DESARROLLO</div>
                <button onclick="showSuccessModal('residencia')" style="margin: 3px; padding: 8px 12px; background: #28a745; color: white; border: none; border-radius: 4px; cursor: pointer; font-size: 12px;">
                    Test Residencia
                </button>
                <button onclick="showSuccessModal('trabajo')" style="margin: 3px; padding: 8px 12px; background: #007bff; color: white; border: none; border-radius: 4px; cursor: pointer; font-size: 12px;">
                    Test Trabajo
                </button>
            </div>
        `;
    }
});
*/