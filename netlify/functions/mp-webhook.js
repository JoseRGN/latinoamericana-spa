const { respuesta, leerJson } = require('../lib/http');
const { idDesdeNotificacion, insertarVenta, verificarPago } = require('../lib/pagos');

// Mercado Pago avisa cuando cambia un pago. El cuerpo no se cree: se vuelve a
// consultar el pago con el token del servidor y solo ahí se guarda la venta.
exports.handler = async (event) => {
    if (event.httpMethod === 'OPTIONS') return respuesta(200, '');
    if (event.httpMethod !== 'POST' && event.httpMethod !== 'GET') {
        return respuesta(405, { error: 'Method Not Allowed' });
    }

    const cuerpo = event.httpMethod === 'POST' ? leerJson(event) : { data: {} };
    if (cuerpo.error) return respuesta(cuerpo.statusCode, { error: cuerpo.error });

    const paymentId = idDesdeNotificacion(event, cuerpo.data);
    if (!paymentId) return respuesta(200, { ignored: true });

    const verificado = await verificarPago(paymentId);
    if (verificado.error) {
        // Un pago pendiente o rechazado no es un error del aviso: Mercado Pago
        // vuelve a notificar cuando queda aprobado.
        if (verificado.statusCode === 409 || verificado.statusCode === 404) {
            console.error('Aviso de pago ignorado:', paymentId, verificado.error);
            return respuesta(200, { ignored: true });
        }
        return respuesta(verificado.statusCode, { error: verificado.error });
    }

    const guardado = await insertarVenta(verificado.venta);
    if (guardado.error) return respuesta(guardado.statusCode, { error: guardado.error });

    return respuesta(200, { success: true, ya_existia: Boolean(guardado.yaExistia) });
};
