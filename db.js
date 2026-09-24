require('dotenv').config();
const { Pool } = require('pg');

if (!process.env.SUPABASE_DB_URL) {
    throw new Error('Falta SUPABASE_DB_URL en el archivo .env');
}

const pool = new Pool({
    connectionString: process.env.SUPABASE_DB_URL,
    ssl: { rejectUnauthorized: false },
    max: 10
});

pool.on('error', error => {
    console.error('Error inesperado en la conexión PostgreSQL:', error);
});

module.exports = { pool };
