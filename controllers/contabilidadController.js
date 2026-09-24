const ContabilidadModel = require('../models/contabilidadModel');

const idPositivo = value => {
    if (Array.isArray(value) || typeof value === 'object') return false;
    return Number.isInteger(Number(value)) && Number(value) > 0;
};

const mensajeErrorSupabase = error => {
    if (error.code === '42P01') return 'La tabla requerida no existe en Supabase. Ejecuta la migración PostgreSQL.';
    if (error.code === '42703') return 'Falta una columna en Supabase. Ejecuta la migración PostgreSQL y revisa el esquema.';
    if (error.code === 'PGRST301' || error.message?.includes('Invalid API key')) return 'La clave de Supabase es inválida.';
    if (error.code === 'ECONNREFUSED' || error.code === 'ENOTFOUND' || error.code === 'ENETUNREACH') {
        return 'No se pudo conectar con Supabase PostgreSQL. Verifica SUPABASE_DB_URL, la contraseña y la red.';
    }
    return error.message || 'Error de Supabase';
};

const obtenerEmpresa = async (req, res) => {
    const idEmpresa = req.query.idEmpresa || 1;
    if (!idPositivo(idEmpresa)) return res.status(400).json({ error: 'idEmpresa debe ser un entero positivo' });
    try {
        const empresa = await ContabilidadModel.obtenerEmpresaActual(Number(idEmpresa));
        if (!empresa) return res.status(404).json({ error: 'Empresa no encontrada o inactiva' });
        res.json(empresa);
    } catch (error) {
        console.error('Error consultando empresa:', error);
        res.status(500).json({ error: 'Error al obtener la empresa' });
    }
};

const actualizarEmpresa = async (req, res) => {
    const idEmpresa = Number(req.params.idEmpresa);
    const { nombre_legal } = req.body;
    if (!idPositivo(idEmpresa) || !nombre_legal || !nombre_legal.trim()) {
        return res.status(400).json({ error: 'nombre_legal e idEmpresa son obligatorios' });
    }
    try {
        const actualizado = await ContabilidadModel.actualizarEmpresa(idEmpresa, req.body);
        if (!actualizado) return res.status(404).json({ error: 'Empresa no encontrada' });
        res.json(await ContabilidadModel.obtenerEmpresaActual(idEmpresa));
    } catch (error) {
        console.error('Error actualizando empresa:', error);
        res.status(500).json({ error: 'Error al guardar la configuración de la empresa' });
    }
};

const obtenerLibros = async (req, res) => {
    const idEmpresa = req.query.idEmpresa || 1;
    if (!idPositivo(idEmpresa)) return res.status(400).json({ error: 'idEmpresa debe ser un entero positivo' });
    try {
        res.json(await ContabilidadModel.obtenerLibros(Number(idEmpresa), req.query.incluirInactivos === 'true'));
    } catch (error) {
        console.error('Error consultando libros:', error);
        res.status(500).json({ error: mensajeErrorSupabase(error), codigo: error.code || 'SUPABASE_ERROR' });
    }
};

const crearLibro = async (req, res) => {
    const { idEmpresa = 1, nombreLibro, descripcion, estado = 'ACTIVO' } = req.body;
    if (!idPositivo(idEmpresa) || !nombreLibro || !nombreLibro.trim()) {
        return res.status(400).json({ error: 'idEmpresa y nombreLibro son obligatorios' });
    }
    if (!['ACTIVO', 'INACTIVO'].includes(estado)) return res.status(400).json({ error: 'Estado inválido' });
    try {
        const idLibro = await ContabilidadModel.crearLibro(Number(idEmpresa), nombreLibro.trim(), descripcion, estado);
        res.status(201).json({ id_libro: idLibro });
    } catch (error) {
        console.error('Error creando libro:', error);
        res.status(error.code === 'ER_DUP_ENTRY' ? 409 : 500).json({
            error: error.code === 'ER_DUP_ENTRY' ? 'Ya existe un libro con ese nombre en la empresa' : 'Error al crear el libro'
        });
    }
};

const actualizarLibro = async (req, res) => {
    const { idEmpresa = 1, nombreLibro, descripcion, estado } = req.body;
    const idLibro = Number(req.params.idLibro);
    if (!idPositivo(idEmpresa) || !idPositivo(idLibro) || !nombreLibro || !nombreLibro.trim()) {
        return res.status(400).json({ error: 'Datos inválidos para actualizar el libro' });
    }
    if (!['ACTIVO', 'INACTIVO'].includes(estado)) return res.status(400).json({ error: 'Estado inválido' });
    try {
        const actualizado = await ContabilidadModel.actualizarLibro(Number(idEmpresa), idLibro, nombreLibro.trim(), descripcion, estado);
        if (!actualizado) return res.status(404).json({ error: 'Libro no encontrado' });
        res.json({ mensaje: 'Libro actualizado correctamente' });
    } catch (error) {
        console.error('Error actualizando libro:', error);
        res.status(error.code === 'ER_DUP_ENTRY' ? 409 : 500).json({
            error: error.code === 'ER_DUP_ENTRY' ? 'Ya existe un libro con ese nombre en la empresa' : 'Error al actualizar el libro'
        });
    }
};

const eliminarLibro = async (req, res) => {
    const idEmpresa = req.query.idEmpresa || 1;
    const idLibro = Number(req.params.idLibro);
    if (!idPositivo(idEmpresa) || !idPositivo(idLibro)) return res.status(400).json({ error: 'Identificadores inválidos' });
    try {
        await ContabilidadModel.eliminarLibro(Number(idEmpresa), idLibro);
        res.status(204).send();
    } catch (error) {
        if (error.code === 'BOOK_HAS_ENTRIES') return res.status(409).json({ error: error.message, accion: 'DESACTIVAR' });
        console.error('Error eliminando libro:', error);
        res.status(500).json({ error: 'Error al eliminar el libro' });
    }
};

