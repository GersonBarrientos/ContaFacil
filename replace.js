const fs = require('fs');
let content = fs.readFileSync('public/js/navbar.js', 'utf8');

// Update Logo function
content = content.replace(/const updateEmpresaLogo = \(logoUrl\) => \{[\s\S]*?\};/, `const updateEmpresaLogo = (logoUrl) => {
        const logoEl = document.getElementById('navbarConfigLogo');
        if (logoEl) logoEl.src = logoUrl || 'img/ISOTIPO.PNG';
    };`);

// Add top logo id
content = content.replace(/<img src="img\/ISOTIPO\.PNG" alt="Configuración"/, '<img id="navbarConfigLogo" src="img/ISOTIPO.PNG" alt="Configuración"');

// Load logic
content = content.replace(/Object\.entries\(data\)\.forEach\(\(\[key, value\]\) => \{[\s\S]*?const input = form\.elements\[key\];[\s\S]*?if \(input\) input\.value = value \|\| '';[\s\S]*?\}\);/, `Object.entries(data).forEach(([key, value]) => {
                if (key === 'logo') {
                    const base64Input = document.getElementById('logo_base64_input');
                    const previewImg = document.getElementById('logo_preview_img');
                    if (base64Input) base64Input.value = value || '';
                    if (previewImg) previewImg.src = value || 'img/ISOTIPO.PNG';
                } else {
                    const input = form.elements[key];
                    if (input) input.value = value || '';
                }
            });`);

// Append listener
if (!content.includes('logoFileInput.addEventListener')) {
content += `\n
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
`;
}
fs.writeFileSync('public/js/navbar.js', content);
