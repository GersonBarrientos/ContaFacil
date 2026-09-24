const express = require('express');
const cors = require('cors');
require('dotenv').config();
const { pool } = require('./db');

const apiRoutes = require('./routes/index');

const app = express();

// Middlewares
app.use(cors());
app.use(express.json()); 

// VISTA
app.use(express.static('public')); 

// RUTAS
app.use('/api', apiRoutes);

// INICIO DEL SERVIDOR
const port = process.env.PORT || 3000;
app.listen(port, async () => {
    console.log(`Servidor API corriendo en http://localhost:${port}`);
    console.log(`Vista Frontend disponible en http://localhost:${port}/index.html`);
    try {
        await pool.query('SELECT 1');
        console.log('Conexión a Supabase PostgreSQL verificada.');
    } catch (error) {
        console.error(`No se pudo conectar a Supabase PostgreSQL: ${error.message}`);
    }
});