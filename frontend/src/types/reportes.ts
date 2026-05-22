export interface MorososPorGrupoRow {
  grupo: string;
  distrito: string;
  etiqueta: string;
  totalInmuebles: number;
  deudores: number;
  morosos: number;
  porcentaje: number;
}

export interface MorososPorDistritoRow {
  distrito: string;
  totalInmuebles: number;
  deudores: number;
  morosos: number;
  porcentaje: number;
}

export type AccionTipo = string;

export interface AccionRegistro {
  id: string;
  fecha: Date;
  tipo: AccionTipo;
  codigo?: string;
  cuenta: string;
  titular: string;
  grupo: string;
  distrito: string;
  usuario: string;
  observacion?: string | null;
  montoPagado?: number | null;
  montoComprometido?: number | null;
  fechaDesde?: Date | null;
  fechaHasta?: Date | null;
  estado?: string | null;
  fechaAlta?: Date | null;
  montoTotalPlan?: number | null;
  cantidadCuotas?: number | null;
  valorCuota?: number | null;
  cuotasPagadas?: number | null;
  saldoPendiente?: number | null;
  cuotasPendientes?: number | null;
  montoPendiente?: number | null;
  proximoVencimiento?: Date | null;
  vencimientoFinal?: Date | null;
}

export interface RegularizacionPlanDetalle {
  fechaAlta: Date;
  cuenta: string;
  titular: string;
  grupo: string;
  cuotas: number;
  montoTotal: number;
  proximoVencimiento: Date | null;
  vencimientoFinal: Date | null;
  estado: string;
}

export interface CompromisoPagoDetalle {
  fecha: Date;
  cuenta: string;
  titular: string;
  grupo: string;
  distrito: string;
  responsable: string;
}

export interface AccionesRegularizacionViewModel {
  rows: AccionRegistro[];
  detallePorTipo: { tipo: AccionTipo; cantidad: number; porcentaje: number }[];
  planesDePago: RegularizacionPlanDetalle[];
  compromisosDePago: CompromisoPagoDetalle[];
}

export type EstadoInmueble = "Moroso" | "Deudor" | "Al día";

export interface InmuebleEstadoRow {
  cuenta: string;
  titular: string;
  grupo: string;
  distrito: string;
  cuotasAdeudadas: number;
  montoAdeudado: number;
  estado: EstadoInmueble;
  etapa: string;
}

export interface MorosidadPorcentajeTotal {
  totalInmuebles: number;
  deudores: number;
  morosos: number;
  alDia: number;
  porcentajeMorosidad: number;
}
export type MovimientoTipo =
  | "intimacion"
  | "corte"
  | "regularizacion"
  | "plan_pago"
  | "compromiso"
  | "aviso_deuda"
  | "aviso_corte"
  | "configuracion";

export interface MovimientoRegistro {
  id: string;
  fecha: string;
  cuenta: string;
  titular: string;
  accion: string;
  etapa: string;
  tipo: MovimientoTipo;
  usuario: string;
  categoria: string;
}
