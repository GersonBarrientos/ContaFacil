// Variables globales para los datos
let datosCuentas = [];
// Variable global para guardar el inventario automático
let inventarioFinalKardex = 0;

document.addEventListener('DOMContentLoaded', () => {
    cargarLibros();
    // Escuchar cuando el usuario presione el botón "Generar"
    document.getElementById('form-filtros').addEventListener('submit', cargarEstadoResultados);
});

// Busca los libros activos en la base de datos y los pone en el selector
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

async function cargarEstadoResultados(event) {
    event.preventDefault(); // Evita que la página se recargue

    const idLibro = document.getElementById('select-libro').value;
    const fechaInicio = document.getElementById('fecha-inicio').value;
    const fechaFin = document.getElementById('fecha-fin').value;

    document.getElementById('tabla-resultados').innerHTML = 
        '<tr><td colspan="4" class="text-center text-primary py-4"><i class="bi bi-hourglass-split"></i> Generando reporte...</td></tr>';

    try {
        // 1. Obtener datos de ingresos y gastos
        const responseCuentas = await fetch(`/api/estado-resultados?idLibro=${idLibro}&fechaInicio=${fechaInicio}&fechaFin=${fechaFin}`);
        datosCuentas = await responseCuentas.json();
        
        // 2. Calcular el Inventario Final sumando Entradas y restando Salidas del Kardex
        try {
            const responseKardex = await fetch('/api/kardex/GLOBAL');
            const movimientos = await responseKardex.json();
            
            // Convertimos la fecha de corte a formato numérico (milisegundos)
            const fechaCorte = new Date(fechaFin + "T23:59:59").getTime();

            let sumaEntradas = 0;
            let sumaSalidas = 0;

            if (Array.isArray(movimientos)) {
                movimientos.forEach(mov => {
                    const fechaMov = new Date(mov.fecha).getTime();
                    
                    // Solo sumamos si el movimiento ocurrió antes o durante la fecha "Hasta"
                    if (fechaMov <= fechaCorte) {
                        const costo = Number(mov.costo_total || 0);
                        const tipo = mov.tipo_movimiento;
                        
                        // Usamos la misma lógica que tienes en tu archivo kardex.js
                        const esEntrada = tipo === 'INVENTARIO_INICIAL' || tipo === 'COMPRA' || tipo === 'DEV_VENTA';
                        
                        if (esEntrada) {
                            sumaEntradas += costo;
                        } else {
                            sumaSalidas += costo;
                        }
                    }
                });
            }

            // Inventario Global = Todo lo que entró - Todo lo que salió
            inventarioFinalKardex = sumaEntradas - sumaSalidas;
            
            // 3. Renderizamos la tabla y le pasamos el valor automático y los movimientos
            renderizarTabla(inventarioFinalKardex, movimientos);

        } catch (errorKardex) {
            console.warn("No se pudo conectar con el Kardex", errorKardex);
            inventarioFinalKardex = 0;
            renderizarTabla(inventarioFinalKardex, []); // Renderiza aunque falle el kardex
        }

    } catch (error) {
        console.error('Error al cargar:', error);
        document.getElementById('tabla-resultados').innerHTML = 
            '<tr><td colspan="4" class="text-center text-danger py-4">Ocurrió un error al cargar el reporte con los parámetros indicados.</td></tr>';
    }
}

// Función para buscar el saldo de una cuenta por su nombre o parte de él
function obtenerSaldo(palabraClave) {
    const cuenta = datosCuentas.find(c => c.NombreCuenta.toLowerCase().includes(palabraClave.toLowerCase()));
    if (!cuenta) return 0;
    
    // Si es cuenta de resultados acreedora (ingresos 5) o deudora (gastos 4)
    if (cuenta.CodigoMayor.startsWith('5')) {
        return parseFloat(cuenta.TotalHaber) - parseFloat(cuenta.TotalDebe);
    } else {
        return parseFloat(cuenta.TotalDebe) - parseFloat(cuenta.TotalHaber);
    }
}

