/* -------------------------------------------------------------
VARIABLE GLOBAL
------------------------------------------------------------- */
const URL_BASE = 'https://cobaej-general-server.onrender.com/sicecobaej';
let token = '';
let tipo = '';
let usuario;

/* -------------------------------------------------------------
FUNCIONES GENERALES
------------------------------------------------------------- */
async function validarDatos(token, tipo, usuario) {
    if (!token || token.trim() === '' || !tipo || tipo.trim() === '' || !usuario) {
        window.location.href = '../login.html';
    }

    try {
        const response = await fetch(`${URL_BASE}/auth/verificar-token`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (response.ok) {
            const resultado = await response.json();
            console.log('Token verificado:', resultado.mensaje);

            localStorage.setItem('id', JSON.stringify(resultado.usuarioId));

            window.location.href = '../interfaces/dashboard.html';
        } else {
            throw new Error('Token invalido o expirado en el servidor');
        }
    } catch (error) {
        console.error('Error de autenticación:', error.message);

        localStorage.removeItem('token');
        localStorage.removeItem('usuario');
        localStorage.removeItem('tipo');

        window.location.href = './login.html';
    }

}

/* -------------------------------------------------------------
CARGA DEL DOM
------------------------------------------------------------- */
document.addEventListener('DOMContentLoaded', () => {
    token = localStorage.getItem('token');
    tipo = localStorage.getItem('tipo');
    usuario = JSON.parse(localStorage.getItem('usuario'));

    validarDatos(token, tipo, usuario);
});