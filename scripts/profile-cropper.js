/* -------------------------------------------------------------
DEFINICION DE VARIABLES DEL RECORTADOR
------------------------------------------------------------- */

const modalRecorte = document.getElementById('modal-recorte');
const lienzoRecorte = document.getElementById('lienzo-recorte');
const contextoRecorte = lienzoRecorte.getContext('2d');
const zoomRecorte = document.getElementById('zoom-recorte');
const aplicarRecorteBtn = document.getElementById('aplicar-recorte');
const cancelarRecorteBtn = document.getElementById('cancelar-recorte');
const cerrarRecorteBtn = document.getElementById('cerrar-recorte');

const TAMANO_SALIDA = 800;

let imagenRecorte = null;
let escalaBase = 1;
let nivelZoom = 1;
let desplazamientoX = 0;
let desplazamientoY = 0;
let arrastrandoImagen = false;
let puntoAnteriorX = 0;
let puntoAnteriorY = 0;
let resolverRecorte = null;
let urlImagenRecorte = null;
let elementoFocoAnterior = null;
let sesionRecorte = 0;

/* -------------------------------------------------------------
METODO PARA LIMITAR UN VALOR ENTRE UN MINIMO Y UN MAXIMO
------------------------------------------------------------- */

function limitarValor(valor, minimo, maximo) {
    return Math.min(Math.max(valor, minimo), maximo);
}

/* -------------------------------------------------------------
METODO PARA CALCULAR LA ESCALA ACTUAL DE LA IMAGEN
------------------------------------------------------------- */

function obtenerEscalaActual() {
    return escalaBase * nivelZoom;
}

/* -------------------------------------------------------------
METODO PARA EVITAR QUE EL RECORTE MUESTRE ESPACIOS VACIOS
------------------------------------------------------------- */

function limitarDesplazamiento() {
    if (!imagenRecorte) return;

    const escala = obtenerEscalaActual();
    const anchoImagen = imagenRecorte.naturalWidth * escala;
    const altoImagen = imagenRecorte.naturalHeight * escala;
    const limiteX = Math.max(0, (anchoImagen - lienzoRecorte.width) / 2);
    const limiteY = Math.max(0, (altoImagen - lienzoRecorte.height) / 2);

    desplazamientoX = limitarValor(desplazamientoX, -limiteX, limiteX);
    desplazamientoY = limitarValor(desplazamientoY, -limiteY, limiteY);
}

/* -------------------------------------------------------------
METODO PARA DIBUJAR LA VISTA PREVIA DEL RECORTE
------------------------------------------------------------- */

function dibujarRecorte() {
    contextoRecorte.clearRect(
        0,
        0,
        lienzoRecorte.width,
        lienzoRecorte.height
    );

    if (!imagenRecorte) return;

    limitarDesplazamiento();

    const escala = obtenerEscalaActual();
    const anchoImagen = imagenRecorte.naturalWidth * escala;
    const altoImagen = imagenRecorte.naturalHeight * escala;
    const posicionX = ((lienzoRecorte.width - anchoImagen) / 2)
        + desplazamientoX;
    const posicionY = ((lienzoRecorte.height - altoImagen) / 2)
        + desplazamientoY;

    contextoRecorte.drawImage(
        imagenRecorte,
        posicionX,
        posicionY,
        anchoImagen,
        altoImagen
    );
}

/* -------------------------------------------------------------
METODO PARA CONVERTIR LAS COORDENADAS VISUALES AL TAMAÑO DEL LIENZO
------------------------------------------------------------- */

function obtenerFactorVisual() {
    const rectangulo = lienzoRecorte.getBoundingClientRect();

    return {
        x: lienzoRecorte.width / rectangulo.width,
        y: lienzoRecorte.height / rectangulo.height
    };
}

/* -------------------------------------------------------------
METODO PARA INICIAR EL ARRASTRE DE LA IMAGEN
------------------------------------------------------------- */

function iniciarArrastre(evento) {
    if (!imagenRecorte) return;

    arrastrandoImagen = true;
    puntoAnteriorX = evento.clientX;
    puntoAnteriorY = evento.clientY;
    lienzoRecorte.setPointerCapture(evento.pointerId);
    lienzoRecorte.classList.add('dragging');
}

