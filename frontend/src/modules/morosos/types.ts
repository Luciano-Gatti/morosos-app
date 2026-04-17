export type Moroso = {
  inmuebleId: string;
  numeroCuenta: string;
  propietarioNombre: string;
  direccionCompleta: string;
  distrito: string;
  grupoId: string;
  grupo: string;
  cuotasAdeudadas: number;
  montoAdeudado: string;
  seguimientoHabilitado: boolean;
  aptoParaSeguimiento: boolean;
  fechaActualizacion: string;
};

export type MorososFilters = {
  numeroCuenta?: string;
  propietarioNombre?: string;
  direccionCompleta?: string;
  distrito?: string;
  grupo?: string;
  cuotasAdeudadas?: number;
  montoAdeudado?: number;
  seguimientoHabilitado?: boolean;
  aptoParaSeguimiento?: boolean;
};

export type MorososSortableFields =
  | 'cuotasAdeudadas'
  | 'montoAdeudado'
  | 'propietarioNombre'
  | 'numeroCuenta'
  | 'direccionCompleta'
  | 'grupo';