// Función inteligente para calcular el Inventario Inicial desde el Kardex
function calcularInventarioInicialKardex(kardexData, fechaInicioStr) {
    if (!kardexData || !Array.isArray(kardexData)) return 0;

    let saldoInicial = 0;
    const fechaCorteInicial = new Date(fechaInicioStr + "T00:00:00").getTime();

    kardexData.forEach(mov => {
        const fechaMov = new Date(mov.fecha).getTime();
        const costo = Number(mov.costo_total || 0);
        const concepto = (mov.concepto || "").toLowerCase();
        
        // Sumar si el movimiento fue ANTES de la fecha "Desde" del reporte
        // O si fue el mismo día de inicio y está clasificado como "Inventario Inicial"
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

// Función para formatear a moneda
function formatoDinero(cantidad) {
    if (cantidad === 0 || isNaN(cantidad)) return "";
    return "$" + cantidad.toFixed(2);
}

// Renderiza la tabla
function renderizarTabla(inventarioAuto = null, movimientosKardex = []) {
    const ventas = obtenerSaldo('Venta');
    const devVentas = Math.abs(obtenerSaldo('Devoluciones sobre venta') || obtenerSaldo('Rebajas sobre venta'));
    const ventasNetas = ventas - devVentas;

    const compras = obtenerSaldo('Compra');
    const gastosCompra = obtenerSaldo('Gastos de compra');
    const comprasTotales = compras + gastosCompra;
    
    const devCompras = Math.abs(obtenerSaldo('Devoluciones sobre compra'));
    const comprasNetas = comprasTotales - devCompras;

    const fechaDesde = document.getElementById('fecha-inicio').value; 
    
    // Le pasamos la variable correcta (movimientosKardex)
    const inventarioInicial = calcularInventarioInicialKardex(movimientosKardex, fechaDesde); 

    const mercaderiaDisponible = comprasNetas + inventarioInicial;

    // Asignación inteligente del Inventario Final
    const inputInvFinal = document.getElementById('inv-final');
    // Si viene del Kardex, lo usamos. Si no, leemos la celda. Si está vacía, es 0.
    const inventarioFinal = inventarioAuto !== null ? inventarioAuto : (inputInvFinal ? parseFloat(inputInvFinal.value) || 0 : 0);

    const costoVentas = mercaderiaDisponible - inventarioFinal;
    const utilidadBruta = ventasNetas - costoVentas;

    const gastosOperacion = obtenerSaldo('Gastos de administración') + obtenerSaldo('Gastos de venta');
    const gastosFinancieros = obtenerSaldo('Gastos financieros');
    
    const utilidadOperacional = utilidadBruta - gastosOperacion - gastosFinancieros;
    
    // Definimos el HTML de la celda del inventario. Si viene automático, se bloquea y se pinta de gris.
    
    const inputHTML = `<input type="number" id="inv-final" class="input-inventario ${inventarioAuto !== null ? 'bg-light text-muted border-0' : ''}" value="${inventarioFinal}" ${inventarioAuto !== null ? 'readonly' : 'onchange="renderizarTabla()"'}>`;
    
    const html = `
        <tr>
            <td>Ventas</td>
            <td></td><td></td>
            <td class="text-end">${formatoDinero(ventas)}</td>
        </tr>
        <tr>
            <td class="sangria-1">(-) Devoluciones sobre ventas</td>
            <td></td><td></td>
            <td class="text-end border-bottom border-dark">${formatoDinero(devVentas)}</td>
        </tr>
        <tr class="fila-totales">
            <td>Ventas netas</td>
            <td></td><td></td>
            <td class="text-end">${formatoDinero(ventasNetas)}</td>
        </tr>
        <tr>
            <td>Compras</td>
            <td class="text-end">${formatoDinero(compras)}</td>
            <td></td><td></td>
        </tr>
        <tr>
            <td class="sangria-1">(+) Gastos de compra</td>
            <td class="text-end border-bottom border-dark">${formatoDinero(gastosCompra)}</td>
            <td></td><td></td>
        </tr>
        <tr class="fila-totales">
            <td>Compras totales</td>
            <td></td>
            <td class="text-end">${formatoDinero(comprasTotales)}</td>
            <td></td>
        </tr>
        <tr>
            <td class="sangria-1">(-) Devoluciones sobre compras</td>
            <td></td>
            <td class="text-end border-bottom border-dark">${formatoDinero(devCompras)}</td>
            <td></td>
        </tr>
        <tr class="fila-totales">
            <td>Compras netas</td>
            <td></td>
            <td class="text-end">${formatoDinero(comprasNetas)}</td>
            <td></td>
        </tr>
        <tr>
            <td class="sangria-1">(+) Inventario inicial</td>
            <td></td>
            <td class="text-end border-bottom border-dark">${formatoDinero(inventarioInicial)}</td>
            <td></td>
        </tr>
        <tr class="fila-totales">
            <td>Mercadería disponible</td>
            <td></td><td></td>
            <td class="text-end">${formatoDinero(mercaderiaDisponible)}</td>
        </tr>
        <tr>
            <td class="sangria-1">(-) Inventario final</td>
            <td></td><td></td>
            <td class="text-end border-bottom border-dark">$${inputHTML}</td>
        </tr>
        <tr class="fila-totales">
            <td>Costo de ventas</td>
            <td></td><td></td>
            <td class="text-end border-bottom border-dark">${formatoDinero(costoVentas)}</td>
        </tr>
        <tr class="table-primary fw-bold">
            <td>Utilidad bruta</td>
            <td></td><td></td>
            <td class="text-end">${formatoDinero(utilidadBruta)}</td>
        </tr>
        <tr>
            <td class="sangria-1">(-) Gastos de operación</td>
            <td></td>
            <td class="text-end">${formatoDinero(gastosOperacion)}</td>
            <td></td>
        </tr>
        <tr>
            <td class="sangria-1">Gastos financieros</td>
            <td></td>
            <td class="text-end border-bottom border-dark">${formatoDinero(gastosFinancieros)}</td>
            <td></td>
        </tr>
        <tr class="table-success fw-bold">
            <td>Utilidad operacional antes de impuestos</td>
            <td></td><td></td>
            <td class="text-end">$${utilidadOperacional.toFixed(2)}</td>
        </tr>
    `;

    document.getElementById('tabla-resultados').innerHTML = html;
}