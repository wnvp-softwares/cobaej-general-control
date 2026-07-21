/* -------------------------------------------------------------
DEFINICION DE VARIABLES DEL DOM
------------------------------------------------------------- */
const switchDocente = document.getElementById('docente-mode');
const switchAlumno = document.getElementById('alumno-mode');

const themeBtn = document.getElementById('cambiador-tema');

const loginContenedor = document.getElementById('login-div');
const signContenedor = document.getElementById('sign-div');
const loginRef = document.getElementById('login-ref');
const signRef = document.getElementById('sign-ref');

const formLogin = document.getElementById('form-login');
const btnLogin = document.getElementById('login-submit');

const formRegistro = document.getElementById('form-registro');
const btnRegistro = document.getElementById('registro-submit');


/* -------------------------------------------------------------
VARIABLE GLOBAL
------------------------------------------------------------- */

const URL_BASE = 'https://cobaej-general-server.onrender.com/sicecobaej'
let ARQUETIPO = 'docente';

/* -------------------------------------------------------------
FUNCIONES GENERALES
------------------------------------------------------------- */

/* -------------------------------------------------------------
ALTERNAR ARQUETIPO DE PERFIL
------------------------------------------------------------- */
function seleccionarTipo(boton) {
    const botones = boton.parentElement.querySelectorAll('.switch-btn');
    botones.forEach(b => b.classList.remove('seleccionado'));

    boton.classList.add('seleccionado');
}

switchDocente.addEventListener('click', (e) => {
    seleccionarTipo(e.currentTarget);
    ARQUETIPO = 'docente';

    alternarModalLogin();
    alternarModalRegistro();
});

switchAlumno.addEventListener('click', (e) => {
    seleccionarTipo(e.currentTarget);
    ARQUETIPO = 'alumno';

    alternarModalLogin();
    alternarModalRegistro();
});

/* -------------------------------------------------------------
ALTERNAR ARQUETIPO DE REGISTRO
------------------------------------------------------------- */
loginRef.addEventListener('click', () => {
    loginContenedor.classList.add('hidden');
    signContenedor.classList.remove('hidden');

    alternarModalRegistro();
});

signRef.addEventListener('click', () => {
    signContenedor.classList.add('hidden');
    loginContenedor.classList.remove('hidden');

    alternarModalLogin();
});

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
ALTERNAR MODAL
------------------------------------------------------------- */
function alternarModalRegistro() {
    document.querySelectorAll('#form-registro fieldset').forEach(fs => {
        fs.disabled = true;
        fs.classList.add('hidden');
    });

    const fieldSetActivo = document.getElementById(`arquetipo-${ARQUETIPO}`);
    if (fieldSetActivo) {
        fieldSetActivo.disabled = false;
        fieldSetActivo.classList.remove('hidden');
    }
}

function alternarModalLogin() {
    document.querySelectorAll('#form-login fieldset').forEach(fs => {
        fs.disabled = true;
        fs.classList.add('hidden');
    });

    const fieldSetActivo = document.getElementById(`arquetipoLogin-${ARQUETIPO}`);
    if (fieldSetActivo) {
        fieldSetActivo.disabled = false;
        fieldSetActivo.classList.remove('hidden');
    }
}

/* -------------------------------------------------------------
LANZAR FORMS
------------------------------------------------------------- */
formLogin.addEventListener('submit', async (e) => {
    e.preventDefault();

    btnLogin.disabled = true;
    const originalBtnTxt = btnLogin.textContent;
    btnLogin.textContent = 'Cargando...';

    const datosForm = new FormData(formLogin);
    const datos = Object.fromEntries(datosForm.entries());

    try {
        const response = await fetch(`${URL_BASE}/auth/login-${ARQUETIPO}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(datos)
        });

        const resultado = await response.json();

        if (!response.ok) {
            throw new Error(resultado.mensaje || `Error en el servidor\nAPI /auth/login-${ARQUETIPO}`);
        }

        localStorage.setItem('usuario', JSON.stringify(resultado.usuario));
        localStorage.setItem('tipo', resultado.tipo);
        localStorage.setItem('token', resultado.token);

        window.location.href = '../interfaces/dashboard.html';

    } catch (error) {
        console.error('Error en el login:\n', error.message);
        alert(error.message);
    } finally {
        btnLogin.textContent = originalBtnTxt;
        btnLogin.disabled = false;
    }
});

formRegistro.addEventListener('submit', async (e) => {
    e.preventDefault();

    btnRegistro.disabled = true;
    const originalBtnTxt = btnRegistro.textContent;
    btnRegistro.textContent = 'Cargando...';

    const datosForm = new FormData(formRegistro);
    const datos = Object.fromEntries(datosForm.entries());

    try {
        const response = await fetch(`${URL_BASE}/auth/signup-${ARQUETIPO}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(datos)
        });

        const resultado = await response.json();

        if (!response.ok) {
            throw new Error(resultado.mensaje || `Error en el servidor\nAPI /auth/registro-${ARQUETIPO}`);
        }

        localStorage.setItem('correo', resultado.correo);
        localStorage.setItem('tipo', resultado.tipo);

        window.location.href = '../interfaces/verification.html';

    } catch (error) {
        console.error('Error en el registro:\n', error.message);
        alert(error.message);
    } finally {
        btnRegistro.textContent = originalBtnTxt;
        btnRegistro.disabled = false;
    }
});

/* -------------------------------------------------------------
CARGA DEL DOM
------------------------------------------------------------- */
document.addEventListener('DOMContentLoaded', () => {
    alternarModalRegistro();
    alternarModalLogin();
});