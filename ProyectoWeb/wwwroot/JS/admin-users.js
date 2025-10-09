// admin-users.js - Sistema de gestión de administradores
console.log('Cargando módulo de gestión de administradores...');

// Configuración
const CONFIG = {
    API_URL: 'http://consultoriaintegralsc.somee.com/api/Admin',
    MIN_PASSWORD_LENGTH: 8
};

// Estado del módulo
let adminsList = [];
let editingAdminId = null;



// Función principal para mostrar el modal de administradores
window.showAdminManager = async function () {
    console.log('Abriendo gestor de administradores...');

    const modal = document.getElementById('adminModal');
    if (!modal) {
        console.error('Modal de administradores no encontrado');
        return;
    }

    // Cargar lista de administradores
    await loadAdminsList();

    modal.style.display = 'flex';
};

// Cargar lista de administradores desde la API
async function loadAdminsList() {
    try {
        showAdminLoading(true);

        const response = await fetch(`${CONFIG.API_URL}`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            }
        });

        if (!response.ok) {
            throw new Error(`Error HTTP: ${response.status}`);
        }

        const data = await response.json();
        adminsList = data || [];

        console.log(`Cargados ${adminsList.length} administradores`);
        renderAdminsList();

    } catch (error) {
        console.error('Error cargando administradores:', error);
        showAdminError('Error al cargar la lista de administradores: ' + error.message);
    } finally {
        showAdminLoading(false);
    }
}

