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
