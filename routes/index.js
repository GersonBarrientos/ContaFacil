const express = require('express');
const router = express.Router();


const { obtenerCuentas, crearAsiento, getHistorial } = require('../controllers/contabilidadController');

router.get('/historial', getHistorial);
router.get('/cuentas', obtenerCuentas);
router.post('/asientos', crearAsiento);

module.exports = router;