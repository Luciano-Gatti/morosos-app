ALTER TABLE proceso_cierre
  ADD COLUMN IF NOT EXISTS monto_abonado NUMERIC(14,2);
