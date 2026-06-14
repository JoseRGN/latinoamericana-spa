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

    const accessToken = process.env.MP_ACCESS_TOKEN;
    if (!accessToken) {
        return { statusCode: 500, body: JSON.stringify({ error: 'Credenciales no configuradas' }) };
    }

    let body;
    try {
        body = JSON.parse(event.body);
    } catch {
        return { statusCode: 400, body: JSON.stringify({ error: 'Body inválido' }) };
    }

    const { items, payer, external_reference } = body;

    const origin = event.headers.origin || `https://${event.headers.host}`;

    const preference = {
        items: items.map(item => ({
            id: item.id,
            title: item.name,
            quantity: Number(item.quantity),
            unit_price: Math.round(item.price),
            currency_id: 'CLP'
        })),
        payer: {
            name: payer.nombre,
            email: payer.email,
            phone: { area_code: '56', number: payer.telefono.replace(/\D/g, '') },
            address: { street_name: payer.direccion }
        },
        back_urls: {
            success: `${origin}/?estado=aprobado`,
            failure: `${origin}/?estado=rechazado`,
            pending: `${origin}/?estado=pendiente`
        },
        auto_return: 'approved',
        external_reference: external_reference || `LAT-${Date.now()}`,
        statement_descriptor: 'LATINOAMERICANA SPA',
        payment_methods: {
            excluded_payment_types: [],
            installments: 12
        }
    };

    try {
        const response = await fetch('https://api.mercadopago.com/checkout/preferences', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${accessToken}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(preference)
        });

        const data = await response.json();

        if (!response.ok) {
            console.error('MP error:', data);
            return {
                statusCode: response.status,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ error: data.message || 'Error al crear preferencia de pago' })
            };
        }

        return {
            statusCode: 200,
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            body: JSON.stringify({
                checkout_url: data.init_point,
                preference_id: data.id
            })
        };
    } catch (err) {
        console.error('Fetch error:', err);
        return {
            statusCode: 500,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ error: 'Error de conexión con Mercado Pago' })
        };
    }
};
