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

================================================================================================================

***COMANDOS NECESARIOS A FUTURO***
- pnpm install *El equivalente a npm i / npm install*
- pnpm add -D electron@34.0.0 *Para la instalacion de la version especifica de electron*
- pnpm add better-sqlite3
- pnpm add @electron/rebuild
- pnpm approve-builds *Para la ejecucion de scripts post-instalacio de librerias*
- pnpm dlx @electron/rebuild *Runnear la primer rebuild y que el entorno de electron y sqlite se ejecuten de manera eficiente*
- pnpm install remixicon --save *Solo es para instalar el paquete de iconos y logotipos usados en el sistema*

================================================================================================================

## A dia de hoy, se han hecho cambios y avances no tan relevantes:
- **Creacion de estructura base, manteniendo contextos individuales sin exponer informacion para evitar filtrados**
- **Creacion de base de datos en SQLite a base de un script SQL anteriormente aprovado**
- **Se ha avanzado con las pantallas principales del sistema, o al menos, las primeras que verá el usuario** *Se está dando mucho enfoque en el UX*

- ***Se han tenido multiples problemas con instalaciones de terceros y frameworks, debido a los cambios en las tecnologias como npm, Node y pnpm, lo que vuelte todo docker, un kgadero***