/* -------------------------------------------------------------
METODO PARA MOVER LA IMAGEN DURANTE EL ARRASTRE
------------------------------------------------------------- */

function moverImagen(evento) {
    if (!arrastrandoImagen || !imagenRecorte) return;

    const factor = obtenerFactorVisual();
    desplazamientoX += (evento.clientX - puntoAnteriorX) * factor.x;
    desplazamientoY += (evento.clientY - puntoAnteriorY) * factor.y;
    puntoAnteriorX = evento.clientX;
    puntoAnteriorY = evento.clientY;

    dibujarRecorte();
}

/* -------------------------------------------------------------
METODO PARA FINALIZAR EL ARRASTRE DE LA IMAGEN
------------------------------------------------------------- */

function finalizarArrastre() {
    arrastrandoImagen = false;
    lienzoRecorte.classList.remove('dragging');
}

/* -------------------------------------------------------------
METODO PARA CAMBIAR EL NIVEL DE ACERCAMIENTO DEL RECORTE
------------------------------------------------------------- */

function cambiarZoom() {
    nivelZoom = Number(zoomRecorte.value);
    dibujarRecorte();
}

/* -------------------------------------------------------------
METODO PARA CARGAR UN ARCHIVO COMO IMAGEN DEL NAVEGADOR
------------------------------------------------------------- */

function cargarImagen(archivo) {
    return new Promise((resolve, reject) => {
        const imagen = new Image();
        urlImagenRecorte = URL.createObjectURL(archivo);

        imagen.onload = () => resolve(imagen);
        imagen.onerror = () => reject(
            new Error('No fue posible abrir la imagen seleccionada')
        );
        imagen.src = urlImagenRecorte;
    });
}

/* -------------------------------------------------------------
METODO PARA LIMPIAR LOS RECURSOS TEMPORALES DEL RECORTADOR
------------------------------------------------------------- */

function limpiarRecortador() {
    sesionRecorte += 1;

    if (urlImagenRecorte) {
        URL.revokeObjectURL(urlImagenRecorte);
        urlImagenRecorte = null;
    }

    imagenRecorte = null;
    arrastrandoImagen = false;
    contextoRecorte.clearRect(
        0,
        0,
        lienzoRecorte.width,
        lienzoRecorte.height
    );
}

/* -------------------------------------------------------------
METODO PARA CERRAR EL RECORTADOR Y RESOLVER SU RESULTADO
------------------------------------------------------------- */

function cerrarRecortador(resultado) {
    modalRecorte.classList.add('hidden');
    document.body.classList.remove('modal-open');
    limpiarRecortador();

    if (resolverRecorte) {
        const resolver = resolverRecorte;
        resolverRecorte = null;
        resolver(resultado);
    }

    if (elementoFocoAnterior) {
        elementoFocoAnterior.focus();
        elementoFocoAnterior = null;
    }
}

/* -------------------------------------------------------------
METODO PARA CANCELAR EL RECORTE SIN MODIFICAR LA IMAGEN
------------------------------------------------------------- */

function cancelarRecorte() {
    cerrarRecortador(null);
}

/* -------------------------------------------------------------
METODO PARA GENERAR UN BLOB A PARTIR DEL LIENZO DE SALIDA
------------------------------------------------------------- */

function generarBlob(lienzo, formato, calidad) {
    return new Promise((resolve) => {
        lienzo.toBlob(resolve, formato, calidad);
    });
}

/* -------------------------------------------------------------
METODO PARA GENERAR EL ARCHIVO CUADRADO DEFINITIVO
------------------------------------------------------------- */

