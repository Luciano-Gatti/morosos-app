import type { EstadoProceso, EtapaSeguimiento } from "@/types/seguimiento";

export type CierreProceso = string | null;

export interface RegistroHistorial {
  id: string;
  fecha: string;
  hora: string;
  numeroProceso: string;
  etapa: EtapaSeguimiento;
  estado: EstadoProceso;
  tipoAccion?: string;
  tipoEvento?: string;
  observaciones: string;
  compromisoPago?: {
    fechaDesde: string;
    fechaHasta: string;
    observacion: string;
    montoComprometido?: number;
    estadoLabel?: string;
    estado?: string;
    responsable?: string;
  } | null;
  cierre?: CierreProceso;
  responsable: string;
  esEventoProceso?: boolean;
  esCierreEvento?: boolean;
  metadata?: Record<string, unknown>;
}

export interface ProcesoSeguimiento {
  id: string;
  fechaInicio: string;
  fechaFin: string | null;
  estado: "abierto" | "cerrado" | "pausado";
  motivoCierre: CierreProceso;
  registros: RegistroHistorial[];
  cierre?: any;
}

export interface ObservacionLibre {
  id: string;
  fecha: string;
  autor: string;
  cargo: string;
  texto: string;
}

export interface HistorialInmueble {
  inmuebleId: string;
  procesos: ProcesoSeguimiento[];
  observacionesLibres: ObservacionLibre[];
}
