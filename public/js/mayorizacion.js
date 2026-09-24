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
            <div class="card mb-4 shadow-sm border-0">
                <div class="card-header bg-dark text-white d-flex justify-content-between align-items-center py-3">
                    <h5 class="mb-0 fs-6"><i class="bi bi-wallet2 me-2"></i> ${cuenta.codigo || ''} - ${cuenta.nombre || ''}</h5>
                    <span class="badge bg-primary fs-6">Saldo ${tipoSaldo}: ${money(valorSaldo)}</span>
                </div>
                <div class="table-responsive">
                    <table class="table table-hover mb-0">
                        <thead class="table-light">
                            <tr>
                                <th>Fecha</th>
                                <th>Asiento</th>
                                <th>Descripción / Concepto</th>
                                <th class="text-end">Debe</th>
                                <th class="text-end">Haber</th>
                                <th class="text-end">Saldo Acumulado</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${filasHTML}
                        </tbody>
                        <tfoot class="table-group-divider bg-light">
                            <tr>
                                <th colspan="3" class="text-end">Totales del Período</th>
                                <th class="text-end text-primary">${money(cuenta.totalDebe)}</th>
                                <th class="text-end text-primary">${money(cuenta.totalHaber)}</th>
                                <th class="text-end"></th>
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
    try { await cargarLibros(); } catch (error) { mostrarMensaje(error.message); }
})();
