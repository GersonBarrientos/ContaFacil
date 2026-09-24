let lineasAsiento = [];
let cuentasAgrupadas = {}; // Guardará el catálogo estructurado
const idEmpresa = Number(localStorage.getItem('idEmpresa') || 1);

function esc(str) {
    if (!str) return '';
    return String(str).replace(/[&<>'"]/g, match => ({
        '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;'
    })[match]);
}

// 1. Cargar el catálogo al iniciar la página
document.addEventListener("DOMContentLoaded", async () => {
    try {
        const librosResponse = await fetch(`/api/libros?idEmpresa=${idEmpresa}`);
        const libros = await librosResponse.json();
        if (!librosResponse.ok || !Array.isArray(libros)) {
            throw new Error(libros.error || 'No se pudieron cargar los libros. Verifica la migración y la conexión a Supabase.');
        }
        const selectLibro = document.getElementById('selectLibro');
        selectLibro.innerHTML = '<option value="">-- Seleccione libro --</option>';
        libros.forEach(libro => {
            selectLibro.innerHTML += `<option value="${esc(libro.id_libro)}">${esc(libro.nombre_libro)}</option>`;
        });
        const respuesta = await fetch('/api/cuentas'); 
        const cuentas = await respuesta.json();
        
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
            opt.textContent = categoria;
            selectPrincipal.appendChild(opt);
        }
    } catch (error) {
        console.error("Error cargando el catálogo:", error);
        const selectLibro = document.getElementById('selectLibro');
        if (selectLibro) selectLibro.innerHTML = `<option value="">${error.message}</option>`;
        document.getElementById('selectPrincipal').innerHTML = '<option value="">Error de conexión</option>';
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
    selectSubcuenta.innerHTML = '<option value="">-- Ninguna (Registro de Mayor) --</option>';
    
    cuentasAgrupadas[categoria].forEach(sub => {
        const opt = document.createElement('option');
        opt.value = sub.CodigoSubcuenta;
        opt.dataset.nombre = sub.NombreSubcuenta;
        opt.textContent = `${sub.NombreSubcuenta} (${sub.CodigoSubcuenta})`;
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

    const debe = Number((parseFloat(document.getElementById('inputDebe').value) || 0).toFixed(2));
    const haber = Number((parseFloat(document.getElementById('inputHaber').value) || 0).toFixed(2));

    if (!fecha) {
        alert("La fecha es obligatoria.");
        return;
    }
    if (debe < 0 || haber < 0) {
        alert("No se permiten montos negativos.");
        return;
    }
    if (debe === 0 && haber === 0) {
        alert("Debe ingresar un monto en el Debe o en el Haber.");
        return;
    }
    if (debe > 0 && haber > 0) {
        alert("Una misma línea no puede tener valores en el Debe y el Haber simultáneamente.");
        return;
    }
    if (selectSubcuenta.value === "") {
        alert("Por favor seleccione una Subcuenta. Es requerido para registrar en la base de datos.");
        return;
    }

    const categoriaPrincipal = selectPrincipal.value;
    const grupoId = Date.now() + Math.random();

    // CASO 1: Si seleccionó una subcuenta, agregamos DOS líneas automáticamente: 
    // 1. La Cuenta Principal (en el Debe o Haber)
    // 2. La Subcuenta (con sangría y en la columna Parcial)
    if (selectSubcuenta.value !== "") {
        const opcionSub = selectSubcuenta.options[selectSubcuenta.selectedIndex];
        const nombreSubcuenta = opcionSub.dataset.nombre;
        const codigoSubcuenta = opcionSub.value;

        // A. Insertar la Cuenta Principal visualmente
        lineasAsiento.push({
            grupoId,
            fecha: fecha,
            codigo: "",
            concepto: categoriaPrincipal,
            debe: debe,
            haber: haber,
            esSubcuenta: false
        });

        // B. Insertar la Subcuenta abajo con su código para la BD
        lineasAsiento.push({
            grupoId,
            fecha: fecha,
            codigo: codigoSubcuenta,
            concepto: nombreSubcuenta,
            debe: debe,
            haber: haber,
            esSubcuenta: true
        });

    }

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
        const textoCuenta = linea.esSubcuenta ? `↳ ${esc(linea.concepto)}` : esc(linea.concepto);

        let parcialHTML = '', debeHTML = '', haberHTML = '';
        
        if (linea.esSubcuenta) {
            const montoParcial = linea.debe > 0 ? linea.debe : linea.haber;
            parcialHTML = montoParcial > 0 ? montoParcial.toLocaleString('en-US', {minimumFractionDigits: 2}) : '';
        } else {
            debeHTML = linea.debe > 0 ? linea.debe.toLocaleString('en-US', {minimumFractionDigits: 2}) : '';
            haberHTML = linea.haber > 0 ? linea.haber.toLocaleString('en-US', {minimumFractionDigits: 2}) : '';
            sumDebe = Number((sumDebe + linea.debe).toFixed(2));
            sumHaber = Number((sumHaber + linea.haber).toFixed(2));
        }

        tr.innerHTML = `
            ${tdFecha}
            <td class="${claseCuenta}">${textoCuenta}</td>
            <td class="monto text-muted">${parcialHTML}</td>
            <td class="monto">${debeHTML}</td>
            <td class="monto">${haberHTML}</td>
            <td class="text-center">
                <button class="btn btn-sm text-danger" onclick="eliminarLinea(${linea.grupoId})"><i class="bi bi-trash"></i></button>
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
    const idLibro = Number(document.getElementById('selectLibro').value);
    if (!idLibro) {
        alert("Seleccione un libro activo.");
        return;
    }
    
    const btnGuardar = document.querySelector('button[onclick="guardarAsientoBD()"]');
    if (btnGuardar) {
        btnGuardar.disabled = true;
        btnGuardar.innerHTML = '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Guardando...';
    }

    const totalDebe = parseFloat(document.getElementById('totalDebe').innerText.replace(/,/g, ''));
    const totalHaber = parseFloat(document.getElementById('totalHaber').innerText.replace(/,/g, ''));
    if (Math.abs(totalDebe - totalHaber) >= 0.01) {
        alert("El asiento no cuadra. El total Debe debe ser igual al total Haber.");
        if (btnGuardar) { btnGuardar.disabled = false; btnGuardar.innerHTML = '<i class="bi bi-save me-2"></i> Guardar Asiento'; }
        return;
    }
    
    // Filtramos las líneas que tienen un código de subcuenta válido para la base de datos
    const detallesParaBD = lineasAsiento
        .filter(l => l.codigo !== '') // Solo enviamos las filas que tienen subcuenta vinculada
        .map(l => ({
            codigo: l.codigo,         // Aquí enviamos el código (ej. "110101") que exige la base de datos
            debe: l.debe,
            haber: l.haber
        }));

    const payload = {
        idEmpresa,
        idLibro,
        fecha: lineasAsiento[0].fecha,
        descripcion: esc(descripcion),
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
    } finally {
        if (btnGuardar) {
            btnGuardar.disabled = false;
            btnGuardar.innerHTML = '<i class="bi bi-save me-2"></i> Guardar Asiento';
        }
    }
}



// Función para eliminar una línea de la tabla temporal
function eliminarLinea(grupoId) {
    lineasAsiento = lineasAsiento.filter(l => l.grupoId !== grupoId);
    renderizarTabla();
}

// Función para formatear la fecha de formato YYYY-MM-DD a DD/MM
function formatearFecha(fechaISO) {
    if (!fechaISO) return '';
    const partes = fechaISO.split('-');
    if (partes.length < 3) return fechaISO;
    return `${partes[2]}/${partes[1]}`;
}