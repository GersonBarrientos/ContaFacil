let datosBalance = [];
let inventarioKardex = 0;
let utilidadEjercicio = 0;

document.addEventListener('DOMContentLoaded', () => {
    cargarLibros();
    document.getElementById('form-filtros').addEventListener('submit', generarBalance);
});

async function cargarLibros() {
    try {
        const response = await fetch('/api/libros?idEmpresa=1');
        const libros = await response.json();
        const select = document.getElementById('select-libro');
        
        libros.forEach(libro => {
            if (libro.estado === 'ACTIVO') {
                const option = document.createElement('option');
                option.value = libro.id_libro;
                option.textContent = `${libro.id_libro} - ${libro.nombre_libro}`;
                select.appendChild(option);
            }
        });
    } catch (error) {
        console.error('Error al cargar libros:', error);
    }
}

async function generarBalance(event) {
    event.preventDefault();
    
    const idLibro = document.getElementById('select-libro').value;
    const fechaInicio = document.getElementById('fecha-inicio').value;
    const fechaFin = document.getElementById('fecha-fin').value;

    const btnGenerar = document.getElementById('btn-generar');
    const emptyState = document.getElementById('emptyState');
    const reporteArea = document.getElementById('reporteArea');

    if (btnGenerar) {
        btnGenerar.disabled = true;
        btnGenerar.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span> Generando...';
    }
    if (emptyState) emptyState.style.display = 'none';
    if (reporteArea) reporteArea.style.display = 'none';

    try {
        // 1. Obtener saldos de cuentas de Balance (1, 2, 3)
        const resBalance = await fetch(`/api/balance-cuentas?idLibro=${idLibro}&fechaInicio=${fechaInicio}&fechaFin=${fechaFin}`);
        datosBalance = await resBalance.json();

        // 2. Obtener Inventario y data del Kardex
        const resKardex = await fetch('/api/kardex/GLOBAL');
        const dataKardex = await resKardex.json();
        inventarioKardex = calcularInventarioKardex(dataKardex, fechaFin);

        // 3. Obtener Estado de Resultados para calcular la Utilidad
        const resResultados = await fetch(`/api/estado-resultados?idLibro=${idLibro}&fechaInicio=${fechaInicio}&fechaFin=${fechaFin}`);
        const datosResultados = await resResultados.json();
        
        // 4. Calcular Utilidad Neta con el Inventario Inicial real
        utilidadEjercicio = calcularUtilidadNeta(datosResultados, dataKardex, fechaInicio, fechaFin);

        renderizarBalance();
        if (reporteArea) reporteArea.style.display = 'block';

    } catch (error) {
        console.error("Error al generar el balance:", error);
        if (emptyState) emptyState.style.display = 'block';
        alert("Error al generar el reporte. Verifica la consola.");
    } finally {
        const btnGenerar = document.getElementById('btn-generar');
        if (btnGenerar) {
            btnGenerar.disabled = false;
            btnGenerar.innerHTML = '<i class="bi bi-search me-1"></i> Generar';
        }
    }
}

// Extrae el saldo de una cuenta del Balance
function obtenerSaldoBalance(palabraClave, tipo) {
    const cuenta = datosBalance.find(c => c.NombreCuenta.toLowerCase().includes(palabraClave.toLowerCase()));
    if (!cuenta) return 0;
    
    if (tipo === 'activo') {
        return parseFloat(cuenta.TotalDebe) - parseFloat(cuenta.TotalHaber);
    } else {
        return parseFloat(cuenta.TotalHaber) - parseFloat(cuenta.TotalDebe);
    }
}

// Calcula el Inventario Final (Kardex)
function calcularInventarioKardex(movimientos, fechaFin) {
    let sumaEntradas = 0, sumaSalidas = 0;
    const fechaCorte = new Date(fechaFin + "T23:59:59").getTime();
    
    if (Array.isArray(movimientos)) {
        movimientos.forEach(mov => {
            const fechaMov = new Date(mov.fecha).getTime();
            if (fechaMov <= fechaCorte) {
                const costo = Number(mov.costo_total || 0);
                const tipo = mov.tipo_movimiento;
                
                if (['INVENTARIO_INICIAL', 'COMPRA', 'DEV_VENTA', 'ENTRADA'].includes(tipo)) {
                    sumaEntradas += costo;
                } else {
                    sumaSalidas += costo;
                }
            }
        });
    }
    return sumaEntradas - sumaSalidas;
}

