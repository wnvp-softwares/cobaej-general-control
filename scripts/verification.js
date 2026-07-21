/* -------------------------------------------------------------
DEFINICION DE VARIABLES DEL DOM
------------------------------------------------------------- */
const themeBtn = document.getElementById('cambiador-tema');

const formVerificacion = document.getElementById('form-verificacion');
const btnVerificacion = document.getElementById('verificacion-btn');

const modalExito = document.getElementById('verificacion-exito');

/* -------------------------------------------------------------
VARIABLE GLOBAL
------------------------------------------------------------- */
const URL_BASE = 'https://cobaej-general-server.onrender.com/sicecobaej'

/* -------------------------------------------------------------
FUNCIONES GENERALES
------------------------------------------------------------- */

/* -------------------------------------------------------------
CAMBIAR TEMA
------------------------------------------------------------- */
function alternarTema() {
    const htmlElement = document.documentElement;
    const temaActual = htmlElement.getAttribute('theme')

    if (temaActual === 'dark') {
        htmlElement.removeAttribute('theme');
        localStorage.setItem('theme', 'light');
    } else {
        htmlElement.setAttribute('theme', 'dark');
        localStorage.setItem('theme', 'dark');
    }
}

themeBtn.addEventListener('click', alternarTema);

/* -------------------------------------------------------------
CAMBIO DE FOCUS AUTOMATICO
------------------------------------------------------------- */
const inputAuto = document.querySelectorAll('.code-number');

inputAuto.forEach(input => {
    input.addEventListener('input', (e) => {
        const actual = e.currentTarget;
        const maximo = parseInt(actual.getAttribute('maxlength'));
        const longitudActual = actual.value.length;

        if (longitudActual >= maximo) {
            const siguiente = actual.nextElementSibling;

            if (siguiente) {
                siguiente.focus();
            }
        }
    });

    input.addEventListener('keydown', (e) => {
        const actual = e.currentTarget;

        if (e.key === 'Backspace' && actual.value.length === 0) {
            const anterior = actual.previousElementSibling;

            if (anterior) {
                anterior.focus();
            }
        }
    });
});

/* -------------------------------------------------------------
LANZAR FORM DE VERIFICACION
------------------------------------------------------------- */
formVerificacion.addEventListener('submit', async (e) => {
    e.preventDefault();

    btnVerificacion.disabled = true;
    const originalBtnTxt = btnVerificacion.textContent;
    btnVerificacion.textContent = 'Cargando...';

    let codigo = '';

    inputAuto.forEach(input => {
        codigo += input.value.trim();
    });

    if (codigo.length < 6) {
        alert('Código incompleto!\nIngresa el código real');
        return;
    }

    const correo = localStorage.getItem('correo');
    const tipo = localStorage.getItem('tipo');

    const datos = { correo: correo, tipo: tipo, codigo: codigo };

    try {
        const response = await fetch(`${URL_BASE}/auth/verificar-codigo`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(datos)
        });

        const resultado = await response.json();

        if (!response.ok) {
            throw new Error(resultado.mensaje || 'Error en el servidor\nAPI auth/verificar-codigo');
        }

        localStorage.setItem('usuario', JSON.stringify(resultado.usuario));
        localStorage.setItem('token', resultado.token);

        // Limpiamos datos innecesarios del localStorage
        localStorage.removeItem('correo');

        modalExito.classList.remove('hidden');

        setTimeout(() => {
            window.location.href = '../interfaces/dashboard.html';
        }, 3500);
    } catch (error) {
        console.error('Error en la verificacion:\n', error.message);
        alert(error.message);

        btnVerificacion.textContent = originalBtnTxt;
        btnVerificacion.disabled = false;
    }
});

/* -------------------------------------------------------------
CARGA DEL DOM
------------------------------------------------------------- */
document.addEventListener('DOMContentLoaded', () => {
});
