// --- Constants ---
const ORDERS_KEY = 'latinoamericana_orders';

// --- State Management ---
let cart = [];
let currentCategory = 'All';
let searchQuery = '';
let currentSort = 'default';

// --- DOM Elements ---
const appContainer = document.getElementById('app-container');
const cartCount = document.getElementById('cart-count');
const cartBtn = document.getElementById('cart-btn');
const closeCartBtn = document.getElementById('close-cart-btn');
const cartSidebar = document.getElementById('cart-sidebar');
const cartOverlay = document.getElementById('cart-overlay');
const cartItemsContainer = document.getElementById('cart-items-container');
const cartTotalPrice = document.getElementById('cart-total-price');

// Navigation Links
const navInicio = document.getElementById('nav-inicio');
const navCatalogo = document.getElementById('nav-catalogo');
const navOfertas = document.getElementById('nav-ofertas');
const navRopaUsada = document.getElementById('nav-ropa-usada');
const logoBtn = document.getElementById('logo-btn');
const footerInicio = document.getElementById('footer-inicio');
const footerCatalogo = document.getElementById('footer-catalogo');
const footerPrivacidad = document.getElementById('footer-privacidad');
const footerTerminos = document.getElementById('footer-terminos');

// --- Hash Routing ---
function routeFromHash() {
    const hash = window.location.hash.slice(1); // strip '#'
    if (!hash || hash === 'home') {
        setActiveNav(navInicio); renderHome();
    } else if (hash === 'catalogo') {
        setActiveNav(navCatalogo); renderCatalog();
    } else if (hash === 'ofertas') {
        setActiveNav(navOfertas); renderOfertas();
    } else if (hash === 'ropa-usada') {
        setActiveNav(navRopaUsada); renderRopaUsada();
    } else if (hash === 'contacto') {
        renderContacto();
    } else if (hash === 'privacidad') {
        setActiveNav(null); renderPrivacidad();
    } else if (hash === 'terminos') {
        setActiveNav(null); renderTerminos();
    } else if (hash === 'devoluciones') {
        setActiveNav(null); renderDevoluciones();
    } else if (hash.startsWith('product/')) {
        renderProductDetail(hash.replace('product/', ''));
    } else {
        setActiveNav(navInicio); renderHome();
    }
    window.scrollTo(0, 0);
}

// --- Initialization ---
function init() {
    loadCartFromStorage();

    const params = new URLSearchParams(window.location.search);
    const estado = params.get('estado');

    if (estado === 'aprobado') {
        history.replaceState({}, '', window.location.pathname);
        renderGracias();
    } else if (estado === 'rechazado') {
        history.replaceState({}, '', window.location.pathname);
        renderPagoRechazado();
    } else if (estado === 'pendiente') {
        history.replaceState({}, '', window.location.pathname);
        renderPagoPendiente();
    } else {
        if (!window.location.hash) {
            history.replaceState(null, '', '#home');
        }
        routeFromHash();
    }

    setupEventListeners();
}

// --- Event Listeners ---
function setupEventListeners() {
    navInicio.addEventListener('click', () => { history.pushState(null, '', '#home'); setActiveNav(navInicio); renderHome(); });
    logoBtn.addEventListener('click', () => { history.pushState(null, '', '#home'); setActiveNav(navInicio); renderHome(); });
    footerInicio.addEventListener('click', (e) => { e.preventDefault(); history.pushState(null, '', '#home'); setActiveNav(navInicio); renderHome(); window.scrollTo(0,0); });

    navCatalogo.addEventListener('click', () => { history.pushState(null, '', '#catalogo'); setActiveNav(navCatalogo); renderCatalog(); });
    footerCatalogo.addEventListener('click', (e) => { e.preventDefault(); history.pushState(null, '', '#catalogo'); setActiveNav(navCatalogo); renderCatalog(); window.scrollTo(0,0); });

    navOfertas.addEventListener('click', () => { history.pushState(null, '', '#ofertas'); setActiveNav(navOfertas); renderOfertas(); window.scrollTo(0,0); });
    navRopaUsada.addEventListener('click', () => { history.pushState(null, '', '#ropa-usada'); setActiveNav(navRopaUsada); renderRopaUsada(); window.scrollTo(0,0); });
    document.getElementById('footer-ropa-usada')?.addEventListener('click', (e) => { e.preventDefault(); history.pushState(null, '', '#ropa-usada'); setActiveNav(navRopaUsada); renderRopaUsada(); window.scrollTo(0,0); });

    footerPrivacidad?.addEventListener('click', (e) => { e.preventDefault(); history.pushState(null, '', '#privacidad'); setActiveNav(null); renderPrivacidad(); window.scrollTo(0,0); });
    footerTerminos?.addEventListener('click', (e) => { e.preventDefault(); history.pushState(null, '', '#terminos'); setActiveNav(null); renderTerminos(); window.scrollTo(0,0); });

    document.getElementById('nav-contacto')?.addEventListener('click', () => { history.pushState(null, '', '#contacto'); renderContacto(); });
    document.getElementById('footer-contacto')?.addEventListener('click', (e) => { e.preventDefault(); history.pushState(null, '', '#contacto'); renderContacto(); window.scrollTo(0,0); });
    document.getElementById('footer-devoluciones')?.addEventListener('click', (e) => { e.preventDefault(); history.pushState(null, '', '#devoluciones'); renderDevoluciones(); window.scrollTo(0,0); });
    document.getElementById('footer-admin')?.addEventListener('click', (e) => { e.preventDefault(); renderAdmin(); window.scrollTo(0,0); });

    // Botón atrás/adelante del navegador
    window.addEventListener('popstate', routeFromHash);

    // Cart Sidebar Toggles
    cartBtn.addEventListener('click', toggleCart);
    closeCartBtn.addEventListener('click', toggleCart);
    cartOverlay.addEventListener('click', toggleCart);
    
    // Checkout btn
    document.getElementById('checkout-btn').addEventListener('click', () => {
        if(cart.length === 0) {
            showToast('Tu carrito está vacío.', 'info');
        } else {
            toggleCart();
            renderCheckout();
            window.scrollTo(0,0);
        }
    });
}

function setActiveNav(element) {
    if(window.currentCarouselInterval) {
        clearInterval(window.currentCarouselInterval);
        window.currentCarouselInterval = null;
    }
    document.querySelectorAll('.nav-header a').forEach(el => el.classList.remove('active'));
    if(element) element.classList.add('active');
}

// --- Routing / Views ---

