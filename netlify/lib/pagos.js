const { resolverItems } = require('./catalogo');

const CORREO_TIENDA = 'consultalatinoamericana@gmail.com';
const NOMBRE_TIENDA = 'Latinoamericana SpA';

function texto(value, max) {
    if (typeof value !== 'string') return '';
    return value.replace(/[\u0000-\u001F\u007F]/g, '').replace(/\s+/g, ' ').trim().slice(0, max);
}

function emailValido(value) {
    const email = texto(value, 120);
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return '';
    return email;
}

function referenciaSegura(value, fallback) {
    const ref = texto(value, 64);
    if (/^[\w-]{1,64}$/.test(ref)) return ref;
    return fallback;
}

function escaparHtml(value) {
    return String(value ?? '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

function formatoCLP(valor) {
    return '$' + Number(valor).toLocaleString('es-CL');
}

function fechaChile(iso) {
    const date = iso ? new Date(iso) : new Date();
    const segura = Number.isNaN(date.getTime()) ? new Date() : date;
    return new Intl.DateTimeFormat('es-CL', {
        timeZone: 'America/Santiago',
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    }).format(segura);
}

function itemsDesdePago(pago) {
    const meta = pago && pago.metadata ? pago.metadata : {};
    const crudo = meta.items;
    if (typeof crudo === 'string' && crudo.trim()) {
        try {
            const parsed = JSON.parse(crudo);
            if (Array.isArray(parsed)) return parsed.map(normalizarItem);
        } catch {
            return null;
        }
    }
    if (Array.isArray(crudo)) return crudo.map(normalizarItem);

    const extra = pago && pago.additional_info && pago.additional_info.items;
    if (Array.isArray(extra)) return extra.map(normalizarItem);
    return null;
}

function normalizarItem(item) {
    if (!item || typeof item !== 'object') return { id: '', quantity: null };
    const quantity = item.q != null ? item.q : item.quantity;
    return { id: item.id, quantity };
}

function construirVentaDesdePago(pago) {
    if (!pago || typeof pago !== 'object') {
        return { error: 'Pago inválido', statusCode: 400 };
    }
    if (pago.status !== 'approved') {
        return { error: 'El pago no está aprobado', statusCode: 409 };
    }
    if (pago.currency_id !== 'CLP') {
        return { error: 'La moneda del pago no es peso chileno', statusCode: 409 };
    }
    if (Number(pago.transaction_amount_refunded) > 0) {
        return { error: 'El pago tiene una devolución', statusCode: 409 };
    }

    const rawItems = itemsDesdePago(pago);
    if (!rawItems) {
        return { error: 'El pago no trae el detalle de productos', statusCode: 409 };
    }

    const resolved = resolverItems(rawItems);
    if (resolved.error) {
        return { error: 'El detalle del pago no coincide con el catálogo', statusCode: 409 };
    }

    const pagado = Math.round(Number(pago.transaction_amount));
    if (!Number.isFinite(pagado) || pagado !== resolved.total) {
        return { error: 'El monto pagado no coincide con el catálogo', statusCode: 409 };
    }

    const meta = pago.metadata || {};
    const paymentId = String(pago.id);
    const venta = {
        nro_pedido: referenciaSegura(pago.external_reference, `MP-${paymentId}`),
        fecha: fechaChile(pago.date_approved || pago.date_created),
        nombre: texto(meta.nombre, 80) || 'Cliente',
        email: emailValido(meta.email) || emailValido(pago.payer && pago.payer.email),
        telefono: texto(meta.telefono, 30),
        direccion: texto(meta.direccion, 200),
        productos: resolved.lines.map(linea => `${linea.title} x${linea.quantity}`).join(' | '),
        total: resolved.total,
        moneda: 'CLP',
        estado: 'pagado',
        mp_payment_id: paymentId
    };

    return { venta };
}

function idDePago(value) {
    const id = String(value == null ? '' : value).trim();
    if (!/^\d{1,20}$/.test(id)) return '';
    return id;
}

async function obtenerPago(paymentId, accessToken, fetchImpl) {
    const id = idDePago(paymentId);
    if (!id) return { error: 'Identificador de pago inválido', statusCode: 400 };

    const fetchFn = fetchImpl || fetch;
    let response;
    try {
        response = await fetchFn(`https://api.mercadopago.com/v1/payments/${id}`, {
            headers: { Authorization: `Bearer ${accessToken}` }
        });
    } catch (err) {
        console.error('Error de red al consultar Mercado Pago:', err.message);
        return { error: 'No se pudo verificar el pago', statusCode: 502 };
    }

    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
        console.error('Mercado Pago rechazó la consulta del pago', response.status, data.message || data.error || '');
        return {
            error: response.status === 404 ? 'El pago no existe' : 'No se pudo verificar el pago',
            statusCode: response.status === 404 ? 404 : 502
        };
    }

    return { pago: data };
}

async function obtenerOrdenComercio(ordenId, accessToken) {
    const id = String(ordenId == null ? '' : ordenId).trim();
    if (!/^[\w-]{1,32}$/.test(id)) return null;
    try {
        const response = await fetch(`https://api.mercadopago.com/merchant_orders/${id}`, {
            headers: { Authorization: `Bearer ${accessToken}` }
        });
        if (!response.ok) return null;
        return await response.json();
    } catch (err) {
        console.error('No se pudo leer la orden de Mercado Pago:', err.message);
        return null;
    }
}

async function verificarPago(paymentId) {
    const accessToken = process.env.MP_ACCESS_TOKEN;
    if (!accessToken) {
        return { error: 'Credenciales no configuradas', statusCode: 500 };
    }
    const consultado = await obtenerPago(paymentId, accessToken);
    if (consultado.error) return consultado;

    let pago = consultado.pago;
    if (!itemsDesdePago(pago)) {
        const ordenId = pago.order && (pago.order.id || pago.order);
        const orden = ordenId ? await obtenerOrdenComercio(ordenId, accessToken) : null;
        if (orden && Array.isArray(orden.items) && orden.items.length > 0) {
            const metadata = { ...(orden.metadata || {}), ...(pago.metadata || {}) };
            if (!metadata.items) {
                metadata.items = JSON.stringify(orden.items.map(item => ({
                    id: item.id,
                    q: item.quantity
                })));
            }
            pago = { ...pago, metadata };
        }
    }

    return construirVentaDesdePago(pago);
}

function datosCliente(payer) {
    const nombre = texto(payer && payer.nombre, 80);
    const email = emailValido(payer && payer.email);
    const telefono = texto(payer && payer.telefono, 30);
    const direccion = texto(payer && payer.direccion, 200);
    if (!nombre || !email || !telefono || !direccion) {
        return { error: 'Faltan los datos del cliente' };
    }
    if (telefono.replace(/\D/g, '').length < 8) {
        return { error: 'El teléfono no es válido' };
    }
    return { nombre, email, telefono, direccion };
}

function origenDelSitio(event) {
    const headers = event.headers || {};
    const host = String(headers['x-forwarded-host'] || headers.host || '').split(',')[0].trim();
    const proto = String(headers['x-forwarded-proto'] || 'https').split(',')[0].trim() || 'https';
    const fallback = host ? `${proto}://${host}` : '';
    const origin = headers.origin || '';
    if (!origin) return fallback;
    try {
        const url = new URL(origin);
        if (!host || url.host === host) return url.origin;
    } catch {
        return fallback;
    }
    return fallback;
}

function urlNotificacion(origin) {
    try {
        const url = new URL(origin);
        if (url.protocol !== 'https:') return '';
        if (url.hostname === 'localhost' || url.hostname === '127.0.0.1') return '';
        return `${url.origin}/.netlify/functions/mp-webhook`;
    } catch {
        return '';
    }
}

function armarPreferencia({ items, payer, externalReference, origin }) {
    const resuelto = resolverItems(items);
    if (resuelto.error) return { error: resuelto.error, statusCode: 400 };

    const cliente = datosCliente(payer);
    if (cliente.error) return { error: cliente.error, statusCode: 400 };
    if (!origin) return { error: 'No se pudo determinar la dirección del sitio', statusCode: 400 };

    const referencia = referenciaSegura(externalReference, `LAT-${Date.now()}`);
    const preference = {
        items: resuelto.lines.map(linea => ({
            id: linea.id,
            title: linea.title,
            quantity: linea.quantity,
            unit_price: linea.unit_price,
            currency_id: 'CLP'
        })),
        payer: {
            name: cliente.nombre,
            email: cliente.email,
            phone: { area_code: '56', number: cliente.telefono.replace(/\D/g, '').slice(0, 15) },
            address: { street_name: cliente.direccion }
        },
        metadata: {
            nombre: cliente.nombre,
            email: cliente.email,
            telefono: cliente.telefono,
            direccion: cliente.direccion,
            items: JSON.stringify(resuelto.lines.map(linea => ({ id: linea.id, q: linea.quantity })))
        },
        back_urls: {
            success: `${origin}/?estado=aprobado`,
            failure: `${origin}/?estado=rechazado`,
            pending: `${origin}/?estado=pendiente`
        },
        auto_return: 'approved',
        external_reference: referencia,
        statement_descriptor: 'LATINOAMERICANA SPA',
        payment_methods: {
            excluded_payment_types: [],
            installments: 12
        }
    };

    const notificacion = urlNotificacion(origin);
    if (notificacion) preference.notification_url = notificacion;

    return { preference, total: resuelto.total };
}

function filasProductos(productos) {
    return String(productos || '')
        .split(' | ')
        .filter(Boolean)
        .map(linea => `<tr>
            <td style="padding:10px 16px;border-bottom:1px solid #eee;font-family:'Helvetica Neue',Arial,sans-serif;font-size:14px;color:#1A1A2E;">${escaparHtml(linea)}</td>
        </tr>`)
        .join('');
}

function htmlCorreoCliente(venta) {
    const productosHtml = filasProductos(venta.productos);
    const total = escaparHtml(formatoCLP(venta.total));
    return `<!DOCTYPE html>
<html lang="es">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#F5F3EE;font-family:'Helvetica Neue',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#F5F3EE;padding:32px 16px;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:#FDFCF9;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(27,94,75,0.10);">
        <tr>
          <td style="background:#1B5E4B;padding:32px 40px;text-align:center;">
            <p style="margin:0 0 8px;color:rgba(255,255,255,0.7);font-size:13px;letter-spacing:1px;text-transform:uppercase;">Latinoamericana SpA</p>
            <h1 style="margin:0;color:#ffffff;font-size:26px;font-weight:700;">¡Gracias por tu compra!</h1>
            <p style="margin:10px 0 0;color:rgba(255,255,255,0.75);font-size:15px;">Tu pedido fue confirmado exitosamente.</p>
          </td>
        </tr>
        <tr>
          <td style="padding:28px 40px 0;text-align:center;">
            <p style="margin:0;color:#6B7280;font-size:13px;text-transform:uppercase;letter-spacing:1px;">Número de pedido</p>
            <p style="margin:6px 0 0;color:#1B5E4B;font-size:32px;font-weight:700;">#${escaparHtml(venta.nro_pedido)}</p>
          </td>
        </tr>
        <tr>
          <td style="padding:24px 40px;">
            <table width="100%" cellpadding="0" cellspacing="0" style="background:#F5F3EE;border-radius:10px;overflow:hidden;">
              <tr><td style="padding:16px 20px;border-bottom:1px solid #e5e1d8;">
                <span style="color:#6B7280;font-size:13px;">Cliente</span><br>
                <strong style="color:#1A1A2E;font-size:15px;">${escaparHtml(venta.nombre)}</strong>
              </td></tr>
              <tr><td style="padding:16px 20px;border-bottom:1px solid #e5e1d8;">
                <span style="color:#6B7280;font-size:13px;">Dirección de envío</span><br>
                <strong style="color:#1A1A2E;font-size:15px;">${escaparHtml(venta.direccion)}</strong>
              </td></tr>
              <tr><td style="padding:16px 20px;">
                <span style="color:#6B7280;font-size:13px;">Fecha</span><br>
                <strong style="color:#1A1A2E;font-size:15px;">${escaparHtml(venta.fecha)}</strong>
              </td></tr>
            </table>
          </td>
        </tr>
        <tr>
          <td style="padding:0 40px 24px;">
            <p style="margin:0 0 12px;font-weight:700;color:#1A1A2E;font-size:15px;">Detalle del pedido</p>
            <table width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #e5e1d8;border-radius:10px;overflow:hidden;">
              ${productosHtml}
              <tr>
                <td style="padding:14px 16px;background:#1B5E4B;">
                  <span style="color:rgba(255,255,255,0.8);font-size:13px;font-weight:600;">TOTAL PAGADO</span>
                  <span style="float:right;color:#ffffff;font-size:18px;font-weight:700;">${total}</span>
                </td>
              </tr>
            </table>
          </td>
        </tr>
        <tr>
          <td style="padding:0 40px 32px;text-align:center;">
            <p style="margin:0;color:#6B7280;font-size:14px;line-height:1.6;">
              Nos pondremos en contacto contigo para coordinar la entrega.<br>
              Ante cualquier consulta escríbenos a
              <a href="mailto:${CORREO_TIENDA}" style="color:#1B5E4B;font-weight:600;">${CORREO_TIENDA}</a>
            </p>
          </td>
        </tr>
        <tr>
          <td style="background:#1B5E4B;padding:20px 40px;text-align:center;">
            <p style="margin:0;color:rgba(255,255,255,0.6);font-size:12px;">Latinoamericana SpA · Chile · latinoamericanaspa.com</p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

function htmlCorreoNegocio(venta) {
    const productosHtml = filasProductos(venta.productos);
    const total = escaparHtml(formatoCLP(venta.total));
    return `<!DOCTYPE html>
<html lang="es">
<head><meta charset="UTF-8"></head>
<body style="margin:0;padding:0;background:#F5F3EE;font-family:'Helvetica Neue',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#F5F3EE;padding:32px 16px;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:#FDFCF9;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(27,94,75,0.10);">
        <tr>
          <td style="background:#C95A28;padding:28px 40px;text-align:center;">
            <p style="margin:0 0 6px;color:rgba(255,255,255,0.8);font-size:13px;letter-spacing:1px;text-transform:uppercase;">Nueva venta</p>
            <h1 style="margin:0;color:#ffffff;font-size:24px;font-weight:700;">Pedido #${escaparHtml(venta.nro_pedido)}</h1>
          </td>
        </tr>
        <tr>
          <td style="padding:28px 40px;">
            <table width="100%" cellpadding="0" cellspacing="0" style="background:#F5F3EE;border-radius:10px;overflow:hidden;">
              <tr><td style="padding:14px 20px;border-bottom:1px solid #e5e1d8;">
                <span style="color:#6B7280;font-size:12px;text-transform:uppercase;letter-spacing:0.5px;">Cliente</span><br>
                <strong style="color:#1A1A2E;">${escaparHtml(venta.nombre)}</strong>
              </td></tr>
              <tr><td style="padding:14px 20px;border-bottom:1px solid #e5e1d8;">
                <span style="color:#6B7280;font-size:12px;text-transform:uppercase;letter-spacing:0.5px;">Email</span><br>
                <strong style="color:#1A1A2E;">${escaparHtml(venta.email)}</strong>
              </td></tr>
              <tr><td style="padding:14px 20px;border-bottom:1px solid #e5e1d8;">
                <span style="color:#6B7280;font-size:12px;text-transform:uppercase;letter-spacing:0.5px;">Teléfono</span><br>
                <strong style="color:#1A1A2E;">${escaparHtml(venta.telefono)}</strong>
              </td></tr>
              <tr><td style="padding:14px 20px;border-bottom:1px solid #e5e1d8;">
                <span style="color:#6B7280;font-size:12px;text-transform:uppercase;letter-spacing:0.5px;">Dirección</span><br>
                <strong style="color:#1A1A2E;">${escaparHtml(venta.direccion)}</strong>
              </td></tr>
              <tr><td style="padding:14px 20px;">
                <span style="color:#6B7280;font-size:12px;text-transform:uppercase;letter-spacing:0.5px;">Fecha</span><br>
                <strong style="color:#1A1A2E;">${escaparHtml(venta.fecha)}</strong>
              </td></tr>
            </table>
          </td>
        </tr>
        <tr>
          <td style="padding:0 40px 28px;">
            <p style="margin:0 0 12px;font-weight:700;color:#1A1A2E;font-size:15px;">Productos</p>
            <table width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #e5e1d8;border-radius:10px;overflow:hidden;">
              ${productosHtml}
              <tr>
                <td style="padding:14px 16px;background:#C95A28;">
                  <span style="color:rgba(255,255,255,0.8);font-size:13px;font-weight:600;">TOTAL</span>
                  <span style="float:right;color:#ffffff;font-size:18px;font-weight:700;">${total}</span>
                </td>
              </tr>
            </table>
          </td>
        </tr>
        <tr>
          <td style="background:#1B5E4B;padding:16px 40px;text-align:center;">
            <p style="margin:0;color:rgba(255,255,255,0.6);font-size:12px;">Latinoamericana SpA · Panel Admin</p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

async function enviarCorreos(venta) {
    const apiKey = process.env.SENDGRID_API_KEY;
    if (!apiKey) return { error: 'SendGrid API Key no configurada', statusCode: 500 };
    if (!venta.email) return { error: 'El pago no tiene un correo válido', statusCode: 409 };

    const mensajes = [
        {
            to: venta.email,
            subject: `Pedido #${venta.nro_pedido} confirmado — Latinoamericana SpA`,
            html: htmlCorreoCliente(venta)
        },
        {
            to: CORREO_TIENDA,
            subject: `Nuevo pedido #${venta.nro_pedido} — ${venta.nombre}`,
            html: htmlCorreoNegocio(venta)
        }
    ];

    let responses;
    try {
        responses = await Promise.all(mensajes.map(msg =>
            fetch('https://api.sendgrid.com/v3/mail/send', {
                method: 'POST',
                headers: {
                    Authorization: `Bearer ${apiKey}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    personalizations: [{ to: [{ email: msg.to }] }],
                    from: { name: NOMBRE_TIENDA, email: CORREO_TIENDA },
                    subject: msg.subject,
                    content: [{ type: 'text/html', value: msg.html }]
                })
            })
        ));
    } catch (err) {
        console.error('SendGrid error:', err.message);
        return { error: 'Error al enviar emails', statusCode: 502 };
    }

    for (const response of responses) {
        if (!response.ok) {
            const detalle = await response.text().catch(() => '');
            console.error('SendGrid error:', response.status, detalle.slice(0, 500));
            return { error: 'Error al enviar emails', statusCode: 502 };
        }
    }

    return { ok: true };
}

function headersSupabase(key) {
    return {
        Authorization: `Bearer ${key}`,
        apikey: key,
        'Content-Type': 'application/json'
    };
}

async function buscarVenta(paymentId, supabaseUrl, supabaseKey) {
    let response;
    try {
        response = await fetch(
            `${supabaseUrl}/rest/v1/ventas?mp_payment_id=eq.${encodeURIComponent(paymentId)}&select=mp_payment_id,nro_pedido,total&limit=1`,
            { headers: headersSupabase(supabaseKey) }
        );
    } catch (err) {
        console.error('No se pudo consultar ventas:', err.message);
        return { disponible: false };
    }
    if (!response.ok) {
        if (response.status !== 401 && response.status !== 403) {
            const detalle = await response.text().catch(() => '');
            console.error('Consulta de ventas rechazada:', response.status, detalle.slice(0, 300));
        }
        return { disponible: false };
    }
    const rows = await response.json().catch(() => []);
    if (Array.isArray(rows) && rows.length > 0) return { disponible: true, existente: rows[0] };
    return { disponible: true, existente: null };
}

function esDuplicado(status, textoError) {
    return status === 409 || textoError.includes('23505') || textoError.toLowerCase().includes('duplicate');
}

async function insertarVenta(venta) {
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_KEY;
    if (!supabaseUrl || !supabaseKey) {
        return { error: 'Supabase no configurado', statusCode: 500 };
    }

    const previa = await buscarVenta(venta.mp_payment_id, supabaseUrl, supabaseKey);
    if (previa.existente) return { yaExistia: true, venta };

    let response;
    try {
        response = await fetch(`${supabaseUrl}/rest/v1/ventas`, {
            method: 'POST',
            headers: {
                ...headersSupabase(supabaseKey),
                Prefer: 'return=minimal'
            },
            body: JSON.stringify(venta)
        });
    } catch (err) {
        console.error('Error guardando venta:', err.message);
        return { error: 'Error de conexión con la base de datos', statusCode: 502 };
    }

    if (!response.ok) {
        const errorText = await response.text().catch(() => '');
        if (esDuplicado(response.status, errorText)) return { yaExistia: true, venta };
        console.error('Supabase error:', response.status, errorText.slice(0, 500));
        return { error: 'Error al guardar en base de datos', statusCode: 502 };
    }

    return { yaExistia: false, venta };
}

function idDesdeNotificacion(event, body) {
    const qs = event.queryStringParameters || {};
    if ((qs.topic === 'payment' || qs.type === 'payment') && qs.id) {
        return idDePago(qs.id);
    }
    if (qs.type === 'payment' && qs['data.id']) {
        return idDePago(qs['data.id']);
    }

    if (!body || typeof body !== 'object') return '';
    const tipo = body.type || '';
    const accion = typeof body.action === 'string' ? body.action : '';
    const dataId = body.data && body.data.id;
    if ((tipo === 'payment' || accion.startsWith('payment.')) && dataId != null) {
        return idDePago(dataId);
    }
    return '';
}

module.exports = {
    CORREO_TIENDA,
    armarPreferencia,
    buscarVenta,
    construirVentaDesdePago,
    enviarCorreos,
    escaparHtml,
    formatoCLP,
    idDePago,
    idDesdeNotificacion,
    insertarVenta,
    origenDelSitio,
    verificarPago
};
