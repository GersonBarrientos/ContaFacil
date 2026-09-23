let lineasAsiento = [];
let cuentasAgrupadas = {}; // Guardará el catálogo estructurado

// 1. Cargar el catálogo al iniciar la página
document.addEventListener("DOMContentLoaded", async () => {
    try {
        const respuesta = await fetch('/api/cuentas');
        const data = await respuesta.json();

        if (!respuesta.ok || !Array.isArray(data)) {
            throw new Error(data && data.error ? data.error : 'Respuesta inválida del servidor');
        }

        const cuentas = data;

        // Agrupar las cuentas por su Categoría
        cuentas.forEach(cuenta => {
            if (!cuentasAgrupadas[cuenta.Categoria]) {
                cuentasAgrupadas[cuenta.Categoria] = [];
            }
            cuentasAgrupadas[cuenta.Categoria].push(cuenta);
        });

        const selectPrincipal = document.getElementById('selectPrincipal');
        selectPrincipal.innerHTML = '<option value="">-- Seleccione Cuenta Principal --</option>';

        // Llenar el primer menú solo con los nombres de las cuentas principales
        for (const categoria of Object.keys(cuentasAgrupadas)) {
            const opt = document.createElement('option');
            opt.value = categoria;
            opt.innerHTML = categoria;
            selectPrincipal.appendChild(opt);
        }
    } catch (error) {
        console.error("Error cargando el catálogo:", error);
        const selectPrincipal = document.getElementById('selectPrincipal');
        if (selectPrincipal) {
            selectPrincipal.innerHTML = '<option value="">Error de conexión</option>';
        }
    }
});

// 2. Se ejecuta al elegir una Cuenta Principal
function alCambiarPrincipal() {
    const selectPrincipal = document.getElementById('selectPrincipal');
    const selectSubcuenta = document.getElementById('selectSubcuenta');
    const inputCodigo = document.getElementById('inputCodigo');
    const checkSubcuenta = document.getElementById('checkSubcuenta');
    
    const categoria = selectPrincipal.value;
    
    // Limpiamos el código y el check
    inputCodigo.value = "";
    checkSubcuenta.checked = false;

    if (categoria === "") {
        selectSubcuenta.innerHTML = '<option value="">-- Seleccione primero una cuenta principal --</option>';
        selectSubcuenta.disabled = true;
        return;
    }

    // Habilitar y llenar el menú de subcuentas vinculado a esta principal
    selectSubcuenta.disabled = false;
    selectSubcuenta.innerHTML = '<option value="">-- Seleccione una Subcuenta --</option>';
    
    cuentasAgrupadas[categoria].forEach(sub => {
        const opt = document.createElement('option');
        opt.value = sub.CodigoSubcuenta;
        opt.dataset.nombre = sub.NombreSubcuenta;
        opt.innerHTML = `${sub.NombreSubcuenta} (${sub.CodigoSubcuenta})`;
        selectSubcuenta.appendChild(opt);
    });
}

// 3. Se ejecuta al elegir una Subcuenta
function alCambiarSubcuenta() {
    const selectSubcuenta = document.getElementById('selectSubcuenta');
    const inputCodigo = document.getElementById('inputCodigo');
    const checkSubcuenta = document.getElementById('checkSubcuenta');

    if (selectSubcuenta.value === "") {
        inputCodigo.value = "";
        checkSubcuenta.checked = false;
    } else {
        // Autocompletar el código de la subcuenta en el input
        inputCodigo.value = selectSubcuenta.value;
        checkSubcuenta.checked = true;
    }
}

// 4. Función para agregar datos a la tabla (Botón "+")
function agregarLinea() {
    const fecha = document.getElementById('inputFecha').value;
    const selectPrincipal = document.getElementById('selectPrincipal');
    const selectSubcuenta = document.getElementById('selectSubcuenta');
    
    if (selectPrincipal.value === "") {
        alert("Por favor seleccione una Cuenta Principal.");
        return;
    }

    if (selectSubcuenta.value === "") {
        alert("Debe seleccionar una Subcuenta. Todo movimiento debe registrarse en una subcuenta para poder guardarse en la base de datos.");
        return;
    }

    const debe = parseFloat(document.getElementById('inputDebe').value) || 0;
    const haber = parseFloat(document.getElementById('inputHaber').value) || 0;

    if (!fecha) {
        alert("La fecha es obligatoria.");
        return;
    }
    if (debe === 0 && haber === 0) {
        alert("Debe ingresar un monto en el Debe o en el Haber.");
        return;
    }

    const categoriaPrincipal = selectPrincipal.value;

    // Siempre agregamos DOS líneas: la Cuenta Principal (visual) y la Subcuenta
    // (con su código, que es lo que realmente se guarda en la base de datos).
    const opcionSub = selectSubcuenta.options[selectSubcuenta.selectedIndex];
    const nombreSubcuenta = opcionSub.dataset.nombre;
    const codigoSubcuenta = opcionSub.value;

    // A. Insertar la Cuenta Principal visualmente
    lineasAsiento.push({
        fecha: fecha,
        codigo: "",
        concepto: categoriaPrincipal,
        debe: debe,
        haber: haber,
        esSubcuenta: false
    });

    // B. Insertar la Subcuenta abajo con su código para la BD
    lineasAsiento.push({
        fecha: fecha,
        codigo: codigoSubcuenta,
        concepto: nombreSubcuenta,
        debe: debe,
        haber: haber,
        esSubcuenta: true
    });

    renderizarTabla();
    
    // Limpiar campos para la siguiente línea
    document.getElementById('selectPrincipal').selectedIndex = 0;
    document.getElementById('selectSubcuenta').innerHTML = '<option value="">-- Seleccione primero una cuenta principal --</option>';
    document.getElementById('selectSubcuenta').disabled = true;
    document.getElementById('inputCodigo').value = '';
    document.getElementById('inputDebe').value = '0.00';
    document.getElementById('inputHaber').value = '0.00';
    document.getElementById('checkSubcuenta').checked = false;
}

