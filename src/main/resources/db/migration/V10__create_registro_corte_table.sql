CREATE TABLE registros_corte (
    id UUID PRIMARY KEY,
    caso_seguimiento_id UUID NOT NULL,
    fecha DATE NOT NULL,
    tipo_corte_id UUID NOT NULL,
    motivo_corte_id UUID NOT NULL,
    observacion VARCHAR(255),
    CONSTRAINT fk_registro_corte_caso
        FOREIGN KEY (caso_seguimiento_id) REFERENCES casos_seguimiento(id),
    CONSTRAINT fk_registro_corte_tipo
        FOREIGN KEY (tipo_corte_id) REFERENCES tipos_corte(id),
    CONSTRAINT fk_registro_corte_motivo
        FOREIGN KEY (motivo_corte_id) REFERENCES motivos_corte(id)
);

CREATE INDEX idx_registro_corte_caso_id ON registros_corte(caso_seguimiento_id);
CREATE INDEX idx_registro_corte_tipo_id ON registros_corte(tipo_corte_id);
CREATE INDEX idx_registro_corte_motivo_id ON registros_corte(motivo_corte_id);
