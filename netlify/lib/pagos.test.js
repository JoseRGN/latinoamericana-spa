const { test, beforeEach, afterEach } = require('node:test');
const assert = require('node:assert/strict');

const { resolverItems } = require('./catalogo');
const {
    armarPreferencia,
    construirVentaDesdePago,
    escaparHtml,
    idDesdeNotificacion
} = require('./pagos');
const { handler: crearPreferencia } = require('../functions/crear-preferencia');
const { handler: guardarVenta } = require('../functions/guardar-venta');
const { handler: enviarConfirmacion } = require('../functions/enviar-confirmacion');
const { handler: webhook } = require('../functions/mp-webhook');

const originalFetch = global.fetch;
let llamadas;

function jsonResponse(status, body) {
    return {
        ok: status >= 200 && status < 300,
        status,
        json: async () => body,
        text: async () => (typeof body === 'string' ? body : JSON.stringify(body))
    };
}

beforeEach(() => {
    llamadas = [];
    process.env.MP_ACCESS_TOKEN = 'token-de-prueba';
    process.env.SUPABASE_URL = 'https://supabase.test';
    process.env.SUPABASE_KEY = 'service-role-test';
    process.env.SENDGRID_API_KEY = 'sg-test';
    global.fetch = async (url, options = {}) => {
        const target = String(url);
        const body = options.body ? JSON.parse(options.body) : null;
        llamadas.push({ url: target, method: options.method || 'GET', body, headers: options.headers });
        if (target.includes('/checkout/preferences')) {
            return jsonResponse(200, { id: 'pref-1', init_point: 'https://www.mercadopago.cl/checkout/v1/redirect?pref_id=pref-1' });
        }
        if (target.includes('/v1/payments/')) {
            return jsonResponse(200, pagoDePrueba());
        }
        if (target.includes('/merchant_orders/')) {
            return jsonResponse(200, { items: [{ id: 'SH-002', quantity: 1, unit_price: 1 }] });
        }
        if (target.includes('/rest/v1/ventas?')) {
            return jsonResponse(200, []);
        }
        if (target.includes('/rest/v1/ventas')) {
            return jsonResponse(201, {});
        }
        if (target.includes('api.sendgrid.com')) {
            return jsonResponse(202, '');
        }
        throw new Error('URL inesperada ' + target);
    };
});

afterEach(() => {
    global.fetch = originalFetch;
});

function pagoDePrueba(extra) {
    return {
        id: 555001,
        status: 'approved',
        status_detail: 'accredited',
        currency_id: 'CLP',
        transaction_amount: 16390,
        transaction_amount_refunded: 0,
        external_reference: 'LAT-12345',
        date_approved: '2026-11-01T18:00:00.000Z',
        metadata: {
            nombre: 'Ana Pérez',
            email: 'ana@cliente.cl',
            telefono: '+56 9 1234 5678',
            direccion: 'Av. Siempre Viva 123, Santiago',
            items: JSON.stringify([{ id: 'AC-001', q: 2 }, { id: 'PK-026', q: 1 }])
        },
        payer: { email: 'cuenta-mp@test.cl' },
        ...extra
    };
}

function evento(body, headers) {
    return {
        httpMethod: 'POST',
        headers: headers || { origin: 'https://latinoamericanaspa.com', host: 'latinoamericanaspa.com' },
        body: JSON.stringify(body)
    };
}

test('el catálogo cobra el precio real e ignora el precio enviado', () => {
    const result = resolverItems([
        { id: 'AC-001', name: 'Gratis', price: 1, quantity: 2 },
        { id: 'PK-026', name: 'Pack hack', price: 10, quantity: 1 },
        { id: 'RU-001', price: 1, quantity: '1' }
    ]);
    assert.equal(result.error, undefined);
    assert.equal(result.lines[0].title, 'Acondicionador');
    assert.equal(result.lines[0].unit_price, 4000);
    assert.equal(result.lines[1].title, 'Kit Básico Limpieza');
    assert.equal(result.lines[1].unit_price, 8390);
    assert.equal(result.lines[2].unit_price, 2500);
    assert.equal(result.total, 4000 * 2 + 8390 + 2500);
});

