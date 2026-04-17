ALTER TABLE IF EXISTS cargas_deuda RENAME TO carga_deuda;
ALTER TABLE IF EXISTS estados_deuda_historico RENAME TO estado_deuda_historico;

ALTER INDEX IF EXISTS idx_estado_deuda_historico_carga_deuda
    RENAME TO idx_estado_deuda_hist_carga_deuda_id;

ALTER INDEX IF EXISTS idx_estado_deuda_historico_inmueble
    RENAME TO idx_estado_deuda_hist_inmueble_id;
