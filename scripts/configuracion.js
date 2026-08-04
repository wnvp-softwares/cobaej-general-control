/* -------------------------------------------------------------
MODULO PARA ADMINISTRAR LA CONFIGURACION SENSIBLE DE LA CUENTA
------------------------------------------------------------- */

(() => {
    const api = window.SiCEApi;
    const formulario = document.getElementById('form-configuracion-cuenta');
    const mensaje = document.getElementById('mensaje-configuracion-cuenta');
    const correoInput = document.getElementById('config-correo');
    const controlCampo = document.getElementById('campo-config-control');
    const controlInput = document.getElementById('config-control');
    const claveDocenteCampo = document.getElementById('campo-config-clave-docente');
    const claveDocenteInput = document.getElementById('config-clave-docente');
    const cicloCampo = document.getElementById('campo-config-ciclo');
    const cicloSelect = document.getElementById('config-ciclo');
    const nuevaClaveInput = document.getElementById('config-nueva-clave');
    const confirmarClaveInput = document.getElementById('config-confirmar-clave');
    const claveActualInput = document.getElementById('config-clave-actual');
    const guardarBoton = document.getElementById('guardar-configuracion-cuenta');
    let configuracionActual = null;

    /* -------------------------------------------------------------
    METODO PARA RENDERIZAR LOS CAMPOS DISPONIBLES SEGUN EL TIPO DE CUENTA
    ------------------------------------------------------------- */

    function renderizarConfiguracion(configuracion) {
        configuracionActual = configuracion;
        const esAlumno = configuracion.tipo === 'alumno';
        correoInput.value = configuracion.correo || '';
        controlCampo.classList.toggle('hidden', !esAlumno);
        cicloCampo.classList.toggle('hidden', !esAlumno);
        claveDocenteCampo.classList.toggle('hidden', esAlumno);
        controlInput.value = esAlumno ? configuracion.numero_control || '' : '';
        claveDocenteInput.value = esAlumno ? '' : configuracion.clave_docente || '';
        cicloSelect.replaceChildren();
        (configuracion.periodos || []).forEach((periodo) => {
            const opcion = document.createElement('option');
            opcion.value = periodo.id;
            opcion.textContent = periodo.nombre_ciclo;
            opcion.selected = String(periodo.id) === String(configuracion.periodo_ingreso_id);
            cicloSelect.appendChild(opcion);
        });
        nuevaClaveInput.value = '';
        confirmarClaveInput.value = '';
        claveActualInput.value = '';
    }

    /* -------------------------------------------------------------
    METODO PARA CARGAR LA CONFIGURACION ACTUAL DESDE EL SERVIDOR
    ------------------------------------------------------------- */

    async function cargar() {
        api.mostrarMensaje(mensaje, 'Cargando configuración de la cuenta...', 'info');
        try {
            const { response, resultado } = await api.solicitarApi('/configuracion');
            if (!response.ok) throw new Error(resultado.mensaje || 'No fue posible cargar la configuración');
            renderizarConfiguracion(resultado);
            api.ocultarMensaje(mensaje);
        } catch (error) {
            api.mostrarMensaje(mensaje, error.message, 'error');
        }
    }

    /* -------------------------------------------------------------
    METODO PARA GUARDAR EL CONTEXTO TEMPORAL DE UNA NUEVA VERIFICACION
    ------------------------------------------------------------- */

    function prepararNuevaVerificacion(resultado) {
        sessionStorage.setItem('verificationToken', resultado.verificationToken);
        sessionStorage.setItem('verificationEmail', resultado.correo);
        sessionStorage.setItem('verificationType', resultado.tipo);
        sessionStorage.setItem('verificationRetryAfter', String(resultado.retryAfter || 0));
        sessionStorage.setItem('verificationStoredAt', String(Date.now()));
        localStorage.removeItem('token');
        localStorage.removeItem('usuario');
        localStorage.removeItem('tipo');
        localStorage.removeItem('id');
        window.location.href = './verification.html';
    }

    /* -------------------------------------------------------------
    METODO PARA ENVIAR LOS CAMBIOS SENSIBLES DE LA CUENTA
    ------------------------------------------------------------- */

    async function guardar(evento) {
        evento.preventDefault();
        if (nuevaClaveInput.value && nuevaClaveInput.value !== confirmarClaveInput.value) {
            api.mostrarMensaje(mensaje, 'Las nuevas contraseñas no coinciden', 'error');
            return;
        }
        const datos = {
            correo: correoInput.value.trim(),
            clave_actual: claveActualInput.value,
            nueva_clave: nuevaClaveInput.value,
            confirmar_clave: confirmarClaveInput.value
        };
        if (configuracionActual?.tipo === 'alumno') {
            datos.numero_control = controlInput.value.trim();
            datos.periodo_ingreso_id = Number(cicloSelect.value);
        } else {
            datos.clave_docente = claveDocenteInput.value.trim();
        }
        guardarBoton.disabled = true;
        try {
            const { response, resultado } = await api.solicitarApi('/configuracion', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(datos)
            });
            if (!response.ok) throw new Error(resultado.mensaje || 'No fue posible guardar la configuración');
            if (resultado.verificationRequired) {
                api.mostrarMensaje(mensaje, resultado.mensaje, 'warning');
                window.setTimeout(() => prepararNuevaVerificacion(resultado), 900);
                return;
            }
            await cargar();
            await window.SiCEApi.recargarPerfil?.();
            api.mostrarMensaje(mensaje, resultado.mensaje, 'success');
        } catch (error) {
            api.mostrarMensaje(mensaje, error.message, 'error');
        } finally {
            guardarBoton.disabled = false;
        }
    }

    formulario.addEventListener('submit', guardar);
    window.ConfiguracionDashboard = { cargar };
})();
