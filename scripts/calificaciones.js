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
        const calificacion = Number(valor);
        return valor === null || valor === undefined || !Number.isFinite(calificacion)
            ? 'Pendiente'
            : calificacion.toFixed(2);
    }

    /* -------------------------------------------------------------
    METODO PARA MOSTRAR UN TEXTO DISPONIBLE O UNA ETIQUETA PENDIENTE
    ------------------------------------------------------------- */

    function obtenerTextoDisponible(valor, pendiente = 'Pendiente') {
        const texto = String(valor ?? '').trim();
        return texto || pendiente;
    }

    /* -------------------------------------------------------------
    METODO PARA GENERAR UN NOMBRE DE ARCHIVO SEGURO PARA EL KARDEX
    ------------------------------------------------------------- */

    function obtenerNombreArchivoKardex() {
        const identificador = kardexActual?.alumno?.numero_control
            || kardexActual?.alumno?.id
            || 'sin-control';
        return `kardex-${String(identificador).replace(/[^a-zA-Z0-9_-]/g, '-')}`;
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
            ['Nombre', obtenerTextoDisponible(alumno.nombre)],
            ['Correo', obtenerTextoDisponible(alumno.correo)],
            ['Número de control', obtenerTextoDisponible(alumno.numero_control)],
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
        const materias = Array.isArray(kardex.materias) ? kardex.materias : [];
        kardexActual = { ...kardex, materias, filas: agruparMaterias(materias) };
        renderizarResumenAlumno(kardex.alumno || {});
        tabla.replaceChildren();
        if (!kardexActual.filas.length) {
            api.mostrarTablaVacia(
                tabla,
                7,
                'Todavía no hay materias inscritas. El kardex puede descargarse con la información disponible.'
            );
            acciones.classList.remove('hidden');
            api.mostrarMensaje(
                mensaje,
                'Este es un kardex parcial. Las materias y calificaciones faltantes aparecerán como pendientes.',
                'warning'
            );
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

        if (kardex.resumen?.parcial) {
            api.mostrarMensaje(
                mensaje,
                `Kardex parcial: ${kardex.resumen.unidadesCalificadas || 0} de ${kardex.resumen.totalUnidades || 0} unidades cuentan con calificación.`,
                'warning'
            );
        } else {
            api.ocultarMensaje(mensaje);
        }
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
        const alumno = kardexActual.alumno || {};
        const lineas = [
            'SiCECOBAEJ 65 - Kardex académico',
            `Nombre: ${obtenerTextoDisponible(alumno.nombre)}`,
            `Correo: ${obtenerTextoDisponible(alumno.correo)}`,
            `Número de control: ${obtenerTextoDisponible(alumno.numero_control)}`,
            `Ciclo de ingreso: ${alumno.periodoIngreso?.nombre_ciclo || 'Pendiente'}`,
            '',
            'Periodo | Materia | Sem./Grupo | U1 | U2 | U3 | General'
        ];
        if (!kardexActual.filas.length) {
            lineas.push('Sin materias inscritas al momento de generar este documento.');
        }
        kardexActual.filas.forEach((fila) => lineas.push([
            obtenerTextoDisponible(fila.periodo),
            obtenerTextoDisponible(fila.materia),
            `${obtenerTextoDisponible(fila.semestre)}° ${obtenerTextoDisponible(fila.grupo)}`,
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
        if (!(blob instanceof Blob)) {
            throw new Error('El navegador no pudo construir el archivo solicitado.');
        }
        const url = URL.createObjectURL(blob);
        const enlace = document.createElement('a');
        enlace.href = url;
        enlace.download = nombre;
        document.body.appendChild(enlace);
        enlace.click();
        enlace.remove();
        setTimeout(() => URL.revokeObjectURL(url), 1000);
    }

    /* -------------------------------------------------------------
    METODO PARA NORMALIZAR TEXTO A CARACTERES COMPATIBLES CON PDF
    ------------------------------------------------------------- */

    function normalizarTextoPdf(texto) {
        return String(texto)
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .replace(/[^\x20-\x7E]/g, '?')
            .replace(/\\/g, '\\\\')
            .replace(/\(/g, '\\(')
            .replace(/\)/g, '\\)');
    }

    /* -------------------------------------------------------------
    METODO PARA CONSTRUIR UN PDF NATIVO SIN DEPENDENCIAS EXTERNAS
    ------------------------------------------------------------- */

    function construirPdfNativo(lineas) {
        const lineasPorPagina = 24;
        const paginas = [];
        for (let indice = 0; indice < lineas.length; indice += lineasPorPagina) {
            paginas.push(lineas.slice(indice, indice + lineasPorPagina));
        }
        if (!paginas.length) paginas.push(['Kardex sin información disponible.']);

        const objetos = [];
        const referenciasPaginas = [];
        objetos[1] = '<< /Type /Catalog /Pages 2 0 R >>';
        objetos[3] = '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>';

        paginas.forEach((pagina, indicePagina) => {
            const paginaId = 4 + (indicePagina * 2);
            const contenidoId = paginaId + 1;
            referenciasPaginas.push(`${paginaId} 0 R`);
            const instrucciones = ['BT', '/F1 10 Tf', '40 570 Td'];
            pagina.forEach((linea, indiceLinea) => {
                if (indiceLinea > 0) instrucciones.push('0 -21 Td');
                instrucciones.push(`(${normalizarTextoPdf(linea)}) Tj`);
            });
            instrucciones.push('ET');
            const contenido = instrucciones.join('\n');
            objetos[paginaId] = `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 792 612] /Resources << /Font << /F1 3 0 R >> >> /Contents ${contenidoId} 0 R >>`;
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
        documento += `xref\n0 ${objetos.length}\n`;
        documento += '0000000000 65535 f \n';
        for (let id = 1; id < objetos.length; id += 1) {
            documento += `${String(posiciones[id]).padStart(10, '0')} 00000 n \n`;
        }
        documento += `trailer\n<< /Size ${objetos.length} /Root 1 0 R >>\n`;
        documento += `startxref\n${inicioXref}\n%%EOF`;
        return new Blob([documento], { type: 'application/pdf' });
    }

    /* -------------------------------------------------------------
    METODO PARA EXPORTAR EL KARDEX COMO PDF DE VARIAS PAGINAS
    ------------------------------------------------------------- */

    function exportarPdf() {
        const pdf = construirPdfNativo(construirLineasExportacion());
        descargarBlob(pdf, `${obtenerNombreArchivoKardex()}.pdf`);
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
        return new Promise((resolve, reject) => {
            canvas.toBlob((blob) => {
                if (!blob) {
                    reject(new Error('El navegador no pudo generar la imagen del kardex.'));
                    return;
                }
                descargarBlob(blob, `${obtenerNombreArchivoKardex()}.${formato}`);
                resolve();
            }, formato === 'jpg' ? 'image/jpeg' : 'image/png', 0.94);
        });
    }

    /* -------------------------------------------------------------
    METODO PARA PROCESAR EL FORMATO DE EXPORTACION SELECCIONADO
    ------------------------------------------------------------- */

    async function manejarExportacion(evento) {
        const boton = evento.target.closest('[data-exportar]');
        if (!boton || !kardexActual) return;
        const botones = Array.from(acciones.querySelectorAll('[data-exportar]'));
        botones.forEach((elemento) => { elemento.disabled = true; });
        try {
            if (boton.dataset.exportar === 'pdf') exportarPdf();
            else await exportarImagen(boton.dataset.exportar);
        } catch (error) {
            api.mostrarMensaje(
                mensaje,
                error.message || 'No fue posible generar el kardex.',
                'error'
            );
        } finally {
            botones.forEach((elemento) => { elemento.disabled = false; });
        }
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