function renderHome() {
    appContainer.innerHTML = `
        <section class="banner-carousel-container">
            <div class="banner-carousel" id="promo-carousel">
                <div class="promo-banner promo-oferta slide active" style="background-image: url('imagenes_productos/banner-ofertas.png');">
                    <div class="banner-overlay"></div>
                    <div class="banner-content">
                        <h2>¡Ofertas Especiales!</h2>
                        <p>Descubre descuentos increíbles en productos seleccionados.</p>
                        <button class="btn btn-accent" id="btn-banner-ofertas">Ver Ofertas <i class="fa-solid fa-tags" style="margin-left: 8px;"></i></button>
                    </div>
                </div>
                <div class="promo-banner promo-vendido slide" style="background-image: url('imagenes_productos/banner-vendidos.png');">
                    <div class="banner-overlay"></div>
                    <div class="banner-content">
                        <h2>Los Más Vendidos</h2>
                        <p>Nuestros clientes los prefieren. Calidad comprobada.</p>
                        <button class="btn btn-primary" id="btn-banner-vendidos">Ver Favoritos <i class="fa-solid fa-star" style="margin-left: 8px;"></i></button>
                    </div>
                </div>
            </div>
            <button class="carousel-nav prev" id="carousel-prev"><i class="fa-solid fa-chevron-left"></i></button>
            <button class="carousel-nav next" id="carousel-next"><i class="fa-solid fa-chevron-right"></i></button>
            <div class="carousel-indicators">
                <span class="indicator active" data-index="0"></span>
                <span class="indicator" data-index="1"></span>
            </div>
        </section>

        <section class="hero">
            <div class="hero-bg-letter" aria-hidden="true">L</div>
            <div class="hero-content">
                <span class="hero-tagline">Higiene · Cuidado · Calidad</span>
                <h1>Tu Bienestar,<br><em>Nuestra Pasión.</em></h1>
                <p>Descubre nuestra amplia gama de productos de higiene y cuidado personal. Calidad comprobada, precios accesibles, entrega a todo Chile.</p>
                <button class="btn btn-primary hero-cta" id="btn-ver-catalogo">
                    Explorar Catálogo <i class="fa-solid fa-arrow-right" style="margin-left: 8px;"></i>
                </button>
            </div>
        </section>

        <section style="margin-bottom: 60px;">
            <h2 class="section-title">Productos Destacados</h2>
            <div class="product-grid">
                ${products.slice(0, 4).map(product => generateProductCard(product)).join('')}
            </div>
            <div style="text-align: center; margin-top: 30px;">
                <button class="btn" style="background: var(--bg-white); border: 2px solid var(--primary); color: var(--primary);" id="btn-ver-mas">
                    Ver todos los productos
                </button>
            </div>
        </section>

        <section class="packs-home-section">
            <div class="packs-home-header">
                <span class="packs-tagline">Ahorra más comprando juntos</span>
                <h2 class="section-title" style="margin-bottom: 10px;">Nuestros Packs & Combos</h2>
                <p class="packs-subtitle">Combinaciones pensadas para tu hogar. Más productos, mejor precio.</p>
            </div>
            <div class="packs-home-grid">
                ${products.filter(p => p.category === 'Packs & Combos').map(pack => `
                    <div class="pack-home-card">
                        <div class="pack-home-image">
                            <img src="${pack.image}" alt="${pack.name}">
                            ${pack.badge ? `<span class="pack-home-badge">${pack.badge}</span>` : ''}
                        </div>
                        <div class="pack-home-body">
                            <h3 class="pack-home-name">${pack.name}</h3>
                            <div class="pack-home-price">${formatPrice(pack.price)}</div>
                            <ul class="pack-home-items">
                                ${pack.packItems.map(item => `<li><i class="fa-solid fa-check"></i> ${item}</li>`).join('')}
                            </ul>
                            <div class="pack-home-actions">
                                <button class="btn btn-primary view-detail-btn" data-id="${pack.id}" style="flex:1;">Ver Detalles</button>
                                <button class="btn btn-accent add-to-cart-btn" data-id="${pack.id}" style="padding:12px 15px;" title="Agregar al Carrito">
                                    <i class="fa-solid fa-cart-plus"></i>
                                </button>
                            </div>
                        </div>
                    </div>
                `).join('')}
            </div>
        </section>
    `;

    document.getElementById('btn-ver-catalogo').addEventListener('click', () => {
        searchQuery = '';
        currentCategory = 'All';
        history.pushState(null, '', '#catalogo');
        setActiveNav(navCatalogo);
        renderCatalog();
        window.scrollTo(0,0);
    });

    document.getElementById('btn-banner-ofertas').addEventListener('click', () => {
        history.pushState(null, '', '#ofertas');
        setActiveNav(navOfertas);
        renderOfertas();
        window.scrollTo(0,0);
    });

    document.getElementById('btn-banner-vendidos').addEventListener('click', () => {
        searchQuery = 'vendido';
        history.pushState(null, '', '#catalogo');
        setActiveNav(navCatalogo);
        renderCatalog();
        window.scrollTo(0,0);
    });

    document.getElementById('btn-ver-mas').addEventListener('click', () => {
        searchQuery = '';
        currentCategory = 'All';
        history.pushState(null, '', '#catalogo');
        setActiveNav(navCatalogo);
        renderCatalog();
        window.scrollTo(0,0);
    });

    // Carousel Logic
    const slides = document.querySelectorAll('#promo-carousel .slide');
    const indicators = document.querySelectorAll('.carousel-indicators .indicator');
    let currentSlide = 0;
    let slideInterval;

    const goToSlide = (index) => {
        slides[currentSlide].classList.remove('active');
        indicators[currentSlide].classList.remove('active');
        currentSlide = (index + slides.length) % slides.length;
        slides[currentSlide].classList.add('active');
        indicators[currentSlide].classList.add('active');
    };

    const nextSlide = () => goToSlide(currentSlide + 1);
    const prevSlide = () => goToSlide(currentSlide - 1);

    document.getElementById('carousel-next').addEventListener('click', () => {
        nextSlide();
        resetInterval();
    });

    document.getElementById('carousel-prev').addEventListener('click', () => {
        prevSlide();
        resetInterval();
    });

    indicators.forEach(ind => {
        ind.addEventListener('click', (e) => {
            goToSlide(parseInt(e.target.getAttribute('data-index')));
            resetInterval();
        });
    });

    const resetInterval = () => {
        if(slideInterval) clearInterval(slideInterval);
        slideInterval = setInterval(nextSlide, 5000);
    };

    resetInterval();
    window.currentCarouselInterval = slideInterval;

    attachProductCardEvents();
}

