const { getConnection } = require('../db');

// Obtener catálogo de cuentas
const getCuentas = async () => {
    const connection = await getConnection();
    const [rows] = await connection.query(`
        SELECT s.CodigoSubcuenta, s.NombreSubcuenta, c.NombreCuenta AS Categoria 
        FROM Subcuentas s 
        JOIN CuentasPrincipales c ON s.CodigoCuenta = c.CodigoCuenta
    `);
    connection.release();
    return rows;
};

// Obtener o crear un Libro Diario por defecto
const obtenerOCrearLibro = async (nombreLibro = "Guía Principal - Ejercicios") => {
    const connection = await getConnection();
    try {
        let [rows] = await connection.query(
            'SELECT IdLibro FROM LibrosDiarios WHERE NombreLibro = ?', 
            [nombreLibro]
        );
        
        if (rows.length > 0) {
            return rows[0].IdLibro;
        }

        let [result] = await connection.query(
            'INSERT INTO LibrosDiarios (NombreLibro) VALUES (?)', 
            [nombreLibro]
        );
        return result.insertId;
    } finally {
        connection.release();
    }
};

// Insertar partida doble vinculada a un libro
const guardarAsiento = async (idLibro, fecha, descripcion, detalles) => {
    const connection = await getConnection();
    try {
        // Nos aseguramos de convertir 'detalles' a string JSON explícitamente
        const detallesJson = JSON.stringify(detalles);

        await connection.query(
            'CALL sp_GuardarAsientoCompleto(?, ?, ?, ?)',
            [idLibro, fecha, descripcion, detallesJson]
        );
    } finally {
        connection.release();
    }
};

// Ver historial agrupado por libros y asientos
const obtenerHistorialAsientos = async () => {
    const connection = await getConnection();
    try {
        const [rows] = await connection.query(`
            SELECT * FROM vw_HistorialAsientos 
            ORDER BY IdLibro DESC, IdAsiento DESC, CodigoSubcuenta ASC;
        `);
        return rows;
    } finally {
        connection.release();
    }
};

module.exports = { 
    getCuentas, 
    obtenerOCrearLibro, 
    guardarAsiento, 
    obtenerHistorialAsientos 
};