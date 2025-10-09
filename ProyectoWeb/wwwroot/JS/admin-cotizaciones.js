console.log('📜 admin-cotizaciones.js cargando...');

// Datos globales
window.cotizacionesData = window.cotizacionesData || [];
window.cotizacionesFiltradas = [];
window.selectedCotizacion = null;
window.currentSort = { field: 'fechaAlta', order: 'desc' }; // NUEVO: Ordenamiento

// Marcar como inicializado
window.adminCotizacionesInitialized = true;

// Función principal de inicialización
window.initAdminCotizaciones = function () {
    console.log('🚀 Inicializando AdminCotizaciones...');
    console.log('📊 Cotizaciones disponibles:', window.cotizacionesData.length);

    actualizarEstadisticas();
    aplicarFiltros();

    console.log('✅ AdminCotizaciones inicializado correctamente');
};

// Actualizar estadísticas
function actualizarEstadisticas() {
    const total = window.cotizacionesData.length;
    const pendientes = window.cotizacionesData.filter(c => c.estado === 'Pendiente').length;
    const enProceso = window.cotizacionesData.filter(c => c.estado === 'En Proceso').length;
    const enviadas = window.cotizacionesData.filter(c => c.estado === 'Enviada').length;

    document.getElementById('statTotal').textContent = total;
    document.getElementById('statPendientes').textContent = pendientes;
    document.getElementById('statEnProceso').textContent = enProceso;
    document.getElementById('statEnviadas').textContent = enviadas;
}

// NUEVA FUNCIÓN: Ordenar cotizaciones
window.ordenarCotizaciones = function (campo) {
    console.log('🔄 Ordenando por:', campo);

    // Cambiar dirección si es el mismo campo
    if (window.currentSort.field === campo) {
        window.currentSort.order = window.currentSort.order === 'asc' ? 'desc' : 'asc';
    } else {
        window.currentSort.field = campo;
        window.currentSort.order = 'desc';
    }

    aplicarFiltros();
};

// Aplicar filtros Y ORDENAMIENTO
window.aplicarFiltros = function () {
    console.log('🔍 Aplicando filtros...');

    const estadoFilter = document.getElementById('estadoFilter').value;
    const prioridadFilter = document.getElementById('prioridadFilter').value;
    const searchTerm = document.getElementById('searchInput').value.toLowerCase();

    // FILTRAR
    window.cotizacionesFiltradas = window.cotizacionesData.filter(cotizacion => {
        if (estadoFilter && cotizacion.estado !== estadoFilter) return false;
        if (prioridadFilter && cotizacion.prioridad !== prioridadFilter) return false;

        if (searchTerm) {
            const nombre = (cotizacion.nombre || '').toLowerCase();
            const correo = (cotizacion.correo || '').toLowerCase();
            const empresa = (cotizacion.nombreEmpresa || '').toLowerCase();
            const folio = `#${String(cotizacion.id).padStart(6, '0')}`.toLowerCase();

            if (!nombre.includes(searchTerm) &&
                !correo.includes(searchTerm) &&
                !empresa.includes(searchTerm) &&
                !folio.includes(searchTerm)) {
                return false;
            }
        }

        return true;
    });

    // ORDENAR
    window.cotizacionesFiltradas.sort((a, b) => {
        let valorA, valorB;

        switch (window.currentSort.field) {
            case 'fechaAlta':
                valorA = new Date(a.fechaAlta || 0);
                valorB = new Date(b.fechaAlta || 0);
                break;
            case 'prioridad':
                const prioridades = { 'Urgente': 3, 'Alta': 2, 'Media': 1 };
                valorA = prioridades[a.prioridad] || 0;
                valorB = prioridades[b.prioridad] || 0;
                break;
            case 'estado':
                valorA = a.estado || '';
                valorB = b.estado || '';
                break;
            case 'nombre':
                valorA = (a.nombre || '').toLowerCase();
                valorB = (b.nombre || '').toLowerCase();
                break;
            default:
                valorA = a[window.currentSort.field] || '';
                valorB = b[window.currentSort.field] || '';
        }

        if (valorA < valorB) return window.currentSort.order === 'asc' ? -1 : 1;
        if (valorA > valorB) return window.currentSort.order === 'asc' ? 1 : -1;
        return 0;
    });

    console.log(`✅ ${window.cotizacionesFiltradas.length} cotizaciones después de filtrar y ordenar`);
    renderizarCotizaciones();
};

