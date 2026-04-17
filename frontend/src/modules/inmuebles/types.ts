export type Inmueble = {
  id: string;
  numeroCuenta: string;
  propietarioNombre: string;
  distrito: string;
  direccionCompleta: string;
  grupoId: string;
  grupoNombre: string;
  activo: boolean;
  seguimientoHabilitado: boolean;
};

export type InmuebleFilters = {
  numeroCuenta?: string;
  propietarioNombre?: string;
  direccionCompleta?: string;
  distrito?: string;
};

export type InmueblePayload = {
  numeroCuenta: string;
  propietarioNombre: string;
  distrito: string;
  direccionCompleta: string;
  grupoId: string;
  activo: boolean;
};

export type InmuebleImportResult = {
  totalProcesados: number;
  creados: number;
  actualizados: number;
  errores: number;
  detalleErrores: string[];
};
