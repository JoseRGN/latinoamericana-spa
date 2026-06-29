module.exports = async (req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');

    if (req.method === 'OPTIONS') return res.status(200).end();
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method Not Allowed' });

    const accessToken = process.env.MP_ACCESS_TOKEN;
    if (!accessToken) return res.status(500).json({ error: 'Credenciales no configuradas' });

    const { items, payer, external_reference } = req.body;
    const origin = req.headers.origin || `https://${req.headers.host}`;

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
        payment_methods: { installments: 12 }
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

        if (!response.ok) return res.status(response.status).json({ error: data.message || 'Error MP' });

        return res.status(200).json({ checkout_url: data.init_point, preference_id: data.id });

    } catch (err) {
        return res.status(500).json({ error: 'Error de conexión con Mercado Pago' });
    }
};
