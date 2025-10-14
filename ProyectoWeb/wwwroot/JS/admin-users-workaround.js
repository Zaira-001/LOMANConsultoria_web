// admin-users-workaround.js
// SOLUCIÓN TEMPORAL: Usar el endpoint /test-db que sabemos que funciona

console.log('🔧 Cargando workaround para administradores...');

// Sobrescribir la función loadAdminsList original
const originalLoadAdminsList = window.loadAdminsList;

window.loadAdminsList = async function () {
    try {
        showAdminLoading(true);
        console.log('🔧 [WORKAROUND] Usando endpoint /test-db...');

        // Intentar primero con el endpoint normal
        let admins = [];
        let useWorkaround = false;

        try {
            const normalResponse = await fetch('http://www.consultoriaintegralsc.somee.com/api/Admin', {
                method: 'GET',
                headers: {
                    'Accept': 'application/json',
                    'Content-Type': 'application/json'
                },
                mode: 'cors'
            });

            if (normalResponse.ok) {
                admins = await normalResponse.json();
                console.log('✅ GET normal funcionó');
            } else {
                console.warn(`⚠️ GET normal falló: ${normalResponse.status}, usando workaround...`);
                useWorkaround = true;
            }
        } catch (error) {
            console.warn('⚠️ GET normal falló, usando workaround:', error.message);
            useWorkaround = true;
        }

        // Si el GET normal falló, usar /test-db
        if (useWorkaround) {
            try {
                const testDbResponse = await fetch('http://www.consultoriaintegralsc.somee.com/api/Admin/test-db', {
                    method: 'GET',
                    headers: {
                        'Accept': 'application/json',
                        'Content-Type': 'application/json'
                    },
                    mode: 'cors'
                });

                if (testDbResponse.ok) {
                    const testData = await testDbResponse.json();
                    console.log('✅ test-db funcionó:', testData);

                    if (testData.funciona && testData.usuarios) {
                        // Mapear los datos de test-db al formato esperado
                        admins = testData.usuarios.map(u => ({
                            id: u.id,
                            username: u.username,
                            email: u.email,
                            nombreCompleto: u.nombreCompleto || '',
                            activo: u.activo,
                            ultimoLogin: u.ultimoLogin,
                            rol: u.rol || 'Admin',
                            intentosLogin: 0,
                            bloqueoHasta: null,
                            fechaAlta: u.fechaAlta,
                            fechaMod: null,
                            usuarioAlta: '',
                            usuarioMod: ''
                        }));

                        console.log(`✅ [WORKAROUND] ${admins.length} administradores cargados desde test-db`);
                    } else {
                        throw new Error('test-db no retornó datos válidos');
                    }
                } else {
                    throw new Error(`test-db falló: ${testDbResponse.status}`);
                }
            } catch (testDbError) {
                console.error('❌ test-db también falló:', testDbError);
                throw new Error('No se pudo cargar administradores desde ningún endpoint');
            }
        }

        // Actualizar la lista global
        window.adminsList = admins;
        window.filteredAdmins = [...admins];

        // Renderizar
        if (window.renderAdminsList) {
            window.renderAdminsList();
        }

        // Mostrar mensaje de éxito
        if (window.showAdminSuccess) {
            const method = useWorkaround ? 'test-db (workaround)' : 'GET normal';
            window.showAdminSuccess(`${admins.length} administradores cargados desde ${method}`);
        }

        console.log(`✅ Total admins disponibles: ${admins.length}`);

    } catch (error) {
        console.error('🔥 Error en workaround:', error);

        // Mostrar error específico
        let errorMessage = 'Error al cargar administradores';

        if (error.message.includes('CORS')) {
            errorMessage = 'Error de CORS. Verifica la configuración del servidor.';
        } else if (error.message.includes('Failed to fetch')) {
            errorMessage = 'No se puede conectar con el servidor. Verifica tu conexión.';
        } else {
            errorMessage = error.message;
        }

        if (window.showAdminError) {
            window.showAdminError(errorMessage);
        }

        // Renderizar lista vacía
        window.adminsList = [];
        window.filteredAdmins = [];

        if (window.renderAdminsList) {
            window.renderAdminsList();
        }

    } finally {
        if (window.showAdminLoading) {
            window.showAdminLoading(false);
        }
    }
};

// También sobrescribir otras funciones que hagan peticiones GET

// Función auxiliar para crear/actualizar administradores
async function apiRequestWithWorkaround(url, options = {}) {
    try {
        const response = await fetch(url, {
            ...options,
            mode: 'cors',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json',
                ...options.headers
            }
        });

        if (!response.ok) {
            let errorMessage = `HTTP ${response.status}`;
            try {
                const errorData = await response.json();
                errorMessage = errorData.message || errorData.error || errorMessage;
            } catch (e) {
                const errorText = await response.text();
                if (errorText) errorMessage += `: ${errorText}`;
            }
            throw new Error(errorMessage);
        }

        return await response.json();

    } catch (error) {
        console.error('API Request Error:', error);
        throw error;
    }
}

// Sobrescribir apiRequest si existe
if (window.apiRequest) {
    window.originalApiRequest = window.apiRequest;
    window.apiRequest = apiRequestWithWorkaround;
}

console.log('✅ Workaround de administradores cargado');
console.log('💡 Para cargar manualmente: await loadAdminsList()');

// Auto-ejecutar si el modal de admins está abierto
window.addEventListener('DOMContentLoaded', function () {
    // Observar cuando se abre el modal de administradores
    const observer = new MutationObserver(function (mutations) {
        mutations.forEach(function (mutation) {
            if (mutation.target.id === 'adminModal') {
                const modal = mutation.target;
                if (modal.style.display !== 'none' && modal.classList.contains('show')) {
                    console.log('🔧 Modal de admins detectado, cargando con workaround...');
                    setTimeout(() => {
                        if (window.loadAdminsList) {
                            window.loadAdminsList();
                        }
                    }, 200);
                }
            }
        });
    });

    const adminModal = document.getElementById('adminModal');
    if (adminModal) {
        observer.observe(adminModal, {
            attributes: true,
            attributeFilter: ['style', 'class']
        });
    }
});