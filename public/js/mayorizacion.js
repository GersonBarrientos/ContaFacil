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

function formatearFecha(fechaISO) {
    if (!fechaISO) return '';
    const partes = fechaISO.split('T')[0].split('-');
    if (partes.length < 3) return fechaISO;
    return `${partes[2]}/${partes[1]}/${partes[0]}`;
}

document.getElementById('filtroMayorizacion').addEventListener('submit', async event => {
    event.preventDefault();
    const fechaInicio = document.getElementById('fechaInicio').value;
    const fechaFin = document.getElementById('fechaFin').value;
    const params = new URLSearchParams({ idEmpresa, fechaInicio, fechaFin });
    if (libro.value) params.set('idLibro', libro.value);
    
    const container = document.getElementById('resultadosContainer');
    
    try {
        const response = await fetch(`/api/mayorizacion?${params}`);
        const data = await response.json();
        
        if (!response.ok || !Array.isArray(data)) throw new Error(data.error || 'No se pudo consultar la mayorización.');
        
        if (data.length === 0) {
            container.innerHTML = '<div class="text-center text-muted py-4 bg-white shadow-sm border rounded">No hay movimientos en el período seleccionado.</div>';
            mostrarMensaje('Mayorización actualizada.', 'success');
            return;
        }

        const cuentasGroup = {};
        data.forEach(row => {
            const key = row.codigo_cuenta;
            if (!cuentasGroup[key]) {
                cuentasGroup[key] = {
                    codigo: row.codigo_cuenta,
                    nombre: row.cuenta,
                    detalles: [],
                    totalDebe: 0,
                    totalHaber: 0
                };
            }
            cuentasGroup[key].detalles.push(row);
            cuentasGroup[key].totalDebe += Number(row.debe);
            cuentasGroup[key].totalHaber += Number(row.haber);
        });

        let html = '';
        for (const key in cuentasGroup) {
            const cuenta = cuentasGroup[key];
            
            let tipoSaldo = 'Nulo';
            let valorSaldo = 0;
            
            if (cuenta.totalDebe > cuenta.totalHaber) {
                tipoSaldo = 'Deudor';
                valorSaldo = cuenta.totalDebe - cuenta.totalHaber;
            } else if (cuenta.totalHaber > cuenta.totalDebe) {
                tipoSaldo = 'Acreedor';
                valorSaldo = cuenta.totalHaber - cuenta.totalDebe;
            }

            let saldoAcumulado = 0;
            const filasHTML = cuenta.detalles.map(d => {
                saldoAcumulado += (Number(d.debe) - Number(d.haber));
                let saldoLinea = '';
                if (saldoAcumulado > 0) {
                    saldoLinea = `(D) ${money(saldoAcumulado)}`;
                } else if (saldoAcumulado < 0) {
                    saldoLinea = `(A) ${money(Math.abs(saldoAcumulado))}`;
                } else {
                    saldoLinea = money(0);
                }
                
                return `
                <tr>
                    <td class="text-nowrap">${formatearFecha(d.fecha)}</td>
                    <td>N° ${d.id_asiento || '-'}</td>
                    <td><span class="text-secondary fw-medium">[${d.subcuenta || 'N/A'}]</span> ${d.descripcion || ''}</td>
                    <td class="text-end">${d.debe > 0 ? money(d.debe) : ''}</td>
                    <td class="text-end">${d.haber > 0 ? money(d.haber) : ''}</td>
                    <td class="text-end fw-bold text-muted">${saldoLinea}</td>
                </tr>`;
            }).join('');

            html += `
            <div class="card mb-4 shadow-sm" style="border-radius: 12px; border: 1px solid var(--color-border); overflow: hidden;">
                <div class="card-header d-flex justify-content-between align-items-center py-3" style="background-color: var(--color-primary); color: white; border-bottom: none;">
                    <h5 class="mb-0 fs-6 fw-bold"><i class="bi bi-wallet2 me-2" style="color: var(--color-secondary);"></i> ${cuenta.codigo || ''} - ${cuenta.nombre || ''}</h5>
                    <span class="badge fs-6 shadow-sm" style="background-color: var(--color-secondary);">${tipoSaldo}: ${money(valorSaldo)}</span>
                </div>
                <div class="table-responsive">
                    <table class="table table-hover mb-0 align-middle">
                        <thead style="background-color: var(--color-bg-app); color: var(--color-text-muted); border-bottom: 2px solid var(--color-border);">
                            <tr class="small fw-bold">
                                <th class="py-3 px-3">Fecha</th>
                                <th class="py-3">Asiento</th>
                                <th class="py-3">Descripción / Concepto</th>
                                <th class="text-end py-3" style="color: var(--color-success);">Debe</th>
                                <th class="text-end py-3" style="color: var(--color-danger);">Haber</th>
                                <th class="text-end py-3 px-3">Saldo Acumulado</th>
                            </tr>
                        </thead>
                        <tbody style="border-top: none;">
                            ${filasHTML}
                        </tbody>
                        <tfoot style="background-color: var(--color-bg-app); border-top: 2px solid var(--color-border);">
                            <tr>
                                <th colspan="3" class="text-end py-3 fw-bold" style="color: var(--color-text-main);">Totales del Período</th>
                                <th class="text-end py-3 fw-bold" style="color: var(--color-success);">${money(cuenta.totalDebe)}</th>
                                <th class="text-end py-3 fw-bold" style="color: var(--color-danger);">${money(cuenta.totalHaber)}</th>
                                <th class="text-end py-3"></th>
                            </tr>
                        </tfoot>
                    </table>
                </div>
            </div>`;
        }
        
        container.innerHTML = html;
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
    try { 
        await cargarLibros();
        const empresa = await (await fetch(`/api/empresa?idEmpresa=${idEmpresa}`)).json();
        const pEmpresa = document.getElementById('printEmpresa');
        if (pEmpresa) pEmpresa.textContent = empresa.nombre_comercial || empresa.nombre_legal || 'Mi Empresa';
    } catch (error) { mostrarMensaje(error.message); }
})();

document.getElementById('filtroMayorizacion').addEventListener('submit', (e) => {
    // update printFecha
    const inicio = document.getElementById('fechaInicio').value;
    const fin = document.getElementById('fechaFin').value;
    const pFecha = document.getElementById('printFecha');
    if (pFecha) pFecha.textContent = `Del ${inicio} al ${fin}`;
    
    // update printLibro
    const selectL = document.getElementById('libro');
    const pLibro = document.getElementById('printLibro');
    if (pLibro && selectL.selectedIndex > -1) {
        pLibro.textContent = `Mayorización - ${selectL.options[selectL.selectedIndex].text}`;
    }
});

window.exportarExcel = function() {
    const contenedor = document.getElementById('resultadosContainer');
    if (!contenedor || contenedor.querySelectorAll('table').length === 0) {
        alert("No hay datos para exportar. Por favor consulte un período primero.");
        return;
    }
    
    const tables = contenedor.querySelectorAll('table');
    let wb = XLSX.utils.book_new();
    
    tables.forEach((table, index) => {
        // the card header has the account name, we can try to extract it
        let sheetName = "Cuenta " + (index+1);
        try {
            const h5 = table.closest('.card').querySelector('h5');
            if (h5) {
                sheetName = h5.textContent.trim().substring(0, 31); // excel sheet names max 31 chars
            }
        } catch (e) {}
        let ws = XLSX.utils.table_to_sheet(table);
        XLSX.utils.book_append_sheet(wb, ws, sheetName.replace(/[\[\]\*:\?\/]/g, ''));
    });
    
    XLSX.writeFile(wb, `Mayorizacion.xlsx`);
}