function renderOfertas() {
    const ofertaProducts = products.filter(p => p.badge);

    appContainer.innerHTML = `
        <div class="ofertas-hero">
            <div class="ofertas-hero-content">
                <span class="ofertas-tagline">Tiempo Limitado</span>
                <h1>🔥 Ofertas Especiales</h1>
                <p>Los mejores precios en productos seleccionados. ¡No te los pierdas!</p>
            </div>
        </div>

        <section style="margin-bottom: 60px;">
            <div class="product-grid">
                ${ofertaProducts.map(product => generateProductCard(product)).join('')}
            </div>
        </section>
    `;

    attachProductCardEvents();
    window.scrollTo(0, 0);
}

function renderRopaUsada() {
    const categories = ['Todas', ...new Set(ropaUsada.map(p => p.category))];
    const sizes     = ['Todas', ...new Set(ropaUsada.map(p => p.size))];
    const genders   = ['Todos', ...new Set(ropaUsada.map(p => p.gender))];

    let activeCategory = 'Todas';
    let activeGender   = 'Todos';
    let activeSize     = 'Todas';

    function getFiltered() {
        return ropaUsada.filter(item => {
            const catOk  = activeCategory === 'Todas' || item.category === activeCategory;
            const genOk  = activeGender   === 'Todos' || item.gender   === activeGender;
            const sizeOk = activeSize     === 'Todas' || item.size     === activeSize;
            return catOk && genOk && sizeOk;
        });
    }

    function condClass(cond) {
        if (cond === 'Excelente') return 'cond-excelente';
        if (cond === 'Muy Bueno') return 'cond-muy-bueno';
        return 'cond-bueno';
    }

    function generateItemCard(item) {
        const waMsg = encodeURIComponent(`Hola! Me interesa ${item.name} (Talla ${item.size}, ${item.condition}) por $${item.price.toLocaleString('es-CL')}. ¿Está disponible?`);
        return `
            <div class="ru-card">
                <div class="ru-image">
                    <img src="${item.image}" alt="${item.name}" onerror="this.style.opacity='0'">
                    <span class="ru-size-tag">Talla ${item.size}</span>
                    <span class="ru-condition ${condClass(item.condition)}">${item.condition}</span>
                </div>
                <div class="ru-body">
                    <span class="ru-category-label">${item.category} · ${item.gender}</span>
                    <h3 class="ru-name">${item.name}</h3>
                    <p class="ru-desc">${item.description}</p>
                    <div class="ru-footer-row">
                        <span class="ru-price">${formatPrice(item.price)}</span>
                        <a href="https://wa.me/5699999999?text=${waMsg}" target="_blank" rel="noopener" class="btn-wa-ropa">
                            <i class="fa-brands fa-whatsapp"></i> Consultar
                        </a>
                    </div>
                </div>
            </div>
        `;
    }

    function renderGrid() {
        const grid = document.querySelector('.ru-grid');
        if (!grid) return;
        const filtered = getFiltered();
        grid.innerHTML = filtered.length
            ? filtered.map(generateItemCard).join('')
            : '<p class="ru-empty">No hay prendas con esos filtros por ahora.</p>';
    }

    const waVender = encodeURIComponent('Hola! Me gustaría publicar ropa usada en su tienda. ¿Cómo funciona?');

    appContainer.innerHTML = `
        <div class="ru-hero">
            <div class="ru-hero-content">
                <span class="ru-hero-tag">Moda Circular · Sostenible</span>
                <h1>👗 Ropa Usada</h1>
                <p>Prendas cuidadas a precio justo. Dale una segunda vida a la moda.</p>
            </div>
        </div>

        <div class="ru-filters-bar">
            <div class="ru-filter-group">
                <span class="ru-filter-label">Categoría</span>
                <div class="ru-filter-pills">
                    ${categories.map(cat => `<button class="ru-pill${cat === 'Todas' ? ' active' : ''}" data-type="cat" data-val="${cat}">${cat}</button>`).join('')}
                </div>
            </div>
            <div class="ru-filter-group">
                <span class="ru-filter-label">Género</span>
                <div class="ru-filter-pills">
                    ${genders.map(g => `<button class="ru-pill${g === 'Todos' ? ' active' : ''}" data-type="gen" data-val="${g}">${g}</button>`).join('')}
                </div>
            </div>
            <div class="ru-filter-group">
                <span class="ru-filter-label">Talla</span>
                <div class="ru-filter-pills">
                    ${sizes.map(s => `<button class="ru-pill${s === 'Todas' ? ' active' : ''}" data-type="size" data-val="${s}">${s}</button>`).join('')}
                </div>
            </div>
        </div>

        <div class="ru-grid">
            ${getFiltered().map(generateItemCard).join('')}
        </div>

        <div class="ru-cta-box">
            <div class="ru-cta-icon">👗</div>
            <h2>¿Tienes ropa para vender?</h2>
            <p>Contáctanos por WhatsApp y te explicamos cómo publicar tus prendas en nuestra tienda circular.</p>
            <a href="https://wa.me/5699999999?text=${waVender}" target="_blank" rel="noopener" class="btn btn-accent">
                <i class="fa-brands fa-whatsapp"></i> Quiero Vender mi Ropa
            </a>
        </div>
    `;

    document.querySelectorAll('.ru-pill').forEach(pill => {
        pill.addEventListener('click', (e) => {
            const { type, val } = e.target.dataset;
            if (type === 'cat') {
                activeCategory = val;
                document.querySelectorAll('[data-type="cat"]').forEach(p => p.classList.remove('active'));
            } else if (type === 'gen') {
                activeGender = val;
                document.querySelectorAll('[data-type="gen"]').forEach(p => p.classList.remove('active'));
            } else {
                activeSize = val;
                document.querySelectorAll('[data-type="size"]').forEach(p => p.classList.remove('active'));
            }
            e.target.classList.add('active');
            renderGrid();
        });
    });

    window.scrollTo(0, 0);
}

