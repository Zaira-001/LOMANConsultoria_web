// admin-solicitudes.js - Sistema completo con notificaciones mejoradas
console.log('🚀 Cargando admin-solicitudes.js...');

if (window.adminSolicitudesActive) {
    console.log('⚠️ Admin solicitudes ya inicializado');
} else {
    window.adminSolicitudesActive = true;

    const API_CONFIG = {
        BASE_URL: 'http://consultoriaintegralsc.somee.com/api/CV',
        TIMEOUT: 10000
    };

    let solicitudes = [];
    let filteredSolicitudes = [];
    let activeTab = 'residencias';

    // ============================================
    // SISTEMA DE NOTIFICACIONES
    // ============================================

    function ensureNotificationContainer() {
        let container = document.getElementById('notificationsContainer');
        if (!container) {
            container = document.createElement('div');
            container.id = 'notificationsContainer';
            container.className = 'notifications-container';
            document.body.appendChild(container);
        }
        return container;
    }

    function showNotification(type, title, message, duration = 5000) {
        const container = ensureNotificationContainer();

        const icons = {
            success: '✅',
            error: '❌',
            warning: '⚠️',
            info: 'ℹ️'
        };

        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.innerHTML = `
            <div class="notification-icon">${icons[type]}</div>
            <div class="notification-content">
                <div class="notification-title">${title}</div>
                ${message ? `<div class="notification-message">${message}</div>` : ''}
            </div>
            <button class="notification-close" onclick="closeNotification(this)">×</button>
        `;

        container.appendChild(notification);

        if (duration > 0) {
            setTimeout(() => closeNotification(notification), duration);
        }

        return notification;
    }

    function closeNotification(element) {
        const notification = element.classList ? element : element.closest('.notification');
        if (notification) {
            notification.classList.add('removing');
            setTimeout(() => notification.remove(), 300);
        }
    }

    function showSuccess(title, message = '', duration = 5000) {
        return showNotification('success', title, message, duration);
    }

    function showError(title, message = '', duration = 8000) {
        return showNotification('error', title, message, duration);
    }

    function showWarning(title, message = '', duration = 6000) {
        return showNotification('warning', title, message, duration);
    }

    function showInfo(title, message = '', duration = 5000) {
        return showNotification('info', title, message, duration);
    }

    function showConfirm(options) {
        return new Promise((resolve) => {
            let modal = document.getElementById('confirmModalNew');
            if (!modal) {
                modal = document.createElement('div');
                modal.id = 'confirmModalNew';
                modal.className = 'confirm-overlay';
                document.body.appendChild(modal);
            }

            const {
                title = '¿Estás seguro?',
                message = 'Esta acción no se puede deshacer',
                confirmText = 'Confirmar',
                cancelText = 'Cancelar',
                type = 'warning',
                details = null
            } = options;

            const icons = {
                warning: '⚠️',
                danger: '🗑️',
                info: 'ℹ️'
            };

            let detailsHTML = '';
            if (details && details.length > 0) {
                detailsHTML = `
                    <div class="confirm-body">
                        <div class="confirm-details">
                            ${details.map(d => `
                                <div class="confirm-detail-item">
                                    <span class="confirm-detail-label">${escapeHtml(d.label)}</span>
                                    <span class="confirm-detail-value">${escapeHtml(d.value)}</span>
                                </div>
                            `).join('')}
                        </div>
                    </div>
                `;
            }

            modal.innerHTML = `
                <div class="confirm-modal">
                    <div class="confirm-header">
                        <div class="confirm-header-content">
                            <div class="confirm-icon ${type}">${icons[type]}</div>
                            <div class="confirm-text">
                                <h3>${escapeHtml(title)}</h3>
                                <p>${escapeHtml(message)}</p>
                            </div>
                        </div>
                    </div>
                    ${detailsHTML}
                    <div class="confirm-actions">
                        <button class="confirm-btn confirm-btn-cancel" id="confirmCancelBtn">
                            ${escapeHtml(cancelText)}
                        </button>
                        <button class="confirm-btn confirm-btn-confirm ${type === 'danger' ? '' : 'success'}" id="confirmOkBtn">
                            ${escapeHtml(confirmText)}
                        </button>
                    </div>
                </div>
            `;

            modal.classList.add('active');

            document.getElementById('confirmCancelBtn').onclick = () => {
                modal.classList.remove('active');
                resolve(false);
            };

            document.getElementById('confirmOkBtn').onclick = () => {
                modal.classList.remove('active');
                resolve(true);
            };

            modal.onclick = (e) => {
                if (e.target === modal) {
                    modal.classList.remove('active');
                    resolve(false);
                }
            };

            const escHandler = (e) => {
                if (e.key === 'Escape') {
                    modal.classList.remove('active');
                    resolve(false);
                    document.removeEventListener('keydown', escHandler);
                }
            };
            document.addEventListener('keydown', escHandler);
        });
    }

    // ============================================
    // FUNCIONES DE API
    // ============================================

    async function apiRequest(url, options = {}) {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), API_CONFIG.TIMEOUT);

        try {
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

            if (!response.ok) {
                let errorMessage = `HTTP ${response.status}`;
                try {
                    const errorBody = await response.text();
                    if (errorBody) errorMessage += `: ${errorBody}`;
                } catch (e) { }
                throw new Error(errorMessage);
            }

            return await response.json();
        } catch (error) {
            clearTimeout(timeoutId);
            if (error.name === 'AbortError') {
                throw new Error('Timeout - servidor lento');
            }
            throw error;
        }
    }

    // ============================================
    // CARGAR Y RENDERIZAR SOLICITUDES
    // ============================================

    async function loadSolicitudes() {
        try {
            showLoading(true, 'Cargando solicitudes...');
            console.log('📥 Cargando solicitudes desde:', API_CONFIG.BASE_URL);

            const data = await apiRequest(API_CONFIG.BASE_URL);
            solicitudes = Array.isArray(data) ? data : [];
            filteredSolicitudes = [...solicitudes];

            console.log(`✅ ${solicitudes.length} solicitudes cargadas`);

            updateStats();
            switchTab('residencias');

            showSuccess('Solicitudes cargadas', `${solicitudes.length} solicitudes disponibles`);
        } catch (error) {
            console.error('❌ Error cargando solicitudes:', error);
            showError('Error al cargar', error.message);
            solicitudes = [];
            filteredSolicitudes = [];
            renderGrid();
        } finally {
            showLoading(false);
        }
    }

    function renderGrid() {
        const container = document.getElementById('kanbanContainer');
        if (!container) {
            console.error('❌ Container no encontrado');
            return;
        }

        if (filteredSolicitudes.length === 0) {
            container.innerHTML = `
                <div class="solicitudes-empty">
                    <div class="solicitudes-empty-icon">📭</div>
                    <h3>No hay solicitudes</h3>
                    <p>No se encontraron solicitudes con los filtros aplicados.</p>
                </div>
            `;
            updateTabCounts();
            return;
        }

        let solicitudesToShow = filteredSolicitudes.filter(s => {
            const tipo = (s.tipoSolicitud || '').toLowerCase();
            const tab = activeTab.toLowerCase();
            const tipoBase = tipo.replace(/s$/, '');
            const tabBase = tab.replace(/s$/, '');
            return tipoBase === tabBase;
        });

        const pendientes = solicitudesToShow.filter(s => !s.procesado).length;
        const procesados = solicitudesToShow.filter(s => s.procesado).length;

        const tabInfo = {
            residencias: { titulo: '🎓 Solicitudes de Residencias', icono: '🎓' },
            trabajos: { titulo: '💼 Solicitudes de Trabajo', icono: '💼' }
        };

        const { titulo, icono } = tabInfo[activeTab];

        let html = `
            <div class="solicitudes-section ${activeTab}">
                <div class="solicitudes-section-header">
                    <div class="solicitudes-section-title">
                        <span class="solicitudes-section-icon">${icono}</span>
                        <h2>${titulo}</h2>
                    </div>
                    <div class="solicitudes-section-stats">
                        <div class="section-stat">
                            <span>📊 Total: ${solicitudesToShow.length}</span>
                        </div>
                        <div class="section-stat">
                            <span>⏳ Pendientes: ${pendientes}</span>
                        </div>
                        <div class="section-stat">
                            <span>✅ Procesados: ${procesados}</span>
                        </div>
                    </div>
                </div>
                <div class="solicitudes-grid">
        `;

        if (solicitudesToShow.length === 0) {
            html += `
                <div class="solicitudes-empty" style="grid-column: 1 / -1;">
                    <div class="solicitudes-empty-icon">📭</div>
                    <h3>No hay solicitudes de ${activeTab}</h3>
                    <p>No se encontraron solicitudes con los filtros aplicados.</p>
                </div>
            `;
        } else {
            solicitudesToShow.forEach(solicitud => {
                html += createGridCard(solicitud);
            });
        }

        html += `
                </div>
            </div>
        `;

        container.innerHTML = html;
        updateTabCounts();

        console.log(`✅ Grid renderizado: ${solicitudesToShow.length} solicitudes de ${activeTab}`);
    }

    function createGridCard(solicitud) {
        const fecha = formatDateShort(solicitud.fechaAlta);
        const tieneCV = solicitud.archivoCV && solicitud.nombreArchivoCV;

        let estadoClass = 'pendiente';
        let estadoText = '⏳ Pendiente';

        if (solicitud.procesado) {
            estadoClass = 'procesado';
            estadoText = '✅ Procesado';

            if (solicitud.fechaEntrevista) {
                const fechaEnt = new Date(solicitud.fechaEntrevista);
                const fechaTexto = fechaEnt.toLocaleDateString('es-ES', {
                    day: '2-digit',
                    month: 'short'
                });
                estadoText = `✅ Entrevista: ${fechaTexto}`;
            }
        }

        return `
            <div class="solicitud-card">
                <span class="solicitud-status-badge ${estadoClass}">${estadoText}</span>
                
                <div class="solicitud-card-header">
                    <h3>${escapeHtml(solicitud.nombreCompleto)}</h3>
                    <div class="solicitud-card-email">
                        <span>📧</span>
                        ${escapeHtml(solicitud.email)}
                    </div>
                </div>

                <div class="solicitud-info-grid">
                    <div class="solicitud-info-item">
                        <span class="solicitud-info-label">Teléfono</span>
                        <span class="solicitud-info-value">
                            <span class="solicitud-info-icon">📱</span>
                            ${escapeHtml(solicitud.telefono)}
                        </span>
                    </div>
                    
                    <div class="solicitud-info-item">
                        <span class="solicitud-info-label">Fecha</span>
                        <span class="solicitud-info-value">
                            <span class="solicitud-info-icon">📅</span>
                            ${fecha}
                        </span>
                    </div>
                </div>

                ${solicitud.tipoSolicitud === 'residencia' ? `
                    <div class="solicitud-details">
                        <div class="solicitud-detail-item">
                            <span class="solicitud-detail-icon">🏫</span>
                            <div class="solicitud-detail-content">
                                <div class="solicitud-detail-label">Universidad</div>
                                <div class="solicitud-detail-value">${escapeHtml(solicitud.universidad || 'N/A')}</div>
                            </div>
                        </div>
                        <div class="solicitud-detail-item">
                            <span class="solicitud-detail-icon">📚</span>
                            <div class="solicitud-detail-content">
                                <div class="solicitud-detail-label">Carrera</div>
                                <div class="solicitud-detail-value">${escapeHtml(solicitud.carrera || 'N/A')}</div>
                            </div>
                        </div>
                    </div>
                ` : `
                    <div class="solicitud-details">
                        <div class="solicitud-detail-item">
                            <span class="solicitud-detail-icon">💼</span>
                            <div class="solicitud-detail-content">
                                <div class="solicitud-detail-label">Posición de Interés</div>
                                <div class="solicitud-detail-value">${escapeHtml(solicitud.posicionInteres || 'N/A')}</div>
                            </div>
                        </div>
                        <div class="solicitud-detail-item">
                            <span class="solicitud-detail-icon">⏱️</span>
                            <div class="solicitud-detail-content">
                                <div class="solicitud-detail-label">Experiencia</div>
                                <div class="solicitud-detail-value">${escapeHtml(solicitud.experiencia || 'N/A')}</div>
                            </div>
                        </div>
                    </div>
                `}

                <div class="solicitud-badges">
                    <span class="solicitud-badge ${tieneCV ? 'con-cv' : 'sin-cv'}">
                        ${tieneCV ? '📎 Con CV' : '⚠️ Sin CV'}
                    </span>
                </div>

                <div class="solicitud-card-footer">
                    <div class="solicitud-date">
                        <span>🕒</span>
                        ${fecha}
                    </div>
                    
                    <div class="solicitud-actions">
                        <button class="solicitud-btn solicitud-btn-primary" onclick="showDetail(${solicitud.id})">
                            👁️ Ver
                        </button>
                        ${tieneCV ? `
                            <button class="solicitud-btn solicitud-btn-info" onclick="downloadCV(${solicitud.id})">
                                ⬇️ CV
                            </button>
                        ` : ''}
                        <button class="solicitud-btn solicitud-btn-danger" onclick="confirmDeleteSolicitud(${solicitud.id})">
                            🗑️
                        </button>
                    </div>
                    
                    <div class="solicitud-actions-dropdown">
                        <button class="solicitud-actions-toggle" onclick="toggleActionsMenu(event, ${solicitud.id})">
                            ⋮
                        </button>
                        <div class="solicitud-actions-menu" id="actionsMenu${solicitud.id}">
                            <button onclick="showDetail(${solicitud.id}); closeAllMenus()">
                                <span>👁️</span> Ver Detalles
                            </button>
                            ${tieneCV ? `
                                <button onclick="downloadCV(${solicitud.id}); closeAllMenus()">
                                    <span>⬇️</span> Descargar CV
                                </button>
                            ` : ''}
                            ${!solicitud.procesado ? `
                                <button onclick="markAsProcessed(${solicitud.id}); closeAllMenus()">
                                    <span>📅</span> Agendar Entrevista
                                </button>
                            ` : ''}
                            <button onclick="confirmDeleteSolicitud(${solicitud.id}); closeAllMenus()">
                                <span>🗑️</span> Eliminar
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    // ============================================
    // FUNCIONES DE INTERFAZ
    // ============================================

    function toggleActionsMenu(event, id) {
        event.stopPropagation();
        closeAllMenus();
        const menu = document.getElementById(`actionsMenu${id}`);
        if (menu) {
            menu.classList.toggle('active');
        }
    }

    function closeAllMenus() {
        document.querySelectorAll('.solicitud-actions-menu').forEach(menu => {
            menu.classList.remove('active');
        });
    }

    document.addEventListener('click', function (event) {
        if (!event.target.closest('.solicitud-actions-dropdown')) {
            closeAllMenus();
        }
    });

    function switchTab(tab) {
        if (tab !== 'residencias' && tab !== 'trabajos') {
            console.warn('❌ Tab inválido:', tab);
            return;
        }

        console.log(`🔄 Cambiando a tab: ${tab}`);
        activeTab = tab;

        document.querySelectorAll('.tab-button').forEach(btn => {
            btn.classList.remove('active');
        });

        const activeButton = document.getElementById(`tab${capitalizeFirst(tab)}`);
        if (activeButton) {
            activeButton.classList.add('active');
        }

        if (filteredSolicitudes.length > 0) {
            renderGrid();
        }
    }

    function updateTabCounts() {
        const residencias = filteredSolicitudes.filter(s => {
            const tipo = (s.tipoSolicitud || '').toLowerCase().replace(/s$/, '');
            return tipo === 'residencia';
        });
        const trabajos = filteredSolicitudes.filter(s => {
            const tipo = (s.tipoSolicitud || '').toLowerCase().replace(/s$/, '');
            return tipo === 'trabajo';
        });

        setTextContent('countTabResidencias', residencias.length);
        setTextContent('countTabTrabajos', trabajos.length);
    }

    function capitalizeFirst(str) {
        return str.charAt(0).toUpperCase() + str.slice(1);
    }

    function updateStats() {
        const total = solicitudes.length;

        const residencias = solicitudes.filter(s => {
            const tipo = (s.tipoSolicitud || '').toLowerCase().replace(/s$/, '');
            return tipo === 'residencia';
        }).length;
        const trabajos = solicitudes.filter(s => {
            const tipo = (s.tipoSolicitud || '').toLowerCase().replace(/s$/, '');
            return tipo === 'trabajo';
        }).length;

        const pendientes = solicitudes.filter(s => !s.procesado).length;
        const procesados = solicitudes.filter(s => s.procesado).length;

        setTextContent('totalSolicitudes', total);
        setTextContent('totalResidencias', residencias);
        setTextContent('totalTrabajos', trabajos);
        setTextContent('pendientes', pendientes);
        setTextContent('procesados', procesados);
    }

    function filterSolicitudes() {
        const tipoFilter = document.getElementById('filterTipo')?.value;
        const estadoFilter = document.getElementById('filterEstado')?.value;
        const searchTerm = document.getElementById('searchInput')?.value.toLowerCase() || '';

        filteredSolicitudes = solicitudes.filter(solicitud => {
            let tipoMatch = true;
            if (tipoFilter) {
                const solicitudTipo = (solicitud.tipoSolicitud || '').toLowerCase().replace(/s$/, '');
                const filterTipo = tipoFilter.toLowerCase().replace(/s$/, '');
                tipoMatch = solicitudTipo === filterTipo;
            }

            let estadoMatch = !estadoFilter ||
                (estadoFilter === 'pendiente' && !solicitud.procesado) ||
                (estadoFilter === 'procesado' && solicitud.procesado);
            let searchMatch = !searchTerm ||
                solicitud.nombreCompleto.toLowerCase().includes(searchTerm) ||
                solicitud.email.toLowerCase().includes(searchTerm) ||
                solicitud.telefono.includes(searchTerm);

            return tipoMatch && estadoMatch && searchMatch;
        });

        renderGrid();
    }

    function searchSolicitudes() {
        filterSolicitudes();
    }

    // ============================================
    // OPERACIONES CRUD
    // ============================================

    async function markAsProcessed(id) {
        const solicitud = solicitudes.find(s => s.id === id);

        if (!solicitud) {
            showError('Error', 'Solicitud no encontrada');
            return;
        }

        openInterviewModal(id);
    }

    async function downloadCV(id) {
        try {
            showLoading(true, 'Preparando descarga...');
            console.log('📥 Iniciando descarga de CV para ID:', id);

            const solicitud = solicitudes.find(s => s.id === id);

            if (!solicitud) {
                showError('Error', 'No se encontró la solicitud');
                return;
            }

            if (!solicitud.archivoCV) {
                showError('Sin CV', 'Esta solicitud no tiene CV adjunto');
                return;
            }

            const base64Data = solicitud.archivoCV;
            const fileName = solicitud.nombreArchivoCV || `CV_${solicitud.nombreCompleto.replace(/\s+/g, '_')}.pdf`;

            const byteCharacters = atob(base64Data);
            const byteNumbers = new Array(byteCharacters.length);
            for (let i = 0; i < byteCharacters.length; i++) {
                byteNumbers[i] = byteCharacters.charCodeAt(i);
            }
            const byteArray = new Uint8Array(byteNumbers);
            const blob = new Blob([byteArray], { type: 'application/pdf' });

            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = fileName;
            a.style.display = 'none';
            document.body.appendChild(a);

            a.click();

            setTimeout(() => {
                window.URL.revokeObjectURL(url);
                document.body.removeChild(a);
            }, 100);

            showSuccess('CV descargado', fileName);
        } catch (error) {
            console.error('❌ Error descargando CV:', error);
            showError('Error al descargar', error.message);
        } finally {
            showLoading(false);
        }
    }

    async function confirmDeleteSolicitud(id) {
        const solicitud = solicitudes.find(s => s.id === id);

        if (!solicitud) {
            showError('Error', 'Solicitud no encontrada');
            return;
        }

        const confirmed = await showConfirm({
            title: '¿Eliminar solicitud?',
            message: 'Esta acción eliminará permanentemente todos los datos',
            confirmText: 'Sí, eliminar',
            cancelText: 'Cancelar',
            type: 'danger',
            details: [
                { label: '👤 Candidato', value: solicitud.nombreCompleto },
                { label: '📧 Email', value: solicitud.email },
                { label: '📅 Fecha', value: formatDateShort(solicitud.fechaAlta) },
                { label: '📋 Tipo', value: solicitud.tipoSolicitud === 'residencia' ? '🎓 Residencia' : '💼 Trabajo' }
            ]
        });

        if (confirmed) {
            await deleteSolicitud(id);
        }
    }

    async function deleteSolicitud(id) {
        try {
            showLoading(true, 'Eliminando solicitud...');

            await fetch(`${API_CONFIG.BASE_URL}/${id}`, { method: 'DELETE' });

            showSuccess('Eliminada', 'La solicitud se eliminó correctamente');

            setTimeout(async () => {
                await loadSolicitudes();
            }, 1000);
        } catch (error) {
            console.error('Error:', error);
            showError('Error al eliminar', error.message);
        } finally {
            showLoading(false);
        }
    }

    // ============================================
    // MODAL DE DETALLE
    // ============================================

    async function showDetail(id) {
        try {
            console.log('👁️ Abriendo detalle para ID:', id);
            closeAllMenus();

            const solicitud = solicitudes.find(s => s.id === id);
            if (!solicitud) {
                console.error('❌ Solicitud no encontrada');
                showError('Error', 'Solicitud no encontrada');
                return;
            }

            const modal = document.getElementById('detailModal');
            const modalBody = document.getElementById('detailModalBody');
            const modalTitle = document.getElementById('detailModalTitle');

            if (!modal || !modalBody || !modalTitle) {
                console.error('❌ Elementos del modal no encontrados');
                showError('Error', 'No se pudo abrir el modal');
                return;
            }

            modal.className = 'modal-overlay';
            modal.removeAttribute('style');

            modalTitle.textContent = `Detalle de Solicitud - ${solicitud.nombreCompleto}`;

            const tieneCV = solicitud.archivoCV && solicitud.nombreArchivoCV;
            const tieneEntrevista = solicitud.procesado && (solicitud.fechaEntrevista || solicitud.enlaceVirtual || solicitud.telefonoContacto || solicitud.direccionEntrevista);

            modalBody.innerHTML = `
            <div class="detail-section">
                <h3>📋 Información General</h3>
                <div class="detail-grid">
                    <div class="detail-item">
                        <strong>Tipo:</strong>
                        <span>${solicitud.tipoSolicitud === 'residencia' ? '🎓 Residencia' : '💼 Trabajo'}</span>
                    </div>
                    <div class="detail-item">
                        <strong>Estado:</strong>
                        <span>${solicitud.procesado ? '✅ Procesado' : '⏳ Pendiente'}</span>
                    </div>
                    <div class="detail-item">
                        <strong>Nombre:</strong>
                        <span>${escapeHtml(solicitud.nombreCompleto)}</span>
                    </div>
                    <div class="detail-item">
                        <strong>Email:</strong>
                        <span>${escapeHtml(solicitud.email)}</span>
                    </div>
                    <div class="detail-item">
                        <strong>Teléfono:</strong>
                        <span>${escapeHtml(solicitud.telefono)}</span>
                    </div>
                    <div class="detail-item">
                        <strong>Fecha de Solicitud:</strong>
                        <span>${formatDate(solicitud.fechaAlta)}</span>
                    </div>
                </div>
            </div>

            ${tieneEntrevista ? `
                <div class="detail-section interview-section">
                    <h3>📅 Información de Entrevista</h3>
                    
                    <div class="detail-grid">
                        <div class="detail-item">
                            <strong>📅 Fecha:</strong>
                            <span>${solicitud.fechaEntrevista ? formatDateOnly(solicitud.fechaEntrevista) : 'No especificada'}</span>
                        </div>
                        <div class="detail-item">
                            <strong>⏰ Hora:</strong>
                            <span>${escapeHtml(solicitud.horaEntrevista || 'No especificada')}</span>
                        </div>
                        ${solicitud.fechaProcesado ? `
                            <div class="detail-item">
                                <strong>🕐 Procesado el:</strong>
                                <span>${formatDate(solicitud.fechaProcesado)}</span>
                            </div>
                        ` : ''}
                    </div>

                    <!-- Modalidad Virtual -->
                    <div class="modality-card ${solicitud.enlaceVirtual ? 'has-data' : 'no-data'}">
                        <div class="modality-header">
                            <h4>💻 Modalidad Virtual</h4>
                            <span class="modality-badge ${solicitud.enlaceVirtual ? 'configured' : 'pending'}">
                                ${solicitud.enlaceVirtual ? '✅ Configurada' : '⏳ Pendiente'}
                            </span>
                        </div>
                        <div class="modality-content">
                            ${solicitud.enlaceVirtual ? `
                                <div class="modality-field">
                                    <strong>🔗 Enlace de Reunión:</strong>
                                    <div class="link-container">
                                        <a href="${escapeHtml(solicitud.enlaceVirtual)}" target="_blank" class="meeting-link">
                                            ${escapeHtml(solicitud.enlaceVirtual)}
                                        </a>
                                        <button class="copy-btn" onclick="copyToClipboard('${escapeHtml(solicitud.enlaceVirtual)}', this)">
                                            📋 Copiar
                                        </button>
                                    </div>
                                </div>
                            ` : `
                                <p class="empty-state">📭 No se proporcionó enlace. Se enviará 1 hora antes de la entrevista.</p>
                            `}
                            ${solicitud.instruccionesVirtual ? `
                                <div class="modality-field">
                                    <strong>📝 Instrucciones:</strong>
                                    <p class="instructions-text">${escapeHtml(solicitud.instruccionesVirtual)}</p>
                                </div>
                            ` : ''}
                        </div>
                    </div>

                    <!-- Modalidad Telefónica -->
                    <div class="modality-card ${solicitud.telefonoContacto ? 'has-data' : 'no-data'}">
                        <div class="modality-header">
                            <h4>📞 Modalidad Telefónica</h4>
                            <span class="modality-badge ${solicitud.telefonoContacto ? 'configured' : 'pending'}">
                                ${solicitud.telefonoContacto ? '✅ Configurada' : '⏳ Se usa teléfono del candidato'}
                            </span>
                        </div>
                        <div class="modality-content">
                            <div class="modality-field">
                                <strong>📱 Teléfono de Contacto:</strong>
                                <div class="phone-container">
                                    <span class="phone-number">${escapeHtml(solicitud.telefonoContacto || solicitud.telefono)}</span>
                                    <a href="tel:${escapeHtml(solicitud.telefonoContacto || solicitud.telefono)}" class="call-btn">
                                        📞 Llamar
                                    </a>
                                </div>
                            </div>
                            ${solicitud.instrucionesTelefonica ? `
                                <div class="modality-field">
                                    <strong>📝 Instrucciones:</strong>
                                    <p class="instructions-text">${escapeHtml(solicitud.instrucionesTelefonica)}</p>
                                </div>
                            ` : ''}
                        </div>
                    </div>

                    <!-- Modalidad Presencial -->
                    <div class="modality-card ${solicitud.direccionEntrevista ? 'has-data' : 'no-data'}">
                        <div class="modality-header">
                            <h4>🏢 Modalidad Presencial</h4>
                            <span class="modality-badge configured">✅ Configurada</span>
                        </div>
                        <div class="modality-content">
                            <div class="modality-field">
                                <strong>📍 Dirección:</strong>
                                <p class="address-text">${escapeHtml(solicitud.direccionEntrevista || 'Rio Sena #94, 3er. Piso Col. Rio Lerma Cuauhtémoc, Ciudad de México C.P.06500')}</p>
                            </div>
                            ${solicitud.instruccionesPresencial ? `
                                <div class="modality-field">
                                    <strong>📝 Instrucciones:</strong>
                                    <p class="instructions-text">${escapeHtml(solicitud.instruccionesPresencial)}</p>
                                </div>
                            ` : ''}
                        </div>
                    </div>

                    ${solicitud.mensajePersonalizado ? `
                        <div class="detail-subsection">
                            <h4>💬 Mensaje Personalizado Enviado</h4>
                            <div class="message-box">
                                <p>${escapeHtml(solicitud.mensajePersonalizado)}</p>
                            </div>
                        </div>
                    ` : ''}

                    ${solicitud.notasAdmin ? `
                        <div class="detail-subsection">
                            <h4>🔒 Notas Internas del Equipo</h4>
                            <div class="notes-box">
                                <p>${escapeHtml(solicitud.notasAdmin)}</p>
                            </div>
                        </div>
                    ` : ''}
                </div>
            ` : ''}

            ${solicitud.tipoSolicitud === 'residencia' ? `
                <div class="detail-section">
                    <h3>🎓 Información Académica</h3>
                    <div class="detail-grid">
                        <div class="detail-item">
                            <strong>Universidad:</strong>
                            <span>${escapeHtml(solicitud.universidad || 'N/A')}</span>
                        </div>
                        <div class="detail-item">
                            <strong>Carrera:</strong>
                            <span>${escapeHtml(solicitud.carrera || 'N/A')}</span>
                        </div>
                    </div>
                </div>
            ` : `
                <div class="detail-section">
                    <h3>💼 Información Laboral</h3>
                    <div class="detail-grid">
                        <div class="detail-item">
                            <strong>Posición de Interés:</strong>
                            <span>${escapeHtml(solicitud.posicionInteres || 'N/A')}</span>
                        </div>
                        <div class="detail-item">
                            <strong>Experiencia:</strong>
                            <span>${escapeHtml(solicitud.experiencia || 'N/A')}</span>
                        </div>
                    </div>
                </div>
            `}

            ${solicitud.mensaje ? `
                <div class="detail-section">
                    <h3>💬 Mensaje del Candidato</h3>
                    <div class="detail-grid">
                        <div class="detail-item" style="grid-column: 1 / -1;">
                            <span style="white-space: pre-wrap;">${escapeHtml(solicitud.mensaje)}</span>
                        </div>
                    </div>
                </div>
            ` : ''}

            ${tieneCV ? `
                <div class="detail-section">
                    <h3>📎 Curriculum Vitae</h3>
                    <div class="detail-grid">
                        <div class="detail-item" style="grid-column: 1 / -1;">
                            <strong>Archivo:</strong>
                            <span>${escapeHtml(solicitud.nombreArchivoCV)}</span>
                        </div>
                    </div>
                    <button class="solicitud-btn solicitud-btn-info" onclick="downloadCV(${solicitud.id})" style="margin-top: 15px;">
                        ⬇️ Descargar CV
                    </button>
                </div>
            ` : ''}

            <div class="modal-actions">
                ${!solicitud.procesado ? `
                    <button class="solicitud-btn solicitud-btn-success" onclick="markAsProcessed(${solicitud.id}); closeDetailModal();">
                        📅 Agendar Entrevista
                    </button>
                ` : ''}
                <button class="solicitud-btn solicitud-btn-danger" onclick="confirmDeleteSolicitud(${solicitud.id}); closeDetailModal();">
                    🗑️ Eliminar
                </button>
                <button class="solicitud-btn solicitud-btn-primary" onclick="closeDetailModal();">
                    ✖️ Cerrar
                </button>
            </div>
        `;

            modal.classList.add('active');
            modalBody.scrollTop = 0;

            console.log('✅ Modal abierto con información completa');
        } catch (error) {
            console.error('❌ Error al mostrar detalle:', error);
            showError('Error', error.message);
        }
    }

    function formatDateOnly(dateString) {
        if (!dateString) return 'N/A';
        try {
            const date = new Date(dateString);
            return date.toLocaleDateString('es-ES', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric'
            });
        } catch {
            return dateString;
        }
    }

    function copyToClipboard(text, button) {
        navigator.clipboard.writeText(text).then(() => {
            const originalText = button.textContent;
            button.textContent = '✅ Copiado';
            button.style.backgroundColor = '#10b981';

            setTimeout(() => {
                button.textContent = originalText;
                button.style.backgroundColor = '';
            }, 2000);
        }).catch(err => {
            console.error('Error al copiar:', err);
            showError('Error', 'No se pudo copiar al portapapeles');
        });
    }

    function closeDetailModal() {
        const modal = document.getElementById('detailModal');
        if (modal) {
            modal.classList.remove('active');
            document.body.classList.remove('modal-active');
        }
    }

    // Cerrar modal con click en overlay
    if (!window.modalClickListenerAdded) {
        window.modalClickListenerAdded = true;

        document.addEventListener('click', function (event) {
            const modal = document.getElementById('detailModal');
            if (modal && modal.classList.contains('active') && event.target === modal) {
                closeDetailModal();
            }
        });

        document.addEventListener('keydown', function (event) {
            if (event.key === 'Escape') {
                const modal = document.getElementById('detailModal');
                if (modal && modal.classList.contains('active')) {
                    closeDetailModal();
                }
            }
        });
    }

    // ============================================
    // MODAL DE ENTREVISTA
    // ============================================

    function openInterviewModal(id) {
        const solicitud = solicitudes.find(s => s.id === id);
        if (!solicitud) {
            showError('Error', 'Solicitud no encontrada');
            return;
        }

        let modal = document.getElementById('interviewModal');
        if (!modal) {
            modal = createInterviewModal();
            document.body.appendChild(modal);
        }

        document.getElementById('interviewSolicitudId').value = id;
        document.getElementById('interviewNombre').textContent = solicitud.nombreCompleto;
        document.getElementById('interviewEmail').textContent = solicitud.email;
        document.getElementById('interviewTelefono').textContent = solicitud.telefono;
        document.getElementById('interviewTipo').textContent =
            solicitud.tipoSolicitud === 'residencia' ? '🎓 Residencia' : '💼 Trabajo';

        modal.classList.add('active');
        document.body.classList.add('modal-active');
    }

    function createInterviewModal() {
        const modal = document.createElement('div');
        modal.id = 'interviewModal';
        modal.className = 'modal-overlay';
        modal.innerHTML = `
        <div class="modal-large interview-modal">
            <div class="modal-header">
                <h2>📅 Agendar Entrevista</h2>
                <button type="button" class="close-btn" onclick="closeInterviewModal()">&times;</button>
            </div>
            <div class="modal-body">
                <div class="interview-info-section">
                    <h3>Información del Candidato</h3>
                    <div class="info-grid">
                        <div class="info-item">
                            <strong>Nombre:</strong>
                            <span id="interviewNombre"></span>
                        </div>
                        <div class="info-item">
                            <strong>Email:</strong>
                            <span id="interviewEmail"></span>
                        </div>
                        <div class="info-item">
                            <strong>Teléfono:</strong>
                            <span id="interviewTelefono"></span>
                        </div>
                        <div class="info-item">
                            <strong>Tipo:</strong>
                            <span id="interviewTipo"></span>
                        </div>
                    </div>
                </div>

                <form id="interviewForm" onsubmit="submitInterview(event)">
                    <input type="hidden" id="interviewSolicitudId">

                    <div class="form-section">
                        <h3>📅 Detalles de la Entrevista</h3>

                        <div class="form-row">
                            <div class="form-group">
                                <label for="fechaEntrevista">
                                    <span class="label-icon">📅</span>
                                    Fecha de Entrevista *
                                </label>
                                <input type="date" 
                                       id="fechaEntrevista" 
                                       name="fechaEntrevista" 
                                       required
                                       min="${new Date().toISOString().split('T')[0]}">
                            </div>

                            <div class="form-group">
                                <label for="horaEntrevista">
                                    <span class="label-icon">⏰</span>
                                    Hora de Entrevista *
                                </label>
                                <input type="time" 
                                       id="horaEntrevista" 
                                       name="horaEntrevista" 
                                       required>
                            </div>
                        </div>
                    </div>

                    <div class="form-section">
                        <h3>💻 Modalidad Virtual</h3>
                        
                        <div class="form-group">
                            <label for="enlaceVirtual">
                                <span class="label-icon">🔗</span>
                                Enlace de Google Meet (Opcional)
                            </label>
                            <input type="url" 
                                   id="enlaceVirtual" 
                                   name="enlaceVirtual"
                                   placeholder="https://meet.google.com/abc-defg-hij">
                            <small class="form-help">
                                💡 Si no lo proporcionas, se le indicará que se enviará 1 hora antes
                            </small>
                        </div>

                        <div class="form-group">
                            <label for="instruccionesVirtual">
                                <span class="label-icon">📝</span>
                                Instrucciones para Modalidad Virtual
                            </label>
                            <textarea id="instruccionesVirtual" 
                                      name="instruccionesVirtual"
                                      rows="2"
                                      placeholder="Ej: Por favor, prueba tu cámara 10 minutos antes..."></textarea>
                        </div>
                    </div>

                    <div class="form-section">
                        <h3>📞 Modalidad Telefónica</h3>
                        
                        <div class="form-group">
                            <label for="telefonoContacto">
                                <span class="label-icon">📱</span>
                                Teléfono de Contacto (Opcional)
                            </label>
                            <input type="tel" 
                                   id="telefonoContacto" 
                                   name="telefonoContacto"
                                   placeholder="Si es diferente al registrado">
                            <small class="form-help">
                                💡 Si lo dejas vacío, usaremos el teléfono del candidato
                            </small>
                        </div>

                        <div class="form-group">
                            <label for="instrucionesTelefonica">
                                <span class="label-icon">📝</span>
                                Instrucciones para Modalidad Telefónica
                            </label>
                            <textarea id="instrucionesTelefonica" 
                                      name="instrucionesTelefonica"
                                      rows="2"
                                      placeholder="Ej: Te llamaremos desde el número 56-5964-4304..."></textarea>
                        </div>
                    </div>

                    <div class="form-section">
                        <h3>🏢 Modalidad Presencial</h3>
                        
                        <div class="form-group">
                            <label for="direccionEntrevista">
                                <span class="label-icon">📍</span>
                                Dirección de la Entrevista (Opcional)
                            </label>
                            <textarea id="direccionEntrevista" 
                                      name="direccionEntrevista"
                                      rows="2"
                                      placeholder="Deja vacío para usar la dirección por defecto"></textarea>
                            <small class="form-help">
                                💡 Por defecto: Rio Sena #94, 3er. Piso Col. Rio Lerma Cuauhtémoc, CDMX
                            </small>
                        </div>

                        <div class="form-group">
                            <label for="instruccionesPresencial">
                                <span class="label-icon">📝</span>
                                Instrucciones para Modalidad Presencial
                            </label>
                            <textarea id="instruccionesPresencial" 
                                      name="instruccionesPresencial"
                                      rows="2"
                                      placeholder="Ej: Al llegar, preguntar por Recursos Humanos..."></textarea>
                        </div>
                    </div>

                    <div class="form-section">
                        <h3>💬 Mensajes</h3>

                        <div class="form-group">
                            <label for="mensajePersonalizado">
                                <span class="label-icon">✉️</span>
                                Mensaje Personalizado (Opcional)
                            </label>
                            <textarea id="mensajePersonalizado" 
                                      name="mensajePersonalizado"
                                      rows="3"
                                      placeholder="Mensaje que verá el candidato en el email..."></textarea>
                            <small class="form-help">
                                💡 Este mensaje aparecerá destacado en el email de confirmación
                            </small>
                        </div>

                        <div class="form-group">
                            <label for="notasAdmin">
                                <span class="label-icon">🔒</span>
                                Notas Internas (Solo para el equipo)
                            </label>
                            <textarea id="notasAdmin" 
                                      name="notasAdmin"
                                      rows="2"
                                      placeholder="Notas privadas que el candidato NO verá..."></textarea>
                        </div>
                    </div>

                    <div class="modal-actions">
                        <button type="button" class="solicitud-btn solicitud-btn-secondary" 
                                onclick="closeInterviewModal()">
                            ✖️ Cancelar
                        </button>
                        <button type="submit" class="solicitud-btn solicitud-btn-success">
                            ✅ Agendar y Enviar Confirmación
                        </button>
                    </div>
                </form>
            </div>
        </div>
    `;
        return modal;
    }

    async function submitInterview(event) {
        event.preventDefault();

        const id = document.getElementById('interviewSolicitudId').value;

        if (!id) {
            showError('Error', 'No se encontró el ID de la solicitud');
            return;
        }

        const formData = {
            fechaEntrevista: document.getElementById('fechaEntrevista').value,
            horaEntrevista: document.getElementById('horaEntrevista').value,
            enlaceVirtual: document.getElementById('enlaceVirtual')?.value || null,
            instruccionesVirtual: document.getElementById('instruccionesVirtual')?.value || null,
            telefonoContacto: document.getElementById('telefonoContacto')?.value || null,
            instrucionesTelefonica: document.getElementById('instrucionesTelefonica')?.value || null,
            direccionEntrevista: document.getElementById('direccionEntrevista')?.value || null,
            instruccionesPresencial: document.getElementById('instruccionesPresencial')?.value || null,
            mensajePersonalizado: document.getElementById('mensajePersonalizado')?.value || null,
            notas: document.getElementById('notasAdmin')?.value || null
        };

        console.log('📤 Enviando datos de entrevista:', formData);

        try {
            showLoading(true, 'Agendando entrevista...');

            const response = await fetch(`${API_CONFIG.BASE_URL}/${id}/procesar`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(formData)
            });

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`Error ${response.status}: ${errorText}`);
            }

            const result = await response.json();
            console.log('✅ Entrevista agendada:', result);

            closeInterviewModal();

            const fechaFormateada = new Date(formData.fechaEntrevista).toLocaleDateString('es-ES', {
                weekday: 'long',
                day: 'numeric',
                month: 'long'
            });

            showSuccess(
                '¡Entrevista Agendada!',
                `El candidato recibirá un email con la confirmación para ${fechaFormateada} a las ${formData.horaEntrevista}`,
                8000
            );

            setTimeout(async () => {
                await loadSolicitudes();
            }, 1500);

        } catch (error) {
            console.error('❌ Error agendando entrevista:', error);
            showError('Error al agendar', error.message);
        } finally {
            showLoading(false);
        }
    }

    function closeInterviewModal() {
        const modal = document.getElementById('interviewModal');
        if (modal) {
            modal.classList.remove('active');
            document.body.classList.remove('modal-active');

            const form = document.getElementById('interviewForm');
            if (form) form.reset();
        }
    }

    // ============================================
    // FUNCIONES DE UI Y UTILIDADES
    // ============================================

    function showLoading(show, message = 'Cargando...') {
        let overlay = document.getElementById('loadingOverlay');

        if (!overlay) {
            overlay = document.createElement('div');
            overlay.id = 'loadingOverlay';
            overlay.className = 'loading-overlay';
            overlay.innerHTML = `
                <div class="spinner"></div>
                <p id="loadingMessage">${message}</p>
            `;
            document.body.appendChild(overlay);
        }

        const messageEl = document.getElementById('loadingMessage');
        if (messageEl) {
            messageEl.textContent = message;
        }

        if (show) {
            overlay.classList.add('active');
        } else {
            overlay.classList.remove('active');
        }
    }

    function escapeHtml(text) {
        if (!text) return '';
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    function formatDate(dateString) {
        if (!dateString) return 'N/A';
        try {
            const date = new Date(dateString);
            return date.toLocaleDateString('es-ES', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            });
        } catch {
            return dateString;
        }
    }

    function formatDateShort(dateString) {
        if (!dateString) return 'N/A';
        try {
            const date = new Date(dateString);
            return date.toLocaleDateString('es-ES', {
                day: '2-digit',
                month: 'short',
                year: 'numeric'
            });
        } catch {
            return dateString;
        }
    }

    function setTextContent(id, value) {
        const element = document.getElementById(id);
        if (element) element.textContent = value;
    }

    // Compatibilidad con código legacy
    function showSuccessMessage(message) {
        showSuccess('¡Éxito!', message);
    }

    function showErrorMessage(message) {
        showError('Error', message);
    }

    function hideError() {
        // Ya no es necesario con el nuevo sistema
    }

    // ============================================
    // EXPONER FUNCIONES GLOBALMENTE
    // ============================================

    window.loadSolicitudes = loadSolicitudes;
    window.renderGrid = renderGrid;
    window.filterSolicitudes = filterSolicitudes;
    window.searchSolicitudes = searchSolicitudes;
    window.showDetail = showDetail;
    window.closeDetailModal = closeDetailModal;
    window.copyToClipboard = copyToClipboard;
    window.markAsProcessed = markAsProcessed;
    window.downloadCV = downloadCV;
    window.confirmDeleteSolicitud = confirmDeleteSolicitud;
    window.deleteSolicitud = deleteSolicitud;
    window.switchTab = switchTab;
    window.updateTabCounts = updateTabCounts;
    window.toggleActionsMenu = toggleActionsMenu;
    window.closeAllMenus = closeAllMenus;
    window.openInterviewModal = openInterviewModal;
    window.closeInterviewModal = closeInterviewModal;
    window.submitInterview = submitInterview;

    // Sistema de notificaciones
    window.showNotification = showNotification;
    window.showSuccess = showSuccess;
    window.showError = showError;
    window.showWarning = showWarning;
    window.showInfo = showInfo;
    window.showConfirm = showConfirm;
    window.closeNotification = closeNotification;
    window.showLoading = showLoading;

    // Compatibilidad
    window.showSuccessMessage = showSuccessMessage;
    window.showErrorMessage = showErrorMessage;
    window.hideError = hideError;

    console.log('✅ admin-solicitudes.js cargado completamente con sistema de notificaciones mejorado');
}