// Renderizar lista de cotizaciones con MEJOR ORGANIZACIÓN
function renderizarCotizaciones() {
    const container = document.getElementById('cotizacionesList');

    if (!window.cotizacionesFiltradas || window.cotizacionesFiltradas.length === 0) {
        container.innerHTML = `
            <div style="text-align: center; padding: 60px 20px;">
                <div style="font-size: 48px; margin-bottom: 20px;">📭</div>
                <h3 style="color: #666; margin: 0;">No hay cotizaciones</h3>
                <p style="color: #999; margin-top: 10px;">
                    ${document.getElementById('searchInput').value ||
                document.getElementById('estadoFilter').value ||
                document.getElementById('prioridadFilter').value
                ? 'No hay resultados con los filtros aplicados'
                : 'Aún no se han recibido cotizaciones'}
                </p>
            </div>
        `;
        return;
    }

    // AGRUPAR POR ESTADO para mejor organización
    const agrupadas = {
        'Pendiente': [],
        'En Proceso': [],
        'Enviada': [],
        'Rechazada': []
    };

    window.cotizacionesFiltradas.forEach(c => {
        if (agrupadas[c.estado]) {
            agrupadas[c.estado].push(c);
        }
    });

    let html = '';

    // Renderizar cada grupo
    Object.keys(agrupadas).forEach(estado => {
        const cotizaciones = agrupadas[estado];
        if (cotizaciones.length === 0) return;

        const estadoInfo = {
            'Pendiente': { icon: '⏳', color: '#ff9800', bg: '#fff3e0' },
            'En Proceso': { icon: '🔄', color: '#2196F3', bg: '#e3f2fd' },
            'Enviada': { icon: '✅', color: '#4caf50', bg: '#e8f5e9' },
            'Rechazada': { icon: '❌', color: '#f44336', bg: '#ffebee' }
        };

        const info = estadoInfo[estado];

        html += `
            <div class="grupo-estado" style="margin-bottom: 30px;">
                <div class="grupo-header" style="background: ${info.bg}; padding: 15px; border-radius: 8px; margin-bottom: 15px; border-left: 4px solid ${info.color};">
                    <h3 style="margin: 0; color: ${info.color}; display: flex; align-items: center; gap: 10px;">
                        <span style="font-size: 24px;">${info.icon}</span>
                        ${estado} (${cotizaciones.length})
                    </h3>
                </div>
                <div class="grupo-cotizaciones" style="display: grid; gap: 15px;">
        `;

        // Renderizar cotizaciones del grupo
        cotizaciones.forEach(cotizacion => {
            html += renderizarCotizacionCard(cotizacion);
        });

        html += `
                </div>
            </div>
        `;
    });

    container.innerHTML = html;
}

