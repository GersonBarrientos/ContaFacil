let lineasAsiento = [];
let cuentasAgrupadas = {}; 
let librosGuardados = [];
const idEmpresa = Number(localStorage.getItem('idEmpresa') || 1);

function esc(str) {
    if (!str) return '';
    return String(str).replace(/[&<>'"]/g, match => ({
        '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;'
    })[match]);
}

// 1. Inicialización
document.addEventListener("DOMContentLoaded", async () => {
    try {
        // Cargar Nombre Empresa en Modal Libros
        const empresa = await (await fetch(`/api/empresa?idEmpresa=${idEmpresa}`)).json();
        document.getElementById('empresaActualTexto').textContent = `Empresa: ${empresa.nombre_comercial || empresa.nombre_legal}`;

        await cargarLibros();
        await cargarCatalogo();
        
        // Listener para cambio de libro
        const filtroLibro = document.getElementById('filtroLibro');
        filtroLibro.addEventListener('change', () => {
            const btnNuevo = document.getElementById('btnAbrirNuevoAsiento');
            if(filtroLibro.value) {
                btnNuevo.disabled = false;
                cargarHistorial(filtroLibro.value);
            } else {
                btnNuevo.disabled = true;
                document.getElementById('contenedorAsientos').innerHTML = '<div class="alert alert-info text-center mt-5">Seleccione un libro para ver su historial.</div>';
            }
        });

    } catch (error) {
        console.error("Error inicializando:", error);
    }
});

// --- GESTIÓN DE LIBROS ---
async function cargarLibros() {
    try {
        const librosResponse = await fetch(`/api/libros?idEmpresa=${idEmpresa}&incluirInactivos=true`);
        librosGuardados = await librosResponse.json();
        if (!librosResponse.ok || !Array.isArray(librosGuardados)) throw new Error('Error al cargar libros');

        // Llenar selector principal
        const selectFiltro = document.getElementById('filtroLibro');
        const valorActual = selectFiltro.value; // Mantener selección
        selectFiltro.innerHTML = '<option value="">-- Seleccione un Libro Diario --</option>';
        
        // Llenar tabla en Modal
        const tbodyLibros = document.getElementById('tablaLibrosBody');
        tbodyLibros.innerHTML = '';

        librosGuardados.forEach(libro => {
            // Solo mostrar activos en el selector principal
            if (libro.estado === 'ACTIVO') {
                selectFiltro.innerHTML += `<option value="${esc(libro.id_libro)}">${esc(libro.nombre_libro)}</option>`;
            }

            // Mostrar todos en la tabla de gestión
            tbodyLibros.innerHTML += `
                <tr>
                    <td><span class="badge bg-secondary">L${String(libro.id_libro).padStart(3, '0')}</span></td>
                    <td class="fw-bold">${esc(libro.nombre_libro)}</td>
                    <td class="text-muted small">${esc(libro.descripcion || '')}</td>
                    <td><span class="badge bg-${libro.estado === 'ACTIVO' ? 'success' : 'dark'}">${esc(libro.estado)}</span></td>
                    <td class="text-center"><span class="badge rounded-pill bg-primary">${libro.cantidad_asientos}</span></td>
                    <td class="text-end">
                        <button class="btn btn-sm btn-outline-primary shadow-sm" onclick="editarLibro(${libro.id_libro})"><i class="bi bi-pencil"></i></button>
                        <button class="btn btn-sm btn-outline-danger shadow-sm" onclick="eliminarLibro(${libro.id_libro})"><i class="bi bi-trash"></i></button>
                    </td>
                </tr>`;
        });

        if (valorActual && librosGuardados.find(l => l.id_libro == valorActual && l.estado === 'ACTIVO')) {
            selectFiltro.value = valorActual;
            cargarHistorial(valorActual);
        } else if(valorActual === "") {
            document.getElementById('contenedorAsientos').innerHTML = '<div class="alert alert-info text-center mt-5 shadow-sm border-0"><i class="bi bi-journal-text d-block fs-1 mb-2 text-muted"></i>Seleccione un libro para ver su historial.</div>';
        }

    } catch (error) {
        console.error(error);
        document.getElementById('mensajeLibros').innerHTML = `<div class="alert alert-danger py-2 small">Error al cargar libros.</div>`;
    }
}

