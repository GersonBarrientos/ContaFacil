const moduloActual = window.location.pathname.split('/').pop() || 'index.html';

const enlaces = [
    ['index.html', 'house-door', 'Inicio'],
    ['empresa.html', 'building', 'Empresa'],
    ['libros.html', 'journals', 'Libros'],
    ['libro-diario.html', 'journal-plus', 'Nuevo asiento'],
    ['historial-diario.html', 'journal-text', 'Historial'],
    ['mayorizacion.html', 'bar-chart-line', 'Mayorización']
];

const navbar = `
<nav class="navbar navbar-expand-lg navbar-dark bg-dark shadow-sm sticky-top">
    <div class="container-fluid px-3 px-lg-4">
        <a class="navbar-brand fw-bold d-flex align-items-center gap-2" href="index.html">
            <i class="bi bi-calculator"></i><span>ContaFácil</span>
        </a>
        <button class="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#menuPrincipal"
                aria-controls="menuPrincipal" aria-expanded="false" aria-label="Abrir navegación">
            <span class="navbar-toggler-icon"></span>
        </button>
        <div class="collapse navbar-collapse" id="menuPrincipal">
            <ul class="navbar-nav ms-auto mb-2 mb-lg-0 align-items-lg-center">
                ${enlaces.map(([href, icono, texto]) => `
                    <li class="nav-item">
                        <a class="nav-link px-3 ${href === moduloActual ? 'active fw-bold' : ''}"
                           ${href === moduloActual ? 'aria-current="page"' : ''} href="${href}">
                            <i class="bi bi-${icono} me-1"></i>${texto}
                        </a>
                    </li>`).join('')}
            </ul>
        </div>
    </div>
</nav>`;

document.addEventListener('DOMContentLoaded', () => {
    const contenedor = document.getElementById('appNavbar');
    if (contenedor) contenedor.outerHTML = navbar;
});
