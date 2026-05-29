export const etapasSeguimiento = [
  "Aviso de deuda",
  "Intimación",
  "Aviso de corte",
  "Corte",
  "Sin etapa asignada",
] as const;
export type EtapaSeguimiento = string;

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
  seguimientoHabilitado?: boolean;
  casoId?: string;
  fechaProgramada?: string | null;
  accionesDisponibles?: {
    puedeIniciar?: boolean;
    puedeAvanzar?: boolean;
    puedeRepetir?: boolean;
    puedePausar?: boolean;
    puedeReabrir?: boolean;
    puedeCerrar?: boolean;
    puedeRegistrarCompromiso?: boolean;
  } | null;
}