// Renderizar una tarjeta individual
function renderizarCotizacionCard(cotizacion) {
    const diasPasados = Math.floor((new Date() - new Date(cotizacion.fechaAlta)) / (1000 * 60 * 60 * 24));
    const esUrgente = diasPasados > 2 && cotizacion.estado === 'Pendiente';

    return `
        <div class="cotizacion-card ${getPrioridadClass(cotizacion.prioridad)} ${esUrgente ? 'cotizacion-urgente' : ''}" 
             style="${esUrgente ? 'border: 2px solid #f44336; box-shadow: 0 0 10px rgba(244, 67, 54, 0.3);' : ''}">
            
            <div class="cotizacion-header">
                <div class="cotizacion-info">
                    <div style="display: flex; align-items: center; gap: 10px; flex-wrap: wrap;">
                        <span class="folio-badge" style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 6px 15px; border-radius: 20px; font-weight: 600; font-size: 14px;">
                            #${String(cotizacion.id).padStart(6, '0')}
                        </span>
                        <h3 style="margin: 0;">${cotizacion.nombre}</h3>
                        ${esUrgente ? '<span style="background: #f44336; color: white; padding: 4px 12px; border-radius: 12px; font-size: 12px; font-weight: 600;">⚠️ URGENTE - ' + diasPasados + ' días</span>' : ''}
                    </div>
                    <div style="margin-top: 8px; display: flex; gap: 8px; flex-wrap: wrap;">
                        <span class="empresa-badge">🏢 ${cotizacion.nombreEmpresa || 'Sin empresa'}</span>
                        ${cotizacion.tamanoEmpresa ? `<span class="size-badge">👥 ${cotizacion.tamanoEmpresa}</span>` : ''}
                    </div>
                </div>
                <div class="cotizacion-badges">
                    <span class="priority-badge priority-${cotizacion.prioridad.toLowerCase()}">
                        ${getPrioridadIcon(cotizacion.prioridad)} ${cotizacion.prioridad}
                    </span>
                </div>
            </div>

            <div class="cotizacion-body">
                <div class="info-grid">
                    <div class="info-item">
                        <span class="info-icon">📧</span>
                        <a href="mailto:${cotizacion.correo}">${cotizacion.correo}</a>
                    </div>
                    <div class="info-item">
                        <span class="info-icon">📱</span>
                        <a href="tel:${cotizacion.telefono}">${cotizacion.telefono}</a>
                    </div>
                    <div class="info-item">
                        <span class="info-icon">💼</span>
                        <span>${cotizacion.tipoConsulta}</span>
                    </div>
                    <div class="info-item">
                        <span class="info-icon">📅</span>
                        <span>${formatearFecha(cotizacion.fechaAlta)} <small style="color: #999;">(hace ${diasPasados} días)</small></span>
                    </div>
                </div>

                ${cotizacion.mensaje ? `
                    <div class="mensaje-section">
                        <strong>📝 Mensaje del cliente:</strong>
                        <p>${cotizacion.mensaje.substring(0, 150)}${cotizacion.mensaje.length > 150 ? '...' : ''}</p>
                    </div>
                ` : ''}

                ${cotizacion.notasInternas ? `
                    <div class="notas-section">
                        <strong>📌 Notas internas:</strong>
                        <p>${cotizacion.notasInternas}</p>
                    </div>
                ` : ''}
            </div>

            <div class="cotizacion-actions">
                <button type="button" class="action-btn btn-view" onclick="window.showCotizacionDetails(${cotizacion.id})">
                    👁️ Ver Detalles
                </button>
                <button type="button" class="action-btn btn-whatsapp" onclick="window.openWhatsApp(${cotizacion.id})">
                    💬 WhatsApp
                </button>
                ${cotizacion.estado === 'Pendiente' ? `
                    <button type="button" class="action-btn btn-process" onclick="window.updateEstado(${cotizacion.id}, 'En Proceso')">
                        🔄 En Proceso
                    </button>
                ` : ''}
                ${cotizacion.estado !== 'Enviada' && cotizacion.estado !== 'Rechazada' ? `
                    <button type="button" class="action-btn btn-send" onclick="window.showCotizacionDetails(${cotizacion.id})">
                        📨 Responder
                    </button>
                ` : ''}
            </div>
        </div>
    `;
}

