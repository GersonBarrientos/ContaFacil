const { Pool } = require('pg');
require('dotenv').config();

// Usamos tu variable o la de Gerson para evitar errores
const dbUrl = process.env.DATABASE_URL || process.env.SUPABASE_DB_URL;

if (!dbUrl) {
    throw new Error('Falta la URL de la base de datos en el archivo .env');
}

// Creamos la conexión general hacia Supabase
const pool = new Pool({
    connectionString: dbUrl,
    ssl: { rejectUnauthorized: false },
    max: 10
});

pool.on('error', error => {
    console.error('Error inesperado en la conexión PostgreSQL:', error);
});

// Prueba de conexión al iniciar
pool.query('SELECT NOW()')
    .then(() => console.log('✅ Conexión exitosa a Supabase PostgreSQL en la nube ☁️'))
    .catch(err => console.error('❌ Error conectando a Supabase:', err.message));

// Adaptador para que el código viejo siga creyendo que usa MySQL
const getConnection = async () => {
    const client = await pool.connect();
    
    const originalQuery = client.query.bind(client);
    
    client.query = async (...args) => {
        if (typeof args[0] === 'string' && args[0].includes('?')) {
            let i = 1;
            args[0] = args[0].replace(/\?/g, () => `$${i++}`);
        }
        
        try {
            const result = await originalQuery(...args);
            return [result.rows, result.fields]; 
        } catch (error) {
            throw error;
        }
    };

    return client;
};

// Exportamos AMBAS opciones para que todo el sistema funcione
module.exports = { pool, getConnection };