document.getElementById('btnNuevoLibro').onclick = async () => {
    const nombreLibro = prompt('Nombre del libro:');
    if (!nombreLibro || !nombreLibro.trim()) return;
    const descripcion = prompt('Descripción (opcional):') || '';
    const response = await fetch('/api/libros', {
        method: 'POST', headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({ idEmpresa, nombreLibro, descripcion, estado: 'ACTIVO' })
    });
    if (!response.ok) {
        const err = await response.json();
        document.getElementById('mensajeLibros').innerHTML = `<div class="alert alert-danger py-2 small">${err.error}</div>`;
        return;
    }
    await cargarLibros();
};

window.editarLibro = async idLibro => {
    const libro = librosGuardados.find(item => String(item.id_libro) === String(idLibro));
    if (!libro) return;
    const nombreLibro = prompt('Nombre del libro:', libro.nombre_libro);
    if (!nombreLibro || !nombreLibro.trim()) return;
    const descripcion = prompt('Descripción:', libro.descripcion || '') || '';
    const estado = confirm('¿Desea que el libro quede activo?') ? 'ACTIVO' : 'INACTIVO';
    const response = await fetch(`/api/libros/${idLibro}`, {
        method: 'PATCH', headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({ idEmpresa, nombreLibro, descripcion, estado })
    });
    if (!response.ok) {
        const err = await response.json();
        document.getElementById('mensajeLibros').innerHTML = `<div class="alert alert-danger py-2 small">${err.error}</div>`;
        return;
    }
    await cargarLibros();
};

window.eliminarLibro = async idLibro => {
    if (!confirm('Solo se eliminará físicamente si no tiene asientos. ¿Continuar?')) return;
    const response = await fetch(`/api/libros/${idLibro}?idEmpresa=${idEmpresa}`, { method: 'DELETE' });
    if (!response.ok) {
        const error = await response.json();
        if (response.status === 409 && confirm(`${error.error}. ¿Desactivar el libro?`)) {
            const libro = librosGuardados.find(item => String(item.id_libro) === String(idLibro));
            if (!libro) return;
            await fetch(`/api/libros/${idLibro}`, {
                method: 'PATCH', headers: {'Content-Type': 'application/json'},
                body: JSON.stringify({ idEmpresa, nombreLibro: libro.nombre_libro, descripcion: libro.descripcion, estado: 'INACTIVO' })
            });
            return cargarLibros();
        }
        document.getElementById('mensajeLibros').innerHTML = `<div class="alert alert-danger py-2 small">${error.error}</div>`;
        return;
    }
    await cargarLibros();
};

// --- CARGA DE CATÁLOGO ---
async function cargarCatalogo() {
    const respuesta = await fetch('/api/cuentas'); 
    const cuentas = await respuesta.json();
    
    cuentas.forEach(cuenta => {
        if (!cuentasAgrupadas[cuenta.Categoria]) { cuentasAgrupadas[cuenta.Categoria] = []; }
        cuentasAgrupadas[cuenta.Categoria].push(cuenta);
    });

    const selectPrincipal = document.getElementById('selectPrincipal');
    selectPrincipal.innerHTML = '<option value="">-- Seleccione Cuenta Principal --</option>';
    
    for (const categoria of Object.keys(cuentasAgrupadas)) {
        const opt = document.createElement('option');
        opt.value = categoria;
        opt.textContent = categoria;
        selectPrincipal.appendChild(opt);
    }
}

// --- LÓGICA DE NUEVO ASIENTO ---
function alCambiarPrincipal() {
    const selectPrincipal = document.getElementById('selectPrincipal');
    const selectSubcuenta = document.getElementById('selectSubcuenta');
    const inputCodigo = document.getElementById('inputCodigo');
    const checkSubcuenta = document.getElementById('checkSubcuenta');
    
    const categoria = selectPrincipal.value;
    inputCodigo.value = "";
    checkSubcuenta.checked = false;

    if (categoria === "") {
        selectSubcuenta.innerHTML = '<option value="">-- Seleccione primero una cuenta principal --</option>';
        selectSubcuenta.disabled = true;
        return;
    }

    selectSubcuenta.disabled = false;
    selectSubcuenta.innerHTML = '<option value="">-- Ninguna (Registro de Mayor) --</option>';
    
    cuentasAgrupadas[categoria].forEach(sub => {
        const opt = document.createElement('option');
        opt.value = sub.CodigoSubcuenta;
        opt.dataset.nombre = sub.NombreSubcuenta;
        opt.textContent = `${sub.NombreSubcuenta} (${sub.CodigoSubcuenta})`;
        selectSubcuenta.appendChild(opt);
    });
}

