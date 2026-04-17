CREATE TABLE compromisos_pago (
    id UUID PRIMARY KEY,
    caso_seguimiento_id UUID NOT NULL,
    fecha_desde DATE NOT NULL,
    fecha_hasta DATE,
    observacion VARCHAR(255),
    estado_compromiso VARCHAR(50) NOT NULL,
    CONSTRAINT fk_compromiso_pago_caso
        FOREIGN KEY (caso_seguimiento_id) REFERENCES casos_seguimiento(id)
);

CREATE INDEX idx_compromiso_pago_caso_id ON compromisos_pago(caso_seguimiento_id);
