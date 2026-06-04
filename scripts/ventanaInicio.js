const btnIngresar = document.getElementById('btnIngresar');
const btnSalir = document.getElementById('btnSalir');
const btnCancelar = document.getElementById('btnSalirCancelar');
const btnConfirmar = document.getElementById('btnSalirConfirmar');

const blur = document.getElementById('blur')
const toast = document.getElementById('toast');

btnIngresar.addEventListener('click', () => {
    window.api.abrirNuevaVentana('seleccionUsuario.html');
});

btnSalir.addEventListener('click', () => {
    blur.classList.remove('hidden');
});

btnConfirmar.addEventListener('click', () => {
    window.api.cerrarPrograma();
});

btnCancelar.addEventListener('click', () => {
    blur.classList.add('hidden');
});