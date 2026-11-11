const JSON_HEADERS = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS'
};

function respuesta(statusCode, body, extraHeaders) {
    return {
        statusCode,
        headers: extraHeaders ? { ...JSON_HEADERS, ...extraHeaders } : JSON_HEADERS,
        body: typeof body === 'string' ? body : JSON.stringify(body)
    };
}

function rechazarMetodo(event, metodosPermitidos) {
    if (event.httpMethod === 'OPTIONS') {
        return respuesta(200, '');
    }
    if (!metodosPermitidos.includes(event.httpMethod)) {
        return respuesta(405, { error: 'Method Not Allowed' });
    }
    return null;
}

function leerJson(event, maxBytes) {
    const limite = maxBytes || 20000;
    if (!event.body) return { data: {} };
    const raw = event.isBase64Encoded
        ? Buffer.from(event.body, 'base64').toString('utf8')
        : event.body;
    if (raw.length > limite) {
        return { error: 'La solicitud es demasiado grande', statusCode: 413 };
    }
    try {
        const data = JSON.parse(raw);
        if (!data || typeof data !== 'object' || Array.isArray(data)) {
            return { error: 'Body inválido', statusCode: 400 };
        }
        return { data };
    } catch {
        return { error: 'Body inválido', statusCode: 400 };
    }
}

module.exports = {
    respuesta,
    rechazarMetodo,
    leerJson
};
