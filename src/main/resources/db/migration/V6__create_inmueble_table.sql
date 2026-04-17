CREATE TABLE inmuebles (
    id UUID PRIMARY KEY,
    numero_cuenta VARCHAR(255) NOT NULL UNIQUE,
    propietario_nombre VARCHAR(255) NOT NULL,
    distrito VARCHAR(255) NOT NULL,
    direccion_completa VARCHAR(255) NOT NULL,
    grupo_id UUID NOT NULL,
    activo BOOLEAN NOT NULL,
    seguimiento_habilitado BOOLEAN NOT NULL,
    CONSTRAINT fk_inmueble_grupo
        FOREIGN KEY (grupo_id) REFERENCES grupos(id)
);

CREATE INDEX idx_inmueble_grupo_id ON inmuebles(grupo_id);
