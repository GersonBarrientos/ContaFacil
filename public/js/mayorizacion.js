const idEmpresa = Number(localStorage.getItem('idEmpresa') || 1);
const libro = document.getElementById('libro');
const mensaje = document.getElementById('mensaje');
const resultados = document.getElementById('resultados');
const money = value => Number(value || 0).toLocaleString('en-US', { minimumFractionDigits: 2 });

function mostrarMensaje(texto, tipo = 'danger') {
    mensaje.innerHTML = `<div class="alert alert-${tipo}">${texto}</div>`;
}

async function cargarLibros() {
    const response = await fetch(`/api/libros?idEmpresa=${idEmpresa}`);
    const data = await response.json();
    if (!response.ok || !Array.isArray(data)) throw new Error(data.error || 'No se pudieron cargar los libros.');
    data.forEach(item => { libro.innerHTML += `<option value="${item.id_libro}">${item.nombre_libro}</option>`; });
}

document.getElementById('filtroMayorizacion').addEventListener('submit', async event => {
    event.preventDefault();
    const fechaInicio = document.getElementById('fechaInicio').value;
    const fechaFin = document.getElementById('fechaFin').value;
    const params = new URLSearchParams({ idEmpresa, fechaInicio, fechaFin });
    if (libro.value) params.set('idLibro', libro.value);
    try {
        const response = await fetch(`/api/mayorizacion?${params}`);
        const data = await response.json();
        if (!response.ok || !Array.isArray(data)) throw new Error(data.error || 'No se pudo consultar la mayorización.');
        resultados.innerHTML = data.length ? data.map(row => `
            <tr><td>${row.codigo_cuenta || ''}</td><td>${row.cuenta || ''}</td>
            <td class="text-end">${money(row.total_debe)}</td>
            <td class="text-end">${money(row.total_haber)}</td>
            <td class="text-end">${money(row.saldo)}</td></tr>`).join('') :
            '<tr><td colspan="5" class="text-center text-muted py-4">No hay movimientos en el período seleccionado.</td></tr>';
        mostrarMensaje('Mayorización actualizada.', 'success');
    } catch (error) {
        console.error(error);
        mostrarMensaje(error.message);
    }
});

(async () => {
    const hoy = new Date();
    const inicio = new Date(hoy.getFullYear(), 0, 1);
    document.getElementById('fechaInicio').value = inicio.toISOString().slice(0, 10);
    document.getElementById('fechaFin').value = hoy.toISOString().slice(0, 10);
    try { await cargarLibros(); } catch (error) { mostrarMensaje(error.message); }
})();
