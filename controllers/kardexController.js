const KardexModel = require('../models/kardexModel');

const registrarMovimientoKardex = async (req, res) => {
    try {
        const { fecha_movimiento, articulo, cuenta_contable, concepto, tipo_movimiento, cantidad, precio_ingresado, condicion_iva } = req.body;
        
        const articuloUpper = articulo.toUpperCase().trim();
        const ultimoSaldo = await KardexModel.obtenerUltimoSaldo(articuloUpper);

        if (ultimoSaldo) {
            const fechaNuevo = new Date(fecha_movimiento + 'T00:00:00');
            const fechaUltimo = new Date(ultimoSaldo.fecha);
            if (fechaNuevo < fechaUltimo) {
                return res.status(400).json({ error: `La fecha no puede ser menor al último movimiento de este artículo (${fechaUltimo.toLocaleDateString('es-SV', { timeZone: 'UTC' })}).` });
            }
        }

        let saldo_cantidad = ultimoSaldo ? Number(ultimoSaldo.saldo_cantidad) : 0;
        let saldo_total = ultimoSaldo ? Number(ultimoSaldo.saldo_total) : 0;
        let costo_unitario_mov = 0;
        let costo_total_mov = 0;

        if (tipo_movimiento === 'INVENTARIO_INICIAL' || tipo_movimiento === 'COMPRA' || tipo_movimiento === 'DEV_VENTA') {
            if (tipo_movimiento === 'COMPRA' || tipo_movimiento === 'INVENTARIO_INICIAL') {
                costo_unitario_mov = condicion_iva === 'incluido' ? (Number(precio_ingresado) / 1.13) : Number(precio_ingresado);
            } else {
                costo_unitario_mov = Number(precio_ingresado); 
            }
            costo_total_mov = cantidad * costo_unitario_mov;
            saldo_cantidad += Number(cantidad);
            saldo_total += costo_total_mov;
        } else if (tipo_movimiento === 'VENTA' || tipo_movimiento === 'DEV_COMPRA') {
            if (saldo_cantidad < cantidad) return res.status(400).json({ error: `Stock insuficiente de ${articuloUpper}.` });
            costo_unitario_mov = tipo_movimiento === 'VENTA' ? (saldo_cantidad > 0 ? (saldo_total / saldo_cantidad) : 0) : Number(precio_ingresado);
            costo_total_mov = cantidad * costo_unitario_mov;
            saldo_cantidad -= Number(cantidad);
            saldo_total -= costo_total_mov;
        }

        let saldo_costo_unitario = saldo_cantidad > 0 ? (saldo_total / saldo_cantidad) : 0;
        
        // Unimos la cuenta automática con la descripción para el historial
        const conceptoFinal = `${cuenta_contable} | ${concepto}`;

        const nuevoMovimiento = {
            fecha: fecha_movimiento,
            codigo_articulo: articuloUpper, 
            concepto: conceptoFinal,
            tipo_movimiento,
            cantidad: Number(cantidad),
            costo_unitario: Number(costo_unitario_mov.toFixed(4)),
            costo_total: Number(costo_total_mov.toFixed(2)),
            saldo_cantidad: Number(saldo_cantidad),
            saldo_costo_unitario: Number(saldo_costo_unitario.toFixed(4)),
            saldo_total: Number(saldo_total.toFixed(2))
        };

        await KardexModel.insertarMovimiento(nuevoMovimiento);
        res.status(201).json({ mensaje: 'Movimiento registrado correctamente' });

    } catch (error) {
        res.status(500).json({ error: 'Error al registrar el movimiento' });
    }
};

const obtenerKardex = async (req, res) => {
    try {
        const { filtro } = req.params;
        const filtroNormalizado = filtro ? filtro.trim().toUpperCase() : 'GLOBAL';
        const historial = await KardexModel.obtenerHistorialKardex(filtroNormalizado);
        res.status(200).json(historial);
    } catch (error) {
        res.status(500).json({ error: 'Error al obtener historial' });
    }
};

const anularUltimo = async (req, res) => {
    try {
        const { id_movimiento } = req.params;
        await KardexModel.anularMovimiento(id_movimiento);
        res.status(200).json({ mensaje: 'Movimiento anulado' });
    } catch (error) {
        res.status(500).json({ error: 'Error al anular' });
    }
};

// NUEVA FUNCIÓN: Envía la lista de artículos al navegador
const obtenerListaArticulos = async (req, res) => {
    try {
        const articulos = await KardexModel.obtenerArticulosUnicos();
        res.status(200).json(articulos);
    } catch (error) {
        res.status(500).json({ error: 'Error al obtener la lista de artículos' });
    }
};

module.exports = { 
    registrarMovimientoKardex, 
    obtenerKardex, 
    anularUltimo,
    obtenerListaArticulos
};