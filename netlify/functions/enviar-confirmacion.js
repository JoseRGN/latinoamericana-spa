const { respuesta, rechazarMetodo, leerJson } = require('../lib/http');
const { enviarCorreos, idDePago, verificarPago } = require('../lib/pagos');

exports.handler = async (event) => {
    const metodo = rechazarMetodo(event, ['POST']);
    if (metodo) return metodo;

    const apiKey = process.env.SENDGRID_API_KEY;
    if (!apiKey) return respuesta(500, { error: 'SendGrid API Key no configurada' });

    const cuerpo = leerJson(event);
    if (cuerpo.error) return respuesta(cuerpo.statusCode, { error: cuerpo.error });

    const paymentId = idDePago(cuerpo.data.mp_payment_id || cuerpo.data.payment_id);
    if (!paymentId) return respuesta(400, { error: 'Falta el identificador del pago' });

    const verificado = await verificarPago(paymentId);
    if (verificado.error) return respuesta(verificado.statusCode, { error: verificado.error });

    const envio = await enviarCorreos(verificado.venta);
    if (envio.error) return respuesta(envio.statusCode, { error: envio.error });

    return respuesta(200, { ok: true, nro_pedido: verificado.venta.nro_pedido });
};
