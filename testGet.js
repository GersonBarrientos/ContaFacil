const { pool } = require('./db.js');
async function run() {
  const { rows } = await pool.query(`
        SELECT e.id_empresa, e.nombre_legal,
               u.email as login_email
        FROM public.empresas e
        LEFT JOIN public.usuarios u ON u.id_empresa = e.id_empresa AND u.rol = 'admin' AND u.estado = 'ACTIVO'
        WHERE e.id_empresa = 1 AND e.estado = 'ACTIVO'
        LIMIT 1
  `);
  console.log(rows);
  process.exit(0);
}
run();