// Renderizar lista de administradores
function renderAdminsList() {
    const container = document.getElementById('adminsListContainer');
    if (!container) {
        console.error('Contenedor de administradores no encontrado');
        return;
    }

    if (adminsList.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <p>No hay administradores registrados</p>
                <button type="button" class="btn-add" onclick="openAddAdminForm()">
                    Agregar Primer Administrador
                </button>
            </div>
        `;
        return;
    }

    const html = `
        <div class="admins-header">
            <h3>Administradores del Sistema (${adminsList.length})</h3>
            <button type="button" class="btn-add" onclick="openAddAdminForm()">
                + Nuevo Administrador
            </button>
        </div>
        <div class="admins-table">
            <table>
                <thead>
                    <tr>
                        <th>ID</th>
                        <th>Usuario</th>
                        <th>Nombre Completo</th>
                        <th>Email</th>
                        <th>Estado</th>
                        <th>Último Login</th>
                        <th>Acciones</th>
                    </tr>
                </thead>
                <tbody>
                    ${adminsList.map(admin => `
                        <tr class="${admin.activo ? '' : 'inactive-admin'}">
                            <td>${admin.id}</td>
                            <td><strong>${admin.username}</strong></td>
                            <td>${admin.nombreCompleto || '-'}</td>
                            <td>${admin.email}</td>
                            <td>
                                <span class="status-badge ${admin.activo ? 'active' : 'inactive'}">
                                    ${admin.activo ? 'Activo' : 'Inactivo'}
                                </span>
                            </td>
                            <td>${formatDate(admin.ultimoLogin)}</td>
                            <td class="actions-cell">
                                <button type="button" 
                                        class="btn-icon btn-edit" 
                                        onclick="editAdmin(${admin.id})"
                                        title="Editar">
                                    ✏️
                                </button>
                                <button type="button" 
                                        class="btn-icon ${admin.activo ? 'btn-deactivate' : 'btn-activate'}" 
                                        onclick="toggleAdminStatus(${admin.id}, ${!admin.activo})"
                                        title="${admin.activo ? 'Desactivar' : 'Activar'}">
                                    ${admin.activo ? '🔒' : '🔓'}
                                </button>
                                <button type="button" 
                                        class="btn-icon btn-password" 
                                        onclick="changeAdminPassword(${admin.id})"
                                        title="Cambiar contraseña">
                                    🔑
                                </button>
                            </td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        </div>
    `;

    container.innerHTML = html;
}

// Abrir formulario para agregar administrador
window.openAddAdminForm = function () {
    editingAdminId = null;

    const formHtml = `
        <div class="admin-form-container" id="adminFormContainer">
            <h3>Agregar Nuevo Administrador</h3>
            <form id="addAdminForm" onsubmit="return handleAddAdmin(event)">
                <div class="form-group">
                    <label for="newAdminUsername">Nombre de Usuario *</label>
                    <input type="text" 
                           id="newAdminUsername" 
                           required 
                           minlength="3"
                           maxlength="50"
                           placeholder="Ej: juan.perez">
                    <small>Mínimo 3 caracteres, sin espacios</small>
                </div>

                <div class="form-group">
                    <label for="newAdminEmail">Email *</label>
                    <input type="email" 
                           id="newAdminEmail" 
                           required
                           maxlength="100"
                           placeholder="admin@consultoria.com">
                </div>

                <div class="form-group">
                    <label for="newAdminNombre">Nombre Completo</label>
                    <input type="text" 
                           id="newAdminNombre"
                           maxlength="100"
                           placeholder="Juan Pérez García">
                </div>

                <div class="form-group">
                    <label for="newAdminPassword">Contraseña *</label>
                    <div class="password-input">
                        <input type="password" 
                               id="newAdminPassword" 
                               required
                               minlength="8"
                               placeholder="Mínimo 8 caracteres">
                        <button type="button" 
                                class="toggle-password" 
                                onclick="togglePasswordField('newAdminPassword')">
                            <span id="newAdminPasswordIcon">👁️</span>
                        </button>
                    </div>
                    <div id="passwordStrength" class="password-strength"></div>
                    <small>Debe contener: mayúscula, minúscula, número y carácter especial</small>
                </div>

                <div class="form-group">
                    <label for="newAdminPasswordConfirm">Confirmar Contraseña *</label>
                    <div class="password-input">
                        <input type="password" 
                               id="newAdminPasswordConfirm" 
                               required
                               minlength="8"
                               placeholder="Repite la contraseña">
                        <button type="button" 
                                class="toggle-password" 
                                onclick="togglePasswordField('newAdminPasswordConfirm')">
                            <span id="newAdminPasswordConfirmIcon">👁️</span>
                        </button>
                    </div>
                </div>

                <div class="form-actions">
                    <button type="button" class="btn-cancel" onclick="closeAdminForm()">
                        Cancelar
                    </button>
                    <button type="submit" class="btn-save">
                        Crear Administrador
                    </button>
                </div>
            </form>
        </div>
    `;

    const container = document.getElementById('adminsListContainer');
    container.innerHTML = formHtml;

    // Agregar validación en tiempo real
    const passwordInput = document.getElementById('newAdminPassword');
    if (passwordInput) {
        passwordInput.addEventListener('input', function () {
            validatePasswordStrength(this.value);
        });
    }
};

// Manejar envío del formulario de nuevo administrador
window.handleAddAdmin = async function (event) {
    event.preventDefault();

    const username = document.getElementById('newAdminUsername').value.trim();
    const email = document.getElementById('newAdminEmail').value.trim();
    const nombreCompleto = document.getElementById('newAdminNombre').value.trim();
    const password = document.getElementById('newAdminPassword').value;
    const passwordConfirm = document.getElementById('newAdminPasswordConfirm').value;

    // Validaciones
    if (password !== passwordConfirm) {
        showAdminError('Las contraseñas no coinciden');
        return false;
    }

    if (!validatePasswordRequirements(password)) {
        showAdminError('La contraseña no cumple con los requisitos de seguridad');
        return false;
    }

    try {
        showAdminLoading(true);

        const response = await fetch(`${CONFIG.API_URL}/crear`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            body: JSON.stringify({
                username,
                email,
                nombreCompleto,
                password
            })
        });

        const data = await response.json();

        if (response.ok) {
            showAdminSuccess('Administrador creado exitosamente');
            await loadAdminsList();
        } else {
            throw new Error(data.message || 'Error al crear administrador');
        }

    } catch (error) {
        console.error('Error creando administrador:', error);
        showAdminError('Error: ' + error.message);
    } finally {
        showAdminLoading(false);
    }

    return false;
};

// Cambiar estado de administrador
window.toggleAdminStatus = async function (adminId, newStatus) {
    const action = newStatus ? 'activar' : 'desactivar';

    if (!confirm(`¿Estás seguro de ${action} este administrador?`)) {
        return;
    }

    try {
        showAdminLoading(true);

        const response = await fetch(`${CONFIG.API_URL}/${adminId}/estado`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            body: JSON.stringify({ activo: newStatus })
        });

        if (response.ok) {
            showAdminSuccess(`Administrador ${action}do exitosamente`);
            await loadAdminsList();
        } else {
            const data = await response.json();
            throw new Error(data.message || `Error al ${action} administrador`);
        }

    } catch (error) {
        console.error('Error cambiando estado:', error);
        showAdminError('Error: ' + error.message);
    } finally {
        showAdminLoading(false);
    }
};

// Cambiar contraseña de administrador
window.changeAdminPassword = function (adminId) {
    const admin = adminsList.find(a => a.id === adminId);
    if (!admin) return;

    const formHtml = `
        <div class="admin-form-container" id="adminFormContainer">
            <h3>Cambiar Contraseña - ${admin.username}</h3>
            <form id="changePasswordForm" onsubmit="return handlePasswordChange(event, ${adminId})">
                <div class="form-group">
                    <label for="currentPassword">Contraseña Actual *</label>
                    <div class="password-input">
                        <input type="password" 
                               id="currentPassword" 
                               required
                               placeholder="Ingresa la contraseña actual">
                        <button type="button" 
                                class="toggle-password" 
                                onclick="togglePasswordField('currentPassword')">
                            <span>👁️</span>
                        </button>
                    </div>
                </div>

                <div class="form-group">
                    <label for="newPassword">Nueva Contraseña *</label>
                    <div class="password-input">
                        <input type="password" 
                               id="newPassword" 
                               required
                               minlength="8"
                               placeholder="Mínimo 8 caracteres">
                        <button type="button" 
                                class="toggle-password" 
                                onclick="togglePasswordField('newPassword')">
                            <span>👁️</span>
                        </button>
                    </div>
                    <div id="passwordStrength" class="password-strength"></div>
                    <small>Debe contener: mayúscula, minúscula, número y carácter especial</small>
                </div>

                <div class="form-group">
                    <label for="newPasswordConfirm">Confirmar Nueva Contraseña *</label>
                    <div class="password-input">
                        <input type="password" 
                               id="newPasswordConfirm" 
                               required
                               minlength="8"
                               placeholder="Repite la nueva contraseña">
                        <button type="button" 
                                class="toggle-password" 
                                onclick="togglePasswordField('newPasswordConfirm')">
                            <span>👁️</span>
                        </button>
                    </div>
                </div>

                <div class="form-actions">
                    <button type="button" class="btn-cancel" onclick="loadAdminsList()">
                        Cancelar
                    </button>
                    <button type="submit" class="btn-save">
                        Cambiar Contraseña
                    </button>
                </div>
            </form>
        </div>
    `;

    const container = document.getElementById('adminsListContainer');
    container.innerHTML = formHtml;

    // Validación en tiempo real
    const newPasswordInput = document.getElementById('newPassword');
    if (newPasswordInput) {
        newPasswordInput.addEventListener('input', function () {
            validatePasswordStrength(this.value);
        });
    }
};

// Manejar cambio de contraseña
window.handlePasswordChange = async function (event, adminId) {
    event.preventDefault();

    const currentPassword = document.getElementById('currentPassword').value;
    const newPassword = document.getElementById('newPassword').value;
    const newPasswordConfirm = document.getElementById('newPasswordConfirm').value;

    if (newPassword !== newPasswordConfirm) {
        showAdminError('Las contraseñas nuevas no coinciden');
        return false;
    }

    if (!validatePasswordRequirements(newPassword)) {
        showAdminError('La nueva contraseña no cumple con los requisitos de seguridad');
        return false;
    }

    try {
        showAdminLoading(true);

        const response = await fetch(`${CONFIG.API_URL}/cambiar-password`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            body: JSON.stringify({
                adminId,
                passwordActual: currentPassword,
                nuevaPassword: newPassword
            })
        });

        if (response.ok) {
            showAdminSuccess('Contraseña cambiada exitosamente');
            await loadAdminsList();
        } else {
            const data = await response.json();
            throw new Error(data.message || 'Error al cambiar contraseña');
        }

    } catch (error) {
        console.error('Error cambiando contraseña:', error);
        showAdminError('Error: ' + error.message);
    } finally {
        showAdminLoading(false);
    }

    return false;
};