// MEJORADO: Mostrar detalles con FILE UPLOAD FUNCIONAL
window.showCotizacionDetails = function (id) {
    console.log('👁️ Mostrando detalles de cotización ID:', id);

    window.selectedCotizacion = window.cotizacionesData.find(c => c.id === id);

    if (!window.selectedCotizacion) {
        console.error('❌ Cotización no encontrada');
        return;
    }

    const modal = document.getElementById('cotizacionModal');
    const modalContent = document.getElementById('modalContent');

    if (!modal || !modalContent) {
        console.error('❌ Modal no encontrado');
        alert('Error: Modal no encontrado. Recarga la página.');
        return;
    }

    modalContent.innerHTML = `
        <div class="modal-body">
            <div class="detail-section">
                <h3>📋 Información del Cliente</h3>
                <div class="detail-grid">
                    <div class="detail-item">
                        <strong>Folio:</strong>
                        <span style="color: #667eea; font-weight: 600;">#${String(window.selectedCotizacion.id).padStart(6, '0')}</span>
                    </div>
                    <div class="detail-item">
                        <strong>Nombre:</strong>
                        <span>${window.selectedCotizacion.nombre}</span>
                    </div>
                    <div class="detail-item">
                        <strong>Email:</strong>
                        <a href="mailto:${window.selectedCotizacion.correo}">${window.selectedCotizacion.correo}</a>
                    </div>
                    <div class="detail-item">
                        <strong>Teléfono:</strong>
                        <a href="tel:${window.selectedCotizacion.telefono}">${window.selectedCotizacion.telefono}</a>
                    </div>
                    <div class="detail-item">
                        <strong>Empresa:</strong>
                        <span>${window.selectedCotizacion.nombreEmpresa || 'No especificada'}</span>
                    </div>
                    <div class="detail-item">
                        <strong>Tamaño:</strong>
                        <span>${window.selectedCotizacion.tamanoEmpresa || 'No especificado'}</span>
                    </div>
                </div>
            </div>

            <div class="detail-section">
                <h3>💼 Información de la Solicitud</h3>
                <div class="detail-grid">
                    <div class="detail-item">
                        <strong>Tipo de Consulta:</strong>
                        <span>${window.selectedCotizacion.tipoConsulta}</span>
                    </div>
                    <div class="detail-item">
                        <strong>Prioridad:</strong>
                        <span class="priority-badge priority-${window.selectedCotizacion.prioridad.toLowerCase()}">
                            ${getPrioridadIcon(window.selectedCotizacion.prioridad)} ${window.selectedCotizacion.prioridad}
                        </span>
                    </div>
                    <div class="detail-item">
                        <strong>Estado:</strong>
                        <span class="status-badge status-${window.selectedCotizacion.estado.toLowerCase().replace(' ', '-')}">
                            ${window.selectedCotizacion.estado}
                        </span>
                    </div>
                    <div class="detail-item">
                        <strong>Fecha de Solicitud:</strong>
                        <span>${formatearFecha(window.selectedCotizacion.fechaAlta)}</span>
                    </div>
                </div>
            </div>

            ${window.selectedCotizacion.mensaje ? `
                <div class="detail-section">
                    <h3>💬 Mensaje del Cliente</h3>
                    <div class="message-box">${window.selectedCotizacion.mensaje}</div>
                </div>
            ` : ''}

            <div class="detail-section">
                <h3>📝 Notas Internas</h3>
                <textarea class="notes-textarea" id="adminNotes" 
                          placeholder="Agregar notas internas..." rows="4">${window.selectedCotizacion.notasInternas || ''}</textarea>
            </div>

            ${window.selectedCotizacion.estado !== 'Enviada' ? `
                <div class="detail-section respuesta-section">
                    <h3>📧 Responder Cotización al Cliente</h3>
                    <p style="color: #666; margin-bottom: 15px;">Esta respuesta se enviará por email al cliente</p>
                    
                    <div style="margin-bottom: 15px;">
                        <label style="display: block; font-weight: 600; margin-bottom: 5px;">💰 Monto Estimado (Opcional)</label>
                        <input type="number" 
                               class="monto-input" 
                               id="montoEstimado" 
                               placeholder="Ej: 15000.00"
                               value="${window.selectedCotizacion.montoEstimado || ''}"
                               step="0.01"
                               min="0" />
                        <small style="color: #666;">Si no se especifica, se mostrará "A consultar"</small>
                    </div>

                    <div style="margin-bottom: 15px;">
                        <label style="display: block; font-weight: 600; margin-bottom: 5px;">📋 Respuesta Detallada</label>
                        <textarea class="respuesta-textarea" 
                                  id="respuestaAdmin" 
                                  placeholder="Describe los servicios incluidos, tiempos de entrega, condiciones, etc..."
                                  rows="6">${window.selectedCotizacion.respuestaAdmin || ''}</textarea>
                    </div>

                    <div style="margin-bottom: 20px;">
                        <label style="display: block; font-weight: 600; margin-bottom: 8px;">📄 Adjuntar Cotización en PDF (Opcional)</label>
                        <input type="file" 
                               id="archivoPDFCotizacion" 
                               accept=".pdf"
                               style="display: none;" 
                               onchange="window.handleFileSelect(event)" />
                        <div class="file-upload-area" 
                             onclick="document.getElementById('archivoPDFCotizacion').click()"
                             style="border: 2px dashed #ddd; border-radius: 8px; padding: 30px; text-align: center; cursor: pointer; background: #f8f9fa; transition: all 0.3s;"
                             onmouseover="this.style.borderColor='#667eea'; this.style.background='#f3f4ff';"
                             onmouseout="this.style.borderColor='#ddd'; this.style.background='#f8f9fa';">
                            <div id="fileUploadStatus">
                                <p style="margin: 0 0 8px 0; font-size: 24px;">📄</p>
                                <p style="margin: 0 0 5px 0; font-weight: 600; color: #333;">Haz clic para seleccionar un PDF</p>
                                <small style="color: #666;">Solo archivos PDF - Máximo 10MB</small>
                            </div>
                        </div>
                        <small style="color: #666; display: block; margin-top: 8px;">
                            💡 Si adjuntas un PDF, se enviará junto con el email al cliente
                        </small>
                    </div>

                    <button type="button" class="btn-enviar-cotizacion" onclick="window.enviarCotizacionCliente()">
                        📨 Enviar Cotización al Cliente
                    </button>
                </div>
            ` : `
                <div class="detail-section" style="background: #e8f5e9; border-left: 4px solid #4caf50;">
                    <h3 style="color: #2e7d32;">✅ Cotización Enviada</h3>
                    ${window.selectedCotizacion.respuestaAdmin ? `
                        <div style="margin-top: 15px;">
                            <strong>Respuesta enviada:</strong>
                            <div style="background: white; padding: 15px; border-radius: 8px; margin-top: 10px; white-space: pre-wrap;">
                                ${window.selectedCotizacion.respuestaAdmin}
                            </div>
                        </div>
                    ` : ''}
                    ${window.selectedCotizacion.montoEstimado ? `
                        <div style="margin-top: 15px;">
                            <strong>Monto:</strong> $${window.selectedCotizacion.montoEstimado.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} MXN
                        </div>
                    ` : ''}
                    ${window.selectedCotizacion.fechaCotizacion ? `
                        <div style="margin-top: 10px; color: #666;">
                            <small>Enviada el: ${formatearFecha(window.selectedCotizacion.fechaCotizacion)}</small>
                        </div>
                    ` : ''}
                </div>
            `}

            <div class="detail-section">
                <h3>🔄 Cambiar Estado</h3>
                <div class="estado-buttons">
                    <button type="button" class="estado-btn pendiente" onclick="window.updateEstadoFromModal('Pendiente')">
                        ⏳ Pendiente
                    </button>
                    <button type="button" class="estado-btn proceso" onclick="window.updateEstadoFromModal('En Proceso')">
                        🔄 En Proceso
                    </button>
                    <button type="button" class="estado-btn enviada" onclick="window.updateEstadoFromModal('Enviada')">
                        ✅ Enviada
                    </button>
                    <button type="button" class="estado-btn rechazada" onclick="window.updateEstadoFromModal('Rechazada')">
                        ❌ Rechazada
                    </button>
                </div>
            </div>
        </div>
    `;

    modal.classList.add('active');
    modal.style.display = 'flex';
    document.body.style.overflow = 'hidden';
};