function alCambiarSubcuenta() {
    const selectSubcuenta = document.getElementById('selectSubcuenta');
    const inputCodigo = document.getElementById('inputCodigo');
    const checkSubcuenta = document.getElementById('checkSubcuenta');

    if (selectSubcuenta.value === "") {
        inputCodigo.value = "";
        checkSubcuenta.checked = false;
    } else {
        inputCodigo.value = selectSubcuenta.value;
        checkSubcuenta.checked = true;
    }
}

function agregarLinea() {
    const fecha = document.getElementById('inputFecha').value;
    const selectPrincipal = document.getElementById('selectPrincipal');
    const selectSubcuenta = document.getElementById('selectSubcuenta');
    const tipoIva = document.getElementById('tipoIva').value;
    
    if (selectPrincipal.value === "") { alert("Por favor seleccione una Cuenta Principal."); return; }

    const debeRaw = parseFloat(document.getElementById('inputDebe').value) || 0;
    const haberRaw = parseFloat(document.getElementById('inputHaber').value) || 0;

    if (!fecha) { alert("La fecha es obligatoria."); return; }
    if (debeRaw < 0 || haberRaw < 0) { alert("No se permiten montos negativos."); return; }
    if (debeRaw === 0 && haberRaw === 0) { alert("Debe ingresar un monto en el Debe o en el Haber."); return; }
    if (debeRaw > 0 && haberRaw > 0) { alert("Una misma línea no puede tener valores en el Debe y el Haber."); return; }
    if (selectSubcuenta.value === "") { alert("Por favor seleccione una Subcuenta."); return; }

    const categoriaPrincipal = selectPrincipal.value;
    const opcionSub = selectSubcuenta.options[selectSubcuenta.selectedIndex];
    const nombreSubcuenta = opcionSub.dataset.nombre;
    const codigoSubcuenta = opcionSub.value;

    const isDebe = debeRaw > 0;
    const montoIngresado = isDebe ? debeRaw : haberRaw;

    let montoBase = montoIngresado;
    let montoIva = 0;

    if (tipoIva === 'mas_iva') {
        montoBase = montoIngresado;
        montoIva = montoBase * 0.13;
    } else if (tipoIva === 'incluido') {
        montoBase = montoIngresado / 1.13;
        montoIva = montoIngresado - montoBase;
    }

    montoBase = Number(montoBase.toFixed(2));
    montoIva = Number(montoIva.toFixed(2));

    const grupoIdBase = Date.now() + Math.random();

    lineasAsiento.push({
        grupoId: grupoIdBase, fecha: fecha, codigo: "", concepto: categoriaPrincipal,
        debe: isDebe ? montoBase : 0, haber: isDebe ? 0 : montoBase, esSubcuenta: false
    });
    lineasAsiento.push({
        grupoId: grupoIdBase, fecha: fecha, codigo: codigoSubcuenta, concepto: nombreSubcuenta,
        debe: isDebe ? montoBase : 0, haber: isDebe ? 0 : montoBase, esSubcuenta: true
    });

    if (montoIva > 0) {
        let nombreCuentaIva = isDebe ? 'IVA - CRÉDITO FISCAL' : 'IVA - DÉBITO FISCAL';
        const nombreCuentaNormalizado = categoriaPrincipal.toLowerCase();
        
        if (nombreCuentaNormalizado.includes('compra')) {
            nombreCuentaIva = 'IVA - CRÉDITO FISCAL';
        } else if (nombreCuentaNormalizado.includes('venta')) {
            nombreCuentaIva = 'IVA - DÉBITO FISCAL';
        }
        
        const subcuentasIva = cuentasAgrupadas[nombreCuentaIva];
        
        if (!subcuentasIva || subcuentasIva.length === 0) {
            alert(`No se detectó la cuenta '${nombreCuentaIva}' en tu catálogo. El IVA no se registró.`);
        } else {
            const subIva = subcuentasIva[0];
            const grupoIdIva = Date.now() + Math.random();

            lineasAsiento.push({
                grupoId: grupoIdIva, fecha: fecha, codigo: "", concepto: nombreCuentaIva,
                debe: isDebe ? montoIva : 0, haber: isDebe ? 0 : montoIva, esSubcuenta: false
            });
            lineasAsiento.push({
                grupoId: grupoIdIva, fecha: fecha, codigo: subIva.CodigoSubcuenta, concepto: subIva.NombreSubcuenta,
                debe: isDebe ? montoIva : 0, haber: isDebe ? 0 : montoIva, esSubcuenta: true
            });
        }
    }

    renderizarTablaAsiento();
    
    document.getElementById('selectPrincipal').selectedIndex = 0;
    document.getElementById('selectSubcuenta').innerHTML = '<option value="">-- Seleccione primero una cuenta principal --</option>';
    document.getElementById('selectSubcuenta').disabled = true;
    document.getElementById('inputCodigo').value = '';
    document.getElementById('inputDebe').value = '0.00';
    document.getElementById('inputHaber').value = '0.00';
    document.getElementById('tipoIva').value = 'ninguno';
    document.getElementById('checkSubcuenta').checked = false;
}

