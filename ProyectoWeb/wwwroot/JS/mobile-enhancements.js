// MEJORAS TÁCTILES PARA MÓVILES

// Detectar si es dispositivo táctil
const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;

// Variables para swipe en carrusel
let startX = 0;
let currentX = 0;
let isDragging = false;
let startTime = 0;

// Inicializar mejoras móviles cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', function () {
    if (isTouchDevice) {
        initMobileEnhancements();
        initSwipeGestures();
        initMobileAnimations();
        hideSwipeHint();
    }
});

// Ocultar hint de swipe después de 5 segundos
function hideSwipeHint() {
    setTimeout(() => {
        const hint = document.querySelector('.carousel-wrapper::after');
        if (hint) {
            hint.style.opacity = '0';
            hint.style.transition = 'opacity 0.5s ease';
        }
    }, 5000);
}

// Inicializar mejoras generales para móviles
function initMobileEnhancements() {
    // Ajustar viewport dinámicamente para iOS
    if (window.navigator.userAgent.includes('iPhone') || window.navigator.userAgent.includes('iPad')) {
        adjustViewportForIOS();
    }

    // Prevenir zoom en doble tap en ciertos elementos
    const preventZoomElements = document.querySelectorAll('.carousel-btn, .stat-card, .indicator');
    preventZoomElements.forEach(element => {
        element.addEventListener('touchend', function (e) {
            e.preventDefault();
            e.target.click();
        });
    });

    // Mejorar rendimiento en scroll
    let ticking = false;
    window.addEventListener('scroll', function () {
        if (!ticking) {
            requestAnimationFrame(() => {
                updateScrollEffects();
                ticking = false;
            });
            ticking = true;
        }
    });
}

// Ajustar viewport para iOS Safari
function adjustViewportForIOS() {
    function setViewportHeight() {
        const vh = window.innerHeight * 0.01;
        document.documentElement.style.setProperty('--vh', `${vh}px`);
    }

    setViewportHeight();
    window.addEventListener('resize', setViewportHeight);
    window.addEventListener('orientationchange', setViewportHeight);
}

// Efectos de scroll optimizados
function updateScrollEffects() {
    const scrollY = window.pageYOffset;
    const windowHeight = window.innerHeight;

    // Parallax sutil en hero para móviles
    const hero = document.querySelector('.hero-background-layer');
    if (hero && scrollY < windowHeight) {
        const parallaxSpeed = scrollY * 0.1;
        hero.style.transform = `translateY(${parallaxSpeed}px)`;
    }

    // Fade in para stats cuando aparecen
    const stats = document.querySelector('.stats-section');
    if (stats) {
        const statsOffset = stats.offsetTop;
        const statsHeight = stats.offsetHeight;

        if (scrollY + windowHeight > statsOffset && scrollY < statsOffset + statsHeight) {
            stats.style.opacity = '1';
            stats.style.transform = 'translateY(0)';
        }
    }
}

// Inicializar gestos de swipe para el carrusel
function initSwipeGestures() {
    const carouselWrapper = document.querySelector('.carousel-wrapper');
    if (!carouselWrapper) return;

    // Touch events
    carouselWrapper.addEventListener('touchstart', handleTouchStart, { passive: true });
    carouselWrapper.addEventListener('touchmove', handleTouchMove, { passive: false });
    carouselWrapper.addEventListener('touchend', handleTouchEnd, { passive: true });

    // Mouse events para testing en desktop
    carouselWrapper.addEventListener('mousedown', handleMouseStart);
    carouselWrapper.addEventListener('mousemove', handleMouseMove);
    carouselWrapper.addEventListener('mouseup', handleMouseEnd);
    carouselWrapper.addEventListener('mouseleave', handleMouseEnd);
}

function handleTouchStart(e) {
    startX = e.touches[0].clientX;
    currentX = startX;
    isDragging = true;
    startTime = Date.now();

    // Pausar auto-play durante el swipe
    if (typeof autoPlayInterval !== 'undefined') {
        clearInterval(autoPlayInterval);
    }
}

function handleTouchMove(e) {
    if (!isDragging) return;

    currentX = e.touches[0].clientX;
    const diffX = currentX - startX;

    // Prevenir scroll vertical si el swipe es horizontal
    if (Math.abs(diffX) > 10) {
        e.preventDefault();
    }

    // Visual feedback durante el swipe
    const track = document.getElementById('carouselTrack');
    if (track) {
        const currentTransform = -currentIndex * 100;
        const dragPercentage = (diffX / window.innerWidth) * 100;
        track.style.transform = `translateX(${currentTransform + dragPercentage}%)`;
        track.style.transition = 'none';
    }
}