function renderCatalog() {
    const categories = ['All', ...new Set(products.map(p => p.category))];
    
    let filteredProducts = products;
    if (currentCategory !== 'All') {
        filteredProducts = products.filter(p => p.category === currentCategory);
    }

    appContainer.innerHTML = `
        <div style="margin-bottom: 40px; text-align: center;">
            <h1 style="font-size: 2.5rem; margin-bottom: 10px;">Catálogo de Productos</h1>
            <p style="color: var(--text-gray);">Encuentra todo lo que necesitas para tu hogar o negocio.</p>
        </div>

        <div class="controls-container">
            <div class="search-input-wrapper">
                <i class="fa-solid fa-magnifying-glass"></i>
                <input type="text" class="search-input" id="search-input" placeholder="Buscar productos..." value="${searchQuery}">
            </div>
            <select class="sort-select" id="sort-select">
                <option value="default" ${currentSort === 'default' ? 'selected' : ''}>Ordenar por...</option>
                <option value="price-asc" ${currentSort === 'price-asc' ? 'selected' : ''}>Menor Precio</option>
                <option value="price-desc" ${currentSort === 'price-desc' ? 'selected' : ''}>Mayor Precio</option>
            </select>
        </div>

        <div class="filters">
            ${categories.map(cat => `
                <button class="filter-btn ${currentCategory === cat ? 'active' : ''}" data-category="${cat}">
                    ${cat === 'All' ? 'Todos' : cat}
                </button>
            `).join('')}
        </div>

        <div class="product-grid">
            ${filteredProducts.map(product => generateProductCard(product)).join('')}
        </div>
    `;

    // Filter events
    document.querySelectorAll('.filter-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            currentCategory = e.target.getAttribute('data-category');
            renderCatalog();
        });
    });

    // Search & Sort Events
    document.getElementById('search-input').addEventListener('input', (e) => {
        searchQuery = e.target.value.toLowerCase();
        updateProductGrid();
    });

    document.getElementById('sort-select').addEventListener('change', (e) => {
        currentSort = e.target.value;
        updateProductGrid();
    });

    updateProductGrid();
}

function updateProductGrid() {
    let filteredProducts = products;
    
    // 1. Category Filter
    if (currentCategory !== 'All') {
        filteredProducts = filteredProducts.filter(p => p.category === currentCategory);
    }
    
    // 2. Search Filter
    if (searchQuery) {
        filteredProducts = filteredProducts.filter(p => 
            p.name.toLowerCase().includes(searchQuery) || 
            p.description.toLowerCase().includes(searchQuery) || 
            (p.badge && p.badge.toLowerCase().includes(searchQuery))
        );
    }
    
    // 3. Sort
    if (currentSort === 'price-asc') {
        filteredProducts.sort((a, b) => a.price - b.price);
    } else if (currentSort === 'price-desc') {
        filteredProducts.sort((a, b) => b.price - a.price);
    } else {
        // default sort by id
        filteredProducts.sort((a, b) => a.id.localeCompare(b.id));
    }

    const grid = document.querySelector('.product-grid');
    if(grid) {
        if(filteredProducts.length === 0) {
            grid.innerHTML = '<p style="text-align: center; width: 100%; grid-column: 1/-1; color: var(--text-gray); font-size: 1.2rem;">No se encontraron productos.</p>';
        } else {
            grid.innerHTML = filteredProducts.map(product => generateProductCard(product)).join('');
            attachProductCardEvents();
        }
    }
}

function renderProductDetail(productId) {
    const product = products.find(p => p.id === productId);
    if(!product) return;

    appContainer.innerHTML = `
        <a class="back-btn" id="btn-back">
            <i class="fa-solid fa-arrow-left"></i> Volver al Catálogo
        </a>
        <div class="product-detail">
            <div class="product-detail-image">
                <img src="${product.image}" alt="${product.name}">
            </div>
            <div class="product-detail-info">
                <span class="category-tag" style="position: relative; display: inline-block; top: 0; left: 0; margin-bottom: 15px;">${product.category}</span>
                <h2>${product.name}</h2>
                <div class="product-detail-price">${formatPrice(product.price)}</div>
                <p class="product-detail-desc">${product.description}</p>
                <p style="color: var(--text-gray); margin-bottom: 30px; font-size: 0.9rem;">Código: ${product.id}</p>
                
                <button class="btn btn-accent add-to-cart-btn" data-id="${product.id}" style="font-size: 1.1rem; padding: 15px 30px;">
                    <i class="fa-solid fa-cart-plus"></i> Agregar al Carrito
                </button>
            </div>
        </div>
    `;

    document.getElementById('btn-back').addEventListener('click', () => {
        history.pushState(null, '', '#catalogo');
        setActiveNav(navCatalogo);
        renderCatalog();
    });

    document.querySelector('.add-to-cart-btn').addEventListener('click', (e) => {
        addToCart(product.id);
    });
    
    window.scrollTo(0,0);
}

function renderCheckout() {
    let orderSummaryHtml = cart.map(item => `
        <div class="order-item-summary">
            <div>
                <span style="font-weight: 600;">${item.name}</span> <span style="color: var(--text-gray);">x${item.quantity}</span>
            </div>
            <div>${formatPrice(item.price * item.quantity)}</div>
        </div>
    `).join('');

    const total = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);

    appContainer.innerHTML = `
        <div style="margin-bottom: 40px; text-align: center;">
            <h1 style="font-size: 2.5rem; margin-bottom: 10px;">Finalizar Compra</h1>
            <p style="color: var(--text-gray);">Completa tus datos para procesar tu pedido.</p>
        </div>

        <div class="checkout-grid">
            <div class="checkout-container">
                <h3 style="margin-bottom: 20px; font-size: 1.5rem;">Datos Personales</h3>
                <form id="checkout-form" autocomplete="on">
                    <div class="form-group">
                        <label for="cf-nombre">Nombre Completo <span style="color:var(--accent)">*</span></label>
                        <input id="cf-nombre" name="nombre" type="text" class="form-control" required placeholder="Ej: Juan Pérez" autocomplete="name">
                    </div>
                    <div class="form-group">
                        <label for="cf-rut">RUT <span style="color:var(--accent)">*</span></label>
                        <input id="cf-rut" name="rut" type="text" class="form-control" required placeholder="Ej: 12.345.678-9">
                    </div>
                    <div class="form-group">
                        <label for="cf-email">Correo Electrónico <span style="color:var(--accent)">*</span></label>
                        <input id="cf-email" name="email" type="email" class="form-control" required placeholder="ejemplo@correo.cl" autocomplete="email">
                    </div>
                    <div class="form-group">
                        <label for="cf-tel">Teléfono <span style="color:var(--accent)">*</span></label>
                        <input id="cf-tel" name="telefono" type="tel" class="form-control" required placeholder="+56 9 0000 0000" autocomplete="tel">
                    </div>
                    <div class="form-group">
                        <label for="cf-dir">Dirección de Envío <span style="color:var(--accent)">*</span></label>
                        <input id="cf-dir" name="direccion" type="text" class="form-control" required placeholder="Calle, Número, Comuna, Ciudad" autocomplete="street-address">
                    </div>
                    <div class="form-group">
                        <label for="cf-cupon">Cupón de Descuento (Opcional)</label>
                        <input id="cf-cupon" name="cupon" type="text" class="form-control" placeholder="Ingresa tu código aquí">
                    </div>
                    <button type="submit" id="btn-pagar">
                        <img src="/mercadopago-logo.png" alt="Mercado Pago">
                    </button>
                </form>
            </div>
            
            <div class="checkout-container">
                <h3 style="margin-bottom: 20px; font-size: 1.5rem;">Resumen de tu Pedido</h3>
                <div class="order-summary">
                    ${orderSummaryHtml}
                    <div style="display: flex; justify-content: space-between; font-size: 1.5rem; font-weight: 700; margin-top: 20px;">
                        <span>Total:</span>
                        <span>${formatPrice(total)}</span>
                    </div>
                </div>
            </div>
        </div>
    `;

    document.getElementById('checkout-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        const f = e.target;
        const btn = document.getElementById('btn-pagar');

        const externalRef = `LAT-${Date.now()}`;
        const total = cart.reduce((s, i) => s + i.price * i.quantity, 0);

        const orderData = {
            fecha: new Date().toLocaleString('es-CL'),
            ref: externalRef,
            nombre: f.nombre.value,
            rut: f.rut.value,
            email: f.email.value,
            telefono: f.telefono.value,
            direccion: f.direccion.value,
            productos: cart.map(i => `${i.name} x${i.quantity}`).join(' | '),
            total: formatPrice(total),
            totalNum: total,
            estado: 'pendiente_pago'
        };
        saveOrderToStorage(orderData);

        btn.disabled = true;
        btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin" style="margin-right:8px;"></i>Procesando...';

        try {
            const res = await fetch('/.netlify/functions/crear-preferencia', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    items: cart,
                    payer: {
                        nombre: f.nombre.value,
                        email: f.email.value,
                        telefono: f.telefono.value,
                        direccion: f.direccion.value
                    },
                    external_reference: externalRef
                })
            });

            const data = await res.json();

            if (!res.ok) throw new Error(data.error || 'Error al crear preferencia');

            window.location.href = data.checkout_url;

        } catch (err) {
            console.error(err);
            btn.disabled = false;
            btn.innerHTML = '<img src="/mercadopago-logo.png" alt="Mercado Pago">';
            showToast('Error al conectar con Mercado Pago. Intenta de nuevo.', 'error');
        }
    });
}

