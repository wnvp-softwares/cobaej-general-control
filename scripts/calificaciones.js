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
    METODO PARA CONSTRUIR LAS FILAS TABULARES DE UNA EXPORTACION
    ------------------------------------------------------------- */

    function construirFilasExportacion() {
        return kardexActual.filas.map((fila) => ([
            obtenerTextoDisponible(fila.periodo),
            obtenerTextoDisponible(fila.materia),
            `${obtenerTextoDisponible(fila.semestre)}° ${obtenerTextoDisponible(fila.grupo)}`,
            formatearCalificacion(fila.unidades[1]),
            formatearCalificacion(fila.unidades[2]),
            formatearCalificacion(fila.unidades[3]),
            formatearCalificacion(fila.general)
        ]));
    }

    /* -------------------------------------------------------------
    METODO PARA OBTENER EL ESTADO DESCRIPTIVO DEL KARDEX ACTUAL
    ------------------------------------------------------------- */

    function obtenerEstadoKardex() {
        const resumen = kardexActual.resumen || {};
        if (!kardexActual.filas.length) return 'Kardex parcial: todavía no hay materias inscritas.';
        if (resumen.parcial) {
            return `Kardex parcial: ${resumen.unidadesCalificadas || 0} de ${resumen.totalUnidades || 0} unidades calificadas.`;
        }
        return 'Kardex completo: todas las unidades cuentan con calificación.';
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
            .replace(/°/g, 'o')
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .replace(/[^\x20-\x7E]/g, '?')
            .replace(/\\/g, '\\\\')
            .replace(/\(/g, '\\(')
            .replace(/\)/g, '\\)');
    }

    /* -------------------------------------------------------------
    METODO PARA RECORTAR TEXTO SEGUN EL ESPACIO DISPONIBLE EN PDF
    ------------------------------------------------------------- */

    function recortarTextoPdf(texto, limite) {
        const disponible = obtenerTextoDisponible(texto);
        return disponible.length > limite
            ? `${disponible.slice(0, Math.max(1, limite - 3))}...`
            : disponible;
    }

    /* -------------------------------------------------------------
    METODO PARA AGREGAR TEXTO POSICIONADO AL CONTENIDO DE UN PDF
    ------------------------------------------------------------- */

    function agregarTextoPdf(instrucciones, texto, x, y, tamano = 9, negrita = false, color = '0.12 0.16 0.23') {
        instrucciones.push(
            `${color} rg`,
            'BT',
            `/${negrita ? 'F2' : 'F1'} ${tamano} Tf`,
            `${x} ${y} Td`,
            `(${normalizarTextoPdf(texto)}) Tj`,
            'ET'
        );
    }

    /* -------------------------------------------------------------
    METODO PARA DIBUJAR UNA PAGINA TABULAR DEL KARDEX EN PDF
    ------------------------------------------------------------- */

    function construirContenidoPaginaPdf(filas, paginaActual, totalPaginas) {
        const alumno = kardexActual.alumno || {};
        const columnas = [
            { titulo: 'Periodo', ancho: 128, limite: 21 },
            { titulo: 'Materia', ancho: 202, limite: 34 },
            { titulo: 'Sem./Grupo', ancho: 84, limite: 13 },
            { titulo: 'Unidad 1', ancho: 72, limite: 10 },
            { titulo: 'Unidad 2', ancho: 72, limite: 10 },
            { titulo: 'Unidad 3', ancho: 72, limite: 10 },
            { titulo: 'General', ancho: 90, limite: 12 }
        ];
        const instrucciones = [];
        const margen = 36;
        const tablaSuperior = 450;
        const altoEncabezado = 32;
        const altoFila = 30;
        const anchoTabla = columnas.reduce((total, columna) => total + columna.ancho, 0);
        const esParcial = !kardexActual.filas.length || kardexActual.resumen?.parcial;

        agregarTextoPdf(instrucciones, 'SiCECOBAEJ 65 - Kardex academico', margen, 566, 18, true);
        instrucciones.push(
            '0.38 0.45 0.96 RG',
            '2 w',
            `${margen} 552 m ${margen + anchoTabla} 552 l S`
        );
        agregarTextoPdf(instrucciones, `Nombre: ${obtenerTextoDisponible(alumno.nombre)}`, margen, 526, 10, true);
        agregarTextoPdf(instrucciones, `Correo: ${obtenerTextoDisponible(alumno.correo)}`, margen, 504, 9);
        agregarTextoPdf(instrucciones, `Numero de control: ${obtenerTextoDisponible(alumno.numero_control)}`, 420, 526, 10, true);
        agregarTextoPdf(instrucciones, `Ciclo de ingreso: ${alumno.periodoIngreso?.nombre_ciclo || 'Pendiente'}`, 420, 504, 9);
        agregarTextoPdf(
            instrucciones,
            obtenerEstadoKardex(),
            margen,
            474,
            9,
            true,
            esParcial ? '0.70 0.35 0.05' : '0.08 0.50 0.28'
        );

        const encabezadoInferior = tablaSuperior - altoEncabezado;
        instrucciones.push('0.08 0.13 0.23 rg', `${margen} ${encabezadoInferior} ${anchoTabla} ${altoEncabezado} re f`);
        let posicionX = margen;
        columnas.forEach((columna) => {
            agregarTextoPdf(instrucciones, columna.titulo, posicionX + 6, encabezadoInferior + 11, 8, true, '1 1 1');
            posicionX += columna.ancho;
        });

        if (!filas.length) {
            const inferior = encabezadoInferior - altoFila;
            instrucciones.push(
                '0.96 0.97 0.99 rg',
                `${margen} ${inferior} ${anchoTabla} ${altoFila} re f`,
                '0.78 0.82 0.88 RG',
                '0.5 w',
                `${margen} ${inferior} ${anchoTabla} ${altoFila} re S`
            );
            agregarTextoPdf(
                instrucciones,
                'Sin materias inscritas al momento de generar este documento.',
                margen + 12,
                inferior + 10,
                9
            );
        }
        filas.forEach((fila, indiceFila) => {
            const inferior = encabezadoInferior - ((indiceFila + 1) * altoFila);
            const colorFondo = indiceFila % 2 === 0 ? '0.96 0.97 0.99' : '1 1 1';
            instrucciones.push(
                `${colorFondo} rg`,
                `${margen} ${inferior} ${anchoTabla} ${altoFila} re f`,
                '0.78 0.82 0.88 RG',
                '0.5 w',
                `${margen} ${inferior} ${anchoTabla} ${altoFila} re S`
            );
            posicionX = margen;
            columnas.forEach((columna, indiceColumna) => {
                if (indiceColumna > 0) {
                    instrucciones.push(`${posicionX} ${inferior} m ${posicionX} ${inferior + altoFila} l S`);
                }
                agregarTextoPdf(
                    instrucciones,
                    recortarTextoPdf(fila[indiceColumna] || '', columna.limite),
                    posicionX + 6,
                    inferior + 10,
                    8,
                    indiceColumna === columnas.length - 1
                );
                posicionX += columna.ancho;
            });
        });

        agregarTextoPdf(instrucciones, `Pagina ${paginaActual} de ${totalPaginas}`, 680, 24, 8, false, '0.40 0.45 0.52');
        return instrucciones.join('\n');
    }

    /* -------------------------------------------------------------
    METODO PARA CONSTRUIR UN PDF NATIVO TABULAR SIN DEPENDENCIAS EXTERNAS
    ------------------------------------------------------------- */

    function construirPdfNativo(filas) {
        const filasPorPagina = 12;
        const paginas = [];
        for (let indice = 0; indice < filas.length; indice += filasPorPagina) {
            paginas.push(filas.slice(indice, indice + filasPorPagina));
        }
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
        const pdf = construirPdfNativo(construirFilasExportacion());
        descargarBlob(pdf, `${obtenerNombreArchivoKardex()}.pdf`);
    }

    /* -------------------------------------------------------------
    METODO PARA RECORTAR TEXTO SEGUN EL ANCHO DISPONIBLE EN CANVAS
    ------------------------------------------------------------- */

    function recortarTextoCanvas(contexto, texto, anchoMaximo) {
        const disponible = obtenerTextoDisponible(texto);
        if (contexto.measureText(disponible).width <= anchoMaximo) return disponible;
        let recortado = disponible;
        while (recortado.length > 1 && contexto.measureText(`${recortado}...`).width > anchoMaximo) {
            recortado = recortado.slice(0, -1);
        }
        return `${recortado}...`;
    }

    /* -------------------------------------------------------------
    METODO PARA DIBUJAR EL KARDEX COMO UNA TABLA ALINEADA EN CANVAS
    ------------------------------------------------------------- */

    function construirCanvasKardex() {
        const alumno = kardexActual.alumno || {};
        const filas = construirFilasExportacion();
        const columnas = [
            { titulo: 'PERIODO', ancho: 310 },
            { titulo: 'MATERIA', ancho: 420 },
            { titulo: 'SEM./GRUPO', ancho: 190 },
            { titulo: 'UNIDAD 1', ancho: 160 },
            { titulo: 'UNIDAD 2', ancho: 160 },
            { titulo: 'UNIDAD 3', ancho: 160 },
            { titulo: 'GENERAL', ancho: 190 }
        ];
        const ancho = 1800;
        const margen = 105;
        const tablaSuperior = 330;
        const altoEncabezado = 70;
        const altoFila = 72;
        const filasDibujadas = Math.max(1, filas.length);
        const alto = Math.max(900, tablaSuperior + altoEncabezado + (filasDibujadas * altoFila) + 110);
        const anchoTabla = columnas.reduce((total, columna) => total + columna.ancho, 0);
        const esParcial = !filas.length || kardexActual.resumen?.parcial;
        const canvas = document.createElement('canvas');
        canvas.width = ancho;
        canvas.height = alto;
        const contexto = canvas.getContext('2d');
        contexto.fillStyle = '#ffffff';
        contexto.fillRect(0, 0, ancho, alto);

        contexto.fillStyle = '#1e293b';
        contexto.font = 'bold 52px Arial';
        contexto.textAlign = 'left';
        contexto.textBaseline = 'middle';
        contexto.fillText('SiCECOBAEJ 65 - Kardex académico', margen, 78);
        contexto.fillStyle = '#6366f1';
        contexto.fillRect(margen, 118, anchoTabla, 5);

        contexto.fillStyle = '#64748b';
        contexto.font = '22px Arial';
        contexto.fillText('NOMBRE', margen, 162);
        contexto.fillText('CORREO', margen, 220);
        contexto.fillText('NÚMERO DE CONTROL', 1010, 162);
        contexto.fillText('CICLO DE INGRESO', 1010, 220);
        contexto.fillStyle = '#1e293b';
        contexto.font = 'bold 28px Arial';
        contexto.fillText(recortarTextoCanvas(contexto, alumno.nombre, 700), margen, 192);
        contexto.font = '26px Arial';
        contexto.fillText(recortarTextoCanvas(contexto, alumno.correo, 700), margen, 250);
        contexto.font = 'bold 28px Arial';
        contexto.fillText(obtenerTextoDisponible(alumno.numero_control), 1010, 192);
        contexto.font = '26px Arial';
        contexto.fillText(alumno.periodoIngreso?.nombre_ciclo || 'Pendiente', 1010, 250);

        contexto.fillStyle = esParcial ? '#fff7ed' : '#ecfdf5';
        contexto.fillRect(margen, 278, anchoTabla, 42);
        contexto.fillStyle = esParcial ? '#c2410c' : '#047857';
        contexto.font = 'bold 21px Arial';
        contexto.fillText(obtenerEstadoKardex(), margen + 18, 299);

        contexto.fillStyle = '#172033';
        contexto.fillRect(margen, tablaSuperior, anchoTabla, altoEncabezado);
        let posicionX = margen;
        columnas.forEach((columna, indiceColumna) => {
            contexto.fillStyle = '#ffffff';
            contexto.font = 'bold 21px Arial';
            contexto.textAlign = indiceColumna < 2 ? 'left' : 'center';
            const textoX = indiceColumna < 2
                ? posicionX + 18
                : posicionX + (columna.ancho / 2);
            contexto.fillText(columna.titulo, textoX, tablaSuperior + (altoEncabezado / 2));
            posicionX += columna.ancho;
        });

        if (!filas.length) {
            const posicionY = tablaSuperior + altoEncabezado;
            contexto.fillStyle = '#f8fafc';
            contexto.fillRect(margen, posicionY, anchoTabla, altoFila);
            contexto.strokeStyle = '#cbd5e1';
            contexto.lineWidth = 2;
            contexto.strokeRect(margen, posicionY, anchoTabla, altoFila);
            contexto.fillStyle = '#475569';
            contexto.font = '22px Arial';
            contexto.textAlign = 'center';
            contexto.fillText(
                'Sin materias inscritas al momento de generar este documento.',
                margen + (anchoTabla / 2),
                posicionY + (altoFila / 2)
            );
        }
        filas.forEach((fila, indiceFila) => {
            const posicionY = tablaSuperior + altoEncabezado + (indiceFila * altoFila);
            contexto.fillStyle = indiceFila % 2 === 0 ? '#f8fafc' : '#ffffff';
            contexto.fillRect(margen, posicionY, anchoTabla, altoFila);
            contexto.strokeStyle = '#cbd5e1';
            contexto.lineWidth = 2;
            contexto.strokeRect(margen, posicionY, anchoTabla, altoFila);
            posicionX = margen;
            columnas.forEach((columna, indiceColumna) => {
                if (indiceColumna > 0) {
                    contexto.beginPath();
                    contexto.moveTo(posicionX, posicionY);
                    contexto.lineTo(posicionX, posicionY + altoFila);
                    contexto.stroke();
                }
                contexto.fillStyle = '#1e293b';
                contexto.font = indiceColumna === columnas.length - 1
                    ? 'bold 23px Arial'
                    : '22px Arial';
                contexto.textAlign = indiceColumna < 2 ? 'left' : 'center';
                const textoX = indiceColumna < 2
                    ? posicionX + 18
                    : posicionX + (columna.ancho / 2);
                contexto.fillText(
                    recortarTextoCanvas(contexto, fila[indiceColumna] || '', columna.ancho - 32),
                    textoX,
                    posicionY + (altoFila / 2)
                );
                posicionX += columna.ancho;
            });
        });

        contexto.fillStyle = '#64748b';
        contexto.font = '18px Arial';
        contexto.textAlign = 'right';
        contexto.fillText('Documento generado por SiCECOBAEJ 65', margen + anchoTabla, alto - 45);
        return canvas;
    }

    /* -------------------------------------------------------------
    METODO PARA EXPORTAR EL CANVAS TABULAR COMO PNG O JPG
    ------------------------------------------------------------- */

    function exportarImagen(formato) {
        const canvas = construirCanvasKardex();
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
