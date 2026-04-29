CREATE TABLE IF NOT EXISTS grupo (
    id UUID PRIMARY KEY,
    codigo VARCHAR(50) NOT NULL UNIQUE,
    nombre VARCHAR(150) NOT NULL UNIQUE,
    activo BOOLEAN NOT NULL DEFAULT TRUE,
    created_by VARCHAR(120) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL,
    updated_by VARCHAR(120) NOT NULL,
    updated_at TIMESTAMPTZ NOT NULL
);

CREATE TABLE IF NOT EXISTS distrito (
    id UUID PRIMARY KEY,
    codigo VARCHAR(50) NOT NULL UNIQUE,
    nombre VARCHAR(150) NOT NULL UNIQUE,
    activo BOOLEAN NOT NULL DEFAULT TRUE,
    created_by VARCHAR(120) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL,
    updated_by VARCHAR(120) NOT NULL,
    updated_at TIMESTAMPTZ NOT NULL
);

CREATE TABLE IF NOT EXISTS grupo_distrito_config (
    id UUID PRIMARY KEY,
    grupo_id UUID NOT NULL REFERENCES grupo(id),
    distrito_id UUID NOT NULL REFERENCES distrito(id),
    seguimiento_habilitado BOOLEAN NOT NULL,
    created_by VARCHAR(120) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL,
    updated_by VARCHAR(120) NOT NULL,
    updated_at TIMESTAMPTZ NOT NULL,
    CONSTRAINT uk_grupo_distrito_config UNIQUE (grupo_id, distrito_id)
);

CREATE TABLE IF NOT EXISTS etapa_config (
    id UUID PRIMARY KEY,
    codigo VARCHAR(50) NOT NULL UNIQUE,
    nombre VARCHAR(150) NOT NULL,
    orden INT NOT NULL UNIQUE,
    activo BOOLEAN NOT NULL DEFAULT TRUE,
    es_final BOOLEAN NOT NULL DEFAULT FALSE,
    created_by VARCHAR(120) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL,
    updated_by VARCHAR(120) NOT NULL,
    updated_at TIMESTAMPTZ NOT NULL
);

CREATE TABLE IF NOT EXISTS parametro_seguimiento (
    id UUID PRIMARY KEY,
    codigo VARCHAR(100) NOT NULL UNIQUE,
    valor VARCHAR(500) NOT NULL,
    descripcion VARCHAR(500) NULL,
    created_by VARCHAR(120) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL,
    updated_by VARCHAR(120) NOT NULL,
    updated_at TIMESTAMPTZ NOT NULL
);

CREATE TABLE IF NOT EXISTS motivo_cierre (
    id UUID PRIMARY KEY,
    codigo VARCHAR(50) NOT NULL UNIQUE,
    nombre VARCHAR(150) NOT NULL UNIQUE,
    is_system BOOLEAN NOT NULL DEFAULT FALSE,
    activo BOOLEAN NOT NULL DEFAULT TRUE,
    created_by VARCHAR(120) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL,
    updated_by VARCHAR(120) NOT NULL,
    updated_at TIMESTAMPTZ NOT NULL
);

INSERT INTO motivo_cierre (id, codigo, nombre, is_system, activo, created_by, created_at, updated_by, updated_at)
VALUES
    ('ff6c703f-63f8-4b98-8f6b-4ffc03ea0c61', 'REGULARIZACION', 'REGULARIZACION', TRUE, TRUE, 'SYSTEM_MOROSOS', NOW(), 'SYSTEM_MOROSOS', NOW()),
    ('08d1267d-d5af-41b4-a4f0-95258bdf16ab', 'PLAN_DE_PAGO', 'PLAN_DE_PAGO', TRUE, TRUE, 'SYSTEM_MOROSOS', NOW(), 'SYSTEM_MOROSOS', NOW()),
    ('f85b6bc9-22ff-44cf-9676-6acd2a5c7a45', 'CAMBIO_PARAMETRO', 'CAMBIO_PARAMETRO', TRUE, TRUE, 'SYSTEM_MOROSOS', NOW(), 'SYSTEM_MOROSOS', NOW())
ON CONFLICT (codigo) DO NOTHING;