function renderGracias() {
    const orderNumber = Math.floor(Math.random() * 1000000).toString().padStart(6, '0');

    // Extraer payment_id que Mercado Pago añade a la URL de retorno
    const urlParams = new URLSearchParams(window.location.search);
    const mpPaymentId = urlParams.get('payment_id') || null;

    // Recuperar total del último pedido antes de limpiar el carrito
    const orders = JSON.parse(localStorage.getItem(ORDERS_KEY) || '[]');
    const lastOrder = orders[orders.length - 1];
    const totalNum = lastOrder?.totalNum || 0;

    // Marcar pedido como pagado
    if (lastOrder && lastOrder.estado === 'pendiente_pago') {
        lastOrder.estado = 'pagado';
        lastOrder.nroPedido = orderNumber;
        localStorage.setItem(ORDERS_KEY, JSON.stringify(orders));
    }

    // Guardar venta en Supabase
    if (lastOrder) {
        fetch('/.netlify/functions/guardar-venta', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                nro_pedido: orderNumber,
                fecha: lastOrder.fecha,
                nombre: lastOrder.nombre,
                email: lastOrder.email,
                telefono: lastOrder.telefono,
                direccion: lastOrder.direccion,
                productos: lastOrder.productos,
                total: lastOrder.totalNum,
                estado: 'pagado',
                mp_payment_id: mpPaymentId
            })
        }).catch(err => console.error('Error guardando venta:', err));
    }

    // Limpiar carrito
    cart = [];
    saveCartToStorage();
    updateCartUI();

    // Google Ads — evento de compra
    if (typeof gtag !== 'undefined') {
        gtag('event', 'purchase', {
            transaction_id: orderNumber,
            value: totalNum,
            currency: 'CLP',
            items: []
        });
    }

    appContainer.innerHTML = `
        <div style="text-align: center; max-width: 600px; margin: 40px auto; padding: 40px; background: var(--bg-white); border-radius: var(--radius-lg); box-shadow: var(--shadow-md);">
            <i class="fa-solid fa-circle-check" style="font-size: 5rem; color: var(--secondary); margin-bottom: 20px; animation: bounceIn 0.8s ease;"></i>
            <h1 style="font-size: 2.5rem; margin-bottom: 15px;">¡Gracias por tu compra!</h1>
            <p style="color: var(--text-gray); font-size: 1.1rem; margin-bottom: 30px;">
                Hemos recibido tu pedido correctamente. Hemos enviado un comprobante a tu correo electrónico con los detalles.
            </p>
            <div style="background: var(--bg-light); padding: 20px; border-radius: var(--radius-sm); margin-bottom: 30px;">
                <div style="display: flex; justify-content: space-between; margin-bottom: 12px;">
                    <span style="font-weight: 600;">Número de Orden:</span>
                    <span style="font-size: 1.1rem; color: var(--primary); font-family: 'Outfit', sans-serif;">#${orderNumber}</span>
                </div>
                <div style="display: flex; justify-content: space-between; margin-bottom: 12px;">
                    <span style="font-weight: 600;">Total pagado:</span>
                    <span style="font-size: 1.1rem; color: var(--primary); font-weight: 700;">${formatPrice(totalNum)}</span>
                </div>
                <div style="display: flex; justify-content: space-between;">
                    <span style="font-weight: 600;">Moneda:</span>
                    <span>CLP (Peso Chileno)</span>
                </div>
            </div>
            <button class="btn btn-primary" id="btn-volver-catalogo-gracias" style="font-size: 1.1rem; padding: 15px 30px;">
                Seguir Comprando <i class="fa-solid fa-arrow-right" style="margin-left: 8px;"></i>
            </button>
        </div>
    `;

    document.getElementById('btn-volver-catalogo-gracias').addEventListener('click', () => {
        history.pushState(null, '', '#catalogo');
        setActiveNav(navCatalogo);
        renderCatalog();
        window.scrollTo(0,0);
    });
}

function renderPagoRechazado() {
    appContainer.innerHTML = `
        <div style="text-align: center; max-width: 600px; margin: 40px auto; padding: 40px; background: var(--bg-white); border-radius: var(--radius-lg); box-shadow: var(--shadow-md);">
            <i class="fa-solid fa-circle-xmark" style="font-size: 5rem; color: #e53e3e; margin-bottom: 20px;"></i>
            <h1 style="font-size: 2rem; margin-bottom: 15px;">Pago no procesado</h1>
            <p style="color: var(--text-gray); font-size: 1.1rem; margin-bottom: 30px;">
                Tu pago fue rechazado o cancelado. No se realizó ningún cobro. Puedes intentarlo de nuevo con otro método de pago.
            </p>
            <button class="btn btn-accent" id="btn-reintentar-pago" style="font-size: 1.1rem; padding: 15px 30px; margin-right: 10px;">
                Intentar de nuevo
            </button>
            <button class="btn" style="background: var(--bg-white); border: 2px solid var(--primary); color: var(--primary); font-size: 1.1rem; padding: 15px 30px;" id="btn-volver-catalogo-rechazo">
                Ver Catálogo
            </button>
        </div>
    `;
    document.getElementById('btn-reintentar-pago').addEventListener('click', () => {
        renderCheckout();
        window.scrollTo(0, 0);
    });
    document.getElementById('btn-volver-catalogo-rechazo').addEventListener('click', () => {
        history.pushState(null, '', '#catalogo');
        setActiveNav(navCatalogo);
        renderCatalog();
        window.scrollTo(0, 0);
    });
}

