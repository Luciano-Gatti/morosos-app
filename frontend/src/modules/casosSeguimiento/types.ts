export type EstadoSeguimiento = 'ACTIVO' | 'PAUSADO' | 'CERRADO';
export type EtapaSeguimiento = 'AVISO_DEUDA' | 'INTIMACION' | 'AVISO_CORTE' | 'CORTE';

export type CasoSeguimiento = {
  id: string;
  inmuebleId: string;
  numeroCuenta: string;
  estadoSeguimiento: EstadoSeguimiento;
  etapaActual: EtapaSeguimiento;
  fechaInicio: string;
  fechaCierre: string | null;
  motivoCierre: string | null;
};

export type OperacionCasosPayload = {
  casoIds: string[];
};

export type OperacionCasosResultado = {
  totalSolicitados: number;
  exitosos: number;
  errores: number;
  procesados: string[];
  detalleErrores: string[];
};

export type CerrarCasoPayload = {
  motivoCierre: string;
};

export type CompromisoPago = {
  id: string;
  casoSeguimientoId: string;
  fechaDesde: string;
  fechaHasta: string | null;
  observacion: string | null;
  estadoCompromiso: 'PENDIENTE' | 'CUMPLIDO' | 'INCUMPLIDO';
};

export type CompromisoPagoPayload = {
  fechaDesde: string;
  fechaHasta?: string;
  observacion?: string;
};

export type RegistroCorte = {
  id: string;
  casoSeguimientoId: string;
  fecha: string;
  tipoCorteId: string;
  tipoCorte: string;
  motivoCorteId: string;
  motivoCorte: string;
  observacion: string | null;
};

export type RegistroCortePayload = {
  fecha: string;
  tipoCorteId: string;
  motivoCorteId: string;
  observacion?: string;
};
