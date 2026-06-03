const { app, BrowserWindow } = require('electron');
const path = require('path');

/**
 * @param {string} nombreArchivo - El nombre del archivo HTML a cargar en la ventana.
 * @param {object} opciones - Opciones adicionales para la ventana.
 * @return {BrowserWindow} nuevaVentana - La instancia de la ventana creada.
 */

function crearVentana(nombreArchivo, opciones = {}) {
    const opcionesDefault = {
        width: 1200,
        height: 800,
        webPreferences: Object.assign ({
            nodeIntegration: false,
            contextIsolation: true,
            preload: path.join(__dirname, 'preload.js')
        }, webPreferences)
    };

    const configFinal = Object.assign({}, opcionesDefault, opciones);

    const nuevaVentana = new BrowserWindow(configFinal);
    nuevaVentana.loadFile(path.join(__dirname, `./interfaces/${nombreArchivo}`));
    
    return nuevaVentana;
}

app.whenReady().then(() => {
    crearVentana('ventanaInicio.html');

    app.on('activate', () => {
        if (BrowserWindow.getAllWindows().length === 0) {
            crearVentana('ventanaInicio.html');
        }
    });
});

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});