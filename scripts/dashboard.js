/* -------------------------------------------------------------
DEFINICION DE VARIABLES DEL DOM
------------------------------------------------------------- */

const themeBtn = document.getElementById('cambiador-tema');
const logoutBtn = document.getElementById('cerrar-sesion');
const botonesNavegacion = Array.from(document.querySelectorAll('[data-vista]'));
const seccionesVista = Array.from(document.querySelectorAll('.view-section'));

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
const cicloIngresoInput = document.getElementById('ciclo-ingreso');
const semestreActualInput = document.getElementById('semestre-actual');
const grupoActualInput = document.getElementById('grupo-actual');
const campoHoras = document.getElementById('campo-horas');
const campoCicloIngreso = document.getElementById('campo-ciclo-ingreso');
const campoSemestreActual = document.getElementById('campo-semestre-actual');
const campoGrupoActual = document.getElementById('campo-grupo-actual');
const saludoUsuario = document.getElementById('saludo-usuario');
const mensajePerfil = document.getElementById('mensaje-perfil');
const guardarBtn = document.getElementById('guardar-perfil');

const tablaDocentes = document.getElementById('tabla-docentes');
const tablaMaterias = document.getElementById('tabla-materias');
const tablaAlumnos = document.getElementById('tabla-alumnos');
const mensajeDocentes = document.getElementById('mensaje-docentes');
const mensajeMaterias = document.getElementById('mensaje-materias');
const mensajeAlumnos = document.getElementById('mensaje-alumnos');
const privacidadAlumnos = document.getElementById('descripcion-privacidad-alumnos');
const paginacionDocentes = document.getElementById('paginacion-docentes');
const paginacionMaterias = document.getElementById('paginacion-materias');
const paginacionAlumnos = document.getElementById('paginacion-alumnos');

const nuevaMateriaBtn = document.getElementById('nueva-materia');
const encabezadoAccionesMateria = document.getElementById('encabezado-acciones-materia');
const formMateria = document.getElementById('form-materia');
const editorMateriaTitle = document.getElementById('editor-materia-title');
const materiaNombreInput = document.getElementById('materia-nombre');
const materiaSemestreInput = document.getElementById('materia-semestre');
const materiaHorasInput = document.getElementById('materia-horas');
const docentesMateria = document.getElementById('docentes-materia');
const cancelarMateriaBtn = document.getElementById('cancelar-materia');
const descartarMateriaBtn = document.getElementById('descartar-materia');
const guardarMateriaBtn = document.getElementById('guardar-materia');

const modalConfiguracion = document.getElementById('modal-configuracion');
const formConfiguracion = document.getElementById('form-configuracion');
const periodoIngresoSelect = document.getElementById('periodo-ingreso');
const semestreCalculadoInput = document.getElementById('semestre-calculado');
const grupoSeleccionadoSelect = document.getElementById('grupo-seleccionado');
const mensajeConfiguracion = document.getElementById('mensaje-configuracion');
const guardarConfiguracionBtn = document.getElementById('guardar-configuracion');
const salirConfiguracionBtn = document.getElementById('salir-configuracion');
const modalPerfilDirectorio = document.getElementById('modal-perfil-directorio');
const perfilDirectorioImagen = document.getElementById('perfil-directorio-imagen');
const perfilDirectorioNombre = document.getElementById('perfil-directorio-nombre');
const perfilDirectorioRol = document.getElementById('perfil-directorio-rol');
const perfilDirectorioDatos = document.getElementById('perfil-directorio-datos');
const mensajePerfilDirectorio = document.getElementById('mensaje-perfil-directorio');
const controlesCerrarPerfilDirectorio = Array.from(
    document.querySelectorAll('[data-cerrar-perfil-directorio]')
);

/* -------------------------------------------------------------
VARIABLES GLOBALES
------------------------------------------------------------- */

const URL_BASE = 'https://cobaej-general-server.onrender.com/sicecobaej';
const IMAGEN_PREDETERMINADA = '../public/user-default-icon.png';
const LIMITE_POR_PAGINA = 10;
const paginas = {
    docentes: 1,
    materias: 1,
    alumnos: 1
};

let perfilActual = null;
let urlVistaPrevia = null;
let materiasActuales = [];
let docentesDisponibles = null;
let materiaEditandoId = null;
let opcionesConfiguracion = null;

/* -------------------------------------------------------------
METODO PARA MOSTRAR UN MENSAJE EN UN CONTENEDOR
------------------------------------------------------------- */

function mostrarMensaje(contenedor, mensaje, tipo = 'info') {
    contenedor.textContent = mensaje;
    contenedor.className = `app-message ${tipo}`;
}

/* -------------------------------------------------------------
METODO PARA OCULTAR EL MENSAJE DE UN CONTENEDOR
------------------------------------------------------------- */

