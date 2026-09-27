document.addEventListener('DOMContentLoaded', () => {
    const formulario = document.getElementById('formularioKardex');
    const selectTipoMovimiento = document.getElementById('tipo_movimiento');
    const inputCuenta = document.getElementById('cuenta_contable');
    const inputArticulo = document.getElementById('articulo');
    const btnGuardar = formulario ? formulario.querySelector('button[type="submit"]') : null;
    
    // Botones de las vistas y buscador
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

    if (selectTipoMovimiento && inputCuenta) {
        selectTipoMovimiento.addEventListener('change', (e) => {
            inputCuenta.value = cuentasCatalogo[e.target.value] || '';
        });
    }

    if (btnVerGlobal) {
        btnVerGlobal.addEventListener('click', (e) => {
            e.preventDefault();
            if (cajaBuscador) cajaBuscador.style.display = 'none';
            btnVerGlobal.classList.add('active');
            btnVerIndividual.classList.remove('active');
            cargarHistorial('GLOBAL');
        });
    }

    if (btnVerIndividual) {
        btnVerIndividual.addEventListener('click', (e) => {
            e.preventDefault();
            if (cajaBuscador) cajaBuscador.style.display = 'block';
            btnVerIndividual.classList.add('active');
            btnVerGlobal.classList.remove('active');
            const titulo = document.getElementById('tituloHistorial');
            if (titulo) titulo.innerText = 'Kardex Individual (Selecciona un artículo)';
            
            const tbody = document.getElementById('cuerpoTablaKardex');
            if (tbody) tbody.innerHTML = '<tr><td colspan="13" class="text-center text-muted py-5"><i class="bi bi-search fs-1 d-block mb-2"></i>Selecciona un artículo arriba y haz clic en Buscar.</td></tr>';
            
            const tfoot = document.getElementById('pieTablaKardex');
            if (tfoot) tfoot.innerHTML = '';
            
            actualizarListaArticulos(); 
        });
    }

    if (btnBuscarActual && inputBuscar) {
        btnBuscarActual.addEventListener('click', () => {
            if (inputBuscar.value) cargarHistorial(inputBuscar.value);
        });
    }

    async function actualizarListaArticulos() {
        if (!inputBuscar) return;
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
            console.error('Error al cargar lista de artículos');
        }
    }

    window.abrirIndividual = function(articulo) {
        if (cajaBuscador && inputBuscar) {
            cajaBuscador.style.display = 'block';
            actualizarListaArticulos().then(() => {
                inputBuscar.value = articulo;
                cargarHistorial(articulo);
                const zonaImp = document.getElementById('zonaImpresion');
                if (zonaImp) zonaImp.scrollIntoView({ behavior: 'smooth' });
            });
        }
    };

    window.cargarHistorial = cargarHistorial;
    cargarHistorial('GLOBAL');

    if (formulario) {
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
                    abrirIndividual(articuloGuardado); 
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
    }

    window.exportarExcel = function() {
        let tabla = document.getElementById("tablaKardex");
        if (tabla) {
            let libro = XLSX.utils.table_to_book(tabla, {sheet: "Kardex"});
            XLSX.writeFile(libro, `Kardex_${filtroActual}.xlsx`);
        }
    }

    window.anularMovimiento = async function(id_movimiento) {
        if(confirm('¿Estás seguro de anular el último movimiento? Esto revertirá el saldo.')) {
            const res = await fetch(`/api/kardex/${id_movimiento}`, { method: 'DELETE' });
            if (res.ok) {
                alert('Movimiento anulado.');
                cargarHistorial(filtroActual);
            } else {
                alert('Error al anular.');
            }
        }
    }

    async function cargarHistorial(filtro) {
        filtroActual = filtro;
        const titulo = document.getElementById('tituloHistorial');
        if (titulo) {
            titulo.innerText = filtro === 'GLOBAL' ? 'Historial Global del Inventario' : `Tarjeta Kardex: ${filtro.toUpperCase()}`;
        }
        
        try {
            const res = await fetch(`/api/kardex/${filtro}`);
            const datos = await res.json();
            
            const tbody = document.getElementById('cuerpoTablaKardex');
            const tfoot = document.getElementById('pieTablaKardex');
            if (!tbody || !tfoot) return;

            tbody.innerHTML = ''; tfoot.innerHTML = '';

            if (!datos || datos.length === 0) {
                tbody.innerHTML = '<tr><td colspan="13" class="text-center">No hay registros para mostrar.</td></tr>';
                return;
            }

            let saldoFinalCant = 0, saldoFinalValor = 0;

            datos.forEach((mov, index) => {
                const esEntrada = mov.tipo_movimiento === 'INVENTARIO_INICIAL' || mov.tipo_movimiento === 'COMPRA' || mov.tipo_movimiento === 'DEV_VENTA';

                const fechaLimpia = mov.fecha ? new Date(mov.fecha).toLocaleDateString('es-SV', { timeZone: 'UTC' }) : '';
                
                const btnAnular = (index === datos.length - 1) 
                    ? `<button class="btn btn-outline-danger btn-sm no-print" onclick="anularMovimiento(${mov.id_movimiento})" title="Eliminar último registro"><i class="bi bi-trash"></i></button>`
                    : ``;

                const visualizacionArticulo = filtro === 'GLOBAL' 
                    ? `<a href="#" onclick="abrirIndividual('${mov.codigo_articulo}')" class="text-decoration-none fw-bold text-primary" title="Ver kardex de ${mov.codigo_articulo}">${mov.codigo_articulo}</a>`
                    : `<span class="fw-bold">${mov.codigo_articulo}</span>`;

                // Todo forzado visualmente a 2 decimales para estética contable
                tbody.innerHTML += `
                    <tr>
                        <td>${fechaLimpia}</td>
                        <td>${visualizacionArticulo}</td>
                        <td class="text-start"><small>${mov.concepto}</small></td>
                        
                        <td class="bg-soft-entradas border-left-sutil ${esEntrada ? 'text-success' : ''}">${esEntrada ? mov.cantidad : '-'}</td>
                        <td class="bg-soft-entradas ${esEntrada ? 'text-success' : ''}">${esEntrada ? '$'+Number(mov.costo_unitario).toFixed(2) : '-'}</td>
                        <td class="bg-soft-entradas ${esEntrada ? 'text-success fw-bold' : ''}">${esEntrada ? '$'+Number(mov.costo_total).toFixed(2) : '-'}</td>
                        
                        <td class="bg-soft-salidas border-left-sutil ${!esEntrada ? 'text-danger' : ''}">${!esEntrada ? mov.cantidad : '-'}</td>
                        <td class="bg-soft-salidas ${!esEntrada ? 'text-danger' : ''}">${!esEntrada ? '$'+Number(mov.costo_unitario).toFixed(2) : '-'}</td>
                        <td class="bg-soft-salidas ${!esEntrada ? 'text-danger fw-bold' : ''}">${!esEntrada ? '$'+Number(mov.costo_total).toFixed(2) : '-'}</td>
                        
                        <td class="bg-soft-existencias border-left-sutil">${mov.saldo_cantidad}</td>
                        <td class="bg-soft-existencias">$${Number(mov.saldo_costo_unitario).toFixed(2)}</td>
                        <td class="bg-soft-existencias fw-bold">$${Number(mov.saldo_total).toFixed(2)}</td>
                        
                        <td class="no-print border-left-sutil">${btnAnular}</td>
                    </tr>
                `;
                saldoFinalCant = mov.saldo_cantidad;
                saldoFinalValor = mov.saldo_total;
            });

            tfoot.innerHTML = `
                <tr>
                    <td colspan="9" class="text-end text-uppercase fw-bold text-muted fs-6 py-3">Inventario Final:</td>
                    <td class="bg-dark text-white text-center fs-6 fw-bold border-0 rounded-start-pill py-3">${saldoFinalCant}</td>
                    <td class="bg-dark text-white text-center border-0 py-3">$${Number(saldoFinalValor/saldoFinalCant || 0).toFixed(2)}</td>
                    <td class="bg-dark text-white text-center fs-6 fw-bold border-0 rounded-end-pill py-3">$${Number(saldoFinalValor).toFixed(2)}</td>
                    <td class="no-print"></td>
                </tr>
            `;
        } catch (error) {
            console.error(error);
        }
    }
});