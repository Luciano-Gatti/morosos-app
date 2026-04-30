ALTER TABLE IF EXISTS etapa_config
    ADD COLUMN IF NOT EXISTS descripcion text;

ALTER TABLE IF EXISTS motivo_cierre
    ADD COLUMN IF NOT EXISTS descripcion text;
