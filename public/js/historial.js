document.addEventListener("DOMContentLoaded", async () => {
    try {
        const respuesta = await fetch('/api/historial');
        const datos = await respuesta.json();
        
        const contenedor = document.getElementById('contenedorAsientos');
        contenedor.innerHTML = '';

        if (datos.length === 0) {
            contenedor.innerHTML = `<div class="alert.alert-info text-center">No hay asientos registrados todavía.</div>`;
            return;
        }

        // 1. Agrupar los registros planos por su IdAsiento
        const asientosAgrupados = {};
        datos.forEach(row => {
            if (!asientosAgrupados[row.IdAsiento]) {
                asientosAgrupados[row.IdAsiento] = {
                    id: row.IdAsiento,
                    fecha: row.Fecha,
                    descripcion: row.Descripcion,
                    detalles: []
                };
            }
            asientosAgrupados[row.IdAsiento].detalles.push(row);
        });

        // 2. Dibujar una tarjeta/tabla independiente por cada Asiento
        for (const asientoId of Object.keys(asientosAgrupados).reverse()) {
            const asiento = asientosAgrupados[asientoId];
            const fechaFormateada = asiento.fecha ? asiento.fecha.split('T')[0].split('-').reverse().join('/') : '';

            let sumDebe = 0;
            let sumHaber = 0;

            let filasHTML = '';
            asiento.detalles.forEach(det => {
                const debeVal = Number(det.Debe) || 0;
                const haberVal = Number(det.Haber) || 0;
                sumDebe += debeVal;
                sumHaber += haberVal;

                filasHTML += `
                    <tr>
                        <td><small class="text-muted">[${det.CodigoSubcuenta}]</small> ${det.NombreSubcuenta}</td>
                        <td class="monto">${debeVal > 0 ? debeVal.toLocaleString('en-US', {minimumFractionDigits: 2}) : ''}</td>
                        <td class="monto">${haberVal > 0 ? haberVal.toLocaleString('en-US', {minimumFractionDigits: 2}) : ''}</td>
                    </tr>
                `;
            });

            const cardHTML = `
                <div class="card shadow-sm mb-4 border-0">
                    <div class="card-header bg-dark text-white d-flex justify-content-between align-items-center py-2">
                        <span class="fw-bold">Partida / Asiento # ${asiento.id}</span>
                        <span><i class="bi bi-calendar-event"></i> ${fechaFormateada}</span>
                    </div>
                    <div class="card-body bg-white">
                        <p class="text-muted mb-3"><strong>Concepto General:</strong> ${asiento.descripcion}</p>
                        <div class="table-responsive">
                            <table class="table table-bordered table-hover align-middle mb-0">
                                <thead class="table-light">
                                    <tr>
                                        <th>Cuenta / Subcuenta</th>
                                        <th width="20%" class="text-end">Debe ($)</th>
                                        <th width="20%" class="text-end">Haber ($)</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    ${filasHTML}
                                </tbody>
                                <tfoot class="table-light fw-bold">
                                    <tr>
                                        <td class="text-end">TOTALES:</td>
                                        <td class="monto text-primary">${sumDebe.toLocaleString('en-US', {minimumFractionDigits: 2})}</td>
                                        <td class="monto text-primary">${sumHaber.toLocaleString('en-US', {minimumFractionDigits: 2})}</td>
                                    </tr>
                                </tfoot>
                            </table>
                        </div>
                    </div>
                </div>
            `;
            contenedor.innerHTML += cardHTML;
        }

    } catch (error) {
        console.error("Error al cargar el historial:", error);
        alert("No se pudo conectar con el servidor para cargar el historial.");
    }
});