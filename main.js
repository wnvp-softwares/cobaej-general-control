const { app, BrowserWindow, Menu, ipcMain } = require('electron');
const path = require('path');

const db = require('./database/database.js')

/**
 * @param {string} nombreArchivo - El nombre del archivo HTML a cargar en la ventana.
 * @return {BrowserWindow} nuevaVentana - La instancia de la ventana creada.
 */
function crearVentana(nombreArchivo) {

    const config = {
        fullscreen: true,
        webPreferences: {
            nodeIntegration: false,
            contextIsolation: true,
            preload: path.join(__dirname, 'preload.js')
        }
    };

    const nuevaVentana = new BrowserWindow(config);

    nuevaVentana.setMenu(null);

    nuevaVentana.loadFile(path.join(__dirname, `./interfaces/${nombreArchivo}`));

    return nuevaVentana;
}

let cambiandoVista = false;

app.whenReady().then(() => {
    crearVentana('ventanaInicio.html');

    app.on('activate', () => {
        if (BrowserWindow.getAllWindows().length === 0) {
            crearVentana('ventanaInicio.html');
        }
    });
});

app.on('window-all-closed', () => {
    if (!cambiandoVista && process.platform !== 'darwin') {
        app.quit();
    }
});

// ===== MODELOS IPC =====
ipcMain.on('abrir-nueva-ventana', (event, nombreArchivo) => {
    cambiandoVista = true;
    
    crearVentana(nombreArchivo);

    const ventanaAnterior = BrowserWindow.fromWebContents(event.sender);

    if (ventanaAnterior) {
        ventanaAnterior.close();
    }

    cambiandoVista = false;
});

ipcMain.on('cerrar-programa', () => {
    app.quit();
});