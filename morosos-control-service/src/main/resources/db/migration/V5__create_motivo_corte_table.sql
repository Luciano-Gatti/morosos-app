CREATE TABLE motivos_corte (
    id UUID PRIMARY KEY,
    nombre VARCHAR(255) NOT NULL UNIQUE,
    activo BOOLEAN NOT NULL
);
