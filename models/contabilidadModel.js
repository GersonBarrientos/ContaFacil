const { pool } = require('../db');

const obtenerEmpresaActual = async idEmpresa => {
    const { rows } = await pool.query(`
        SELECT id_empresa, nombre_legal, nombre_comercial, nit, nrc, giro_comercial,
               direccion, telefono, email, logo, moneda, pais
        FROM public.empresas
        WHERE id_empresa = $1 AND estado = 'ACTIVO'
    `, [idEmpresa]);
    return rows[0] || null;
};

const actualizarEmpresa = async (idEmpresa, empresa) => {
    const { rowCount } = await pool.query(`
        UPDATE public.empresas
        SET nombre_legal = $1, nombre_comercial = $2, nit = $3, nrc = $4,
            giro_comercial = $5, direccion = $6, telefono = $7, email = $8,
            logo = $9, moneda = $10, pais = $11, updated_at = now()
        WHERE id_empresa = $12
    `, [
        empresa.nombre_legal, empresa.nombre_comercial || null, empresa.nit || null,
        empresa.nrc || null, empresa.giro_comercial || null, empresa.direccion || null,
        empresa.telefono || null, empresa.email || null, empresa.logo || null,
        empresa.moneda || 'USD', empresa.pais || 'El Salvador', idEmpresa
    ]);
    return rowCount > 0;
};

const obtenerLibros = async (idEmpresa, incluirInactivos = false) => {
    const estado = incluirInactivos ? '' : "AND l.estado = 'ACTIVO'";
    const { rows } = await pool.query(`
        SELECT l.id_libro, l.id_empresa, l.nombre_libro, l.descripcion, l.estado,
               l.created_at, l.updated_at, COUNT(a.id_asiento)::int AS cantidad_asientos
        FROM public.libros_diarios l
        LEFT JOIN public.asientos a ON a.id_libro = l.id_libro
        WHERE l.id_empresa = $1 ${estado}
        GROUP BY l.id_libro, l.id_empresa, l.nombre_libro, l.descripcion,
                 l.estado, l.created_at, l.updated_at
        ORDER BY l.nombre_libro
    `, [idEmpresa]);
    return rows;
};

const crearLibro = async (idEmpresa, nombreLibro, descripcion, estado) => {
    const { rows } = await pool.query(`
        INSERT INTO public.libros_diarios (id_empresa, nombre_libro, descripcion, estado)
        VALUES ($1, $2, $3, $4)
        RETURNING id_libro
    `, [idEmpresa, nombreLibro, descripcion || null, estado]);
    return rows[0].id_libro;
};

const actualizarLibro = async (idEmpresa, idLibro, nombreLibro, descripcion, estado) => {
    const { rowCount } = await pool.query(`
        UPDATE public.libros_diarios
        SET nombre_libro = $1, descripcion = $2, estado = $3, updated_at = now()
        WHERE id_libro = $4 AND id_empresa = $5
    `, [nombreLibro, descripcion || null, estado, idLibro, idEmpresa]);
    return rowCount > 0;
};

const eliminarLibro = async (idEmpresa, idLibro) => {
    const { rows } = await pool.query(
        'SELECT COUNT(*)::int AS cantidad FROM public.asientos WHERE id_libro = $1',
        [idLibro]
    );
    if (rows[0].cantidad > 0) {
        const error = new Error('El libro tiene asientos y no puede eliminarse físicamente');
        error.code = 'BOOK_HAS_ENTRIES';
        throw error;
    }
    await pool.query(
        'DELETE FROM public.libros_diarios WHERE id_libro = $1 AND id_empresa = $2',
        [idLibro, idEmpresa]
    );
};

const getCuentas = async () => {
    const { rows } = await pool.query(`
        SELECT s.codigo_subcuenta AS "CodigoSubcuenta",
               s.nombre_subcuenta AS "NombreSubcuenta",
               c.nombre_cuenta AS "Categoria"
        FROM public.subcuentas s
        JOIN public.cuentas_principales c ON c.codigo_cuenta = s.codigo_cuenta
        ORDER BY s.codigo_subcuenta
    `);
    return rows;
};

const guardarAsiento = async (idLibro, fecha, descripcion, detalles) => {
    const { rows } = await pool.query(
        'SELECT public.guardar_asiento_completo($1, $2::date, $3, $4::jsonb) AS id_asiento',
        [idLibro, fecha, descripcion, JSON.stringify(detalles)]
    );
    return rows[0].id_asiento;
};

const obtenerHistorialAsientos = async (idEmpresa, idLibro) => {
    const params = [idEmpresa];
    const filtroLibro = idLibro ? `AND h.id_libro = $${params.push(idLibro)}` : '';
    const { rows } = await pool.query(`
        SELECT h.id_libro AS "IdLibro", h.id_asiento AS "IdAsiento",
               h.fecha AS "Fecha", h.descripcion AS "Descripcion",
               h.codigo_subcuenta AS "CodigoSubcuenta",
               h.cuenta_principal AS "CuentaPrincipal", h.debe AS "Debe", h.haber AS "Haber"
        FROM public.vw_historial_asientos h
        JOIN public.libros_diarios l ON l.id_libro = h.id_libro
        WHERE l.id_empresa = $1 ${filtroLibro}
        ORDER BY h.id_libro DESC, h.id_asiento DESC, h.codigo_subcuenta
    `, params);
    return rows;
};

const obtenerMayorizacion = async (idEmpresa, idLibro, fechaInicio, fechaFin) => {
    const params = [idEmpresa, fechaInicio, fechaFin];
    const filtroLibro = idLibro ? `AND h.id_libro = $${params.push(idLibro)}` : '';
    const { rows } = await pool.query(`
        SELECT h.codigo_cuenta AS codigo_cuenta, h.cuenta_principal AS cuenta,
               COALESCE(SUM(h.debe), 0) AS total_debe,
               COALESCE(SUM(h.haber), 0) AS total_haber,
               COALESCE(SUM(h.debe - h.haber), 0) AS saldo
        FROM public.vw_historial_asientos h
        JOIN public.libros_diarios l ON l.id_libro = h.id_libro
        WHERE l.id_empresa = $1 AND h.fecha BETWEEN $2::date AND $3::date ${filtroLibro}
        GROUP BY h.codigo_cuenta, h.cuenta_principal
        ORDER BY h.codigo_cuenta
    `, params);
    return rows;
};

module.exports = {
    obtenerEmpresaActual, actualizarEmpresa, obtenerLibros, crearLibro,
    actualizarLibro, eliminarLibro, getCuentas, guardarAsiento,
    obtenerHistorialAsientos, obtenerMayorizacion
};
