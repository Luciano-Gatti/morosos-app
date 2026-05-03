export interface EtapaConfig {
  id: string;
  nombre: string;
  descripcion?: string;
  procesosAsociados: number;
}

export interface MotivoCierre {
  id: string;
  codigo?: string;
  nombre: string;
  descripcion?: string;
  activo: boolean;
  isSystem: boolean;
  usos: number;
}
