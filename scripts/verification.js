/* -------------------------------------------------------------
DEFINICION DE VARIABLES DEL DOM
------------------------------------------------------------- */

const themeBtn = document.getElementById('cambiador-tema');
const formVerificacion = document.getElementById('form-verificacion');
const btnVerificacion = document.getElementById('verificacion-btn');
const btnReenviar = document.getElementById('reenviar-codigo');
const contador = document.getElementById('contador');
const mensajeVerificacion = document.getElementById('mensaje-verificacion');
const destinoVerificacion = document.getElementById('destino-verificacion');
const modalExito = document.getElementById('verificacion-exito');
const inputsCodigo = Array.from(document.querySelectorAll('.code-number'));

/* -------------------------------------------------------------
VARIABLES GLOBALES
------------------------------------------------------------- */

const URL_BASE = 'https://cobaej-general-server.onrender.com/sicecobaej';
let intervaloContador = null;

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
METODO PARA MOSTRAR MENSAJES DEL PROCESO DE VERIFICACION
------------------------------------------------------------- */

function mostrarMensaje(mensaje, tipo = 'info') {
    mensajeVerificacion.textContent = mensaje;
    mensajeVerificacion.className = `verification-message ${tipo}`;
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
METODO PARA OBTENER EL TOKEN TEMPORAL DE VERIFICACION
------------------------------------------------------------- */

function obtenerTokenVerificacion() {
    return sessionStorage.getItem('verificationToken');
}

/* -------------------------------------------------------------
METODO PARA LIMPIAR EL CONTEXTO TEMPORAL DE VERIFICACION
------------------------------------------------------------- */

function limpiarContextoVerificacion() {
    sessionStorage.removeItem('verificationToken');
    sessionStorage.removeItem('verificationEmail');
    sessionStorage.removeItem('verificationType');
    sessionStorage.removeItem('verificationRetryAfter');
    sessionStorage.removeItem('verificationStoredAt');
}

/* -------------------------------------------------------------
METODO PARA REGRESAR AL LOGIN CON UN AVISO
------------------------------------------------------------- */

function regresarAlLogin(mensaje) {
    limpiarContextoVerificacion();
    sessionStorage.setItem('loginNotice', mensaje);
    window.location.href = '../login.html';
}

/* -------------------------------------------------------------
METODO PARA GUARDAR EL COOLDOWN DEVUELTO POR EL SERVIDOR
------------------------------------------------------------- */

function guardarCooldown(retryAfter) {
    sessionStorage.setItem(
        'verificationRetryAfter',
        String(Math.max(0, Number(retryAfter) || 0))
    );
    sessionStorage.setItem('verificationStoredAt', String(Date.now()));
}

/* -------------------------------------------------------------
METODO PARA CALCULAR LOS SEGUNDOS RESTANTES DEL COOLDOWN
------------------------------------------------------------- */

function obtenerSegundosRestantes() {
    const retryAfter = Number(
        sessionStorage.getItem('verificationRetryAfter') || 0
    );
    const almacenadoEn = Number(
        sessionStorage.getItem('verificationStoredAt') || Date.now()
    );
    const transcurridos = Math.floor((Date.now() - almacenadoEn) / 1000);

    return Math.max(0, retryAfter - transcurridos);
}

/* -------------------------------------------------------------
METODO PARA FORMATEAR EL CONTADOR EN MINUTOS Y SEGUNDOS
------------------------------------------------------------- */

function formatearTiempo(segundosTotales) {
    const minutos = Math.floor(segundosTotales / 60);
    const segundos = segundosTotales % 60;
    return `${String(minutos).padStart(2, '0')}:${String(segundos).padStart(2, '0')}`;
}

/* -------------------------------------------------------------
METODO PARA ACTUALIZAR EL ESTADO DEL BOTON DE REENVIO
------------------------------------------------------------- */

function actualizarContador() {
    const segundosRestantes = obtenerSegundosRestantes();

    if (segundosRestantes > 0) {
        btnReenviar.disabled = true;
        contador.textContent = `Disponible en ${formatearTiempo(segundosRestantes)}`;
        contador.classList.remove('hidden');
        return;
    }

    btnReenviar.disabled = false;
    contador.classList.add('hidden');

    if (intervaloContador) {
        window.clearInterval(intervaloContador);
        intervaloContador = null;
    }
}

/* -------------------------------------------------------------
METODO PARA INICIAR EL CONTADOR DEL COOLDOWN
------------------------------------------------------------- */

function iniciarContador() {
    if (intervaloContador) {
        window.clearInterval(intervaloContador);
    }

    actualizarContador();

    if (obtenerSegundosRestantes() > 0) {
        intervaloContador = window.setInterval(actualizarContador, 1000);
    }
}

/* -------------------------------------------------------------
METODO PARA LIMITAR CADA CASILLA A UN DIGITO Y AVANZAR EL FOCO
------------------------------------------------------------- */

function manejarEntradaCodigo(evento) {
    const input = evento.currentTarget;
    input.value = input.value.replace(/\D/g, '').slice(-1);

    if (input.value) {
        const indice = inputsCodigo.indexOf(input);
        const siguiente = inputsCodigo[indice + 1];

        if (siguiente) {
            siguiente.focus();
        }
    }
}

/* -------------------------------------------------------------
METODO PARA RETROCEDER EL FOCO AL BORRAR UNA CASILLA VACIA
------------------------------------------------------------- */

function manejarTeclaCodigo(evento) {
    const input = evento.currentTarget;

    if (evento.key === 'Backspace' && !input.value) {
        const indice = inputsCodigo.indexOf(input);
        const anterior = inputsCodigo[indice - 1];

        if (anterior) {
            anterior.focus();
        }
    }
}

/* -------------------------------------------------------------
METODO PARA DISTRIBUIR UN CODIGO PEGADO ENTRE LAS SEIS CASILLAS
------------------------------------------------------------- */

function manejarPegadoCodigo(evento) {
    const digitos = evento.clipboardData
        .getData('text')
        .replace(/\D/g, '')
        .slice(0, 6);

    if (!digitos) return;

    evento.preventDefault();
    inputsCodigo.forEach((input, indice) => {
        input.value = digitos[indice] || '';
    });

    const ultimoIndice = Math.min(digitos.length, inputsCodigo.length) - 1;
    inputsCodigo[Math.max(ultimoIndice, 0)].focus();
}

/* -------------------------------------------------------------
METODO PARA OBTENER EL CODIGO COMPLETO INGRESADO
------------------------------------------------------------- */

function obtenerCodigoCompleto() {
    return inputsCodigo.map((input) => input.value.trim()).join('');
}

/* -------------------------------------------------------------
METODO PARA GUARDAR LA SESION DESPUES DE VERIFICAR LA CUENTA
------------------------------------------------------------- */

function guardarSesion(resultado) {
    localStorage.setItem('usuario', JSON.stringify(resultado.usuario));
    localStorage.setItem('tipo', resultado.tipo);
    localStorage.setItem('token', resultado.token);
}

/* -------------------------------------------------------------
METODO PARA PROCESAR LA VERIFICACION DEL CODIGO
------------------------------------------------------------- */

async function manejarVerificacion(evento) {
    evento.preventDefault();

    const codigo = obtenerCodigoCompleto();
    const verificationToken = obtenerTokenVerificacion();

    if (!/^\d{6}$/.test(codigo)) {
        mostrarMensaje('Ingresa los seis dígitos del código.', 'error');
        return;
    }

    if (!verificationToken) {
        regresarAlLogin('Inicia sesión nuevamente para continuar la verificación.');
        return;
    }

    btnVerificacion.disabled = true;
    const textoOriginal = btnVerificacion.textContent;
    btnVerificacion.textContent = 'Verificando...';

    try {
        const response = await fetch(`${URL_BASE}/auth/verificar-codigo`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${verificationToken}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ codigo })
        });
        const resultado = await leerRespuesta(response);

        if (response.status === 401) {
            regresarAlLogin(resultado.mensaje);
            return;
        }

        if (!response.ok) {
            if (resultado.retryAfter !== undefined) {
                guardarCooldown(resultado.retryAfter);
                iniciarContador();
            }

            throw new Error(resultado.mensaje || 'No fue posible verificar el código');
        }

        guardarSesion(resultado);
        limpiarContextoVerificacion();
        modalExito.classList.remove('hidden');

        window.setTimeout(() => {
            window.location.href = './dashboard.html';
        }, 2500);
    } catch (error) {
        console.error('Error en la verificación:\n', error.message);
        mostrarMensaje(error.message, 'error');
    } finally {
        btnVerificacion.textContent = textoOriginal;
        btnVerificacion.disabled = false;
    }
}

