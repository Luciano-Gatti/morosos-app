ALTER TABLE proceso_cierre_plan_pago
  ADD COLUMN IF NOT EXISTS monto_total_plan NUMERIC(14,2),
  ADD COLUMN IF NOT EXISTS valor_cuota NUMERIC(14,2),
  ADD COLUMN IF NOT EXISTS cuotas_pagadas_iniciales INT,
  ADD COLUMN IF NOT EXISTS monto_pagado_inicial NUMERIC(14,2),
  ADD COLUMN IF NOT EXISTS saldo_pendiente NUMERIC(14,2);

UPDATE proceso_cierre_plan_pago
SET monto_total_plan = COALESCE(monto_total_plan, 0),
    valor_cuota = COALESCE(valor_cuota, 0),
    cuotas_pagadas_iniciales = COALESCE(cuotas_pagadas_iniciales, 0),
    monto_pagado_inicial = COALESCE(monto_pagado_inicial, 0),
    saldo_pendiente = COALESCE(saldo_pendiente, 0)
WHERE monto_total_plan IS NULL OR valor_cuota IS NULL OR cuotas_pagadas_iniciales IS NULL OR monto_pagado_inicial IS NULL OR saldo_pendiente IS NULL;

ALTER TABLE proceso_cierre_plan_pago
  ALTER COLUMN monto_total_plan SET NOT NULL,
  ALTER COLUMN valor_cuota SET NOT NULL,
  ALTER COLUMN cuotas_pagadas_iniciales SET NOT NULL,
  ALTER COLUMN monto_pagado_inicial SET NOT NULL,
  ALTER COLUMN saldo_pendiente SET NOT NULL;

CREATE TABLE IF NOT EXISTS plan_pago_pago (
  id UUID PRIMARY KEY,
  proceso_cierre_plan_pago_id UUID NOT NULL REFERENCES proceso_cierre_plan_pago(id),
  fecha_pago DATE NOT NULL,
  cantidad_cuotas_pagadas INT NOT NULL,
  monto_pagado NUMERIC(14,2) NOT NULL,
  observacion TEXT NULL,
  created_by UUID NULL,
  created_at TIMESTAMPTZ NOT NULL
);
