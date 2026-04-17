CREATE TABLE cargas_deuda (
    id UUID PRIMARY KEY,
    fecha_carga TIMESTAMP NOT NULL,
    nombre_archivo VARCHAR(255) NOT NULL,
    observacion VARCHAR(1000)
);

CREATE TABLE estados_deuda_historico (
    id UUID PRIMARY KEY,
    carga_deuda_id UUID NOT NULL,
    inmueble_id UUID NOT NULL,
    cuotas_adeudadas INTEGER NOT NULL,
    monto_adeudado NUMERIC(15,2) NOT NULL,
    apto_para_seguimiento BOOLEAN NOT NULL,
    seguimiento_habilitado_en_ese_momento BOOLEAN NOT NULL,
    CONSTRAINT uk_estado_deuda_historico_carga_inmueble UNIQUE (carga_deuda_id, inmueble_id),
    CONSTRAINT fk_estado_deuda_historico_carga_deuda
        FOREIGN KEY (carga_deuda_id) REFERENCES cargas_deuda(id),
    CONSTRAINT fk_estado_deuda_historico_inmueble
        FOREIGN KEY (inmueble_id) REFERENCES inmuebles(id)
);

CREATE INDEX idx_estado_deuda_historico_carga_deuda ON estados_deuda_historico(carga_deuda_id);
CREATE INDEX idx_estado_deuda_historico_inmueble ON estados_deuda_historico(inmueble_id);
