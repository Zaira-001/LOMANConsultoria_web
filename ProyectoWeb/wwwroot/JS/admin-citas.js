// admin-citas.js - Gestión de citas con notificaciones modernas
console.log('🚀 Cargando admin-citas.js...');

// Evitar múltiples cargas
if (window.adminCitasInitialized) {
    console.log('⚠️ Ya inicializado, saliendo...');
} else {
    window.adminCitasInitialized = true;

    // CONFIGURACIÓN: ENLACE DE MEET DE LA EMPRESA
    const MEET_LINK_EMPRESA = "https://meet.google.com/fcn-ecqy-ebz";

    // Variables globales
    window.citasData = window.citasData || [];
    window.currentDate = window.currentDate || new Date();
    window.selectedCita = null;
    window.currentView = 'calendar';

    // ==================== SISTEMA DE NOTIFICACIONES ====================

    function initNotificationContainer() {
        if (!document.getElementById('notificationContainer')) {
            const container = document.createElement('div');
            container.id = 'notificationContainer';
            container.style.cssText = `
                position: fixed;
                top: 20px;
                right: 20px;
                z-index: 10000;
                display: flex;
                flex-direction: column;
                gap: 10px;
                max-width: 400px;
            `;
            document.body.appendChild(container);
        }
    }

    function showNotification(message, type = 'info', duration = 4000) {
        initNotificationContainer();

        const container = document.getElementById('notificationContainer');
        const notification = document.createElement('div');
        const id = 'notif-' + Date.now();
        notification.id = id;

        const icons = {
            success: '✅',
            error: '❌',
            warning: '⚠️',
            info: 'ℹ️',
            loading: '⏳'
        };

        const colors = {
            success: { bg: '#d4edda', border: '#28a745', text: '#155724' },
            error: { bg: '#f8d7da', border: '#dc3545', text: '#721c24' },
            warning: { bg: '#fff3cd', border: '#ffc107', text: '#856404' },
            info: { bg: '#d1ecf1', border: '#17a2b8', text: '#0c5460' },
            loading: { bg: '#e3f2fd', border: '#2196F3', text: '#0d47a1' }
        };

        const color = colors[type] || colors.info;

        notification.style.cssText = `
            background: ${color.bg};
            border-left: 4px solid ${color.border};
            color: ${color.text};
            padding: 16px 20px;
            border-radius: 8px;
            box-shadow: 0 4px 15px rgba(0,0,0,0.15);
            display: flex;
            align-items: center;
            gap: 12px;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            font-size: 14px;
            animation: slideIn 0.3s ease-out;
            cursor: pointer;
            transition: all 0.3s ease;
            min-width: 300px;
        `;

        notification.innerHTML = `
            <span style="font-size: 24px; flex-shrink: 0;">${icons[type]}</span>
            <div style="flex: 1;">
                <div style="font-weight: 600; margin-bottom: 4px;">${type === 'success' ? 'Éxito' : type === 'error' ? 'Error' : type === 'warning' ? 'Advertencia' : 'Información'}</div>
                <div style="font-size: 13px; opacity: 0.9;">${message}</div>
            </div>
            <button onclick="document.getElementById('${id}').remove()" style="background: none; border: none; color: ${color.text}; font-size: 20px; cursor: pointer; padding: 0; width: 24px; height: 24px; display: flex; align-items: center; justify-content: center; opacity: 0.6; transition: opacity 0.2s;" onmouseover="this.style.opacity='1'" onmouseout="this.style.opacity='0.6'">
                ×
            </button>
        `;

        if (!document.getElementById('notificationStyles')) {
            const style = document.createElement('style');
            style.id = 'notificationStyles';
            style.textContent = `
                @keyframes slideIn {
                    from {
                        transform: translateX(400px);
                        opacity: 0;
                    }
                    to {
                        transform: translateX(0);
                        opacity: 1;
                    }
                }
                @keyframes slideOut {
                    from {
                        transform: translateX(0);
                        opacity: 1;
                    }
                    to {
                        transform: translateX(400px);
                        opacity: 0;
                    }
                }
            `;
            document.head.appendChild(style);
        }

        notification.addEventListener('mouseenter', () => {
            notification.style.transform = 'translateX(-5px)';
            notification.style.boxShadow = '0 6px 20px rgba(0,0,0,0.2)';
        });

        notification.addEventListener('mouseleave', () => {
            notification.style.transform = 'translateX(0)';
            notification.style.boxShadow = '0 4px 15px rgba(0,0,0,0.15)';
        });

        container.appendChild(notification);

        if (type !== 'loading' && duration > 0) {
            setTimeout(() => {
                if (document.getElementById(id)) {
                    notification.style.animation = 'slideOut 0.3s ease-in';
                    setTimeout(() => notification.remove(), 300);
                }
            }, duration);
        }

        return id;
    }

    function showConfirmDialog(title, message, onConfirm, type = 'info') {
        return new Promise((resolve) => {
            const overlay = document.createElement('div');
            overlay.style.cssText = `
                position: fixed;
                top: 0;
                left: 0;
                right: 0;
                bottom: 0;
                background: rgba(0, 0, 0, 0.5);
                display: flex;
                align-items: center;
                justify-content: center;
                z-index: 10001;
                animation: fadeIn 0.2s ease-out;
            `;

            const icons = {
                success: '✅',
                error: '❌',
                warning: '⚠️',
                info: 'ℹ️',
                question: '❓'
            };

            const colors = {
                success: '#28a745',
                error: '#dc3545',
                warning: '#ffc107',
                info: '#2196F3',
                question: '#667eea'
            };

            const dialog = document.createElement('div');
            dialog.style.cssText = `
                background: white;
                border-radius: 12px;
                padding: 0;
                max-width: 480px;
                width: 90%;
                box-shadow: 0 10px 40px rgba(0,0,0,0.3);
                animation: scaleIn 0.3s ease-out;
            `;

            const color = colors[type] || colors.info;

            dialog.innerHTML = `
                <div style="background: linear-gradient(135deg, ${color} 0%, ${color}dd 100%); color: white; padding: 24px; border-radius: 12px 12px 0 0; text-align: center;">
                    <div style="font-size: 48px; margin-bottom: 12px;">${icons[type] || icons.question}</div>
                    <h3 style="margin: 0; font-size: 22px; font-weight: 600;">${title}</h3>
                </div>
                <div style="padding: 24px;">
                    <p style="margin: 0 0 24px 0; color: #555; line-height: 1.6; white-space: pre-line;">${message}</p>
                    <div style="display: flex; gap: 12px; justify-content: flex-end;">
                        <button id="cancelBtn" style="
                            padding: 12px 24px;
                            border: 2px solid #ddd;
                            background: white;
                            color: #666;
                            border-radius: 8px;
                            font-weight: 600;
                            cursor: pointer;
                            transition: all 0.2s;
                            font-size: 14px;
                        " onmouseover="this.style.background='#f5f5f5'; this.style.borderColor='#ccc';" onmouseout="this.style.background='white'; this.style.borderColor='#ddd';">
                            Cancelar
                        </button>
                        <button id="confirmBtn" style="
                            padding: 12px 24px;
                            border: none;
                            background: ${color};
                            color: white;
                            border-radius: 8px;
                            font-weight: 600;
                            cursor: pointer;
                            transition: all 0.2s;
                            font-size: 14px;
                        " onmouseover="this.style.opacity='0.9'; this.style.transform='translateY(-2px)'; this.style.boxShadow='0 4px 12px rgba(0,0,0,0.2)';" onmouseout="this.style.opacity='1'; this.style.transform='translateY(0)'; this.style.boxShadow='none';">
                            Confirmar
                        </button>
                    </div>
                </div>
            `;

            if (!document.getElementById('dialogStyles')) {
                const style = document.createElement('style');
                style.id = 'dialogStyles';
                style.textContent = `
                    @keyframes fadeIn {
                        from { opacity: 0; }
                        to { opacity: 1; }
                    }
                    @keyframes scaleIn {
                        from {
                            transform: scale(0.9);
                            opacity: 0;
                        }
                        to {
                            transform: scale(1);
                            opacity: 1;
                        }
                    }
                `;
                document.head.appendChild(style);
            }

            overlay.appendChild(dialog);
            document.body.appendChild(overlay);

            const close = (confirmed) => {
                overlay.style.animation = 'fadeIn 0.2s ease-in reverse';
                setTimeout(() => {
                    overlay.remove();
                    resolve(confirmed);
                    if (confirmed && onConfirm) onConfirm();
                }, 200);
            };

            dialog.querySelector('#confirmBtn').onclick = () => close(true);
            dialog.querySelector('#cancelBtn').onclick = () => close(false);
            overlay.onclick = (e) => {
                if (e.target === overlay) close(false);
            };
        });
    }

    // ==================== FUNCIONES PRINCIPALES ====================

    function parseDate(dateStr) {
        if (!dateStr) return null;
        if (dateStr instanceof Date) return dateStr;

        try {
            const date = new Date(dateStr);
            if (!isNaN(date.getTime())) {
                return date;
            }
        } catch (e) {
            console.error('Error parseando fecha:', dateStr, e);
        }

        return null;
    }

    window.initAdminCitas = function () {
        console.log('🎯 Inicializando AdminCitas...');
        console.log('📊 Citas disponibles:', window.citasData.length);

        if (window.citasData.length > 0) {
            console.log('📅 Primera cita (muestra):', {
                id: window.citasData[0].id,
                fechaHora: window.citasData[0].fechaHora,
                fechaParsed: parseDate(window.citasData[0].fechaHora),
                estado: window.citasData[0].estado,
                modalidad: window.citasData[0].modalidad
            });
        }

        updateMonthDisplay();
        renderCurrentView();

        console.log('✅ AdminCitas inicializado correctamente');
    };

    function updateMonthDisplay() {
        const currentMonth = document.getElementById('currentMonth');
        if (currentMonth) {
            const monthName = window.currentDate.toLocaleDateString('es-ES', {
                month: 'long',
                year: 'numeric'
            });
            currentMonth.textContent = monthName.charAt(0).toUpperCase() + monthName.slice(1);
        }
    }

    window.refreshCitas = async function () {
        const loadingId = showNotification('Actualizando citas...', 'loading', 0);

        try {
            console.log('🔄 Refrescando citas...');

            const response = await fetch('http://ConsultoriaIntegralSC.somee.com/api/Cita');

            document.getElementById(loadingId)?.remove();

            if (response.ok) {
                window.citasData = await response.json();
                console.log('✅ Citas actualizadas:', window.citasData.length);
                showNotification(`${window.citasData.length} citas cargadas`, 'success', 3000);
                renderCurrentView();
            } else {
                console.error('❌ Error al obtener citas:', response.status);
                showNotification('Error al actualizar las citas', 'error');
            }
        } catch (error) {
            document.getElementById(loadingId)?.remove();
            console.error('❌ Error refrescando:', error);
            showNotification('Error de conexión al actualizar citas', 'error');
        }
    };

    window.switchView = function (view) {
        console.log('👁️ Cambiando vista a:', view);
        window.currentView = view;

        const calendarView = document.getElementById('calendarView');
        const listView = document.getElementById('listView');
        const calendarBtn = document.getElementById('calendarViewBtn');
        const listBtn = document.getElementById('listViewBtn');

        if (!calendarView || !listView) {
            showNotification('Error: Elementos de vista no encontrados', 'error');
            return;
        }

        if (view === 'calendar') {
            calendarView.style.display = 'block';
            listView.style.display = 'none';
            calendarBtn?.classList.add('active');
            listBtn?.classList.remove('active');
            renderCalendar();
            showNotification('Vista de calendario activada', 'info', 2000);
        } else {
            calendarView.style.display = 'none';
            listView.style.display = 'block';
            calendarBtn?.classList.remove('active');
            listBtn?.classList.add('active');
            renderList();
            showNotification('Vista de lista activada', 'info', 2000);
        }
    };

    window.renderCurrentView = function () {
        console.log('🎨 Renderizando vista:', window.currentView);
        if (window.currentView === 'calendar') {
            renderCalendar();
        } else {
            renderList();
        }
    };

    window.previousMonth = function () {
        window.currentDate.setMonth(window.currentDate.getMonth() - 1);
        updateMonthDisplay();
        renderCalendar();
    };

    window.nextMonth = function () {
        window.currentDate.setMonth(window.currentDate.getMonth() + 1);
        updateMonthDisplay();
        renderCalendar();
    };

    function renderCalendar() {
        const calendarBody = document.getElementById('calendarBody');
        if (!calendarBody) {
            console.error('❌ calendarBody no encontrado');
            return;
        }

        const year = window.currentDate.getFullYear();
        const month = window.currentDate.getMonth();

        const firstDay = new Date(year, month, 1);
        const lastDay = new Date(year, month + 1, 0);
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const startDayOfWeek = firstDay.getDay();
        const daysInMonth = lastDay.getDate();

        let html = '';
        let citasRendered = 0;

        const prevMonthLastDay = new Date(year, month, 0).getDate();
        const prevMonthStart = prevMonthLastDay - startDayOfWeek + 1;

        for (let i = 0; i < startDayOfWeek; i++) {
            const date = new Date(year, month - 1, prevMonthStart + i);
            const citas = getCitasForDate(date);
            html += `<div class="calendar-day other-month">
                <div class="day-number">${prevMonthStart + i}</div>
                ${renderCitasForDay(citas)}
            </div>`;
            citasRendered += citas.length;
        }

        for (let day = 1; day <= daysInMonth; day++) {
            const date = new Date(year, month, day);
            const isToday = date.getTime() === today.getTime();
            const citas = getCitasForDate(date);

            html += `<div class="calendar-day ${isToday ? 'today' : ''}">
                <div class="day-number">${day}</div>
                ${renderCitasForDay(citas)}
            </div>`;
            citasRendered += citas.length;
        }

        const remainingDays = 42 - (startDayOfWeek + daysInMonth);
        for (let i = 1; i <= remainingDays; i++) {
            const date = new Date(year, month + 1, i);
            const citas = getCitasForDate(date);
            html += `<div class="calendar-day other-month">
                <div class="day-number">${i}</div>
                ${renderCitasForDay(citas)}
            </div>`;
            citasRendered += citas.length;
        }

        calendarBody.innerHTML = html;
        console.log(`✅ Calendario renderizado: ${year}-${month + 1}, Citas mostradas: ${citasRendered}`);
    }

    function getCitasForDate(date) {
        const targetYear = date.getFullYear();
        const targetMonth = date.getMonth();
        const targetDay = date.getDate();

        const citasFiltradas = window.citasData.filter(cita => {
            const citaDate = parseDate(cita.fechaHora);
            if (!citaDate) return false;

            const estadoLower = (cita.estado || '').toLowerCase();
            const esConfirmada = estadoLower === 'confirmada';

            return citaDate.getFullYear() === targetYear &&
                citaDate.getMonth() === targetMonth &&
                citaDate.getDate() === targetDay &&
                esConfirmada;
        });

        return citasFiltradas;
    }

    function renderCitasForDay(citas) {
        if (!citas || citas.length === 0) return '';

        let html = '';
        citas.forEach(cita => {
            const citaDate = parseDate(cita.fechaHora);
            if (!citaDate) return;

            const time = citaDate.toLocaleTimeString('es-ES', {
                hour: '2-digit',
                minute: '2-digit'
            });

            const estadoLower = (cita.estado || '').toLowerCase();
            const estadoClass = estadoLower.replace(/\s+/g, '-');

            let modalidadIcono = '✅';
            const modalidadLower = (cita.modalidad || '').toLowerCase();
            if (modalidadLower.includes('virtual')) {
                modalidadIcono = '💻';
            } else if (modalidadLower.includes('telefon')) {
                modalidadIcono = '📞';
            } else if (modalidadLower.includes('presencial')) {
                modalidadIcono = '🏢';
            }

            html += `
                <div class="appointment-item ${estadoClass}" onclick="window.showCitaDetails(${cita.id})" title="Confirmada - ${cita.modalidad || 'Sin modalidad'}">
                    <div class="appointment-time">${modalidadIcono} ${time}</div>
                    <div class="appointment-client">${escapeHtml(cita.nombreCompleto)}</div>
                </div>
            `;
        });
        return html;
    }

    function renderList() {
        const listView = document.getElementById('listView');
        if (!listView) {
            console.error('❌ listView no encontrado');
            return;
        }

        const citasPendientes = window.citasData.filter(c =>
            c.estado && c.estado.toLowerCase() === 'pendiente'
        );

        console.log(`📋 Mostrando ${citasPendientes.length} citas pendientes de ${window.citasData.length} totales`);

        if (citasPendientes.length === 0) {
            listView.innerHTML = `
                <div style="text-align: center; padding: 60px 20px;">
                    <div style="font-size: 48px; margin-bottom: 20px;">✅</div>
                    <h3 style="color: #666; margin: 0;">No hay citas pendientes</h3>
                    <p style="color: #999; margin-top: 10px;">Todas las citas han sido procesadas</p>
                </div>
            `;
            return;
        }

        const sortedCitas = [...citasPendientes].sort((a, b) => {
            const dateA = parseDate(a.fechaHora);
            const dateB = parseDate(b.fechaHora);
            if (!dateA || !dateB) return 0;
            return dateA - dateB;
        });

        let html = '<div style="padding: 20px;"><h2 style="margin-bottom: 20px; color: #333;">📋 Citas Pendientes de Confirmar</h2>';

        sortedCitas.forEach(cita => {
            const date = parseDate(cita.fechaHora);
            if (!date) return;

            const day = date.getDate();
            const month = date.toLocaleDateString('es-ES', { month: 'short' });
            const time = date.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
            const fullDate = date.toLocaleDateString('es-ES', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric'
            });

            let modalidadIcono = '📅';
            const modalidadLower = (cita.modalidad || '').toLowerCase();
            if (modalidadLower.includes('virtual')) {
                modalidadIcono = '💻';
            } else if (modalidadLower.includes('telefon')) {
                modalidadIcono = '📞';
            } else if (modalidadLower.includes('presencial')) {
                modalidadIcono = '🏢';
            }

            html += `
                <div class="appointment-card">
                    <div class="appointment-date-badge">
                        <div class="badge-day">${day}</div>
                        <div class="badge-month">${month}</div>
                    </div>
                    <div class="appointment-details">
                        <h3>${escapeHtml(cita.nombreCompleto)}</h3>
                        <div class="appointment-meta">
                            <div class="meta-item">
                                <span>📅</span>
                                <span>${fullDate}</span>
                            </div>
                            <div class="meta-item">
                                <span>⏰</span>
                                <span>${time}</span>
                            </div>
                            <div class="meta-item">
                                <span>${modalidadIcono}</span>
                                <span><strong>${escapeHtml(cita.modalidad || 'Sin especificar')}</strong></span>
                            </div>
                            <div class="meta-item">
                                <span>🏢</span>
                                <span>${escapeHtml(cita.empresa || 'Sin empresa')}</span>
                            </div>
                            <div class="meta-item">
                                <span>💼</span>
                                <span>${escapeHtml(cita.servicioInteres || 'Sin especificar')}</span>
                            </div>
                            <div class="meta-item">
                                <span>📧</span>
                                <span>${escapeHtml(cita.email)}</span>
                            </div>
                            <div class="meta-item">
                                <span>📱</span>
                                <span>${escapeHtml(cita.telefono || 'Sin teléfono')}</span>
                            </div>
                            <span class="status-badge status-pendiente">⏳ Pendiente</span>
                        </div>
                    </div>
                    <div class="appointment-actions">
                        <button type="button" class="action-btn btn-view" onclick="window.showCitaDetails(${cita.id})">
                            👁️ Ver Detalles
                        </button>
                        <button type="button" class="action-btn btn-confirm" onclick="window.updateCitaStatusQuick(${cita.id}, 'Confirmada')">
                            ✅ Confirmar
                        </button>
                        <button type="button" class="action-btn btn-cancel" onclick="window.updateCitaStatusQuick(${cita.id}, 'Cancelada')">
                            ❌ Cancelar
                        </button>
                    </div>
                </div>
            `;
        });

        html += '</div>';
        listView.innerHTML = html;
        console.log('✅ Lista renderizada con', sortedCitas.length, 'citas pendientes');
    }

    window.showCitaDetails = function (citaId) {
        const cita = window.citasData.find(c => c.id === citaId);
        if (!cita) {
            showNotification('Cita no encontrada', 'error');
            return;
        }

        window.selectedCita = cita;

        const date = parseDate(cita.fechaHora);
        if (!date) {
            showNotification('Error: Fecha inválida', 'error');
            return;
        }

        const formattedDate = date.toLocaleDateString('es-ES', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });

        const modalidadLower = (cita.modalidad || '').toLowerCase();
        const esVirtual = modalidadLower.includes('virtual');
        const esTelefonica = modalidadLower.includes('telefon');

        let meetSection = '';
        if (esVirtual && cita.estado && cita.estado.toLowerCase() === 'confirmada') {
            meetSection = `
                <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 20px; border-radius: 10px; margin: 20px 0; color: white; text-align: center;">
                    <h4 style="margin: 0 0 15px 0;">💻 Enlace de Videollamada</h4>
                    <a href="${MEET_LINK_EMPRESA}" target="_blank" 
                       style="display: inline-block; background: white; color: #667eea; padding: 12px 30px; border-radius: 25px; text-decoration: none; font-weight: 600; margin: 10px 0;">
                        🎥 Abrir Google Meet
                    </a>
                    <button type="button" onclick="window.copyMeetLink('${MEET_LINK_EMPRESA}')"
                            style="display: inline-block; background: rgba(255,255,255,0.2); color: white; border: 2px solid white; padding: 12px 30px; border-radius: 25px; font-weight: 600; margin: 10px 10px; cursor: pointer;">
                        📋 Copiar Enlace
                    </button>
                </div>
            `;
        }

        let phoneSection = '';
        if (esTelefonica && cita.telefono) {
            phoneSection = `
                <div style="background: linear-gradient(135deg, #25D366 0%, #128C7E 100%); padding: 20px; border-radius: 10px; margin: 20px 0; color: white; text-align: center;">
                    <h4 style="margin: 0 0 15px 0;">📞 Cita Telefónica</h4>
                    <p style="font-size: 18px; font-weight: 600; margin: 10px 0;">
                        Llamar al cliente: <strong>${escapeHtml(cita.telefono)}</strong>
                    </p>
                    <a href="tel:${escapeHtml(cita.telefono)}" 
                       style="display: inline-block; background: white; color: #25D366; padding: 12px 30px; border-radius: 25px; text-decoration: none; font-weight: 600; margin: 10px 0;">
                        📱 Llamar Ahora
                    </a>
                    <p style="margin: 15px 0 5px 0; font-size: 13px; opacity: 0.9;">
                        Este botón abrirá el marcador de tu teléfono/computadora
                    </p>
                </div>
            `;
        }

        const modalContent = document.getElementById('modalContent');
        if (!modalContent) {
            showNotification('Error: Modal no encontrado', 'error');
            return;
        }

        modalContent.innerHTML = `
            <div class="detail-row">
                <div class="detail-label">👤 Cliente:</div>
                <div class="detail-value"><strong>${escapeHtml(cita.nombreCompleto)}</strong></div>
            </div>
            <div class="detail-row">
                <div class="detail-label">🏢 Empresa:</div>
                <div class="detail-value">${escapeHtml(cita.empresa || 'No especificada')}</div>
            </div>
            <div class="detail-row">
                <div class="detail-label">📧 Email:</div>
                <div class="detail-value"><a href="mailto:${escapeHtml(cita.email)}">${escapeHtml(cita.email)}</a></div>
            </div>
            <div class="detail-row">
                <div class="detail-label">📱 Teléfono:</div>
                <div class="detail-value"><a href="tel:${escapeHtml(cita.telefono || '')}">${escapeHtml(cita.telefono || 'No proporcionado')}</a></div>
            </div>
            <div class="detail-row">
                <div class="detail-label">📅 Fecha y Hora:</div>
                <div class="detail-value"><strong>${formattedDate}</strong></div>
            </div>
            <div class="detail-row">
                <div class="detail-label">💼 Servicio:</div>
                <div class="detail-value">${escapeHtml(cita.servicioInteres || 'No especificado')}</div>
            </div>
            <div class="detail-row">
                <div class="detail-label">📍 Modalidad:</div>
                <div class="detail-value"><strong>${escapeHtml(cita.modalidad || 'No especificada')}</strong></div>
            </div>
            <div class="detail-row">
                <div class="detail-label">📊 Estado:</div>
                <div class="detail-value">
                    <span class="status-badge status-${cita.estado.toLowerCase()}">${cita.estado}</span>
                </div>
            </div>
            ${cita.descripcion ? `
                <div class="detail-row">
                    <div class="detail-label">📝 Descripción:</div>
                    <div class="detail-value">${escapeHtml(cita.descripcion)}</div>
                </div>
            ` : ''}
            ${cita.notasAdmin ? `
                <div class="detail-row">
                    <div class="detail-label">📌 Notas previas:</div>
                    <div class="detail-value" style="font-style: italic; color: #666;">${escapeHtml(cita.notasAdmin)}</div>
                </div>
            ` : ''}
            
            ${meetSection}
            ${phoneSection}
        `;

        document.getElementById('adminNotes').value = cita.notasAdmin || '';

        const modalActions = document.getElementById('modalActions');
        if (modalActions) {
            modalActions.innerHTML = `
                ${cita.estado === 'Pendiente' ?
                    `<button type="button" class="action-btn btn-confirm" onclick="window.updateCitaStatusFromModal('Confirmada')">
                        ✅ Confirmar Cita
                    </button>` : ''}
                ${cita.estado === 'Confirmada' ?
                    `<button type="button" class="action-btn" style="background: #2196F3; color: white;" onclick="window.updateCitaStatusFromModal('Completada')">
                        ✔️ Completada
                    </button>` : ''}
                ${cita.estado !== 'Cancelada' && cita.estado !== 'Completada' ?
                    `<button type="button" class="action-btn btn-cancel" onclick="window.updateCitaStatusFromModal('Cancelada')">
                        ❌ Cancelar Cita
                    </button>` : ''}
                <button type="button" class="action-btn" style="background: #666; color: white;" onclick="window.saveNotesOnly()">
                    💾 Guardar Notas
                </button>
                <button type="button" class="action-btn" style="background: #999; color: white;" onclick="window.closeCitaModal()">
                    Cerrar
                </button>
            `;
        }

        const modal = document.getElementById('citaModal');
        if (modal) {
            modal.style.display = 'flex';
            modal.onclick = function (e) {
                if (e.target === modal) {
                    window.closeCitaModal();
                }
            };
        }

        console.log('✅ Modal mostrado para cita ID:', citaId);
    };

    window.copyMeetLink = function (link) {
        if (navigator.clipboard && navigator.clipboard.writeText) {
            navigator.clipboard.writeText(link).then(() => {
                showNotification('Enlace de Google Meet copiado al portapapeles', 'success', 3000);
            }).catch(err => {
                console.error('Error copiando:', err);
                showNotification('No se pudo copiar automáticamente', 'warning');
                prompt('Copiar enlace manualmente:', link);
            });
        } else {
            prompt('Copiar enlace manualmente:', link);
        }
    };

    window.closeCitaModal = function () {
        const modal = document.getElementById('citaModal');
        if (modal) {
            modal.style.display = 'none';
        }
        window.selectedCita = null;
    };

    window.updateCitaStatusFromModal = async function (nuevoEstado) {
        if (!window.selectedCita) return;

        const estadoEmoji = {
            'Confirmada': '✅',
            'Cancelada': '❌',
            'Completada': '✔️'
        };

        const confirmed = await showConfirmDialog(
            `${estadoEmoji[nuevoEstado]} Cambiar Estado`,
            `¿Cambiar el estado de esta cita a "${nuevoEstado}"?\n\nCliente: ${window.selectedCita.nombreCompleto}\nFecha: ${parseDate(window.selectedCita.fechaHora)?.toLocaleDateString('es-ES')}`,
            null,
            nuevoEstado === 'Confirmada' ? 'success' : nuevoEstado === 'Cancelada' ? 'warning' : 'info'
        );

        if (!confirmed) return;

        const notas = document.getElementById('adminNotes').value;
        const loadingId = showNotification('Actualizando estado de la cita...', 'loading', 0);

        const success = await updateCitaStatus(window.selectedCita.id, nuevoEstado, notas);

        document.getElementById(loadingId)?.remove();

        if (success) {
            showNotification(`Cita ${nuevoEstado.toLowerCase()} correctamente`, 'success');
            window.closeCitaModal();
            await window.refreshCitas();
        } else {
            showNotification('Error al actualizar el estado de la cita', 'error');
        }
    };

    window.updateCitaStatusQuick = async function (citaId, nuevoEstado) {
        const cita = window.citasData.find(c => c.id === citaId);

        if (!cita) {
            showNotification('Cita no encontrada', 'error');
            return;
        }

        const estadoEmoji = {
            'Confirmada': '✅',
            'Cancelada': '❌'
        };

        const confirmed = await showConfirmDialog(
            `${estadoEmoji[nuevoEstado]} ${nuevoEstado === 'Confirmada' ? 'Confirmar Cita' : 'Cancelar Cita'}`,
            `Cliente: ${cita.nombreCompleto}\nFecha: ${parseDate(cita.fechaHora)?.toLocaleDateString('es-ES', {
                weekday: 'long',
                day: 'numeric',
                month: 'long',
                hour: '2-digit',
                minute: '2-digit'
            })}\n\n¿Continuar?`,
            null,
            nuevoEstado === 'Confirmada' ? 'success' : 'warning'
        );

        if (!confirmed) return;

        const notas = cita?.notasAdmin || '';
        const loadingId = showNotification('Procesando...', 'loading', 0);

        const success = await updateCitaStatus(citaId, nuevoEstado, notas);

        document.getElementById(loadingId)?.remove();

        if (success) {
            showNotification(
                `Cita ${nuevoEstado.toLowerCase()} correctamente`,
                'success'
            );
            await window.refreshCitas();
        } else {
            showNotification('Error al actualizar la cita', 'error');
        }
    };

    window.saveNotesOnly = async function () {
        if (!window.selectedCita) return;

        const notas = document.getElementById('adminNotes').value;

        if (!notas || notas.trim() === '') {
            showNotification('Por favor escribe alguna nota antes de guardar', 'warning');
            return;
        }

        const loadingId = showNotification('Guardando notas...', 'loading', 0);

        const success = await updateCitaStatus(window.selectedCita.id, window.selectedCita.estado, notas);

        document.getElementById(loadingId)?.remove();

        if (success) {
            showNotification('Notas guardadas correctamente', 'success');
            window.selectedCita.notasAdmin = notas;
        } else {
            showNotification('Error al guardar las notas', 'error');
        }
    };

    async function updateCitaStatus(citaId, nuevoEstado, notas) {
        try {
            console.log(`📤 Actualizando cita ${citaId}:`, { nuevoEstado, notas });

            const response = await fetch(`http://ConsultoriaIntegralSC.somee.com/api/Cita/${citaId}/estado`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    Estado: nuevoEstado,
                    NotasAdmin: notas
                })
            });

            if (response.ok) {
                console.log('✅ Cita actualizada correctamente');
                return true;
            } else {
                console.error('❌ Error en la respuesta:', response.status);
                return false;
            }
        } catch (error) {
            console.error('❌ Error actualizando cita:', error);
            return false;
        }
    }

    function escapeHtml(text) {
        if (!text) return '';
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    document.addEventListener('keydown', function (e) {
        if (e.key === 'Escape') {
            window.closeCitaModal();
        }
    });

    console.log('✅ admin-citas.js cargado completamente con notificaciones mejoradas');
}