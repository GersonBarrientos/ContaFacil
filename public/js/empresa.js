const idEmpresa = Number(localStorage.getItem('idEmpresa') || 1);
const form = document.getElementById('empresaForm');

const mostrar = (texto, tipo) => {
    document.getElementById('mensaje').innerHTML = `<div class="alert alert-${tipo}">${texto}</div>`;
};

async function cargarEmpresa() {
    const response = await fetch(`/api/empresa?idEmpresa=${idEmpresa}`);
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || 'No se pudo cargar la empresa');
    Object.entries(data).forEach(([key, value]) => {
        const input = form.elements[key];
        if (input) input.value = value || '';
    });
}

form.addEventListener('submit', async event => {
    event.preventDefault();
    const body = Object.fromEntries(new FormData(form).entries());
    const response = await fetch(`/api/empresa/${idEmpresa}`, {
        method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body)
    });
    const data = await response.json();
    mostrar(response.ok ? 'Configuración guardada correctamente.' : data.error, response.ok ? 'success' : 'danger');
});

cargarEmpresa().catch(error => { console.error(error); mostrar(error.message, 'danger'); });