const obtenerCuentas = async (req, res) => {
    try {
        const cuentas = await ContabilidadModel.getCuentas();
        res.json(cuentas);
    } catch (error) {
        console.error("Error consultando cuentas:", error);
        res.status(500).json({ error: "Error al obtener el catálogo de cuentas" });
    }
};

const crearAsiento = async (req, res) => {
    const { idEmpresa = 1, idLibro, fecha, descripcion, detalles } = req.body;
    if (!idPositivo(idEmpresa) || !idPositivo(idLibro) || !fecha || !Array.isArray(detalles) || detalles.length === 0) {
        return res.status(400).json({ error: 'idEmpresa, idLibro, fecha y detalles son obligatorios' });
    }
    const regexFecha = /^\d{4}-\d{2}-\d{2}$/;
    if (!regexFecha.test(fecha)) {
        return res.status(400).json({ error: 'El formato de fecha debe ser YYYY-MM-DD' });
    }

    // Validar rigurosamente cada línea para evitar inyección o montos negativos
    for (const d of detalles) {
        if (!d.codigo || typeof d.codigo !== 'string' || typeof d.debe !== 'number' || typeof d.haber !== 'number' || d.debe < 0 || d.haber < 0 || (d.debe === 0 && d.haber === 0) || (d.debe > 0 && d.haber > 0)) {
            return res.status(400).json({ error: 'Estructura de detalles inválida o montos negativos' });
        }
    }

    try {
        const libroActivo = await ContabilidadModel.verificarLibroActivo(Number(idEmpresa), Number(idLibro));
        if (!libroActivo) return res.status(404).json({ error: 'El libro no existe o está inactivo' });
        await ContabilidadModel.guardarAsiento(Number(idLibro), fecha, descripcion, detalles);

        res.json({ mensaje: "Asiento procesado y guardado con éxito" });
    } catch (error) {
        console.error("Error guardando asiento:", error);
        if (error.code === 'P0001') {
            return res.status(400).json({ error: error.message });
        }
        res.status(500).json({ error: "Error interno al procesar el asiento contable" });
    }
};

// Visualizar asientos
const getHistorial = async (req, res) => {
    const idEmpresa = req.query.idEmpresa || 1;
    const idLibro = req.query.idLibro ? Number(req.query.idLibro) : null;
    if (!idPositivo(idEmpresa) || (idLibro !== null && !idPositivo(idLibro))) {
        return res.status(400).json({ error: 'Identificadores inválidos' });
    }
    try {
        const historial = await ContabilidadModel.obtenerHistorialAsientos(Number(idEmpresa), idLibro);
        res.json(historial);
    } catch (error) {
        console.error("Error al obtener historial:", error);
        res.status(500).json({ error: "Error al cargar el historial de asientos" });
    }
};

const obtenerMayorizacion = async (req, res) => {
    const { idEmpresa = 1, idLibro, fechaInicio, fechaFin } = req.query;
    if (!idPositivo(idEmpresa) || (idLibro && !idPositivo(idLibro)) || !fechaInicio || !fechaFin || fechaInicio > fechaFin) {
        return res.status(400).json({ error: 'Empresa, fechas y rango válido son obligatorios' });
    }
    const regexFecha = /^\d{4}-\d{2}-\d{2}$/;
    if (!regexFecha.test(fechaInicio) || !regexFecha.test(fechaFin)) {
        return res.status(400).json({ error: 'El formato de las fechas debe ser YYYY-MM-DD' });
    }
    try {
        res.json(await ContabilidadModel.obtenerMayorizacion(
            Number(idEmpresa), idLibro ? Number(idLibro) : null, fechaInicio, fechaFin
        ));
    } catch (error) {
        console.error('Error consultando mayorización:', error);
        res.status(500).json({ error: 'Error al obtener la mayorización' });
    }
};

const obtenerBalanceComprobacion = async (req, res) => {
    const { idEmpresa = 1, idLibro, fechaInicio, fechaFin } = req.query;
    
    if (!idPositivo(idEmpresa) || !idPositivo(idLibro) || !fechaFin) {
        return res.status(400).json({ error: 'Empresa, libro y fecha de corte son obligatorios' });
    }
    
    if (fechaInicio && fechaInicio > fechaFin) {
        return res.status(400).json({ error: 'La fecha de inicio no puede ser posterior a la fecha de corte' });
    }

    const regexFecha = /^\d{4}-\d{2}-\d{2}$/;
    if (!regexFecha.test(fechaFin) || (fechaInicio && !regexFecha.test(fechaInicio))) {
        return res.status(400).json({ error: 'El formato de fecha debe ser YYYY-MM-DD' });
    }

    try {
        const balance = await ContabilidadModel.obtenerBalanceComprobacion(
            Number(idEmpresa), Number(idLibro), fechaInicio, fechaFin
        );
        res.json(balance);
    } catch (error) {
        console.error('Error consultando balance de comprobación:', error);
        if (error.code === 'P0001') {
            return res.status(400).json({ error: error.message });
        }
        res.status(500).json({ error: 'Error al obtener el balance de comprobación' });
    }
};

// Exportamos las tres funciones juntas al final del archivo
module.exports = {
    obtenerEmpresa,
    actualizarEmpresa,
    obtenerLibros,
    crearLibro,
    actualizarLibro,
    eliminarLibro,
    obtenerCuentas,
    crearAsiento,
    getHistorial,
    obtenerMayorizacion,
    obtenerBalanceComprobacion
};