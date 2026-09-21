require('dotenv').config();
const mysql = require('mysql2/promise'); // Conector MySQL

const pool = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

async function getConnection() {
    try {
        const connection = await pool.getConnection();
        return connection;
    } catch (error) {
        console.error("Error conectando a MySQL:", error);
        throw error;
    }
}

module.exports = { pool, getConnection };