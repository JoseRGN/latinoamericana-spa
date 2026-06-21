exports.handler = async (event) => {
    if (event.httpMethod === 'OPTIONS') {
        return {
            statusCode: 200,
            headers: {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Headers': 'Content-Type',
                'Access-Control-Allow-Methods': 'POST, OPTIONS'
            },
            body: ''
        };
    }

    if (event.httpMethod !== 'POST') {
        return { statusCode: 405, body: 'Method Not Allowed' };
    }

    const apiKey = process.env.SENDGRID_API_KEY;
    if (!apiKey) {
        return { statusCode: 500, body: JSON.stringify({ error: 'SendGrid API Key no configurada' }) };
    }

    let body;
    try {
        body = JSON.parse(event.body);
    } catch {
        return { statusCode: 400, body: JSON.stringify({ error: 'Body inválido' }) };
    }

    const { nro_pedido, nombre, email, telefono, direccion, productos, total, fecha } = body;

    const productosHtml = productos
        .split(' | ')
        .map(p => `<tr>
            <td style="padding:10px 16px;border-bottom:1px solid #eee;font-family:'Helvetica Neue',Arial,sans-serif;font-size:14px;color:#1A1A2E;">${p}</td>
        </tr>`)
        .join('');

    // Email al cliente
    const emailCliente = {
        to: email,
        from: { name: 'Latinoamericana SpA', email: 'consultalatinoamericana@gmail.com' },
        subject: `✅ Pedido #${nro_pedido} confirmado — Latinoamericana SpA`,
        html: `
<!DOCTYPE html>
<html lang="es">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#F5F3EE;font-family:'Helvetica Neue',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#F5F3EE;padding:32px 16px;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:#FDFCF9;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(27,94,75,0.10);">

        <!-- Header -->
        <tr>
          <td style="background:#1B5E4B;padding:32px 40px;text-align:center;">
            <p style="margin:0 0 8px;color:rgba(255,255,255,0.7);font-size:13px;letter-spacing:1px;text-transform:uppercase;">Latinoamericana SpA</p>
            <h1 style="margin:0;color:#ffffff;font-size:26px;font-weight:700;">¡Gracias por tu compra!</h1>
            <p style="margin:10px 0 0;color:rgba(255,255,255,0.75);font-size:15px;">Tu pedido fue confirmado exitosamente.</p>
          </td>
        </tr>

        <!-- Order number -->
        <tr>
          <td style="padding:28px 40px 0;text-align:center;">
            <p style="margin:0;color:#6B7280;font-size:13px;text-transform:uppercase;letter-spacing:1px;">Número de pedido</p>
            <p style="margin:6px 0 0;color:#1B5E4B;font-size:32px;font-weight:700;">#${nro_pedido}</p>
          </td>
        </tr>

        <!-- Info cliente -->
        <tr>
          <td style="padding:24px 40px;">
            <table width="100%" cellpadding="0" cellspacing="0" style="background:#F5F3EE;border-radius:10px;overflow:hidden;">
              <tr><td style="padding:16px 20px;border-bottom:1px solid #e5e1d8;">
                <span style="color:#6B7280;font-size:13px;">Cliente</span><br>
                <strong style="color:#1A1A2E;font-size:15px;">${nombre}</strong>
              </td></tr>
              <tr><td style="padding:16px 20px;border-bottom:1px solid #e5e1d8;">
                <span style="color:#6B7280;font-size:13px;">Dirección de envío</span><br>
                <strong style="color:#1A1A2E;font-size:15px;">${direccion}</strong>
              </td></tr>
              <tr><td style="padding:16px 20px;">
                <span style="color:#6B7280;font-size:13px;">Fecha</span><br>
                <strong style="color:#1A1A2E;font-size:15px;">${fecha}</strong>
              </td></tr>
            </table>
          </td>
        </tr>

        <!-- Productos -->
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

        <!-- Mensaje -->
        <tr>
          <td style="padding:0 40px 32px;text-align:center;">
            <p style="margin:0;color:#6B7280;font-size:14px;line-height:1.6;">
              Nos pondremos en contacto contigo para coordinar la entrega.<br>
              Ante cualquier consulta escríbenos a
              <a href="mailto:consultalatinoamericana@gmail.com" style="color:#1B5E4B;font-weight:600;">consultalatinoamericana@gmail.com</a>
            </p>
          </td>
        </tr>

        <!-- Footer -->
        <tr>
          <td style="background:#1B5E4B;padding:20px 40px;text-align:center;">
            <p style="margin:0;color:rgba(255,255,255,0.6);font-size:12px;">Latinoamericana SpA · Chile · latinoamericanaspa.com</p>
          </td>
        </tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`
    };

    // Email al negocio
    const emailNegocio = {
        to: 'consultalatinoamericana@gmail.com',
        from: { name: 'Latinoamericana SpA', email: 'consultalatinoamericana@gmail.com' },
        subject: `🛒 Nuevo pedido #${nro_pedido} — ${nombre}`,
        html: `
<!DOCTYPE html>
<html lang="es">
<head><meta charset="UTF-8"></head>
<body style="margin:0;padding:0;background:#F5F3EE;font-family:'Helvetica Neue',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#F5F3EE;padding:32px 16px;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:#FDFCF9;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(27,94,75,0.10);">

        <!-- Header -->
        <tr>
          <td style="background:#C95A28;padding:28px 40px;text-align:center;">
            <p style="margin:0 0 6px;color:rgba(255,255,255,0.8);font-size:13px;letter-spacing:1px;text-transform:uppercase;">Nueva venta</p>
            <h1 style="margin:0;color:#ffffff;font-size:24px;font-weight:700;">Pedido #${nro_pedido}</h1>
          </td>
        </tr>

        <!-- Datos -->
        <tr>
          <td style="padding:28px 40px;">
            <table width="100%" cellpadding="0" cellspacing="0" style="background:#F5F3EE;border-radius:10px;overflow:hidden;">
              <tr><td style="padding:14px 20px;border-bottom:1px solid #e5e1d8;">
                <span style="color:#6B7280;font-size:12px;text-transform:uppercase;letter-spacing:0.5px;">Cliente</span><br>
                <strong style="color:#1A1A2E;">${nombre}</strong>
              </td></tr>
              <tr><td style="padding:14px 20px;border-bottom:1px solid #e5e1d8;">
                <span style="color:#6B7280;font-size:12px;text-transform:uppercase;letter-spacing:0.5px;">Email</span><br>
                <strong style="color:#1A1A2E;">${email}</strong>
              </td></tr>
              <tr><td style="padding:14px 20px;border-bottom:1px solid #e5e1d8;">
                <span style="color:#6B7280;font-size:12px;text-transform:uppercase;letter-spacing:0.5px;">Teléfono</span><br>
                <strong style="color:#1A1A2E;">${telefono}</strong>
              </td></tr>
              <tr><td style="padding:14px 20px;border-bottom:1px solid #e5e1d8;">
                <span style="color:#6B7280;font-size:12px;text-transform:uppercase;letter-spacing:0.5px;">Dirección</span><br>
                <strong style="color:#1A1A2E;">${direccion}</strong>
              </td></tr>
              <tr><td style="padding:14px 20px;">
                <span style="color:#6B7280;font-size:12px;text-transform:uppercase;letter-spacing:0.5px;">Fecha</span><br>
                <strong style="color:#1A1A2E;">${fecha}</strong>
              </td></tr>
            </table>
          </td>
        </tr>

        <!-- Productos -->
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

        <!-- Footer -->
        <tr>
          <td style="background:#1B5E4B;padding:16px 40px;text-align:center;">
            <p style="margin:0;color:rgba(255,255,255,0.6);font-size:12px;">Latinoamericana SpA · Panel Admin</p>
          </td>
        </tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`
    };

    try {
        await Promise.all([emailCliente, emailNegocio].map(msg =>
            fetch('https://api.sendgrid.com/v3/mail/send', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${apiKey}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    personalizations: [{ to: [{ email: msg.to }] }],
                    from: msg.from,
                    subject: msg.subject,
                    content: [{ type: 'text/html', value: msg.html }]
                })
            })
        ));

        return {
            statusCode: 200,
            headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
            body: JSON.stringify({ ok: true })
        };
    } catch (err) {
        console.error('SendGrid error:', err);
        return {
            statusCode: 500,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ error: 'Error al enviar emails' })
        };
    }
};