// NUEVA FUNCIÓN: Manejar selección de archivo
window.handleFileSelect = function (event) {
    const file = event.target.files[0];
    const statusDiv = document.getElementById('fileUploadStatus');

    if (!file) {
        // Restaurar estado inicial si no hay archivo
        statusDiv.innerHTML = `
            <p style="margin: 0 0 8px 0; font-size: 24px;">📄</p>
            <p style="margin: 0 0 5px 0; font-weight: 600; color: #333;">Haz clic para seleccionar un PDF</p>
            <small style="color: #666;">Solo archivos PDF - Máximo 10MB</small>
        `;
        return;
    }

    console.log('📎 Archivo seleccionado:', file.name, file.size, 'bytes');

    // Validar que sea PDF
    if (file.type !== 'application/pdf') {
        alert('⚠️ Solo se permiten archivos PDF');
        event.target.value = '';
        return;
    }

    // Validar tamaño (10MB máximo)
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
        alert('⚠️ El archivo es muy grande. Máximo 10MB');
        event.target.value = '';
        return;
    }

    // Mostrar información del archivo
    const sizeInMB = (file.size / (1024 * 1024)).toFixed(2);
    statusDiv.innerHTML = `
        <div style="display: flex; align-items: center; justify-content: center; gap: 15px;">
            <div style="font-size: 32px;">✅</div>
            <div style="text-align: left;">
                <p style="margin: 0; font-weight: 600; color: #4caf50;">${file.name}</p>
                <small style="color: #666;">${sizeInMB} MB</small>
            </div>
            <button type="button" 
                    onclick="document.getElementById('archivoPDFCotizacion').value=''; window.handleFileSelect({target: {files: []}}); event.stopPropagation();"
                    style="background: #f44336; color: white; border: none; padding: 8px 15px; border-radius: 6px; cursor: pointer; font-size: 12px;">
                🗑️ Quitar
            </button>
        </div>
    `;

    console.log('✅ Archivo validado y listo para enviar');
};

