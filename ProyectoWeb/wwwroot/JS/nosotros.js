// nosotros.js - Sistema completo con modal de detalles funcionando
(function () {
    'use strict';

    // Prevenir carga múltiple
    if (window.nosotrosSystemInitialized) {
        console.log('⚠️ nosotros.js ya está inicializado');
        return;
    }
    window.nosotrosSystemInitialized = true;

    console.log('📄 Cargando nosotros.js...');

    // ==========================================
    // CONFIGURACIÓN
    // ==========================================
    const API_CONFIG = {
        baseUrl: 'http://consultoriaintegralsc.somee.com',
        empleosEndpoint: '/api/Empleo/activos',
        whatsappNumber: '525659644304'
    };

    // ==========================================
    // VARIABLES GLOBALES
    // ==========================================
    let empleosCache = [];
    let currentJobDetail = null;

    // ==========================================
    // INICIALIZACIÓN CUANDO EL DOM ESTÉ LISTO
    // ==========================================
    function inicializar() {
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', function () {
                console.log('🚀 DOM cargado, inicializando nosotros.js...');
                setTimeout(() => {
                    initializeJobsSection();
                    setupModalListeners();
                }, 500);
            });
        } else {
            console.log('🚀 DOM ya está listo, inicializando...');
            setTimeout(() => {
                initializeJobsSection();
                setupModalListeners();
            }, 500);
        }
    }

    // ==========================================
    // CARGAR EMPLEOS DESDE API
    // ==========================================
    async function initializeJobsSection() {
        console.log('📋 Iniciando carga de empleos...');

        let container = document.getElementById('jobsGridContainer');
        const loading = document.getElementById('jobsLoading');

        if (!container) {
            console.error('❌ Container jobsGridContainer no encontrado');
            container = document.querySelector('.jobs-grid-container');
            if (container) {
                console.log('✅ Container encontrado por clase');
                container.id = 'jobsGridContainer';
            } else {
                console.error('❌ No se encontró container por clase tampoco');
                return;
            }
        }

        try {
            // Mostrar loading
            if (loading) loading.style.display = 'block';
            if (container) container.style.display = 'none';

            const url = `${API_CONFIG.baseUrl}${API_CONFIG.empleosEndpoint}`;
            console.log('🌐 Fetching desde:', url);

            const response = await fetch(url, {
                method: 'GET',
                headers: {
                    'Accept': 'application/json',
                    'Content-Type': 'application/json'
                },
                mode: 'cors'
            });

            console.log('📡 Response status:', response.status);

            if (!response.ok) {
                const errorText = await response.text();
                console.error('❌ Error response:', errorText);
                throw new Error(`HTTP ${response.status}: ${errorText}`);
            }

            const responseText = await response.text();
            let empleos;

            try {
                empleos = JSON.parse(responseText);
                console.log('✅ JSON parseado exitosamente');
            } catch (parseError) {
                console.error('❌ Error parseando JSON:', parseError);
                throw new Error('Respuesta del servidor no es JSON válido');
            }

            console.log('✅ Empleos recibidos:', empleos.length);

            if (empleos && empleos.length > 0) {
                empleosCache = empleos;
                window.empleosCache = empleos;
                console.log('✅ Cache actualizado con', empleos.length, 'empleos');
                renderizarEmpleos(empleos);
            } else {
                console.warn('⚠️ No se encontraron empleos activos');
                mostrarMensajeVacio(container);
            }

        } catch (error) {
            console.error('❌ Error cargando empleos:', error);
            mostrarError(container, error.message);
        } finally {
            if (loading) loading.style.display = 'none';
            if (container) {
                container.style.display = 'grid';
                container.style.visibility = 'visible';
                container.style.opacity = '1';
            }
        }
    }

    // ==========================================
    // RENDERIZAR EMPLEOS EN EL GRID
    // ==========================================
    function renderizarEmpleos(empleos) {
        const container = document.getElementById('jobsGridContainer');
        if (!container) {
            console.error('❌ Container no encontrado para renderizar');
            return;
        }

        if (!empleos || empleos.length === 0) {
            mostrarMensajeVacio(container);
            return;
        }

        try {
            const html = empleos.map(empleo => {
                try {
                    return crearTarjetaEmpleo(empleo);
                } catch (cardError) {
                    console.error('Error creando tarjeta:', cardError);
                    return '';
                }
            }).filter(h => h).join('');

            container.innerHTML = html;
            console.log(`✅ Renderizados ${empleos.length} empleos exitosamente`);

            const tarjetas = container.querySelectorAll('.job-card');
            console.log(`✅ Tarjetas en DOM: ${tarjetas.length}`);

        } catch (error) {
            console.error('❌ Error en renderizarEmpleos:', error);
            mostrarError(container, error.message);
        }
    }

    // ==========================================
    // CREAR HTML DE TARJETA DE EMPLEO
    // ==========================================
    function crearTarjetaEmpleo(empleo) {
        try {
            const requisitos = obtenerRequisitos(empleo.requisitos);
            const preview = requisitos.slice(0, 3);

            const titulo = sanitize(empleo.titulo || 'Sin título');
            const nivel = sanitize(empleo.nivel || 'No especificado');
            const area = empleo.area ? sanitize(empleo.area) : null;
            const modalidad = empleo.modalidad ? sanitize(empleo.modalidad) : null;
            const salario = empleo.salario ? sanitize(empleo.salario) : null;
            const descripcion = sanitize(empleo.descripcion || 'Sin descripción');
            const icono = empleo.icono || '💼';

            return `
                <div class="job-card" data-job-id="${empleo.id}">
                    <div class="job-card-header">
                        <div class="job-card-icon">${icono}</div>
                        <div class="job-card-info">
                            <h4 class="job-card-title">${titulo}</h4>
                            <span class="job-card-level">${nivel}</span>
                        </div>
                    </div>

                    ${area ? `
                        <div class="job-card-area">
                            🏢 ${area}
                        </div>
                    ` : ''}

                    <p class="job-card-description">${truncar(descripcion, 120)}</p>

                    <div class="job-card-meta">
                        ${modalidad ? `<span class="meta-badge modalidad">📍 ${modalidad}</span>` : ''}
                        ${salario ? `<span class="meta-badge salario">💰 ${salario}</span>` : ''}
                    </div>

                    ${preview.length > 0 ? `
                        <div class="job-card-requirements">
                            <div class="requirements-preview">
                                ${preview.map(r => `<span class="req-tag">${sanitize(r)}</span>`).join('')}
                                ${requisitos.length > 3 ? `<span class="req-more">+${requisitos.length - 3} más</span>` : ''}
                            </div>
                        </div>
                    ` : ''}

                    <div class="job-card-actions">
                        <button type="button" onclick="window.verDetalleEmpleo(${empleo.id})" class="btn-see-details">
                            👁️ Ver detalles
                        </button>
                        <button type="button" onclick="window.aplicarAEmpleo(${empleo.id})" class="btn-quick-apply">
                            ✅ Aplicar
                        </button>
                    </div>
                </div>
            `;
        } catch (error) {
            console.error('Error en crearTarjetaEmpleo:', error, empleo);
            return '';
        }
    }

    // ==========================================
    // VER DETALLE DE EMPLEO - MEJORADO CON LOGS
    // ==========================================
    function verDetalleEmpleo(id) {
        console.log('📄 Viendo detalle del empleo:', id);
        console.log('📄 Cache de empleos disponible:', empleosCache.length);

        const empleo = empleosCache.find(e => e.id === id);
        if (!empleo) {
            console.error('❌ Empleo no encontrado:', id);
            console.error('IDs disponibles:', empleosCache.map(e => e.id));
            alert('No se pudo cargar el detalle del empleo');
            return;
        }

        console.log('✅ Empleo encontrado:', empleo.titulo);
        console.log('✅ Datos completos del empleo:', empleo);

        // IMPORTANTE: Guardar referencia global
        currentJobDetail = empleo;
        window.currentJobDetail = empleo; // También en window para debugging

        console.log('✅ currentJobDetail actualizado:', currentJobDetail);

        const modal = document.getElementById('jobDetailModal');
        if (!modal) {
            console.error('❌ Modal jobDetailModal no encontrado en el DOM');
            alert('Error al abrir el modal de detalles. Por favor, recarga la página.');
            return;
        }

        console.log('✅ Modal encontrado, llenando datos...');

        // Llenar datos del modal
        try {
            llenarModalDetalle(empleo);
            console.log('✅ Datos del modal llenados');
        } catch (error) {
            console.error('❌ Error llenando modal:', error);
            alert('Error preparando la información del empleo');
            return;
        }

        // Mostrar modal con animación mejorada
        console.log('✅ Mostrando modal...');
        modal.style.display = 'flex';
        document.body.style.overflow = 'hidden';

        // Usar requestAnimationFrame para asegurar la animación
        requestAnimationFrame(() => {
            requestAnimationFrame(() => {
                modal.classList.add('show');
                console.log('✅ Modal mostrado con clase "show"');
                console.log('✅ Empleo disponible para WhatsApp:', currentJobDetail.titulo);
            });
        });
    }

    // ==========================================
    // LLENAR MODAL CON DATOS
    // ==========================================
    function llenarModalDetalle(empleo) {
        try {
            const requisitos = obtenerRequisitos(empleo.requisitos);

            // Actualizar campos
            setContent('jobDetailIcon', empleo.icono || '💼');
            setContent('jobDetailTitle', empleo.titulo);
            setContent('jobDetailLevel', empleo.nivel);
            setContent('jobDetailArea', empleo.area || 'No especificada');
            setHTML('jobDetailModality', `<i class="icon">🏢</i> ${empleo.modalidad || 'Por definir'}`);
            setHTML('jobDetailSalary', `<i class="icon">💰</i> ${empleo.salario || 'A convenir'}`);
            setContent('jobDetailDescriptionText', empleo.descripcion);

            const reqList = document.getElementById('jobDetailRequirements');
            if (reqList) {
                reqList.innerHTML = requisitos.length > 0
                    ? requisitos.map(r => `<li>${sanitize(r)}</li>`).join('')
                    : '<li>No especificados</li>';
            }

            console.log('✅ Modal de detalle llenado correctamente');
        } catch (error) {
            console.error('Error llenando modal:', error);
        }
    }

    // ==========================================
    // CERRAR MODAL DE DETALLE
    // ==========================================
    function closeJobDetail() {
        console.log('🚪 Cerrando modal de detalle...');
        const modal = document.getElementById('jobDetailModal');
        if (modal) {
            modal.classList.remove('show');
            document.body.style.overflow = 'auto';
            setTimeout(() => {
                modal.style.display = 'none';
                currentJobDetail = null;
                console.log('✅ Modal cerrado');
            }, 300);
        } else {
            console.error('❌ Modal no encontrado para cerrar');
        }
    }

    // ==========================================
    // APLICAR A EMPLEO
    // ==========================================
    function aplicarAEmpleo(id) {
        console.log('💼 Aplicando a empleo:', id);

        const empleo = empleosCache.find(e => e.id === id);
        if (!empleo) {
            console.error('Empleo no encontrado');
            alert('No se pudo encontrar la información del empleo');
            return;
        }

        // Cerrar modal de detalle si está abierto
        closeJobDetail();

        // Abrir modal de trabajo con datos precargados
        if (typeof window.openTrabajoModal === 'function') {
            window.openTrabajoModal({
                titulo: empleo.titulo,
                nivel: empleo.nivel,
                area: empleo.area
            });
        } else if (typeof openTrabajoModal === 'function') {
            openTrabajoModal({
                titulo: empleo.titulo,
                nivel: empleo.nivel,
                area: empleo.area
            });
        } else {
            console.error('openTrabajoModal no está definido');
            alert('Error al abrir el formulario de aplicación. Por favor, recarga la página.');
        }
    }

    // ==========================================
    // APLICAR DESDE MODAL DE DETALLE
    // ==========================================
    function aplicarAEmpleoDesdeModal() {
        if (currentJobDetail) {
            aplicarAEmpleo(currentJobDetail.id);
        } else {
            console.error('No hay empleo seleccionado');
            alert('Error: No se pudo identificar el empleo');
        }
    }

    // ==========================================
    // ENVIAR WHATSAPP - CORREGIDO
    // ==========================================
    function EnviarMensajeWhatsApp() {
        console.log('📱 Abriendo WhatsApp...');
        console.log('📱 Empleo actual:', currentJobDetail);

        if (!currentJobDetail) {
            console.warn('⚠️ No hay empleo seleccionado, mensaje genérico');
            enviarWhatsAppGeneral();
            return;
        }

        // Construir mensaje personalizado con toda la información
        const titulo = currentJobDetail.titulo || 'la posición disponible';
        const nivel = currentJobDetail.nivel || 'No especificado';
        const area = currentJobDetail.area || 'su empresa';
        const modalidad = currentJobDetail.modalidad || 'No especificada';
        const salario = currentJobDetail.salario || 'A convenir';

        const mensaje = `🙋‍♂️ Hola, buen día!

Me interesa aplicar a la posición de *${titulo}*

📋 *Detalles de mi interés:*
• Nivel: ${nivel}
• Área: ${area}
• Modalidad: ${modalidad}
• Expectativa salarial: ${salario}

Me gustaría obtener más información sobre:
✓ Requisitos específicos del puesto
✓ Proceso de selección
✓ Fecha de inicio
✓ Beneficios adicionales

Quedo atento a su respuesta. ¡Gracias!`;

        console.log('📱 Mensaje generado:', mensaje);
        abrirWhatsApp(mensaje);
    }

    function enviarWhatsAppGeneral() {
        const mensaje = `🙋‍♂️ Hola, buen día!

Me interesan las oportunidades laborales disponibles en su empresa.

¿Podrían proporcionarme información sobre:
✓ Posiciones abiertas actualmente
✓ Requisitos generales
✓ Proceso de aplicación

Quedo atento a su respuesta. ¡Gracias!`;

        abrirWhatsApp(mensaje);
    }

    function abrirWhatsApp(mensaje) {
        const url = `https://wa.me/${API_CONFIG.whatsappNumber}?text=${encodeURIComponent(mensaje)}`;
        console.log('📱 Abriendo URL:', url);
        window.open(url, '_blank');
    }

    // ==========================================
    // SETUP DE EVENT LISTENERS
    // ==========================================
    function setupModalListeners() {
        // Listener para Escape
        document.addEventListener('keydown', function (e) {
            if (e.key === 'Escape') {
                closeJobDetail();
            }
        });

        // Click en overlay
        const modal = document.getElementById('jobDetailModal');
        if (modal) {
            const overlay = modal.querySelector('.modal-overlay');
            if (overlay) {
                overlay.addEventListener('click', function (e) {
                    if (e.target === overlay) {
                        closeJobDetail();
                    }
                });
            }
        }
    }

    // ==========================================
    // UTILIDADES
    // ==========================================
    function obtenerRequisitos(requisitosStr) {
        if (!requisitosStr) return [];

        try {
            const parsed = JSON.parse(requisitosStr);
            if (Array.isArray(parsed)) return parsed.filter(r => r);
        } catch (e) {
            return requisitosStr.split(/[\n,]/).map(r => r.trim()).filter(r => r);
        }

        return [];
    }

    function sanitize(text) {
        if (!text) return '';
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    function truncar(text, max) {
        if (!text || text.length <= max) return text;
        return text.substring(0, max) + '...';
    }

    function setContent(id, content) {
        const el = document.getElementById(id);
        if (el) {
            el.textContent = content;
        } else {
            console.warn(`Elemento no encontrado: ${id}`);
        }
    }

    function setHTML(id, html) {
        const el = document.getElementById(id);
        if (el) {
            el.innerHTML = html;
        } else {
            console.warn(`Elemento no encontrado: ${id}`);
        }
    }

    function mostrarMensajeVacio(container) {
        if (!container) return;

        container.innerHTML = `
            <div style="text-align: center; padding: 40px; grid-column: 1/-1;">
                <h3>📋 No hay oportunidades disponibles actualmente</h3>
                <p>Envíanos tu CV para futuras oportunidades</p>
                <button onclick="openTrabajoModal()" style="margin-top: 20px; padding: 12px 24px; background: #007bff; color: white; border: none; border-radius: 8px; cursor: pointer; font-weight: 600;">
                    📩 Enviar CV
                </button>
            </div>
        `;
    }

    function mostrarError(container, mensaje) {
        if (!container) return;

        container.innerHTML = `
            <div style="text-align: center; padding: 40px; grid-column: 1/-1;">
                <h3>⚠️ Error al cargar empleos</h3>
                <p style="color: #666; margin: 20px 0;">${mensaje}</p>
                <button onclick="window.initializeJobsSection()" style="padding: 10px 20px; margin-top: 20px; cursor: pointer; background: #007bff; color: white; border: none; border-radius: 8px; font-weight: 600;">
                    🔄 Reintentar
                </button>
            </div>
        `;
    }

    // ==========================================
    // INTEROPERABILIDAD CON BLAZOR
    // ==========================================
    window.registerBlazorComponent = function (dotNetRef) {
        window.blazorComponentRef = dotNetRef;
        console.log('✅ Componente Blazor registrado en nosotros.js');
    };

    // ==========================================
    // EXPONER FUNCIONES GLOBALMENTE
    // ==========================================
    window.initializeJobsSection = initializeJobsSection;
    window.verDetalleEmpleo = verDetalleEmpleo;
    window.closeJobDetail = closeJobDetail;
    window.aplicarAEmpleo = aplicarAEmpleo;
    window.aplicarAEmpleoDesdeModal = aplicarAEmpleoDesdeModal;
    window.EnviarMensajeWhatsApp = EnviarMensajeWhatsApp;
    window.empleosCache = empleosCache;

    console.log('✅ Funciones expuestas globalmente:');
    console.log('  - initializeJobsSection');
    console.log('  - verDetalleEmpleo');
    console.log('  - closeJobDetail');
    console.log('  - aplicarAEmpleo');
    console.log('  - aplicarAEmpleoDesdeModal');
    console.log('  - EnviarMensajeWhatsApp');

    // ==========================================
    // INICIALIZAR
    // ==========================================
    inicializar();

    console.log('✅ nosotros.js cargado correctamente');

})();