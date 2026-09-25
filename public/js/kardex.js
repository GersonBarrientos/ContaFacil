document.addEventListener('DOMContentLoaded', () => {
    const formulario = document.getElementById('formularioKardex');
    const selectTipoMovimiento = document.getElementById('tipo_movimiento');
    const inputCuenta = document.getElementById('cuenta_contable');
    const inputArticulo = document.getElementById('articulo');
    const btnGuardar = formulario.querySelector('button[type="submit"]');
    
    const btnVerGlobal = document.getElementById('btnVerGlobal');
    const btnVerIndividual = document.getElementById('btnVerIndividual');
    const cajaBuscador = document.getElementById('cajaBuscador');
    const inputBuscar = document.getElementById('input_buscar');
    const btnBuscarActual = document.getElementById('btnBuscarActual');
    
    let filtroActual = 'GLOBAL';

    const cuentasCatalogo = {
        'INVENTARIO_INICIAL': '110501 - Bodega 01',
        'COMPRA': '41010101 - Compras',
        'VENTA': '51010101 - Ventas',
        'DEV_COMPRA': '41010101 - Compras (Rev)',
        'DEV_VENTA': '51010402 - Dev. Ventas'
    };

    selectTipoMovimiento.addEventListener('change', (e) => {
        inputCuenta.value = cuentasCatalogo[e.target.value] || '';
    });

    // Lógica de los Bloques (Botones Grandes)
    btnVerGlobal.addEventListener('click', () => {
        cajaBuscador.style.display = 'none';
        cargarHistorial('GLOBAL');
    });

    // MODIFICADO: Ahora cambia los textos y carga la lista de la base de datos
    btnVerIndividual.addEventListener('click', () => {
        cajaBuscador.style.display = 'block';
        document.getElementById('tituloHistorial').innerText = 'Kardex Individual (Selecciona un artículo)';
        document.getElementById('cuerpoTablaKardex').innerHTML = '<tr><td colspan="13" class="text-center text-muted">Selecciona un artículo arriba y haz clic en Buscar.</td></tr>';
        document.getElementById('pieTablaKardex').innerHTML = '';
        actualizarListaArticulos(); // Llama a la lista al abrir la vista
    });

    // MODIFICADO: Evalúa el value (que ahora viene del select)
    btnBuscarActual.addEventListener('click', () => {
        if(inputBuscar.value) cargarHistorial(inputBuscar.value);
    });

    // NUEVA FUNCIÓN: Va a la base de datos y llena el menú desplegable
    async function actualizarListaArticulos() {
        try {
            const res = await fetch('/api/kardex-articulos');
            if (res.ok) {
                const articulos = await res.json();
                inputBuscar.innerHTML = '<option value="" selected disabled>Seleccione un artículo...</option>';
                articulos.forEach(art => {
                    inputBuscar.innerHTML += `<option value="${art}">${art}</option>`;
                });
            }
        } catch (error) {
            console.error('Error al cargar la lista de artículos');
        }
    }

    // Función global para que los links en la tabla puedan activarla
    window.abrirIndividual = async function(articulo) {
        cajaBuscador.style.display = 'block';
        await actualizarListaArticulos(); // Actualizamos la lista antes de seleccionar
        inputBuscar.value = articulo;
        cargarHistorial(articulo);
        // Hacemos scroll hacia la tabla
        document.getElementById('zonaImpresion').scrollIntoView({ behavior: 'smooth' });
    };

    // Arrancamos viendo el Global
    window.cargarHistorial = cargarHistorial;
    cargarHistorial('GLOBAL');

    formulario.addEventListener('submit', async (e) => {
        e.preventDefault(); 
        btnGuardar.disabled = true;
        btnGuardar.innerText = 'Guardando...';
        
        try {
            const articuloGuardado = inputArticulo.value.trim();
            const datos = {
                fecha_movimiento: document.getElementById('fecha_movimiento').value,
                articulo: articuloGuardado,
                cuenta_contable: inputCuenta.value,
                concepto: document.getElementById('concepto').value,
                tipo_movimiento: selectTipoMovimiento.value,
                cantidad: document.getElementById('cantidad').value,
                precio_ingresado: document.getElementById('precio_ingresado').value,
                condicion_iva: document.getElementById('condicion_iva').value
            };

            const res = await fetch('/api/kardex', {
                method: 'POST', 
                headers: { 'Content-Type': 'application/json' }, 
                body: JSON.stringify(datos)
            });

            if (res.ok) {
                alert('¡Movimiento guardado exitosamente!');
                formulario.reset();
                inputCuenta.value = '';
                actualizarListaArticulos(); // Se actualiza la lista por si guardaste un artículo nuevo
                abrirIndividual(articuloGuardado); // Después de guardar, te lleva al kardex de ese artículo
            } else {
                const errText = await res.text();
                try {
                    const errJson = JSON.parse(errText);
                    alert('Error: ' + (errJson.error || 'Problema en el servidor'));
                } catch(e) {
                    alert('Error al guardar.');
                }
            }
        } catch (error) {
            alert('Error de conexión.');
        } finally {
            btnGuardar.disabled = false;
            btnGuardar.innerHTML = '<i class="bi bi-save"></i> Guardar';
        }
    });

    window.exportarExcel = function() {
        let tabla = document.getElementById("tablaKardex");
        let libro = XLSX.utils.table_to_book(tabla, {sheet: "Kardex"});
        XLSX.writeFile(libro, `Kardex_${filtroActual}.xlsx`);
    }

    window.anularMovimiento = async function(id_movimiento) {
        if(confirm('¿Estás seguro de anular el último movimiento? Esto revertirá el saldo.')) {
            const res = await fetch(`/api/kardex/${id_movimiento}`, { method: 'DELETE' });
            if(res.ok) {
                alert('Movimiento anulado.');
                cargarHistorial(filtroActual);
                actualizarListaArticulos(); // Actualizar la lista en caso de que ese fuera el último registro del artículo
            } else {
                alert('Error al anular.');
            }
        }
    }

    async function cargarHistorial(filtro) {
        filtroActual = filtro;
        try {
            document.getElementById('tituloHistorial').innerText = filtro === 'GLOBAL' ? 'Historial Global del Inventario' : `Tarjeta Kardex: ${filtro.toUpperCase()}`;
            
            const res = await fetch(`/api/kardex/${filtro}`);
            const datos = await res.json();
            
            const tbody = document.getElementById('cuerpoTablaKardex');
            const tfoot = document.getElementById('pieTablaKardex');
            tbody.innerHTML = ''; tfoot.innerHTML = '';

            if (!datos || datos.length === 0) {
                tbody.innerHTML = '<tr><td colspan="13" class="text-center">No hay registros para mostrar.</td></tr>';
                return;
            }

            let totalEntradas = 0, totalSalidas = 0, saldoFinalCant = 0, saldoFinalValor = 0;

            datos.forEach((mov, index) => {
                const esEntrada = mov.tipo_movimiento === 'INVENTARIO_INICIAL' || mov.tipo_movimiento === 'COMPRA' || mov.tipo_movimiento === 'DEV_VENTA';
                if (esEntrada) totalEntradas += Number(mov.costo_total);
                else totalSalidas += Number(mov.costo_total);

                const fechaLimpia = mov.fecha ? new Date(mov.fecha).toLocaleDateString('es-SV', { timeZone: 'UTC' }) : '';
                
                // Botón de eliminar habilitado siempre en la última fila del arreglo visible
                const btnAnular = (index === datos.length - 1) 
                    ? `<button class="btn btn-outline-danger btn-sm no-print" onclick="anularMovimiento(${mov.id_movimiento})" title="Eliminar último registro"><i class="bi bi-trash"></i></button>`
                    : ``;

                // Si estamos en global, el artículo es un botón clickeable. Si estamos en individual, es solo texto.
                const visualizacionArticulo = filtro === 'GLOBAL' 
                    ? `<a href="#" onclick="abrirIndividual('${mov.codigo_articulo}')" class="text-decoration-none fw-bold text-primary" title="Ver kardex de ${mov.codigo_articulo}">${mov.codigo_articulo}</a>`
                    : `<span class="fw-bold">${mov.codigo_articulo}</span>`;

                tbody.innerHTML += `
                    <tr>
                        <td>${fechaLimpia}</td>
                        <td>${visualizacionArticulo}</td>
                        <td class="text-start"><small>${mov.concepto}</small></td>
                        <td class="${esEntrada ? 'text-success' : ''}">${esEntrada ? mov.cantidad : '-'}</td>
                        <td class="${esEntrada ? 'text-success' : ''}">${esEntrada ? '$'+Number(mov.costo_unitario).toFixed(4) : '-'}</td>
                        <td class="${esEntrada ? 'text-success fw-bold' : ''}">${esEntrada ? '$'+Number(mov.costo_total).toFixed(2) : '-'}</td>
                        <td class="${!esEntrada ? 'text-danger' : ''}">${!esEntrada ? mov.cantidad : '-'}</td>
                        <td class="${!esEntrada ? 'text-danger' : ''}">${!esEntrada ? '$'+Number(mov.costo_unitario).toFixed(4) : '-'}</td>
                        <td class="${!esEntrada ? 'text-danger fw-bold' : ''}">${!esEntrada ? '$'+Number(mov.costo_total).toFixed(2) : '-'}</td>
                        <td class="bg-light">${mov.saldo_cantidad}</td>
                        <td class="bg-light">$${Number(mov.saldo_costo_unitario).toFixed(4)}</td>
                        <td class="bg-light fw-bold">$${Number(mov.saldo_total).toFixed(2)}</td>
                        <td class="no-print">${btnAnular}</td>
                    </tr>
                `;
                saldoFinalCant = mov.saldo_cantidad;
                saldoFinalValor = mov.saldo_total;
            });

            // Footer con los saldos tradicionales restaurados
            tfoot.innerHTML = `
                <tr>
                    <td colspan="3" class="text-end text-uppercase">Totales:</td>
                    <td colspan="3" class="text-center text-success">$${totalEntradas.toFixed(2)}</td>
                    <td colspan="3" class="text-center text-danger">$${totalSalidas.toFixed(2)}</td>
                    <td class="bg-warning text-dark text-center fs-5">${saldoFinalCant}</td>
                    <td class="bg-warning"></td>
                    <td class="bg-warning text-dark text-center fs-5">$${saldoFinalValor.toFixed(2)}</td>
                    <td class="no-print"></td>
                </tr>
            `;
        } catch (error) {
            console.error(error);
        }
    }
});