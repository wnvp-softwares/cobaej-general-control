const Database = require('better-sqlite3');
const fs = require('fs');
const path = require('path');

const dbPath = path.join(__dirname, 'cobaej_control.db');

const existeBD = fs.existsSync(dbPath);

const db = new Database(dbPath, { verbose: console.log });

function inicializarTablas() {
    try {
        const sqlScriptPath = path.join(__dirname, '../cobaej_control.sql');
        const sqlScript = fs.readFileSync(sqlScriptPath, 'utf-8');

        db.exec(sqlScript);
        console.log('Base de datos creada y archivo SQL inicializado con éxito por primera vez.');
    } catch (error) {
        console.error('Error al inicializar las tablas de la base de datos:\n', error);
    }
}

if (!existeBD) {
    inicializarTablas();
} else {
    console.log('Base de datos existente detectada. Conexión establecida sin re-ejecutar SQL.');
}

module.exports = db;