function renderPagoPendiente() {
    appContainer.innerHTML = `
        <div style="text-align: center; max-width: 600px; margin: 40px auto; padding: 40px; background: var(--bg-white); border-radius: var(--radius-lg); box-shadow: var(--shadow-md);">
            <i class="fa-solid fa-clock" style="font-size: 5rem; color: #d69e2e; margin-bottom: 20px;"></i>
            <h1 style="font-size: 2rem; margin-bottom: 15px;">Pago en revisión</h1>
            <p style="color: var(--text-gray); font-size: 1.1rem; margin-bottom: 30px;">
                Tu pago está siendo procesado. Te avisaremos por correo electrónico cuando se confirme. Puedes seguir comprando mientras tanto.
            </p>
            <button class="btn btn-primary" id="btn-volver-catalogo-pendiente" style="font-size: 1.1rem; padding: 15px 30px;">
                Seguir Comprando <i class="fa-solid fa-arrow-right" style="margin-left: 8px;"></i>
            </button>
        </div>
    `;
    document.getElementById('btn-volver-catalogo-pendiente').addEventListener('click', () => {
        history.pushState(null, '', '#catalogo');
        setActiveNav(navCatalogo);
        renderCatalog();
        window.scrollTo(0, 0);
    });
}

function renderContacto() {
    setActiveNav(null);
    document.querySelectorAll('.nav-header a').forEach(el => el.classList.remove('active'));
    const navC = document.getElementById('nav-contacto');
    if (navC) navC.classList.add('active');

    appContainer.innerHTML = `
        <div class="contact-page">
            <div class="contact-hero">
                <h1>Contáctanos</h1>
                <p>Estamos aquí para ayudarte. Escríbenos por cualquiera de nuestros canales y te respondemos a la brevedad.</p>
            </div>

            <div class="contact-cards">
                <div class="contact-card">
                    <div class="contact-card-icon"><i class="fa-brands fa-whatsapp"></i></div>
                    <h3>WhatsApp</h3>
                    <p>Lunes a Sábado<br>9:00 – 18:00 hrs</p>
                    <a href="https://wa.me/5699999999" target="_blank" rel="noopener"
                       style="display:inline-block;margin-top:12px;color:var(--primary);font-weight:700;">
                        +56 9 9999 9999 →
                    </a>
                </div>
                <div class="contact-card">
                    <div class="contact-card-icon"><i class="fa-solid fa-envelope"></i></div>
                    <h3>Correo Electrónico</h3>
                    <p>Respuesta en menos<br>de 24 horas hábiles</p>
                    <a href="mailto:consultalatinoamericana@gmail.com"
                       style="display:inline-block;margin-top:12px;color:var(--primary);font-weight:700;">
                        consultalatinoamericana@gmail.com →
                    </a>
                </div>
                <div class="contact-card">
                    <div class="contact-card-icon"><i class="fa-solid fa-clock"></i></div>
                    <h3>Horario de Atención</h3>
                    <p>Lunes a Viernes<br>9:00 – 18:00 hrs</p>
                    <p style="margin-top:8px;">Sábado<br>9:00 – 13:00 hrs</p>
                </div>
            </div>

            <div class="contact-cta-box">
                <h2>¿Listo para escribirnos?</h2>
                <p>La forma más rápida es por WhatsApp. ¡Te respondemos al tiro!</p>
                <a href="https://wa.me/5699999999?text=Hola%20Latinoamericana%20SpA%2C%20tengo%20una%20consulta"
                   target="_blank" rel="noopener" class="btn-white">
                    <i class="fa-brands fa-whatsapp"></i> Abrir WhatsApp
                </a>
            </div>
        </div>
    `;
    window.scrollTo(0, 0);
}

function renderDevoluciones() {
    setActiveNav(null);
    appContainer.innerHTML = `
        <div class="legal-content">
            <h1 style="text-align:center;margin-bottom:40px;font-size:2.5rem;">Política de Devoluciones</h1>

            <p>En Latinoamericana SpA nos comprometemos con tu satisfacción. Si por algún motivo no quedas conforme con tu compra, contamos con una política de devoluciones clara y sencilla.</p>

            <h2>1. Plazo para Devoluciones</h2>
            <p>Tienes hasta <strong>10 días hábiles</strong> desde la recepción del producto para solicitar una devolución o cambio, conforme a la Ley N° 19.496 del Consumidor de Chile.</p>

            <h2>2. Condiciones del Producto</h2>
            <p>Para que la devolución sea aceptada, el producto debe cumplir las siguientes condiciones:<br><br>
               • Estar sin usar, en su embalaje original y en perfecto estado.<br>
               • No haber sido abierto (en el caso de productos sellados).<br>
               • Incluir todos los accesorios y documentos originales (boleta o factura).</p>

            <h2>3. Productos Excluidos</h2>
            <p>No se aceptan devoluciones en los siguientes casos:<br><br>
               • Productos de higiene personal que hayan sido abiertos o usados (por razones de salud e higiene).<br>
               • Productos con daños causados por mal uso del cliente.<br>
               • Productos fuera del plazo de 10 días hábiles.</p>

            <h2>4. Proceso de Devolución</h2>
            <p>Para iniciar una devolución:<br><br>
               1. Contáctanos por WhatsApp al <strong>+56 9 9999 9999</strong> o al correo <strong>consultalatinoamericana@gmail.com</strong>.<br>
               2. Indícanos tu número de orden, el producto a devolver y el motivo.<br>
               3. Te confirmaremos las instrucciones de envío o retiro.<br>
               4. Una vez recibido e inspeccionado el producto, procesaremos el reembolso o cambio.</p>

            <h2>5. Reembolsos</h2>
            <p>Los reembolsos se realizan por el mismo medio de pago utilizado en la compra, dentro de los <strong>5 a 10 días hábiles</strong> siguientes a la aprobación de la devolución.</p>

            <h2>6. Garantía Legal</h2>
            <p>Todos nuestros productos cuentan con la garantía legal establecida en la Ley N° 19.496 del Consumidor. Si el producto presenta fallas de fabricación o viene en mal estado, tenemos la obligación legal de reponerlo, repararlo o devolver el dinero.</p>

            <h2>7. Contacto</h2>
            <p>📱 WhatsApp: <a href="https://wa.me/5699999999" style="color:var(--primary);">+56 9 9999 9999</a><br>
               ✉️ Email: <a href="mailto:consultalatinoamericana@gmail.com" style="color:var(--primary);">consultalatinoamericana@gmail.com</a></p>
        </div>
    `;
    window.scrollTo(0, 0);
}