function handleTouchEnd(e) {
    if (!isDragging) return;
    isDragging = false;

    const diffX = currentX - startX;
    const diffTime = Date.now() - startTime;
    const velocity = Math.abs(diffX) / diffTime;

    // Determinar si fue un swipe válido
    const isValidSwipe = Math.abs(diffX) > 50 || velocity > 0.5;

    if (isValidSwipe) {
        if (diffX > 0) {
            // Swipe derecha - imagen anterior
            previousSlide();
        } else {
            // Swipe izquierda - imagen siguiente
            nextSlide();
        }
    } else {
        // Regresar a la posición original
        const track = document.getElementById('carouselTrack');
        if (track) {
            track.style.transition = 'transform 0.3s ease';
            track.style.transform = `translateX(-${currentIndex * 100}%)`;
        }
    }

    // Reiniciar auto-play después de 3 segundos
    setTimeout(() => {
        if (typeof startAutoPlay !== 'undefined') {
            startAutoPlay();
        }
    }, 3000);
}

// Mouse events para desktop testing
function handleMouseStart(e) {
    e.preventDefault();
    startX = e.clientX;
    currentX = startX;
    isDragging = true;
    startTime = Date.now();
}

function handleMouseMove(e) {
    if (!isDragging) return;
    e.preventDefault();
    currentX = e.clientX;

    const diffX = currentX - startX;
    const track = document.getElementById('carouselTrack');
    if (track) {
        const currentTransform = -currentIndex * 100;
        const dragPercentage = (diffX / window.innerWidth) * 100;
        track.style.transform = `translateX(${currentTransform + dragPercentage}%)`;
        track.style.transition = 'none';
    }
}

function handleMouseEnd(e) {
    if (!isDragging) return;
    isDragging = false;

    const diffX = currentX - startX;
    const isValidSwipe = Math.abs(diffX) > 50;

    if (isValidSwipe) {
        if (diffX > 0) {
            previousSlide();
        } else {
            nextSlide();
        }
    } else {
        const track = document.getElementById('carouselTrack');
        if (track) {
            track.style.transition = 'transform 0.3s ease';
            track.style.transform = `translateX(-${currentIndex * 100}%)`;
        }
    }
}

// Inicializar animaciones móviles optimizadas
function initMobileAnimations() {
    // Intersection Observer para animaciones cuando aparecen en pantalla
    if ('IntersectionObserver' in window) {
        const observerOptions = {
            threshold: 0.2,
            rootMargin: '0px 0px -50px 0px'
        };

        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('animate-in');

                    // Animar stats cuando aparecen
                    if (entry.target.classList.contains('stats-section')) {
                        animateStatsOnView();
                    }
                }
            });
        }, observerOptions);

        // Observar elementos para animar
        const elementsToObserve = document.querySelectorAll(
            '.stats-section, .carousel-container, .map-container, .footer'
        );

        elementsToObserve.forEach(el => {
            el.classList.add('animate-ready');
            observer.observe(el);
        });
    }

    // Animación de entrada para stat cards
    const statCards = document.querySelectorAll('.stat-card');
    statCards.forEach((card, index) => {
        card.style.animationDelay = `${index * 0.15}s`;
        card.classList.add('stat-card-mobile');
    });
}

// Animar estadísticas cuando aparecen en vista
function animateStatsOnView() {
    const statCards = document.querySelectorAll('.stat-card');
    statCards.forEach((card, index) => {
        setTimeout(() => {
            card.classList.add('bounce-in');

            // Animar el contador después de que aparece la tarjeta
            setTimeout(() => {
                const numberElement = card.querySelector('.stat-number');
                if (numberElement && !numberElement.classList.contains('animated')) {
                    animateSingleCounter(numberElement);
                    numberElement.classList.add('animated');
                }
            }, 200);
        }, index * 150);
    });
}

// Animar un contador individual
function animateSingleCounter(counterElement) {
    const target = +counterElement.getAttribute('data-target');
    const duration = 1200;
    let startTime = null;

    const animate = (currentTime) => {
        if (!startTime) startTime = currentTime;
        const progress = Math.min((currentTime - startTime) / duration, 1);

        const easeOutQuart = 1 - Math.pow(1 - progress, 4);
        const current = Math.floor(easeOutQuart * target);

        counterElement.innerText = current + (target === 100 && progress === 1 ? '%' : progress === 1 ? '+' : '');

        if (progress < 1) {
            requestAnimationFrame(animate);
        } else {
            counterElement.innerText = target + (target === 100 ? '%' : '+');
        }
    };

    requestAnimationFrame(animate);
}

// Optimizaciones de rendimiento para móviles
function optimizeForMobile() {
    // Reducir calidad de video en móviles
    const video = document.querySelector('.background-video');
    if (video && window.innerWidth < 768) {
        video.style.filter = 'blur(1px)'; // Reduce carga de GPU
    }

    // Lazy loading para imágenes del carrusel
    const carouselImages = document.querySelectorAll('.carousel-slide img');
    carouselImages.forEach((img, index) => {
        if (index > 2) { // Solo cargar las primeras 3 imágenes
            img.loading = 'lazy';
        }
    });

    // Debounce para eventos de resize
    let resizeTimeout;
    window.addEventListener('resize', () => {
        clearTimeout(resizeTimeout);
        resizeTimeout = setTimeout(() => {
            handleMobileResize();
        }, 150);
    });
}

