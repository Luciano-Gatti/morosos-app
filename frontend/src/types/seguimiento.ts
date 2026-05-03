export const etapasSeguimiento = [
  "Aviso de deuda",
  "Intimación",
  "Aviso de corte",
  "Corte",
] as const;
export type EtapaSeguimiento = (typeof etapasSeguimiento)[number];

export const estadosProceso = ["No iniciado", "Activo", "Pausado", "Cerrado"] as const;
export type EstadoProceso = (typeof estadosProceso)[number];

export interface InmuebleMoroso {
  id: string;
  cuenta: string;
  titular: string;
  direccion: string;
  grupo: string;
  distrito: string;
  cuotasAdeudadas: number;
  montoAdeudado: number;
  etapa: EtapaSeguimiento | null;
  estado: EstadoProceso;
  seguimientoHabilitado: boolean;
}
