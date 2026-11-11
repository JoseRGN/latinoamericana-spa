# Latinoamericana SpA — E-Commerce

## Descripción del proyecto

Tienda e-commerce estática para **Latinoamericana SpA**, empresa chilena distribuidora de productos de cuidado personal y del hogar. El sitio es una Single Page Application (SPA) construida sin frameworks, usando HTML, CSS y JavaScript vanilla.

## Arquitectura

```
├── index.html              # Shell del SPA — contiene header, nav, carrito y footer
├── app.js                  # Toda la lógica de la aplicación (routing, renderizado, carrito)
├── products.js             # Catálogo de productos (array de objetos). También lo usa el servidor.
├── ropa-usada.js           # Catálogo de ropa usada
├── ecommerce-styles.css    # Estilos globales
├── imagenes_productos/     # Imágenes de productos (nombradas por ID, ej: AC-001.jpg)
├── netlify/functions/      # Mercado Pago, registro de ventas y correos
├── scripts/build-site.js   # Arma la carpeta public/ que Netlify publica
└── scripts/download_images.* # Utilidad para descarga masiva de imágenes (no se publica)
```

Netlify publica solo `public/`. No vuelvas a dejar planillas, manuales ni precios internos en el repositorio ni en esa carpeta.

## Stack técnico

- **HTML/CSS/JS vanilla** — sin frameworks, sin bundler, sin dependencias de runtime
- **Font Awesome 6.4** — iconos (CDN)
- **Google Fonts** — tipografía (CDN)
- **localStorage** — persistencia del carrito (`latinoamericana_orders`)

## Convenciones del catálogo

Cada producto en `products.js` sigue esta estructura:

```js
{
  id: "XX-000",           // Código único: 2 letras categoría + 3 dígitos
  category: "...",        // Categoría de filtrado
  name: "...",
  description: "...",
  price: 0000,            // En pesos chilenos (CLP), número entero
  badge: "...",           // Opcional: etiqueta promocional ("🔥 Más Vendido", "⭐ Oferta")
  image: "imagenes_productos/XX-000.jpg"
}
```

## Vistas / secciones renderizadas por app.js

- **Inicio** (`renderHome`) — hero, beneficios, productos destacados
- **Catálogo** (`renderCatalog`) — filtros por categoría, búsqueda, ordenamiento
- **Detalle de producto** (`renderProductDetail`)
- **Contacto** (`renderContacto`)
- **Privacidad** (`renderPrivacidad`)
- **Términos** (`renderTerminos`)
- **Devoluciones** (`renderDevoluciones`)
- **Admin** (`renderAdmin`) — vista de órdenes guardadas en localStorage

## Carrito

- Se guarda en `localStorage` bajo la clave `latinoamericana_cart`
- Los pedidos locales se guardan en `latinoamericana_orders`
- La función `toggleCart()` abre/cierra el sidebar
- El checkout cobra con Mercado Pago. El precio lo calcula el servidor desde el catálogo, no el navegador.

## Comandos útiles

```bash
# Abrir el sitio localmente (no requiere servidor, pero con uno se evitan problemas de CORS con imágenes)
python -m http.server 8080
# o
npx serve .
```

## Imágenes de productos

Las imágenes publicadas viven en `imagenes_productos/` con el nombre `{ID}.jpg` (ej: `AC-001.jpg`), JPEG 400×400.

### Fotos reales (flujo recomendado)

1. Deja las fotos en `imagenes_reales/` nombradas por ID (`SH-002.jpg`, `PK-026.png`, etc.).
2. Ejecuta `node scripts/apply-real-images.js` — valida el ID, convierte a JPEG 400×400 y reemplaza en `imagenes_productos/`.
3. `imagenes_reales/` es solo staging: no se publica en Netlify.

Los scripts `download_images.py` / `download_images.ps1` automatizan la descarga desde URLs externas.

## Contexto de negocio

- Empresa: Latinoamericana SpA (Chile)
- Moneda: CLP (pesos chilenos)
- Canal de contacto: WhatsApp
- El pago del carrito se hace con Mercado Pago
