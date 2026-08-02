# SiCECOBAEJ 65 - Cliente

Cliente web estático construido con HTML, CSS y JavaScript. Utiliza Remix Icon y conserva módulos independientes para autenticación, verificación, dashboard, cursos y calificaciones.

## Funcionalidades actuales

- Registro, inicio de sesión y recuperación del flujo de verificación.
- Perfil propio con edición exclusiva de datos no sensibles.
- Listados paginados de docentes, alumnos y materias.
- Configuración académica inicial del alumno.
- Cursos por materia, grupo y periodo, con inscripción compatible.
- Tres unidades por curso, actividades, rúbricas y materiales de apoyo.
- Captura docente de calificaciones y normalización sobre 100.
- Kardex parcial o completo con exportación tabular en PDF, PNG y JPG.
- Ciclo escolar activo, módulos configurables y horarios generales por grupo.
- Contadores de disponibilidad docente y horas restantes por materia.
- Perfiles consultables desde los nombres de docentes y alumnos con privacidad por rol.

## Dependencias de interfaz

Remix Icon se carga mediante CDN desde `interfaces/dashboard.html`. No se utiliza Bootstrap. Los archivos del kardex se generan directamente en el navegador sin depender de una biblioteca PDF externa.

## Despliegue

El proyecto puede publicarse directamente como sitio estático en Vercel. La constante `URL_BASE` de cada script debe apuntar a la API desplegada.