// MEJORADO: Enviar cotización con PDF
window.enviarCotizacionCliente = async function () {
    if (!window.selectedCotizacion) return;

    const respuesta = document.getElementById('respuestaAdmin').value.trim();
    const montoInput = document.getElementById('montoEstimado').value;
    const monto = montoInput ? parseFloat(montoInput) : null;
    const fileInput = document.getElementById('archivoPDFCotizacion');
    const archivoPDF = fileInput?.files[0] || null;

    // Validaciones
    if (!respuesta) {
        alert('⚠️ Por favor escribe una respuesta antes de enviar');
        document.getElementById('respuestaAdmin').focus();
        return;
    }

    if (respuesta.length < 50) {
        alert('⚠️ La respuesta debe ser más detallada (mínimo 50 caracteres)\n\nActualmente tienes: ' + respuesta.length + ' caracteres');
        document.getElementById('respuestaAdmin').focus();
        return;
    }

    if (monto !== null && monto <= 0) {
        alert('⚠️ El monto debe ser mayor a 0');
        document.getElementById('montoEstimado').focus();
        return;
    }

    // Confirmar envío
    const mensajeConfirmacion = archivoPDF
        ? `📨 ¿Enviar cotización a ${window.selectedCotizacion.nombre}?\n\n` +
        `📧 Email: ${window.selectedCotizacion.correo}\n` +
        `💰 Monto: ${monto ? '$' + monto.toLocaleString('es-MX', { minimumFractionDigits: 2 }) + ' MXN' : 'A consultar'}\n` +
        `📄 PDF adjunto: ${archivoPDF.name} (${(archivoPDF.size / 1024).toFixed(2)} KB)\n\n` +
        `¿Deseas continuar?`
        : `📨 ¿Enviar cotización a ${window.selectedCotizacion.nombre}?\n\n` +
        `📧 Email: ${window.selectedCotizacion.correo}\n` +
        `💰 Monto: ${monto ? '$' + monto.toLocaleString('es-MX', { minimumFractionDigits: 2 }) + ' MXN' : 'A consultar'}\n` +
        `📄 Sin PDF adjunto\n\n` +
        `¿Deseas continuar?`;

    if (!confirm(mensajeConfirmacion)) return;

    console.log('📨 Enviando cotización...', {
        id: window.selectedCotizacion.id,
        respuesta: respuesta.substring(0, 50) + '...',
        monto,
        tienePDF: !!archivoPDF,
        nombrePDF: archivoPDF?.name
    });

    // Mostrar indicador de carga
    const btnEnviar = document.querySelector('.btn-enviar-cotizacion');
    const textoOriginal = btnEnviar.innerHTML;
    btnEnviar.disabled = true;
    btnEnviar.innerHTML = '⏳ Enviando cotización...';

    try {
        // Crear FormData para enviar archivo
        const formData = new FormData();
        formData.append('Respuesta', respuesta);
        if (monto !== null) {
            formData.append('MontoEstimado', monto.toString());
        }
        if (archivoPDF) {
            formData.append('ArchivoPDF', archivoPDF);
            console.log('📎 PDF adjuntado al FormData:', archivoPDF.name);
        }

        const response = await fetch(
            `http://ConsultoriaIntegralSC.somee.com/api/Cotizacion/${window.selectedCotizacion.id}/enviar-cotizacion`,
            {
                method: 'POST',
                body: formData
            }
        );

        if (response.ok) {
            const result = await response.json();
            console.log('✅ Cotización enviada:', result);

            alert(
                '✅ ¡Cotización enviada exitosamente!\n\n' +
                `📧 Email enviado a: ${window.selectedCotizacion.correo}\n` +
                (archivoPDF ? `📄 PDF adjunto: ${archivoPDF.name}\n` : '📄 Sin PDF adjunto\n') +
                `💰 Monto: ${monto ? '$' + monto.toLocaleString('es-MX', { minimumFractionDigits: 2 }) + ' MXN' : 'A consultar'}\n\n` +
                (result.emailEnviado
                    ? '✅ El cliente ya recibió el email'
                    : '⚠️ La cotización se guardó pero el email no pudo enviarse')
            );

            // Actualizar datos locales
            window.selectedCotizacion.respuestaAdmin = respuesta;
            window.selectedCotizacion.montoEstimado = monto;
            window.selectedCotizacion.estado = 'Enviada';
            window.selectedCotizacion.fechaCotizacion = new Date().toISOString();
            if (archivoPDF) {
                window.selectedCotizacion.nombreArchivoPDF = archivoPDF.name;
            }

            const cotizacion = window.cotizacionesData.find(c => c.id === window.selectedCotizacion.id);
            if (cotizacion) {
                cotizacion.respuestaAdmin = respuesta;
                cotizacion.montoEstimado = monto;
                cotizacion.estado = 'Enviada';
                cotizacion.fechaCotizacion = new Date().toISOString();
                if (archivoPDF) {
                    cotizacion.nombreArchivoPDF = archivoPDF.name;
                }
            }

            // Cerrar modal y refrescar
            window.closeCotizacionModal();
            await window.refreshCotizaciones();

        } else {
            const errorData = await response.text();
            console.error('❌ Error del servidor:', response.status, errorData);
            alert(`❌ Error al enviar cotización (${response.status})\n\nDetalles: ${errorData}`);

            // Restaurar botón
            btnEnviar.disabled = false;
            btnEnviar.innerHTML = textoOriginal;
        }

    } catch (error) {
        console.error('❌ Error:', error);
        alert('❌ Error de conexión. Verifica tu conexión a internet e intenta nuevamente.');

        // Restaurar botón
        btnEnviar.disabled = false;
        btnEnviar.innerHTML = textoOriginal;
    }
};

