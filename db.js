require('dotenv').config();
const { Pool } = require('pg');

if (!process.env.DATABASE_URL) {
    throw new Error(
        'DATABASE_URL no está definida. Verifica que exista un archivo .env con esa variable ' +
        '(revisa .env.example para el formato esperado).'
    );
}

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: {
        rejectUnauthorized: false
    }
});

pool.on('connect', () => {
    console.log('Conectado a PostgreSQL/Supabase');
});

pool.on('error', (err) => {
    console.error('Error inesperado en el pool de PostgreSQL:', err);
});

module.exports = { pool };