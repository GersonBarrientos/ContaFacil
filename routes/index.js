const express = require('express');
const { pool } = require('../db');
const router = express.Router();

const {
    obtenerEmpresa, actualizarEmpresa, obtenerLibros, crearLibro, actualizarLibro, eliminarLibro,
    obtenerCuentas, crearAsiento, getHistorial, obtenerMayorizacion, obtenerBalanceComprobacion,
    getEstadoResultados, getBalanceGeneral // <-- 1. Importamos la función del Balance General
} = require('../controllers/contabilidadController');

const kardexController = require('../controllers/kardexController');

// --- SISTEMA DE LOGIN CON BASE DE DATOS SUPABASE ---
router.post('/login', async (req, res) => {
    const { email, password } = req.body;
    try {
        const { rows } = await pool.query(
            "SELECT id_usuario, id_empresa, email, nombre FROM public.usuarios WHERE email = $1 AND password = $2 AND estado = 'ACTIVO'", 
            [email, password]
        );
        
        if (rows.length > 0) {
            const user = rows[0];
            res.json({ ok: true, empresa_id: user.id_empresa, email: user.email, nombre: user.nombre });
        } else {
            res.status(401).json({ error: 'Credenciales incorrectas' });
        }
    } catch (error) {
        console.error('Error de login:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
});

// --- SISTEMA DE REGISTRO DE EMPRESA Y USUARIO ---
router.post('/registro', async (req, res) => {
    const { nombre_legal, email, password } = req.body;

    if (!nombre_legal || !email || !password) {
        return res.status(400).json({ error: 'Faltan campos obligatorios' });
    }

    const client = await pool.connect();
    try {
        await client.query('BEGIN');

        // Validar si el email ya existe
        const { rows: existingUsers } = await client.query('SELECT email FROM public.usuarios WHERE email = $1', [email]);
        if (existingUsers.length > 0) {
            await client.query('ROLLBACK');
            return res.status(400).json({ error: 'El correo ya está registrado.' });
        }

        // Crear la nueva empresa
        const insertEmpresa = `
            INSERT INTO public.empresas (nombre_legal, moneda, pais, estado)
            VALUES ($1, 'USD', 'El Salvador', 'ACTIVO')
            RETURNING id_empresa
        `;
        const { rows: empresaRows } = await client.query(insertEmpresa, [nombre_legal]);
        const id_empresa = empresaRows[0].id_empresa;

        // Crear el usuario admin para la empresa
        const nombre_usuario = 'Admin ' + nombre_legal;
        const insertUsuario = `
            INSERT INTO public.usuarios (id_empresa, nombre, email, password, rol, estado)
            VALUES ($1, $2, $3, $4, 'admin', 'ACTIVO')
            RETURNING id_usuario, nombre
        `;
        const { rows: userRows } = await client.query(insertUsuario, [id_empresa, nombre_usuario, email, password]);
        const user = userRows[0];

        // Opcional: Podríamos pre-crear un libro mayor por defecto u otros catálogos si quisiéramos.

        await client.query('COMMIT');
        
        // Loguear automáticamente
        res.json({ ok: true, empresa_id: id_empresa, email: email, nombre: user.nombre });
        
    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Error de registro:', error);
        res.status(500).json({ error: 'Error interno al registrar la empresa' });
    } finally {
        client.release();
    }
});

// ------------------------------------------

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

// Ruta del Estado de Resultados
router.get('/estado-resultados', getEstadoResultados);

// Ruta del Balance General
router.get('/balance-cuentas', getBalanceGeneral); // <-- 2. Declaramos la ruta pública del Balance

// Rutas del Kardex
router.get('/kardex-articulos', kardexController.obtenerListaArticulos); 
router.post('/kardex', kardexController.registrarMovimientoKardex);
router.get('/kardex/:filtro', kardexController.obtenerKardex);
router.delete('/kardex/:id_movimiento', kardexController.anularUltimo);

module.exports = router;