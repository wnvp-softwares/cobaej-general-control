PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS docentes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nombre TEXT NOT NULL,
    correo TEXT,
    horas_disponibles INTEGER
);

CREATE TABLE IF NOT EXISTS alumnos (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nombre TEXT NOT NULL,
    numero_control TEXT NOT NULL UNIQUE,
    fecha_ingreso TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS materias (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nombre TEXT NOT NULL,
    horas_semanales INTEGER,
    grado_semestre TEXT NOT NULL CHECK (grado_semestre IN ('1', '2', '3', '4', '5', '6')),
    color_hex TEXT DEFAULT '#FFFFFF' CHECK (length(color_hex) <= 7)
);

CREATE TABLE IF NOT EXISTS periodos_escolares (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nombre_ciclo TEXT NOT NULL,
    nombre_periodo TEXT NOT NULL CHECK (nombre_periodo IN ('Enero-Junio', 'Agosto-Diciembre')),
    anio INTEGER,
    fecha_inicio TEXT,
    fecha_fin TEXT,
    activo INTEGER DEFAULT 0 CHECK (activo IN (0, 1))
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_unico_periodo_activo 
ON periodos_escolares (activo) 
WHERE activo = 1;

CREATE TABLE IF NOT EXISTS grupos (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    division TEXT NOT NULL CHECK (length(division) = 1),
    grado_semestre TEXT NOT NULL CHECK (grado_semestre IN ('1', '2', '3', '4', '5', '6')),
    periodo_id INTEGER NOT NULL,
    FOREIGN KEY (periodo_id) REFERENCES periodos_escolares(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS historial_inscripciones (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    alumno_id INTEGER NOT NULL,
    grupo_id INTEGER NOT NULL,
    FOREIGN KEY (alumno_id) REFERENCES alumnos(id) ON DELETE CASCADE,
    FOREIGN KEY (grupo_id) REFERENCES grupos(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS materia_activa (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    materia_id INTEGER NOT NULL,
    docente_id INTEGER NOT NULL,
    grupo_id INTEGER NOT NULL,
    periodo_id INTEGER NOT NULL,
    FOREIGN KEY (materia_id) REFERENCES materias(id) ON DELETE CASCADE,
    FOREIGN KEY (docente_id) REFERENCES docentes(id) ON DELETE CASCADE,
    FOREIGN KEY (grupo_id) REFERENCES grupos(id) ON DELETE CASCADE,
    FOREIGN KEY (periodo_id) REFERENCES periodos_escolares(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS horarios (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    materia_activa_id INTEGER NOT NULL,
    dia_semana TEXT NOT NULL CHECK (dia_semana IN ('Lunes', 'Martes', 'Miercoles', 'Jueves', 'Viernes')),
    hora_inicio TEXT NOT NULL,
    hora_fin TEXT NOT NULL,
    aula TEXT,
    FOREIGN KEY (materia_activa_id) REFERENCES materia_activa(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS actividades (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    materia_activa_id INTEGER NOT NULL,
    titulo TEXT NOT NULL,
    descripcion TEXT,
    ponderacion_porcentaje REAL NOT NULL,
    FOREIGN KEY (materia_activa_id) REFERENCES materia_activa(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS calificaciones_actividades (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    actividad_id INTEGER NOT NULL,
    historial_inscripcion_id INTEGER NOT NULL,
    nota_obtenida REAL NOT NULL,
    FOREIGN KEY (actividad_id) REFERENCES actividades(id) ON DELETE CASCADE,
    FOREIGN KEY (historial_inscripcion_id) REFERENCES historial_inscripciones(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS calificaciones (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    historial_inscripcion_id INTEGER NOT NULL,
    materia_activa_id INTEGER NOT NULL,
    calificacion_final REAL NOT NULL,
    FOREIGN KEY (historial_inscripcion_id) REFERENCES historial_inscripciones(id) ON DELETE CASCADE,
    FOREIGN KEY (materia_activa_id) REFERENCES materia_activa(id) ON DELETE CASCADE
);