// Calcula el Inventario Inicial (Kardex)
function calcularInventarioInicialKardex(kardexData, fechaInicioStr) {
    if (!kardexData || !Array.isArray(kardexData)) return 0;
    
    let saldoInicial = 0;
    const fechaCorteInicial = new Date(fechaInicioStr + "T00:00:00").getTime();

    kardexData.forEach(mov => {
        const fechaMov = new Date(mov.fecha).getTime();
        const costo = Number(mov.costo_total || 0);
        const concepto = (mov.concepto || "").toLowerCase();
        
        if (fechaMov < fechaCorteInicial || (fechaMov === fechaCorteInicial && concepto.includes('inventario inicial'))) {
            if (['INVENTARIO_INICIAL', 'COMPRA', 'DEV_VENTA', 'ENTRADA'].includes(mov.tipo_movimiento) || concepto.includes('inventario inicial')) {
                saldoInicial += costo;
            } else {
                saldoInicial -= costo;
            }
        }
    });
    
    return saldoInicial;
}

// Recalcula la Utilidad Neta conectando el Estado de Resultados y el Kardex
function calcularUtilidadNeta(cuentasRes, dataKardex, fechaInicio, fechaFin) {
    const getSaldoRes = (palabraClave) => {
        const cuenta = cuentasRes.find(c => c.NombreCuenta.toLowerCase().includes(palabraClave.toLowerCase()));
        if (!cuenta) return 0;
        return cuenta.CodigoMayor.startsWith('5') 
            ? parseFloat(cuenta.TotalHaber) - parseFloat(cuenta.TotalDebe)
            : parseFloat(cuenta.TotalDebe) - parseFloat(cuenta.TotalHaber);
    };

    const ventasNetas = getSaldoRes('Venta') - Math.abs(getSaldoRes('Devoluciones sobre venta') || getSaldoRes('Rebajas sobre venta'));
    const comprasTotales = getSaldoRes('Compra') + getSaldoRes('Gastos de compra');
    const comprasNetas = comprasTotales - Math.abs(getSaldoRes('Devoluciones sobre compra'));
    
    const inventarioInicial = calcularInventarioInicialKardex(dataKardex, fechaInicio); 
    const inventarioFinal = calcularInventarioKardex(dataKardex, fechaFin);
    
    const costoVentas = (comprasNetas + inventarioInicial) - inventarioFinal;
    const utilidadBruta = ventasNetas - costoVentas;
    const gastosOperacion = getSaldoRes('Gastos de administración') + getSaldoRes('Gastos de venta');
    const gastosFinancieros = getSaldoRes('Gastos financieros');
    
    return utilidadBruta - gastosOperacion - gastosFinancieros;
}

