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
const mensajeGeneral = document.getElementById('mensaje-general');

/* -------------------------------------------------------------
VARIABLES GLOBALES
------------------------------------------------------------- */

const URL_BASE = 'https://cobaej-general-server.onrender.com/sicecobaej';
let ARQUETIPO = 'docente';

/* -------------------------------------------------------------
METODO PARA MOSTRAR MENSAJES ACCESIBLES EN LA INTERFAZ
------------------------------------------------------------- */

function mostrarMensaje(mensaje, tipo = 'info') {
    mensajeGeneral.textContent = mensaje;
    mensajeGeneral.className = `form-message ${tipo}`;
}

/* -------------------------------------------------------------
METODO PARA OCULTAR EL MENSAJE ACTUAL
------------------------------------------------------------- */

function ocultarMensaje() {
    mensajeGeneral.textContent = '';
    mensajeGeneral.className = 'form-message hidden';
}

/* -------------------------------------------------------------
METODO PARA LEER RESPUESTAS JSON DE LA API
------------------------------------------------------------- */

async function leerRespuesta(response) {
    try {
        return await response.json();
    } catch (error) {
        return {
            mensaje: 'El servidor devolvió una respuesta que no pudo interpretarse'
        };
    }
}

/* -------------------------------------------------------------
METODO PARA SELECCIONAR VISUALMENTE EL TIPO DE USUARIO
------------------------------------------------------------- */

function seleccionarTipo(boton) {
    const botones = boton.parentElement.querySelectorAll('.switch-btn');
    botones.forEach((elemento) => elemento.classList.remove('seleccionado'));
    boton.classList.add('seleccionado');
}

/* -------------------------------------------------------------
METODO PARA CAMBIAR EL TEMA DE LA INTERFAZ
------------------------------------------------------------- */

function alternarTema() {
    const htmlElement = document.documentElement;
    const temaActual = htmlElement.getAttribute('theme');

    if (temaActual === 'dark') {
        htmlElement.removeAttribute('theme');
        localStorage.setItem('theme', 'light');
    } else {
        htmlElement.setAttribute('theme', 'dark');
        localStorage.setItem('theme', 'dark');
    }
}

/* -------------------------------------------------------------
METODO PARA MOSTRAR LOS CAMPOS DE REGISTRO DEL TIPO ACTIVO
------------------------------------------------------------- */

function alternarModalRegistro() {
    document.querySelectorAll('#form-registro fieldset').forEach((fieldset) => {
        fieldset.disabled = true;
        fieldset.classList.add('hidden');
    });

    const fieldSetActivo = document.getElementById(`arquetipo-${ARQUETIPO}`);

    if (fieldSetActivo) {
        fieldSetActivo.disabled = false;
        fieldSetActivo.classList.remove('hidden');
    }
}

/* -------------------------------------------------------------
METODO PARA MOSTRAR LOS CAMPOS DE LOGIN DEL TIPO ACTIVO
------------------------------------------------------------- */

function alternarModalLogin() {
    document.querySelectorAll('#form-login fieldset').forEach((fieldset) => {
        fieldset.disabled = true;
        fieldset.classList.add('hidden');
    });

    const fieldSetActivo = document.getElementById(`arquetipoLogin-${ARQUETIPO}`);

    if (fieldSetActivo) {
        fieldSetActivo.disabled = false;
        fieldSetActivo.classList.remove('hidden');
    }
}

/* -------------------------------------------------------------
METODO PARA GUARDAR TEMPORALMENTE EL PROCESO DE VERIFICACION
------------------------------------------------------------- */

function guardarContextoVerificacion(resultado) {
    sessionStorage.setItem(
        'verificationToken',
        resultado.verificationToken
    );
    sessionStorage.setItem('verificationEmail', resultado.correo);
    sessionStorage.setItem('verificationType', resultado.tipo);
    sessionStorage.setItem(
        'verificationRetryAfter',
        String(resultado.retryAfter || 0)
    );
    sessionStorage.setItem(
        'verificationStoredAt',
        String(Date.now())
    );
}

/* -------------------------------------------------------------
METODO PARA AVISAR Y REDIRIGIR A UNA VERIFICACION PENDIENTE
------------------------------------------------------------- */

function redirigirAVerificacion(resultado) {
    guardarContextoVerificacion(resultado);
    mostrarMensaje(resultado.mensaje, 'warning');

    window.setTimeout(() => {
        window.location.href = './interfaces/verification.html';
    }, 1400);
}

/* -------------------------------------------------------------
METODO PARA GUARDAR LA SESION AUTENTICADA
------------------------------------------------------------- */

function guardarSesion(resultado) {
    localStorage.setItem('usuario', JSON.stringify(resultado.usuario));
    localStorage.setItem('tipo', resultado.tipo);
    localStorage.setItem('token', resultado.token);
}