function ocultarMensaje(contenedor) {
    contenedor.textContent = '';
    contenedor.className = 'app-message hidden';
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
METODO PARA REALIZAR UNA PETICION AUTENTICADA A LA API
------------------------------------------------------------- */

async function solicitarApi(ruta, opciones = {}) {
    const token = localStorage.getItem('token');

    if (!token) {
        cerrarSesion();
        throw new Error('No existe una sesión activa');
    }

    const headers = {
        ...(opciones.headers || {}),
        'Authorization': `Bearer ${token}`
    };
    const response = await fetch(`${URL_BASE}${ruta}`, {
        ...opciones,
        headers
    });
    const resultado = await leerRespuesta(response);

    if (response.status === 401) {
        cerrarSesion();
        throw new Error(resultado.mensaje || 'La sesión expiró');
    }

    return { response, resultado };
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
METODO PARA LIBERAR LA URL TEMPORAL DE UNA VISTA PREVIA
------------------------------------------------------------- */

function liberarVistaPrevia() {
    if (urlVistaPrevia) {
        URL.revokeObjectURL(urlVistaPrevia);
        urlVistaPrevia = null;
    }
}

/* -------------------------------------------------------------
METODO PARA CONVERTIR EL NUMERO DE SEMESTRE EN UNA ETIQUETA
------------------------------------------------------------- */

function formatearSemestre(semestre) {
    const nombres = {
        1: 'Primer semestre',
        2: 'Segundo semestre',
        3: 'Tercer semestre',
        4: 'Cuarto semestre',
        5: 'Quinto semestre',
        6: 'Sexto semestre'
    };

    return nombres[Number(semestre)] || 'Pendiente';
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
    campoCicloIngreso.classList.toggle('hidden', !esAlumno);
    campoSemestreActual.classList.toggle('hidden', !esAlumno);
    campoGrupoActual.classList.toggle('hidden', !esAlumno);
    cicloIngresoInput.value = esAlumno
        ? perfil.ciclo_ingreso || 'Pendiente'
        : '';
    semestreActualInput.value = esAlumno
        ? formatearSemestre(perfil.semestre_actual)
        : '';
    grupoActualInput.value = esAlumno
        ? perfil.grupo_actual || 'Pendiente'
        : '';

    nuevaMateriaBtn.classList.toggle('hidden', !esDocente);
    encabezadoAccionesMateria.classList.toggle('hidden', !esDocente);
    privacidadAlumnos.textContent = esDocente
        ? 'Alumnos registrados con sus datos académicos de identificación.'
        : 'Por privacidad, el correo y parte del número de control de otros alumnos permanecen ocultos.';

    imagenInput.value = '';
    document.dispatchEvent(new CustomEvent('perfil-cargado', { detail: perfil }));
}

/* -------------------------------------------------------------
METODO PARA ACTIVAR EL MODO DE EDICION DEL PERFIL
------------------------------------------------------------- */

function activarEdicion() {
    if (!perfilActual) return;

    ocultarMensaje(mensajePerfil);
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
METODO PARA CANCELAR LOS CAMBIOS DEL PERFIL
------------------------------------------------------------- */

function cancelarEdicion() {
    renderizarPerfil(perfilActual);
    desactivarEdicion();
    ocultarMensaje(mensajePerfil);
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
        mostrarMensaje(
            mensajePerfil,
            'Selecciona una imagen JPG, PNG o WEBP.',
            'error'
        );
        return;
    }

    if (archivo.size > 5 * 1024 * 1024) {
        imagenInput.value = '';
        mostrarMensaje(
            mensajePerfil,
            'La imagen no puede superar los 5 MB.',
            'error'
        );
        return;
    }

    liberarVistaPrevia();
    urlVistaPrevia = URL.createObjectURL(archivo);
    imagenPerfil.src = urlVistaPrevia;
    ocultarMensaje(mensajePerfil);
}

/* -------------------------------------------------------------
METODO PARA CARGAR EL PERFIL AUTENTICADO DESDE LA API
------------------------------------------------------------- */

async function cargarPerfil() {
    try {
        const { response, resultado } = await solicitarApi('/perfil/me');

        if (!response.ok) {
            throw new Error(resultado.mensaje || 'No fue posible cargar el perfil');
        }

        renderizarPerfil(resultado.usuario);
        localStorage.setItem('usuario', JSON.stringify(resultado.usuario));
        localStorage.setItem('tipo', resultado.usuario.tipo);

        if (resultado.usuario.requiere_configuracion_inicial) {
            await abrirConfiguracionInicial();
        }
    } catch (error) {
        console.error('Error al cargar el perfil:\n', error.message);
        mostrarMensaje(mensajePerfil, error.message, 'error');
    }
}

/* -------------------------------------------------------------
METODO PARA GUARDAR LOS CAMBIOS NO SENSIBLES DEL PERFIL
------------------------------------------------------------- */

async function guardarPerfil(evento) {
    evento.preventDefault();

    if (!perfilActual) return;

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
    ocultarMensaje(mensajePerfil);

    try {
        const { response, resultado } = await solicitarApi('/perfil/me', {
            method: 'PATCH',
            body: datos
        });

        if (!response.ok) {
            throw new Error(resultado.mensaje || 'No fue posible actualizar el perfil');
        }

        renderizarPerfil(resultado.usuario);
        desactivarEdicion();
        localStorage.setItem('usuario', JSON.stringify(resultado.usuario));
        mostrarMensaje(mensajePerfil, resultado.mensaje, 'success');
    } catch (error) {
        console.error('Error al guardar el perfil:\n', error.message);
        mostrarMensaje(mensajePerfil, error.message, 'error');
    } finally {
        guardarBtn.innerHTML = textoOriginal;
        guardarBtn.disabled = false;
        cancelarBtn.disabled = false;
    }
}

/* -------------------------------------------------------------
METODO PARA CREAR UNA CELDA DE TABLA ACCESIBLE Y RESPONSIVA
------------------------------------------------------------- */

function crearCelda(valor, etiqueta, clase = '') {
    const celda = document.createElement('td');
    celda.dataset.label = etiqueta;
    celda.textContent = valor;

    if (clase) {
        celda.classList.add(clase);
    }

    return celda;
}

/* -------------------------------------------------------------
METODO PARA CREAR UNA CELDA CON ENLACE AL PERFIL DEL DIRECTORIO
------------------------------------------------------------- */

function crearCeldaPerfil(usuario, tipo) {
    const celda = document.createElement('td');
    const enlace = document.createElement('a');
    celda.dataset.label = 'Nombre';
    enlace.className = 'directory-profile-link';
    enlace.href = `#perfil-${tipo}-${usuario.id}`;
    enlace.dataset.perfilId = usuario.id;
    enlace.dataset.perfilTipo = tipo;
    enlace.textContent = usuario.nombre;
    celda.appendChild(enlace);
    return celda;
}

/* -------------------------------------------------------------
METODO PARA MOSTRAR UN ESTADO VACIO DENTRO DE UNA TABLA
------------------------------------------------------------- */

function mostrarTablaVacia(tabla, columnas, mensaje) {
    tabla.replaceChildren();
    const fila = document.createElement('tr');
    const celda = document.createElement('td');
    celda.colSpan = columnas;
    celda.className = 'empty-cell';
    celda.textContent = mensaje;
    fila.appendChild(celda);
    tabla.appendChild(fila);
}

/* -------------------------------------------------------------
METODO PARA ACTUALIZAR LOS CONTROLES DE PAGINACION
------------------------------------------------------------- */

function actualizarPaginacion(contenedor, paginacion) {
    const anterior = contenedor.querySelector('[data-accion="anterior"]');
    const siguiente = contenedor.querySelector('[data-accion="siguiente"]');
    const resumen = contenedor.querySelector('[data-resumen]');

    anterior.disabled = paginacion.pagina <= 1;
    siguiente.disabled = paginacion.pagina >= paginacion.totalPaginas;
    resumen.textContent = `Página ${paginacion.pagina} de ${paginacion.totalPaginas} · ${paginacion.totalRegistros} registros`;
}

/* -------------------------------------------------------------
METODO PARA RENDERIZAR EL LISTADO DE DOCENTES
------------------------------------------------------------- */

function renderizarDocentes(docentes) {
    tablaDocentes.replaceChildren();

    if (docentes.length === 0) {
        mostrarTablaVacia(
            tablaDocentes,
            3,
            'No existen docentes registrados para mostrar.'
        );
        return;
    }

    docentes.forEach((docente) => {
        const fila = document.createElement('tr');
        fila.appendChild(crearCeldaPerfil(docente, 'docente'));
        fila.appendChild(crearCelda(docente.correo, 'Correo'));
        fila.appendChild(crearCelda(
            String(docente.horas_disponibles),
            'Horas semanales disponibles'
        ));
        tablaDocentes.appendChild(fila);
    });
}

/* -------------------------------------------------------------
METODO PARA CARGAR UNA PAGINA DEL LISTADO DE DOCENTES
------------------------------------------------------------- */

async function cargarDocentes() {
    ocultarMensaje(mensajeDocentes);
    mostrarTablaVacia(tablaDocentes, 3, 'Cargando docentes...');

    try {
        const ruta = `/academico/docentes?pagina=${paginas.docentes}&limite=${LIMITE_POR_PAGINA}`;
        const { response, resultado } = await solicitarApi(ruta);

        if (!response.ok) {
            throw new Error(resultado.mensaje || 'No fue posible cargar los docentes');
        }

        renderizarDocentes(resultado.docentes);
        actualizarPaginacion(paginacionDocentes, resultado.paginacion);
    } catch (error) {
        mostrarTablaVacia(tablaDocentes, 3, 'No fue posible cargar los datos.');
        mostrarMensaje(mensajeDocentes, error.message, 'error');
    }
}

/* -------------------------------------------------------------
METODO PARA CREAR LA LISTA VISUAL DE DOCENTES DE UNA MATERIA
------------------------------------------------------------- */

function crearListaDocentes(asignaciones) {
    const contenedor = document.createElement('div');
    contenedor.className = 'teacher-list';

    if (!asignaciones || asignaciones.length === 0) {
        const etiqueta = document.createElement('span');
        etiqueta.className = 'private-value';
        etiqueta.textContent = 'Sin asignar';
        contenedor.appendChild(etiqueta);
        return contenedor;
    }

    asignaciones.forEach((asignacion) => {
        const etiqueta = document.createElement('span');
        etiqueta.className = 'teacher-tag';
        etiqueta.textContent = asignacion.docente?.nombre || 'Docente no disponible';
        contenedor.appendChild(etiqueta);
    });

    return contenedor;
}

/* -------------------------------------------------------------
METODO PARA RENDERIZAR EL LISTADO DE MATERIAS
------------------------------------------------------------- */

function renderizarMaterias(materias) {
    tablaMaterias.replaceChildren();
    materiasActuales = materias;

    if (materias.length === 0) {
        mostrarTablaVacia(
            tablaMaterias,
            perfilActual?.tipo === 'docente' ? 5 : 4,
            'No existen materias registradas.'
        );
        return;
    }

    materias.forEach((materia) => {
        const fila = document.createElement('tr');
        const celdaDocentes = document.createElement('td');
        celdaDocentes.dataset.label = 'Docentes';
        celdaDocentes.appendChild(crearListaDocentes(materia.asignaciones));

        fila.appendChild(crearCelda(materia.nombre, 'Materia'));
        fila.appendChild(crearCelda(
            formatearSemestre(materia.grado_semestre),
            'Semestre'
        ));
        fila.appendChild(crearCelda(
            String(materia.horas_semanales),
            'Horas semanales'
        ));
        fila.appendChild(celdaDocentes);

        if (perfilActual?.tipo === 'docente') {
            const celdaAcciones = document.createElement('td');
            const editar = document.createElement('button');
            celdaAcciones.dataset.label = 'Acciones';
            celdaAcciones.className = 'actions-column';
            editar.type = 'button';
            editar.className = 'row-action';
            editar.dataset.materiaId = materia.id;
            editar.setAttribute('aria-label', `Editar ${materia.nombre}`);
            editar.title = 'Editar materia';
            editar.innerHTML = '<i class="ri-edit-line"></i>';
            celdaAcciones.appendChild(editar);
            fila.appendChild(celdaAcciones);
        }

        tablaMaterias.appendChild(fila);
    });
}

/* -------------------------------------------------------------
METODO PARA CARGAR UNA PAGINA DEL LISTADO DE MATERIAS
------------------------------------------------------------- */

async function cargarMaterias() {
    ocultarMensaje(mensajeMaterias);
    const columnas = perfilActual?.tipo === 'docente' ? 5 : 4;
    mostrarTablaVacia(tablaMaterias, columnas, 'Cargando materias...');

    try {
        const ruta = `/academico/materias?pagina=${paginas.materias}&limite=${LIMITE_POR_PAGINA}`;
        const { response, resultado } = await solicitarApi(ruta);

        if (!response.ok) {
            throw new Error(resultado.mensaje || 'No fue posible cargar las materias');
        }

        renderizarMaterias(resultado.materias);
        actualizarPaginacion(paginacionMaterias, resultado.paginacion);
    } catch (error) {
        mostrarTablaVacia(
            tablaMaterias,
            columnas,
            'No fue posible cargar los datos.'
        );
        mostrarMensaje(mensajeMaterias, error.message, 'error');
    }
}

/* -------------------------------------------------------------
METODO PARA RENDERIZAR EL LISTADO DE ALUMNOS
------------------------------------------------------------- */

function renderizarAlumnos(alumnos) {
    tablaAlumnos.replaceChildren();

    if (alumnos.length === 0) {
        mostrarTablaVacia(
            tablaAlumnos,
            4,
            'No existen alumnos registrados para mostrar.'
        );
        return;
    }

    alumnos.forEach((alumno) => {
        const fila = document.createElement('tr');
        const correo = alumno.correo || 'Privado';
        const claseCorreo = alumno.correo ? '' : 'private-value';

        fila.appendChild(crearCeldaPerfil(alumno, 'alumno'));
        fila.appendChild(crearCelda(correo, 'Correo', claseCorreo));
        fila.appendChild(crearCelda(alumno.ciclo_ingreso, 'Ciclo de ingreso'));
        fila.appendChild(crearCelda(
            alumno.numero_control,
            'Número de control',
            alumno.esPerfilPropio ? '' : 'private-value'
        ));
        tablaAlumnos.appendChild(fila);
    });
}

/* -------------------------------------------------------------
METODO PARA CARGAR UNA PAGINA DEL LISTADO DE ALUMNOS
------------------------------------------------------------- */

async function cargarAlumnos() {
    ocultarMensaje(mensajeAlumnos);
    mostrarTablaVacia(tablaAlumnos, 4, 'Cargando alumnos...');

    try {
        const ruta = `/academico/alumnos?pagina=${paginas.alumnos}&limite=${LIMITE_POR_PAGINA}`;
        const { response, resultado } = await solicitarApi(ruta);

        if (!response.ok) {
            throw new Error(resultado.mensaje || 'No fue posible cargar los alumnos');
        }

        renderizarAlumnos(resultado.alumnos);
        actualizarPaginacion(paginacionAlumnos, resultado.paginacion);
    } catch (error) {
        mostrarTablaVacia(tablaAlumnos, 4, 'No fue posible cargar los datos.');
        mostrarMensaje(mensajeAlumnos, error.message, 'error');
    }
}

/* -------------------------------------------------------------
METODO PARA CARGAR TODOS LOS DOCENTES DISPONIBLES PARA EL EDITOR
------------------------------------------------------------- */

async function cargarTodosLosDocentes() {
    if (docentesDisponibles) return docentesDisponibles;

    const docentes = [];
    let pagina = 1;
    let totalPaginas = 1;

    do {
        const ruta = `/academico/docentes?pagina=${pagina}&limite=50`;
        const { response, resultado } = await solicitarApi(ruta);

        if (!response.ok) {
            throw new Error(
                resultado.mensaje || 'No fue posible cargar los docentes'
            );
        }

        docentes.push(...resultado.docentes);
        totalPaginas = resultado.paginacion.totalPaginas;
        pagina += 1;
    } while (pagina <= totalPaginas);

    docentesDisponibles = docentes;
    return docentesDisponibles;
}

/* -------------------------------------------------------------
METODO PARA RENDERIZAR LAS OPCIONES DOCENTES DEL EDITOR DE MATERIAS
------------------------------------------------------------- */

function renderizarOpcionesDocentes(docentes, seleccionados = []) {
    docentesMateria.replaceChildren();
    const idsSeleccionados = new Set(seleccionados.map(String));

    if (docentes.length === 0) {
        const aviso = document.createElement('p');
        aviso.className = 'private-value';
        aviso.textContent = 'No existen docentes registrados disponibles.';
        docentesMateria.appendChild(aviso);
        return;
    }

    docentes.forEach((docente) => {
        const etiqueta = document.createElement('label');
        const checkbox = document.createElement('input');
        const nombre = document.createElement('span');

        etiqueta.className = 'teacher-option';
        checkbox.type = 'checkbox';
        checkbox.value = docente.id;
        checkbox.checked = idsSeleccionados.has(String(docente.id));
        nombre.textContent = docente.nombre;

        etiqueta.appendChild(checkbox);
        etiqueta.appendChild(nombre);
        docentesMateria.appendChild(etiqueta);
    });
}

/* -------------------------------------------------------------
METODO PARA OBTENER LOS DOCENTES SELECCIONADOS EN EL EDITOR
------------------------------------------------------------- */

function obtenerDocentesSeleccionados() {
    return Array.from(
        docentesMateria.querySelectorAll('input[type="checkbox"]:checked')
    ).map((checkbox) => Number(checkbox.value));
}

/* -------------------------------------------------------------
METODO PARA ABRIR EL EDITOR DE UNA MATERIA NUEVA O EXISTENTE
------------------------------------------------------------- */

async function abrirEditorMateria(materia = null) {
    ocultarMensaje(mensajeMaterias);
    materiaEditandoId = materia?.id || null;
    editorMateriaTitle.textContent = materia
        ? 'Editar materia'
        : 'Nueva materia';
    materiaNombreInput.value = materia?.nombre || '';
    materiaSemestreInput.value = materia?.grado_semestre || '1';
    materiaHorasInput.value = materia?.horas_semanales || 1;
    formMateria.classList.remove('hidden');
    guardarMateriaBtn.disabled = true;

    try {
        const docentes = await cargarTodosLosDocentes();
        const seleccionados = materia?.asignaciones
            ?.map((asignacion) => asignacion.docente_id)
            || [];
        renderizarOpcionesDocentes(docentes, seleccionados);
        guardarMateriaBtn.disabled = false;
        materiaNombreInput.focus();
        formMateria.scrollIntoView({ behavior: 'smooth', block: 'start' });
    } catch (error) {
        mostrarMensaje(mensajeMaterias, error.message, 'error');
    }
}

/* -------------------------------------------------------------
METODO PARA CERRAR Y LIMPIAR EL EDITOR DE MATERIAS
------------------------------------------------------------- */

function cerrarEditorMateria() {
    materiaEditandoId = null;
    formMateria.reset();
    docentesMateria.replaceChildren();
    formMateria.classList.add('hidden');
}

/* -------------------------------------------------------------
METODO PARA PROCESAR LA CREACION O EDICION DE UNA MATERIA
------------------------------------------------------------- */

async function guardarMateria(evento) {
    evento.preventDefault();
    ocultarMensaje(mensajeMaterias);

    const datos = {
        nombre: materiaNombreInput.value.trim(),
        grado_semestre: materiaSemestreInput.value,
        horas_semanales: Number(materiaHorasInput.value),
        docente_ids: obtenerDocentesSeleccionados()
    };
    const ruta = materiaEditandoId
        ? `/academico/materias/${materiaEditandoId}`
        : '/academico/materias';
    const metodo = materiaEditandoId ? 'PATCH' : 'POST';
    const textoOriginal = guardarMateriaBtn.innerHTML;
    guardarMateriaBtn.disabled = true;
    guardarMateriaBtn.textContent = 'Guardando...';

    try {
        const { response, resultado } = await solicitarApi(ruta, {
            method: metodo,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(datos)
        });

        if (!response.ok) {
            throw new Error(resultado.mensaje || 'No fue posible guardar la materia');
        }

        cerrarEditorMateria();
        await cargarMaterias();
        mostrarMensaje(mensajeMaterias, resultado.mensaje, 'success');
    } catch (error) {
        mostrarMensaje(mensajeMaterias, error.message, 'error');
    } finally {
        guardarMateriaBtn.innerHTML = textoOriginal;
        guardarMateriaBtn.disabled = false;
    }
}

/* -------------------------------------------------------------
METODO PARA ABRIR LA MATERIA SELECCIONADA DESDE LA TABLA
------------------------------------------------------------- */

function manejarEdicionMateria(evento) {
    const boton = evento.target.closest('[data-materia-id]');

    if (!boton) return;

    const materia = materiasActuales.find((registro) => {
        return String(registro.id) === String(boton.dataset.materiaId);
    });

    if (materia) {
        abrirEditorMateria(materia);
    }
}

/* -------------------------------------------------------------
METODO PARA AGREGAR UN DATO SEGURO AL PERFIL DEL DIRECTORIO
------------------------------------------------------------- */

function agregarDatoPerfilDirectorio(etiqueta, valor) {
    if (valor === null || valor === undefined || valor === '') return;
    const bloque = document.createElement('div');
    const titulo = document.createElement('small');
    const contenido = document.createElement('strong');
    titulo.textContent = etiqueta;
    contenido.textContent = valor;
    bloque.append(titulo, contenido);
    perfilDirectorioDatos.appendChild(bloque);
}

/* -------------------------------------------------------------
METODO PARA RENDERIZAR EL PERFIL CONSULTADO DESDE UN LISTADO
------------------------------------------------------------- */

function renderizarPerfilDirectorio(usuario) {
    perfilDirectorioImagen.src = usuario.imagen || IMAGEN_PREDETERMINADA;
    perfilDirectorioNombre.textContent = usuario.nombre || 'Perfil';
    perfilDirectorioRol.textContent = usuario.tipo === 'docente' ? 'Docente' : 'Alumno';
    perfilDirectorioDatos.replaceChildren();
    agregarDatoPerfilDirectorio('Correo', usuario.correo || 'Privado');
    if (usuario.tipo === 'docente') {
        agregarDatoPerfilDirectorio('Horas disponibles', String(usuario.horas_disponibles ?? 0));
    } else {
        agregarDatoPerfilDirectorio('Número de control', usuario.numero_control || 'Privado');
        agregarDatoPerfilDirectorio('Ciclo de ingreso', usuario.ciclo_ingreso || 'Pendiente');
        agregarDatoPerfilDirectorio('Semestre actual', formatearSemestre(usuario.semestre_actual));
        agregarDatoPerfilDirectorio('Grupo actual', usuario.grupo_actual || 'Pendiente');
    }
}

/* -------------------------------------------------------------
METODO PARA ABRIR Y CONSULTAR UN PERFIL DESDE SU ENLACE
------------------------------------------------------------- */

async function abrirPerfilDirectorio(tipo, id) {
    modalPerfilDirectorio.classList.remove('hidden');
    document.body.classList.add('modal-open');
    perfilDirectorioDatos.replaceChildren();
    perfilDirectorioNombre.textContent = 'Cargando perfil...';
    perfilDirectorioRol.textContent = '';
    perfilDirectorioImagen.src = IMAGEN_PREDETERMINADA;
    ocultarMensaje(mensajePerfilDirectorio);
    try {
        const { response, resultado } = await solicitarApi(`/perfil/${tipo}s/${id}`);
        if (!response.ok) throw new Error(resultado.mensaje || 'No fue posible consultar el perfil');
        renderizarPerfilDirectorio(resultado.usuario);
    } catch (error) {
        mostrarMensaje(mensajePerfilDirectorio, error.message, 'error');
    }
}

/* -------------------------------------------------------------
METODO PARA PROCESAR LOS ENLACES DE PERFIL DE DOCENTES Y ALUMNOS
------------------------------------------------------------- */

function manejarEnlacePerfil(evento) {
    const enlace = evento.target.closest('[data-perfil-id][data-perfil-tipo]');
    if (!enlace) return;
    evento.preventDefault();
    abrirPerfilDirectorio(enlace.dataset.perfilTipo, enlace.dataset.perfilId);
}

/* -------------------------------------------------------------
METODO PARA CERRAR EL PERFIL CONSULTADO DESDE EL DIRECTORIO
------------------------------------------------------------- */

function cerrarPerfilDirectorio() {
    modalPerfilDirectorio.classList.add('hidden');
    document.body.classList.remove('modal-open');
}

/* -------------------------------------------------------------
METODO PARA CARGAR LA VISTA SELECCIONADA
------------------------------------------------------------- */

function cargarVista(nombreVista) {
    if (nombreVista === 'docentes') {
        cargarDocentes();
    }

    if (nombreVista === 'materias') {
        cargarMaterias();
    }

    if (nombreVista === 'alumnos') {
        cargarAlumnos();
    }

    if (nombreVista === 'cursos') {
        window.CursosDashboard?.cargar();
    }

    if (nombreVista === 'calificaciones') {
        window.CalificacionesDashboard?.cargar();
    }

    if (nombreVista === 'horarios') {
        window.HorariosDashboard?.cargar();
    }
}

/* -------------------------------------------------------------
METODO PARA CAMBIAR ENTRE LAS VISTAS DEL DASHBOARD
------------------------------------------------------------- */

function cambiarVista(evento) {
    const boton = evento.currentTarget;
    const nombreVista = boton.dataset.vista;

    botonesNavegacion.forEach((elemento) => {
        elemento.classList.toggle('active', elemento === boton);
    });
    seccionesVista.forEach((seccion) => {
        seccion.classList.toggle(
            'hidden',
            seccion.id !== `vista-${nombreVista}`
        );
    });

    cargarVista(nombreVista);
}

/* -------------------------------------------------------------
METODO PARA CAMBIAR LA PAGINA DE UN LISTADO
------------------------------------------------------------- */

function cambiarPagina(tipo, direccion) {
    const nuevaPagina = paginas[tipo] + direccion;

    if (nuevaPagina < 1) return;

    paginas[tipo] = nuevaPagina;

    if (tipo === 'docentes') cargarDocentes();
    if (tipo === 'materias') cargarMaterias();
    if (tipo === 'alumnos') cargarAlumnos();
}

/* -------------------------------------------------------------
METODO PARA PROCESAR LOS BOTONES DE UN PAGINADOR
------------------------------------------------------------- */

function manejarPaginacion(evento, tipo) {
    const boton = evento.target.closest('[data-accion]');

    if (!boton || boton.disabled) return;

    cambiarPagina(tipo, boton.dataset.accion === 'anterior' ? -1 : 1);
}

/* -------------------------------------------------------------
METODO PARA MOSTRAR EL MODAL OBLIGATORIO DE CONFIGURACION INICIAL
------------------------------------------------------------- */

async function abrirConfiguracionInicial() {
    modalConfiguracion.classList.remove('hidden');
    document.body.classList.add('modal-open');
    mostrarMensaje(
        mensajeConfiguracion,
        'Cargando ciclos y grupos disponibles...',
        'info'
    );

    try {
        const { response, resultado } = await solicitarApi(
            '/academico/configuracion-inicial'
        );

        if (!response.ok) {
            if (response.status === 409) {
                modalConfiguracion.classList.add('hidden');
                document.body.classList.remove('modal-open');
                await cargarPerfil();
                return;
            }

            throw new Error(
                resultado.mensaje
                || 'No fue posible preparar la configuración académica'
            );
        }

        opcionesConfiguracion = resultado;
        periodoIngresoSelect.replaceChildren();
        const opcionInicial = document.createElement('option');
        opcionInicial.value = '';
        opcionInicial.textContent = 'Selecciona un ciclo';
        periodoIngresoSelect.appendChild(opcionInicial);

        resultado.ciclosIngreso.forEach((ciclo) => {
            const opcion = document.createElement('option');
            opcion.value = ciclo.id;
            opcion.textContent = ciclo.nombre;
            periodoIngresoSelect.appendChild(opcion);
        });

        ocultarMensaje(mensajeConfiguracion);
        periodoIngresoSelect.focus();
    } catch (error) {
        mostrarMensaje(mensajeConfiguracion, error.message, 'error');
    }
}

/* -------------------------------------------------------------
METODO PARA ACTUALIZAR EL SEMESTRE Y LOS GRUPOS DEL CICLO ELEGIDO
------------------------------------------------------------- */

function actualizarGruposConfiguracion() {
    const ciclo = opcionesConfiguracion?.ciclosIngreso.find((registro) => {
        return String(registro.id) === periodoIngresoSelect.value;
    });

    grupoSeleccionadoSelect.replaceChildren();

    if (!ciclo) {
        semestreCalculadoInput.value = 'Pendiente';
        grupoSeleccionadoSelect.disabled = true;
        const opcion = document.createElement('option');
        opcion.value = '';
        opcion.textContent = 'Selecciona primero tu ciclo';
        grupoSeleccionadoSelect.appendChild(opcion);
        return;
    }

    semestreCalculadoInput.value = formatearSemestre(ciclo.semestreActual);
    const grupos = opcionesConfiguracion.grupos.filter((grupo) => {
        return Number(grupo.grado_semestre) === Number(ciclo.semestreActual);
    });
    const opcionInicial = document.createElement('option');
    opcionInicial.value = '';
    opcionInicial.textContent = 'Selecciona tu grupo';
    grupoSeleccionadoSelect.appendChild(opcionInicial);

    grupos.forEach((grupo) => {
        const opcion = document.createElement('option');
        opcion.value = grupo.id;
        opcion.textContent = `${grupo.grado_semestre}${grupo.division}`;
        grupoSeleccionadoSelect.appendChild(opcion);
    });

    grupoSeleccionadoSelect.disabled = false;
}

/* -------------------------------------------------------------
METODO PARA GUARDAR LA CONFIGURACION ACADEMICA INICIAL
------------------------------------------------------------- */

async function guardarConfiguracionInicial(evento) {
    evento.preventDefault();
    ocultarMensaje(mensajeConfiguracion);

    const datos = {
        periodo_ingreso_id: Number(periodoIngresoSelect.value),
        grupo_id: Number(grupoSeleccionadoSelect.value)
    };

    if (!datos.periodo_ingreso_id || !datos.grupo_id) {
        mostrarMensaje(
            mensajeConfiguracion,
            'Selecciona tu ciclo de ingreso y tu grupo actual.',
            'error'
        );
        return;
    }

    const textoOriginal = guardarConfiguracionBtn.textContent;
    guardarConfiguracionBtn.disabled = true;
    guardarConfiguracionBtn.textContent = 'Guardando...';

    try {
        const { response, resultado } = await solicitarApi(
            '/academico/configuracion-inicial',
            {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(datos)
            }
        );

        if (!response.ok) {
            throw new Error(
                resultado.mensaje
                || 'No fue posible guardar la configuración académica'
            );
        }

        modalConfiguracion.classList.add('hidden');
        document.body.classList.remove('modal-open');
        opcionesConfiguracion = null;
        paginas.alumnos = 1;
        await cargarPerfil();
        mostrarMensaje(mensajePerfil, resultado.mensaje, 'success');
    } catch (error) {
        mostrarMensaje(mensajeConfiguracion, error.message, 'error');
    } finally {
        guardarConfiguracionBtn.textContent = textoOriginal;
        guardarConfiguracionBtn.disabled = false;
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
botonesNavegacion.forEach((boton) => {
    boton.addEventListener('click', cambiarVista);
});
paginacionDocentes.addEventListener('click', (evento) => {
    manejarPaginacion(evento, 'docentes');
});
paginacionMaterias.addEventListener('click', (evento) => {
    manejarPaginacion(evento, 'materias');
});
paginacionAlumnos.addEventListener('click', (evento) => {
    manejarPaginacion(evento, 'alumnos');
});
nuevaMateriaBtn.addEventListener('click', () => abrirEditorMateria());
cancelarMateriaBtn.addEventListener('click', cerrarEditorMateria);
descartarMateriaBtn.addEventListener('click', cerrarEditorMateria);
formMateria.addEventListener('submit', guardarMateria);
tablaMaterias.addEventListener('click', manejarEdicionMateria);
tablaDocentes.addEventListener('click', manejarEnlacePerfil);
tablaAlumnos.addEventListener('click', manejarEnlacePerfil);
controlesCerrarPerfilDirectorio.forEach((control) => {
    control.addEventListener('click', cerrarPerfilDirectorio);
});
periodoIngresoSelect.addEventListener('change', actualizarGruposConfiguracion);
formConfiguracion.addEventListener('submit', guardarConfiguracionInicial);
salirConfiguracionBtn.addEventListener('click', cerrarSesion);
document.addEventListener('DOMContentLoaded', inicializarDashboard);

/* -------------------------------------------------------------
METODO PARA EXPONER UTILIDADES COMPARTIDAS A LOS MODULOS DEL DASHBOARD
------------------------------------------------------------- */

window.SiCEApi = {
    solicitarApi,
    mostrarMensaje,
    ocultarMensaje,
    crearCelda,
    mostrarTablaVacia,
    actualizarPaginacion,
    obtenerPerfil: () => perfilActual
};
