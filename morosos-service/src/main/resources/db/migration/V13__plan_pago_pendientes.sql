ALTER TABLE proceso_cierre_plan_pago
  ADD COLUMN IF NOT EXISTS cuotas_pendientes INTEGER,
  ADD COLUMN IF NOT EXISTS monto_pendiente NUMERIC(14,2);

UPDATE proceso_cierre_plan_pago
SET cuotas_pendientes = GREATEST(cantidad_cuotas - cuotas_pagadas_iniciales, 0),
    monto_pendiente = ROUND(monto_total_plan - monto_pagado_inicial, 2)
WHERE cuotas_pendientes IS NULL OR monto_pendiente IS NULL;

ALTER TABLE proceso_cierre_plan_pago
  ALTER COLUMN cuotas_pendientes SET NOT NULL,
  ALTER COLUMN monto_pendiente SET NOT NULL;
