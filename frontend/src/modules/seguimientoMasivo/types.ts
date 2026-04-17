export type EtapaInicial = 'AVISO_DEUDA' | 'INTIMACION' | 'AVISO_CORTE' | 'CORTE';

export type CrearCasosMasivoPayload = {
  inmuebleIds: string[];
  etapaInicial: EtapaInicial;
};

export type OperacionMasivaResponse = {
  totalSolicitados: number;
  exitosos: number;
  errores: number;
  procesados: string[];
  detalleErrores: string[];
};
