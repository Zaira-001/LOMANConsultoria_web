// admin-citas.js - Gestión de citas con mejor manejo de fechas
console.log('🚀 Cargando admin-citas.js...');

// Evitar múltiples cargas
if (window.adminCitasInitialized) {
    console.log('⚠️ Ya inicializado, saliendo...');
} else {
    window.adminCitasInitialized = true;

    // CONFIGURACIÓN: ENLACE DE MEET DE LA EMPRESA (NUEVO)
    const MEET_LINK_EMPRESA = "https://meet.google.com/fcn-ecqy-ebz"; // ← CAMBIAR POR TU ENLACE REAL

    // Variables globales
    window.citasData = window.citasData || [];
    window.currentDate = window.currentDate || new Date();
    window.selectedCita = null;
    window.currentView = 'calendar';

    // FUNCIÓN MEJORADA PARA PARSEAR FECHAS
    function parseDate(dateStr) {
        if (!dateStr) return null;

        // Si ya es un objeto Date, devolverlo
        if (dateStr instanceof Date) return dateStr;

        // Intentar parsear como ISO string
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

    // Función principal de inicialización
    window.initAdminCitas = function () {
        console.log('🎯 Inicializando AdminCitas...');
        console.log('📊 Citas disponibles:', window.citasData.length);

        // DEBUG: Verificar formato de fechas
        if (window.citasData.length > 0) {
            console.log('📅 Primera cita (muestra):', {
                id: window.citasData[0].id,
                fechaHora: window.citasData[0].fechaHora,
                fechaParsed: parseDate(window.citasData[0].fechaHora),
                estado: window.citasData[0].estado,
                modalidad: window.citasData[0].modalidad  // NUEVO: mostrar modalidad
            });
        }

        updateMonthDisplay();
        renderCurrentView();

        console.log('✅ AdminCitas inicializado correctamente');
    };

    // Actualizar el display del mes
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

    // Refrescar citas desde el servidor
    window.refreshCitas = async function () {
        try {
            console.log('🔄 Refrescando citas...');

            const response = await fetch('http://ConsultoriaIntegralSC.somee.com/api/Cita');
            if (response.ok) {
                window.citasData = await response.json();
                console.log('✅ Citas actualizadas:', window.citasData.length);
                renderCurrentView();
            } else {
                console.error('❌ Error al obtener citas:', response.status);
            }
        } catch (error) {
            console.error('❌ Error refrescando:', error);
            alert('Error al actualizar las citas');
        }
    };

    // Cambiar entre vista calendario y lista
    window.switchView = function (view) {
        console.log('👁️ Cambiando vista a:', view);
        window.currentView = view;

        const calendarView = document.getElementById('calendarView');
        const listView = document.getElementById('listView');
        const calendarBtn = document.getElementById('calendarViewBtn');
        const listBtn = document.getElementById('listViewBtn');

        if (!calendarView || !listView) {
            console.error('❌ Elementos de vista no encontrados');
            return;
        }

        if (view === 'calendar') {
            calendarView.style.display = 'block';
            listView.style.display = 'none';
            calendarBtn?.classList.add('active');
            listBtn?.classList.remove('active');
            renderCalendar();
        } else {
            calendarView.style.display = 'none';
            listView.style.display = 'block';
            calendarBtn?.classList.remove('active');
            listBtn?.classList.add('active');
            renderList();
        }
    };

    // Renderizar la vista actual
    window.renderCurrentView = function () {
        console.log('🎨 Renderizando vista:', window.currentView);
        if (window.currentView === 'calendar') {
            renderCalendar();
        } else {
            renderList();
        }
    };

    // Navegar al mes anterior
    window.previousMonth = function () {
        window.currentDate.setMonth(window.currentDate.getMonth() - 1);
        updateMonthDisplay();
        renderCalendar();
    };

    // Navegar al mes siguiente
    window.nextMonth = function () {
        window.currentDate.setMonth(window.currentDate.getMonth() + 1);
        updateMonthDisplay();
        renderCalendar();
    };

    // === RENDERIZADO DEL CALENDARIO ===
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

        // Días del mes anterior (grises)
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

        // Días del mes actual
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

        // Días del mes siguiente (grises)
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

    // Obtener citas para una fecha específica (SOLO CONFIRMADAS)
    function getCitasForDate(date) {
        const targetYear = date.getFullYear();
        const targetMonth = date.getMonth();
        const targetDay = date.getDate();

        const citasFiltradas = window.citasData.filter(cita => {
            const citaDate = parseDate(cita.fechaHora);
            if (!citaDate) return false;

            // SOLO mostrar citas CONFIRMADAS en el calendario
            const estadoLower = (cita.estado || '').toLowerCase();
            const esConfirmada = estadoLower === 'confirmada';

            return citaDate.getFullYear() === targetYear &&
                citaDate.getMonth() === targetMonth &&
                citaDate.getDate() === targetDay &&
                esConfirmada;
        });

        return citasFiltradas;
    }

    // Renderizar las citas de un día en el calendario (SOLO CONFIRMADAS) - MEJORADO CON ICONOS
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

            // NUEVO: Icono según modalidad
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

    // === RENDERIZADO DE LA LISTA (Solo pendientes) - MEJORADO CON ICONOS ===
    function renderList() {
        const listView = document.getElementById('listView');
        if (!listView) {
            console.error('❌ listView no encontrado');
            return;
        }

        // Filtrar solo citas pendientes
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

        // Ordenar por fecha
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

            // NUEVO: Icono según modalidad
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

    // === MODAL DE DETALLES - MEJORADO CON MEET Y TELÉFONO ===
    window.showCitaDetails = function (citaId) {
        const cita = window.citasData.find(c => c.id === citaId);
        if (!cita) {
            console.error('❌ Cita no encontrada:', citaId);
            alert('No se encontró la cita');
            return;
        }

        window.selectedCita = cita;

        const date = parseDate(cita.fechaHora);
        if (!date) {
            alert('Error: Fecha inválida');
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

        // NUEVO: Detectar modalidad para mostrar secciones especiales
        const modalidadLower = (cita.modalidad || '').toLowerCase();
        const esVirtual = modalidadLower.includes('virtual');
        const esTelefonica = modalidadLower.includes('telefon');

        // NUEVO: Generar sección de enlace Meet (si es virtual y confirmada)
        let meetSection = '';
        if (esVirtual && cita.estado && cita.estado.toLowerCase() === 'confirmada') {
            meetSection = `
                <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 20px; border-radius: 10px; margin: 20px 0; color: white; text-align: center;">
                    <h4 style="margin: 0 0 15px 0;">💻 Enlace de Videollamada</h4>
                    <a href="${MEET_LINK_EMPRESA}" target="_blank" 
                       style="display: inline-block; background: white; color: #667eea; padding: 12px 30px; border-radius: 25px; text-decoration: none; font-weight: 600; margin: 10px 0;">
                        🎥 Abrir Google Meet
                    </a>
                </div>
            `;
        }

        // NUEVO: Generar sección de llamada (si es telefónica)
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
            console.error('❌ modalContent no encontrado');
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

    // NUEVA FUNCIÓN: Copiar enlace de Meet al portapapeles
    window.copyMeetLink = function (link) {
        if (navigator.clipboard && navigator.clipboard.writeText) {
            navigator.clipboard.writeText(link).then(() => {
                alert('✅ Enlace de Google Meet copiado al portapapeles');
            }).catch(err => {
                console.error('Error copiando:', err);
                prompt('Copiar enlace manualmente:', link);
            });
        } else {
            // Fallback para navegadores antiguos
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

    // === ACTUALIZACIÓN DE ESTADO ===
    window.updateCitaStatusFromModal = async function (nuevoEstado) {
        if (!window.selectedCita) return;

        const notas = document.getElementById('adminNotes').value;
        const success = await updateCitaStatus(window.selectedCita.id, nuevoEstado, notas);

        if (success) {
            alert(`✅ Estado actualizado a: ${nuevoEstado}`);
            window.closeCitaModal();
            await window.refreshCitas();
        } else {
            alert('❌ Error al actualizar el estado');
        }
    };

    window.updateCitaStatusQuick = async function (citaId, nuevoEstado) {
        const mensaje = nuevoEstado === 'Confirmada' ?
            '¿Confirmar esta cita?' :
            '¿Está seguro de cancelar esta cita?';

        if (!confirm(mensaje)) return;

        const cita = window.citasData.find(c => c.id === citaId);
        const notas = cita?.notasAdmin || '';

        const success = await updateCitaStatus(citaId, nuevoEstado, notas);

        if (success) {
            alert(`✅ Cita ${nuevoEstado.toLowerCase()} correctamente`);
            await window.refreshCitas();
        } else {
            alert('❌ Error al actualizar el estado');
        }
    };

    window.saveNotesOnly = async function () {
        if (!window.selectedCita) return;

        const notas = document.getElementById('adminNotes').value;
        const success = await updateCitaStatus(window.selectedCita.id, window.selectedCita.estado, notas);

        if (success) {
            alert('✅ Notas guardadas correctamente');
            window.selectedCita.notasAdmin = notas;
        } else {
            alert('❌ Error al guardar las notas');
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

    // === UTILIDADES ===
    function escapeHtml(text) {
        if (!text) return '';
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    // Cerrar modal con Escape
    document.addEventListener('keydown', function (e) {
        if (e.key === 'Escape') {
            window.closeCitaModal();
        }
    });

    console.log('✅ admin-citas.js cargado completamente con soporte para Meet y Teléfono');
}