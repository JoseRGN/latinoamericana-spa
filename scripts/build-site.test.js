const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');

const root = path.join(__dirname, '..');
const out = path.join(root, 'public');

test('la carpeta publicada tiene la tienda y no los archivos internos', () => {
    execFileSync(process.execPath, [path.join(root, 'scripts', 'build-site.js')], { cwd: root });

    for (const archivo of ['index.html', 'app.js', 'products.js', 'ropa-usada.js', 'portfolio.html', 'logo.png', 'logo-latinoamericana.webp', 'ecommerce-styles.css']) {
        assert.equal(fs.existsSync(path.join(out, archivo)), true, archivo);
    }
    assert.equal(fs.existsSync(path.join(out, 'imagenes_productos', 'AC-001.jpg')), true);

    for (const prohibido of ['CLAUDE.md', 'scripts', 'skills-lock.json', 'Documentos del negocio', 'netlify', 'api', 'test_image.jpg', 'LATINOAMERICANA SPA']) {
        assert.equal(fs.existsSync(path.join(out, prohibido)), false, prohibido);
    }

    const publicados = fs.readdirSync(out);
    assert.equal(publicados.some(nombre => nombre.endsWith('.xlsx') || nombre.endsWith('.docx')), false);
    const portfolio = fs.readFileSync(path.join(out, 'portfolio.html'), 'utf8');
    assert.equal(portfolio.includes('Documentos del negocio'), false);
    assert.equal(portfolio.includes('logo-latinoamericana.webp'), true);
});