async function crearArchivoRecortado() {
    if (!imagenRecorte) return null;

    const lienzoSalida = document.createElement('canvas');
    const contextoSalida = lienzoSalida.getContext('2d');
    const proporcionSalida = TAMANO_SALIDA / lienzoRecorte.width;
    const escalaSalida = obtenerEscalaActual() * proporcionSalida;
    const anchoImagen = imagenRecorte.naturalWidth * escalaSalida;
    const altoImagen = imagenRecorte.naturalHeight * escalaSalida;
    const posicionX = ((TAMANO_SALIDA - anchoImagen) / 2)
        + (desplazamientoX * proporcionSalida);
    const posicionY = ((TAMANO_SALIDA - altoImagen) / 2)
        + (desplazamientoY * proporcionSalida);

    lienzoSalida.width = TAMANO_SALIDA;
    lienzoSalida.height = TAMANO_SALIDA;
    contextoSalida.drawImage(
        imagenRecorte,
        posicionX,
        posicionY,
        anchoImagen,
        altoImagen
    );

    let blob = await generarBlob(lienzoSalida, 'image/webp', 0.9);
    let extension = blob?.type === 'image/webp' ? 'webp' : 'png';

    if (!blob) {
        blob = await generarBlob(lienzoSalida, 'image/png', 1);
        extension = 'png';
    }

    if (!blob) {
        throw new Error('No fue posible generar la imagen recortada');
    }

    return new File(
        [blob],
        `perfil-${Date.now()}.${extension}`,
        {
            type: blob.type,
            lastModified: Date.now()
        }
    );
}

/* -------------------------------------------------------------
METODO PARA APLICAR EL RECORTE SELECCIONADO
------------------------------------------------------------- */

async function aplicarRecorte() {
    const textoOriginal = aplicarRecorteBtn.innerHTML;
    aplicarRecorteBtn.disabled = true;
    cancelarRecorteBtn.disabled = true;
    aplicarRecorteBtn.textContent = 'Procesando...';

    try {
        const archivo = await crearArchivoRecortado();
        cerrarRecortador(archivo);
    } catch (error) {
        console.error('Error al aplicar el recorte:\n', error.message);
        cerrarRecortador(null);
    } finally {
        aplicarRecorteBtn.innerHTML = textoOriginal;
        aplicarRecorteBtn.disabled = false;
        cancelarRecorteBtn.disabled = false;
    }
}

/* -------------------------------------------------------------
METODO PARA ABRIR EL RECORTADOR CON UNA IMAGEN
------------------------------------------------------------- */

async function abrirRecortadorPerfil(archivo) {
    if (resolverRecorte) {
        cerrarRecortador(null);
    }

    elementoFocoAnterior = document.activeElement;
    modalRecorte.classList.remove('hidden');
    document.body.classList.add('modal-open');
    zoomRecorte.value = '1';
    nivelZoom = 1;
    desplazamientoX = 0;
    desplazamientoY = 0;
    const sesionActual = ++sesionRecorte;

    return new Promise((resolve) => {
        resolverRecorte = resolve;

        cargarImagen(archivo)
            .then((imagen) => {
                if (sesionActual !== sesionRecorte || !resolverRecorte) return;

                imagenRecorte = imagen;
                escalaBase = Math.max(
                    lienzoRecorte.width / imagenRecorte.naturalWidth,
                    lienzoRecorte.height / imagenRecorte.naturalHeight
                );
                dibujarRecorte();
                aplicarRecorteBtn.focus();
            })
            .catch((error) => {
                if (sesionActual !== sesionRecorte) return;

                console.error(
                    'Error al abrir el recortador:\n',
                    error.message
                );
                cerrarRecortador(null);
            });
    });
}

/* -------------------------------------------------------------
METODO PARA CANCELAR EL RECORTE MEDIANTE LA TECLA ESCAPE
------------------------------------------------------------- */

function manejarTeclaRecortador(evento) {
    if (evento.key === 'Escape' && !modalRecorte.classList.contains('hidden')) {
        cancelarRecorte();
    }
}

lienzoRecorte.addEventListener('pointerdown', iniciarArrastre);
lienzoRecorte.addEventListener('pointermove', moverImagen);
lienzoRecorte.addEventListener('pointerup', finalizarArrastre);
lienzoRecorte.addEventListener('pointercancel', finalizarArrastre);
zoomRecorte.addEventListener('input', cambiarZoom);
aplicarRecorteBtn.addEventListener('click', aplicarRecorte);
cancelarRecorteBtn.addEventListener('click', cancelarRecorte);
cerrarRecorteBtn.addEventListener('click', cancelarRecorte);
document.addEventListener('keydown', manejarTeclaRecortador);

window.recortarImagenPerfil = abrirRecortadorPerfil;
