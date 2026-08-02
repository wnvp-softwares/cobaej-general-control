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
    const accionesEdicion = document.getElementById('acciones-edicion-horario');
    const editarHorarioBtn = document.getElementById('editar-horario');
    const cancelarEdicionBtn = document.getElementById('cancelar-edicion-horario');
    const guardarHorarioBtn = document.getElementById('guardar-horario');
    const accionesExportacion = document.getElementById('acciones-exportacion-horario');
    let configuracionActual = null;
    let horarioActual = null;
    let celdasBorrador = [];
    let modoEdicion = false;
    let horarioModificado = false;

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
        const horasGrupoOriginalesDocente = horarioActual.celdas.filter((celda) => {
            return String(celda.docente_id) === String(asignacion.docente_id);
        }).length;
        const horasOtrosGrupos = Math.max(0, Number(asignacion.horas_asignadas_docente) - horasGrupoOriginalesDocente);
        const horasBorradorDocente = celdasBorrador.filter((celda) => {
            return String(celda.docente_id) === String(asignacion.docente_id);
        }).length;
        const horasBorradorMateria = celdasBorrador.filter((celda) => {
            return String(celda.curso_id) === String(asignacion.curso_id);
        }).length;
        const horasDocente = horasOtrosGrupos + horasBorradorDocente;
        contadorDocente.textContent = `${horasDocente} de ${asignacion.horas_disponibles} horas · ${Math.max(0, asignacion.horas_disponibles - horasDocente)} restantes`;
        contadorMateria.textContent = `${horasBorradorMateria} de ${asignacion.horas_semanales} horas · ${Math.max(0, asignacion.horas_semanales - horasBorradorMateria)} restantes`;
        contadores.classList.remove('hidden');
    }

    /* -------------------------------------------------------------
    METODO PARA BUSCAR LA CLASE REGISTRADA EN UNA CELDA DEL GRUPO
    ------------------------------------------------------------- */

    function buscarCelda(dia, moduloId) {
        return celdasBorrador.find((celda) => {
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
    METODO PARA CALCULAR LAS HORAS DEL DOCENTE FUERA DEL GRUPO ACTUAL
    ------------------------------------------------------------- */

    function obtenerHorasExternasDocente(asignacion) {
        const horasOriginalesGrupo = horarioActual.celdas.filter((celda) => {
            return String(celda.docente_id) === String(asignacion.docente_id);
        }).length;
        return Math.max(0, Number(asignacion.horas_asignadas_docente) - horasOriginalesGrupo);
    }

    /* -------------------------------------------------------------
    METODO PARA VALIDAR LOS LIMITES DEL BORRADOR ANTES DE AGREGAR UNA CLASE
    ------------------------------------------------------------- */

    function validarDisponibilidadBorrador(asignacion) {
        const horasDocenteGrupo = celdasBorrador.filter((celda) => {
            return String(celda.docente_id) === String(asignacion.docente_id);
        }).length;
        const horasMateria = celdasBorrador.filter((celda) => {
            return String(celda.curso_id) === String(asignacion.curso_id);
        }).length;
        if (obtenerHorasExternasDocente(asignacion) + horasDocenteGrupo >= Number(asignacion.horas_disponibles)) {
            return 'El docente ya alcanzó sus horas disponibles';
        }
        if (horasMateria >= Number(asignacion.horas_semanales)) {
            return 'La materia ya alcanzó sus horas semanales';
        }
        return null;
    }

    /* -------------------------------------------------------------
    METODO PARA ACTUALIZAR LOS CONTROLES VISIBLES DEL MODO DE EDICION
    ------------------------------------------------------------- */

    function actualizarModoEdicion() {
        const puedeEditar = Boolean(horarioActual?.puedeEditar);
        accionesEdicion.classList.toggle('hidden', !puedeEditar);
        editarHorarioBtn.classList.toggle('hidden', !puedeEditar || modoEdicion);
        cancelarEdicionBtn.classList.toggle('hidden', !puedeEditar || !modoEdicion);
        guardarHorarioBtn.classList.toggle('hidden', !puedeEditar || !modoEdicion);
        campoAsignacion.classList.toggle('hidden', !puedeEditar || !modoEdicion);
        campoAula.classList.toggle('hidden', !puedeEditar || !modoEdicion);
        grupoSelect.disabled = modoEdicion;
        guardarHorarioBtn.disabled = !horarioModificado;
        contenedorTabla.classList.toggle('editing', modoEdicion);
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
            if (celda.esBorrador) contenedor.classList.add('pending-add');
            contenedor.style.setProperty('--subject-color', celda.color_hex || '#4F46E5');
            contenedor.appendChild(crearClaseHorario(celda));
            if (modoEdicion) {
                const eliminar = document.createElement('button');
                eliminar.type = 'button';
                eliminar.className = 'schedule-remove';
                eliminar.dataset.quitarDia = dia;
                eliminar.dataset.quitarModulo = modulo.id;
                eliminar.title = `Quitar del borrador la celda ocupada por ${celda.docente}`;
                eliminar.innerHTML = '<i class="ri-close-line"></i>';
                contenedor.appendChild(eliminar);
            }
            return contenedor;
        }

        if (!modoEdicion) {
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
            celdasBorrador = [];
            modoEdicion = false;
            horarioModificado = false;
            contenedorTabla.replaceChildren();
            accionesEdicion.classList.add('hidden');
            accionesExportacion.classList.add('hidden');
            return;
        }
        api.mostrarMensaje(mensaje, 'Cargando horario del grupo...', 'info');
        try {
            const { response, resultado } = await api.solicitarApi(`/horarios/grupos/${grupoSelect.value}`);
            if (!response.ok) throw new Error(resultado.mensaje || 'No fue posible cargar el horario');
            horarioActual = resultado;
            celdasBorrador = resultado.celdas.map((celda) => ({ ...celda }));
            modoEdicion = false;
            horarioModificado = false;
            renderizarAsignaciones();
            actualizarModoEdicion();
            accionesExportacion.classList.toggle('hidden', !resultado.modulos.length);
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
    METODO PARA AGREGAR UNA RELACION DOCENTE MATERIA AL BORRADOR LOCAL
    ------------------------------------------------------------- */

    function asignarCelda(dia, moduloId) {
        const asignacion = obtenerAsignacionSeleccionada();
        if (!modoEdicion || !asignacion) return;
        const conflicto = buscarConflictoDocente(asignacion, dia, moduloId);
        if (conflicto) {
            api.mostrarMensaje(mensaje, `El docente está ocupado en ${conflicto.grado_semestre}° ${conflicto.division}`, 'warning');
            return;
        }
        const limite = validarDisponibilidadBorrador(asignacion);
        if (limite) {
            api.mostrarMensaje(mensaje, limite, 'warning');
            return;
        }
        celdasBorrador.push({
            id: `borrador-${Date.now()}-${dia}-${moduloId}`,
            dia_semana: dia,
            modulo_horario_id: Number(moduloId),
            docente_curso_id: Number(asignacion.docente_curso_id),
            docente_id: Number(asignacion.docente_id),
            curso_id: Number(asignacion.curso_id),
            materia: asignacion.materia,
            docente: asignacion.docente,
            color_hex: asignacion.color_hex,
            aula: aulaInput.value.trim(),
            esBorrador: true
        });
        horarioModificado = true;
        actualizarContadores();
        actualizarModoEdicion();
        renderizarTablaHorario();
        api.ocultarMensaje(mensaje);
    }

    /* -------------------------------------------------------------
    METODO PARA QUITAR UNA CELDA DEL BORRADOR LOCAL
    ------------------------------------------------------------- */

    function eliminarCelda(dia, moduloId) {
        if (!modoEdicion) return;
        celdasBorrador = celdasBorrador.filter((celda) => {
            return celda.dia_semana !== dia
                || String(celda.modulo_horario_id) !== String(moduloId);
        });
        horarioModificado = true;
        actualizarContadores();
        actualizarModoEdicion();
        renderizarTablaHorario();
    }

    /* -------------------------------------------------------------
    METODO PARA PROCESAR LAS ACCIONES DENTRO DE LA TABLA DE HORARIO
    ------------------------------------------------------------- */

    function manejarTabla(evento) {
        const asignar = evento.target.closest('[data-asignar-dia][data-asignar-modulo]');
        const eliminar = evento.target.closest('[data-quitar-dia][data-quitar-modulo]');
        if (asignar) asignarCelda(asignar.dataset.asignarDia, asignar.dataset.asignarModulo);
        if (eliminar) eliminarCelda(eliminar.dataset.quitarDia, eliminar.dataset.quitarModulo);
    }

    /* -------------------------------------------------------------
    METODO PARA INICIAR UNA SESION LOCAL DE EDICION DEL HORARIO
    ------------------------------------------------------------- */

    function iniciarEdicionHorario() {
        if (!horarioActual?.puedeEditar) return;
        celdasBorrador = horarioActual.celdas.map((celda) => ({ ...celda }));
        modoEdicion = true;
        horarioModificado = false;
        actualizarModoEdicion();
        renderizarTablaHorario();
        asignacionSelect.focus();
    }

    /* -------------------------------------------------------------
    METODO PARA CANCELAR LA SESION LOCAL Y RESTAURAR EL HORARIO GUARDADO
    ------------------------------------------------------------- */

    function cancelarEdicionHorario() {
        if (horarioModificado && !window.confirm('¿Descartar todos los cambios visuales del horario?')) return;
        celdasBorrador = horarioActual.celdas.map((celda) => ({ ...celda }));
        modoEdicion = false;
        horarioModificado = false;
        actualizarContadores();
        actualizarModoEdicion();
        renderizarTablaHorario();
        api.ocultarMensaje(mensaje);
    }

    /* -------------------------------------------------------------
    METODO PARA GUARDAR TODO EL BORRADOR DEL HORARIO EN UNA SOLA PETICION
    ------------------------------------------------------------- */

    async function guardarHorarioCompleto() {
        if (!modoEdicion || !horarioModificado) return;
        guardarHorarioBtn.disabled = true;
        try {
            const celdas = celdasBorrador.map((celda) => ({
                dia_semana: celda.dia_semana,
                modulo_horario_id: Number(celda.modulo_horario_id),
                docente_curso_id: Number(celda.docente_curso_id),
                aula: String(celda.aula || '').trim()
            }));
            const { response, resultado } = await api.solicitarApi(`/horarios/grupos/${grupoSelect.value}/celdas/lote`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ celdas })
            });
            if (!response.ok) throw new Error(resultado.mensaje || 'No fue posible guardar el horario completo');
            await cargarHorarioGrupo();
            api.mostrarMensaje(mensaje, resultado.mensaje, 'success');
        } catch (error) {
            api.mostrarMensaje(mensaje, error.message, 'error');
            guardarHorarioBtn.disabled = false;
        }
    }

    /* -------------------------------------------------------------
    METODO PARA ACTUALIZAR LA TABLA AL CAMBIAR LA RELACION SELECCIONADA
    ------------------------------------------------------------- */

    function cambiarAsignacion() {
        actualizarContadores();
        renderizarTablaHorario();
    }

    /* -------------------------------------------------------------
    METODO PARA OBTENER EL TEXTO RESUMIDO DE UNA CELDA PARA EXPORTACION
    ------------------------------------------------------------- */

    function obtenerLineasCeldaExportacion(celda) {
        if (!celda) return ['Sin clase'];
        return [
            celda.materia || 'Materia',
            celda.docente || 'Docente',
            celda.aula || 'Sin aula indicada'
        ];
    }

    /* -------------------------------------------------------------
    METODO PARA CONSTRUIR LAS FILAS TABULARES DEL HORARIO VISIBLE
    ------------------------------------------------------------- */

    function construirFilasHorario() {
        return (horarioActual?.modulos || []).map((modulo) => ({
            modulo,
            celdas: horarioActual.dias.map((dia) => buscarCelda(dia, modulo.id))
        }));
    }

    /* -------------------------------------------------------------
    METODO PARA DESCARGAR UN ARCHIVO GENERADO EN EL NAVEGADOR
    ------------------------------------------------------------- */

    function descargarBlob(blob, nombre) {
        const enlace = document.createElement('a');
        enlace.href = URL.createObjectURL(blob);
        enlace.download = nombre;
        document.body.appendChild(enlace);
        enlace.click();
        enlace.remove();
        window.setTimeout(() => URL.revokeObjectURL(enlace.href), 1000);
    }

    /* -------------------------------------------------------------
    METODO PARA GENERAR EL NOMBRE SEGURO DEL ARCHIVO DE HORARIO
    ------------------------------------------------------------- */

    function obtenerNombreArchivoHorario() {
        const grupo = `${horarioActual?.grupo?.grado_semestre || 'grupo'}-${horarioActual?.grupo?.division || ''}`;
        return `horario-${grupo}`.toLowerCase().replace(/[^a-z0-9-]+/g, '-');
    }

    /* -------------------------------------------------------------
    METODO PARA RECORTAR TEXTO SEGUN EL ANCHO DISPONIBLE EN CANVAS
    ------------------------------------------------------------- */

    function recortarTextoCanvas(contexto, texto, anchoMaximo) {
        const disponible = String(texto || '');
        if (contexto.measureText(disponible).width <= anchoMaximo) return disponible;
        let recortado = disponible;
        while (recortado.length > 1 && contexto.measureText(`${recortado}...`).width > anchoMaximo) {
            recortado = recortado.slice(0, -1);
        }
        return `${recortado}...`;
    }

    /* -------------------------------------------------------------
    METODO PARA CONSTRUIR UN CANVAS CON EL HORARIO EN FORMATO DE TABLA
    ------------------------------------------------------------- */

    function construirCanvasHorario() {
        const filas = construirFilasHorario();
        const anchoModulo = 250;
        const anchoDia = 300;
        const margen = 70;
        const anchoTabla = anchoModulo + (horarioActual.dias.length * anchoDia);
        const altoEncabezado = 72;
        const altoFila = 132;
        const tablaSuperior = 210;
        const canvas = document.createElement('canvas');
        canvas.width = anchoTabla + (margen * 2);
        canvas.height = Math.max(760, tablaSuperior + altoEncabezado + (Math.max(1, filas.length) * altoFila) + 80);
        const contexto = canvas.getContext('2d');
        contexto.fillStyle = '#ffffff';
        contexto.fillRect(0, 0, canvas.width, canvas.height);
        contexto.fillStyle = '#1e293b';
        contexto.font = 'bold 46px Arial';
        contexto.textAlign = 'left';
        contexto.textBaseline = 'middle';
        contexto.fillText('SiCECOBAEJ 65 - Horario general', margen, 60);
        contexto.fillStyle = '#6366f1';
        contexto.fillRect(margen, 100, anchoTabla, 5);
        contexto.fillStyle = '#475569';
        contexto.font = '24px Arial';
        contexto.fillText(`Ciclo: ${horarioActual.periodo?.nombre_ciclo || 'Sin ciclo'}`, margen, 145);
        contexto.fillText(`Grupo: ${horarioActual.grupo.grado_semestre}° ${horarioActual.grupo.division}`, margen, 178);

        const columnas = [{ titulo: 'MÓDULO', ancho: anchoModulo }]
            .concat(horarioActual.dias.map((dia) => ({ titulo: dia.toUpperCase(), ancho: anchoDia })));
        contexto.fillStyle = '#172033';
        contexto.fillRect(margen, tablaSuperior, anchoTabla, altoEncabezado);
        let posicionX = margen;
        columnas.forEach((columna) => {
            contexto.fillStyle = '#ffffff';
            contexto.font = 'bold 21px Arial';
            contexto.textAlign = 'center';
            contexto.fillText(columna.titulo, posicionX + (columna.ancho / 2), tablaSuperior + (altoEncabezado / 2));
            posicionX += columna.ancho;
        });

        filas.forEach((fila, indiceFila) => {
            const posicionY = tablaSuperior + altoEncabezado + (indiceFila * altoFila);
            contexto.fillStyle = indiceFila % 2 === 0 ? '#f8fafc' : '#ffffff';
            contexto.fillRect(margen, posicionY, anchoTabla, altoFila);
            contexto.strokeStyle = '#cbd5e1';
            contexto.lineWidth = 2;
            contexto.strokeRect(margen, posicionY, anchoTabla, altoFila);
            posicionX = margen;
            contexto.fillStyle = '#1e293b';
            contexto.font = 'bold 23px Arial';
            contexto.textAlign = 'center';
            contexto.fillText(fila.modulo.nombre, posicionX + (anchoModulo / 2), posicionY + 48);
            contexto.font = '20px Arial';
            contexto.fillStyle = '#64748b';
            contexto.fillText(`${formatearHora(fila.modulo.hora_inicio)} - ${formatearHora(fila.modulo.hora_fin)}`, posicionX + (anchoModulo / 2), posicionY + 82);
            posicionX += anchoModulo;
            fila.celdas.forEach((celda) => {
                contexto.beginPath();
                contexto.moveTo(posicionX, posicionY);
                contexto.lineTo(posicionX, posicionY + altoFila);
                contexto.stroke();
                const lineas = obtenerLineasCeldaExportacion(celda);
                lineas.forEach((linea, indiceLinea) => {
                    contexto.fillStyle = indiceLinea === 0 ? '#1e293b' : '#64748b';
                    contexto.font = indiceLinea === 0 ? 'bold 21px Arial' : '19px Arial';
                    contexto.textAlign = 'center';
                    contexto.fillText(
                        recortarTextoCanvas(contexto, linea, anchoDia - 28),
                        posicionX + (anchoDia / 2),
                        posicionY + 37 + (indiceLinea * 31)
                    );
                });
                posicionX += anchoDia;
            });
        });
        contexto.fillStyle = '#64748b';
        contexto.font = '18px Arial';
        contexto.textAlign = 'right';
        contexto.fillText('Documento generado por SiCECOBAEJ 65', margen + anchoTabla, canvas.height - 35);
        return canvas;
    }

    /* -------------------------------------------------------------
    METODO PARA NORMALIZAR TEXTO A CARACTERES COMPATIBLES CON PDF
    ------------------------------------------------------------- */

    function normalizarTextoPdf(texto) {
        return String(texto || '')
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .replace(/°/g, 'o')
            .replace(/[^\x20-\x7E]/g, '?')
            .replace(/\\/g, '\\\\')
            .replace(/\(/g, '\\(')
            .replace(/\)/g, '\\)');
    }

    /* -------------------------------------------------------------
    METODO PARA AGREGAR TEXTO POSICIONADO AL CONTENIDO DE UN PDF
    ------------------------------------------------------------- */

    function agregarTextoPdf(instrucciones, texto, x, y, tamano = 8, negrita = false, color = '0.12 0.16 0.23') {
        instrucciones.push(
            `${color} rg`, 'BT', `/${negrita ? 'F2' : 'F1'} ${tamano} Tf`,
            `${x} ${y} Td`, `(${normalizarTextoPdf(texto)}) Tj`, 'ET'
        );
    }

    /* -------------------------------------------------------------
    METODO PARA RECORTAR TEXTO A UNA LONGITUD SEGURA PARA EL PDF
    ------------------------------------------------------------- */

    function recortarTextoPdf(texto, limite) {
        const disponible = String(texto || '');
        return disponible.length > limite ? `${disponible.slice(0, Math.max(1, limite - 3))}...` : disponible;
    }

    /* -------------------------------------------------------------
    METODO PARA DIBUJAR UNA PAGINA TABULAR DEL HORARIO EN PDF
    ------------------------------------------------------------- */

    function construirContenidoPaginaPdf(filas, paginaActual, totalPaginas) {
        const instrucciones = [];
        const margen = 36;
        const anchoModulo = 105;
        const anchoDia = 123;
        const anchoTabla = anchoModulo + (horarioActual.dias.length * anchoDia);
        const tablaSuperior = 470;
        const altoEncabezado = 30;
        const altoFila = 57;
        agregarTextoPdf(instrucciones, 'SiCECOBAEJ 65 - Horario general', margen, 566, 18, true);
        instrucciones.push('0.38 0.45 0.96 RG', '2 w', `${margen} 552 m ${margen + anchoTabla} 552 l S`);
        agregarTextoPdf(instrucciones, `Ciclo: ${horarioActual.periodo?.nombre_ciclo || 'Sin ciclo'}`, margen, 526, 10, true);
        agregarTextoPdf(instrucciones, `Grupo: ${horarioActual.grupo.grado_semestre}o ${horarioActual.grupo.division}`, margen, 506, 10);
        instrucciones.push('0.08 0.13 0.23 rg', `${margen} ${tablaSuperior - altoEncabezado} ${anchoTabla} ${altoEncabezado} re f`);
        const columnas = [{ titulo: 'Modulo', ancho: anchoModulo }]
            .concat(horarioActual.dias.map((dia) => ({ titulo: dia, ancho: anchoDia })));
        let posicionX = margen;
        columnas.forEach((columna) => {
            agregarTextoPdf(instrucciones, columna.titulo, posicionX + 6, tablaSuperior - 19, 8, true, '1 1 1');
            posicionX += columna.ancho;
        });
        filas.forEach((fila, indiceFila) => {
            const inferior = tablaSuperior - altoEncabezado - ((indiceFila + 1) * altoFila);
            instrucciones.push(
                `${indiceFila % 2 === 0 ? '0.96 0.97 0.99' : '1 1 1'} rg`,
                `${margen} ${inferior} ${anchoTabla} ${altoFila} re f`,
                '0.78 0.82 0.88 RG', '0.5 w', `${margen} ${inferior} ${anchoTabla} ${altoFila} re S`
            );
            posicionX = margen;
            agregarTextoPdf(instrucciones, recortarTextoPdf(fila.modulo.nombre, 15), posicionX + 5, inferior + 34, 8, true);
            agregarTextoPdf(instrucciones, `${formatearHora(fila.modulo.hora_inicio)}-${formatearHora(fila.modulo.hora_fin)}`, posicionX + 5, inferior + 17, 7);
            posicionX += anchoModulo;
            fila.celdas.forEach((celda) => {
                instrucciones.push(`${posicionX} ${inferior} m ${posicionX} ${inferior + altoFila} l S`);
                obtenerLineasCeldaExportacion(celda).forEach((linea, indiceLinea) => {
                    agregarTextoPdf(instrucciones, recortarTextoPdf(linea, 20), posicionX + 5, inferior + 40 - (indiceLinea * 15), 7, indiceLinea === 0);
                });
                posicionX += anchoDia;
            });
        });
        agregarTextoPdf(instrucciones, `Pagina ${paginaActual} de ${totalPaginas}`, 685, 24, 8, false, '0.40 0.45 0.52');
        return instrucciones.join('\n');
    }

    /* -------------------------------------------------------------
    METODO PARA CONSTRUIR UN PDF NATIVO DE VARIAS PAGINAS
    ------------------------------------------------------------- */

    function construirPdfHorario() {
        const filas = construirFilasHorario();
        const paginas = [];
        for (let indice = 0; indice < filas.length; indice += 7) paginas.push(filas.slice(indice, indice + 7));
        if (!paginas.length) paginas.push([]);
        const objetos = [];
        const referenciasPaginas = [];
        objetos[1] = '<< /Type /Catalog /Pages 2 0 R >>';
        objetos[3] = '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>';
        objetos[4] = '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >>';
        paginas.forEach((pagina, indicePagina) => {
            const paginaId = 5 + (indicePagina * 2);
            const contenidoId = paginaId + 1;
            referenciasPaginas.push(`${paginaId} 0 R`);
            const contenido = construirContenidoPaginaPdf(pagina, indicePagina + 1, paginas.length);
            objetos[paginaId] = `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 792 612] /Resources << /Font << /F1 3 0 R /F2 4 0 R >> >> /Contents ${contenidoId} 0 R >>`;
            objetos[contenidoId] = `<< /Length ${contenido.length} >>\nstream\n${contenido}\nendstream`;
        });
        objetos[2] = `<< /Type /Pages /Kids [${referenciasPaginas.join(' ')}] /Count ${referenciasPaginas.length} >>`;
        let documento = '%PDF-1.4\n';
        const posiciones = [0];
        for (let id = 1; id < objetos.length; id += 1) {
            posiciones[id] = documento.length;
            documento += `${id} 0 obj\n${objetos[id]}\nendobj\n`;
        }
        const inicioXref = documento.length;
        documento += `xref\n0 ${objetos.length}\n0000000000 65535 f \n`;
        for (let id = 1; id < objetos.length; id += 1) documento += `${String(posiciones[id]).padStart(10, '0')} 00000 n \n`;
        documento += `trailer\n<< /Size ${objetos.length} /Root 1 0 R >>\nstartxref\n${inicioXref}\n%%EOF`;
        return new Blob([documento], { type: 'application/pdf' });
    }

    /* -------------------------------------------------------------
    METODO PARA EXPORTAR EL HORARIO EN EL FORMATO SELECCIONADO
    ------------------------------------------------------------- */

    async function exportarHorario(formato) {
        if (!horarioActual) return;
        if (formato === 'pdf') {
            descargarBlob(construirPdfHorario(), `${obtenerNombreArchivoHorario()}.pdf`);
            return;
        }
        const canvas = construirCanvasHorario();
        const blob = await new Promise((resolve) => {
            canvas.toBlob(resolve, formato === 'jpg' ? 'image/jpeg' : 'image/png', 0.94);
        });
        if (!blob) throw new Error('El navegador no pudo generar la imagen del horario');
        descargarBlob(blob, `${obtenerNombreArchivoHorario()}.${formato}`);
    }

    /* -------------------------------------------------------------
    METODO PARA PROCESAR LOS BOTONES DE EXPORTACION DEL HORARIO
    ------------------------------------------------------------- */

    async function manejarExportacion(evento) {
        const boton = evento.target.closest('[data-exportar-horario]');
        if (!boton) return;
        const botones = Array.from(accionesExportacion.querySelectorAll('[data-exportar-horario]'));
        botones.forEach((elemento) => { elemento.disabled = true; });
        try {
            await exportarHorario(boton.dataset.exportarHorario);
        } catch (error) {
            api.mostrarMensaje(mensaje, error.message, 'error');
        } finally {
            botones.forEach((elemento) => { elemento.disabled = false; });
        }
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
    editarHorarioBtn.addEventListener('click', iniciarEdicionHorario);
    cancelarEdicionBtn.addEventListener('click', cancelarEdicionHorario);
    guardarHorarioBtn.addEventListener('click', guardarHorarioCompleto);
    accionesExportacion.addEventListener('click', manejarExportacion);
    window.HorariosDashboard = { cargar };
})();
