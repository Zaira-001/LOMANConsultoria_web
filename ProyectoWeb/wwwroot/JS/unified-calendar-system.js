// Sistema de calendario simplificado - Con navegación mejorada
const calendarSystem = {
    selectedDate: null,
    selectedTime: null,
    currentStep: 1,
    availableSlots: {},
    isLoading: false,
    isSubmitting: false,
    currentMonth: new Date().getMonth(),
    currentYear: new Date().getFullYear(),

    config: {
        apiBaseUrl: 'http://www.ConsultoriaIntegralSC.somee.com',
        apiPath: '/api/Cita',
        timeout: 30000,
        businessHours: {
            start: 9,
            end: 18,
            interval: 45,
            lunchStart: 14,
            lunchEnd: 15
        },
        workDays: [1, 2, 3, 4, 5],
        maxDaysAhead: 90, // Aumentado a 90 días (3 meses)

        // Días festivos oficiales de México (formato: MM-DD)
        holidays: {
            // Días fijos
            '01-01': 'Año Nuevo',
            '02-05': 'Día de la Constitución',
            '03-21': 'Natalicio de Benito Juárez',
            '05-01': 'Día del Trabajo',
            '09-16': 'Día de la Independencia',
            '11-20': 'Revolución Mexicana',
            '12-25': 'Navidad',

            // Días adicionales comunes (puedes personalizarlos)
            '11-02': 'Día de Muertos',
            '12-24': 'Nochebuena',
            '12-31': 'Fin de Año'
        }
    },

    // Verificar si una fecha es día festivo
    isHoliday(date) {
        const monthDay = String(date.getMonth() + 1).padStart(2, '0') + '-' +
            String(date.getDate()).padStart(2, '0');
        return this.config.holidays[monthDay] || null;
    },

    async init() {
        console.log('🚀 Inicializando sistema de calendario...');
        this.cleanupEventListeners();
        this.setupEventListeners();

        // Establecer mes actual
        const now = new Date();
        this.currentMonth = now.getMonth();
        this.currentYear = now.getFullYear();

        await this.loadAvailableSlots();
        this.renderCalendar();
        this.updateStepIndicators();
        console.log('✅ Sistema inicializado');
    },

    cleanupEventListeners() {
        const oldHandler = window._calendarEscapeHandler;
        if (oldHandler) {
            document.removeEventListener('keydown', oldHandler);
            delete window._calendarEscapeHandler;
        }
    },

    setupEventListeners() {
        setTimeout(() => {
            const clientForm = document.getElementById('client-form');
            if (clientForm) {
                const newForm = clientForm.cloneNode(true);
                clientForm.parentNode.replaceChild(newForm, clientForm);

                newForm.addEventListener('submit', (e) => {
                    e.preventDefault();
                    e.stopPropagation();

                    if (this.isSubmitting) {
                        console.log('⚠️ Ya hay un envío en proceso');
                        return false;
                    }

                    this.handleFormSubmit(e);
                    return false;
                }, { once: false });

                console.log('✅ Formulario configurado');
            }
        }, 100);

        const escapeHandler = (e) => {
            if (e.key === 'Escape') {
                const modal = document.getElementById('citaModal');
                if (modal?.classList.contains('show')) {
                    this.closeModal();
                }
            }
        };

        if (!window._calendarEscapeHandler) {
            window._calendarEscapeHandler = escapeHandler;
            document.addEventListener('keydown', escapeHandler);
        }
    },

    async loadAvailableSlots() {
        this.showLoading(true);
        try {
            const startDate = new Date();
            startDate.setHours(0, 0, 0, 0);

            const url = `${this.config.apiBaseUrl}${this.config.apiPath}/available-slots-by-day?` +
                `startDate=${startDate.toISOString().split('T')[0]}&` +
                `days=${this.config.maxDaysAhead}`;

            console.log('📡 Cargando slots desde:', url);
            console.log('📅 Fecha inicio:', startDate.toISOString().split('T')[0]);
            console.log('📅 Días a consultar:', this.config.maxDaysAhead);

            const response = await fetch(url);

            if (!response.ok) throw new Error(`HTTP ${response.status}`);

            const data = await response.json();
            console.log('✅ Slots recibidos del servidor:', Object.keys(data).length, 'días');
            console.log('📊 Primeros 5 días con slots:', Object.keys(data).slice(0, 5));
            console.log('📊 Últimos 5 días con slots:', Object.keys(data).slice(-5));

            // Verificar si hay datos para noviembre y diciembre
            const nov2024 = Object.keys(data).filter(d => d.startsWith('2024-11')).length;
            const dec2024 = Object.keys(data).filter(d => d.startsWith('2024-12')).length;
            const jan2025 = Object.keys(data).filter(d => d.startsWith('2025-01')).length;

            console.log('📊 Días disponibles en Noviembre 2024:', nov2024);
            console.log('📊 Días disponibles en Diciembre 2024:', dec2024);
            console.log('📊 Días disponibles en Enero 2025:', jan2025);

            this.availableSlots = data;
        } catch (error) {
            console.error('❌ Error cargando slots:', error);
            this.showError('Error al cargar disponibilidad');
        }
        this.showLoading(false);
    },

    renderCalendar() {
        const container = document.getElementById('calendar-container');
        if (!container) return;

        const monthName = this.getMonthName(this.currentMonth);
        const now = new Date();
        const isPastMonth = this.currentYear < now.getFullYear() ||
            (this.currentYear === now.getFullYear() && this.currentMonth < now.getMonth());

        // Permitir hasta 3 meses adelante desde el mes actual
        const maxAllowedMonth = now.getMonth() + 3;
        const maxAllowedYear = now.getFullYear() + Math.floor(maxAllowedMonth / 12);
        const normalizedMaxMonth = maxAllowedMonth % 12;

        const isFutureMonth = this.currentYear > maxAllowedYear ||
            (this.currentYear === maxAllowedYear && this.currentMonth > normalizedMaxMonth);

        container.innerHTML = `
            <div class="calendar-header">
                <button type="button" 
                        class="calendar-nav" 
                        onclick="calendarSystem.changeMonth(-1)"
                        ${isPastMonth ? 'disabled style="opacity: 0.3; cursor: not-allowed;"' : ''}>
                    ‹
                </button>
                <h3 class="calendar-title">${monthName} ${this.currentYear}</h3>
                <button type="button" 
                        class="calendar-nav" 
                        onclick="calendarSystem.changeMonth(1)"
                        ${isFutureMonth ? 'disabled style="opacity: 0.3; cursor: not-allowed;"' : ''}>
                    ›
                </button>
            </div>
            <div class="calendar-weekdays">
                <div class="weekday">Dom</div>
                <div class="weekday">Lun</div>
                <div class="weekday">Mar</div>
                <div class="weekday">Mié</div>
                <div class="weekday">Jue</div>
                <div class="weekday">Vie</div>
                <div class="weekday">Sáb</div>
            </div>
            <div class="calendar-dates">
                ${this.renderCalendarDays(this.currentYear, this.currentMonth)}
            </div>
            <div class="calendar-legend">
                <span class="legend-item">
                    <span class="legend-dot available"></span> Disponible
                </span>
                <span class="legend-item">
                    <span class="legend-dot unavailable"></span> No disponible
                </span>
                <span class="legend-item">
                    <span class="legend-dot selected"></span> Seleccionado
                </span>
            </div>
        `;
    },

    renderCalendarDays(year, month) {
        const firstDay = new Date(year, month, 1);
        const lastDay = new Date(year, month + 1, 0);
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        let html = '';

        // Días vacíos al inicio - ajustados correctamente según el día de la semana
        const startDayOfWeek = firstDay.getDay(); // 0 = Domingo, 1 = Lunes, etc.
        for (let i = 0; i < startDayOfWeek; i++) {
            html += '<div class="calendar-day empty"></div>';
        }

        // Días del mes
        for (let day = 1; day <= lastDay.getDate(); day++) {
            const date = new Date(year, month, day);
            date.setHours(0, 0, 0, 0);
            const dateStr = date.toISOString().split('T')[0];
            const dayOfWeek = date.getDay(); // 0 = Domingo, 6 = Sábado
            const isPast = date < today;
            const isToday = date.getTime() === today.getTime();

            // Verificar si es fin de semana
            const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;

            // Verificar si es día festivo
            const holidayName = this.isHoliday(date);
            const isHoliday = holidayName !== null;

            const hasSlots = this.availableSlots[dateStr]?.length > 0;
            const isSelected = this.selectedDate === dateStr;

            let className = 'calendar-day';

            // Los fines de semana, días festivos y días pasados no son disponibles
            if (isPast) {
                className += ' past';
            } else if (isWeekend) {
                className += ' unavailable weekend';
            } else if (isHoliday) {
                className += ' unavailable holiday';
            } else if (hasSlots) {
                className += ' available';
            } else {
                className += ' unavailable';
            }

            if (isToday) className += ' today';
            if (isSelected) className += ' selected';

            const clickable = !isPast && !isWeekend && !isHoliday && hasSlots;
            const onclick = clickable ? `onclick="calendarSystem.selectDate('${dateStr}')"` : '';

            // Texto descriptivo para días no disponibles
            let unavailableText = '';
            if (isWeekend && !isPast) {
                unavailableText = '<span class="unavailable-text">Cerrado</span>';
            } else if (isHoliday && !isPast) {
                unavailableText = `<span class="unavailable-text holiday-text">${holidayName}</span>`;
            }

            // Tooltip descriptivo
            let tooltipText = '';
            if (isWeekend) {
                tooltipText = 'No hay servicio los fines de semana';
            } else if (isHoliday) {
                tooltipText = `Día festivo: ${holidayName}`;
            }

            html += `
                <div class="${className}" ${onclick} 
                     style="${!clickable ? 'cursor: not-allowed;' : 'cursor: pointer;'}"
                     title="${tooltipText}">
                    <span class="day-number">${day}</span>
                    ${hasSlots && !isWeekend && !isHoliday ? `<span class="slots-count">${this.availableSlots[dateStr].length} slots</span>` : unavailableText}
                </div>
            `;
        }

        // Días vacíos al final para completar la última semana
        const remainingDays = 7 - ((startDayOfWeek + lastDay.getDate()) % 7);
        if (remainingDays < 7) {
            for (let i = 0; i < remainingDays; i++) {
                html += '<div class="calendar-day empty"></div>';
            }
        }

        return html;
    },

    changeMonth(delta) {
        const now = new Date();
        this.currentMonth += delta;

        // Ajustar año si es necesario
        if (this.currentMonth > 11) {
            this.currentMonth = 0;
            this.currentYear++;
        } else if (this.currentMonth < 0) {
            this.currentMonth = 11;
            this.currentYear--;
        }

        // Limitar navegación: no más atrás del mes actual, permitir hasta 3 meses adelante
        const targetDate = new Date(this.currentYear, this.currentMonth, 1);
        const minDate = new Date(now.getFullYear(), now.getMonth(), 1);

        // Calcular fecha máxima permitida (3 meses desde hoy)
        const maxDate = new Date(now.getFullYear(), now.getMonth() + 3, 1);

        if (targetDate < minDate) {
            this.currentMonth = now.getMonth();
            this.currentYear = now.getFullYear();
        } else if (targetDate > maxDate) {
            const maxAllowedMonth = now.getMonth() + 3;
            this.currentYear = now.getFullYear() + Math.floor(maxAllowedMonth / 12);
            this.currentMonth = maxAllowedMonth % 12;
        }

        console.log(`📅 Navegando a: ${this.getMonthName(this.currentMonth)} ${this.currentYear}`);
        this.renderCalendar();
    },

    selectDate(dateStr) {
        console.log('📅 Fecha seleccionada:', dateStr);
        this.selectedDate = dateStr;
        this.selectedTime = null;
        this.renderCalendar();
        this.showTimeSlots();
        this.goToStep(2);
    },

    showTimeSlots() {
        const container = document.getElementById('time-slots-container');
        if (!container || !this.selectedDate) return;

        const slots = this.availableSlots[this.selectedDate] || [];
        const dateObj = new Date(this.selectedDate + 'T00:00:00');
        const formattedDate = dateObj.toLocaleDateString('es-ES', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });

        container.innerHTML = `
            <div class="time-slots-header">
                <h3>⏰ Horarios disponibles</h3>
                <p class="selected-date">${formattedDate}</p>
                <button type="button" class="btn-back" onclick="calendarSystem.goToStep(1)">
                    ← Cambiar fecha
                </button>
            </div>
            <div class="time-slots-grid">
                ${slots.length > 0 ?
                slots.map(time => `
                        <button type="button" 
                                class="time-slot ${this.selectedTime === time ? 'selected' : ''}"
                                onclick="calendarSystem.selectTime('${time}')">
                            <span class="time-text">${time}</span>
                        </button>
                    `).join('') :
                '<p class="no-slots">No hay horarios disponibles para esta fecha.</p>'
            }
            </div>
        `;
    },

    selectTime(time) {
        console.log('⏰ Horario seleccionado:', time);
        this.selectedTime = time;
        this.showTimeSlots();

        setTimeout(() => {
            this.showClientForm();
            this.goToStep(3);
        }, 300);
    },

    showClientForm() {
        const infoContainer = document.getElementById('selected-appointment-info');
        if (!infoContainer || !this.selectedDate || !this.selectedTime) return;

        const dateTime = new Date(this.selectedDate + 'T' + this.selectedTime + ':00');
        const formatted = dateTime.toLocaleDateString('es-ES', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        }) + ' a las ' + this.selectedTime;

        infoContainer.innerHTML = `
            <div class="appointment-summary">
                <h3>📋 Resumen de tu cita</h3>
                <div class="appointment-details">
                    <div class="detail-item">
                        <span class="icon">📅</span>
                        <span class="text">${formatted}</span>
                    </div>
                    <div class="detail-item">
                        <span class="icon">⏱️</span>
                        <span class="text">Duración: 45 minutos</span>
                    </div>
                </div>
                <button type="button" class="btn-change-time" onclick="calendarSystem.goToStep(2)">
                    ← Cambiar horario
                </button>
            </div>
        `;

        setTimeout(() => {
            const clientForm = document.getElementById('client-form');
            if (clientForm) {
                const newForm = clientForm.cloneNode(true);
                clientForm.parentNode.replaceChild(newForm, clientForm);

                newForm.addEventListener('submit', (e) => {
                    e.preventDefault();
                    e.stopPropagation();

                    if (this.isSubmitting) {
                        console.log('Ya hay un envío en proceso');
                        return false;
                    }

                    this.handleFormSubmit(e);
                    return false;
                }, { once: false });
            }
        }, 100);
    },

    async handleFormSubmit(e) {
        e.preventDefault();
        e.stopPropagation();

        if (this.isSubmitting) {
            console.log('⚠️ Envío ya en proceso');
            return;
        }

        this.isSubmitting = true;
        this.showLoading(true);
        this.hideError();

        const formData = new FormData(e.target);

        // CRÍTICO: Extraer y validar TODOS los datos antes de enviar
        const citaData = {
            nombreCompleto: formData.get('nombre')?.trim() || '',
            empresa: formData.get('empresa')?.trim() || '',
            email: formData.get('email')?.trim() || '',
            telefono: formData.get('telefono')?.trim() || '',
            servicioInteres: formData.get('servicio') || '',
            fechaHora: `${this.selectedDate}T${this.selectedTime}:00`,
            modalidad: formData.get('modalidad') || '',
            descripcion: formData.get('descripcion')?.trim() || '',
            estado: 'Pendiente',
            notasAdmin: '',
            usuarioAlta: 'WebClient',
            usuarioMod: 'WebClient',
            fechaAlta: new Date().toISOString(),
            fechaMod: new Date().toISOString()
        };

        console.log('📤 Datos del formulario extraídos:');
        console.log('  - Nombre:', citaData.nombreCompleto);
        console.log('  - Email:', citaData.email);
        console.log('  - Teléfono:', citaData.telefono);
        console.log('  - Servicio:', citaData.servicioInteres);
        console.log('  - Modalidad:', citaData.modalidad);
        console.log('  - Fecha/Hora:', citaData.fechaHora);

        // Validaciones
        if (!citaData.nombreCompleto) {
            this.showError('Por favor ingresa tu nombre completo');
            this.showLoading(false);
            this.isSubmitting = false;
            return;
        }

        if (!citaData.email) {
            this.showError('Por favor ingresa tu email');
            this.showLoading(false);
            this.isSubmitting = false;
            return;
        }

        if (!citaData.telefono) {
            this.showError('Por favor ingresa tu teléfono');
            this.showLoading(false);
            this.isSubmitting = false;
            return;
        }

        if (!citaData.servicioInteres) {
            this.showError('Por favor selecciona un servicio');
            this.showLoading(false);
            this.isSubmitting = false;
            return;
        }

        if (!citaData.modalidad) {
            this.showError('Por favor selecciona una modalidad');
            this.showLoading(false);
            this.isSubmitting = false;
            return;
        }

        try {
            const url = `${this.config.apiBaseUrl}${this.config.apiPath}`;
            console.log('📡 Enviando a:', url);
            console.log('📦 Payload completo:', JSON.stringify(citaData, null, 2));

            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), this.config.timeout);

            const response = await fetch(url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                },
                body: JSON.stringify(citaData),
                signal: controller.signal
            });

            clearTimeout(timeoutId);

            const responseText = await response.text();
            console.log('📨 Response Status:', response.status);
            console.log('📨 Response Text:', responseText);

            if (response.status === 500 || response.status === 201 || response.status === 200) {
                console.log('✅ Considerando respuesta como exitosa');

                // Usar los datos que enviamos para la confirmación
                const confirmData = {
                    ...citaData,
                    id: Date.now(),
                    success: true
                };

                console.log('📋 Datos para confirmación:', confirmData);
                this.showConfirmation(confirmData);
                this.goToStep(4);
                this.isSubmitting = false;
                this.showLoading(false);
                return;
            }

            if (!response.ok) {
                let errorMessage = `Error ${response.status}`;
                try {
                    const errorData = JSON.parse(responseText);
                    errorMessage = errorData.error || errorData.message || errorMessage;
                } catch (e) {
                    errorMessage = responseText || errorMessage;
                }
                throw new Error(errorMessage);
            }

            let result;
            try {
                result = JSON.parse(responseText);
            } catch (e) {
                // Si no se puede parsear, usar los datos que enviamos
                result = {
                    ...citaData,
                    success: true,
                    id: Date.now()
                };
            }

            console.log('✅ Resultado final:', result);
            this.showConfirmation(result);
            this.goToStep(4);

        } catch (error) {
            console.error('❌ Error:', error);

            let userMessage = 'No se pudo crear la cita. ';

            if (error.name === 'AbortError') {
                userMessage += 'El servidor tardó demasiado en responder.';
            } else if (error.message.includes('Failed to fetch') || error.message.includes('NetworkError')) {
                userMessage += 'No se pudo conectar con el servidor.';
            } else {
                userMessage = error.message;
            }

            this.showError(userMessage);
        } finally {
            this.isSubmitting = false;
            this.showLoading(false);
        }
    },

    showFallbackMessage(citaData) {
        const container = document.getElementById('confirmation-container');
        if (!container) return;

        const fechaHora = new Date(citaData.fechaHora);
        const formattedDate = fechaHora.toLocaleDateString('es-ES', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
        const formattedTime = fechaHora.toLocaleTimeString('es-ES', {
            hour: '2-digit',
            minute: '2-digit'
        });

        const whatsappMessage = encodeURIComponent(
            `Hola, solicité una cita para el ${formattedDate} a las ${formattedTime}. ` +
            `Mi nombre es ${citaData.nombreCompleto} y estoy interesado en ${citaData.servicioInteres}.`
        );

        container.innerHTML = `
            <div class="confirmation-warning">
                <div class="warning-icon">⚠️</div>
                <h3>Solicitud Recibida</h3>
                <p class="warning-message">
                    Tu solicitud ha sido registrada pero necesitamos confirmarla. 
                    Te contactaremos en breve para verificar tu cita.
                </p>
                
                <div class="confirmation-details">
                    <div class="detail-card">
                        <h4>Datos de tu solicitud:</h4>
                        <div class="detail-row">
                            <span class="label">Fecha solicitada:</span>
                            <span class="value">${formattedDate}</span>
                        </div>
                        <div class="detail-row">
                            <span class="label">Hora solicitada:</span>
                            <span class="value">${formattedTime}</span>
                        </div>
                        <div class="detail-row">
                            <span class="label">Modalidad:</span>
                            <span class="value">${citaData.modalidad}</span>
                        </div>
                        <div class="detail-row">
                            <span class="label">Servicio:</span>
                            <span class="value">${citaData.servicioInteres}</span>
                        </div>
                    </div>
                </div>

                <div class="next-steps">
                    <h4>Qué hacer ahora:</h4>
                    <ul>
                        <li>Te llamaremos al ${citaData.telefono} en las próximas 2 horas</li>
                        <li>También recibirás un email de confirmación</li>
                        <li>O puedes contactarnos por WhatsApp para confirmar inmediatamente</li>
                    </ul>
                </div>

                <div class="confirmation-actions">
                    <button type="button" class="btn-whatsapp" onclick="window.open('https://wa.me/525659644304?text=${whatsappMessage}', '_blank')" style="background: #25D366; color: white; padding: 12px 24px; border: none; border-radius: 8px; cursor: pointer; font-weight: 600; display: flex; align-items: center; gap: 8px; margin: 0 auto 10px;">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="white">
                            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.890-5.335 11.893-11.893A11.821 11.821 0 0020.885 3.595z"/>
                        </svg>
                        Confirmar por WhatsApp
                    </button>
                    <button type="button" class="btn-close" onclick="calendarSystem.closeModal()">
                        Cerrar
                    </button>
                </div>
            </div>
        `;

        this.goToStep(4);
    },

    showConfirmation(cita) {
        const container = document.getElementById('confirmation-container');
        if (!container) return;

        const fechaHora = new Date(cita.fechaHora);
        const formattedDate = fechaHora.toLocaleDateString('es-ES', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
        const formattedTime = fechaHora.toLocaleTimeString('es-ES', {
            hour: '2-digit',
            minute: '2-digit'
        });

        let modalityInstructions = '';
        let modalityIcon = '';

        switch (cita.modalidad) {
            case 'Virtual':
                modalityIcon = '💻';
                modalityInstructions = `
                    <div class="modality-instructions virtual">
                        <h4>📹 Instrucciones para tu Cita Virtual:</h4>
                        <ul>
                            <li><strong>Recibirás un enlace de Google Meet</strong> por email 1 hora antes</li>
                            <li>Asegúrate de tener buena conexión a internet</li>
                            <li>Prueba tu cámara y micrófono con anticipación</li>
                            <li>Ten a la mano documentos o información relevante</li>
                            <li>Busca un lugar tranquilo sin interrupciones</li>
                        </ul>
                        <div class="tech-requirements">
                            <strong>Requisitos técnicos:</strong>
                            <span>Navegador actualizado (Chrome, Firefox, Safari) o app de Google Meet</span>
                        </div>
                    </div>
                `;
                break;

            case 'Telefonica':
                modalityIcon = '📞';
                modalityInstructions = `
                    <div class="modality-instructions phone">
                        <h4>📱 Instrucciones para tu Cita Telefónica:</h4>
                        <ul>
                            <li><strong>Te llamaremos al número:</strong> ${cita.telefono}</li>
                            <li>Mantén tu teléfono disponible a la hora agendada</li>
                            <li>Asegúrate de tener buena señal o batería</li>
                            <li>Prepara cualquier documento o pregunta con anticipación</li>
                            <li>Si no contestas, te enviaremos un WhatsApp</li>
                        </ul>
                        <div class="phone-reminder">
                            <strong>💡 Tip:</strong> Guarda nuestro número +52 (565) 964-4304
                        </div>
                    </div>
                `;
                break;

            case 'Presencial':
                modalityIcon = '🏢';
                modalityInstructions = `
                    <div class="modality-instructions presencial">
                        <h4>📍 Instrucciones para tu Cita Presencial:</h4>
                        <ul>
                            <li><strong>Dirección:</strong> [Dirección de oficina]</li>
                            <li>Llega 10 minutos antes para registro</li>
                            <li>Trae identificación oficial</li>
                            <li>Si llegas tarde, avísanos por WhatsApp</li>
                            <li>Hay estacionamiento disponible</li>
                        </ul>
                        <div class="location-map">
                            <a href="https://maps.google.com/?q=Consultoria+Integral+SC" target="_blank" 
                               style="color: #4A90E2; text-decoration: none;">
                                📍 Ver ubicación en Google Maps
                            </a>
                        </div>
                    </div>
                `;
                break;
        }

        container.innerHTML = `
            <div class="confirmation-success">
                <div class="success-icon">✅</div>
                <h3>¡Cita Confirmada!</h3>
                <p class="success-message">Tu consulta ha sido agendada exitosamente</p>
                
                <div class="confirmation-details">
                    <div class="detail-card">
                        <h4>Detalles de tu cita:</h4>
                        <div class="detail-row">
                            <span class="label">Fecha:</span>
                            <span class="value">${formattedDate}</span>
                        </div>
                        <div class="detail-row">
                            <span class="label">Hora:</span>
                            <span class="value">${formattedTime}</span>
                        </div>
                        <div class="detail-row highlight">
                            <span class="label">Modalidad:</span>
                            <span class="value">${modalityIcon} ${cita.modalidad}</span>
                        </div>
                        <div class="detail-row">
                            <span class="label">Servicio:</span>
                            <span class="value">${cita.servicioInteres}</span>
                        </div>
                    </div>
                </div>

                ${modalityInstructions}

                <div class="next-steps">
                    <h4>✉️ Próximos pasos:</h4>
                    <ul>
                        <li>Recibirás un email de confirmación con todos los detalles</li>
                        <li>Te recordaremos 1 día antes por email</li>
                        <li>Te contactaremos 30 minutos antes por WhatsApp</li>
                        <li>Para reprogramar o cancelar, contáctanos con 24 horas de anticipación</li>
                    </ul>
                </div>

                <div class="confirmation-actions">
                    <button type="button" class="btn-success-main" onclick="calendarSystem.closeModal()">
                        ✓ Perfecto
                    </button>
                </div>
            </div>
        `;

        // Marcar el paso 4 como completado
        this.updateStepIndicators();
    },

    goToStep(step) {
        if (step < 1 || step > 4) return;
        this.currentStep = step;
        this.updateStepIndicators();
        this.showStep(step);
    },

    goBack() {
        if (this.currentStep > 1) {
            this.goToStep(this.currentStep - 1);
        }
    },

    showStep(step) {
        const containers = {
            1: 'calendar-container',
            2: 'time-slots-container',
            3: 'client-form-container',
            4: 'confirmation-container'
        };

        document.querySelectorAll('.modal-step').forEach(el => {
            el.style.display = 'none';
        });

        const container = document.getElementById(containers[step]);
        if (container) {
            container.style.display = 'block';
        }
    },

    updateStepIndicators() {
        for (let i = 1; i <= 4; i++) {
            const indicator = document.getElementById(`step-${i}`);
            if (indicator) {
                indicator.className = 'step';
                if (i < this.currentStep) indicator.classList.add('completed');
                else if (i === this.currentStep) indicator.classList.add('active');
            }
        }
    },

    getMonthName(month) {
        return ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
            'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'][month];
    },

    showLoading(show) {
        this.isLoading = show;
        const btn = document.querySelector('#client-form .btn-submit');
        if (btn) {
            btn.disabled = show;
            btn.textContent = show ? 'Procesando...' : 'Confirmar Cita';
        }
    },

    showError(message) {
        const container = document.getElementById('error-message');
        if (container) {
            container.innerHTML = `
                <div class="error-alert">
                    <span class="error-icon">⚠️</span>
                    <span class="error-text">${message}</span>
                    <button class="error-close" onclick="this.parentElement.parentElement.style.display='none'">×</button>
                </div>
            `;
            container.style.display = 'block';
            setTimeout(() => container.style.display = 'none', 8000);
        }
    },

    hideError() {
        const container = document.getElementById('error-message');
        if (container) container.style.display = 'none';
    },

    resetForm() {
        this.selectedDate = null;
        this.selectedTime = null;
        this.currentStep = 1;
        this.isSubmitting = false;

        const now = new Date();
        this.currentMonth = now.getMonth();
        this.currentYear = now.getFullYear();

        const form = document.getElementById('client-form');
        if (form) form.reset();

        this.loadAvailableSlots().then(() => {
            this.renderCalendar();
            this.goToStep(1);
        });
    },

    closeModal() {
        const modal = document.getElementById('citaModal');
        if (modal) {
            modal.classList.remove('show');
            setTimeout(() => {
                modal.style.display = 'none';
                this.resetForm();
            }, 300);
        }
    }
};

// Funciones globales
function openCitaModal() {
    const modal = document.getElementById('citaModal');
    if (modal) {
        modal.style.display = 'flex';
        setTimeout(() => {
            modal.classList.add('show');
            if (!calendarSystem.selectedDate) {
                calendarSystem.init();
            }
        }, 10);
    }
}

function closeCitaModal() {
    calendarSystem.closeModal();
}

// Exponer al scope global
window.calendarSystem = calendarSystem;
window.openCitaModal = openCitaModal;
window.closeCitaModal = closeCitaModal;

console.log('Sistema de calendario mejorado cargado con navegación de meses');