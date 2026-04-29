CREATE TABLE IF NOT EXISTS caso_seguimiento (
  id UUID PRIMARY KEY,
  inmueble_id UUID NOT NULL REFERENCES inmueble(id),
  etapa_actual_id UUID NOT NULL REFERENCES etapa_config(id),
  estado VARCHAR(20) NOT NULL,
  fecha_inicio TIMESTAMPTZ NOT NULL,
  fecha_ultimo_movimiento TIMESTAMPTZ NOT NULL,
  observacion TEXT NULL,
  created_by UUID NULL,
  created_at TIMESTAMPTZ NOT NULL,
  updated_by UUID NULL,
  updated_at TIMESTAMPTZ NULL,
  CONSTRAINT ck_caso_seguimiento_estado CHECK (estado IN ('ABIERTO', 'PAUSADO', 'CERRADO'))
);

CREATE UNIQUE INDEX IF NOT EXISTS ux_caso_abierto_por_inmueble
ON caso_seguimiento(inmueble_id)
WHERE estado = 'ABIERTO';

CREATE INDEX IF NOT EXISTS idx_caso_seguimiento_inmueble
ON caso_seguimiento(inmueble_id);

CREATE TABLE IF NOT EXISTS caso_evento (
  id UUID PRIMARY KEY,
  caso_seguimiento_id UUID NOT NULL REFERENCES caso_seguimiento(id),
  tipo_evento VARCHAR(50) NOT NULL,
  etapa_origen_id UUID NULL REFERENCES etapa_config(id),
  etapa_destino_id UUID NULL REFERENCES etapa_config(id),
  fecha_evento TIMESTAMPTZ NOT NULL,
  observacion TEXT NULL,
  metadata JSONB NULL,
  created_by UUID NULL,
  created_at TIMESTAMPTZ NOT NULL,
  CONSTRAINT ck_caso_evento_tipo CHECK (tipo_evento IN (
    'INICIO_PROCESO','AVANCE_ETAPA','REPETICION_ETAPA','CIERRE_PROCESO',
    'COMPROMISO_REGISTRADO','COMPROMISO_INCUMPLIDO','CAMBIO_PARAMETRO','OBSERVACION'
  ))
);

CREATE TABLE IF NOT EXISTS proceso_cierre (
  id UUID PRIMARY KEY,
  caso_seguimiento_id UUID NOT NULL REFERENCES caso_seguimiento(id),
  motivo_cierre_id UUID NOT NULL REFERENCES motivo_cierre(id),
  fecha_cierre TIMESTAMPTZ NOT NULL,
  observacion TEXT NULL,
  created_by UUID NULL,
  created_at TIMESTAMPTZ NOT NULL,
  CONSTRAINT uk_proceso_cierre_caso UNIQUE (caso_seguimiento_id)
);

CREATE TABLE IF NOT EXISTS proceso_cierre_plan_pago (
  id UUID PRIMARY KEY,
  proceso_cierre_id UUID NOT NULL REFERENCES proceso_cierre(id),
  cantidad_cuotas INT NOT NULL,
  fecha_vencimiento_primera_cuota DATE NOT NULL,
  CONSTRAINT uk_proceso_cierre_plan_pago UNIQUE (proceso_cierre_id)
);

CREATE TABLE IF NOT EXISTS proceso_cierre_cambio_parametro (
  id UUID PRIMARY KEY,
  proceso_cierre_id UUID NOT NULL REFERENCES proceso_cierre(id),
  parametro VARCHAR(150) NOT NULL,
  valor_anterior VARCHAR(500) NOT NULL,
  valor_nuevo VARCHAR(500) NOT NULL,
  CONSTRAINT uk_proceso_cierre_cambio_parametro UNIQUE (proceso_cierre_id)
);

CREATE TABLE IF NOT EXISTS compromiso_pago (
  id UUID PRIMARY KEY,
  caso_seguimiento_id UUID NOT NULL REFERENCES caso_seguimiento(id),
  fecha_desde DATE NOT NULL,
  fecha_hasta DATE NOT NULL,
  monto_comprometido NUMERIC(14,2) NULL,
  estado VARCHAR(30) NOT NULL,
  observacion TEXT NULL,
  created_by UUID NULL,
  created_at TIMESTAMPTZ NOT NULL,
  updated_by UUID NULL,
  updated_at TIMESTAMPTZ NULL,
  CONSTRAINT ck_compromiso_pago_estado CHECK (estado IN ('PENDIENTE', 'CUMPLIDO', 'INCUMPLIDO', 'CANCELADO'))
);