function renderPrivacidad() {
    appContainer.innerHTML = `
        <div class="legal-content">
            <h1 style="text-align: center; margin-bottom: 40px; font-size: 2.5rem;">Políticas de Privacidad</h1>
            <p>En Latinoamericana SpA, valoramos y respetamos tu privacidad. Esta política de privacidad describe cómo recopilamos, usamos y protegemos tu información personal cuando visitas nuestro sitio web y utilizas nuestros servicios de comercio electrónico.</p>
            
            <h2>1. Información que Recopilamos</h2>
            <p>Podemos recopilar información personal como tu nombre, dirección de correo electrónico, número de teléfono, dirección de envío y RUT cuando realizas una compra, te registras para obtener una cuenta o te comunicas con nosotros.</p>
            
            <h2>2. Uso de la Información</h2>
            <p>La información que recopilamos se utiliza para procesar y enviar tus pedidos, comunicarnos contigo sobre el estado de tu compra, proporcionarte soporte al cliente y enviarte ofertas promocionales, siempre y cuando hayas dado tu consentimiento para ello.</p>
            
            <h2>3. Protección de Datos</h2>
            <p>Implementamos medidas de seguridad técnicas y organizativas adecuadas para proteger tu información personal contra acceso no autorizado, pérdida, alteración o destrucción. Tu información de pago es procesada por pasarelas de pago seguras y nosotros no almacenamos datos de tarjetas de crédito.</p>
            
            <h2>4. Compartir Información</h2>
            <p>No vendemos ni alquilamos tu información personal a terceros. Podemos compartir tu información con proveedores de servicios de confianza que nos ayudan a operar nuestro negocio (como empresas de paquetería), bajo estrictos acuerdos de confidencialidad.</p>
        </div>
    `;
}

function renderTerminos() {
    appContainer.innerHTML = `
        <div class="legal-content">
            <h1 style="text-align: center; margin-bottom: 40px; font-size: 2.5rem;">Términos y Condiciones</h1>
            <p>Bienvenido a Latinoamericana SpA. Al utilizar nuestro sitio web y realizar compras, aceptas estar sujeto a los siguientes términos y condiciones. Por favor, léelos cuidadosamente antes de usar nuestros servicios.</p>
            
            <h2>1. Condiciones Generales</h2>
            <p>Nos reservamos el derecho de rechazar el servicio a cualquier persona por cualquier motivo y en cualquier momento. Comprendes que tu contenido (sin incluir la información de la tarjeta de crédito) puede ser transferido sin cifrar e involucrar transmisiones a través de varias redes.</p>
            
            <h2>2. Precios y Disponibilidad</h2>
            <p>Todos los precios y la disponibilidad de los productos están sujetos a cambios sin previo aviso. Nos esforzamos por mostrar con la mayor precisión posible los colores y las imágenes de nuestros productos que aparecen en la tienda, pero no podemos garantizar que la visualización del monitor de tu computadora sea precisa.</p>
            
            <h2>3. Facturación y Pagos</h2>
            <p>Aceptamos diversos métodos de pago para tu comodidad. Te comprometes a proporcionar información de compra y cuenta actual, completa y precisa para todas las compras realizadas en nuestra tienda. </p>
            
            <h2>4. Devoluciones y Reembolsos</h2>
            <p>Nuestra política de devoluciones dura 30 días. Si han pasado 30 días desde tu compra, desafortunadamente no podemos ofrecerte un reembolso ni un cambio. Para ser elegible para una devolución, tu artículo debe estar sin usar y en las mismas condiciones en que lo recibiste.</p>
        </div>
    `;
}

// --- Components ---
function generateProductCard(product) {
    const badgeHtml = product.badge ? `<span class="product-badge">${product.badge}</span>` : '';
    const packItemsHtml = product.packItems
        ? `<ul class="pack-items-list">${product.packItems.map(i => `<li><i class="fa-solid fa-check"></i> ${i}</li>`).join('')}</ul>`
        : '';
    return `
        <div class="product-card${product.packItems ? ' pack-card' : ''}">
            <div class="image-wrapper">
                ${badgeHtml}
                <span class="category-tag">${product.category}</span>
                <img src="${product.image}" alt="${product.name}" class="product-image">
            </div>
            <div class="product-info">
                <h3 class="product-title">${product.name}</h3>
                <div class="product-price">${formatPrice(product.price)}</div>
                <p class="product-desc">${product.description}</p>
                ${packItemsHtml}
                <div style="display: flex; gap: 10px; margin-top: 15px;">
                    <button class="btn btn-primary view-detail-btn" data-id="${product.id}" style="flex: 1;">Ver Detalles</button>
                    <button class="btn btn-accent add-to-cart-btn" data-id="${product.id}" style="padding: 12px 15px;" title="Agregar al Carrito">
                        <i class="fa-solid fa-cart-plus"></i>
                    </button>
                </div>
            </div>
        </div>
    `;
}

function attachProductCardEvents() {
    document.querySelectorAll('.view-detail-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const productId = e.currentTarget.getAttribute('data-id');
            history.pushState(null, '', '#product/' + productId);
            renderProductDetail(productId);
        });
    });

    document.querySelectorAll('.add-to-cart-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            addToCart(e.currentTarget.getAttribute('data-id'));
        });
    });
}

// --- Cart Logic ---

function toggleCart() {
    cartSidebar.classList.toggle('active');
    cartOverlay.classList.toggle('active');
    if (cartSidebar.classList.contains('active')) {
        document.body.style.overflow = 'hidden';
    } else {
        document.body.style.overflow = '';
    }
}

function addToCart(productId) {
    const product = products.find(p => p.id === productId);
    const existingItem = cart.find(item => item.id === productId);

    if (existingItem) {
        existingItem.quantity += 1;
    } else {
        cart.push({ ...product, quantity: 1 });
    }

    saveCartToStorage();
    updateCartUI();
    
    showToast(`"${product.name}" agregado al carrito`, 'success');
}

