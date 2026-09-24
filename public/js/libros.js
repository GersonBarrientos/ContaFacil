const idEmpresa = Number(localStorage.getItem('idEmpresa') || 1);
let libros = [];

const mostrarMensaje = (texto, tipo = 'info') => {
    document.getElementById('mensaje').innerHTML = `<div class="alert alert-${tipo}">${esc(texto)}</div>`;
};

function esc(str) {
    if (!str) return '';
    return String(str).replace(/[&<>'"]/g, match => ({
        '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;'
    })[match]);
}

async function cargar() {
    const empresa = await (await fetch(`/api/empresa?idEmpresa=${idEmpresa}`)).json();
    document.getElementById('empresaActual').textContent = `Empresa: ${empresa.nombre_comercial || empresa.nombre_legal}`;
    libros = await (await fetch(`/api/libros?idEmpresa=${idEmpresa}&incluirInactivos=true`)).json();
    document.getElementById('libros').innerHTML = libros.map(libro => `
        <tr>
            <td>L${String(libro.id_libro).padStart(3, '0')}</td><td>${esc(libro.nombre_libro)}</td>
            <td>${esc(libro.descripcion || '')}</td><td><span class="badge text-bg-${libro.estado === 'ACTIVO' ? 'success' : 'secondary'}">${esc(libro.estado)}</span></td>
            <td>${libro.cantidad_asientos}</td>
            <td><button class="btn btn-sm btn-outline-primary" onclick="editar(${libro.id_libro})">Editar</button>
                <button class="btn btn-sm btn-outline-danger" onclick="eliminar(${libro.id_libro})">Eliminar</button></td>
        </tr>`).join('');
}

document.getElementById('nuevoLibro').onclick = async () => {
    const nombreLibro = prompt('Nombre del libro:');
    if (!nombreLibro || !nombreLibro.trim()) return;
    const descripcion = prompt('Descripción (opcional):') || '';
    const response = await fetch('/api/libros', {
        method: 'POST', headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({ idEmpresa, nombreLibro, descripcion, estado: 'ACTIVO' })
    });
    if (!response.ok) return mostrarMensaje((await response.json()).error, 'danger');
    await cargar();
};

window.editar = async idLibro => {
    const libro = libros.find(item => String(item.id_libro) === String(idLibro));
    if (!libro) return mostrarMensaje('Libro no encontrado', 'danger');
    const nombreLibro = prompt('Nombre del libro:', libro.nombre_libro);
    if (!nombreLibro || !nombreLibro.trim()) return;
    const descripcion = prompt('Descripción:', libro.descripcion || '') || '';
    const estado = confirm('¿Desea que el libro quede activo?') ? 'ACTIVO' : 'INACTIVO';
    const response = await fetch(`/api/libros/${idLibro}`, {
        method: 'PATCH', headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({ idEmpresa, nombreLibro, descripcion, estado })
    });
    if (!response.ok) return mostrarMensaje((await response.json()).error, 'danger');
    await cargar();
};

window.eliminar = async idLibro => {
    if (!confirm('Solo se eliminará físicamente si no tiene asientos. ¿Continuar?')) return;
    const response = await fetch(`/api/libros/${idLibro}?idEmpresa=${idEmpresa}`, { method: 'DELETE' });
    if (!response.ok) {
        const error = await response.json();
        if (response.status === 409 && confirm(`${error.error}. ¿Desactivar el libro?`)) {
            const libro = libros.find(item => String(item.id_libro) === String(idLibro));
            if (!libro) return;
            await fetch(`/api/libros/${idLibro}`, {
                method: 'PATCH', headers: {'Content-Type': 'application/json'},
                body: JSON.stringify({ idEmpresa, nombreLibro: libro.nombre_libro, descripcion: libro.descripcion, estado: 'INACTIVO' })
            });
            return cargar();
        }
        return mostrarMensaje(error.error, 'danger');
    }
    await cargar();
};

cargar().catch(error => { console.error(error); mostrarMensaje('No se pudieron cargar los libros.', 'danger'); });
