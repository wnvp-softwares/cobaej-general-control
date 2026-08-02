/* -------------------------------------------------------------
MODULO DE CICLO ACTIVO, MODULOS Y HORARIOS GENERALES
------------------------------------------------------------- */

(() => {
    const api = window.SiCEApi;
    const mensaje = document.getElementById('mensaje-horarios');
    const periodoEtiqueta = document.getElementById('periodo-activo-etiqueta');
    const administracion = document.getElementById('administracion-horarios');
    const configuracion = document.getElementById('configuracion-horarios');
    const alternarConfiguracion = document.getElementById('alternar-configuracion-horarios');
    const periodoSelect = document.getElementById('selector-periodo-activo');
    const activarPeriodoBtn = document.getElementById('activar-periodo');
    const formModulo = document.getElementById('form-modulo-horario');
    const moduloIdInput = document.getElementById('modulo-horario-id');
    const moduloNombreInput = document.getElementById('modulo-nombre');
    const moduloInicioInput = document.getElementById('modulo-inicio');
    const moduloFinInput = document.getElementById('modulo-fin');
    const moduloOrdenInput = document.getElementById('modulo-orden');
    const listaModulos = document.getElementById('lista-modulos-horario');
    const grupoSelect = document.getElementById('selector-grupo-horario');
    const campoAsignacion = document.getElementById('campo-asignacion-horario');
    const asignacionSelect = document.getElementById('selector-asignacion-horario');
    const campoAula = document.getElementById('campo-aula-horario');
    const aulaInput = document.getElementById('aula-horario');
    const contadores = document.getElementById('contadores-horario');
    const contadorDocente = document.getElementById('contador-docente-horario');
    const contadorMateria = document.getElementById('contador-materia-horario');
    const contenedorTabla = document.getElementById('contenedor-tabla-horario');
    let configuracionActual = null;
    let horarioActual = null;

    /* -------------------------------------------------------------
    METODO PARA FORMATEAR UNA HORA RECIBIDA DESDE POSTGRESQL
    ------------------------------------------------------------- */

    function formatearHora(valor) {
        return String(valor || '').slice(0, 5);
    }

    /* -------------------------------------------------------------
    METODO PARA OBTENER LA RELACION DOCENTE MATERIA SELECCIONADA
    ------------------------------------------------------------- */

    function obtenerAsignacionSeleccionada() {
        return horarioActual?.asignaciones.find((asignacion) => {
            return String(asignacion.docente_curso_id) === asignacionSelect.value;
        }) || null;
    }

    /* -------------------------------------------------------------
    METODO PARA RENDERIZAR LOS CICLOS ESCOLARES DISPONIBLES
    ------------------------------------------------------------- */

    function renderizarPeriodos() {
        periodoSelect.replaceChildren();
        (configuracionActual?.periodos || []).forEach((periodo) => {
            const opcion = document.createElement('option');
            opcion.value = periodo.id;
            opcion.textContent = periodo.nombre_ciclo;
            opcion.selected = Boolean(periodo.activo);
            periodoSelect.appendChild(opcion);
        });
    }

    /* -------------------------------------------------------------
    METODO PARA LIMPIAR EL FORMULARIO DE MODULOS
    ------------------------------------------------------------- */

    function limpiarEditorModulo() {
        formModulo.reset();
        moduloIdInput.value = '';
        const siguienteOrden = (configuracionActual?.modulos?.length || 0) + 1;
        moduloOrdenInput.value = siguienteOrden;
    }

    /* -------------------------------------------------------------
    METODO PARA CARGAR UN MODULO EXISTENTE DENTRO DEL EDITOR
    ------------------------------------------------------------- */

    function editarModulo(modulo) {
        moduloIdInput.value = modulo.id;
        moduloNombreInput.value = modulo.nombre;
        moduloInicioInput.value = formatearHora(modulo.hora_inicio);
        moduloFinInput.value = formatearHora(modulo.hora_fin);
        moduloOrdenInput.value = modulo.orden;
        moduloNombreInput.focus();
    }

    /* -------------------------------------------------------------
    METODO PARA RENDERIZAR LOS MODULOS CONFIGURADOS DEL CICLO ACTIVO
    ------------------------------------------------------------- */

    function renderizarModulos() {
        listaModulos.replaceChildren();
        const modulos = configuracionActual?.modulos || [];
        if (!modulos.length) {
            const aviso = document.createElement('p');
            aviso.className = 'private-value';
            aviso.textContent = 'Todavía no existen módulos para el ciclo activo.';
            listaModulos.appendChild(aviso);
            limpiarEditorModulo();
            return;
        }
        modulos.forEach((modulo) => {
            const tarjeta = document.createElement('article');
            const datos = document.createElement('div');
            const nombre = document.createElement('strong');
            const horario = document.createElement('small');
            const acciones = document.createElement('div');
            const editar = document.createElement('button');
            const eliminar = document.createElement('button');
            tarjeta.className = 'module-card';
            acciones.className = 'module-actions';
            nombre.textContent = `${modulo.orden}. ${modulo.nombre}`;
            horario.textContent = `${formatearHora(modulo.hora_inicio)} - ${formatearHora(modulo.hora_fin)}`;
            editar.type = 'button';
            editar.dataset.editarModulo = modulo.id;
            editar.title = 'Editar módulo';
            editar.innerHTML = '<i class="ri-edit-line"></i>';
            eliminar.type = 'button';
            eliminar.dataset.eliminarModulo = modulo.id;
            eliminar.title = 'Eliminar módulo';
            eliminar.innerHTML = '<i class="ri-delete-bin-line"></i>';
            datos.append(nombre, horario);
            acciones.append(editar, eliminar);
            tarjeta.append(datos, acciones);
            listaModulos.appendChild(tarjeta);
        });
        limpiarEditorModulo();
    }

    /* -------------------------------------------------------------
    METODO PARA RENDERIZAR LOS GRUPOS VISIBLES DEL CICLO ACTIVO
    ------------------------------------------------------------- */

    function renderizarGrupos() {
        const valorAnterior = grupoSelect.value;
        grupoSelect.replaceChildren();
        const grupos = configuracionActual?.grupos || [];
        if (!grupos.length) {
            const opcion = document.createElement('option');
            opcion.value = '';
            opcion.textContent = 'No hay grupo disponible';
            grupoSelect.appendChild(opcion);
            return;
        }
        grupos.forEach((grupo) => {
            const opcion = document.createElement('option');
            opcion.value = grupo.id;
            opcion.textContent = `${grupo.grado_semestre}° ${grupo.division}`;
            grupoSelect.appendChild(opcion);
        });
        if (grupos.some((grupo) => String(grupo.id) === valorAnterior)) {
            grupoSelect.value = valorAnterior;
        }
    }

    /* -------------------------------------------------------------
    METODO PARA RENDERIZAR LAS RELACIONES DOCENTE MATERIA DEL GRUPO
    ------------------------------------------------------------- */

    function renderizarAsignaciones() {
        asignacionSelect.replaceChildren();
        const inicial = document.createElement('option');
        inicial.value = '';
        inicial.textContent = 'Selecciona docente y materia';
        asignacionSelect.appendChild(inicial);
        (horarioActual?.asignaciones || []).forEach((asignacion) => {
            const opcion = document.createElement('option');
            opcion.value = asignacion.docente_curso_id;
            opcion.textContent = `${asignacion.materia} — ${asignacion.docente}`;
            opcion.disabled = asignacion.horas_restantes_docente <= 0
                || asignacion.horas_restantes_materia <= 0;
            asignacionSelect.appendChild(opcion);
        });
        actualizarContadores();
    }

    /* -------------------------------------------------------------
    METODO PARA ACTUALIZAR LOS CONTADORES DE HORAS RESTANTES
    ------------------------------------------------------------- */

    function actualizarContadores() {
        const asignacion = obtenerAsignacionSeleccionada();
        if (!asignacion) {
            contadores.classList.add('hidden');
            return;
        }
        contadorDocente.textContent = `${asignacion.horas_asignadas_docente} de ${asignacion.horas_disponibles} horas · ${asignacion.horas_restantes_docente} restantes`;
        contadorMateria.textContent = `${asignacion.horas_asignadas_materia} de ${asignacion.horas_semanales} horas · ${asignacion.horas_restantes_materia} restantes`;
        contadores.classList.remove('hidden');
    }

    /* -------------------------------------------------------------
    METODO PARA BUSCAR LA CLASE REGISTRADA EN UNA CELDA DEL GRUPO
    ------------------------------------------------------------- */

    function buscarCelda(dia, moduloId) {
        return horarioActual?.celdas.find((celda) => {
            return celda.dia_semana === dia
                && String(celda.modulo_horario_id) === String(moduloId);
        }) || null;
    }

    /* -------------------------------------------------------------
    METODO PARA BUSCAR UN CONFLICTO DEL DOCENTE EN OTRO GRUPO
    ------------------------------------------------------------- */

    function buscarConflictoDocente(asignacion, dia, moduloId) {
        if (!asignacion) return null;
        return horarioActual?.ocupacionesDocentes.find((ocupacion) => {
            return String(ocupacion.docente_id) === String(asignacion.docente_id)
                && ocupacion.dia_semana === dia
                && String(ocupacion.modulo_horario_id) === String(moduloId)
                && String(ocupacion.grupo_id) !== String(horarioActual.grupo.id);
        }) || null;
    }

    /* -------------------------------------------------------------
    METODO PARA CREAR EL CONTENIDO DE UNA CELDA OCUPADA
    ------------------------------------------------------------- */

    function crearClaseHorario(celda) {
        const contenido = document.createElement('div');
        const materia = document.createElement('strong');
        const docente = document.createElement('span');
        const aula = document.createElement('small');
        contenido.className = 'schedule-class';
        materia.textContent = celda.materia;
        docente.textContent = `Ocupada por: ${celda.docente}`;
        aula.textContent = celda.aula || 'Sin aula indicada';
        contenido.append(materia, docente, aula);
        return contenido;
    }

    /* -------------------------------------------------------------
    METODO PARA CREAR UNA CELDA LIBRE, OCUPADA O BLOQUEADA
    ------------------------------------------------------------- */

    function crearCeldaHorario(dia, modulo) {
        const contenedor = document.createElement('div');
        const horario = document.createElement('div');
        const nombreModulo = document.createElement('span');
        const rango = document.createElement('span');
        const celda = buscarCelda(dia, modulo.id);
        const asignacion = obtenerAsignacionSeleccionada();
        const conflicto = buscarConflictoDocente(asignacion, dia, modulo.id);
        contenedor.className = 'schedule-slot';
        horario.className = 'schedule-slot-time';
        nombreModulo.textContent = modulo.nombre;
        rango.textContent = `${formatearHora(modulo.hora_inicio)}-${formatearHora(modulo.hora_fin)}`;
        horario.append(nombreModulo, rango);
        contenedor.appendChild(horario);

        if (celda) {
            contenedor.classList.add('occupied');
            contenedor.style.setProperty('--subject-color', celda.color_hex || '#4F46E5');
            contenedor.appendChild(crearClaseHorario(celda));
            if (horarioActual.puedeEditar) {
                const eliminar = document.createElement('button');
                eliminar.type = 'button';
                eliminar.className = 'schedule-remove';
                eliminar.dataset.eliminarCelda = celda.id;
                eliminar.title = `Liberar celda ocupada por ${celda.docente}`;
                eliminar.innerHTML = '<i class="ri-close-line"></i>';
                contenedor.appendChild(eliminar);
            }
            return contenedor;
        }

        if (!horarioActual.puedeEditar) {
            const vacia = document.createElement('div');
            vacia.className = 'schedule-conflict';
            vacia.textContent = 'Sin clase';
            contenedor.appendChild(vacia);
            return contenedor;
        }
        if (conflicto) {
            const alerta = document.createElement('div');
            alerta.className = 'schedule-conflict';
            alerta.textContent = `Ocupada en otro horario: ${conflicto.grado_semestre}° ${conflicto.division} · ${conflicto.materia}`;
            contenedor.appendChild(alerta);
            return contenedor;
        }

        const boton = document.createElement('button');
        boton.type = 'button';
        boton.className = 'schedule-slot-button';
        boton.dataset.asignarDia = dia;
        boton.dataset.asignarModulo = modulo.id;
        boton.disabled = !asignacion;
        boton.textContent = asignacion ? '+ Asignar clase' : 'Selecciona docente y materia';
        contenedor.appendChild(boton);
        return contenedor;
    }

    /* -------------------------------------------------------------
    METODO PARA RENDERIZAR LA TABLA DINAMICA COMO COLUMNAS POR DIA
    ------------------------------------------------------------- */

    function renderizarTablaHorario() {
        contenedorTabla.replaceChildren();
        if (!horarioActual?.modulos?.length) {
            const aviso = document.createElement('p');
            aviso.className = 'app-message warning';
            aviso.textContent = 'Configura al menos un módulo de clase para construir el horario.';
            contenedorTabla.appendChild(aviso);
            return;
        }
        const tablero = document.createElement('div');
        tablero.className = 'schedule-board';
        horarioActual.dias.forEach((dia) => {
            const columna = document.createElement('section');
            const titulo = document.createElement('h3');
            columna.className = 'schedule-day';
            titulo.textContent = dia;
            columna.appendChild(titulo);
            horarioActual.modulos.forEach((modulo) => {
                columna.appendChild(crearCeldaHorario(dia, modulo));
            });
            tablero.appendChild(columna);
        });
        contenedorTabla.appendChild(tablero);
    }

    /* -------------------------------------------------------------
    METODO PARA CARGAR EL HORARIO DEL GRUPO SELECCIONADO
    ------------------------------------------------------------- */

    async function cargarHorarioGrupo() {
        if (!grupoSelect.value) {
            horarioActual = null;
            contenedorTabla.replaceChildren();
            return;
        }
        api.mostrarMensaje(mensaje, 'Cargando horario del grupo...', 'info');
        try {
            const { response, resultado } = await api.solicitarApi(`/horarios/grupos/${grupoSelect.value}`);
            if (!response.ok) throw new Error(resultado.mensaje || 'No fue posible cargar el horario');
            horarioActual = resultado;
            campoAsignacion.classList.toggle('hidden', !resultado.puedeEditar);
            campoAula.classList.toggle('hidden', !resultado.puedeEditar);
            renderizarAsignaciones();
            renderizarTablaHorario();
            api.ocultarMensaje(mensaje);
        } catch (error) {
            api.mostrarMensaje(mensaje, error.message, 'error');
        }
    }

    /* -------------------------------------------------------------
    METODO PARA CARGAR LA CONFIGURACION GENERAL DE HORARIOS
    ------------------------------------------------------------- */

    async function cargar() {
        api.mostrarMensaje(mensaje, 'Cargando ciclo activo y módulos...', 'info');
        try {
            const { response, resultado } = await api.solicitarApi('/horarios/configuracion');
            if (!response.ok) throw new Error(resultado.mensaje || 'No fue posible cargar los horarios');
            configuracionActual = resultado;
            periodoEtiqueta.textContent = resultado.periodoActivo?.nombre_ciclo || 'Sin ciclo activo';
            administracion.classList.toggle('hidden', !resultado.puedeAdministrar);
            renderizarPeriodos();
            renderizarModulos();
            renderizarGrupos();
            await cargarHorarioGrupo();
            if (!resultado.grupos.length) {
                api.mostrarMensaje(mensaje, 'No existe un grupo asociado al ciclo escolar activo.', 'warning');
            }
        } catch (error) {
            api.mostrarMensaje(mensaje, error.message, 'error');
        }
    }

    /* -------------------------------------------------------------
    METODO PARA ESTABLECER EL CICLO ESCOLAR SELECCIONADO COMO ACTIVO
    ------------------------------------------------------------- */

    async function activarPeriodo() {
        if (!periodoSelect.value) return;
        const opcion = periodoSelect.selectedOptions[0];
        if (!window.confirm(`¿Establecer ${opcion.textContent} como ciclo activo?`)) return;
        activarPeriodoBtn.disabled = true;
        try {
            const { response, resultado } = await api.solicitarApi('/horarios/periodo-activo', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ periodo_id: Number(periodoSelect.value) })
            });
            if (!response.ok) throw new Error(resultado.mensaje || 'No fue posible cambiar el ciclo activo');
            await cargar();
            api.mostrarMensaje(mensaje, resultado.mensaje, 'success');
        } catch (error) {
            api.mostrarMensaje(mensaje, error.message, 'error');
        } finally {
            activarPeriodoBtn.disabled = false;
        }
    }

    /* -------------------------------------------------------------
    METODO PARA CREAR O ACTUALIZAR UN MODULO DE CLASE
    ------------------------------------------------------------- */

    async function guardarModulo(evento) {
        evento.preventDefault();
        const id = moduloIdInput.value;
        const ruta = id ? `/horarios/modulos/${id}` : '/horarios/modulos';
        const metodo = id ? 'PATCH' : 'POST';
        try {
            const { response, resultado } = await api.solicitarApi(ruta, {
                method: metodo,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    nombre: moduloNombreInput.value.trim(),
                    hora_inicio: moduloInicioInput.value,
                    hora_fin: moduloFinInput.value,
                    orden: Number(moduloOrdenInput.value)
                })
            });
            if (!response.ok) throw new Error(resultado.mensaje || 'No fue posible guardar el módulo');
            await cargar();
            configuracion.classList.remove('hidden');
            api.mostrarMensaje(mensaje, resultado.mensaje, 'success');
        } catch (error) {
            api.mostrarMensaje(mensaje, error.message, 'error');
        }
    }

    /* -------------------------------------------------------------
    METODO PARA PROCESAR LA EDICION O ELIMINACION DE UN MODULO
    ------------------------------------------------------------- */

    async function manejarAccionModulo(evento) {
        const editar = evento.target.closest('[data-editar-modulo]');
        const eliminar = evento.target.closest('[data-eliminar-modulo]');
        if (editar) {
            const modulo = configuracionActual.modulos.find((item) => String(item.id) === editar.dataset.editarModulo);
            if (modulo) editarModulo(modulo);
            return;
        }
        if (!eliminar || !window.confirm('¿Eliminar este módulo de clase?')) return;
        try {
            const { response, resultado } = await api.solicitarApi(`/horarios/modulos/${eliminar.dataset.eliminarModulo}`, { method: 'DELETE' });
            if (!response.ok) throw new Error(resultado.mensaje || 'No fue posible eliminar el módulo');
            await cargar();
            configuracion.classList.remove('hidden');
            api.mostrarMensaje(mensaje, resultado.mensaje, 'success');
        } catch (error) {
            api.mostrarMensaje(mensaje, error.message, 'error');
        }
    }

    /* -------------------------------------------------------------
    METODO PARA ASIGNAR UNA RELACION DOCENTE MATERIA A UNA CELDA
    ------------------------------------------------------------- */

    async function asignarCelda(dia, moduloId) {
        const asignacion = obtenerAsignacionSeleccionada();
        if (!asignacion) return;
        try {
            const { response, resultado } = await api.solicitarApi(`/horarios/grupos/${grupoSelect.value}/celdas`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    dia_semana: dia,
                    modulo_horario_id: Number(moduloId),
                    docente_curso_id: Number(asignacion.docente_curso_id),
                    aula: aulaInput.value.trim()
                })
            });
            if (!response.ok) throw new Error(resultado.mensaje || 'No fue posible asignar la clase');
            await cargarHorarioGrupo();
            api.mostrarMensaje(mensaje, resultado.mensaje, 'success');
        } catch (error) {
            api.mostrarMensaje(mensaje, error.message, 'error');
        }
    }

    /* -------------------------------------------------------------
    METODO PARA LIBERAR UNA CELDA OCUPADA DEL HORARIO
    ------------------------------------------------------------- */

    async function eliminarCelda(id) {
        if (!window.confirm('¿Liberar esta celda del horario?')) return;
        try {
            const { response, resultado } = await api.solicitarApi(`/horarios/grupos/${grupoSelect.value}/celdas/${id}`, { method: 'DELETE' });
            if (!response.ok) throw new Error(resultado.mensaje || 'No fue posible liberar la celda');
            await cargarHorarioGrupo();
            api.mostrarMensaje(mensaje, resultado.mensaje, 'success');
        } catch (error) {
            api.mostrarMensaje(mensaje, error.message, 'error');
        }
    }

    /* -------------------------------------------------------------
    METODO PARA PROCESAR LAS ACCIONES DENTRO DE LA TABLA DE HORARIO
    ------------------------------------------------------------- */

    function manejarTabla(evento) {
        const asignar = evento.target.closest('[data-asignar-dia][data-asignar-modulo]');
        const eliminar = evento.target.closest('[data-eliminar-celda]');
        if (asignar) asignarCelda(asignar.dataset.asignarDia, asignar.dataset.asignarModulo);
        if (eliminar) eliminarCelda(eliminar.dataset.eliminarCelda);
    }

    /* -------------------------------------------------------------
    METODO PARA ACTUALIZAR LA TABLA AL CAMBIAR LA RELACION SELECCIONADA
    ------------------------------------------------------------- */

    function cambiarAsignacion() {
        actualizarContadores();
        renderizarTablaHorario();
    }

    /* -------------------------------------------------------------
    METODO PARA MOSTRAR U OCULTAR LA CONFIGURACION AVANZADA
    ------------------------------------------------------------- */

    function cambiarVisibilidadConfiguracion() {
        configuracion.classList.toggle('hidden');
    }

    alternarConfiguracion.addEventListener('click', cambiarVisibilidadConfiguracion);
    activarPeriodoBtn.addEventListener('click', activarPeriodo);
    formModulo.addEventListener('submit', guardarModulo);
    listaModulos.addEventListener('click', manejarAccionModulo);
    grupoSelect.addEventListener('change', cargarHorarioGrupo);
    asignacionSelect.addEventListener('change', cambiarAsignacion);
    contenedorTabla.addEventListener('click', manejarTabla);
    window.HorariosDashboard = { cargar };
})();
