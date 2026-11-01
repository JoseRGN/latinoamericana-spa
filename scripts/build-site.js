const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');
const out = path.join(root, 'public');

const archivos = [
    'index.html',
    'portfolio.html',
    'app.js',
    'products.js',
    'ropa-usada.js',
    'ecommerce-styles.css',
    'logo.png',
    'logo-latinoamericana.webp',
    'robots.txt',
    'sitemap.xml'
];

const carpetas = ['imagenes_productos'];

const prohibidos = [
    'CLAUDE.md',
    'scripts',
    'skills-lock.json',
    'Documentos del negocio',
    'netlify',
    'api',
    'test_image.jpg',
    'LATINOAMERICANA SPA',
    '.git'
];

fs.rmSync(out, { recursive: true, force: true });
fs.mkdirSync(out, { recursive: true });

for (const archivo of archivos) {
    const origen = path.join(root, archivo);
    if (!fs.existsSync(origen)) {
        throw new Error(`Falta el archivo del sitio: ${archivo}`);
    }
    fs.copyFileSync(origen, path.join(out, archivo));
}

for (const carpeta of carpetas) {
    fs.cpSync(path.join(root, carpeta), path.join(out, carpeta), { recursive: true });
}

for (const nombre of prohibidos) {
    if (fs.existsSync(path.join(out, nombre))) {
        throw new Error(`No se debe publicar: ${nombre}`);
    }
}

console.log('Sitio listo en public/ (sin documentos internos ni archivos de desarrollo).');
