const { pool } = require('../db');

const obtenerUltimoSaldo = async (articulo, id_empresa) => {
    try {
        const result = await pool.query(
            'SELECT * FROM kardex WHERE codigo_articulo = $1 AND id_empresa = $2 ORDER BY id_movimiento DESC LIMIT 1',
            [articulo, id_empresa]
        );
        return result.rows[0] || null;
    } catch (error) {
        throw error;
    }
};

const insertarMovimiento = async (datos) => {
    try {
        const query = `
            INSERT INTO kardex (
                fecha, codigo_articulo, concepto, tipo_movimiento, cantidad,
                costo_unitario, costo_total, saldo_cantidad, saldo_costo_unitario, saldo_total, id_empresa
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
            RETURNING *;
        `;
        const values = [
            datos.fecha, datos.codigo_articulo, datos.concepto, datos.tipo_movimiento, datos.cantidad,
            datos.costo_unitario, datos.costo_total, datos.saldo_cantidad, datos.saldo_costo_unitario, datos.saldo_total,
            datos.id_empresa
        ];
        const result = await pool.query(query, values);
        return result.rows[0];
    } catch (error) {
        throw error;
    }
};

const obtenerHistorialKardex = async (articulo, id_empresa) => {
    try {
        let query = 'SELECT * FROM kardex WHERE id_empresa = $1 ORDER BY fecha ASC, id_movimiento ASC';
        let values = [id_empresa];

        if (articulo && articulo !== 'GLOBAL') {
            query = `
                SELECT * FROM kardex 
                WHERE codigo_articulo = $1 AND id_empresa = $2 
                ORDER BY fecha ASC, id_movimiento ASC
            `;
            values = [articulo, id_empresa];
        }
        const result = await pool.query(query, values);
        return result.rows;
    } catch (error) {
        throw error;
    }
};

const anularMovimiento = async (id_movimiento, id_empresa) => {
    try {
        await pool.query(
            'DELETE FROM kardex WHERE id_movimiento = $1 AND id_empresa = $2',
            [id_movimiento, id_empresa]
        );
        return true;
    } catch (error) {
        throw error;
    }
};

const obtenerArticulosUnicos = async (id_empresa) => {
    try {
        const result = await pool.query(
            'SELECT DISTINCT codigo_articulo FROM kardex WHERE id_empresa = $1 ORDER BY codigo_articulo ASC',
            [id_empresa]
        );
        return result.rows.map(row => row.codigo_articulo);
    } catch (error) {
        throw error;
    }
};

module.exports = {
    obtenerUltimoSaldo, insertarMovimiento, obtenerHistorialKardex, anularMovimiento, obtenerArticulosUnicos
};