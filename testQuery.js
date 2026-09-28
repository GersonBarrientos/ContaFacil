const { pool } = require('./db.js');
const idEmpresa = 1;
const empresa = { login_email: 'test@lavaquita.com', login_password: '321' };

async function run() {
    let updateQuery = 'UPDATE public.usuarios SET email = $1';
    let params = [empresa.login_email, idEmpresa];
    if (empresa.login_password && empresa.login_password.trim() !== '') {
        updateQuery += ', password = $3';
        params.push(empresa.login_password.trim());
    }
    updateQuery += " WHERE id_empresa = $2 AND rol = 'admin' AND estado = 'ACTIVO' RETURNING *";
    console.log(updateQuery, params);
    try {
      const res = await pool.query(updateQuery, params);
      console.log(res.rows);
    } catch(e) { console.error(e); }
    process.exit(0);
}
run();
