const {pool} = require('./db'); 
pool.query('SELECT * FROM public.libros_diarios').then(r => {
    console.log("LIBROS:", r.rows); 
    return pool.query('SELECT * FROM public.asientos LIMIT 5');
}).then(r => {
    console.log("ASIENTOS:", r.rows); 
    process.exit(0);
}).catch(console.error);
