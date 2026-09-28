const fetch = require('node-fetch'); // actually, just use built-in fetch if node >= 18
const d = { 
  nombre_legal: 'La Vaquita Feliz SA de CV', 
  login_email: 'gerencia@lavaquita.com',
  login_password: '123'
};
fetch('http://localhost:3000/api/empresa/1', {
  method: 'PUT',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(d)
}).then(r=>r.json()).then(data => {
  console.log("RESPONSE:", data);
}).catch(console.error);
