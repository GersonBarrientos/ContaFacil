const moduloActual = window.location.pathname.split('/').pop() || 'index.html';

const enlaces = [
    ['index.html', 'house', 'Inicio'],
    ['libro-diario.html', 'journal-text', 'Libro Diario'],
    ['mayorizacion.html', 'book', 'Mayorización'],
    ['balance-comprobacion.html', 'ui-checks', 'Balance de Comp.'],
    ['estado-resultados.html', 'graph-up-arrow', 'E. Resultados'],
    ['balance-general.html', 'bank', 'Balance General'],
    ['kardex.html', 'box-seam', 'Kardex']
];

const navbar = `
<style>
    :root {
      /* Marca */
      --color-primary: #2C5282;
      --color-secondary: #00A896;

      /* Estados Financieros */
      --color-success: #2E7D32;
      --color-danger: #C53030;
      --color-warning: #DD6B20;

      /* Neutros y Superficies */
      --color-text-main: #1A202C;
      --color-text-muted: #718096;
      --color-border: #E2E8F0;
      --color-bg-app: #F8FAFC;
      --color-bg-card: #FFFFFF;
    }

    body { background-color: var(--color-bg-app) !important; color: var(--color-text-main); }
    .cf-brand { color: var(--color-primary); }
    .cf-dot { color: var(--color-secondary); font-weight: 900;}
    .cf-bg-dark-blue { background-color: var(--color-primary); }
    .cf-text-dark-blue { color: var(--color-primary); }
    .cf-logo-icon { width: 34px; height: 34px; border-radius: 10px; background-color: var(--color-primary); display:flex; align-items:center; justify-content:center; }
    .cf-empresa-btn { background: var(--color-bg-app); border: 1px solid var(--color-border); border-radius: 10px; padding: 6px 12px; }
    .cf-empresa-btn:hover { background: #f1f5f9; border-color: #cbd5e1; }
    .cf-status-pill { background-color: #ecfdf5; color: var(--color-success); border: 1px solid #a7f3d0; border-radius: 20px; font-size: 0.85rem; font-weight: 500; }
    .cf-nav-link { color: var(--color-text-muted); font-weight: 500; font-size: 0.95rem; transition: all 0.2s; border-bottom: 2px solid transparent; padding-bottom: 0.5rem; margin-bottom: -2px;}
    .cf-nav-link:hover { color: var(--color-primary); }
    .cf-nav-link.active { color: var(--color-primary); font-weight: 600; border-bottom: 2px solid var(--color-secondary); }
    .cf-notif-dot { background-color: var(--color-secondary); width: 10px; height: 10px; top: 6px; right: 6px; }
    .cf-avatar { width: 38px; height: 38px; border-radius: 50%; font-size: 0.95rem; letter-spacing: 0.5px; }
    
    .form-control:focus {
        border-color: var(--color-secondary);
        box-shadow: 0 0 0 0.25rem rgba(0, 168, 150, 0.25);
    }
    .input-group-text { border-color: var(--color-border); }
    .form-control { border-color: var(--color-border); color: var(--color-text-main); }
    
    @media (max-width: 1200px) {
        .cf-nav-link { font-size: 0.85rem; padding-left: 0.4rem !important; padding-right: 0.4rem !important; }
    }
    @media print {
        @page { margin: 15mm; }
        .alert, .toast { display: none !important; }
        .no-print { display: none !important; }
    }
</style>
<nav class="navbar navbar-expand-xl bg-white border-bottom shadow-sm sticky-top pt-2 pb-0 no-print">
    <div class="container-fluid px-3 px-xl-4 pb-2">
        <!-- Logo -->
        <a class="navbar-brand d-flex align-items-center me-0 me-xl-3" href="index.html">
            <img src="img/LOGOTIPO.png" alt="ContaFácil Logo" height="45" style="object-fit: contain;">
        </a>



        <button class="navbar-toggler border-0 shadow-none" type="button" data-bs-toggle="collapse" data-bs-target="#menuPrincipal" aria-controls="menuPrincipal" aria-expanded="false" aria-label="Abrir navegación">
            <span class="navbar-toggler-icon"></span>
        </button>

        <div class="collapse navbar-collapse" id="menuPrincipal">
            <!-- Center/Main Links -->
            <ul class="navbar-nav mx-auto mb-0 d-flex gap-1 gap-xl-3 align-items-xl-end mt-3 mt-xl-0" style="align-self: flex-end;">
                ${enlaces.map(([href, icono, texto]) => `
                    <li class="nav-item">
                        <a class="nav-link px-2 d-flex align-items-center gap-2 cf-nav-link ${href === moduloActual ? 'active' : ''}"
                           ${href === moduloActual ? 'aria-current="page"' : ''} href="${href}">
                            <i class="bi bi-${icono} d-xl-none"></i>${texto}
                        </a>
                    </li>`).join('')}
            </ul>

            <!-- Right elements -->
            <div class="d-flex align-items-center ms-auto mt-3 mt-xl-0 pb-1 pb-xl-0">
                
                <a href="#" data-bs-toggle="modal" data-bs-target="#modalEmpresa" class="d-flex align-items-center justify-content-center text-decoration-none shadow-sm rounded-circle" style="width: 40px; height: 40px; background-color: #fff; border: 2px solid #e2e8f0; transition: border-color 0.2s;" title="Configuración de Empresa" onmouseover="this.style.borderColor='#0d9488'" onmouseout="this.style.borderColor='#e2e8f0'">
                    <img id="navbarConfigLogo" src="img/ISOTIPO.PNG" alt="Configuración" style="width: 22px; height: 22px; object-fit: contain;">
                </a>
                
                <button class="btn btn-outline-danger border-0 rounded-circle shadow-sm d-flex align-items-center justify-content-center ms-2" style="width: 40px; height: 40px;" onclick="localStorage.removeItem('idEmpresa'); localStorage.removeItem('idUsuario'); localStorage.removeItem('empresa_id'); localStorage.removeItem('empresa_email'); window.location.href='index.html';" title="Cerrar Sesión">
                    <i class="bi bi-box-arrow-right"></i>
                </button>
            </div>
            
        </div>
    </div>
</nav>

<!-- Modal Configuración Empresa -->
<div class="modal fade" id="modalEmpresa" tabindex="-1" aria-labelledby="modalEmpresaLabel" aria-hidden="true">
    <div class="modal-dialog modal-lg modal-dialog-centered">
        <div class="modal-content border-0 shadow-lg" style="border-radius: 16px; overflow: hidden;">
            <div class="modal-header border-0 pb-3" style="background-color: var(--color-primary); color: white;">
                <div>
                    <h5 class="modal-title fw-bold mb-0" id="modalEmpresaLabel"><i class="bi bi-building-gear me-2"></i>Configuración de Empresa</h5>
                    <p class="mb-0 mt-1 small" style="color: rgba(255,255,255,0.8);">Actualiza la información que aparecerá en tus reportes financieros.</p>
                </div>
                <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal" aria-label="Close"></button>
            </div>
            <div class="modal-body p-4" style="background-color: var(--color-bg-app);">
                <div id="mensajeEmpresa"></div>
                <form id="empresaForm" class="row g-4 bg-white p-4 rounded-4 shadow-sm border" style="border-color: var(--color-border) !important;">
                    
                    <!-- Sección 1: Identidad -->
                    <div class="col-12 mb-1 mt-0">
                        <h6 class="fw-bold mb-2" style="color: var(--color-primary); border-bottom: 2px solid var(--color-border); padding-bottom: 8px;">
                            <i class="bi bi-person-vcard me-2 text-secondary"></i>Identidad Corporativa
                        </h6>
                    </div>
                    <div class="col-md-6 mt-2">
                        <label class="form-label fw-semibold small text-muted mb-1">Nombre legal *</label>
                        <div class="input-group input-group-sm">
                            <span class="input-group-text bg-light border-end-0"><i class="bi bi-bank text-muted"></i></span>
                            <input name="nombre_legal" class="form-control border-start-0 ps-0 bg-light" required placeholder="Ej. Empresa S.A. de C.V.">
                        </div>
                    </div>
                    <div class="col-md-6 mt-2">
                        <label class="form-label fw-semibold small text-muted mb-1">Nombre comercial</label>
                        <div class="input-group input-group-sm">
                            <span class="input-group-text bg-light border-end-0"><i class="bi bi-shop text-muted"></i></span>
                            <input name="nombre_comercial" class="form-control border-start-0 ps-0 bg-light" placeholder="Ej. Mi Tiendita">
                        </div>
                    </div>
                    
                    <!-- Sección 2: Fiscal & Ubicación -->
                    <div class="col-12 mb-1">
                        <h6 class="fw-bold mb-2 mt-2" style="color: var(--color-primary); border-bottom: 2px solid var(--color-border); padding-bottom: 8px;">
                            <i class="bi bi-file-earmark-text me-2 text-secondary"></i>Datos Fiscales y Ubicación
                        </h6>
                    </div>
                    <div class="col-md-4 mt-2">
                        <label class="form-label fw-semibold small text-muted mb-1">NIT</label>
                        <input name="nit" class="form-control form-control-sm bg-light" placeholder="0000-000000-000-0">
                    </div>
                    <div class="col-md-4 mt-2">
                        <label class="form-label fw-semibold small text-muted mb-1">NRC</label>
                        <input name="nrc" class="form-control form-control-sm bg-light" placeholder="000000-0">
                    </div>
                    <div class="col-md-4 mt-2">
                        <label class="form-label fw-semibold small text-muted mb-1">Giro comercial</label>
                        <input name="giro_comercial" class="form-control form-control-sm bg-light" placeholder="Ej. Venta al por menor">
                    </div>
                    <div class="col-md-8">
                        <label class="form-label fw-semibold small text-muted mb-1">Dirección completa</label>
                        <input name="direccion" class="form-control form-control-sm bg-light" placeholder="Calle, Avenida, Casa, Municipio">
                    </div>
                    <div class="col-md-4">
                        <label class="form-label fw-semibold small text-muted mb-1">País</label>
                        <input name="pais" class="form-control form-control-sm bg-light" placeholder="Ej. El Salvador">
                    </div>

                    <!-- Sección 3: Contacto & Preferencias -->
                    <div class="col-12 mb-1">
                        <h6 class="fw-bold mb-2 mt-2" style="color: var(--color-primary); border-bottom: 2px solid var(--color-border); padding-bottom: 8px;">
                            <i class="bi bi-telephone me-2 text-secondary"></i>Contacto y Preferencias
                        </h6>
                    </div>
                    <div class="col-md-4 mt-2">
                        <label class="form-label fw-semibold small text-muted mb-1">Teléfono</label>
                        <div class="input-group input-group-sm">
                            <span class="input-group-text bg-light border-end-0"><i class="bi bi-telephone text-muted"></i></span>
                            <input name="telefono" class="form-control border-start-0 ps-0 bg-light" placeholder="2222-2222">
                        </div>
                    </div>
                    <div class="col-md-5 mt-2">
                        <label class="form-label fw-semibold small text-muted mb-1">Correo Electrónico</label>
                        <div class="input-group input-group-sm">
                            <span class="input-group-text bg-light border-end-0"><i class="bi bi-envelope text-muted"></i></span>
                            <input name="email" type="email" class="form-control border-start-0 ps-0 bg-light" placeholder="contacto@empresa.com">
                        </div>
                    </div>
                    <div class="col-md-3 mt-2">
                        <label class="form-label fw-semibold small text-muted mb-1">Moneda</label>
                        <div class="input-group input-group-sm">
                            <span class="input-group-text bg-light border-end-0"><i class="bi bi-cash text-muted"></i></span>
                            <input name="moneda" class="form-control border-start-0 ps-0 bg-light" placeholder="$">
                        </div>
                    </div>
                    <div class="col-12">
                        <label class="form-label fw-semibold small text-muted mb-1">Logotipo de la Empresa</label>
                        <div class="d-flex align-items-center gap-3">
                            <div class="bg-light border rounded d-flex align-items-center justify-content-center overflow-hidden shadow-sm" style="width: 65px; height: 65px; flex-shrink: 0;">
                                <img id="logo_preview_img" src="img/ISOTIPO.PNG" style="max-width: 100%; max-height: 100%; object-fit: contain;">
                            </div>
                            <div class="flex-grow-1">
                                <input type="file" id="logo_file_input" class="form-control form-control-sm bg-light" accept="image/png, image/jpeg, image/jpg">
                                <input type="hidden" name="logo" id="logo_base64_input">
                                <div class="form-text small" style="color: var(--color-text-muted);">Selecciona una imagen (PNG/JPG). Se guardará al hacer clic en "Guardar".</div>
                            </div>
                        </div>
                    </div>
                    
                    <!-- Sección 4: Credenciales de Acceso -->
                    <div class="col-12 mb-1 mt-3">
                        <h6 class="fw-bold mb-2 mt-2" style="color: var(--color-danger); border-bottom: 2px solid var(--color-border); padding-bottom: 8px;">
                            <i class="bi bi-shield-lock me-2 text-secondary"></i>Credenciales de Acceso (Administrador)
                        </h6>
                    </div>
                    <div class="col-md-6 mt-2">
                        <label class="form-label fw-semibold small text-muted mb-1">Correo Electrónico (Login)</label>
                        <div class="input-group input-group-sm">
                            <span class="input-group-text bg-light border-end-0"><i class="bi bi-person text-muted"></i></span>
                            <input name="login_email" type="email" class="form-control border-start-0 ps-0 bg-light" placeholder="admin@empresa.com">
                        </div>
                        <div class="form-text small" style="color: var(--color-text-muted);">Correo para iniciar sesión.</div>
                    </div>
                    <div class="col-md-6 mt-2">
                        <label class="form-label fw-semibold small text-muted mb-1">Nueva Contraseña</label>
                        <div class="input-group input-group-sm">
                            <span class="input-group-text bg-light border-end-0"><i class="bi bi-key text-muted"></i></span>
                            <input name="login_password" type="password" class="form-control border-start-0 ps-0 bg-light" placeholder="Dejar en blanco para no cambiar">
                        </div>
                        <div class="form-text small" style="color: var(--color-text-muted);">Déjalo vacío si no deseas cambiarla.</div>
                    </div>
                </form>
            </div>
            <div class="modal-footer border-0 pt-0 pb-4 pe-4" style="background-color: var(--color-bg-app);">
                <button type="button" class="btn btn-light fw-bold px-4" data-bs-dismiss="modal" style="border: 1px solid var(--color-border); color: var(--color-text-muted); border-radius: 8px;">Cancelar</button>
                <button type="button" class="btn fw-bold px-4 text-white" id="btnGuardarEmpresa" style="background-color: var(--color-secondary); border: none; border-radius: 8px; box-shadow: 0 4px 6px rgba(0, 168, 150, 0.2); transition: all 0.2s;">
                    <i class="bi bi-save me-2"></i>Guardar Cambios
                </button>
            </div>
        </div>
    </div>
</div>
`;