// Validar fortaleza de contraseña
function validatePasswordStrength(password) {
    const strengthDiv = document.getElementById('passwordStrength');
    if (!strengthDiv) return;

    let strength = 0;
    let messages = [];

    if (password.length >= 8) strength++;
    else messages.push('Mínimo 8 caracteres');

    if (/[a-z]/.test(password)) strength++;
    else messages.push('Una minúscula');

    if (/[A-Z]/.test(password)) strength++;
    else messages.push('Una mayúscula');

    if (/[0-9]/.test(password)) strength++;
    else messages.push('Un número');

    if (/[^a-zA-Z0-9]/.test(password)) strength++;
    else messages.push('Un carácter especial');

    const levels = ['Muy débil', 'Débil', 'Regular', 'Buena', 'Fuerte', 'Muy fuerte'];
    const colors = ['#ff4444', '#ff8800', '#ffbb00', '#88cc00', '#00cc44', '#00aa00'];

    strengthDiv.innerHTML = `
        <div class="strength-bar">
            <div class="strength-fill" style="width: ${(strength / 5) * 100}%; background: ${colors[strength]}"></div>
        </div>
        <span style="color: ${colors[strength]}">${levels[strength]}</span>
        ${messages.length > 0 ? `<small>Falta: ${messages.join(', ')}</small>` : ''}
    `;
}