function renderizarTablaAsiento() {
    const tbody = document.getElementById('cuerpoTabla');
    tbody.innerHTML = ''; 
    let sumDebe = 0, sumHaber = 0;

    lineasAsiento.forEach((linea) => {
        const tr = document.createElement('tr');
        const tdFecha = `<td class="fecha-col">${formatearFecha(linea.fecha)}</td>`;
        const claseCuenta = linea.esSubcuenta ? 'subcuenta' : 'cuenta-principal';
        const textoCuenta = linea.esSubcuenta ? `↳ ${esc(linea.concepto)}` : esc(linea.concepto);

        let parcialHTML = '', debeHTML = '', haberHTML = '';
        
        if (linea.esSubcuenta) {
            const montoParcial = linea.debe > 0 ? linea.debe : linea.haber;
            parcialHTML = montoParcial > 0 ? montoParcial.toLocaleString('en-US', {minimumFractionDigits: 2}) : '';
        } else {
            debeHTML = linea.debe > 0 ? linea.debe.toLocaleString('en-US', {minimumFractionDigits: 2}) : '';
            haberHTML = linea.haber > 0 ? linea.haber.toLocaleString('en-US', {minimumFractionDigits: 2}) : '';
            sumDebe = Number((sumDebe + linea.debe).toFixed(2));
            sumHaber = Number((sumHaber + linea.haber).toFixed(2));
        }

        tr.innerHTML = `
            ${tdFecha}
            <td class="${claseCuenta}">${textoCuenta}</td>
            <td class="monto text-muted">${parcialHTML}</td>
            <td class="monto">${debeHTML}</td>
            <td class="monto">${haberHTML}</td>
            <td class="text-center">
                <button class="btn btn-sm text-danger" onclick="eliminarLinea(${linea.grupoId})"><i class="bi bi-trash"></i></button>
            </td>`;
        tbody.appendChild(tr);
    });

    document.getElementById('totalDebe').innerText = sumDebe.toLocaleString('en-US', {minimumFractionDigits: 2});
    document.getElementById('totalHaber').innerText = sumHaber.toLocaleString('en-US', {minimumFractionDigits: 2});
}

function eliminarLinea(grupoId) {
    lineasAsiento = lineasAsiento.filter(l => l.grupoId !== grupoId);
    renderizarTablaAsiento();
}

function formatearFecha(fechaISO) {
    if (!fechaISO) return '';
    const partes = fechaISO.split('-');
    if (partes.length < 3) return fechaISO;
    return `${partes[2]}/${partes[1]}`;
}

