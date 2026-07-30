/* -------------------------------------------------------------
DEFINICION DE VARIABLES DEL DOM
------------------------------------------------------------- */

const themeBtn = document.getElementById('cambiador-tema');
const logoutBtn = document.getElementById('cerrar-sesion');
const editarBtn = document.getElementById('editar-perfil');
const cancelarBtn = document.getElementById('cancelar-edicion');
const formPerfil = document.getElementById('form-perfil');
const accionesEdicion = document.getElementById('acciones-edicion');
const selectorImagen = document.getElementById('selector-imagen');
const imagenInput = document.getElementById('imagen-input');
const imagenPerfil = document.getElementById('imagen-perfil');
const nombreInput = document.getElementById('nombre');
const correoInput = document.getElementById('correo');
const rolInput = document.getElementById('rol');
const horasInput = document.getElementById('horas-disponibles');
const fechaIngresoInput = document.getElementById('fecha-ingreso');
const campoHoras = document.getElementById('campo-horas');
const campoFechaIngreso = document.getElementById('campo-fecha-ingreso');
const saludoUsuario = document.getElementById('saludo-usuario');
const mensajePerfil = document.getElementById('mensaje-perfil');
const guardarBtn = document.getElementById('guardar-perfil');

/* -------------------------------------------------------------
VARIABLES GLOBALES
------------------------------------------------------------- */

const URL_BASE = 'https://cobaej-general-server.onrender.com/sicecobaej';
const IMAGEN_PREDETERMINADA = '../public/user-default-icon.png';
let perfilActual = null;
let urlVistaPrevia = null;

/* -------------------------------------------------------------
METODO PARA MOSTRAR MENSAJES EN LA VISTA DEL PERFIL
------------------------------------------------------------- */

function mostrarMensaje(mensaje, tipo = 'info') {
    mensajePerfil.textContent = mensaje;
    mensajePerfil.className = `profile-message ${tipo}`;
}

/* -------------------------------------------------------------
METODO PARA OCULTAR EL MENSAJE ACTUAL
------------------------------------------------------------- */

