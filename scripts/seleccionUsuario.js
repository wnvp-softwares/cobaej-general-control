const btnSalir = document.getElementById('btnSalir');
const btnCancelar = document.getElementById('btnSalirCancelar');
const btnConfirmar = document.getElementById('btnSalirConfirmar');


const blur = document.getElementById('blur');
const toast = document.getElementById('toast');

btnSalir.addEventListener('click', () => {
    blur.classList.remove('hidden');
});

btnCancelar.addEventListener('click', () => {
    blur.classList.add('hidden')
});

btnConfirmar.addEventListener('click', () => {
    window.api.abrirNuevaVentana('ventanaInicio.html')
});