// 5. Dibujar la tabla HTML con fechas independientes por línea
function renderizarTabla() {
    const tbody = document.getElementById('cuerpoTabla');
    tbody.innerHTML = ''; 

    let sumDebe = 0;
    let sumHaber = 0;

    lineasAsiento.forEach((linea, index) => {
        const tr = document.createElement('tr');
        
        // Cada fila muestra su propia fecha formateada individualmente
        const tdFecha = `<td class="fecha-col">${formatearFecha(linea.fecha)}</td>`;

        const claseCuenta = linea.esSubcuenta ? 'subcuenta' : 'cuenta-principal';
        const textoCuenta = linea.esSubcuenta ? `↳ ${linea.concepto}` : linea.concepto;

        let parcialHTML = '', debeHTML = '', haberHTML = '';
        
        if (linea.esSubcuenta) {
            const montoParcial = linea.debe > 0 ? linea.debe : linea.haber;
            parcialHTML = montoParcial > 0 ? montoParcial.toLocaleString('en-US', {minimumFractionDigits: 2}) : '';
        } else {
            debeHTML = linea.debe > 0 ? linea.debe.toLocaleString('en-US', {minimumFractionDigits: 2}) : '';
            haberHTML = linea.haber > 0 ? linea.haber.toLocaleString('en-US', {minimumFractionDigits: 2}) : '';
            sumDebe += linea.debe;
            sumHaber += linea.haber;
        }

        tr.innerHTML = `
            ${tdFecha}
            <td class="${claseCuenta}">${textoCuenta}</td>
            <td class="monto text-muted">${parcialHTML}</td>
            <td class="monto">${debeHTML}</td>
            <td class="monto">${haberHTML}</td>
            <td class="text-center">
                <button class="btn btn-sm text-danger" onclick="eliminarLinea(${index})"><i class="bi bi-trash"></i></button>
            </td>
        `;
        tbody.appendChild(tr);
    });

    document.getElementById('totalDebe').innerText = sumDebe.toLocaleString('en-US', {minimumFractionDigits: 2});
    document.getElementById('totalHaber').innerText = sumHaber.toLocaleString('en-US', {minimumFractionDigits: 2});
}
// 6. Enviar el JSON a tu Backend Node.js
async function guardarAsientoBD() {
    if (lineasAsiento.length === 0) {
        alert("No hay líneas para guardar.");
        return;
    }

    const descripcion = document.getElementById('inputDescripcion').value || "Registro manual";
    
    // Filtramos las líneas que tienen un código de subcuenta válido para la base de datos
    const detallesParaBD = lineasAsiento
        .filter(l => l.codigo !== '') // Solo enviamos las filas que tienen subcuenta vinculada
        .map(l => ({
            codigo: l.codigo,         // Aquí enviamos el código (ej. "110101") que exige la base de datos
            debe: l.debe,
            haber: l.haber
        }));

    const payload = {
        fecha: lineasAsiento[0].fecha,
        descripcion: descripcion,
        detalles: detallesParaBD
    };

    try {
        const response = await fetch('/api/asientos', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        if (response.ok) {
            alert("Asiento guardado correctamente en la base de datos.");
            lineasAsiento = [];
            renderizarTabla();
            document.getElementById('inputDescripcion').value = '';
        } else {
            const err = await response.json();
            alert("Error del servidor: " + (err.error || "No se pudo guardar"));
        }
    } catch (error) {
        console.error("Error de conexión:", error);
        alert("Error de conexión con el servidor Node.js");
    }
}



// Función para eliminar una línea de la tabla temporal
function eliminarLinea(index) {
    lineasAsiento.splice(index, 1);
    renderizarTabla();
}

// Función para formatear la fecha de formato YYYY-MM-DD a DD/MM
function formatearFecha(fechaISO) {
    if (!fechaISO) return '';
    const partes = fechaISO.split('-');
    if (partes.length < 3) return fechaISO;
    return `${partes[2]}/${partes[1]}`;
}