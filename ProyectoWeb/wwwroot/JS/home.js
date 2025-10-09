function animateCountersSmooth() {
    const counters = document.querySelectorAll('.stat-number');
    counters.forEach(counter => {
        const target = +counter.getAttribute('data-target');
        const duration = 1500; // 1.5 segundos
        let startTime = null;

        const animate = (currentTime) => {
            if (!startTime) startTime = currentTime;
            const progress = Math.min((currentTime - startTime) / duration, 1);

            // Función de easing para animación más suave
            const easeOutQuart = 1 - Math.pow(1 - progress, 4);
            const current = Math.floor(easeOutQuart * target);

            counter.innerText = current + (target === 100 && progress === 1 ? '%' : progress === 1 ? '+' : '');

            if (progress < 1) {
                requestAnimationFrame(animate);
            } else {
                counter.innerText = target + (target === 100 ? '%' : '+');
            }
        };

        requestAnimationFrame(animate);
    });
}

// Función para verificar si el mapa carga correctamente
function checkMapLoading() {
    const iframe = document.querySelector('.map-container iframe');
    const fallback = document.getElementById('map-fallback');

    if (iframe) {
        iframe.addEventListener('error', function () {
            console.log('Error al cargar el mapa, mostrando información de respaldo');
            if (fallback) {
                fallback.style.display = 'flex';
                iframe.style.display = 'none';
            }
        });

        // Verificar después de 5 segundos si el mapa no cargó
        setTimeout(function () {
            try {
                if (!iframe.contentDocument && !iframe.contentWindow) {
                    console.log('Mapa no disponible, mostrando respaldo');
                    if (fallback) {
                        fallback.style.display = 'flex';
                        iframe.style.display = 'none';
                    }
                }
            } catch (e) {
                // Error de acceso, el mapa probablemente está cargando bien
                console.log('Mapa cargando normalmente');
            }
        }, 5000);
    }
}

// NUEVA FUNCIÓN: Setup para las tarjetas con borde rotativo
function setupRotatingBorderCards() {
    const cards = document.querySelectorAll('.stat-card');

    cards.forEach(card => {
        // Agregar efectos adicionales si se desea
        card.addEventListener('mouseenter', () => {
            // El borde seguirá rotando, solo se acelera ligeramente
            console.log('Hover en tarjeta - borde rotativo acelerado');
        });

        card.addEventListener('mouseleave', () => {
            // Vuelve a la velocidad normal
            console.log('Fin hover - borde rotativo a velocidad normal');
        });
    });

    console.log(`✨ ${cards.length} tarjetas con borde rotativo configuradas`);
}

// OPCIÓN MEJORADA: Si quieres que aparezcan al hacer scroll (Intersection Observer)
function animateCountersOnScroll() {
    const counters = document.querySelectorAll('.stat-number');
    let hasAnimated = false;

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting && !hasAnimated) {
                hasAnimated = true;

                // Animar contadores con un pequeño efecto cascada
                counters.forEach((counter, index) => {
                    setTimeout(() => {
                        animateCounterSingle(counter);
                    }, index * 150); // 150ms de delay entre cada contador
                });

                observer.disconnect(); // Desconectar después de animar una vez
            }
        });
    }, {
        threshold: 0.3, // Se activa cuando el 30% del elemento es visible
        rootMargin: '50px' // Margen adicional para activar antes
    });

    // Observar la sección de estadísticas
    const statsSection = document.querySelector('.stats-section');
    if (statsSection) {
        observer.observe(statsSection);
        console.log('📊 Observer configurado para animación de contadores al hacer scroll');
    }
}

// Función para animar un contador individual
function animateCounterSingle(counter) {
    const target = +counter.getAttribute('data-target');
    const duration = 1800; // Un poco más lento para mejor efecto visual
    let startTime = null;

    const animate = (currentTime) => {
        if (!startTime) startTime = currentTime;
        const progress = Math.min((currentTime - startTime) / duration, 1);

        // Easing suave y profesional
        const easeOutQuart = 1 - Math.pow(1 - progress, 4);
        const current = Math.floor(easeOutQuart * target);

        counter.innerText = current + (target === 100 && progress === 1 ? '%' : progress === 1 ? '+' : '');

        if (progress < 1) {
            requestAnimationFrame(animate);
        } else {
            counter.innerText = target + (target === 100 ? '%' : '+');
        }
    };

    requestAnimationFrame(animate);
}

// Detectar combinación de teclas Ctrl+Shift+A
document.addEventListener('keydown', function (event) {
    if (event.ctrlKey && event.shiftKey && event.key === 'A') {
        event.preventDefault();
        DotNet.invokeMethodAsync('TuNamespace', 'ShowSecretLoginFromJS');
    }
});

