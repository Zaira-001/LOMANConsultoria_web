// test-admin-api.js - Script para diagnosticar el problema de la API
console.log('🔍 Iniciando diagnóstico de API de Administradores...');

async function testAdminAPI() {
    const baseURLs = [
        'https://lomanconsultoria-web.onrender.com/api/Admin',
        'https://lomanconsultoria-web.onrender.com/api/Admin',
        'https://lomanconsultoria-web.onrender.com/api/Admin',
        'https://lomanconsultoria-web.onrender.com/api/Admin'
    ];

    console.log('Probando diferentes variaciones de URL...\n');

    for (const url of baseURLs) {
        console.log(`\n📍 Probando: ${url}`);
        console.log('─'.repeat(60));

        try {
            // Test 1: OPTIONS (preflight CORS)
            console.log('1️⃣ Testing OPTIONS (CORS preflight)...');
            try {
                const optionsResponse = await fetch(url, {
                    method: 'OPTIONS',
                    headers: {
                        'Access-Control-Request-Method': 'GET',
                        'Access-Control-Request-Headers': 'Content-Type'
                    }
                });
                console.log(`   ✅ OPTIONS: ${optionsResponse.status} ${optionsResponse.statusText}`);
                console.log(`   Headers:`, [...optionsResponse.headers.entries()]);
            } catch (optionsError) {
                console.log(`   ❌ OPTIONS failed:`, optionsError.message);
            }

            // Test 2: GET simple
            console.log('\n2️⃣ Testing GET...');
            const getResponse = await fetch(url, {
                method: 'GET',
                headers: {
                    'Accept': 'application/json'
                }
            });

            console.log(`   Status: ${getResponse.status} ${getResponse.statusText}`);
            console.log(`   Headers:`, [...getResponse.headers.entries()]);

            if (getResponse.ok) {
                const data = await getResponse.json();
                console.log(`   ✅ Datos recibidos:`, data);
                console.log(`   📊 Total admins: ${Array.isArray(data) ? data.length : 'N/A'}`);

                return { success: true, url, data };
            } else {
                const errorText = await getResponse.text();
                console.log(`   ❌ Error ${getResponse.status}:`, errorText);
            }

        } catch (error) {
            console.log(`   🔥 Exception:`, error.message);

            if (error.message.includes('CORS')) {
                console.log('   💡 Problema de CORS detectado');
            } else if (error.message.includes('Failed to fetch')) {
                console.log('   💡 Problema de red o DNS');
            }
        }
    }

    console.log('\n\n=== FIN DEL DIAGNÓSTICO ===');
    console.log('Si todas las pruebas fallaron, verifica:');
    console.log('1. Que el servidor esté en línea');
    console.log('2. Que CORS esté habilitado en Program.cs');
    console.log('3. Que la ruta api/Admin exista en AdminController.cs');
    console.log('4. Que el DNS esté resolviendo correctamente');

    return { success: false };
}

// Test específico para el endpoint de test-db
async function testDatabaseEndpoint() {
    console.log('\n\n🔍 Probando endpoint de diagnóstico...');

    const testURL = 'https://lomanconsultoria-web.onrender.com/api/Admin/test-db';

    try {
        const response = await fetch(testURL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            }
        });

        console.log(`Status: ${response.status}`);
        const data = await response.json();
        console.log('Respuesta del test-db:', data);

        if (data.funciona) {
            console.log('✅ Base de datos funcionando');
            console.log(`   Usuarios encontrados: ${data.count}`);
            if (data.usuarios) {
                console.log('   Usuarios:', data.usuarios);
            }
        } else {
            console.log('❌ Error en base de datos:', data.error);
        }

    } catch (error) {
        console.log('❌ Error probando test-db:', error.message);
    }
}

// Ejecutar diagnóstico
(async function () {
    const result = await testAdminAPI();

    if (result.success) {
        console.log(`\n✅ API FUNCIONANDO EN: ${result.url}`);
        console.log('Actualiza CONFIG.API_URL en admin-users.js a:', result.url);
    } else {
        console.log('\n❌ NINGUNA URL FUNCIONÓ');
        await testDatabaseEndpoint();
    }
})();

// Exportar función para uso manual
window.testAdminAPI = testAdminAPI;
window.testDatabaseEndpoint = testDatabaseEndpoint;

console.log('\n💡 Para ejecutar manualmente en la consola:');
console.log('   await testAdminAPI()');
console.log('   await testDatabaseEndpoint()');