CREATE TABLE IF NOT EXISTS inmueble (
    id UUID PRIMARY KEY,
    cuenta VARCHAR(50) NOT NULL UNIQUE,
    titular VARCHAR(250) NOT NULL,
    direccion VARCHAR(300) NOT NULL,
    grupo_id UUID NOT NULL REFERENCES grupo(id),
    distrito_id UUID NOT NULL REFERENCES distrito(id),
    activo BOOLEAN NOT NULL DEFAULT TRUE,
    seguimiento_habilitado BOOLEAN NOT NULL DEFAULT TRUE,
    telefono VARCHAR(50) NULL,
    email VARCHAR(150) NULL,
    observacion TEXT NULL,
    created_by VARCHAR(120) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL,
    updated_by VARCHAR(120) NOT NULL,
    updated_at TIMESTAMPTZ NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_inmueble_grupo_id ON inmueble(grupo_id);
CREATE INDEX IF NOT EXISTS idx_inmueble_distrito_id ON inmueble(distrito_id);
