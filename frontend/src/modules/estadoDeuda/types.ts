export type EstadoDeuda = {
  id: string;
  inmuebleId: string;
  numeroCuenta: string;
  cuotasAdeudadas: number;
  montoAdeudado: string;
  fechaActualizacion: string;
  aptoParaSeguimiento: boolean;
};

export type EstadoDeudaPayload = {
  inmuebleId: string;
  cuotasAdeudadas: number;
  montoAdeudado: number;
};

export type EstadoDeudaImportResult = {
  totalProcesados: number;
  actualizados: number;
  errores: number;
  cuentasNoEncontradas: number;
  detalleErrores: string[];
  detalleCuentasNoEncontradas: string[];
};

export type CargaDeuda = {
  id: string;
  fechaCarga: string;
  nombreArchivo: string;
  observacion: string | null;
  cantidadRegistrosHistoricos: number;
};

export type CargaDeudaDetalleItem = {
  inmuebleId: string;
  numeroCuenta: string;
  cuotasAdeudadas: number;
  montoAdeudado: string;
  aptoParaSeguimiento: boolean;
};

export type InmuebleHistorialDeudaItem = {
  fechaCarga: string;
  cuotasAdeudadas: number;
  montoAdeudado: string;
  aptoParaSeguimiento: boolean;
  seguimientoHabilitadoEnEseMomento: boolean;
  nombreArchivo: string | null;
};

export type MorososPorGrupoReporteItem = {
  grupoId: string;
  grupoNombre: string;
  cantidadMorosos: number;
  montoTotalAdeudadoDelGrupo: string;
};

export type ReporteMorososPorCargaItem = {
  idCarga: string;
  fechaCarga: string;
  nombreArchivo: string;
  cantidadTotalMorosos: number;
  montoTotalAdeudado: string;
  detallePorGrupo: MorososPorGrupoReporteItem[];
};
