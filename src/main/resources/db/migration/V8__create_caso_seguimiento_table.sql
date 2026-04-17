CREATE TABLE casos_seguimiento (
    id UUID PRIMARY KEY,
    inmueble_id UUID NOT NULL,
    estado_seguimiento VARCHAR(50) NOT NULL,
    etapa_actual VARCHAR(50) NOT NULL,
    fecha_inicio TIMESTAMP NOT NULL,
    fecha_cierre TIMESTAMP,
    motivo_cierre VARCHAR(255),
    CONSTRAINT fk_caso_seguimiento_inmueble
        FOREIGN KEY (inmueble_id) REFERENCES inmuebles(id)
);

CREATE INDEX idx_caso_seguimiento_inmueble_id ON casos_seguimiento(inmueble_id);
