/* -------------------------------------------------------------
MODULO DE KARDEX, CONSULTA DE CALIFICACIONES Y EXPORTACIONES
------------------------------------------------------------- */

(() => {
    const api = window.SiCEApi;
    const mensaje = document.getElementById('mensaje-calificaciones');
    const tabla = document.getElementById('tabla-kardex');
    const selectorDocente = document.getElementById('selector-kardex-docente');
    const alumnoSelect = document.getElementById('alumno-kardex');
    const resumenAlumno = document.getElementById('resumen-alumno-kardex');
    const acciones = document.getElementById('acciones-kardex');
    let kardexActual = null;

    /* -------------------------------------------------------------
    METODO PARA FORMATEAR UNA CALIFICACION O MOSTRAR QUE SIGUE PENDIENTE
    ------------------------------------------------------------- */

    function formatearCalificacion(valor) {
        return valor === null || valor === undefined ? 'Pendiente' : Number(valor).toFixed(2);
    }

    /* -------------------------------------------------------------
    METODO PARA AGRUPAR LAS TRES UNIDADES DE CADA MATERIA EN UNA FILA
    ------------------------------------------------------------- */

    function agruparMaterias(registros) {
        const agrupadas = new Map();
        registros.forEach((registro) => {
            const clave = String(registro.inscripcion_materia_id);
            if (!agrupadas.has(clave)) {
                agrupadas.set(clave, {
                    periodo: registro.periodo,
                    materia: registro.materia,
                    semestre: registro.semestre,
                    grupo: registro.grupo,
                    unidades: {},
                    general: registro.calificacion_general
                });
            }
            agrupadas.get(clave).unidades[registro.unidad] = registro.calificacion_unidad;
        });
        return Array.from(agrupadas.values());
    }

    /* -------------------------------------------------------------
    METODO PARA MOSTRAR LA INFORMACION COMPLETA DEL ALUMNO DEL KARDEX
    ------------------------------------------------------------- */

    function renderizarResumenAlumno(alumno) {
        resumenAlumno.replaceChildren();
        const datos = [
            ['Nombre', alumno.nombre],
            ['Correo', alumno.correo],
            ['Número de control', alumno.numero_control],
            ['Ciclo de ingreso', alumno.periodoIngreso?.nombre_ciclo || 'Pendiente']
        ];
        datos.forEach(([etiqueta, valor]) => {
            const bloque = document.createElement('div');
            const titulo = document.createElement('small');
            const contenido = document.createElement('strong');
            titulo.textContent = etiqueta;
            contenido.textContent = valor;
            bloque.append(titulo, contenido);
            resumenAlumno.appendChild(bloque);
        });
        resumenAlumno.classList.remove('hidden');
    }

    /* -------------------------------------------------------------
    METODO PARA RENDERIZAR EL KARDEX AGRUPADO POR MATERIA Y UNIDAD
    ------------------------------------------------------------- */

    function renderizarKardex(kardex) {
        kardexActual = { ...kardex, filas: agruparMaterias(kardex.materias) };
        renderizarResumenAlumno(kardex.alumno);
        tabla.replaceChildren();
        if (!kardexActual.filas.length) {
            api.mostrarTablaVacia(tabla, 7, 'El alumno todavía no tiene materias inscritas.');
            acciones.classList.add('hidden');
            return;
        }
        kardexActual.filas.forEach((fila) => {
            const registro = document.createElement('tr');
            registro.appendChild(api.crearCelda(fila.periodo, 'Periodo'));
            registro.appendChild(api.crearCelda(fila.materia, 'Materia'));
            registro.appendChild(api.crearCelda(`${fila.semestre}° ${fila.grupo}`, 'Semestre y grupo'));
            registro.appendChild(api.crearCelda(formatearCalificacion(fila.unidades[1]), 'Unidad 1'));
            registro.appendChild(api.crearCelda(formatearCalificacion(fila.unidades[2]), 'Unidad 2'));
            registro.appendChild(api.crearCelda(formatearCalificacion(fila.unidades[3]), 'Unidad 3'));
            registro.appendChild(api.crearCelda(formatearCalificacion(fila.general), 'General', 'grade-value'));
            tabla.appendChild(registro);
        });
        acciones.classList.remove('hidden');
    }

    /* -------------------------------------------------------------
    METODO PARA SOLICITAR UN KARDEX PROPIO O SELECCIONADO POR DOCENTE
    ------------------------------------------------------------- */

    async function cargarKardex(alumnoId = null) {
        api.ocultarMensaje(mensaje);
        api.mostrarTablaVacia(tabla, 7, 'Cargando calificaciones...');
        const ruta = alumnoId
            ? `/calificaciones/kardex/alumnos/${alumnoId}`
            : '/calificaciones/kardex/propio';
        try {
            const { response, resultado } = await api.solicitarApi(ruta);
            if (!response.ok) throw new Error(resultado.mensaje || 'No fue posible cargar el kardex');
            renderizarKardex(resultado);
        } catch (error) {
            api.mostrarTablaVacia(tabla, 7, 'No fue posible cargar el kardex.');
            api.mostrarMensaje(mensaje, error.message, 'error');
        }
    }

    /* -------------------------------------------------------------
    METODO PARA CARGAR EL SELECTOR DE ALUMNOS RELACIONADOS CON EL DOCENTE
    ------------------------------------------------------------- */

    async function cargarAlumnosDocente() {
        const { response, resultado } = await api.solicitarApi('/calificaciones/kardex/alumnos');
        if (!response.ok) throw new Error(resultado.mensaje || 'No fue posible cargar los alumnos');
        alumnoSelect.replaceChildren();
        const inicial = document.createElement('option');
        inicial.value = '';
        inicial.textContent = 'Selecciona un alumno';
        alumnoSelect.appendChild(inicial);
        resultado.alumnos.forEach((alumno) => {
            const opcion = document.createElement('option');
            opcion.value = alumno.id;
            opcion.textContent = `${alumno.nombre} · ${alumno.numero_control}`;
            alumnoSelect.appendChild(opcion);
        });
    }

    /* -------------------------------------------------------------
    METODO PARA CARGAR LA VISTA DE CALIFICACIONES SEGUN EL ROL ACTUAL
    ------------------------------------------------------------- */

    async function cargar() {
        const perfil = api.obtenerPerfil();
        if (!perfil) return;
        kardexActual = null;
        acciones.classList.add('hidden');
        resumenAlumno.classList.add('hidden');
        if (perfil.tipo === 'docente') {
            selectorDocente.classList.remove('hidden');
            api.mostrarTablaVacia(tabla, 7, 'Selecciona un alumno para consultar su kardex.');
            try {
                await cargarAlumnosDocente();
            } catch (error) {
                api.mostrarMensaje(mensaje, error.message, 'error');
            }
        } else {
            selectorDocente.classList.add('hidden');
            await cargarKardex();
        }
    }

    /* -------------------------------------------------------------
    METODO PARA CONSTRUIR LAS LINEAS DE TEXTO DE UNA EXPORTACION
    ------------------------------------------------------------- */

    function construirLineasExportacion() {
        const alumno = kardexActual.alumno;
        const lineas = [
            'SiCECOBAEJ 65 - Kardex académico',
            `Nombre: ${alumno.nombre}`,
            `Correo: ${alumno.correo}`,
            `Número de control: ${alumno.numero_control}`,
            `Ciclo de ingreso: ${alumno.periodoIngreso?.nombre_ciclo || 'Pendiente'}`,
            '',
            'Periodo | Materia | Sem./Grupo | U1 | U2 | U3 | General'
        ];
        kardexActual.filas.forEach((fila) => lineas.push([
            fila.periodo,
            fila.materia,
            `${fila.semestre}° ${fila.grupo}`,
            formatearCalificacion(fila.unidades[1]),
            formatearCalificacion(fila.unidades[2]),
            formatearCalificacion(fila.unidades[3]),
            formatearCalificacion(fila.general)
        ].join(' | ')));
        return lineas;
    }

    /* -------------------------------------------------------------
    METODO PARA DESCARGAR UN BLOB GENERADO EN EL NAVEGADOR
    ------------------------------------------------------------- */

    function descargarBlob(blob, nombre) {
        const url = URL.createObjectURL(blob);
        const enlace = document.createElement('a');
        enlace.href = url;
        enlace.download = nombre;
        enlace.click();
        setTimeout(() => URL.revokeObjectURL(url), 1000);
    }

    /* -------------------------------------------------------------
    METODO PARA EXPORTAR EL KARDEX COMO PDF DE VARIAS PAGINAS
    ------------------------------------------------------------- */

    function exportarPdf() {
        const { jsPDF } = window.jspdf;
        const documento = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'letter' });
        const lineas = construirLineasExportacion();
        let y = 15;
        lineas.forEach((linea, indice) => {
            if (y > 195) { documento.addPage(); y = 15; }
            documento.setFont('helvetica', indice === 0 ? 'bold' : 'normal');
            documento.setFontSize(indice === 0 ? 16 : 9);
            const segmentos = documento.splitTextToSize(linea, 250);
            documento.text(segmentos, 14, y);
            y += segmentos.length * 5;
        });
        documento.save(`kardex-${kardexActual.alumno.numero_control}.pdf`);
    }

    /* -------------------------------------------------------------
    METODO PARA DIBUJAR EL KARDEX EN CANVAS Y EXPORTAR PNG O JPG
    ------------------------------------------------------------- */

    function exportarImagen(formato) {
        const lineas = construirLineasExportacion();
        const ancho = 1800;
        const alto = Math.max(800, 160 + lineas.length * 42);
        const canvas = document.createElement('canvas');
        canvas.width = ancho;
        canvas.height = alto;
        const contexto = canvas.getContext('2d');
        contexto.fillStyle = '#ffffff';
        contexto.fillRect(0, 0, ancho, alto);
        contexto.fillStyle = '#1e293b';
        contexto.font = '24px Arial';
        lineas.forEach((linea, indice) => {
            contexto.font = indice === 0 ? 'bold 38px Arial' : '24px Arial';
            contexto.fillText(linea, 60, 70 + indice * 42, ancho - 120);
        });
        canvas.toBlob((blob) => descargarBlob(
            blob,
            `kardex-${kardexActual.alumno.numero_control}.${formato}`
        ), formato === 'jpg' ? 'image/jpeg' : 'image/png', 0.94);
    }

    /* -------------------------------------------------------------
    METODO PARA PROCESAR EL FORMATO DE EXPORTACION SELECCIONADO
    ------------------------------------------------------------- */

    function manejarExportacion(evento) {
        const boton = evento.target.closest('[data-exportar]');
        if (!boton || !kardexActual) return;
        if (boton.dataset.exportar === 'pdf') exportarPdf();
        else exportarImagen(boton.dataset.exportar);
    }

    alumnoSelect.addEventListener('change', () => {
        if (alumnoSelect.value) cargarKardex(alumnoSelect.value);
        else {
            kardexActual = null;
            resumenAlumno.classList.add('hidden');
            acciones.classList.add('hidden');
            api.mostrarTablaVacia(tabla, 7, 'Selecciona un alumno para consultar su kardex.');
        }
    });
    acciones.addEventListener('click', manejarExportacion);
    window.CalificacionesDashboard = { cargar };
})();