/* -------------------------------------------------------------
METODO PARA CAMBIAR AL MODO DOCENTE
------------------------------------------------------------- */

function manejarSeleccionDocente(evento) {
    seleccionarTipo(evento.currentTarget);
    ARQUETIPO = 'docente';
    ocultarMensaje();
    alternarModalLogin();
    alternarModalRegistro();
}

/* -------------------------------------------------------------
METODO PARA CAMBIAR AL MODO ALUMNO
------------------------------------------------------------- */

function manejarSeleccionAlumno(evento) {
    seleccionarTipo(evento.currentTarget);
    ARQUETIPO = 'alumno';
    ocultarMensaje();
    alternarModalLogin();
    alternarModalRegistro();
}

/* -------------------------------------------------------------
METODO PARA MOSTRAR EL FORMULARIO DE REGISTRO
------------------------------------------------------------- */

function mostrarRegistro(evento) {
    evento.preventDefault();
    loginContenedor.classList.add('hidden');
    signContenedor.classList.remove('hidden');
    ocultarMensaje();
    alternarModalRegistro();
}

/* -------------------------------------------------------------
METODO PARA MOSTRAR EL FORMULARIO DE LOGIN
------------------------------------------------------------- */

function mostrarLogin(evento) {
    evento.preventDefault();
    signContenedor.classList.add('hidden');
    loginContenedor.classList.remove('hidden');
    ocultarMensaje();
    alternarModalLogin();
}

/* -------------------------------------------------------------
METODO PARA PROCESAR EL FORMULARIO DE LOGIN
------------------------------------------------------------- */

async function manejarLogin(evento) {
    evento.preventDefault();
    ocultarMensaje();

    btnLogin.disabled = true;
    const textoOriginal = btnLogin.textContent;
    btnLogin.textContent = 'Validando...';

    const datos = Object.fromEntries(new FormData(formLogin).entries());

    try {
        const response = await fetch(`${URL_BASE}/auth/login-${ARQUETIPO}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(datos)
        });
        const resultado = await leerRespuesta(response);

        if (response.status === 403 && resultado.verificationRequired) {
            redirigirAVerificacion(resultado);
            return;
        }

        if (!response.ok) {
            throw new Error(
                resultado.mensaje
                || `Error en la ruta /auth/login-${ARQUETIPO}`
            );
        }

        guardarSesion(resultado);
        window.location.href = './interfaces/dashboard.html';
    } catch (error) {
        console.error('Error en el login:\n', error.message);
        mostrarMensaje(error.message, 'error');
    } finally {
        btnLogin.textContent = textoOriginal;
        btnLogin.disabled = false;
    }
}

/* -------------------------------------------------------------
METODO PARA PROCESAR EL FORMULARIO DE REGISTRO
------------------------------------------------------------- */

async function manejarRegistro(evento) {
    evento.preventDefault();
    ocultarMensaje();

    btnRegistro.disabled = true;
    const textoOriginal = btnRegistro.textContent;
    btnRegistro.textContent = 'Creando cuenta...';

    const datos = Object.fromEntries(new FormData(formRegistro).entries());

    try {
        const response = await fetch(`${URL_BASE}/auth/signup-${ARQUETIPO}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(datos)
        });
        const resultado = await leerRespuesta(response);

        if (!response.ok) {
            throw new Error(
                resultado.mensaje
                || `Error en la ruta /auth/signup-${ARQUETIPO}`
            );
        }

        redirigirAVerificacion(resultado);
    } catch (error) {
        console.error('Error en el registro:\n', error.message);
        mostrarMensaje(error.message, 'error');
    } finally {
        btnRegistro.textContent = textoOriginal;
        btnRegistro.disabled = false;
    }
}

/* -------------------------------------------------------------
METODO PARA INICIALIZAR LA VISTA DE LOGIN
------------------------------------------------------------- */

function inicializarLogin() {
    alternarModalRegistro();
    alternarModalLogin();

    const avisoPendiente = sessionStorage.getItem('loginNotice');

    if (avisoPendiente) {
        mostrarMensaje(avisoPendiente, 'warning');
        sessionStorage.removeItem('loginNotice');
    }
}

switchDocente.addEventListener('click', manejarSeleccionDocente);
switchAlumno.addEventListener('click', manejarSeleccionAlumno);
themeBtn.addEventListener('click', alternarTema);
loginRef.addEventListener('click', mostrarRegistro);
signRef.addEventListener('click', mostrarLogin);
formLogin.addEventListener('submit', manejarLogin);
formRegistro.addEventListener('submit', manejarRegistro);
document.addEventListener('DOMContentLoaded', inicializarLogin);
