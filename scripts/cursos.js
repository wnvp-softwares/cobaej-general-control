/* -------------------------------------------------------------
MODULO DE CURSOS, INSCRIPCIONES, ACTIVIDADES Y CAPTURA DOCENTE
------------------------------------------------------------- */

(() => {
    const api = window.SiCEApi;
    const tablaCursos = document.getElementById('tabla-cursos');
    const paginacion = document.getElementById('paginacion-cursos');
    const mensajeCursos = document.getElementById('mensaje-cursos');
    const botonNuevoCurso = document.getElementById('nuevo-curso');
    const vistaCursos = document.getElementById('vista-cursos');
    const vistaDetalle = document.getElementById('vista-curso-detalle');
    const modalCurso = document.getElementById('modal-curso');
    const modalInscripcion = document.getElementById('modal-inscripcion');
    const modalActividad = document.getElementById('modal-actividad');
    const modalDetalleActividad = document.getElementById('modal-detalle-actividad');
    const modalCalificar = document.getElementById('modal-calificar');
    const mensajeModalCurso = document.getElementById('mensaje-modal-curso');
    const mensajeDetalle = document.getElementById('mensaje-curso-detalle');
    const mensajeActividad = document.getElementById('mensaje-modal-actividad');
    const materiaSelect = document.getElementById('curso-materia');
    const grupoSelect = document.getElementById('curso-grupo');
    const unidadesContenedor = document.getElementById('unidades-curso');
    const tablaAlumnos = document.getElementById('tabla-alumnos-curso');
    const seccionAlumnos = document.getElementById('alumnos-curso-seccion');
    const rubricasEditor = document.getElementById('rubricas-editor');
    const rubricasCalificacion = document.getElementById('rubricas-calificacion');
    let pagina = 1;
    let cursos = [];
    let opcionesCurso = null;
    let cursoSeleccionado = null;
    let cursoPendienteInscripcion = null;
    let alumnoCalificando = null;
    let actividadCalificando = null;

    /* -------------------------------------------------------------
    METODO PARA MOSTRAR U OCULTAR UN MODAL DEL MODULO
    ------------------------------------------------------------- */

    function alternarModal(modal, mostrar) {
        modal.classList.toggle('hidden', !mostrar);
        document.body.classList.toggle('modal-open', mostrar);
    }

    /* -------------------------------------------------------------
    METODO PARA CREAR UNA OPCION DE SELECT SIN INSERTAR HTML EXTERNO
    ------------------------------------------------------------- */

    function agregarOpcion(select, valor, texto) {
        const opcion = document.createElement('option');
        opcion.value = valor;
        opcion.textContent = texto;
        select.appendChild(opcion);
    }

    /* -------------------------------------------------------------
    METODO PARA RENDERIZAR LA TABLA PAGINADA DE CURSOS
    ------------------------------------------------------------- */

    function renderizarCursos(registros) {
        tablaCursos.replaceChildren();
        if (!registros.length) {
            api.mostrarTablaVacia(tablaCursos, 5, 'No existen cursos disponibles.');
            return;
        }
        registros.forEach((curso) => {
            const fila = document.createElement('tr');
            const enlace = document.createElement('button');
            const celdaMateria = document.createElement('td');
            enlace.type = 'button';
            enlace.className = 'course-link';
            enlace.dataset.cursoId = curso.id;
            enlace.textContent = curso.materia.nombre;
            celdaMateria.dataset.label = 'Materia';
            celdaMateria.appendChild(enlace);
            fila.appendChild(celdaMateria);
            fila.appendChild(api.crearCelda(`${curso.grupo.grado_semestre}${curso.grupo.division}`, 'Grupo'));
            fila.appendChild(api.crearCelda(curso.periodo.nombre_ciclo, 'Periodo'));
            fila.appendChild(api.crearCelda(
                curso.docentesCurso.map((registro) => registro.docente?.nombre).filter(Boolean).join(', ') || 'Sin asignar',
                'Docentes'
            ));
            fila.appendChild(api.crearCelda(curso.inscrito ? 'Disponible' : 'Inscripción requerida', 'Estado'));
            tablaCursos.appendChild(fila);
        });
    }

    /* -------------------------------------------------------------
    METODO PARA CARGAR UNA PAGINA DE CURSOS VISIBLES
    ------------------------------------------------------------- */

    async function cargar() {
        api.ocultarMensaje(mensajeCursos);
        botonNuevoCurso.classList.toggle('hidden', api.obtenerPerfil()?.tipo !== 'docente');
        api.mostrarTablaVacia(tablaCursos, 5, 'Cargando cursos...');
        try {
            const { response, resultado } = await api.solicitarApi(`/cursos?pagina=${pagina}&limite=10`);
            if (!response.ok) throw new Error(resultado.mensaje || 'No fue posible cargar los cursos');
            cursos = resultado.cursos;
            renderizarCursos(cursos);
            api.actualizarPaginacion(paginacion, resultado.paginacion);
        } catch (error) {
            api.mostrarTablaVacia(tablaCursos, 5, 'No fue posible cargar los cursos.');
            api.mostrarMensaje(mensajeCursos, error.message, 'error');
        }
    }

    /* -------------------------------------------------------------
    METODO PARA ABRIR EL FORMULARIO SIMPLE DE UN CURSO NUEVO
    ------------------------------------------------------------- */

    async function abrirNuevoCurso() {
        api.ocultarMensaje(mensajeModalCurso);
        try {
            const { response, resultado } = await api.solicitarApi('/cursos/opciones');
            if (!response.ok) throw new Error(resultado.mensaje || 'No fue posible cargar las opciones');
            opcionesCurso = resultado;
            materiaSelect.replaceChildren();
            agregarOpcion(materiaSelect, '', 'Selecciona una materia');
            resultado.materias.forEach((materia) => agregarOpcion(
                materiaSelect,
                materia.id,
                `${materia.nombre} · ${materia.grado_semestre}° semestre`
            ));
            actualizarGruposCompatibles();
            alternarModal(modalCurso, true);
        } catch (error) {
            api.mostrarMensaje(mensajeCursos, error.message, 'error');
        }
    }

    /* -------------------------------------------------------------
    METODO PARA FILTRAR GRUPOS CON EL MISMO SEMESTRE DE LA MATERIA
    ------------------------------------------------------------- */

    function actualizarGruposCompatibles() {
        const materia = opcionesCurso?.materias.find((registro) => String(registro.id) === materiaSelect.value);
        grupoSelect.replaceChildren();
        agregarOpcion(grupoSelect, '', materia ? 'Selecciona un grupo' : 'Selecciona primero una materia');
        opcionesCurso?.grupos
            .filter((grupo) => String(grupo.grado_semestre) === String(materia?.grado_semestre))
            .forEach((grupo) => agregarOpcion(grupoSelect, grupo.id, `${grupo.grado_semestre}${grupo.division}`));
        grupoSelect.disabled = !materia;
    }

    /* -------------------------------------------------------------
    METODO PARA ENVIAR LA CREACION DE UN CURSO AL SERVIDOR
    ------------------------------------------------------------- */

    async function crearCurso(evento) {
        evento.preventDefault();
        try {
            const { response, resultado } = await api.solicitarApi('/cursos', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ materia_id: Number(materiaSelect.value), grupo_id: Number(grupoSelect.value) })
            });
            if (!response.ok) throw new Error(resultado.mensaje || 'No fue posible crear el curso');
            alternarModal(modalCurso, false);
            await cargar();
            api.mostrarMensaje(mensajeCursos, resultado.mensaje, 'success');
        } catch (error) {
            api.mostrarMensaje(mensajeModalCurso, error.message, 'error');
        }
    }

    /* -------------------------------------------------------------
    METODO PARA ABRIR UN CURSO O SOLICITAR LA INSCRIPCION DEL ALUMNO
    ------------------------------------------------------------- */

    async function manejarCurso(evento) {
        const boton = evento.target.closest('[data-curso-id]');
        if (!boton) return;
        const curso = cursos.find((registro) => String(registro.id) === boton.dataset.cursoId);
        if (!curso.inscrito && api.obtenerPerfil()?.tipo === 'alumno') {
            cursoPendienteInscripcion = curso;
            document.getElementById('texto-inscripcion').textContent = `¿Deseas inscribirte a ${curso.materia.nombre} para el grupo ${curso.grupo.grado_semestre}${curso.grupo.division}?`;
            alternarModal(modalInscripcion, true);
            return;
        }
        await abrirDetalleCurso(curso.id);
    }

    /* -------------------------------------------------------------
    METODO PARA CONFIRMAR LA INSCRIPCION INMEDIATA EN UN CURSO COMPATIBLE
    ------------------------------------------------------------- */

    async function confirmarInscripcion() {
        if (!cursoPendienteInscripcion) return;
        try {
            const { response, resultado } = await api.solicitarApi(`/cursos/${cursoPendienteInscripcion.id}/inscripcion`, { method: 'POST' });
            if (!response.ok) throw new Error(resultado.mensaje || 'No fue posible completar la inscripción');
            const cursoId = cursoPendienteInscripcion.id;
            cursoPendienteInscripcion = null;
            alternarModal(modalInscripcion, false);
            await abrirDetalleCurso(cursoId);
        } catch (error) {
            alternarModal(modalInscripcion, false);
            api.mostrarMensaje(mensajeCursos, error.message, 'error');
        }
    }

    /* -------------------------------------------------------------
    METODO PARA RENDERIZAR LAS TRES UNIDADES Y SUS ACTIVIDADES
    ------------------------------------------------------------- */

    function renderizarUnidades(unidades) {
        unidadesContenedor.replaceChildren();
        unidades.forEach((unidad) => {
            const tarjeta = document.createElement('article');
            const titulo = document.createElement('h2');
            const lista = document.createElement('div');
            tarjeta.className = 'unit-card';
            lista.className = 'activity-list';
            titulo.textContent = unidad.nombre;
            tarjeta.appendChild(titulo);
            if (!unidad.actividades.length) {
                const vacio = document.createElement('p');
                vacio.className = 'private-value';
                vacio.textContent = 'Sin actividades registradas.';
                lista.appendChild(vacio);
            }
            unidad.actividades.forEach((actividad) => {
                const boton = document.createElement('button');
                boton.type = 'button';
                boton.className = 'activity-item';
                boton.dataset.actividadId = actividad.id;
                boton.textContent = `${actividad.titulo} · ${actividad.valor_maximo} pts`;
                lista.appendChild(boton);
            });
            tarjeta.appendChild(lista);
            unidadesContenedor.appendChild(tarjeta);
        });
    }

    /* -------------------------------------------------------------
    METODO PARA ABRIR LA VISTA INTERNA DE UN CURSO AUTORIZADO
    ------------------------------------------------------------- */

    async function abrirDetalleCurso(cursoId) {
        try {
            const { response, resultado } = await api.solicitarApi(`/cursos/${cursoId}`);
            if (!response.ok) throw new Error(resultado.mensaje || 'No fue posible abrir el curso');
            cursoSeleccionado = resultado.curso;
            document.getElementById('curso-detalle-title').textContent = cursoSeleccionado.materia.nombre;
            document.getElementById('curso-detalle-meta').textContent = `Grupo ${cursoSeleccionado.grupo.grado_semestre}${cursoSeleccionado.grupo.division} · ${cursoSeleccionado.periodo.nombre_ciclo}`;
            document.getElementById('nueva-actividad').classList.toggle('hidden', resultado.rol !== 'docente');
            renderizarUnidades(cursoSeleccionado.unidades);
            vistaCursos.classList.add('hidden');
            vistaDetalle.classList.remove('hidden');
            if (resultado.rol === 'docente') await cargarAlumnosCurso();
            else seccionAlumnos.classList.add('hidden');
        } catch (error) {
            api.mostrarMensaje(mensajeCursos, error.message, 'error');
        }
    }

    /* -------------------------------------------------------------
    METODO PARA REGRESAR AL LISTADO PRINCIPAL DE CURSOS
    ------------------------------------------------------------- */

    function volverCursos() {
        vistaDetalle.classList.add('hidden');
        vistaCursos.classList.remove('hidden');
        cursoSeleccionado = null;
    }

    /* -------------------------------------------------------------
    METODO PARA ABRIR EL FORMULARIO DE ACTIVIDAD CON FECHA ACTUAL
    ------------------------------------------------------------- */

    function abrirNuevaActividad() {
        document.getElementById('form-actividad').reset();
        rubricasEditor.replaceChildren();
        const inicio = new Date(Date.now() - new Date().getTimezoneOffset() * 60000).toISOString().slice(0, 16);
        document.getElementById('actividad-inicio').value = inicio;
        const unidadSelect = document.getElementById('actividad-unidad');
        unidadSelect.replaceChildren();
        cursoSeleccionado.unidades.forEach((unidad) => agregarOpcion(unidadSelect, unidad.id, unidad.nombre));
        api.ocultarMensaje(mensajeActividad);
        alternarModal(modalActividad, true);
    }

    /* -------------------------------------------------------------
    METODO PARA AGREGAR UNA FILA EDITABLE DE RUBRICA
    ------------------------------------------------------------- */

    function agregarRubrica() {
        const fila = document.createElement('div');
        fila.className = 'rubric-row';
        fila.innerHTML = '<input class="standard-input" data-rubrica="criterio" maxlength="150" placeholder="Criterio" required><input class="standard-input" data-rubrica="valor" type="number" min="0.01" step="0.01" placeholder="Puntos" required><button class="icon-button" type="button" data-quitar-rubrica aria-label="Quitar criterio"><i class="ri-delete-bin-line"></i></button>';
        rubricasEditor.appendChild(fila);
    }

    /* -------------------------------------------------------------
    METODO PARA LEER LAS RUBRICAS CAPTURADAS EN EL EDITOR
    ------------------------------------------------------------- */

    function obtenerRubricasEditor() {
        return Array.from(rubricasEditor.querySelectorAll('.rubric-row')).map((fila) => ({
            criterio: fila.querySelector('[data-rubrica="criterio"]').value.trim(),
            valor_maximo: Number(fila.querySelector('[data-rubrica="valor"]').value)
        }));
    }

    /* -------------------------------------------------------------
    METODO PARA CREAR UNA ACTIVIDAD MULTIPARTE CON SUS ARCHIVOS
    ------------------------------------------------------------- */

    async function guardarActividad(evento) {
        evento.preventDefault();
        const archivos = Array.from(document.getElementById('actividad-archivos').files);
        if (archivos.length > 5 || archivos.some((archivo) => archivo.size > 10 * 1024 * 1024)) {
            api.mostrarMensaje(mensajeActividad, 'Utiliza máximo cinco archivos de hasta 10 MB cada uno.', 'error');
            return;
        }
        const datos = new FormData();
        datos.append('unidad_curso_id', document.getElementById('actividad-unidad').value);
        datos.append('titulo', document.getElementById('actividad-nombre').value.trim());
        datos.append('descripcion', document.getElementById('actividad-descripcion').value.trim());
        datos.append('fecha_inicio', document.getElementById('actividad-inicio').value);
        datos.append('fecha_cierre', document.getElementById('actividad-cierre').value);
        datos.append('valor_maximo', document.getElementById('actividad-valor').value);
        datos.append('rubricas', JSON.stringify(obtenerRubricasEditor()));
        archivos.forEach((archivo) => datos.append('archivos', archivo));
        try {
            const { response, resultado } = await api.solicitarApi(`/cursos/${cursoSeleccionado.id}/actividades`, { method: 'POST', body: datos });
            if (!response.ok) throw new Error(resultado.mensaje || 'No fue posible guardar la actividad');
            alternarModal(modalActividad, false);
            await abrirDetalleCurso(cursoSeleccionado.id);
            api.mostrarMensaje(mensajeDetalle, resultado.mensaje, 'success');
        } catch (error) {
            api.mostrarMensaje(mensajeActividad, error.message, 'error');
        }
    }

    /* -------------------------------------------------------------
    METODO PARA MOSTRAR EL DETALLE Y LOS MATERIALES DE UNA ACTIVIDAD
    ------------------------------------------------------------- */

    async function abrirDetalleActividad(actividadId) {
        try {
            const { response, resultado } = await api.solicitarApi(`/cursos/${cursoSeleccionado.id}/actividades/${actividadId}`);
            if (!response.ok) throw new Error(resultado.mensaje || 'No fue posible cargar la actividad');
            const actividad = resultado.actividad;
            document.getElementById('detalle-actividad-title').textContent = actividad.titulo;
            document.getElementById('detalle-actividad-unidad').textContent = actividad.unidad.nombre;
            const contenido = document.getElementById('detalle-actividad-contenido');
            contenido.replaceChildren();
            [actividad.descripcion || 'Sin descripción', `Inicio: ${new Date(actividad.fecha_inicio).toLocaleString('es-MX')}`, `Cierre: ${new Date(actividad.fecha_cierre).toLocaleString('es-MX')}`, `Valor: ${actividad.valor_maximo} puntos`].forEach((texto) => {
                const parrafo = document.createElement('p'); parrafo.textContent = texto; contenido.appendChild(parrafo);
            });
            if (resultado.rol === 'alumno') {
                const calificacion = document.createElement('p');
                calificacion.className = 'activity-grade';
                calificacion.textContent = resultado.calificacion
                    ? `Tu calificación: ${resultado.calificacion.puntos_obtenidos} de ${actividad.valor_maximo}`
                    : 'Tu calificación: pendiente';
                contenido.appendChild(calificacion);
            }
            actividad.archivos.forEach((archivo) => {
                const enlace = document.createElement('a'); enlace.href = archivo.url; enlace.target = '_blank'; enlace.rel = 'noopener'; enlace.className = 'material-link'; enlace.textContent = archivo.nombre_original; contenido.appendChild(enlace);
            });
            alternarModal(modalDetalleActividad, true);
        } catch (error) {
            api.mostrarMensaje(mensajeDetalle, error.message, 'error');
        }
    }

    /* -------------------------------------------------------------
    METODO PARA CARGAR LOS ALUMNOS INSCRITOS EN LA VISTA DOCENTE
    ------------------------------------------------------------- */

    async function cargarAlumnosCurso() {
        const [{ response, resultado }, respuestaCalificaciones] = await Promise.all([
            api.solicitarApi(`/cursos/${cursoSeleccionado.id}/alumnos`),
            api.solicitarApi(`/calificaciones/curso/${cursoSeleccionado.id}`)
        ]);
        if (!response.ok) throw new Error(resultado.mensaje || 'No fue posible cargar los alumnos');
        const calificaciones = respuestaCalificaciones.response.ok
            ? respuestaCalificaciones.resultado.calificaciones
            : [];
        const resumen = new Map();
        calificaciones.forEach((registro) => {
            const clave = String(registro.inscripcion_materia_id);
            if (!resumen.has(clave)) resumen.set(clave, { unidades: {}, general: registro.calificacion_general });
            resumen.get(clave).unidades[registro.unidad] = registro.calificacion_unidad;
        });
        tablaAlumnos.replaceChildren();
        resultado.alumnos.forEach((alumno) => {
            const fila = document.createElement('tr');
            const notas = resumen.get(String(alumno.inscripcion_materia_id)) || { unidades: {}, general: null };
            fila.appendChild(api.crearCelda(alumno.nombre, 'Nombre'));
            fila.appendChild(api.crearCelda(alumno.numero_control, 'Número de control'));
            fila.appendChild(api.crearCelda(notas.unidades[1] === undefined ? 'Pendiente' : Number(notas.unidades[1]).toFixed(2), 'Unidad 1'));
            fila.appendChild(api.crearCelda(notas.unidades[2] === undefined ? 'Pendiente' : Number(notas.unidades[2]).toFixed(2), 'Unidad 2'));
            fila.appendChild(api.crearCelda(notas.unidades[3] === undefined ? 'Pendiente' : Number(notas.unidades[3]).toFixed(2), 'Unidad 3'));
            fila.appendChild(api.crearCelda(notas.general === null ? 'Pendiente' : Number(notas.general).toFixed(2), 'General', 'grade-value'));
            const accion = document.createElement('td');
            const boton = document.createElement('button');
            accion.dataset.label = 'Acciones'; boton.type = 'button'; boton.className = 'secondary-button compact-button'; boton.dataset.calificarAlumno = alumno.inscripcion_materia_id; boton.textContent = 'Calificar'; accion.appendChild(boton); fila.appendChild(accion);
            tablaAlumnos.appendChild(fila);
        });
        if (!resultado.alumnos.length) api.mostrarTablaVacia(tablaAlumnos, 7, 'Todavía no hay alumnos inscritos.');
        seccionAlumnos.classList.remove('hidden');
    }

    /* -------------------------------------------------------------
    METODO PARA ABRIR LA CAPTURA DE CALIFICACION DE UN ALUMNO
    ------------------------------------------------------------- */

    function abrirCalificacion(inscripcionId) {
        alumnoCalificando = inscripcionId;
        rubricasCalificacion.replaceChildren();
        const grupo = document.createElement('div'); grupo.className = 'field-group';
        const etiqueta = document.createElement('label'); etiqueta.textContent = 'Actividad';
        const select = document.createElement('select'); select.className = 'standard-input'; select.id = 'actividad-calificar'; select.required = true;
        agregarOpcion(select, '', 'Selecciona una actividad');
        cursoSeleccionado.unidades.forEach((unidad) => unidad.actividades.forEach((actividad) => agregarOpcion(select, actividad.id, `${unidad.nombre} · ${actividad.titulo}`)));
        grupo.append(etiqueta, select); rubricasCalificacion.appendChild(grupo);
        select.addEventListener('change', () => prepararRubricasCalificacion(select.value));
        alternarModal(modalCalificar, true);
    }

    /* -------------------------------------------------------------
    METODO PARA CARGAR LOS CRITERIOS DE LA ACTIVIDAD SELECCIONADA
    ------------------------------------------------------------- */

    async function prepararRubricasCalificacion(actividadId) {
        rubricasCalificacion.querySelectorAll('.grade-rubric').forEach((elemento) => elemento.remove());
        actividadCalificando = null;
        if (!actividadId) return;
        const { response, resultado } = await api.solicitarApi(`/cursos/${cursoSeleccionado.id}/actividades/${actividadId}`);
        if (!response.ok) throw new Error(resultado.mensaje || 'No fue posible cargar la rúbrica');
        actividadCalificando = resultado.actividad;
        const puntos = document.getElementById('calificacion-puntos');
        puntos.max = actividadCalificando.valor_maximo;
        resultado.actividad.rubricas.forEach((rubrica) => {
            const grupo = document.createElement('div'); grupo.className = 'field-group grade-rubric';
            const etiqueta = document.createElement('label'); etiqueta.textContent = `${rubrica.criterio} (máx. ${rubrica.valor_maximo})`;
            const input = document.createElement('input'); input.className = 'standard-input'; input.type = 'number'; input.min = '0'; input.max = rubrica.valor_maximo; input.step = '0.01'; input.required = true; input.dataset.rubricaId = rubrica.id;
            grupo.append(etiqueta, input); rubricasCalificacion.appendChild(grupo);
        });
    }

    /* -------------------------------------------------------------
    METODO PARA GUARDAR LA CALIFICACION Y EL DESGLOSE DE RUBRICA
    ------------------------------------------------------------- */

    async function guardarCalificacion(evento) {
        evento.preventDefault();
        if (!actividadCalificando) return;
        const datos = {
            inscripcion_materia_id: alumnoCalificando,
            puntos_obtenidos: Number(document.getElementById('calificacion-puntos').value),
            observaciones: document.getElementById('calificacion-observaciones').value.trim(),
            rubricas: Array.from(rubricasCalificacion.querySelectorAll('[data-rubrica-id]')).map((input) => ({ rubrica_actividad_id: Number(input.dataset.rubricaId), puntos_obtenidos: Number(input.value) }))
        };
        try {
            const { response, resultado } = await api.solicitarApi(`/calificaciones/actividades/${actividadCalificando.id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(datos) });
            if (!response.ok) throw new Error(resultado.mensaje || 'No fue posible guardar la calificación');
            alternarModal(modalCalificar, false);
            api.mostrarMensaje(mensajeDetalle, resultado.mensaje, 'success');
        } catch (error) {
            api.mostrarMensaje(mensajeDetalle, error.message, 'error');
            alternarModal(modalCalificar, false);
        }
    }

    /* -------------------------------------------------------------
    METODO PARA CERRAR MODALES MEDIANTE SUS BOTONES ESTANDARIZADOS
    ------------------------------------------------------------- */

    function manejarCierreModal(evento) {
        const boton = evento.target.closest('[data-cerrar-modal]');
        if (!boton) return;
        const modales = { curso: modalCurso, inscripcion: modalInscripcion, actividad: modalActividad, 'detalle-actividad': modalDetalleActividad, calificar: modalCalificar };
        alternarModal(modales[boton.dataset.cerrarModal], false);
    }

    document.addEventListener('perfil-cargado', (evento) => botonNuevoCurso.classList.toggle('hidden', evento.detail.tipo !== 'docente'));
    botonNuevoCurso.addEventListener('click', abrirNuevoCurso);
    materiaSelect.addEventListener('change', actualizarGruposCompatibles);
    document.getElementById('form-curso').addEventListener('submit', crearCurso);
    tablaCursos.addEventListener('click', manejarCurso);
    document.getElementById('confirmar-inscripcion').addEventListener('click', confirmarInscripcion);
    document.getElementById('volver-cursos').addEventListener('click', volverCursos);
    document.getElementById('nueva-actividad').addEventListener('click', abrirNuevaActividad);
    document.getElementById('agregar-rubrica').addEventListener('click', agregarRubrica);
    rubricasEditor.addEventListener('click', (evento) => evento.target.closest('[data-quitar-rubrica]')?.closest('.rubric-row').remove());
    document.getElementById('form-actividad').addEventListener('submit', guardarActividad);
    unidadesContenedor.addEventListener('click', (evento) => { const boton = evento.target.closest('[data-actividad-id]'); if (boton) abrirDetalleActividad(boton.dataset.actividadId); });
    tablaAlumnos.addEventListener('click', (evento) => { const boton = evento.target.closest('[data-calificar-alumno]'); if (boton) abrirCalificacion(boton.dataset.calificarAlumno); });
    document.getElementById('form-calificar').addEventListener('submit', guardarCalificacion);
    paginacion.addEventListener('click', (evento) => { const boton = evento.target.closest('[data-accion]'); if (!boton || boton.disabled) return; pagina += boton.dataset.accion === 'anterior' ? -1 : 1; cargar(); });
    document.addEventListener('click', manejarCierreModal);
    window.CursosDashboard = { cargar };
})();