document.addEventListener('DOMContentLoaded', () => {
    const contenedor = document.getElementById('appNavbar');
    if (contenedor) {
        contenedor.outerHTML = navbar;
        initEmpresaLogic();
    }
});

function initEmpresaLogic() {
    // Set current month/year
    const meses = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
    const fecha = new Date();
    const textoFecha = `${meses[fecha.getMonth()]} ${fecha.getFullYear()}`;
    const navFecha = document.getElementById('fechaMesActual');
    if (navFecha) navFecha.textContent = textoFecha;

    const idEmpresa = Number(localStorage.getItem('idEmpresa') || 1);
    const form = document.getElementById('empresaForm');
    const btnGuardar = document.getElementById('btnGuardarEmpresa');

    const mostrar = (texto, tipo) => {
        document.getElementById('mensajeEmpresa').innerHTML = `<div class="alert alert-${tipo} py-2 small">${texto}</div>`;
    };

    const updateEmpresaName = (name) => {
        const desktopEl = document.getElementById('navNombreEmpresa');
        const mobileEl = document.getElementById('navNombreEmpresaMobile');
        if (desktopEl) desktopEl.textContent = name;
        if (mobileEl) mobileEl.textContent = name;
    };

    const updateEmpresaLogo = (logoUrl) => {
        const logoEl = document.getElementById('navbarConfigLogo');
        if (logoEl) logoEl.src = logoUrl || 'img/ISOTIPO.PNG';
    };

    const renderPlantillaImpresion = (data) => {
        const printHeaderContainer = document.getElementById('printHeader');
        if (!printHeaderContainer) return;

        const existing = document.getElementById('companyPrintTemplate');
        if (existing) existing.remove();

        const oldPrintEmpresa = document.getElementById('printEmpresa');
        if (oldPrintEmpresa) oldPrintEmpresa.style.display = 'none';

        const companyInfoDiv = document.createElement('div');
        companyInfoDiv.id = 'companyPrintTemplate';
        companyInfoDiv.innerHTML = `
            <div style="display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 3px solid #1e3a8a; padding-bottom: 15px; margin-bottom: 20px;">
                <div style="flex: 0 0 200px; text-align: left;">
                    <img src="${data.logo || 'img/ISOTIPO.PNG'}" style="max-height: 80px; max-width: 100%; object-fit: contain;" alt="Logo Empresa">
                </div>
                <div style="flex: 1; text-align: center; padding: 0 15px;">
                    <h2 style="margin: 0; font-weight: 800; color: #1e3a8a; text-transform: uppercase; font-size: 24px;">${data.nombre_comercial || data.nombre_legal || 'Mi Empresa'}</h2>
                    ${data.giro_comercial ? `<p style="margin: 4px 0 0; font-size: 11pt; font-weight: bold; color: #334155;">${data.giro_comercial}</p>` : ''}
                    <p style="margin: 4px 0 0; font-size: 10pt; color: #475569;">
                        ${data.direccion || ''}
                    </p>
                    <p style="margin: 4px 0 0; font-size: 10pt; color: #475569;">
                        ${data.nrc ? '<strong>NRC:</strong> ' + data.nrc : ''}
                        ${data.nrc && data.nit ? ' &nbsp;|&nbsp; ' : ''}
                        ${data.nit ? '<strong>NIT:</strong> ' + data.nit : ''}
                    </p>
                    <p style="margin: 4px 0 0; font-size: 10pt; color: #475569;">
                        ${data.telefono ? '<strong>Tel:</strong> ' + data.telefono : ''}
                        ${data.telefono && data.email ? ' &nbsp;|&nbsp; ' : ''}
                        ${data.email ? data.email : ''}
                    </p>
                </div>
                <div style="flex: 0 0 200px;">
                    <!-- Espacio reservado para balance visual -->
                </div>
            </div>
        `;
        printHeaderContainer.prepend(companyInfoDiv);

        // --- PIE DE PÁGINA GLOBAL (CONTAFÁCIL) ---
        let printFooterContainer = document.getElementById('printFooter');
        if (!printFooterContainer) {
            printFooterContainer = document.createElement('div');
            printFooterContainer.id = 'printFooter';
            printFooterContainer.style.display = 'none'; // Oculto en pantalla, visible en print vía CSS

            // Buscar dónde anexarlo
            const zonaImpresion = document.getElementById('zonaImpresion');
            if (zonaImpresion) {
                zonaImpresion.appendChild(printFooterContainer);
            } else {
                const container = document.querySelector('.container, .container-fluid');
                if (container) container.appendChild(printFooterContainer);
                else document.body.appendChild(printFooterContainer);
            }
        }

        printFooterContainer.innerHTML = `
            <div style="border-top: 2px solid #0d9488; padding-top: 15px; margin-top: 40px; display: flex; justify-content: space-between; align-items: center; break-inside: avoid;">
                <div style="text-align: left;">
                    <p style="margin: 0; font-size: 10pt; color: #0f172a; font-weight: 600;">Generado automáticamente por ContaFácil</p>
                    <p style="margin: 0; font-size: 9pt; color: #64748b;">Sistema de Gestión Contable e Inventario &copy; ${new Date().getFullYear()}</p>
                </div>
                <div style="text-align: right;">
                    <img src="img/LOGOTIPO.png" style="height: 35px; filter: grayscale(100%); opacity: 0.8;" alt="ContaFácil">
                </div>
            </div>
        `;
    };

    async function cargarEmpresa() {
        try {
            const response = await fetch(`/api/empresa?idEmpresa=${idEmpresa}`);
            const data = await response.json();
            if (!response.ok) throw new Error(data.error || 'No se pudo cargar la empresa');

            updateEmpresaName(data.nombre_comercial || data.nombre_legal || 'Mi Empresa');
            updateEmpresaLogo(data.logo);

            Object.entries(data).forEach(([key, value]) => {
                if (key === 'logo') {
                    const base64Input = document.getElementById('logo_base64_input');
                    const previewImg = document.getElementById('logo_preview_img');
                    if (base64Input) base64Input.value = value || '';
                    if (previewImg) previewImg.src = value || 'img/ISOTIPO.PNG';
                } else {
                    const input = form.elements[key];
                    if (input) input.value = value || '';
                }
            });

            renderPlantillaImpresion(data);

        } catch (error) {
            console.error(error);
            updateEmpresaName('Mi Empresa');
        }
    }

    btnGuardar.addEventListener('click', async () => {
        if (!form.checkValidity()) {
            form.reportValidity();
            return;
        }

        btnGuardar.disabled = true;
        btnGuardar.innerHTML = '<span class="spinner-border spinner-border-sm"></span> Guardando...';

        const body = Object.fromEntries(new FormData(form).entries());
        try {
            const response = await fetch(`/api/empresa/${idEmpresa}`, {
                method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body)
            });
            const data = await response.json();
            if (response.ok) {
                mostrar('Configuración guardada correctamente.', 'success');
                updateEmpresaName(body.nombre_comercial || body.nombre_legal || 'Mi Empresa');
                updateEmpresaLogo(body.logo);
                renderPlantillaImpresion(body);

                setTimeout(() => {
                    const modalEl = document.getElementById('modalEmpresa');
                    const modal = bootstrap.Modal.getInstance(modalEl) || new bootstrap.Modal(modalEl);
                    modal.hide();
                    document.getElementById('mensajeEmpresa').innerHTML = '';
                }, 1000);
            } else {
                mostrar(data.error, 'danger');
            }
        } catch (error) {
            mostrar('Error de red al guardar.', 'danger');
        } finally {
            btnGuardar.disabled = false;
            btnGuardar.innerHTML = '<i class="bi bi-save me-2"></i>Guardar';
        }
    });

    cargarEmpresa();
}


document.addEventListener('DOMContentLoaded', () => {
    setTimeout(() => {
        const logoFileInput = document.getElementById('logo_file_input');
        const logoBase64Input = document.getElementById('logo_base64_input');
        const logoPreviewImg = document.getElementById('logo_preview_img');
        if (logoFileInput && logoBase64Input && logoPreviewImg) {
            logoFileInput.addEventListener('change', function(e) {
                const file = e.target.files[0];
                if (file) {
                    const reader = new FileReader();
                    reader.onload = function(event) {
                        const base64String = event.target.result;
                        logoBase64Input.value = base64String;
                        logoPreviewImg.src = base64String;
                    };
                    reader.readAsDataURL(file);
                }
            });
        }
    }, 500); // wait for navbar render
});
