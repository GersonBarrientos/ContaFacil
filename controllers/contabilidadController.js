const ContabilidadModel = require('../models/contabilidadModel');

const MAX_DESCRIPTION_LENGTH = 500;
const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

const isValidDate = (value) => {
    if (typeof value !== 'string' || !DATE_PATTERN.test(value)) {
        return false;
    }

    const date = new Date(`${value}T00:00:00Z`);
    return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value;
};

const validateAsiento = ({ fecha, descripcion, detalles }) => {
    if (!isValidDate(fecha)) {
        return "La fecha debe tener el formato YYYY-MM-DD y ser válida";
    }

    if (typeof descripcion !== 'string' || descripcion.trim() === '' || descripcion.length > MAX_DESCRIPTION_LENGTH) {
        return `La descripción es obligatoria y no puede superar ${MAX_DESCRIPTION_LENGTH} caracteres`;
    }

    if (!Array.isArray(detalles) || detalles.length < 2) {
        return "El asiento debe contener al menos dos detalles";
    }

    let totalDebe = 0;
    let totalHaber = 0;
    for (const detalle of detalles) {
        if (!detalle || typeof detalle.codigo !== 'string' || detalle.codigo.trim() === '') {
            return "Cada detalle debe tener un código de subcuenta";
        }

        if (!Number.isFinite(detalle.debe) || !Number.isFinite(detalle.haber)
            || detalle.debe < 0 || detalle.haber < 0
            || (detalle.debe === 0) === (detalle.haber === 0)) {
            return "Cada detalle debe tener exactamente un importe positivo";
        }

        totalDebe += Math.round(detalle.debe * 100);
        totalHaber += Math.round(detalle.haber * 100);
    }

    if (totalDebe !== totalHaber) {
        return "El asiento debe estar balanceado: el Debe y el Haber deben coincidir";
    }

    return null;
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
    const { fecha, descripcion, detalles } = req.body || {};
    const validationError = validateAsiento({ fecha, descripcion, detalles });
    if (validationError) {
        return res.status(400).json({ error: validationError });
    }

    try {
        const codigos = detalles.map((detalle) => detalle.codigo.trim());
        const codigosValidos = new Set(await ContabilidadModel.obtenerCodigosSubcuenta(codigos));
        if (codigos.some((codigo) => !codigosValidos.has(codigo))) {
            return res.status(400).json({ error: "El asiento contiene una subcuenta inexistente" });
        }

        // 1. Obtenemos o creamos automáticamente un libro diario general para tus prácticas
        const idLibro = await ContabilidadModel.obtenerOCrearLibro("Guía de Práctica Contable");

        // 2. Llamamos al modelo pasando los 4 parámetros requeridos (IdLibro, Fecha, Descripcion, Detalles)
        await ContabilidadModel.guardarAsiento(idLibro, fecha, descripcion, detalles);

        res.json({ mensaje: "Asiento procesado y guardado con éxito" });
    } catch (error) {
        console.error("Error guardando asiento:", error);
        res.status(500).json({ error: "Error interno al procesar el asiento contable" });
    }
};

// Visualizar asientos
const getHistorial = async (req, res) => {
    try {
        const historial = await ContabilidadModel.obtenerHistorialAsientos();
        res.json(historial);
    } catch (error) {
        console.error("Error al obtener historial:", error);
        res.status(500).json({ error: "Error al cargar el historial de asientos" });
    }
};

// Exportamos las tres funciones juntas al final del archivo
module.exports = { 
    obtenerCuentas, 
    crearAsiento, 
    getHistorial 
};