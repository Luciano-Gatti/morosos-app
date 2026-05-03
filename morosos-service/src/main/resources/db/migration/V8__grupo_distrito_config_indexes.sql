CREATE UNIQUE INDEX IF NOT EXISTS uk_grupo_distrito_config_grupo_distrito
    ON grupo_distrito_config (grupo_id, distrito_id);

CREATE INDEX IF NOT EXISTS idx_grupo_distrito_config_grupo_id
    ON grupo_distrito_config (grupo_id);

CREATE INDEX IF NOT EXISTS idx_grupo_distrito_config_distrito_id
    ON grupo_distrito_config (distrito_id);

CREATE INDEX IF NOT EXISTS idx_grupo_distrito_config_seguimiento_habilitado
    ON grupo_distrito_config (seguimiento_habilitado);