// Función para pintar la tabla
function renderizarBalance() {
    const efectivo = obtenerSaldoBalance('Efectivo', 'activo');
    const cuentasCobrar = obtenerSaldoBalance('Cuentas por cobrar', 'activo');
    const ivaCredito = obtenerSaldoBalance('IVA - Crédito Fiscal', 'activo');
    const inventario = inventarioKardex; 
    
    const totalActivoCorriente = efectivo + cuentasCobrar + inventario + ivaCredito;
    const propiedadPlanta = obtenerSaldoBalance('Propiedad, planta y equipo', 'activo');
    const totalActivo = totalActivoCorriente + propiedadPlanta;

    const prestamos = obtenerSaldoBalance('Préstamos bancarios', 'pasivo');
    const cuentasPagar = obtenerSaldoBalance('Cuentas por pagar', 'pasivo');
    const ivaDebito = obtenerSaldoBalance('IVA - Débito Fiscal', 'pasivo');
    const totalPasivo = prestamos + cuentasPagar + ivaDebito;

    const capitalSocial = obtenerSaldoBalance('Capital social', 'pasivo'); 
    const totalPatrimonio = capitalSocial + utilidadEjercicio; 
    
    const pasivoMasPatrimonio = totalPasivo + totalPatrimonio;

    const formatear = (num) => "$" + num.toLocaleString('en-US', {minimumFractionDigits: 2});
    
    // Verificamos si cuadra y llenamos el KPI
    const estaCuadrado = Math.abs(totalActivo - pasivoMasPatrimonio) < 0.01;
    const colorCuadre = estaCuadrado ? 'table-success-premium' : 'table-danger-premium';
    
    const kpiArea = document.getElementById('kpiArea');
    const kpiCard = document.getElementById('kpiCard');
    const kpiIcon = document.getElementById('kpiIcon');
    const kpiTitle = document.getElementById('kpiTitle');
    const kpiValue = document.getElementById('kpiValue');

    if (kpiArea) {
        kpiArea.style.display = 'block';
        if (estaCuadrado) {
            kpiCard.className = 'kpi-card kpi-success shadow-sm';
            kpiIcon.innerHTML = '<i class="bi bi-shield-check"></i>';
            kpiTitle.textContent = 'Balance Cuadrado';
            kpiValue.textContent = 'Activo = Pasivo + Patrimonio';
        } else {
            const diff = Math.abs(totalActivo - pasivoMasPatrimonio);
            kpiCard.className = 'kpi-card kpi-danger shadow-sm';
            kpiIcon.innerHTML = '<i class="bi bi-exclamation-triangle-fill"></i>';
            kpiTitle.textContent = 'Descuadre Encontrado';
            kpiValue.innerHTML = `Diferencia: <strong>${formatear(diff)}</strong>`;
        }
    }

    const html = `
        <tr class="grupo-header"><td colspan="3">ACTIVOS</td></tr>
        <tr class="subgrupo-header"><td colspan="3">Activo Corriente</td></tr>
        <tr><td class="sangria-1">Efectivo y equivalentes</td><td class="text-end font-monospace border-0">${formatear(efectivo)}</td><td class="border-0"></td></tr>
        <tr><td class="sangria-1">Cuentas por cobrar comerciales</td><td class="text-end font-monospace border-0">${formatear(cuentasCobrar)}</td><td class="border-0"></td></tr>
        <tr><td class="sangria-1">Inventarios (Kardex Final)</td><td class="text-end font-monospace border-0">${formatear(inventario)}</td><td class="border-0"></td></tr>
        <tr><td class="sangria-1">IVA - Crédito Fiscal</td><td class="text-end font-monospace">${formatear(ivaCredito)}</td><td></td></tr>
        <tr class="fila-totales"><td>Total Activo Corriente</td><td></td><td class="text-end font-monospace">${formatear(totalActivoCorriente)}</td></tr>
        
        <tr class="subgrupo-header"><td colspan="3">Activo No Corriente</td></tr>
        <tr><td class="sangria-1">Propiedad, planta y equipo</td><td class="text-end font-monospace">${formatear(propiedadPlanta)}</td><td></td></tr>
        <tr class="fila-totales"><td>Total Activo No Corriente</td><td></td><td class="text-end font-monospace">${formatear(propiedadPlanta)}</td></tr>
        <tr class="table-success-premium fs-6"><td colspan="2">TOTAL ACTIVO</td><td class="text-end font-monospace">${formatear(totalActivo)}</td></tr>

        <tr class="grupo-header"><td colspan="3">PASIVO Y PATRIMONIO</td></tr>
        <tr class="subgrupo-header"><td colspan="3">Pasivos Corrientes</td></tr>
        <tr><td class="sangria-1">Préstamos bancarios por pagar</td><td class="text-end font-monospace border-0">${formatear(prestamos)}</td><td class="border-0"></td></tr>
        <tr><td class="sangria-1">Cuentas por pagar comerciales</td><td class="text-end font-monospace border-0">${formatear(cuentasPagar)}</td><td class="border-0"></td></tr>
        <tr><td class="sangria-1">IVA - Débito Fiscal</td><td class="text-end font-monospace">${formatear(ivaDebito)}</td><td></td></tr>
        <tr class="fila-totales"><td>Total Pasivo</td><td></td><td class="text-end font-monospace">${formatear(totalPasivo)}</td></tr>

        <tr class="subgrupo-header"><td colspan="3">Patrimonio</td></tr>
        <tr><td class="sangria-1">Capital Social</td><td class="text-end font-monospace border-0">${formatear(capitalSocial)}</td><td class="border-0"></td></tr>
        <tr><td class="sangria-1 text-primary fw-bold">Utilidad del Ejercicio</td><td class="text-end text-primary fw-bold font-monospace">${formatear(utilidadEjercicio)}</td><td></td></tr>
        <tr class="fila-totales"><td>Total Patrimonio</td><td></td><td class="text-end font-monospace">${formatear(totalPatrimonio)}</td></tr>
        
        <tr class="${colorCuadre} fs-6"><td colspan="2">TOTAL PASIVO + PATRIMONIO</td><td class="text-end font-monospace">${formatear(pasivoMasPatrimonio)}</td></tr>
    `;

    document.getElementById('cuerpo-balance').innerHTML = html;
}

document.addEventListener("DOMContentLoaded", async () => {
    try {
        const empresa = await (await fetch(`/api/empresa?idEmpresa=${idEmpresa}`)).json();
        const pEmpresa = document.getElementById('printEmpresa');
        if (pEmpresa) pEmpresa.textContent = empresa.nombre_comercial || empresa.nombre_legal || 'Mi Empresa';
    } catch (e) {}
});

// Extra: Update Print fields when form is submitted
document.getElementById('form-filtros').addEventListener('submit', (e) => {
    const pFecha = document.getElementById('printFecha');
    if(pFecha) pFecha.textContent = `Al ${document.getElementById('fecha-fin').value}`;
    
    const selL = document.getElementById('select-libro');
    const pLibro = document.getElementById('printLibro');
    if(pLibro && selL.selectedIndex > -1) pLibro.textContent = `Balance General - ${selL.options[selL.selectedIndex].text}`;
});

window.exportarExcel = function() {
    const tabla = document.getElementById('tabla-balance');
    if (!tabla) return;

    let wb = XLSX.utils.table_to_book(tabla, {sheet: "Balance General"});
    XLSX.writeFile(wb, `Balance_General.xlsx`);
}