test('rechaza códigos desconocidos y cantidades inválidas', () => {
    assert.match(resolverItems([{ id: 'NO-EXISTE', quantity: 1 }]).error, /catálogo/);
    assert.match(resolverItems([{ id: 'AC-001', quantity: 0 }]).error, /cantidad/i);
    assert.match(resolverItems([{ id: 'AC-001', quantity: -1 }]).error, /cantidad/i);
    assert.match(resolverItems([{ id: 'AC-001', quantity: 1.5 }]).error, /cantidad/i);
    assert.match(resolverItems([{ id: 'AC-001', quantity: 100 }]).error, /cantidad/i);
    assert.match(resolverItems([]).error, /vacío/);
});

test('suma cantidades repetidas del mismo producto', () => {
    const result = resolverItems([
        { id: 'SH-002', quantity: 1 },
        { id: 'SH-002', quantity: 2 }
    ]);
    assert.equal(result.lines.length, 1);
    assert.equal(result.lines[0].quantity, 3);
    assert.equal(result.total, 3500 * 3);
});

test('la preferencia usa el precio del catálogo y no el del navegador', async () => {
    const res = await crearPreferencia(evento({
        items: [{ id: 'AC-001', name: 'Gratis', price: 1, quantity: 2 }],
        payer: {
            nombre: 'Ana Pérez',
            email: 'ana@cliente.cl',
            telefono: '+56 9 1234 5678',
            direccion: 'Av. Siempre Viva 123'
        },
        external_reference: 'LAT-12345'
    }));
    const body = JSON.parse(res.body);
    assert.equal(res.statusCode, 200);
    assert.equal(body.checkout_url.includes('mercadopago'), true);

    const preference = llamadas.find(c => c.url.includes('/checkout/preferences')).body;
    assert.equal(preference.items[0].unit_price, 4000);
    assert.equal(preference.items[0].title, 'Acondicionador');
    assert.equal(preference.items[0].quantity, 2);
    assert.equal(preference.items[0].currency_id, 'CLP');
    assert.deepEqual(JSON.parse(preference.metadata.items), [{ id: 'AC-001', q: 2 }]);
    assert.equal(preference.notification_url, 'https://latinoamericanaspa.com/.netlify/functions/mp-webhook');
    assert.equal(preference.back_urls.success, 'https://latinoamericanaspa.com/?estado=aprobado');
});

test('no crea una preferencia con un producto inventado ni redirige a otro sitio', async () => {
    const malo = await crearPreferencia(evento({
        items: [{ id: 'FALSO', price: 1, quantity: 1 }],
        payer: { nombre: 'Ana', email: 'ana@cliente.cl', telefono: '912345678', direccion: 'Calle 1' }
    }));
    assert.equal(malo.statusCode, 400);
    assert.equal(llamadas.length, 0);

    const origen = await crearPreferencia(evento({
        items: [{ id: 'AC-001', quantity: 1 }],
        payer: { nombre: 'Ana', email: 'ana@cliente.cl', telefono: '912345678', direccion: 'Calle 1' }
    }, { origin: 'https://sitio-malo.example', host: 'latinoamericanaspa.com' }));
    const preference = llamadas.find(c => c.url.includes('/checkout/preferences')).body;
    assert.equal(origen.statusCode, 200);
    assert.equal(preference.back_urls.success.startsWith('https://latinoamericanaspa.com/'), true);
});

