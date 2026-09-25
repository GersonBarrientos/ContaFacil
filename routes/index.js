const express = require('express');
const { pool } = require('../db');
const router = express.Router();

const {
    obtenerEmpresa, actualizarEmpresa, obtenerLibros, crearLibro, actualizarLibro, eliminarLibro,
    obtenerCuentas, crearAsiento, getHistorial, obtenerMayorizacion, obtenerBalanceComprobacion
} = require('../controllers/contabilidadController');

const kardexController = require('../controllers/kardexController');

router.get('/health', async (req, res) => {
    try {
        await pool.query('SELECT 1');
        res.json({ ok: true, database: 'supabase-postgresql' });
    } catch (error) {
        res.status(503).json({ ok: false, error: 'Error de conexión' });
    }
});

router.get('/empresa', obtenerEmpresa);
router.put('/empresa/:idEmpresa', actualizarEmpresa);
router.get('/libros', obtenerLibros);
router.post('/libros', crearLibro);
router.patch('/libros/:idLibro', actualizarLibro);
router.delete('/libros/:idLibro', eliminarLibro);
router.get('/historial', getHistorial);
router.get('/mayorizacion', obtenerMayorizacion);
router.get('/balance-comprobacion', obtenerBalanceComprobacion);
router.get('/cuentas', obtenerCuentas);
router.post('/asientos', crearAsiento);

// Rutas del Kardex
router.get('/kardex-articulos', kardexController.obtenerListaArticulos); 
router.post('/kardex', kardexController.registrarMovimientoKardex);
router.get('/kardex/:filtro', kardexController.obtenerKardex);
router.delete('/kardex/:id_movimiento', kardexController.anularUltimo);

module.exports = router;