// Validar requisitos de contraseña
function validatePasswordRequirements(password) {
    return password.length >= 8 &&
        /[a-z]/.test(password) &&
        /[A-Z]/.test(password) &&
        /[0-9]/.test(password) &&
        /[^a-zA-Z0-9]/.test(password);
}

// Toggle visibility de campo de contraseña
window.togglePasswordField = function (fieldId) {
    const input = document.getElementById(fieldId);
    const icon = input.nextElementSibling.querySelector('span');

    if (input.type === 'password') {
        input.type = 'text';
        icon.textContent = '🙈';
    } else {
        input.type = 'password';
        icon.textContent = '👁️';
    }
};

// Cerrar formulario
window.closeAdminForm = function () {
    loadAdminsList();
};

// Utilidades UI
function showAdminLoading(show) {
    let overlay = document.getElementById('adminLoadingOverlay');

    if (!overlay) {
        overlay = document.createElement('div');
        overlay.id = 'adminLoadingOverlay';
        overlay.className = 'loading-overlay';
        overlay.innerHTML = '<div class="spinner"></div><p>Procesando...</p>';
        document.body.appendChild(overlay);
    }

    overlay.style.display = show ? 'flex' : 'none';
}

function showAdminError(message) {
    const errorDiv = document.getElementById('errorMessage');
    const errorText = document.getElementById('errorText');

    if (errorDiv && errorText) {
        errorText.textContent = message;
        errorDiv.style.display = 'flex';
        setTimeout(() => errorDiv.style.display = 'none', 5000);
    }
}

function showAdminSuccess(message) {
    const successDiv = document.getElementById('successMessage');
    const successText = document.getElementById('successText');

    if (successDiv && successText) {
        successText.textContent = message;
        successDiv.style.display = 'flex';
        setTimeout(() => successDiv.style.display = 'none', 3000);
    }
}

function formatDate(dateString) {
    if (!dateString) return 'Nunca';

    const date = new Date(dateString);
    const now = new Date();
    const diff = now - date;
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (days === 0) return 'Hoy';
    if (days === 1) return 'Ayer';
    if (days < 7) return `Hace ${days} días`;

    return date.toLocaleDateString('es-MX', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
    });
}

console.log('✅ Módulo de gestión de administradores cargado');