test('un pago aprobado se guarda con el total del catálogo, no con el del cliente', async () => {
    const res = await guardarVenta(evento({
        mp_payment_id: '555001',
        total: 1,
        nombre: 'Hacker',
        email: 'victim@evil.com',
        productos: 'Nada x1',
        estado: 'pagado'
    }));
    assert.equal(res.statusCode, 200);
    const body = JSON.parse(res.body);
    assert.equal(body.total, 16390);
    assert.equal(body.nro_pedido, 'LAT-12345');

    const insert = llamadas.find(c => c.method === 'POST' && c.url.endsWith('/rest/v1/ventas'));
    assert.equal(insert.body.total, 16390);
    assert.equal(insert.body.nombre, 'Ana Pérez');
    assert.equal(insert.body.email, 'ana@cliente.cl');
    assert.equal(insert.body.estado, 'pagado');
    assert.equal(insert.body.mp_payment_id, '555001');
    assert.match(insert.body.productos, /Acondicionador x2/);
    assert.match(insert.body.productos, /Kit Básico Limpieza x1/);
});

test('rechaza un pago cuyo monto no coincide o que no está aprobado', async () => {
    global.fetch = async (url) => {
        if (String(url).includes('/v1/payments/')) {
            return jsonResponse(200, pagoDePrueba({ transaction_amount: 1 }));
        }
        throw new Error('No debería guardar la venta');
    };
    const monto = await guardarVenta(evento({ mp_payment_id: '555001', total: 1 }));
    assert.equal(monto.statusCode, 409);

    global.fetch = async (url) => {
        if (String(url).includes('/v1/payments/')) {
            return jsonResponse(200, pagoDePrueba({ status: 'rejected' }));
        }
        throw new Error('No debería guardar la venta');
    };
    const rechazado = await guardarVenta(evento({ mp_payment_id: '555001' }));
    assert.equal(rechazado.statusCode, 409);

    const sinId = await guardarVenta(evento({ total: 1, email: 'a@b.cl' }));
    assert.equal(sinId.statusCode, 400);
});

test('el correo sale solo al cliente del pago verificado y con el total real', async () => {
    const res = await enviarConfirmacion(evento({
        mp_payment_id: '555001',
        email: 'victim@evil.com',
        nombre: '<script>alert(1)</script>',
        total: '$1',
        productos: 'Regalado x99'
    }));
    assert.equal(res.statusCode, 200);
    const correos = llamadas.filter(c => c.url.includes('api.sendgrid.com'));
    assert.equal(correos.length, 2);
    assert.equal(correos[0].body.personalizations[0].to[0].email, 'ana@cliente.cl');
    assert.equal(correos[1].body.personalizations[0].to[0].email, 'consultalatinoamericana@gmail.com');
    const html = correos[0].body.content[0].value;
    assert.match(html, /TOTAL PAGADO[\s\S]{0,200}(\$16\.390|\$16390)/);
    assert.equal(html.includes('victim@evil.com'), false);
    assert.equal(html.includes('Regalado'), false);
});

test('un nombre con código no se interpreta como HTML en el correo', async () => {
    let html = '';
    global.fetch = async (url, options = {}) => {
        const target = String(url);
        if (target.includes('/v1/payments/')) {
            const pago = pagoDePrueba();
            pago.metadata = { ...pago.metadata, nombre: '<img src=x onerror=alert(1)>' };
            return jsonResponse(200, pago);
        }
        if (target.includes('api.sendgrid.com')) {
            html = JSON.parse(options.body).content[0].value;
            return jsonResponse(202, '');
        }
        return jsonResponse(200, []);
    };
    const res = await enviarConfirmacion(evento({ mp_payment_id: '555001' }));
    assert.equal(res.statusCode, 200);
    assert.equal(html.includes('<img'), false);
    assert.match(html, /&lt;img src=x onerror=alert\(1\)&gt;/);
});

test('no manda correos si el pago no está aprobado', async () => {
    global.fetch = async (url) => {
        if (String(url).includes('/v1/payments/')) {
            return jsonResponse(200, pagoDePrueba({ status: 'pending' }));
        }
        if (String(url).includes('sendgrid')) throw new Error('No debía enviar correo');
        return jsonResponse(200, []);
    };
    const res = await enviarConfirmacion(evento({ mp_payment_id: '555001', email: 'victim@evil.com' }));
    assert.equal(res.statusCode, 409);
});

