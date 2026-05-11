export type AccionClave = "avisos_deuda" | "avisos_corte" | "intimaciones" | "cortes";

export interface DistritoStat {
  distrito: string;
  usuarios: number;
  deudores: number;
  morosos: number;
  acciones: Record<AccionClave, number>;
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
