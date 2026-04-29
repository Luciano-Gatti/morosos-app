CREATE TABLE IF NOT EXISTS importacion_inmueble (
  id UUID PRIMARY KEY,
  archivo_nombre VARCHAR(255) NULL,
  total_registros INT NOT NULL,
  procesados INT NOT NULL,
  creados INT NOT NULL,
  actualizados INT NOT NULL,
  errores INT NOT NULL,
  estado VARCHAR(30) NOT NULL,
  created_by VARCHAR(120) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL,
  updated_by VARCHAR(120) NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL,
  CONSTRAINT ck_importacion_inmueble_estado CHECK (estado IN ('PENDIENTE','PROCESANDO','COMPLETADA','COMPLETADA_CON_ERRORES','FALLIDA'))
);

CREATE TABLE IF NOT EXISTS importacion_inmueble_error (
  id UUID PRIMARY KEY,
  importacion_id UUID NOT NULL REFERENCES importacion_inmueble(id),
  fila INT NOT NULL,
  cuenta VARCHAR(50) NULL,
  motivo VARCHAR(500) NOT NULL,
  payload JSONB NULL,
  created_by VARCHAR(120) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL
);