test('si el pago ya estaba guardado no se inserta de nuevo', async () => {
    global.fetch = async (url, options = {}) => {
        const target = String(url);
        if (target.includes('/v1/payments/')) return jsonResponse(200, pagoDePrueba());
        if (target.includes('/rest/v1/ventas?')) {
            return jsonResponse(200, [{ mp_payment_id: '555001', nro_pedido: 'LAT-12345', total: 16390 }]);
        }
        if (options.method === 'POST') throw new Error('No debía insertar de nuevo');
        return jsonResponse(200, {});
    };
    const res = await guardarVenta(evento({ mp_payment_id: '555001' }));
    assert.equal(res.statusCode, 200);
    assert.equal(JSON.parse(res.body).ya_existia, true);
});

test('el webhook guarda un pago aprobado y ignora otros avisos', async () => {
    const ok = await webhook({
        httpMethod: 'POST',
        headers: {},
        body: JSON.stringify({ type: 'payment', data: { id: '555001' } })
    });
    assert.equal(ok.statusCode, 200);
    assert.equal(JSON.parse(ok.body).success, true);
    assert.equal(llamadas.some(c => c.method === 'POST' && c.url.endsWith('/rest/v1/ventas')), true);

    llamadas = [];
    global.fetch = async () => { throw new Error('No debía consultar'); };
    const orden = await webhook({
        httpMethod: 'POST',
        headers: {},
        body: JSON.stringify({ type: 'merchant_order', data: { id: '999' } })
    });
    assert.equal(orden.statusCode, 200);
    assert.equal(JSON.parse(orden.body).ignored, true);

    const porQuery = idDesdeNotificacion({
        queryStringParameters: { topic: 'payment', id: '42' }
    }, {});
    assert.equal(porQuery, '42');
    assert.equal(idDesdeNotificacion({ queryStringParameters: { topic: 'merchant_order', id: '7' } }, {}), '');
});

test('si el pago no trae metadata, usa los productos de la orden de Mercado Pago', async () => {
    global.fetch = async (url) => {
        const target = String(url);
        if (target.includes('/v1/payments/')) {
            return jsonResponse(200, pagoDePrueba({
                transaction_amount: 3500,
                metadata: {},
                order: { id: '77' }
            }));
        }
        if (target.includes('/merchant_orders/77')) {
            return jsonResponse(200, {
                items: [{ id: 'SH-002', quantity: 1, unit_price: 1 }],
                metadata: { nombre: 'Ana Pérez', email: 'ana@cliente.cl', telefono: '912345678', direccion: 'Calle 1' }
            });
        }
        if (target.includes('/rest/v1/ventas?')) return jsonResponse(200, []);
        if (target.includes('/rest/v1/ventas')) return jsonResponse(201, {});
        throw new Error('URL inesperada ' + target);
    };

    const res = await guardarVenta(evento({ mp_payment_id: '555001', total: 1 }));
    assert.equal(res.statusCode, 200);
    assert.equal(JSON.parse(res.body).total, 3500);
});

test('el monto verificado tiene que calzar con el catálogo', () => {
    const bien = construirVentaDesdePago(pagoDePrueba());
    assert.equal(bien.venta.total, 16390);
    const mal = construirVentaDesdePago(pagoDePrueba({ currency_id: 'USD' }));
    assert.equal(mal.statusCode, 409);
    const devuelto = construirVentaDesdePago(pagoDePrueba({ transaction_amount_refunded: 100 }));
    assert.equal(devuelto.statusCode, 409);
});

test('los datos del cliente se escapan antes de ir al correo', () => {
    const armada = armarPreferencia({
        items: [{ id: 'AC-001', quantity: 1 }],
        payer: {
            nombre: '<img src=x onerror=alert(1)>',
            email: 'ana@cliente.cl',
            telefono: '912345678',
            direccion: 'Calle 1'
        },
        externalReference: 'LAT-1',
        origin: 'https://latinoamericanaspa.com'
    });
    assert.equal(armada.preference.metadata.nombre.includes('<'), true);
    assert.match(escaparHtml(armada.preference.metadata.nombre), /&lt;img/);
});
