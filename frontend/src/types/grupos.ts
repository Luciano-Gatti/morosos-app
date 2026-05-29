export interface GrupoDistrito {
  distrito: string;
  seguimientoHabilitado: boolean;
  inmuebles: number;
}

export interface Grupo {
  id: string;
  nombre: string;
  descripcion?: string;
  activo?: boolean;
  distritos: GrupoDistrito[];
  actualizado: string;
}