function updateCartItemQuantity(productId, delta) {
    const item = cart.find(item => item.id === productId);
    if (item) {
        item.quantity += delta;
        if (item.quantity <= 0) {
            cart = cart.filter(i => i.id !== productId);
        }
        saveCartToStorage();
        updateCartUI();
    }
}

function removeCartItem(productId) {
    cart = cart.filter(item => item.id !== productId);
    saveCartToStorage();
    updateCartUI();
}

function updateCartUI() {
    // Update Badge
    const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
    cartCount.textContent = totalItems;
    
    if (totalItems > 0) {
        cartCount.style.display = 'flex';
        cartBtn.style.borderColor = 'var(--primary-light)';
    } else {
        cartCount.style.display = 'none';
        cartBtn.style.borderColor = 'transparent';
    }

    // Update Sidebar
    if (cart.length === 0) {
        cartItemsContainer.innerHTML = '<div class="empty-cart-msg">Tu carrito está vacío</div>';
        cartTotalPrice.textContent = '$0';
        return;
    }

    let cartHtml = '';
    let totalCost = 0;

    cart.forEach(item => {
        totalCost += item.price * item.quantity;
        cartHtml += `
            <div class="cart-item">
                <img src="${item.image}" alt="${item.name}" class="cart-item-img">
                <div class="cart-item-info">
                    <h4>${item.name}</h4>
                    <p>${formatPrice(item.price)}</p>
                    <div class="qty-controls">
                        <button class="qty-btn minus-btn" data-id="${item.id}">-</button>
                        <span>${item.quantity}</span>
                        <button class="qty-btn plus-btn" data-id="${item.id}">+</button>
                    </div>
                </div>
                <button class="remove-item" data-id="${item.id}"><i class="fa-solid fa-trash"></i></button>
            </div>
        `;
    });

    cartItemsContainer.innerHTML = cartHtml;
    cartTotalPrice.textContent = formatPrice(totalCost);

    // Attach cart events
    document.querySelectorAll('.minus-btn').forEach(btn => {
        btn.addEventListener('click', (e) => updateCartItemQuantity(e.currentTarget.getAttribute('data-id'), -1));
    });
    
    document.querySelectorAll('.plus-btn').forEach(btn => {
        btn.addEventListener('click', (e) => updateCartItemQuantity(e.currentTarget.getAttribute('data-id'), 1));
    });

    document.querySelectorAll('.remove-item').forEach(btn => {
        btn.addEventListener('click', (e) => removeCartItem(e.currentTarget.getAttribute('data-id')));
    });
}

// --- Utils ---
function showToast(message, type = 'info') {
    const container = document.getElementById('toast-container');
    if(!container) return;

    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    
    let iconClass = 'fa-info-circle';
    if(type === 'success') iconClass = 'fa-check-circle';
    if(type === 'error') iconClass = 'fa-exclamation-circle';

    toast.innerHTML = `
        <i class="fa-solid ${iconClass} toast-icon"></i>
        <span>${message}</span>
    `;

    container.appendChild(toast);

    // Trigger animation
    setTimeout(() => toast.classList.add('show'), 10);

    // Remove
    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => toast.remove(), 400);
    }, 3000);
}

function formatPrice(price) {
    return '$' + price.toLocaleString('es-CL');
}

function saveCartToStorage() {
    localStorage.setItem('latinoamericana_cart', JSON.stringify(cart));
}

function loadCartFromStorage() {
    const savedCart = localStorage.getItem('latinoamericana_cart');
    if (savedCart) {
        cart = JSON.parse(savedCart);
    }
    updateCartUI();
}

// --- Orders / CSV Export ---
function saveOrderToStorage(orderData) {
    const orders = JSON.parse(localStorage.getItem(ORDERS_KEY) || '[]');
    orders.push(orderData);
    localStorage.setItem(ORDERS_KEY, JSON.stringify(orders));
}

function exportOrdersToCSV() {
    const orders = JSON.parse(localStorage.getItem(ORDERS_KEY) || '[]');
    if (orders.length === 0) {
        showToast('No hay pedidos registrados aún.', 'info');
        return;
    }
    const headers = ['Fecha', 'Nombre', 'RUT', 'Email', 'Teléfono', 'Dirección', 'Productos', 'Total'];
    const rows = orders.map(o => [
        o.fecha, o.nombre, o.rut, o.email, o.telefono, o.direccion, o.productos, o.total
    ].map(v => `"${(v || '').toString().replace(/"/g, '""')}"`));
    const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\r\n');
    const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `pedidos-latinoamericana-${new Date().toISOString().slice(0,10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
}

function renderAdmin() {
    const orders = JSON.parse(localStorage.getItem(ORDERS_KEY) || '[]');
    setActiveNav(null);

    const rowsHtml = orders.length === 0
        ? `<tr><td colspan="8" style="text-align:center;padding:32px;color:var(--text-gray);">Sin pedidos registrados todavía.</td></tr>`
        : orders.map((o, i) => `
            <tr>
                <td>${i + 1}</td>
                <td>${o.fecha || ''}</td>
                <td><strong>${o.nombre || ''}</strong></td>
                <td>${o.email || ''}</td>
                <td>${o.telefono || ''}</td>
                <td style="max-width:180px;word-break:break-word;">${o.productos || ''}</td>
                <td><strong style="color:var(--primary)">${o.total || ''}</strong></td>
            </tr>`).join('');

    appContainer.innerHTML = `
        <div class="admin-page">
            <div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:16px;margin-bottom:8px;">
                <div>
                    <h1 style="font-size:2rem;margin-bottom:4px;">Registro de Pedidos</h1>
                    <p style="color:var(--text-gray);font-size:0.9rem;">${orders.length} pedido(s) almacenado(s) en este navegador.</p>
                </div>
                <button class="btn-export" onclick="exportOrdersToCSV()">
                    <i class="fa-solid fa-file-excel"></i> Exportar a Excel (CSV)
                </button>
            </div>
            <div class="admin-table-wrap">
                <table class="admin-table">
                    <thead>
                        <tr>
                            <th>#</th><th>Fecha</th><th>Nombre</th><th>Email</th>
                            <th>Teléfono</th><th>Productos</th><th>Total</th>
                        </tr>
                    </thead>
                    <tbody>${rowsHtml}</tbody>
                </table>
            </div>
            ${orders.length > 0 ? `
            <p style="margin-top:16px;font-size:0.82rem;color:var(--text-gray);">
                <i class="fa-solid fa-circle-info"></i>
                Los datos se almacenan en este navegador. Exporta el CSV regularmente para respaldo.
            </p>` : ''}
        </div>
    `;
    window.scrollTo(0, 0);
}

// Boot the app
document.addEventListener('DOMContentLoaded', init);
