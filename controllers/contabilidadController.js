const ContabilidadModel = require('../models/contabilidadModel');

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
    const { fecha, descripcion, detalles } = req.body;
    try {
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