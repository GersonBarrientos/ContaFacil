const KardexModel = require('../models/kardexModel');

const registrarMovimientoKardex = async (req, res) => {
    try {
        const { id_empresa, fecha_movimiento, articulo, cuenta_contable, concepto, tipo_movimiento, cantidad, precio_ingresado, condicion_iva } = req.body;
        
        if (!id_empresa) return res.status(401).json({ error: 'Falta el ID de la empresa' });

        const articuloUpper = articulo.toUpperCase().trim();
        const ultimoSaldo = await KardexModel.obtenerUltimoSaldo(articuloUpper, id_empresa);

        if (ultimoSaldo) {
            const fechaNuevo = new Date(fecha_movimiento + 'T00:00:00');
            const fechaUltimo = new Date(ultimoSaldo.fecha);
            if (fechaNuevo < fechaUltimo) {
                return res.status(400).json({ error: `La fecha no puede ser menor al último movimiento de este artículo.` });
            }
        }

        let saldo_cantidad = ultimoSaldo ? Number(ultimoSaldo.saldo_cantidad) : 0;
        let saldo_total = ultimoSaldo ? Number(ultimoSaldo.saldo_total) : 0;
        let costo_unitario_mov = 0;
        let costo_total_mov = 0;

        let precio_real_ingresado = condicion_iva === 'incluido' ? (Number(precio_ingresado) / 1.13) : Number(precio_ingresado);

        if (tipo_movimiento === 'INVENTARIO_INICIAL' || tipo_movimiento === 'COMPRA' || tipo_movimiento === 'DEV_VENTA') {
            costo_unitario_mov = precio_real_ingresado;
            costo_total_mov = cantidad * costo_unitario_mov;
            saldo_cantidad += Number(cantidad);
            saldo_total += costo_total_mov;
        } else if (tipo_movimiento === 'VENTA' || tipo_movimiento === 'DEV_COMPRA') {
            if (saldo_cantidad < cantidad) return res.status(400).json({ error: `Stock insuficiente de ${articuloUpper}.` });
            costo_unitario_mov = tipo_movimiento === 'VENTA' ? (saldo_cantidad > 0 ? (saldo_total / saldo_cantidad) : 0) : precio_real_ingresado;
            costo_total_mov = cantidad * costo_unitario_mov;
            saldo_cantidad -= Number(cantidad);
            saldo_total -= costo_total_mov;
        }

        let saldo_costo_unitario = saldo_cantidad > 0 ? (saldo_total / saldo_cantidad) : 0;
        const conceptoFinal = `${cuenta_contable} - ${concepto}`;


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
            saldo_total: Number(saldo_total.toFixed(2)),
            id_empresa: id_empresa
        };

        await KardexModel.insertarMovimiento(nuevoMovimiento);
        res.status(201).json({ mensaje: 'Movimiento registrado correctamente' });

    } catch (error) {
        res.status(500).json({ error: 'Error al registrar el movimiento' });
    }
};

const obtenerKardex = async (req, res) => {
    try {
        const { filtro, id_empresa } = req.params;
        if (!id_empresa) return res.status(401).json({ error: 'Falta el ID de la empresa' });
        
        const filtroNormalizado = filtro ? filtro.trim().toUpperCase() : 'GLOBAL';
        const historial = await KardexModel.obtenerHistorialKardex(filtroNormalizado, id_empresa);
        res.status(200).json(historial);
    } catch (error) {
        res.status(500).json({ error: 'Error al obtener historial' });
    }
};

const anularUltimo = async (req, res) => {
    try {
        const { id_movimiento, id_empresa } = req.params;
        if (!id_empresa) return res.status(401).json({ error: 'Falta el ID de la empresa' });

        await KardexModel.anularMovimiento(id_movimiento, id_empresa);
        res.status(200).json({ mensaje: 'Movimiento anulado' });
    } catch (error) {
        res.status(500).json({ error: 'Error al anular' });
    }
};

const obtenerListaArticulos = async (req, res) => {
    try {
        const { id_empresa } = req.params;
        if (!id_empresa) return res.status(401).json({ error: 'Falta el ID de la empresa' });

        const articulos = await KardexModel.obtenerArticulosUnicos(id_empresa);
        res.status(200).json(articulos);
    } catch (error) {
        res.status(500).json({ error: 'Error al obtener la lista de artículos' });
    }
};

module.exports = { registrarMovimientoKardex, obtenerKardex, anularUltimo, obtenerListaArticulos };