function ocultarMensaje() {
    mensajePerfil.textContent = '';
    mensajePerfil.className = 'profile-message hidden';
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
METODO PARA ACTUALIZAR EL ICONO DEL TEMA ACTUAL
------------------------------------------------------------- */

function actualizarIconoTema() {
    const icono = themeBtn.querySelector('i');
    const temaOscuro = document.documentElement.getAttribute('theme') === 'dark';
    icono.className = temaOscuro ? 'ri-sun-line' : 'ri-moon-line';
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

    actualizarIconoTema();
}

/* -------------------------------------------------------------
METODO PARA LIMPIAR LA SESION LOCAL
------------------------------------------------------------- */

function limpiarSesion() {
    localStorage.removeItem('token');
    localStorage.removeItem('usuario');
    localStorage.removeItem('tipo');
    localStorage.removeItem('id');
}

/* -------------------------------------------------------------
METODO PARA CERRAR LA SESION Y REGRESAR AL LOGIN
------------------------------------------------------------- */

function cerrarSesion() {
    limpiarSesion();
    window.location.href = '../login.html';
}

/* -------------------------------------------------------------
METODO PARA FORMATEAR UNA FECHA SIN CAMBIAR SU DIA POR ZONA HORARIA
------------------------------------------------------------- */

function formatearFecha(fecha) {
    if (!fecha) return 'Sin información';

    const partes = fecha.split('-');

    if (partes.length !== 3) return fecha;

    return `${partes[2]}/${partes[1]}/${partes[0]}`;
}

/* -------------------------------------------------------------
METODO PARA LIBERAR LA URL TEMPORAL DE UNA VISTA PREVIA
------------------------------------------------------------- */

function liberarVistaPrevia() {
    if (urlVistaPrevia) {
        URL.revokeObjectURL(urlVistaPrevia);
        urlVistaPrevia = null;
    }
}

/* -------------------------------------------------------------
METODO PARA MOSTRAR LOS DATOS DEL PERFIL EN LA INTERFAZ
------------------------------------------------------------- */

function renderizarPerfil(perfil) {
    perfilActual = perfil;
    liberarVistaPrevia();
    editarBtn.disabled = false;

    nombreInput.value = perfil.nombre || '';
    correoInput.value = perfil.correo || '';
    rolInput.value = perfil.tipo === 'docente' ? 'Docente' : 'Alumno';
    imagenPerfil.src = perfil.imagen || IMAGEN_PREDETERMINADA;
    saludoUsuario.textContent = `Hola, ${perfil.nombre}. Esta es la información de tu cuenta.`;

    const esDocente = perfil.tipo === 'docente';
    campoHoras.classList.toggle('hidden', !esDocente);
    horasInput.value = esDocente ? perfil.horas_disponibles ?? 0 : '';

    const esAlumno = perfil.tipo === 'alumno';
    campoFechaIngreso.classList.toggle('hidden', !esAlumno);
    fechaIngresoInput.value = esAlumno
        ? formatearFecha(perfil.fecha_ingreso)
        : '';

    imagenInput.value = '';
}

/* -------------------------------------------------------------
METODO PARA ACTIVAR EL MODO DE EDICION DEL PERFIL
------------------------------------------------------------- */

function activarEdicion() {
    if (!perfilActual) return;

    ocultarMensaje();
    nombreInput.disabled = false;

    if (perfilActual.tipo === 'docente') {
        horasInput.disabled = false;
    }

    selectorImagen.classList.remove('hidden');
    accionesEdicion.classList.remove('hidden');
    editarBtn.classList.add('hidden');
    nombreInput.focus();
}

/* -------------------------------------------------------------
METODO PARA DESACTIVAR EL MODO DE EDICION
------------------------------------------------------------- */

function desactivarEdicion() {
    nombreInput.disabled = true;
    horasInput.disabled = true;
    selectorImagen.classList.add('hidden');
    accionesEdicion.classList.add('hidden');
    editarBtn.classList.remove('hidden');
}

/* -------------------------------------------------------------
METODO PARA CANCELAR LOS CAMBIOS SIN GUARDARLOS
------------------------------------------------------------- */

function cancelarEdicion() {
    renderizarPerfil(perfilActual);
    desactivarEdicion();
    ocultarMensaje();
}

/* -------------------------------------------------------------
METODO PARA VALIDAR Y PREVISUALIZAR UNA NUEVA IMAGEN
------------------------------------------------------------- */

function manejarSeleccionImagen() {
    const archivo = imagenInput.files[0];

    if (!archivo) return;

    const formatosPermitidos = ['image/jpeg', 'image/png', 'image/webp'];

    if (!formatosPermitidos.includes(archivo.type)) {
        imagenInput.value = '';
        mostrarMensaje('Selecciona una imagen JPG, PNG o WEBP.', 'error');
        return;
    }

    if (archivo.size > 5 * 1024 * 1024) {
        imagenInput.value = '';
        mostrarMensaje('La imagen no puede superar los 5 MB.', 'error');
        return;
    }

    liberarVistaPrevia();
    urlVistaPrevia = URL.createObjectURL(archivo);
    imagenPerfil.src = urlVistaPrevia;
    ocultarMensaje();
}

/* -------------------------------------------------------------
METODO PARA CARGAR EL PERFIL AUTENTICADO DESDE LA API
------------------------------------------------------------- */

async function cargarPerfil() {
    const token = localStorage.getItem('token');

    if (!token) {
        cerrarSesion();
        return;
    }

    try {
        const response = await fetch(`${URL_BASE}/perfil/me`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        const resultado = await leerRespuesta(response);

        if (response.status === 401) {
            cerrarSesion();
            return;
        }

        if (!response.ok) {
            throw new Error(resultado.mensaje || 'No fue posible cargar el perfil');
        }

        renderizarPerfil(resultado.usuario);
        localStorage.setItem('usuario', JSON.stringify(resultado.usuario));
        localStorage.setItem('tipo', resultado.usuario.tipo);
    } catch (error) {
        console.error('Error al cargar el perfil:\n', error.message);
        mostrarMensaje(error.message, 'error');
    }
}

/* -------------------------------------------------------------
METODO PARA GUARDAR LOS CAMBIOS NO SENSIBLES DEL PERFIL
------------------------------------------------------------- */

async function guardarPerfil(evento) {
    evento.preventDefault();

    const token = localStorage.getItem('token');

    if (!token || !perfilActual) {
        cerrarSesion();
        return;
    }

    const datos = new FormData();
    datos.append('nombre', nombreInput.value.trim());

    if (perfilActual.tipo === 'docente') {
        datos.append('horas_disponibles', horasInput.value);
    }

    if (imagenInput.files[0]) {
        datos.append('imagen', imagenInput.files[0]);
    }

    guardarBtn.disabled = true;
    cancelarBtn.disabled = true;
    const textoOriginal = guardarBtn.innerHTML;
    guardarBtn.textContent = 'Guardando...';
    ocultarMensaje();

    try {
        const response = await fetch(`${URL_BASE}/perfil/me`, {
            method: 'PATCH',
            headers: {
                'Authorization': `Bearer ${token}`
            },
            body: datos
        });
        const resultado = await leerRespuesta(response);

        if (response.status === 401) {
            cerrarSesion();
            return;
        }

        if (!response.ok) {
            throw new Error(resultado.mensaje || 'No fue posible actualizar el perfil');
        }

        renderizarPerfil(resultado.usuario);
        desactivarEdicion();
        localStorage.setItem('usuario', JSON.stringify(resultado.usuario));
        mostrarMensaje(resultado.mensaje, 'success');
    } catch (error) {
        console.error('Error al guardar el perfil:\n', error.message);
        mostrarMensaje(error.message, 'error');
    } finally {
        guardarBtn.innerHTML = textoOriginal;
        guardarBtn.disabled = false;
        cancelarBtn.disabled = false;
    }
}

/* -------------------------------------------------------------
METODO PARA INICIALIZAR EL DASHBOARD EN LA VISTA DEL PERFIL
------------------------------------------------------------- */

function inicializarDashboard() {
    actualizarIconoTema();
    desactivarEdicion();
    cargarPerfil();
}

themeBtn.addEventListener('click', alternarTema);
logoutBtn.addEventListener('click', cerrarSesion);
editarBtn.addEventListener('click', activarEdicion);
cancelarBtn.addEventListener('click', cancelarEdicion);
imagenInput.addEventListener('change', manejarSeleccionImagen);
formPerfil.addEventListener('submit', guardarPerfil);
document.addEventListener('DOMContentLoaded', inicializarDashboard);
