#!/usr/bin/env node
/**
 * Aplica fotos reales de productos a la tienda.
 *
 * Uso:
 *   1. Deja las fotos en imagenes_reales/ con el nombre del producto: AC-001.jpg
 *      (también acepta .jpeg, .png, .webp)
 *   2. node scripts/apply-real-images.js
 *
 * El script valida el ID contra products.js, convierte a JPEG 400x400
 * y escribe en imagenes_productos/{ID}.jpg. imagenes_reales/ no se publica.
 */

const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');

const root = path.join(__dirname, '..');
const staging = path.join(root, 'imagenes_reales');
const destDir = path.join(root, 'imagenes_productos');
const productsPath = path.join(root, 'products.js');

const EXT = new Set(['.jpg', '.jpeg', '.png', '.webp']);

function loadProductIds() {
    const src = fs.readFileSync(productsPath, 'utf8');
    const ids = [...src.matchAll(/id:\s*"([A-Z0-9-]+)"/g)].map((m) => m[1]);
    return new Set(ids);
}

function ensurePillow() {
    try {
        execFileSync('python3', ['-c', 'from PIL import Image'], { stdio: 'ignore' });
    } catch {
        console.error('Falta Pillow. Instala con: pip install pillow');
        process.exit(1);
    }
}

function convertToCatalogJpeg(srcPath, destPath) {
    const script = `
from PIL import Image
im = Image.open(${JSON.stringify(srcPath)}).convert("RGB")
im = im.resize((400, 400), Image.Resampling.LANCZOS)
im.save(${JSON.stringify(destPath)}, "JPEG", quality=85, optimize=True)
print("ok")
`;
    execFileSync('python3', ['-c', script], { stdio: 'inherit' });
}

function main() {
    if (!fs.existsSync(staging)) {
        fs.mkdirSync(staging, { recursive: true });
        console.log(`Carpeta creada: imagenes_reales/`);
        console.log('Deja ahí las fotos como AC-001.jpg y vuelve a ejecutar este script.');
        return;
    }

    const ids = loadProductIds();
    const files = fs.readdirSync(staging).filter((name) => {
        const ext = path.extname(name).toLowerCase();
        return EXT.has(ext) && !name.startsWith('.');
    });

    if (files.length === 0) {
        console.log('No hay imágenes en imagenes_reales/.');
        console.log('Nómbralas por ID de producto, ej: SH-002.jpg, PK-026.png');
        return;
    }

    ensurePillow();

    let ok = 0;
    let skipped = 0;

    for (const file of files) {
        const id = path.basename(file, path.extname(file)).toUpperCase();
        if (!ids.has(id)) {
            console.warn(`Omitido ${file}: no hay producto con id "${id}" en products.js`);
            skipped += 1;
            continue;
        }

        const srcPath = path.join(staging, file);
        const destPath = path.join(destDir, `${id}.jpg`);
        convertToCatalogJpeg(srcPath, destPath);
        console.log(`Aplicada ${file} → imagenes_productos/${id}.jpg`);
        ok += 1;
    }

    console.log(`Listo: ${ok} aplicadas, ${skipped} omitidas.`);
}

main();
