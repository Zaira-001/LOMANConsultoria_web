// admin-users.js - Gestión completa de administradores con diseño mejorado
console.log('📋 Cargando módulo de gestión de administradores...');

console.log('📋 admin-users.js INICIANDO CARGA...');
console.log('📋 Timestamp:', new Date().toISOString());

// Prevenir múltiples inicializaciones
if (window.adminUsersModuleLoaded) {
    console.log('⚠️ Módulo de administradores ya cargado');
} else {
    window.adminUsersModuleLoaded = true;

    // Configuración de API
    const ADMIN_API_URL = 'https://lomanconsultoria-web.onrender.com/api/Admin';

    // Estado del módulo
    let adminsData = [];
    let currentEditingAdminId = null;
    let mostrarInactivos = false; // Nueva variable para controlar visibilidad


    // Función helper para obtener el usuario actual
    function getCurrentUsername() {
        try {
            if (window.adminSession && window.adminSession.username) {
                return window.adminSession.username;
            }

            const sessionData = localStorage.getItem('adminSession');
            if (sessionData) {
                const parsed = JSON.parse(sessionData);
                if (parsed && parsed.username) {
                    return parsed.username;
                }
            }

            const sessionData2 = sessionStorage.getItem('adminSession');
            if (sessionData2) {
                const parsed = JSON.parse(sessionData2);
                if (parsed && parsed.username) {
                    return parsed.username;
                }
            }

            console.warn('⚠️ No se pudo obtener usuario actual, usando "admin"');
            return 'admin';
        } catch (error) {
            console.error('Error obteniendo usuario actual:', error);
            return 'admin';
        }
    }

    // ============================================
    // FUNCIONES PRINCIPALES DE GESTIÓN
    // ============================================

    async function loadAdminsList() {
        console.log('📥 Cargando lista de administradores...');

        const container = document.getElementById('adminsListContainer');
        if (!container) {
            console.error('Container adminsListContainer no encontrado');
            return;
        }

        try {
            // Mostrar loading moderno
            container.innerHTML = `
                <div style="display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 80px 20px; min-height: 400px;">
                    <div style="width: 60px; height: 60px; border: 4px solid #f0f0f0; border-top: 4px solid #007bff; border-radius: 50%; animation: spin 1s linear infinite;"></div>
                    <p style="margin-top: 20px; color: #666; font-size: 16px;">Cargando administradores...</p>
                </div>
            `;

            const response = await fetch(ADMIN_API_URL);

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            adminsData = await response.json();
            console.log(`✅ ${adminsData.length} administradores cargados`);

            renderAdminsList(adminsData);

        } catch (error) {
            console.error('❌ Error cargando administradores:', error);
            container.innerHTML = `
                <div style="display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 60px 20px; text-align: center;">
                    <div style="width: 80px; height: 80px; background: linear-gradient(135deg, #ff6b6b 0%, #ee5a6f 100%); border-radius: 50%; display: flex; align-items: center; justify-content: center; margin-bottom: 24px; box-shadow: 0 8px 16px rgba(238, 90, 111, 0.3);">
                        <span style="font-size: 40px; color: white;">⚠️</span>
                    </div>
                    <h3 style="color: #2c3e50; margin-bottom: 12px; font-size: 24px; font-weight: 600;">Error al cargar</h3>
                    <p style="color: #7f8c8d; margin-bottom: 30px; max-width: 400px; line-height: 1.6;">${error.message}</p>
                    <button onclick="loadAdminsList()" style="background: linear-gradient(135deg, #007bff 0%, #0056b3 100%); color: white; border: none; padding: 12px 32px; border-radius: 8px; font-size: 15px; font-weight: 500; cursor: pointer; box-shadow: 0 4px 12px rgba(0, 123, 255, 0.3); transition: all 0.3s ease;">
                        🔄 Reintentar
                    </button>
                </div>
            `;
        }
    }

    function renderAdminsList(admins) {
        const container = document.getElementById('adminsListContainer');
        if (!container) return;

        // FILTRAR: Solo mostrar admins activos (a menos que se active el toggle)
        const adminsVisibles = mostrarInactivos ? admins : admins.filter(a => a.activo);

        if (admins.length === 0) {
            container.innerHTML = `
                <div style="display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 80px 20px; text-align: center;">
                    <div style="width: 120px; height: 120px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); border-radius: 24px; display: flex; align-items: center; justify-content: center; margin-bottom: 30px; box-shadow: 0 12px 24px rgba(102, 126, 234, 0.3);">
                        <span style="font-size: 60px; color: white;">👥</span>
                    </div>
                    <h3 style="color: #2c3e50; margin-bottom: 12px; font-size: 26px; font-weight: 600;">No hay administradores</h3>
                    <p style="color: #7f8c8d; margin-bottom: 35px; font-size: 16px; max-width: 450px; line-height: 1.6;">Crea el primer administrador del sistema para comenzar a gestionar el acceso</p>
                    <button onclick="showCreateAdminForm()" style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; border: none; padding: 14px 36px; border-radius: 10px; font-size: 16px; font-weight: 600; cursor: pointer; box-shadow: 0 6px 16px rgba(102, 126, 234, 0.4); transition: all 0.3s ease; display: flex; align-items: center; gap: 10px;">
                        <span style="font-size: 20px;">➕</span>
                        Crear Primer Administrador
                    </button>
                </div>
            `;
            return;
        }

        const conteoActivos = admins.filter(a => a.activo).length;
        const conteoInactivos = admins.filter(a => !a.activo).length;

        let html = `
            <div style="margin-bottom: 30px;">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 25px;">
                    <div>
                        <h3 style="margin: 0 0 8px 0; font-size: 28px; font-weight: 700; color: #2c3e50; display: flex; align-items: center; gap: 12px;">
                            <span style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; width: 42px; height: 42px; border-radius: 10px; display: flex; align-items: center; justify-content: center; font-size: 22px;">👥</span>
                            Administradores del Sistema
                        </h3>
                        <p style="margin: 0; color: #7f8c8d; font-size: 14px;">Gestiona los usuarios con acceso al panel de administración</p>
                    </div>
                    <button onclick="showCreateAdminForm()" style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; border: none; padding: 12px 28px; border-radius: 10px; font-size: 15px; font-weight: 600; cursor: pointer; box-shadow: 0 4px 12px rgba(102, 126, 234, 0.35); transition: all 0.3s ease; display: flex; align-items: center; gap: 8px;">
                        <span style="font-size: 18px;">➕</span>
                        Agregar Administrador
                    </button>
                </div>
                
                <!-- Toggle para mostrar inactivos -->
                ${conteoInactivos > 0 ? `
                <div style="margin-bottom: 20px; padding: 12px 20px; background: #f8f9fa; border-radius: 10px; display: flex; align-items: center; justify-content: space-between;">
                    <div style="display: flex; align-items: center; gap: 12px;">
                        <span style="font-size: 20px;">👁️</span>
                        <span style="color: #495057; font-weight: 500;">Mostrar administradores ocultos (${conteoInactivos})</span>
                    </div>
                    <label style="position: relative; display: inline-block; width: 54px; height: 28px; cursor: pointer;">
                        <input type="checkbox" 
                               id="toggleInactivos" 
                               ${mostrarInactivos ? 'checked' : ''}
                               onchange="toggleMostrarInactivos()"
                               style="opacity: 0; width: 0; height: 0;">
                        <span style="position: absolute; cursor: pointer; top: 0; left: 0; right: 0; bottom: 0; background-color: #ccc; transition: .4s; border-radius: 28px;"></span>
                        <span style="position: absolute; cursor: pointer; content: ''; height: 20px; width: 20px; left: 4px; bottom: 4px; background-color: white; transition: .4s; border-radius: 50%; ${mostrarInactivos ? 'transform: translateX(26px);' : ''}"></span>
                    </label>
                </div>
                ` : ''}
                
                <div style="background: white; border-radius: 16px; box-shadow: 0 2px 12px rgba(0,0,0,0.08); overflow: hidden;">
        `;

        if (adminsVisibles.length === 0) {
            html += `
                <div style="padding: 60px 20px; text-align: center;">
                    <div style="font-size: 48px; margin-bottom: 16px;">🔍</div>
                    <h3 style="color: #6c757d; margin: 0 0 8px 0; font-size: 20px;">No hay administradores visibles</h3>
                    <p style="color: #adb5bd; font-size: 14px;">Todos los administradores están ocultos. Activa el toggle arriba para verlos.</p>
                </div>
            `;
        } else {
            html += `
                    <div style="overflow-x: auto;">
                        <table style="width: 100%; border-collapse: collapse;">
                            <thead>
                                <tr style="background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);">
                                    <th style="padding: 18px 24px; text-align: left; font-weight: 600; font-size: 13px; color: #495057; text-transform: uppercase; letter-spacing: 0.5px; border-bottom: 2px solid #dee2e6;">Usuario</th>
                                    <th style="padding: 18px 24px; text-align: left; font-weight: 600; font-size: 13px; color: #495057; text-transform: uppercase; letter-spacing: 0.5px; border-bottom: 2px solid #dee2e6;">Nombre Completo</th>
                                    <th style="padding: 18px 24px; text-align: left; font-weight: 600; font-size: 13px; color: #495057; text-transform: uppercase; letter-spacing: 0.5px; border-bottom: 2px solid #dee2e6;">Email</th>
                                    <th style="padding: 18px 24px; text-align: center; font-weight: 600; font-size: 13px; color: #495057; text-transform: uppercase; letter-spacing: 0.5px; border-bottom: 2px solid #dee2e6;">Rol</th>
                                    <th style="padding: 18px 24px; text-align: center; font-weight: 600; font-size: 13px; color: #495057; text-transform: uppercase; letter-spacing: 0.5px; border-bottom: 2px solid #dee2e6;">Visibilidad</th>
                                    <th style="padding: 18px 24px; text-align: left; font-weight: 600; font-size: 13px; color: #495057; text-transform: uppercase; letter-spacing: 0.5px; border-bottom: 2px solid #dee2e6;">Último Login</th>
                                    <th style="padding: 18px 24px; text-align: center; font-weight: 600; font-size: 13px; color: #495057; text-transform: uppercase; letter-spacing: 0.5px; border-bottom: 2px solid #dee2e6;">Acciones</th>
                                </tr>
                            </thead>
                            <tbody>
            `;

            adminsVisibles.forEach((admin, index) => {
                if (!admin._originalPasswordHash) {
                    admin._originalPasswordHash = admin.passwordHash;
                }

                const visibilidadBg = admin.activo ? 'linear-gradient(135deg, #10b981 0%, #059669 100%)' : 'linear-gradient(135deg, #6c757d 0%, #495057 100%)';
                const visibilidadText = admin.activo ? 'Visible' : 'Oculto';
                const lastLogin = admin.ultimoLogin ?
                    new Date(admin.ultimoLogin).toLocaleString('es-ES', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                    }) : 'Nunca';

                const rowBg = index % 2 === 0 ? '#ffffff' : '#f8f9fa';
                const opacity = admin.activo ? '1' : '0.6';

                html += `
                    <tr style="background: ${rowBg}; opacity: ${opacity}; transition: all 0.2s ease;">
                        <td style="padding: 20px 24px; border-bottom: 1px solid #e9ecef;">
                            <div style="display: flex; align-items: center; gap: 12px;">
                                <div style="width: 40px; height: 40px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); border-radius: 10px; display: flex; align-items: center; justify-content: center; color: white; font-weight: 600; font-size: 16px;">
                                    ${escapeHtml(admin.username.charAt(0).toUpperCase())}
                                </div>
                                <strong style="color: #2c3e50; font-size: 15px;">${escapeHtml(admin.username)}</strong>
                            </div>
                        </td>
                        <td style="padding: 20px 24px; color: #495057; font-size: 14px; border-bottom: 1px solid #e9ecef;">${escapeHtml(admin.nombreCompleto || '-')}</td>
                        <td style="padding: 20px 24px; color: #6c757d; font-size: 14px; border-bottom: 1px solid #e9ecef;">
                            <div style="display: flex; align-items: center; gap: 8px;">
                                <span style="font-size: 16px;">📧</span>
                                ${escapeHtml(admin.email)}
                            </div>
                        </td>
                        <td style="padding: 20px 24px; text-align: center; border-bottom: 1px solid #e9ecef;">
                            <span style="background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%); color: white; padding: 6px 14px; border-radius: 20px; font-size: 12px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; display: inline-block;">
                                ${escapeHtml(admin.rol)}
                            </span>
                        </td>
                        <td style="padding: 20px 24px; text-align: center; border-bottom: 1px solid #e9ecef;">
                            <span style="background: ${visibilidadBg}; color: white; padding: 6px 16px; border-radius: 20px; font-size: 12px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; display: inline-block; box-shadow: 0 2px 8px ${admin.activo ? 'rgba(16, 185, 129, 0.3)' : 'rgba(108, 117, 125, 0.3)'};">
                                ${admin.activo ? '👁️' : '🙈'} ${visibilidadText}
                            </span>
                        </td>
                        <td style="padding: 20px 24px; color: #6c757d; font-size: 13px; border-bottom: 1px solid #e9ecef;">
                            <div style="display: flex; align-items: center; gap: 6px;">
                                <span>🕒</span>
                                ${lastLogin}
                            </div>
                        </td>
                        <td style="padding: 20px 24px; text-align: center; border-bottom: 1px solid #e9ecef;">
                            <div style="display: flex; gap: 8px; justify-content: center;">
                                <button onclick="showEditAdminForm(${admin.id})" title="Editar" style="background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%); color: white; border: none; width: 38px; height: 38px; border-radius: 8px; font-size: 16px; cursor: pointer; transition: all 0.3s ease; box-shadow: 0 2px 6px rgba(59, 130, 246, 0.3); display: flex; align-items: center; justify-content: center;">
                                    ✏️
                                </button>
                                <button onclick="confirmToggleVisibilidad(${admin.id})" title="${admin.activo ? 'Ocultar' : 'Mostrar'}" style="background: ${admin.activo ? 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)' : 'linear-gradient(135deg, #10b981 0%, #059669 100%)'}; color: white; border: none; width: 38px; height: 38px; border-radius: 8px; font-size: 16px; cursor: pointer; transition: all 0.3s ease; box-shadow: 0 2px 6px ${admin.activo ? 'rgba(245, 158, 11, 0.3)' : 'rgba(16, 185, 129, 0.3)'}; display: flex; align-items: center; justify-content: center;">
                                    ${admin.activo ? '🙈' : '👁️'}
                                </button>
                            </div>
                        </td>
                    </tr>
                `;
            });

            html += `
                            </tbody>
                        </table>
                    </div>
            `;
        }

        html += `
                </div>
                
                <div style="margin-top: 20px; padding: 16px; background: linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%); border-radius: 12px; border-left: 4px solid #3b82f6;">
                    <div style="display: flex; align-items: center; gap: 12px;">
                        <span style="font-size: 24px;">ℹ️</span>
                        <div>
                            <p style="margin: 0; color: #1e40af; font-weight: 600; font-size: 14px;">Total de administradores: ${admins.length}</p>
                            <p style="margin: 4px 0 0 0; color: #3b82f6; font-size: 13px;">Visibles: ${conteoActivos} | Ocultos: ${conteoInactivos}</p>
                        </div>
                    </div>
                </div>
            </div>
        `;

        container.innerHTML = html;

        // Aplicar estilos del toggle checkbox
        const style = document.createElement('style');
        style.textContent = `
            #toggleInactivos:checked + span {
                background-color: #667eea !important;
            }
            #toggleInactivos:checked + span + span {
                transform: translateX(26px);
            }
        `;
        document.head.appendChild(style);
    }

    // ============================================
    // NUEVA FUNCIÓN PARA TOGGLE DE VISIBILIDAD
    // ============================================
    window.toggleMostrarInactivos = function () {
        mostrarInactivos = !mostrarInactivos;
        console.log(`👁️ Mostrar inactivos: ${mostrarInactivos}`);
        renderAdminsList(adminsData);
    };

    // ============================================
    // FUNCIÓN PARA CONFIRMAR CAMBIO DE VISIBILIDAD
    // ============================================
    function confirmToggleVisibilidad(adminId) {
        const admin = adminsData.find(a => a.id === adminId);
        if (!admin) return;

        const action = admin.activo ? 'ocultar' : 'mostrar';
        const title = `${action.charAt(0).toUpperCase() + action.slice(1)} Administrador`;
        const message = admin.activo
            ? `¿Estás seguro de que deseas OCULTAR al usuario "${admin.username}"?\n\n⚠️ El administrador quedará oculto en la interfaz pero permanecerá en la base de datos. No podrá iniciar sesión hasta que lo vuelvas a mostrar.`
            : `¿Deseas MOSTRAR nuevamente al usuario "${admin.username}"?\n\nEl administrador volverá a ser visible y podrá iniciar sesión normalmente.`;

        if (window.showConfirmModal) {
            window.showConfirmModal(
                title,
                message,
                () => toggleVisibilidadAdmin(adminId),
                `Sí, ${action}`,
                'Cancelar',
                admin.activo ? 'warning' : 'success'
            );
        } else {
            if (confirm(message)) {
                toggleVisibilidadAdmin(adminId);
            }
        }
    }

    // ============================================
    // FUNCIÓN PARA CAMBIAR VISIBILIDAD
    // ============================================
    async function toggleVisibilidadAdmin(adminId) {
        try {
            const admin = adminsData.find(a => a.id === adminId);
            if (!admin) {
                showError('Administrador no encontrado');
                return;
            }

            const nuevoEstado = !admin.activo;
            console.log(`🔄 Cambiando visibilidad de admin ${adminId} a: ${nuevoEstado ? 'Visible' : 'Oculto'}`);

            showLoading(true);

            const response = await fetch(`${ADMIN_API_URL}/${adminId}/estado`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                },
                body: JSON.stringify({
                    activo: nuevoEstado
                })
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Error al cambiar visibilidad');
            }

            const result = await response.json();
            console.log('✅ Visibilidad actualizada:', result);

            // Actualizar datos locales
            admin.activo = nuevoEstado;

            showSuccessMessage(
                nuevoEstado
                    ? `Administrador ahora es VISIBLE y puede iniciar sesión`
                    : `Administrador ahora está OCULTO. Permanece en la base de datos pero no puede iniciar sesión`
            );

            // Recargar lista
            await loadAdminsList();

        } catch (error) {
            console.error('❌ Error cambiando visibilidad:', error);
            showError(`Error: ${error.message}`);
        } finally {
            showLoading(false);
        }
    }

    function showCreateAdminForm() {
        console.log('📝 Mostrando formulario de creación...');
        currentEditingAdminId = null;

        const container = document.getElementById('adminsListContainer');
        if (!container) return;

        container.innerHTML = `
            <div style="max-width: 900px; margin: 0 auto;">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 35px;">
                    <div>
                        <h3 style="margin: 0 0 8px 0; font-size: 28px; font-weight: 700; color: #2c3e50; display: flex; align-items: center; gap: 12px;">
                            <span style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; width: 42px; height: 42px; border-radius: 10px; display: flex; align-items: center; justify-content: center; font-size: 22px;">➕</span>
                            Crear Nuevo Administrador
                        </h3>
                        <p style="margin: 0; color: #7f8c8d; font-size: 14px;">Completa el formulario para agregar un nuevo administrador al sistema</p>
                    </div>
                    <button onclick="loadAdminsList()" style="background: white; color: #6c757d; border: 2px solid #dee2e6; padding: 10px 24px; border-radius: 8px; font-size: 14px; font-weight: 500; cursor: pointer; transition: all 0.3s ease; display: flex; align-items: center; gap: 8px;">
                        ← Volver
                    </button>
                </div>

                <form id="adminUserForm" autocomplete="off" style="background: white; padding: 40px; border-radius: 16px; box-shadow: 0 2px 16px rgba(0,0,0,0.08);">
                    
                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 24px; margin-bottom: 24px;">
                        <div>
                            <label style="display: block; margin-bottom: 8px; font-weight: 600; color: #2c3e50; font-size: 14px;">
                                Usuario <span style="color: #ef4444;">*</span>
                            </label>
                            <input type="text" 
                                   id="adminUsername" 
                                   name="new-admin-username"
                                   required 
                                   placeholder="Ej: juan.perez"
                                   pattern="[a-zA-Z0-9_]+"
                                   autocomplete="off"
                                   style="width: 100%; padding: 12px 16px; border: 2px solid #e9ecef; border-radius: 10px; font-size: 15px; transition: all 0.3s ease; box-sizing: border-box;">
                            <small style="color: #6c757d; font-size: 12px; display: block; margin-top: 6px;">Solo letras, números y guiones bajos</small>
                        </div>

                        <div>
                            <label style="display: block; margin-bottom: 8px; font-weight: 600; color: #2c3e50; font-size: 14px;">
                                Email <span style="color: #ef4444;">*</span>
                            </label>
                            <input type="email" 
                                   id="adminEmail" 
                                   name="new-admin-email"
                                   required 
                                   placeholder="correo@ejemplo.com"
                                   autocomplete="off"
                                   style="width: 100%; padding: 12px 16px; border: 2px solid #e9ecef; border-radius: 10px; font-size: 15px; transition: all 0.3s ease; box-sizing: border-box;">
                        </div>
                    </div>

                    <div style="margin-bottom: 24px;">
                        <label style="display: block; margin-bottom: 8px; font-weight: 600; color: #2c3e50; font-size: 14px;">
                            Nombre Completo
                        </label>
                        <input type="text" 
                               id="adminNombreCompleto" 
                               name="new-admin-fullname"
                               placeholder="Ej: Juan Pérez López"
                               autocomplete="off"
                               style="width: 100%; padding: 12px 16px; border: 2px solid #e9ecef; border-radius: 10px; font-size: 15px; transition: all 0.3s ease; box-sizing: border-box;">
                    </div>

                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 24px; margin-bottom: 30px;">
                        <div>
                            <label style="display: block; margin-bottom: 8px; font-weight: 600; color: #2c3e50; font-size: 14px;">
                                Contraseña <span style="color: #ef4444;">*</span>
                            </label>
                            <input type="password" 
                                   id="adminPassword" 
                                   name="new-admin-password"
                                   required 
                                   placeholder="Mínimo 8 caracteres"
                                   autocomplete="new-password"
                                   style="width: 100%; padding: 12px 16px; border: 2px solid #e9ecef; border-radius: 10px; font-size: 15px; transition: all 0.3s ease; box-sizing: border-box;">
                            <div id="passwordHelp" style="margin-top: 10px; padding: 10px; background: #f8f9fa; border-radius: 8px; font-size: 12px; line-height: 1.6;"></div>
                        </div>

                        <div>
                            <label style="display: block; margin-bottom: 8px; font-weight: 600; color: #2c3e50; font-size: 14px;">
                                Confirmar Contraseña <span style="color: #ef4444;">*</span>
                            </label>
                            <input type="password" 
                                   id="adminPasswordConfirm" 
                                   name="new-admin-password-confirm"
                                   required 
                                   placeholder="Repite la contraseña"
                                   autocomplete="new-password"
                                   style="width: 100%; padding: 12px 16px; border: 2px solid #e9ecef; border-radius: 10px; font-size: 15px; transition: all 0.3s ease; box-sizing: border-box;">
                        </div>
                    </div>

                    <div style="display: flex; gap: 12px; justify-content: flex-end; padding-top: 20px; border-top: 2px solid #e9ecef;">
                        <button type="button" onclick="loadAdminsList()" style="background: white; color: #6c757d; border: 2px solid #dee2e6; padding: 12px 28px; border-radius: 10px; font-size: 15px; font-weight: 500; cursor: pointer; transition: all 0.3s ease;">
                            Cancelar
                        </button>
                        <button type="submit" style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; border: none; padding: 12px 32px; border-radius: 10px; font-size: 15px; font-weight: 600; cursor: pointer; box-shadow: 0 4px 12px rgba(102, 126, 234, 0.35); transition: all 0.3s ease; display: flex; align-items: center; gap: 8px;">
                            <span>✅</span>
                            Crear Administrador
                        </button>
                    </div>
                </form>
            </div>
        `;

        setupPasswordValidation();

        const form = document.getElementById('adminUserForm');
        form.addEventListener('submit', handleCreateAdmin);

        setTimeout(() => {
            const inputs = ['adminUsername', 'adminEmail', 'adminPassword', 'adminPasswordConfirm', 'adminNombreCompleto'];
            inputs.forEach(id => {
                const input = document.getElementById(id);
                if (input) input.value = '';
            });
        }, 100);

        setTimeout(() => {
            const allInputs = form.querySelectorAll('input');
            allInputs.forEach(input => {
                input.addEventListener('focus', function (e) {
                    if (this.value && this.value.length > 0) {
                        this.value = '';
                    }
                }, { once: true });
            });
        }, 200);
    }

    function showEditAdminForm(adminId) {
        console.log('✏️ Mostrando formulario de edición para admin:', adminId);
        currentEditingAdminId = adminId;

        const admin = adminsData.find(a => a.id === adminId);
        if (!admin) {
            showError('Administrador no encontrado');
            return;
        }

        const container = document.getElementById('adminsListContainer');
        if (!container) return;

        container.innerHTML = `
            <div style="max-width: 900px; margin: 0 auto;">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 35px;">
                    <div>
                        <h3 style="margin: 0 0 8px 0; font-size: 28px; font-weight: 700; color: #2c3e50; display: flex; align-items: center; gap: 12px;">
                            <span style="background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%); color: white; width: 42px; height: 42px; border-radius: 10px; display: flex; align-items: center; justify-content: center; font-size: 22px;">✏️</span>
                            Editar Administrador
                        </h3>
                        <p style="margin: 0; color: #7f8c8d; font-size: 14px;">Modifica la información del administrador ${escapeHtml(admin.username)}</p>
                    </div>
                    <button onclick="loadAdminsList()" style="background: white; color: #6c757d; border: 2px solid #dee2e6; padding: 10px 24px; border-radius: 8px; font-size: 14px; font-weight: 500; cursor: pointer; transition: all 0.3s ease; display: flex; align-items: center; gap: 8px;">
                        ← Volver
                    </button>
                </div>

                <form id="adminEditForm" style="background: white; padding: 40px; border-radius: 16px; box-shadow: 0 2px 16px rgba(0,0,0,0.08);">
                    
                    <div style="margin-bottom: 30px; padding: 18px; background: linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%); border-radius: 12px; border-left: 4px solid #3b82f6;">
                        <div style="display: flex; align-items: center; gap: 12px;">
                            <span style="font-size: 24px;">ℹ️</span>
                            <p style="margin: 0; color: #1e40af; font-weight: 600;">
                                Editando usuario: <strong>${escapeHtml(admin.username)}</strong>
                            </p>
                        </div>
                    </div>

                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 24px; margin-bottom: 24px;">
                        <div>
                            <label style="display: block; margin-bottom: 8px; font-weight: 600; color: #2c3e50; font-size: 14px;">
                                Usuario <span style="color: #ef4444;">*</span>
                            </label>
                            <input type="text" 
                                   id="editAdminUsername" 
                                   required 
                                   value="${escapeHtml(admin.username)}"
                                   pattern="[a-zA-Z0-9_]+"
                                   style="width: 100%; padding: 12px 16px; border: 2px solid #e9ecef; border-radius: 10px; font-size: 15px; transition: all 0.3s ease; box-sizing: border-box;">
                        </div>

                        <div>
                            <label style="display: block; margin-bottom: 8px; font-weight: 600; color: #2c3e50; font-size: 14px;">
                                Email <span style="color: #ef4444;">*</span>
                            </label>
                            <input type="email" 
                                   id="editAdminEmail" 
                                   required 
                                   value="${escapeHtml(admin.email)}"
                                   style="width: 100%; padding: 12px 16px; border: 2px solid #e9ecef; border-radius: 10px; font-size: 15px; transition: all 0.3s ease; box-sizing: border-box;">
                        </div>
                    </div>

                    <div style="margin-bottom: 24px;">
                        <label style="display: block; margin-bottom: 8px; font-weight: 600; color: #2c3e50; font-size: 14px;">
                            Nombre Completo
                        </label>
                        <input type="text" 
                               id="editAdminNombreCompleto" 
                               value="${escapeHtml(admin.nombreCompleto || '')}"
                               style="width: 100%; padding: 12px 16px; border: 2px solid #e9ecef; border-radius: 10px; font-size: 15px; transition: all 0.3s ease; box-sizing: border-box;">
                    </div>

                    <div style="margin-bottom: 30px; padding: 16px; background: #f8f9fa; border-radius: 10px;">
                        <label style="display: flex; align-items: center; gap: 10px; cursor: pointer;">
                            <input type="checkbox" id="editAdminActivo" ${admin.activo ? 'checked' : ''} style="width: 20px; height: 20px; cursor: pointer;">
                            <span style="font-weight: 600; color: #2c3e50; font-size: 14px;">Administrador activo</span>
                        </label>
                        <small style="color: #6c757d; font-size: 12px; display: block; margin-top: 6px; margin-left: 30px;">Los administradores inactivos no pueden iniciar sesión en el sistema</small>
                    </div>

                    <hr style="margin: 35px 0; border: none; border-top: 2px solid #e9ecef;">

                    <div style="margin-bottom: 25px;">
                        <h4 style="margin: 0 0 8px 0; font-size: 20px; font-weight: 600; color: #2c3e50; display: flex; align-items: center; gap: 10px;">
                            <span style="font-size: 24px;">🔐</span>
                            Cambiar Contraseña
                        </h4>
                        <p style="color: #6c757d; font-size: 13px; margin: 0;">
                            Deja estos campos en blanco si no deseas modificar la contraseña actual
                        </p>
                    </div>

                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 24px; margin-bottom: 30px;">
                        <div>
                            <label style="display: block; margin-bottom: 8px; font-weight: 600; color: #2c3e50; font-size: 14px;">
                                Nueva Contraseña
                            </label>
                            <input type="password" 
                                   id="editAdminPassword" 
                                   placeholder="Opcional - Solo si deseas cambiarla"
                                   style="width: 100%; padding: 12px 16px; border: 2px solid #e9ecef; border-radius: 10px; font-size: 15px; transition: all 0.3s ease; box-sizing: border-box;">
                        </div>

                        <div>
                            <label style="display: block; margin-bottom: 8px; font-weight: 600; color: #2c3e50; font-size: 14px;">
                                Confirmar Nueva Contraseña
                            </label>
                            <input type="password" 
                                   id="editAdminPasswordConfirm" 
                                   placeholder="Repite la nueva contraseña"
                                   style="width: 100%; padding: 12px 16px; border: 2px solid #e9ecef; border-radius: 10px; font-size: 15px; transition: all 0.3s ease; box-sizing: border-box;">
                        </div>
                    </div>

                    <div style="display: flex; gap: 12px; justify-content: flex-end; padding-top: 20px; border-top: 2px solid #e9ecef;">
                        <button type="button" onclick="loadAdminsList()" style="background: white; color: #6c757d; border: 2px solid #dee2e6; padding: 12px 28px; border-radius: 10px; font-size: 15px; font-weight: 500; cursor: pointer; transition: all 0.3s ease;">
                            Cancelar
                        </button>
                        <button type="submit" style="background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%); color: white; border: none; padding: 12px 32px; border-radius: 10px; font-size: 15px; font-weight: 600; cursor: pointer; box-shadow: 0 4px 12px rgba(59, 130, 246, 0.35); transition: all 0.3s ease; display: flex; align-items: center; gap: 8px;">
                            <span>💾</span>
                            Guardar Cambios
                        </button>
                    </div>
                </form>
            </div>
        `;

        const form = document.getElementById('adminEditForm');
        form.addEventListener('submit', handleEditAdmin);
    }

    // ============================================
    // MANEJADORES DE FORMULARIOS
    // ============================================
    async function handleCreateAdmin(e) {
        e.preventDefault();
        console.log('📤 Creando nuevo administrador...');

        const username = document.getElementById('adminUsername').value.trim();
        const email = document.getElementById('adminEmail').value.trim();
        const nombreCompleto = document.getElementById('adminNombreCompleto').value.trim();
        const password = document.getElementById('adminPassword').value;
        const passwordConfirm = document.getElementById('adminPasswordConfirm').value;

        if (password !== passwordConfirm) {
            showError('Las contraseñas no coinciden');
            return;
        }

        if (!validatePassword(password)) {
            showError('La contraseña no cumple con los requisitos de seguridad');
            return;
        }

        const currentUser = getCurrentUsername();
        console.log('👤 Usuario actual:', currentUser);

        const adminData = {
            username: username,
            email: email,
            password: password,
            nombreCompleto: nombreCompleto || null
        };

        console.log('📦 Datos a enviar:', {
            ...adminData,
            password: '***OCULTO***'
        });

        try {
            showLoading(true);

            const response = await fetch(`${ADMIN_API_URL}/crear`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                },
                body: JSON.stringify(adminData)
            });

            const responseText = await response.text();
            let result;
            try {
                result = JSON.parse(responseText);
            } catch (parseError) {
                result = { message: responseText };
            }

            if (response.ok) {
                const emailEnviado = result.emailEnviado || false;

                if (emailEnviado) {
                    showSuccessMessage(`✅ Administrador creado exitosamente\n\n📧 Se han enviado las credenciales al correo:\n${email}\n\nEl nuevo administrador recibirá un email con:\n• Usuario de acceso\n• Contraseña temporal\n• Instrucciones de primer inicio de sesión`);
                } else {
                    showSuccessMessage('✅ Administrador creado exitosamente\n\n⚠️ Nota: No se pudo enviar el email automático con las credenciales.\nDeberás compartir las credenciales manualmente.');
                }

                setTimeout(() => loadAdminsList(), 2500);
            } else {
                let errorMessage = 'Error al crear administrador';

                if (result.message) {
                    errorMessage = result.message;
                } else if (result.errors) {
                    const errorMessages = [];
                    Object.keys(result.errors).forEach(field => {
                        const fieldErrors = result.errors[field];
                        if (Array.isArray(fieldErrors)) {
                            fieldErrors.forEach(err => {
                                errorMessages.push(`${field}: ${err}`);
                            });
                        }
                    });
                    errorMessage = errorMessages.join('\n');
                } else if (result.title) {
                    errorMessage = result.title;
                }

                console.error('❌ Error del servidor:', errorMessage);
                throw new Error(errorMessage);
            }

        } catch (error) {
            console.error('Error:', error);
            showError(error.message);
        } finally {
            showLoading(false);
        }
    }

    async function handleEditAdmin(e) {
        e.preventDefault();
        console.log('📤 Actualizando administrador...');

        if (!currentEditingAdminId) {
            showError('ID de administrador no definido');
            return;
        }

        const username = document.getElementById('editAdminUsername').value.trim();
        const email = document.getElementById('editAdminEmail').value.trim();
        const nombreCompleto = document.getElementById('editAdminNombreCompleto').value.trim();
        const activo = document.getElementById('editAdminActivo').checked;
        const password = document.getElementById('editAdminPassword').value;
        const passwordConfirm = document.getElementById('editAdminPasswordConfirm').value;

        if (password || passwordConfirm) {
            if (password !== passwordConfirm) {
                showError('Las contraseñas no coinciden');
                return;
            }
            if (!validatePassword(password)) {
                showError('La contraseña no cumple con los requisitos de seguridad');
                return;
            }
        }

        try {
            showLoading(true);

            const updateDatosData = {
                username: username,
                email: email,
                nombreCompleto: nombreCompleto || null,
                activo: activo,
                usuarioMod: getCurrentUsername()
            };

            console.log('📝 Actualizando datos básicos...');

            const updateDatosResponse = await fetch(`${ADMIN_API_URL}/${currentEditingAdminId}/datos`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(updateDatosData)
            });

            if (!updateDatosResponse.ok) {
                const errorData = await updateDatosResponse.json();
                throw new Error(errorData.message || 'Error al actualizar datos');
            }

            console.log('✅ Datos básicos actualizados');

            if (password) {
                console.log('🔐 Actualizando contraseña...');

                const passwordData = {
                    nuevaPassword: password,
                    usuarioMod: getCurrentUsername()
                };

                const passwordResponse = await fetch(
                    `${ADMIN_API_URL}/${currentEditingAdminId}/reset-password`,
                    {
                        method: 'PUT',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(passwordData)
                    }
                );

                if (!passwordResponse.ok) {
                    const errorData = await passwordResponse.json();
                    console.warn('⚠️ No se pudo cambiar la contraseña:', errorData);
                    showSuccessMessage('✅ Datos actualizados pero hubo un error al cambiar la contraseña.');
                } else {
                    console.log('✅ Contraseña actualizada');
                    showSuccessMessage('✅ Administrador y contraseña actualizados exitosamente');
                }
            } else {
                showSuccessMessage('✅ Administrador actualizado exitosamente');
            }

            setTimeout(() => loadAdminsList(), 1500);

        } catch (error) {
            console.error('Error:', error);
            showError(error.message);
        } finally {
            showLoading(false);
        }
    }

    function confirmToggleAdmin(adminId) {
        const admin = adminsData.find(a => a.id === adminId);
        if (!admin) return;

        const action = admin.activo ? 'desactivar' : 'activar';
        const title = `${action.charAt(0).toUpperCase() + action.slice(1)} Administrador`;
        const message = `¿Estás seguro de que deseas ${action} al usuario "${admin.username}"?`;

        if (window.showConfirmModal) {
            window.showConfirmModal(
                title,
                message,
                () => toggleAdminStatus(adminId),
                `Sí, ${action}`,
                'Cancelar',
                admin.activo ? 'warning' : 'success'
            );
        } else {
            if (confirm(message)) {
                toggleAdminStatus(adminId);
            }
        }
    }

    async function toggleAdminStatus(id, newStatus) {
        try {
            const admin = adminsList.find(a => a.id === id);
            if (!admin) {
                showAdminError('Admin no encontrado en la lista');
                return;
            }

            const action = newStatus ? 'activar' : 'desactivar';
            const confirmMsg = `¿Estás seguro de ${action} a ${admin.nombreCompleto || admin.username}?\n\n${!newStatus ? '⚠️ El administrador quedará oculto en la interfaz pero seguirá en la base de datos.' : ''
                }`;

            if (!confirm(confirmMsg)) return;

            console.log(`🔄 Cambiando estado admin ${id} a:`, newStatus);
            console.log(`👤 Usuario que modifica estado: admin`);

            showAdminLoading(true);

            const url = `${ADMIN_API.BASE_URL}/${id}/estado`;
            console.log(`🌐 URL: ${url}`);

            const response = await apiAdminRequest(url, {
                method: 'PUT',
                body: JSON.stringify({ activo: newStatus })
            });

            console.log('✅ Estado actualizado:', response);

            showAdminSuccess(`Administrador ${action}do correctamente`);

            // 🆕 Recargar lista para actualizar la UI
            await loadAdminsList();

        } catch (error) {
            console.error('❌ Error cambiando estado:', error);
            showAdminError(`Error cambiando estado: ${error.message}`);
        } finally {
            showAdminLoading(false);
        }
    }

    // ============================================
    // VALIDACIONES Y UTILIDADES
    // ============================================

    function validatePassword(password) {
        if (password.length < 8) return false;
        if (!/[a-z]/.test(password)) return false;
        if (!/[A-Z]/.test(password)) return false;
        if (!/[0-9]/.test(password)) return false;
        if (!/[^a-zA-Z0-9]/.test(password)) return false;
        return true;
    }

    function setupPasswordValidation() {
        const passwordInput = document.getElementById('adminPassword');
        const passwordHelp = document.getElementById('passwordHelp');

        if (passwordInput && passwordHelp) {
            passwordInput.addEventListener('input', function () {
                const password = this.value;
                const requirements = [
                    { test: password.length >= 8, text: 'Mínimo 8 caracteres' },
                    { test: /[a-z]/.test(password), text: 'Una minúscula' },
                    { test: /[A-Z]/.test(password), text: 'Una mayúscula' },
                    { test: /[0-9]/.test(password), text: 'Un número' },
                    { test: /[^a-zA-Z0-9]/.test(password), text: 'Un carácter especial' }
                ];

                const html = requirements.map(req =>
                    `<span style="display: inline-block; margin-right: 12px; color: ${req.test ? '#10b981' : '#ef4444'}; font-weight: 500;">
                        ${req.test ? '✓' : '✗'} ${req.text}
                    </span>`
                ).join('');

                passwordHelp.innerHTML = html;
            });
        }
    }

    function escapeHtml(text) {
        if (!text) return '';
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    function showError(message) {
        if (window.showError && typeof window.showError === 'function') {
            if (window.showError !== showError) {
                window.showError(message);
                return;
            }
        }

        const errorDiv = document.getElementById('errorMessage');
        const errorText = document.getElementById('errorText');
        if (errorDiv && errorText) {
            errorText.textContent = message;
            errorDiv.style.display = 'flex';
            setTimeout(() => {
                errorDiv.style.display = 'none';
            }, 8000);
        } else {
            alert('Error: ' + message);
        }
        console.error('Error:', message);
    }

    function showSuccessMessage(message) {
        if (window.showSuccessMessage && typeof window.showSuccessMessage === 'function') {
            if (window.showSuccessMessage !== showSuccessMessage) {
                window.showSuccessMessage(message);
                return;
            }
        }

        const successDiv = document.getElementById('successMessage');
        const successText = document.getElementById('successText');
        if (successDiv && successText) {
            successText.textContent = message;
            successDiv.style.display = 'block';
            setTimeout(() => {
                successDiv.style.display = 'none';
            }, 4000);
        } else {
            alert(message);
        }
    }

    function showLoading(show) {
        if (window.showLoading && typeof window.showLoading === 'function') {
            if (window.showLoading !== showLoading) {
                window.showLoading(show);
                return;
            }
        }

        const overlay = document.getElementById('loadingOverlay');
        if (overlay) {
            overlay.style.display = show ? 'flex' : 'none';
        }
    }

    // ============================================
    // ESTILOS ADICIONALES
    // ============================================

    // Agregar estilos dinámicos para animaciones y hover effects
    const styleSheet = document.createElement('style');
    styleSheet.textContent = `
        @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
        }
        
        table tr:hover {
            background: #f8f9fa !important;
            transform: scale(1.01);
            box-shadow: 0 2px 8px rgba(0,0,0,0.05);
        }
        
        input:focus {
            outline: none;
            border-color: #667eea !important;
            box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1) !important;
        }
        
        button:hover {
            transform: translateY(-2px);
            box-shadow: 0 6px 16px rgba(0,0,0,0.15) !important;
        }
        
        button:active {
            transform: translateY(0);
        }
    `;
    document.head.appendChild(styleSheet);

    // ============================================
    // EXPORTAR FUNCIONES GLOBALES
    // ============================================

    window.loadAdminsList = loadAdminsList;
    window.showCreateAdminForm = showCreateAdminForm;
    window.showEditAdminForm = showEditAdminForm;
    window.confirmToggleAdmin = confirmToggleAdmin;
    window.getCurrentUsername = getCurrentUsername;
    window.confirmToggleVisibilidad = confirmToggleVisibilidad;

    window.showAdminManager = function () {
        console.log('👥 Abriendo gestión de administradores...');

        const modal = document.getElementById('adminModal');
        if (modal) {
            modal.style.display = 'flex';
            setTimeout(() => loadAdminsList(), 100);
        } else {
            console.error('Modal adminModal no encontrado');
        }
    };

    // Prevenir autocompletado agresivo del navegador
    document.addEventListener('DOMContentLoaded', function () {
        const observer = new MutationObserver(function (mutations) {
            mutations.forEach(function (mutation) {
                mutation.addedNodes.forEach(function (node) {
                    if (node.nodeType === 1 && node.id === 'adminUserForm') {
                        const inputs = node.querySelectorAll('input');
                        inputs.forEach(input => {
                            input.setAttribute('autocomplete', 'off');
                            input.value = '';
                        });
                    }
                });
            });
        });

        observer.observe(document.body, {
            childList: true,
            subtree: true
        });
    });

    console.log('✅ Módulo de gestión de administradores cargado correctamente');
}

console.log('✅ admin-users.js CARGADO COMPLETAMENTE');
console.log('✅ Funciones exportadas:', {
    loadAdminsList: typeof window.loadAdminsList,
    showCreateAdminForm: typeof window.showCreateAdminForm,
    showEditAdminForm: typeof window.showEditAdminForm,
    confirmToggleAdmin: typeof window.confirmToggleAdmin
});