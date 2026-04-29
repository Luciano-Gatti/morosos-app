CREATE TABLE IF NOT EXISTS carga_deuda (
    id UUID PRIMARY KEY,
    periodo DATE NOT NULL,
    estado VARCHAR(30) NOT NULL,
    archivo_nombre VARCHAR(255) NULL,
    total_registros INT NOT NULL,
    procesados INT NOT NULL,
    errores INT NOT NULL,
    monto_total NUMERIC(14,2) NOT NULL,
    created_by VARCHAR(120) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL,
    updated_by VARCHAR(120) NOT NULL,
    updated_at TIMESTAMPTZ NOT NULL,
    CONSTRAINT ck_carga_deuda_estado CHECK (estado IN (
      'PENDIENTE',
      'PROCESANDO',
      'COMPLETADA',
      'COMPLETADA_CON_ERRORES',
      'FALLIDA'
    ))
);

CREATE TABLE IF NOT EXISTS carga_deuda_detalle (
    id UUID PRIMARY KEY,
    carga_deuda_id UUID NOT NULL REFERENCES carga_deuda(id),
    inmueble_id UUID NOT NULL REFERENCES inmueble(id),
    cuotas_vencidas INT NOT NULL,
    monto_vencido NUMERIC(14,2) NOT NULL,
    fecha_ultimo_vencimiento DATE NULL,
    created_by VARCHAR(120) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL,
    updated_by VARCHAR(120) NOT NULL,
    updated_at TIMESTAMPTZ NOT NULL,
    CONSTRAINT uk_carga_deuda_detalle UNIQUE (carga_deuda_id, inmueble_id)
);

CREATE TABLE IF NOT EXISTS carga_deuda_error (
    id UUID PRIMARY KEY,
    carga_deuda_id UUID NOT NULL REFERENCES carga_deuda(id),
    fila INT NOT NULL,
    cuenta VARCHAR(50) NULL,
    motivo VARCHAR(500) NOT NULL,
    payload JSONB NULL,
    created_by VARCHAR(120) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL
);
