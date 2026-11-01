const products = require('../../products');
const ropaUsada = require('../../ropa-usada');

const MAX_QTY = 99;
const MAX_LINEAS = 40;

function obtenerCatalogo() {
    const map = new Map();
    agregar(map, products);
    agregar(map, ropaUsada);
    return map;
}

function agregar(map, lista) {
    if (!Array.isArray(lista)) return;
    for (const item of lista) {
        if (!item || typeof item.id !== 'string') continue;
        if (!Number.isInteger(item.price) || item.price < 1) continue;
        if (map.has(item.id)) continue;
        const name = typeof item.name === 'string' && item.name.trim()
            ? item.name.trim().slice(0, 256)
            : item.id;
        map.set(item.id, { id: item.id, name, price: item.price });
    }
}

function leerCantidad(value) {
    let quantity = null;
    if (typeof value === 'number' && Number.isInteger(value)) {
        quantity = value;
    } else if (typeof value === 'string' && /^[1-9]\d*$/.test(value)) {
        quantity = Number(value);
    }
    if (quantity === null || quantity < 1 || quantity > MAX_QTY) return null;
    return quantity;
}

// El navegador manda el id y la cantidad. El precio y el nombre se ignoran.
function resolverItems(rawItems) {
    if (!Array.isArray(rawItems) || rawItems.length === 0) {
        return { error: 'El carrito está vacío' };
    }
    if (rawItems.length > MAX_LINEAS) {
        return { error: 'El pedido tiene demasiados productos' };
    }

    const catalog = obtenerCatalogo();
    const cantidades = new Map();

    for (const item of rawItems) {
        const id = item && typeof item.id === 'string' ? item.id.trim() : '';
        if (!catalog.has(id)) {
            return { error: 'Hay un producto que no está en el catálogo' };
        }
        const quantity = leerCantidad(item && item.quantity);
        if (quantity === null) {
            return { error: 'Hay una cantidad que no es válida' };
        }
        const acumulada = (cantidades.get(id) || 0) + quantity;
        if (acumulada > MAX_QTY) {
            return { error: 'La cantidad supera el máximo permitido' };
        }
        cantidades.set(id, acumulada);
    }

    const lines = [];
    let total = 0;
    for (const [id, quantity] of cantidades) {
        const product = catalog.get(id);
        lines.push({
            id,
            title: product.name,
            quantity,
            unit_price: product.price
        });
        total += product.price * quantity;
    }

    return { lines, total };
}

module.exports = {
    MAX_QTY,
    obtenerCatalogo,
    resolverItems
};