// Cerrar modal
window.closeCotizacionModal = function () {
    const modal = document.getElementById('cotizacionModal');
    modal.classList.remove('active');
    modal.style.display = 'none';
    document.body.style.overflow = 'auto';
    window.selectedCotizacion = null;
};

// Guardar notas
window.saveNotas = async function () {
    if (!window.selectedCotizacion) return;

    const notas = document.getElementById('adminNotes').value;
    const id = window.selectedCotizacion.id;

    console.log('💾 Guardando notas para ID:', id);

    try {
        let response = await fetch(`http://ConsultoriaIntegralSC.somee.com/api/Cotizacion/${id}/notas`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ NotasInternas: notas })
        });

        if (!response.ok) {
            console.log('⚠️ Intentando endpoint alternativo...');
            response = await fetch(`http://ConsultoriaIntegralSC.somee.com/api/Cotizacion/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    id: id,
                    notasInternas: notas
                })
            });
        }

        if (response.ok) {
            console.log('✅ Notas guardadas');
            alert('✅ Notas guardadas correctamente');

            const cotizacion = window.cotizacionesData.find(c => c.id === id);
            if (cotizacion) {
                cotizacion.notasInternas = notas;
            }
            window.selectedCotizacion.notasInternas = notas;

            aplicarFiltros();
        } else {
            const errorText = await response.text();
            console.error('❌ Error guardando notas:', response.status, errorText);
            alert(`❌ Error al guardar notas (${response.status})`);
        }
    } catch (error) {
        console.error('❌ Error:', error);
        alert('❌ Error al guardar notas. Verifica tu conexión.');
    }
};

// Actualizar estado (desde card)
window.updateEstado = async function (id, nuevoEstado) {
    console.log('🔄 Actualizando estado:', { id, nuevoEstado });

    try {
        let response = await fetch(`http://ConsultoriaIntegralSC.somee.com/api/Cotizacion/${id}/estado`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ Estado: nuevoEstado })
        });

        if (!response.ok) {
            console.log('⚠️ Intentando formato alternativo del API...');
            response = await fetch(`http://ConsultoriaIntegralSC.somee.com/api/Cotizacion/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    id: id,
                    estado: nuevoEstado
                })
            });
        }

        if (response.ok) {
            console.log('✅ Estado actualizado');
            alert(`✅ Estado actualizado a: ${nuevoEstado}`);

            const cotizacion = window.cotizacionesData.find(c => c.id === id);
            if (cotizacion) {
                cotizacion.estado = nuevoEstado;
            }
            if (window.selectedCotizacion && window.selectedCotizacion.id === id) {
                window.selectedCotizacion.estado = nuevoEstado;
            }

            await window.refreshCotizaciones();
        } else {
            const errorText = await response.text();
            console.error('❌ Error actualizando estado:', response.status, errorText);
            alert(`❌ Error al actualizar estado (${response.status}). Verifica la consola para detalles.`);
        }
    } catch (error) {
        console.error('❌ Error:', error);
        alert('❌ Error al actualizar estado. Verifica tu conexión.');
    }
};

// Actualizar estado desde modal
window.updateEstadoFromModal = async function (nuevoEstado) {
    if (!window.selectedCotizacion) return;

    await window.updateEstado(window.selectedCotizacion.id, nuevoEstado);
    window.closeCotizacionModal();
};

// Abrir WhatsApp
window.openWhatsApp = function (id) {
    const cotizacion = window.cotizacionesData.find(c => c.id === id);

    if (!cotizacion) {
        console.error('❌ Cotización no encontrada');
        return;
    }

    console.log('💬 Abriendo WhatsApp para:', cotizacion.nombre);

    let phone = cotizacion.telefono || '';
    phone = phone.replace(/[\s\-\(\)]/g, '');

    if (!phone.startsWith('+') && !phone.startsWith('52')) {
        phone = '52' + phone;
    }

    phone = phone.replace(/^\+/, '');

    console.log('📱 Teléfono formateado:', phone);

    const message = `Hola ${cotizacion.nombre}, te contacto desde Consultoría Integral sobre tu solicitud de ${cotizacion.tipoConsulta} (Folio #${String(cotizacion.id).padStart(6, '0')}).`;
    const url = `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;

    window.open(url, '_blank');
};

// Refrescar cotizaciones
window.refreshCotizaciones = async function () {
    console.log('🔄 Refrescando cotizaciones...');

    try {
        const response = await fetch('http://ConsultoriaIntegralSC.somee.com/api/Cotizacion');

        if (response.ok) {
            window.cotizacionesData = await response.json();
            console.log('✅ Cotizaciones actualizadas:', window.cotizacionesData.length);

            actualizarEstadisticas();
            aplicarFiltros();
        } else {
            console.error('❌ Error HTTP:', response.status);
            alert('❌ Error al actualizar cotizaciones');
        }
    } catch (error) {
        console.error('❌ Error:', error);
        alert('❌ Error al actualizar cotizaciones');
    }
};

// Utilidades
function getEstadoIcon(estado) {
    switch (estado) {
        case 'Pendiente': return '⏳';
        case 'En Proceso': return '🔄';
        case 'Enviada': return '✅';
        case 'Rechazada': return '❌';
        default: return '📋';
    }
}

function getPrioridadIcon(prioridad) {
    switch (prioridad) {
        case 'Urgente': return '🔴';
        case 'Alta': return '🟠';
        case 'Media': return '🟡';
        default: return '⚪';
    }
}

function getPrioridadClass(prioridad) {
    if (!prioridad) return '';

    switch (prioridad.toLowerCase()) {
        case 'urgente': return 'priority-urgente';
        case 'alta': return 'priority-alta';
        default: return '';
    }
}

function formatearFecha(fecha) {
    if (!fecha) return 'N/A';

    const date = new Date(fecha);

    const dia = String(date.getDate()).padStart(2, '0');
    const mes = String(date.getMonth() + 1).padStart(2, '0');
    const año = date.getFullYear();
    const hora = String(date.getHours()).padStart(2, '0');
    const min = String(date.getMinutes()).padStart(2, '0');

    return `${dia}/${mes}/${año} ${hora}:${min}`;
}

// Cerrar modal al hacer clic fuera
document.addEventListener('DOMContentLoaded', function () {
    const modal = document.getElementById('cotizacionModal');

    if (modal) {
        modal.addEventListener('click', function (e) {
            if (e.target === modal) {
                window.closeCotizacionModal();
            }
        });
    }
});

console.log('✅ admin-cotizaciones.js cargado completamente');