const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('api', {
    abrirNuevaVentana: (nombreArchivo) => ipcRenderer.send('abrir-nueva-ventana', nombreArchivo),
    cerrarPrograma: () => ipcRenderer.send('cerrar-programa'),
});