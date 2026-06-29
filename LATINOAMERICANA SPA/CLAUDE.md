# Latinoamericana SpA — E-Commerce

## Descripción del proyecto

Tienda e-commerce estática para **Latinoamericana SpA**, empresa chilena distribuidora de productos de cuidado personal y del hogar. El sitio es una Single Page Application (SPA) construida sin frameworks, usando HTML, CSS y JavaScript vanilla.

## Arquitectura

```
├── index.html              # Shell del SPA — contiene header, nav, carrito y footer
├── app.js                  # Toda la lógica de la aplicación (routing, renderizado, carrito)
├── products.js             # Catálogo de productos (array de objetos)
├── ecommerce-styles.css    # Estilos globales
├── imagenes_productos/     # Imágenes de productos (nombradas por ID, ej: AC-001.jpg)
├── Documentos del negocio/ # Assets de marca: logos, manuales, planillas
└── download_images.*       # Scripts utilitarios para descarga masiva de imágenes
```

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

- Se guarda en `localStorage` bajo la clave `latinoamericana_orders`
- La función `toggleCart()` abre/cierra el sidebar
- El checkout genera un pedido por WhatsApp (no hay pasarela de pago integrada)

## Comandos útiles

```bash
# Abrir el sitio localmente (no requiere servidor, pero con uno se evitan problemas de CORS con imágenes)
python -m http.server 8080
# o
npx serve .
```

## Imágenes de productos

Las imágenes deben estar en `imagenes_productos/` con el nombre `{ID}.jpg` (ej: `AC-001.jpg`).
Los scripts `download_images.py` / `download_images.ps1` automatizan la descarga desde URLs externas.

## Contexto de negocio

- Empresa: Latinoamericana SpA (Chile)
- Moneda: CLP (pesos chilenos)
- Canal de venta principal: WhatsApp
- Sin pasarela de pago — el carrito genera un mensaje de pedido por WhatsApp