async function guardarAsientoBD() {
    if (lineasAsiento.length === 0) { alert("No hay líneas para guardar."); return; }

    const descripcion = document.getElementById('inputDescripcion').value || "Registro manual";
    const idLibro = Number(document.getElementById('filtroLibro').value);
    
    if (!idLibro) { alert("Seleccione un libro activo de la lista principal primero."); return; }
    
    const totalDebe = parseFloat(document.getElementById('totalDebe').innerText.replace(/,/g, ''));
    const totalHaber = parseFloat(document.getElementById('totalHaber').innerText.replace(/,/g, ''));
    if (Math.abs(totalDebe - totalHaber) >= 0.01) {
        alert("El asiento no cuadra. El total Debe debe ser igual al total Haber.");
        return;
    }
    
    const detallesParaBD = lineasAsiento
        .filter(l => l.codigo !== '') 
        .map(l => ({ codigo: l.codigo, debe: l.debe, haber: l.haber }));

    const payload = { idEmpresa, idLibro, fecha: lineasAsiento[0].fecha, descripcion: esc(descripcion), detalles: detallesParaBD };

    try {
        const response = await fetch('/api/asientos', {
            method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload)
        });

        if (response.ok) {
            lineasAsiento = [];
            renderizarTablaAsiento();
            document.getElementById('inputDescripcion').value = '';
            
            // Cerrar modal
            const modalEl = document.getElementById('modalNuevoAsiento');
            const modal = bootstrap.Modal.getInstance(modalEl);
            if(modal) modal.hide();
            
            // Recargar historial
            cargarHistorial(idLibro);
        } else {
            const err = await response.json();
            alert("Error del servidor: " + (err.error || "No se pudo guardar"));
        }
    } catch (error) {
        console.error("Error:", error);
        alert("Error de conexión");
    }
}

// --- HISTORIAL ---
async function cargarHistorial(idLibro) {
    const contenedor = document.getElementById('contenedorAsientos');
    contenedor.innerHTML = '<div class="text-center mt-5"><span class="spinner-border text-primary"></span><p>Cargando historial...</p></div>';

    try {
        const respuesta = await fetch(`/api/historial?idEmpresa=${idEmpresa}&idLibro=${idLibro}`);
        const datos = await respuesta.json();
        
        contenedor.innerHTML = '';

        if (datos.length === 0) {
            contenedor.innerHTML = `<div class="alert alert-light text-center mt-4 border border-secondary border-opacity-25 shadow-sm"><i class="bi bi-info-circle text-primary fs-3 d-block mb-2"></i>No hay asientos registrados en este libro.</div>`;
            return;
        }

        const asientosAgrupados = {};
        datos.forEach(row => {
            if (!asientosAgrupados[row.IdAsiento]) {
                asientosAgrupados[row.IdAsiento] = { id: row.IdAsiento, fecha: row.Fecha, descripcion: row.Descripcion, detalles: [] };
            }
            asientosAgrupados[row.IdAsiento].detalles.push(row);
        });

        for (const asientoId of Object.keys(asientosAgrupados).reverse()) {
            const asiento = asientosAgrupados[asientoId];
            const fechaFormateada = asiento.fecha ? asiento.fecha.split('T')[0].split('-').reverse().join('/') : '';
            let sumDebe = 0, sumHaber = 0, filasHTML = '';

            asiento.detalles.forEach(det => {
                const debeVal = Number(det.Debe) || 0;
                const haberVal = Number(det.Haber) || 0;
                sumDebe += debeVal; sumHaber += haberVal;
                filasHTML += `
                    <tr>
                        <td class="text-muted small"><span class="badge bg-light text-dark border me-2">${det.CodigoSubcuenta}</span>${det.CuentaPrincipal}</td>
                        <td class="monto font-monospace">${debeVal > 0 ? debeVal.toLocaleString('en-US', {minimumFractionDigits: 2}) : ''}</td>
                        <td class="monto font-monospace">${haberVal > 0 ? haberVal.toLocaleString('en-US', {minimumFractionDigits: 2}) : ''}</td>
                    </tr>`;
            });

            contenedor.innerHTML += `
                <div class="card shadow-sm mb-4" style="border-radius: 12px; border: 1px solid var(--color-border); overflow: hidden;">
                    <div class="card-header d-flex justify-content-between align-items-center py-3" style="background-color: var(--color-primary); color: white; border-bottom: none;">
                        <span class="fw-bold fs-6"><i class="bi bi-hash" style="color: var(--color-secondary);"></i> Partida ${asiento.id}</span>
                        <span class="badge shadow-sm" style="background-color: var(--color-secondary);"><i class="bi bi-calendar-event me-1"></i>${fechaFormateada}</span>
                    </div>
                    <div class="card-body bg-white border-0 pt-3">
                        <p class="text-muted small mb-3 border-bottom pb-2"><i class="bi bi-card-text me-2" style="color: var(--color-primary);"></i><strong>Concepto:</strong> ${asiento.descripcion}</p>
                        <div class="table-responsive">
                            <table class="table table-hover align-middle mb-0 table-sm" style="border: 1px solid var(--color-border);">
                                <thead style="background-color: var(--color-bg-app); color: var(--color-text-muted); border-bottom: 2px solid var(--color-border);">
                                    <tr>
                                        <th class="small text-uppercase py-2 px-3">Cuenta / Subcuenta</th>
                                        <th width="20%" class="text-end small text-uppercase py-2" style="color: var(--color-success);">Debe ($)</th>
                                        <th width="20%" class="text-end small text-uppercase py-2 pe-3" style="color: var(--color-danger);">Haber ($)</th>
                                    </tr>
                                </thead>
                                <tbody style="border-top: none;">${filasHTML}</tbody>
                                <tfoot style="background-color: var(--color-bg-app); border-top: 2px solid var(--color-border);">
                                    <tr>
                                        <td class="text-end text-muted small py-2 fw-bold">TOTALES</td>
                                        <td class="monto font-monospace py-2" style="color: var(--color-success); font-weight: bold;">${sumDebe.toLocaleString('en-US', {minimumFractionDigits: 2})}</td>
                                        <td class="monto font-monospace py-2 pe-3" style="color: var(--color-danger); font-weight: bold;">${sumHaber.toLocaleString('en-US', {minimumFractionDigits: 2})}</td>
                                    </tr>
                                </tfoot>
                            </table>
                        </div>
                    </div>
                </div>`;
        }
    } catch (error) {
        console.error("Error al cargar el historial:", error);
        contenedor.innerHTML = '<div class="alert alert-danger text-center">Error al cargar el historial.</div>';
    }
}

