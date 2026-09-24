const express = require('express');
const { pool } = require('../db');
const router = express.Router();


const {
    obtenerEmpresa, actualizarEmpresa, obtenerLibros, crearLibro, actualizarLibro, eliminarLibro,
    obtenerCuentas, crearAsiento, getHistorial, obtenerMayorizacion, obtenerBalanceComprobacion
} = require('../controllers/contabilidadController');

router.get('/health', async (req, res) => {
    try {
        await pool.query('SELECT 1');
        res.json({ ok: true, database: 'supabase-postgresql' });
    } catch (error) {
        console.error('Error en health check:', error);
        res.status(503).json({ ok: false, error: 'No se pudo conectar con Supabase PostgreSQL' });
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

module.exports = router;