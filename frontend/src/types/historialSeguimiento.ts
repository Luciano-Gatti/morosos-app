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
  observaciones: string;
  compromisoPago?: {
    fechaDesde: string;
    fechaHasta: string;
    observacion: string;
  } | null;
  cierre?: CierreProceso;
  responsable: string;
}

export interface ProcesoSeguimiento {
  id: string;
  fechaInicio: string;
  fechaFin: string | null;
  estado: "abierto" | "cerrado";
  motivoCierre: CierreProceso;
  registros: RegistroHistorial[];
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
