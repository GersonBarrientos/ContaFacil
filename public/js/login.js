document.addEventListener('DOMContentLoaded', () => {
    // Si ya está logueado, redirigir al dashboard
    const empresaId = localStorage.getItem('empresa_id');
    if (empresaId) {
        window.location.href = '/dashboard.html';
        return;
    }

    const form = document.getElementById('loginForm');
    const alertBox = document.getElementById('loginAlert');
    const btnSubmit = document.getElementById('btnSubmit');

    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;

        // Estado de carga
        btnSubmit.disabled = true;
        btnSubmit.innerHTML = '<span class="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>Validando...';
        alertBox.classList.add('d-none');

        try {
            const response = await fetch('/api/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password })
            });

            const data = await response.json();

            if (response.ok) {
                // Guardar la sesión en localStorage
                localStorage.setItem('empresa_id', data.empresa_id);
                localStorage.setItem('idEmpresa', data.empresa_id); // Mantenemos retrocompatibilidad con el resto de la app
                localStorage.setItem('empresa_email', data.email);
                
                // Redirigir al sistema
                window.location.href = '/dashboard.html';
            } else {
                alertBox.textContent = data.error || 'Credenciales incorrectas';
                alertBox.classList.remove('d-none');
            }
        } catch (error) {
            alertBox.textContent = 'Error de conexión con el servidor.';
            alertBox.classList.remove('d-none');
        } finally {
            btnSubmit.disabled = false;
            btnSubmit.innerHTML = 'Ingresar al Sistema';
        }
    });

    const regForm = document.getElementById('registerForm');
    const regAlert = document.getElementById('registerAlert');
    const loginAlert = document.getElementById('loginAlert');
    const btnRegSubmit = document.getElementById('btnRegisterSubmit');

    if(regForm) {
        regForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const nombre_legal = document.getElementById('reg_nombre_legal').value;
            const email = document.getElementById('reg_email').value;
            const password = document.getElementById('reg_password').value;

            btnRegSubmit.disabled = true;
            btnRegSubmit.innerHTML = '<span class="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>Creando...';
            regAlert.classList.add('d-none');
            loginAlert.classList.add('d-none');

            try {
                const response = await fetch('/api/registro', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ nombre_legal, email, password })
                });

                const data = await response.json();

                if (response.ok) {
                    // Iniciar sesión automáticamente
                    localStorage.setItem('empresa_id', data.empresa_id);
                    localStorage.setItem('idEmpresa', data.empresa_id);
                    localStorage.setItem('empresa_email', data.email);
                    localStorage.setItem('is_new_registration', 'true'); // Flag para abrir modal
                    
                    window.location.href = '/dashboard.html';
                } else {
                    regAlert.classList.remove('alert-success');
                    regAlert.classList.add('alert-danger');
                    regAlert.textContent = data.error || 'Error al crear la empresa';
                    regAlert.classList.remove('d-none');
                }
            } catch (error) {
                regAlert.classList.remove('alert-success');
                regAlert.classList.add('alert-danger');
                regAlert.textContent = 'Error de conexión con el servidor.';
                regAlert.classList.remove('d-none');
            } finally {
                btnRegSubmit.disabled = false;
                btnRegSubmit.innerHTML = 'Crear Empresa y Entrar';
            }
        });
    }
});
