const { pool } = require('../db');

// Obtener catálogo de cuentas.
const getCuentas = async () => {
    const { rows } = await pool.query(`
        SELECT
            s.codigo_subcuenta AS "CodigoSubcuenta",
            s.nombre_subcuenta AS "NombreSubcuenta",
            c.nombre_cuenta AS "Categoria"
        FROM public.subcuentas s
        JOIN public.cuentas_principales c
            ON c.codigo_cuenta = s.codigo_cuenta
        ORDER BY s.codigo_subcuenta ASC
    `);

    return rows;
};

const obtenerCodigosSubcuenta = async (codigos) => {
    const { rows } = await pool.query(
        `SELECT codigo_subcuenta
         FROM public.subcuentas
         WHERE codigo_subcuenta = ANY($1::text[])`,
        [codigos]
    );

    return rows.map((row) => String(row.codigo_subcuenta));
};

// Obtener o crear un Libro Diario por defecto.
const obtenerOCrearLibro = async (nombreLibro = 'Guía Principal - Ejercicios') => {
    const { rows } = await pool.query(
        `INSERT INTO public.libros_diarios (nombre_libro)
         VALUES ($1)
         ON CONFLICT (nombre_libro)
         DO UPDATE SET nombre_libro = EXCLUDED.nombre_libro
         RETURNING id_libro`,
        [nombreLibro]
    );

    return rows[0].id_libro;
};

// Insertar partida doble mediante la función transaccional de PostgreSQL.
const guardarAsiento = async (idLibro, fecha, descripcion, detalles = []) => {
    if (!Array.isArray(detalles) || detalles.length < 2) {
        throw new Error('El asiento debe contener al menos dos detalles.');
    }

    for (const detalle of detalles) {
        if (!detalle || typeof detalle.codigo !== 'string' || detalle.codigo.trim() === '') {
            throw new Error('Cada detalle debe incluir un código de subcuenta válido.');
        }

        const debe = Number(detalle.debe);
        const haber = Number(detalle.haber);

        if (!Number.isFinite(debe) || !Number.isFinite(haber)
            || debe < 0 || haber < 0
            || (debe > 0) === (haber > 0)) {
            throw new Error('Cada detalle debe tener exactamente un importe positivo.');
        }
    }

    const { rows } = await pool.query(
        `SELECT public.guardar_asiento_completo($1, $2::date, $3, $4::jsonb) AS id_asiento`,
        [idLibro, fecha, descripcion, JSON.stringify(detalles)]
    );

    return rows[0].id_asiento;
};

// Ver historial agrupado por libros y asientos.
const obtenerHistorialAsientos = async () => {
    const { rows } = await pool.query(`
        SELECT
            id_libro AS "IdLibro",
            id_asiento AS "IdAsiento",
            fecha AS "Fecha",
            descripcion AS "Descripcion",
            codigo_subcuenta AS "CodigoSubcuenta",
            cuenta_principal AS "CuentaPrincipal",
            debe AS "Debe",
            haber AS "Haber"
        FROM public.vw_historial_asientos
        ORDER BY id_libro DESC, id_asiento DESC, codigo_subcuenta ASC
    `);

    return rows;
};

module.exports = {
    getCuentas,
    obtenerCodigosSubcuenta,
    obtenerOCrearLibro,
    guardarAsiento,
    obtenerHistorialAsientos
};
