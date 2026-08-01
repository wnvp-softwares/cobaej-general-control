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
- Kardex completo con exportación PDF, PNG y JPG.

## Dependencias de interfaz

Remix Icon y jsPDF se cargan mediante CDN desde `interfaces/dashboard.html`. No se utiliza Bootstrap.

## Despliegue

El proyecto puede publicarse directamente como sitio estático en Vercel. La constante `URL_BASE` de cada script debe apuntar a la API desplegada.