window.exportarExcel = function() {
    const contenedor = document.getElementById('contenedorAsientos');
    if (!contenedor) return;
    
    // Create a temporary table containing all ledger entries
    const table = document.createElement('table');
    table.innerHTML = `
        <thead>
            <tr>
                <th>Fecha</th>
                <th>Código</th>
                <th>Cuenta</th>
                <th>Concepto</th>
                <th>Debe</th>
                <th>Haber</th>
            </tr>
        </thead>
        <tbody>
        </tbody>
    `;
    
    const tbody = table.querySelector('tbody');
    const asientosRows = contenedor.querySelectorAll('tbody tr');
    
    asientosRows.forEach(row => {
        const isHead = row.classList.contains('table-light'); // it's an header row
        const tds = row.querySelectorAll('td');
        if (tds.length >= 4 && !isHead) {
            let tr = document.createElement('tr');
            tr.innerHTML = `
                <td>${row.dataset.fecha || ''}</td>
                <td>${row.dataset.codigo || ''}</td>
                <td>${tds[0].textContent.trim()}</td>
                <td>${tds[1].textContent.trim()}</td>
                <td>${tds[2].textContent.trim()}</td>
                <td>${tds[3].textContent.trim()}</td>
            `;
            tbody.appendChild(tr);
        } else if (isHead && tds.length > 1) {
            let tr = document.createElement('tr');
            tr.innerHTML = `
                <td>${tds[0].textContent.trim()}</td>
                <td></td>
                <td></td>
                <td>${tds[1].textContent.trim()}</td>
                <td></td>
                <td></td>
            `;
            tbody.appendChild(tr);
        }
    });

    let libro = XLSX.utils.table_to_book(table, {sheet: "Libro Diario"});
    XLSX.writeFile(libro, `Libro_Diario_${document.getElementById('filtroLibro').value || 'Completo'}.xlsx`);
}