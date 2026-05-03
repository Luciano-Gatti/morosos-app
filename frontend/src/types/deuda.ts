export type CargaEstado = "completada" | "con_errores" | "fallida" | "procesando";

export interface CargaDeuda {
  id: string;
  nombre: string;
  fecha: string;
  usuario: string;
  estado: CargaEstado;
  morosos: number;
  montoTotal: number;
  procesados: number;
  creados: number;
  actualizados: number;
  errores: number;
  noEncontradas: number;
}

export interface InmuebleCarga {
  cuenta: string;
  titular: string;
  direccion: string;
  cuotas: number;
  monto: number;
}

export interface ErrorImportacion {
  fila: number;
  cuenta: string;
  descripcion: string;
}
