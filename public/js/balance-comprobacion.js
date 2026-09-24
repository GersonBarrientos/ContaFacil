const idEmpresa = Number(localStorage.getItem('idEmpresa') || 1);
const form = document.getElementById('filtroForm');
const btnGenerar = document.getElementById('btnGenerar');
const mensajeArea = document.getElementById('mensajeArea');
const reporteArea = document.getElementById('reporteArea');
const checkRango = document.getElementById('checkRango');
const inputFechaInicio = document.getElementById('inputFechaInicio');
const inputFechaFin = document.getElementById('inputFechaFin');

const money = value => {
    if (!value || Number(value) === 0) return '';
    return new Intl.NumberFormat('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(value);
};

const esc = str => {
    if (!str) return '';
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
};

// Toggle Fecha Inicio
checkRango.addEventListener('change', (e) => {
    inputFechaInicio.disabled = !e.target.checked;
    if (!e.target.checked) inputFechaInicio.value = '';
});

// Cambiar Formato (ocultar col-sumas)
const aplicarFormato = () => {
    const isSumas = document.getElementById('formatoSumas').checked;
    document.querySelectorAll('.col-sumas').forEach(el => {
        el.style.display = isSumas ? '' : 'none';
    });
};
document.querySelectorAll('input[name="formato"]').forEach(radio => {
    radio.addEventListener('change', aplicarFormato);
});

async function inicializar() {
    inputFechaFin.value = new Date().toLocaleDateString('en-CA');
    try {
        const resEmpresa = await fetch(`/api/empresa?idEmpresa=${idEmpresa}`);
        if(resEmpresa.ok) {
            const empresa = await resEmpresa.json();
            document.getElementById('printEmpresa').textContent = empresa.nombre_legal || empresa.nombre_comercial || 'Empresa';
        }

        const resLibros = await fetch(`/api/libros?idEmpresa=${idEmpresa}`);
        if(resLibros.ok) {
            const libros = await resLibros.json();
            const selectLibro = document.getElementById('selectLibro');
            selectLibro.innerHTML = '<option value="">-- Seleccione un libro --</option>';
            libros.forEach(l => {
                selectLibro.innerHTML += `<option value="${l.id_libro}">${esc(l.nombre_libro)}</option>`;
            });
        }
    } catch (e) {
        mensajeArea.innerHTML = `<div class="alert alert-danger">Error al cargar datos iniciales.</div>`;
    }
}

form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const idLibro = document.getElementById('selectLibro').value;
    const fechaFin = inputFechaFin.value;
    const fechaInicio = checkRango.checked ? inputFechaInicio.value : '';

    if (checkRango.checked && fechaInicio > fechaFin) {
        mensajeArea.innerHTML = `<div class="alert alert-danger">La fecha de inicio no puede ser posterior a la de corte.</div>`;
        return;
    }

    btnGenerar.disabled = true;
    btnGenerar.innerHTML = '<span class="spinner-border spinner-border-sm"></span> Generando...';
    mensajeArea.innerHTML = '';
    reporteArea.style.display = 'none';

    try {
        let url = `/api/balance-comprobacion?idEmpresa=${idEmpresa}&idLibro=${idLibro}&fechaFin=${fechaFin}`;
        if (fechaInicio) url += `&fechaInicio=${fechaInicio}`;

        const response = await fetch(url);
        if (!response.ok) {
            const err = await response.json();
            throw new Error(err.error || 'Error al generar balance');
        }

        const data = await response.json();
        const filas = data.filter(r => !r.es_total);
        const total = data.find(r => r.es_total);

        // Actualizar encabezados de impresión
        const libroSelect = document.getElementById('selectLibro');
        document.getElementById('printLibro').textContent = `Libro: ${libroSelect.options[libroSelect.selectedIndex].text}`;
        
        let textoFecha = `Al ${fechaFin}`;
        if (fechaInicio) textoFecha = `Del ${fechaInicio} al ${fechaFin}`;
        document.getElementById('printFecha').textContent = textoFecha;

        if (filas.length === 0) {
            mensajeArea.innerHTML = `<div class="alert alert-info">Sin movimientos al corte.</div>`;
            return;
        }

        const formatoSaldos = document.getElementById('formatoSaldos').checked;

        // Pintar filas
        document.getElementById('tablaCuerpo').innerHTML = filas.map(f => {
            // Ocultar si está en modo saldos y no tiene saldos
            if (formatoSaldos && Number(f.saldo_deudor) === 0 && Number(f.saldo_acreedor) === 0) return '';
            
            return `<tr>
                <td>${esc(f.codigo_cuenta)}</td>
                <td>${esc(f.nombre_cuenta)}</td>
                <td class="text-end tabular-nums col-sumas">${money(f.sumas_debe)}</td>
                <td class="text-end tabular-nums col-sumas">${money(f.sumas_haber)}</td>
                <td class="text-end tabular-nums">${money(f.saldo_deudor)}</td>
                <td class="text-end tabular-nums">${money(f.saldo_acreedor)}</td>
            </tr>`;
        }).join('');

        // Pintar total
        document.getElementById('tablaPie').innerHTML = `
            <tr class="fw-bold bg-light">
                <td colspan="2" class="text-end">TOTALES</td>
                <td class="text-end tabular-nums col-sumas">${money(total.sumas_debe)}</td>
                <td class="text-end tabular-nums col-sumas">${money(total.sumas_haber)}</td>
                <td class="text-end tabular-nums">${money(total.saldo_deudor)}</td>
                <td class="text-end tabular-nums">${money(total.saldo_acreedor)}</td>
            </tr>
        `;

        // Alerta de cuadre
        const alerta = document.getElementById('alertaCuadre');
        alerta.style.display = 'block';
        if (total.cuadra) {
            alerta.className = 'alert mt-3 no-print alert-success';
            alerta.innerHTML = `<i class="bi bi-check-circle-fill me-2"></i> El balance cuadra correctamente.`;
        } else {
            const diff = Math.abs(Math.round(Number(total.saldo_deudor)*100) - Math.round(Number(total.saldo_acreedor)*100)) / 100;
            alerta.className = 'alert mt-3 no-print alert-danger';
            alerta.innerHTML = `<i class="bi bi-exclamation-triangle-fill me-2"></i> <strong>No cuadra:</strong> Diferencia de $${money(diff)}`;
        }

        reporteArea.style.display = 'block';
        aplicarFormato();
    } catch (e) {
        mensajeArea.innerHTML = `<div class="alert alert-danger">${esc(e.message)}</div>`;
    } finally {
        btnGenerar.disabled = false;
        btnGenerar.innerHTML = '<i class="bi bi-gear me-2"></i> Generar';
    }
});

inicializar();
