CREATE TABLE estados_deuda (
    id UUID PRIMARY KEY,
    inmueble_id UUID NOT NULL,
    cuotas_adeudadas INTEGER NOT NULL,
    monto_adeudado NUMERIC(15,2) NOT NULL,
    fecha_actualizacion TIMESTAMP NOT NULL,
    CONSTRAINT uk_estado_deuda_inmueble UNIQUE (inmueble_id),
    CONSTRAINT fk_estado_deuda_inmueble
        FOREIGN KEY (inmueble_id) REFERENCES inmuebles(id)
);
