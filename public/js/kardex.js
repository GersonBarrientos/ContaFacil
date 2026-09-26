document.addEventListener('DOMContentLoaded', () => {
    const formulario = document.getElementById('formularioKardex');
    const selectTipoMovimiento = document.getElementById('tipo_movimiento');
    const inputCuenta = document.getElementById('cuenta_contable');
    const inputArticulo = document.getElementById('articulo');
    const btnGuardar = formulario ? formulario.querySelector('button[type="submit"]') : null;
    
    // Botones de la vista global (según el diseño que me mostraste en tu captura)
    const btnBuscar = document.getElementById('btnBuscar');
    const inputBuscar = document.getElementById('input_buscar');
    
    let filtroActual = 'GLOBAL';

    const cuentasCatalogo = {
        'INVENTARIO_INICIAL': '110501 - Bodega 01',
        'COMPRA': '41010101 - Compras',
        'VENTA': '51010101 - Ventas',
        'DEV_COMPRA': '41010101 - Compras (Rev)',
        'DEV_VENTA': '51010402 - Dev. Ventas'
    };

    if(selectTipoMovimiento && inputCuenta) {
        selectTipoMovimiento.addEventListener('change', (e) => {
            inputCuenta.value = cuentasCatalogo[e.target.value] || '';
        });
    }

    if(btnBuscar && inputBuscar) {
        btnBuscar.addEventListener('click', () => {
            if(inputBuscar.value.trim()) cargarHistorial(inputBuscar.value.trim());
        });
    }

    window.cargarHistorial = cargarHistorial;
    cargarHistorial('GLOBAL');

    if(formulario) {
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
                    cargarHistorial(articuloGuardado); 
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
        if(tabla) {
            let libro = XLSX.utils.table_to_book(tabla, {sheet: "Kardex"});
            XLSX.writeFile(libro, `Kardex_${filtroActual}.xlsx`);
        }
    }

    window.anularMovimiento = async function(id_movimiento) {
        if(confirm('¿Anular este movimiento? Asegúrate de que sea el último para no arruinar los promedios.')) {
            const res = await fetch(`/api/kardex/${id_movimiento}`, { method: 'DELETE' });
            if(res.ok) {
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
        if(titulo) {
            titulo.innerText = filtro === 'GLOBAL' ? 'Historial Global del Inventario' : `Kardex: ${filtro.toUpperCase()}`;
        }
        
        try {
            const res = await fetch(`/api/kardex/${filtro}`);
            const datos = await res.json();
            
            const tbody = document.getElementById('cuerpoTablaKardex');
            const tfoot = document.getElementById('pieTablaKardex');
            if(!tbody || !tfoot) return;

            tbody.innerHTML = ''; tfoot.innerHTML = '';

            if (!datos || datos.length === 0) {
                tbody.innerHTML = '<tr><td colspan="13" class="text-center">No hay registros para mostrar.</td></tr>';
                return;
            }

            let totalEntradas = 0, totalSalidas = 0;

            datos.forEach((mov, index) => {
                const esEntrada = mov.tipo_movimiento === 'INVENTARIO_INICIAL' || mov.tipo_movimiento === 'COMPRA' || mov.tipo_movimiento === 'DEV_VENTA';
                if (esEntrada) totalEntradas += Number(mov.costo_total);
                else totalSalidas += Number(mov.costo_total);

                const fechaLimpia = mov.fecha ? new Date(mov.fecha).toLocaleDateString('es-SV', { timeZone: 'UTC' }) : '';
                
                const btnAnular = (filtro !== 'GLOBAL' && index === datos.length - 1) 
                    ? `<button class="btn btn-outline-danger btn-sm no-print" onclick="anularMovimiento(${mov.id_movimiento})"><i class="bi bi-trash"></i></button>`
                    : (filtro === 'GLOBAL' ? '<small class="text-muted">Filtra para anular</small>' : '');

                tbody.innerHTML += `
                    <tr>
                        <td>${fechaLimpia}</td>
                        <td class="fw-bold text-primary">${mov.codigo_articulo}</td>
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
            });

            tfoot.innerHTML = `
                <tr>
                    <td colspan="3" class="text-end text-uppercase">Movimiento Histórico:</td>
                    <td colspan="3" class="text-center text-success">$${totalEntradas.toFixed(2)}</td>
                    <td colspan="3" class="text-center text-danger">$${totalSalidas.toFixed(2)}</td>
                    <td colspan="4" class="bg-light"></td>
                </tr>
            `;
        } catch (error) {
            console.error(error);
        }
    }
});