// CARRUSEL - Variables y funciones existentes
let currentIndex = 0;
let totalSlides = 0;
let autoPlayInterval;

function updateCarousel() {
    const track = document.getElementById('carouselTrack');
    const indicators = document.querySelectorAll('.indicator');

    console.log('Moviendo a:', currentIndex);

    // Mover carrusel
    track.style.transform = `translateX(-${currentIndex * 100}%)`;

    // Actualizar contador
    const currentSlideElement = document.getElementById('currentSlide');
    if (currentSlideElement) {
        currentSlideElement.textContent = currentIndex + 1;
    }

    // Actualizar indicadores
    indicators.forEach((indicator, index) => {
        indicator.classList.toggle('active', index === currentIndex);
    });
}

function nextSlide() {
    console.log('Next clicked');
    currentIndex = (currentIndex + 1) % totalSlides;
    updateCarousel();
}

function previousSlide() {
    console.log('Previous clicked');
    currentIndex = (currentIndex - 1 + totalSlides) % totalSlides;
    updateCarousel();
}

function goToSlide(index) {
    currentIndex = index;
    updateCarousel();
}

// FUNCIÓN DE OPTIMIZACIÓN PARA RENDIMIENTO
function optimizeRotatingBorders() {
    // Detectar dispositivos de baja potencia
    const isLowEndDevice = navigator.hardwareConcurrency <= 2 ||
        navigator.deviceMemory <= 2 ||
        /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);

    if (isLowEndDevice) {
        console.log('📱 Optimizando animaciones para dispositivo de baja potencia...');
        const style = document.createElement('style');
        style.textContent = `
            .stat-card::before {
                animation-duration: 4s !important;
            }
            .stat-icon {
                animation-duration: 3.5s !important;
            }
        `;
        document.head.appendChild(style);
    }
}

// INICIALIZACIÓN PRINCIPAL
document.addEventListener('DOMContentLoaded', function () {
    console.log('🚀 Inicializando página con bordes rotativos...');

    // SETUP DE TARJETAS CON BORDE ROTATIVO
    setupRotatingBorderCards();

    // OPTIMIZAR RENDIMIENTO
    optimizeRotatingBorders();

    // ANIMACIÓN DE CONTADORES - Puedes elegir una opción:

    // OPCIÓN A: Animación inmediata al cargar la página
    animateCountersSmooth();

    // OPCIÓN B: Animación cuando se hace scroll a la sección (DESCOMENTA SI PREFIERES ESTA)
    // animateCountersOnScroll();

    // SETUP DEL CARRUSEL (si existe)
    const slides = document.querySelectorAll('.carousel-slide');
    if (slides.length > 0) {
        totalSlides = slides.length;

        // Crear indicadores
        const indicatorsContainer = document.getElementById('indicators');
        if (indicatorsContainer) {
            for (let i = 0; i < totalSlides; i++) {
                const indicator = document.createElement('div');
                indicator.className = 'indicator';
                if (i === 0) indicator.classList.add('active');
                indicator.onclick = () => goToSlide(i);
                indicatorsContainer.appendChild(indicator);
            }
        }

        // Actualizar contador inicial
        const totalSlidesElement = document.getElementById('totalSlides');
        if (totalSlidesElement) {
            totalSlidesElement.textContent = totalSlides;
        }

        // Auto-play con pausa al hover
        const carouselContainer = document.querySelector('.carousel-container');
        if (carouselContainer) {
            let isPaused = false;

            carouselContainer.addEventListener('mouseenter', () => isPaused = true);
            carouselContainer.addEventListener('mouseleave', () => isPaused = false);

            // Iniciar auto-play
            autoPlayInterval = setInterval(() => {
                if (!isPaused) {
                    nextSlide();
                }
            }, 3000);

            console.log('🎠 Carrusel configurado con auto-play');
        }
    }

    // VERIFICAR CARGA DEL MAPA
    checkMapLoading();

    // REPETIR ANIMACIÓN DE CONTADORES CADA 30 SEGUNDOS
    setInterval(() => {
        animateCountersSmooth();
    }, 30000);

    console.log('🎯 Bordes rotativos siempre visibles activados');
    console.log('📊 Animación de contadores configurada');
});

// RESPETO A PREFERENCIAS DE ACCESIBILIDAD
if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    console.log('♿ Usuario prefiere animaciones reducidas - adaptando bordes rotativos...');
    const style = document.createElement('style');
    style.textContent = `
        .stat-card::before {
            animation: none !important;
            background: linear-gradient(45deg, 
                rgba(91, 141, 179, 0.6), 
                rgba(145, 185, 215, 0.4)
            ) !important;
        }
        .stat-icon {
            animation: none !important;
        }
    `;
    document.head.appendChild(style);
}