/* -------------------------------------------------------------
METODO PARA SOLICITAR EL REENVIO DEL CODIGO
------------------------------------------------------------- */

async function manejarReenvio() {
    const verificationToken = obtenerTokenVerificacion();

    if (!verificationToken) {
        regresarAlLogin('Inicia sesión nuevamente para solicitar otro código.');
        return;
    }

    btnReenviar.disabled = true;
    const textoOriginal = btnReenviar.textContent;
    btnReenviar.textContent = 'Enviando...';

    try {
        const response = await fetch(`${URL_BASE}/auth/reenviar-codigo`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${verificationToken}`
            }
        });
        const resultado = await leerRespuesta(response);

        if (response.status === 401) {
            regresarAlLogin(resultado.mensaje);
            return;
        }

        if (resultado.retryAfter !== undefined) {
            guardarCooldown(resultado.retryAfter);
            iniciarContador();
        }

        if (!response.ok) {
            throw new Error(resultado.mensaje || 'No fue posible reenviar el código');
        }

        inputsCodigo.forEach((input) => {
            input.value = '';
        });
        inputsCodigo[0].focus();
        mostrarMensaje(resultado.mensaje, 'success');
    } catch (error) {
        console.error('Error en el reenvío:\n', error.message);
        mostrarMensaje(error.message, 'error');
    } finally {
        btnReenviar.textContent = textoOriginal;
        actualizarContador();
    }
}

/* -------------------------------------------------------------
METODO PARA INICIALIZAR LA PANTALLA DE VERIFICACION
------------------------------------------------------------- */

function inicializarVerificacion() {
    const verificationToken = obtenerTokenVerificacion();
    const correo = sessionStorage.getItem('verificationEmail');

    if (!verificationToken) {
        regresarAlLogin('No existe una verificación pendiente. Inicia sesión para continuar.');
        return;
    }

    destinoVerificacion.textContent = correo
        ? `Enviamos el código a ${correo}`
        : 'Revisa el correo asociado a tu cuenta';

    inputsCodigo.forEach((input) => {
        input.addEventListener('input', manejarEntradaCodigo);
        input.addEventListener('keydown', manejarTeclaCodigo);
        input.addEventListener('paste', manejarPegadoCodigo);
    });

    iniciarContador();
    inputsCodigo[0].focus();
}

themeBtn.addEventListener('click', alternarTema);
formVerificacion.addEventListener('submit', manejarVerificacion);
btnReenviar.addEventListener('click', manejarReenvio);
document.addEventListener('DOMContentLoaded', inicializarVerificacion);
