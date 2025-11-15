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

    function renderAdminsList() {
        const container = document.getElementById('adminsListContainer');
        if (!container) return;

        if (adminsList.length === 0) {
            container.innerHTML = `
            <div style="text-align: center; padding: 40px; color: #666;">
                <div style="font-size: 48px; margin-bottom: 20px;">👥</div>
                <h3>No hay administradores</h3>
                <p>Agrega el primer administrador del sistema.</p>
            </div>
        `;
            return;
        }

        // 🆕 FILTRAR SOLO ADMINS ACTIVOS
        const adminsActivos = adminsList.filter(admin => admin.activo === true);

        console.log(`📊 Total admins: ${adminsList.length}, Activos: ${adminsActivos.length}`);

        if (adminsActivos.length === 0) {
            container.innerHTML = `
            <div style="text-align: center; padding: 40px; color: #666;">
                <div style="font-size: 48px; margin-bottom: 20px;">😴</div>
                <h3>No hay administradores activos</h3>
                <p>Todos los administradores están desactivados.</p>
                <button class="btn-primary" onclick="mostrarAdminsInactivos()" 
                        style="margin-top: 20px; background: #667eea; color: white; 
                               border: none; padding: 12px 30px; border-radius: 8px; 
                               cursor: pointer;">
                    👁️ Ver Administradores Inactivos
                </button>
            </div>
        `;
            return;
        }

        const html = adminsActivos.map(admin => {
            const isPrincipal = admin.esAdminPrincipal;
            const lastLogin = admin.ultimoLogin
                ? new Date(admin.ultimoLogin).toLocaleString('es-ES')
                : 'Nunca';
            const createdDate = admin.fechaAlta
                ? new Date(admin.fechaAlta).toLocaleDateString('es-ES')
                : 'N/A';

            return `
            <div class="admin-card" data-admin-id="${admin.id}">
                <div class="admin-card-header">
                    <div class="admin-info">
                        <div class="admin-avatar">${admin.nombreCompleto?.charAt(0) || admin.username?.charAt(0) || '👤'}</div>
                        <div>
                            <h3>
                                ${escapeHtml(admin.nombreCompleto || admin.username)}
                                ${isPrincipal ? '<span class="badge-principal">👑 Principal</span>' : ''}
                            </h3>
                            <div class="admin-username">@${escapeHtml(admin.username)}</div>
                        </div>
                    </div>
                    <div class="admin-status status-active">
                        ✓ Activo
                    </div>
                </div>

                <div class="admin-details">
                    <div class="admin-detail-item">
                        <span class="detail-label">📧 Email:</span>
                        <span class="detail-value">${escapeHtml(admin.email)}</span>
                    </div>
                    <div class="admin-detail-item">
                        <span class="detail-label">🎭 Rol:</span>
                        <span class="detail-value">${escapeHtml(admin.rol || 'Admin')}</span>
                    </div>
                    <div class="admin-detail-item">
                        <span class="detail-label">🕐 Último acceso:</span>
                        <span class="detail-value">${lastLogin}</span>
                    </div>
                    <div class="admin-detail-item">
                        <span class="detail-label">📅 Fecha de alta:</span>
                        <span class="detail-value">${createdDate}</span>
                    </div>
                </div>

                <div class="admin-actions">
                    <button class="btn-admin-action btn-edit" onclick="openEditAdminModal(${admin.id})" 
                            title="Editar datos del administrador">
                        ✏️ Editar
                    </button>
                    <button class="btn-admin-action btn-password" onclick="openResetPasswordModal(${admin.id})" 
                            title="Cambiar contraseña">
                        🔑 Password
                    </button>
                    <button class="btn-admin-action btn-deactivate" 
                            onclick="toggleAdminStatus(${admin.id}, false)"
                            title="Desactivar administrador">
                        ⏸️ Desactivar
                    </button>
                </div>
            </div>
        `;
        }).join('');

        // 🆕 Agregar botón para ver inactivos si existen
        const adminsInactivos = adminsList.filter(a => !a.activo);
        const botonInactivos = adminsInactivos.length > 0 ? `
        <div style="text-align: center; margin-top: 30px; padding: 20px; background: #fff3cd; border-radius: 12px;">
            <p style="color: #856404; margin-bottom: 15px;">
                📋 Hay ${adminsInactivos.length} administrador(es) desactivado(s)
            </p>
            <button class="btn-secondary" onclick="mostrarAdminsInactivos()" 
                    style="background: #6c757d; color: white; border: none; 
                           padding: 10px 25px; border-radius: 8px; cursor: pointer;">
                👁️ Ver Administradores Inactivos
            </button>
        </div>
    ` : '';

        container.innerHTML = html + botonInactivos;
    }

    // 🆕 NUEVA FUNCIÓN: Mostrar administradores inactivos
    function mostrarAdminsInactivos() {
        const modal = document.createElement('div');
        modal.id = 'inactivosModal';
        modal.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: rgba(0, 0, 0, 0.8);
        display: flex;
        justify-content: center;
        align-items: center;
        z-index: 10000;
        padding: 20px;
    `;

        const adminsInactivos = adminsList.filter(a => !a.activo);

        const content = `
        <div style="background: white; border-radius: 20px; padding: 40px; 
                    max-width: 800px; width: 90%; max-height: 80vh; overflow-y: auto;">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 30px;">
                <h2 style="margin: 0; color: #333;">
                    😴 Administradores Inactivos
                </h2>
                <button onclick="cerrarInactivosModal()" 
                        style="background: none; border: none; font-size: 24px; 
                               cursor: pointer; color: #666;">×</button>
            </div>

            ${adminsInactivos.length === 0 ? `
                <p style="text-align: center; color: #666; padding: 40px;">
                    No hay administradores inactivos
                </p>
            ` : adminsInactivos.map(admin => `
                <div style="padding: 20px; border: 2px solid #e0e0e0; border-radius: 12px; 
                            margin-bottom: 15px; background: #f8f9fa;">
                    <div style="display: flex; justify-content: space-between; align-items: center;">
                        <div>
                            <h3 style="margin: 0 0 10px 0; color: #333;">
                                ${escapeHtml(admin.nombreCompleto || admin.username)}
                                ${admin.esAdminPrincipal ? '<span style="background: #764ba2; color: white; padding: 2px 8px; border-radius: 6px; font-size: 0.8em; margin-left: 10px;">👑 Principal</span>' : ''}
                            </h3>
                            <p style="margin: 5px 0; color: #666;">
                                📧 ${escapeHtml(admin.email)}
                            </p>
                            <p style="margin: 5px 0; color: #666;">
                                @${escapeHtml(admin.username)}
                            </p>
                        </div>
                        <button onclick="reactivarAdmin(${admin.id})" 
                                style="background: #28a745; color: white; border: none; 
                                       padding: 10px 20px; border-radius: 8px; cursor: pointer;
                                       font-weight: 600;">
                            ▶️ Reactivar
                        </button>
                    </div>
                </div>
            `).join('')}
        </div>
    `;

        modal.innerHTML = content;
        document.body.appendChild(modal);

        // Cerrar con clic fuera del modal
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                cerrarInactivosModal();
            }
        });
    }

    // 🆕 NUEVA FUNCIÓN: Cerrar modal de inactivos
    function cerrarInactivosModal() {
        const modal = document.getElementById('inactivosModal');
        if (modal) {
            modal.remove();
        }
    }

    // 🆕 NUEVA FUNCIÓN: Reactivar administrador
    async function reactivarAdmin(id) {
        const admin = adminsList.find(a => a.id === id);
        if (!admin) return;

        if (!confirm(`¿Reactivar a ${admin.nombreCompleto || admin.username}?`)) return;

        try {
            await toggleAdminStatus(id, true);
            cerrarInactivosModal();
        } catch (error) {
            console.error('Error reactivando admin:', error);
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