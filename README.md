# COBAEJ General Control
Descripcion: Software de control escolar, administrativo y aspectos generales del COBAEJ TBC #65 en Estipac, Jalisco
*Este archivo sera usado como una vitacora de control de versiones, cambios, aspectos modificados y ambitos necesarios para el desarrollo adecuado del sistema*

**Descripcion de requisitos y necesidades en el desarrollo del sistema, al igual que la definicion de tecnologias a utiliza**

***REQUISITOS Y NECESIDADES***
- Control de docentes:
    - Creacion, modificacion y control en el manejo de docentes dentro del programa
    - Administracion de horas disponibles, clases, materias y notas
    - Manejo de informacion individual por y para cada docente
- Control de alumnos
    - Manejo de informacion de alumnado
    - Control de creacion, modificacion y demas aspectos en el ambito del alumnado
    - Direccion de alumnado en cuanto a año de ingreso e incremento automatico dependiendo del ciclo actual
- Control de ciclo escolar
- Creacion, control y manejo de horarios (tanto por grupos como por docente)
- Metodos de uso para software descentralizado y no distribuido
    - Control de versiones de la base de datos para distribucion y creacion de copias, aumentos, fusiones, etc.
- Control de materias
    - Horas semanales
    - Nombre y grupo
    - ? Se deberia agregar la posibilidad de manejar los planes de estudio dentro del propio sistema?

*Cualquier aspecto nuevo a agregar a los requerimentos sera agregado posterior a este comentario*

================================================================================================================

***TECNOLOGIAS A UTILIZAR***
- Lenguajes
    - HTML para interfaces
    - CSS para diseños y estilos
    - JavaScript para backend y scripts de funcionamiento
- Frameworks
    - Node JS como framework principal
    - Electron para control de interfaz
    - Electron Builder para empaquetado e instalacion
    - SQLite para bases de datos sin necesidad de creacion de API
- Terceros
    - GitHub para control de versiones, distribucion y empaquetado para multiples SO's
- Entorno de desarrollo
    - Windows 11
- Para que SO se tiene que empaquetar?
    - Windows 10 +
    - MacOs
    - Linux (solo para prevenir)