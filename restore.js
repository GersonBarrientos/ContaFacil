const fs = require('fs');
let content = fs.readFileSync('public/js/navbar.js', 'utf8');

// 1. Add logout button
if (!content.includes('Cerrar Sesión')) {
    content = content.replace(/<a href="#" data-bs-toggle="modal" data-bs-target="#modalEmpresa"([\s\S]*?)<\/a>\s*<\/div>/, `<a href="#" data-bs-toggle="modal" data-bs-target="#modalEmpresa"$1</a>
                
                <button class="btn btn-outline-danger border-0 rounded-circle shadow-sm d-flex align-items-center justify-content-center ms-2" style="width: 40px; height: 40px;" onclick="window.location.href='index.html'; localStorage.removeItem('idEmpresa'); localStorage.removeItem('idUsuario');" title="Cerrar Sesión">
                    <i class="bi bi-box-arrow-right"></i>
                </button>
            </div>`);
}

// 2. Add credentials section
if (!content.includes('Credenciales de Acceso (Administrador)')) {
    content = content.replace(/<\/div>\s*<\/form>/, `</div>
                    
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
                </form>`);
}

fs.writeFileSync('public/js/navbar.js', content);
console.log('Restored navbar elements!');
