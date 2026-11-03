const { respuesta, rechazarMetodo, leerJson } = require('../lib/http');
const { armarPreferencia, origenDelSitio } = require('../lib/pagos');

exports.handler = async (event) => {
    const metodo = rechazarMetodo(event, ['POST']);
    if (metodo) return metodo;

    const accessToken = process.env.MP_ACCESS_TOKEN;
    if (!accessToken) {
        return respuesta(500, { error: 'Credenciales no configuradas' });
    }

    const cuerpo = leerJson(event);
    if (cuerpo.error) return respuesta(cuerpo.statusCode, { error: cuerpo.error });

    const armada = armarPreferencia({
        items: cuerpo.data.items,
        payer: cuerpo.data.payer,
        externalReference: cuerpo.data.external_reference,
        origin: origenDelSitio(event)
    });
    if (armada.error) return respuesta(armada.statusCode, { error: armada.error });

    try {
        const response = await fetch('https://api.mercadopago.com/checkout/preferences', {
            method: 'POST',
            headers: {
                Authorization: `Bearer ${accessToken}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(armada.preference)
        });

        const data = await response.json().catch(() => ({}));
        if (!response.ok) {
            console.error('MP error:', data.message || data.error || response.status);
            return respuesta(response.status, { error: data.message || 'Error al crear preferencia de pago' });
        }

        return respuesta(200, {
            checkout_url: data.init_point,
            preference_id: data.id
        });
    } catch (err) {
        console.error('Fetch error:', err.message);
        return respuesta(500, { error: 'Error de conexión con Mercado Pago' });
    }
};
