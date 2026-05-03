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

export type AccionTipo =
  | "Aviso de deuda"
  | "Intimación"
  | "Aviso de corte"
  | "Corte"
  | "Regularización"
  | "Plan de pago"
  | "Compromiso de pago";

export interface AccionRegistro {
  id: string;
  fecha: Date;
  tipo: AccionTipo;
  cuenta: string;
  titular: string;
  grupo: string;
  distrito: string;
  usuario: string;
}

export type EstadoInmueble = "Moroso" | "Con deuda" | "Al día";

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
