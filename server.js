const express = require('express');
require('dotenv').config();

const apiRoutes = require('./routes/index');

const app = express();

// Middlewares
app.use(express.json()); 

// VISTA
app.use(express.static('public')); 

// RUTAS
app.use('/api', apiRoutes);

// INICIO DEL SERVIDOR
const port = process.env.PORT || 3000;
app.listen(port, () => {
    console.log(`Servidor API corriendo en http://localhost:${port}`);
    console.log(`Vista Frontend disponible en http://localhost:${port}/index.html`);
});