// Manejar cambios de orientación y tamaño
function handleMobileResize() {
    // Recalcular alturas después de rotación
    const vh = window.innerHeight * 0.01;
    document.documentElement.style.setProperty('--vh', `${vh}px`);

    // Reposicionar elementos si es necesario
    const heroContent = document.querySelector('.hero-content-layer');
    if (heroContent && window.innerWidth < 768) {
        // Ajustar posición del contenido hero después de rotación
        setTimeout(() => {
            heroContent.style.transition = 'top 0.3s ease';
        }, 100);
    }
}

// Funciones de utilidad para mejorar UX móvil
function addMobileUXEnhancements() {
    // Feedback táctil visual
    const interactiveElements = document.querySelectorAll(
        '.carousel-btn, .indicator, .stat-card, .visit-btn'
    );

    interactiveElements.forEach(element => {
        element.addEventListener('touchstart', function () {
            this.classList.add('touch-active');
        });

        element.addEventListener('touchend', function () {
            setTimeout(() => {
                this.classList.remove('touch-active');
            }, 150);
        });

        element.addEventListener('touchcancel', function () {
            this.classList.remove('touch-active');
        });
    });

    // Prevenir comportamientos no deseados
    document.addEventListener('touchstart', function (e) {
        // Prevenir zoom en doble tap en elementos específicos
        if (e.target.closest('.carousel-wrapper, .stat-card')) {
            e.preventDefault();
        }
    }, { passive: false });

    // Scroll suave mejorado para móviles
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                target.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        });
    });
}

// Auto-inicio de funciones cuando se carga la página
document.addEventListener('DOMContentLoaded', function () {
    if (isTouchDevice) {
        optimizeForMobile();
        addMobileUXEnhancements();

        // Cargar mejoras con delay para no bloquear el render inicial
        setTimeout(() => {
            initMobileEnhancements();
            initSwipeGestures();
            initMobileAnimations();
        }, 100);
    }
});

// Event listeners para orientación
window.addEventListener('orientationchange', function () {
    setTimeout(handleMobileResize, 100);
});

// Funciones para mejorar la experiencia del carrusel en móviles
function enhanceCarouselForMobile() {
    const carouselWrapper = document.querySelector('.carousel-wrapper');
    if (!carouselWrapper) return;

    // Agregar indicador de carga mientras las imágenes cargan
    const images = carouselWrapper.querySelectorAll('img');
    let loadedImages = 0;

    images.forEach(img => {
        if (img.complete) {
            loadedImages++;
        } else {
            img.addEventListener('load', () => {
                loadedImages++;
                if (loadedImages === images.length) {
                    carouselWrapper.classList.add('fully-loaded');
                }
            });
        }
    });

    // Precargar imagen siguiente y anterior
    function preloadAdjacentImages() {
        const totalSlides = document.querySelectorAll('.carousel-slide').length;
        const nextIndex = (currentIndex + 1) % totalSlides;
        const prevIndex = (currentIndex - 1 + totalSlides) % totalSlides;

        const nextImg = document.querySelector(`.carousel-slide:nth-child(${nextIndex + 1}) img`);
        const prevImg = document.querySelector(`.carousel-slide:nth-child(${prevIndex + 1}) img`);

        if (nextImg && !nextImg.classList.contains('preloaded')) {
            nextImg.classList.add('preloaded');
        }
        if (prevImg && !prevImg.classList.contains('preloaded')) {
            prevImg.classList.add('preloaded');
        }
    }

    // Precargar cuando cambia la slide
    const originalUpdateCarousel = window.updateCarousel;
    window.updateCarousel = function () {
        originalUpdateCarousel();
        preloadAdjacentImages();
    };
}

// Mejorar accesibilidad en móviles
function improveMobileAccessibility() {
    // Anunciar cambios de slide a lectores de pantalla
    const carouselTrack = document.getElementById('carouselTrack');
    if (carouselTrack) {
        carouselTrack.setAttribute('aria-live', 'polite');
        carouselTrack.setAttribute('aria-label', 'Carrusel de imágenes');
    }

    // Mejorar navegación por teclado en móviles con teclado
    document.addEventListener('keydown', function (e) {
        if (e.key === 'ArrowLeft') {
            e.preventDefault();
            previousSlide();
        } else if (e.key === 'ArrowRight') {
            e.preventDefault();
            nextSlide();
        }
    });

    // Anunciar cambios en contadores
    const statNumbers = document.querySelectorAll('.stat-number');
    statNumbers.forEach(number => {
        number.setAttribute('aria-live', 'polite');
    });
}

// Inicializar todas las mejoras móviles
function initAllMobileEnhancements() {
    if (window.innerWidth <= 768) {
        enhanceCarouselForMobile();
        improveMobileAccessibility();

        // Agregar clases CSS específicas para móvil
        document.body.classList.add('mobile-enhanced');

        // Debug info para development (remover en producción)
        console.log('Mobile enhancements initialized');
        console.log('Touch device:', isTouchDevice);
        console.log('Screen width:', window.innerWidth);
    }
}

// Event listener final para asegurar que todo se inicialice
window.addEventListener('load', function () {
    initAllMobileEnhancements();
});