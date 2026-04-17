CREATE TABLE grupos (
    id UUID PRIMARY KEY,
    nombre VARCHAR(255) NOT NULL UNIQUE,
    seguimiento_activo BOOLEAN NOT NULL
);
