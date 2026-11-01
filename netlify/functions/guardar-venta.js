const { respuesta, rechazarMetodo, leerJson } = require('../lib/http');
const { idDePago, insertarVenta, verificarPago } = require('../lib/pagos');

exports.handler = async (event) => {
    const metodo = rechazarMetodo(event, ['POST']);
    if (metodo) return metodo;

    const cuerpo = leerJson(event);
    if (cuerpo.error) return respuesta(cuerpo.statusCode, { error: cuerpo.error });

    const paymentId = idDePago(cuerpo.data.mp_payment_id || cuerpo.data.payment_id);
    if (!paymentId) return respuesta(400, { error: 'Falta el identificador del pago' });

    const verificado = await verificarPago(paymentId);
    if (verificado.error) return respuesta(verificado.statusCode, { error: verificado.error });

    const guardado = await insertarVenta(verificado.venta);
    if (guardado.error) return respuesta(guardado.statusCode, { error: guardado.error });

    return respuesta(200, {
        success: true,
        ya_existia: Boolean(guardado.yaExistia),
        nro_pedido: verificado.venta.nro_pedido,
        total: verificado.venta.total,
        productos: verificado.venta.productos
    });
};
