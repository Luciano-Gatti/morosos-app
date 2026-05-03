export interface GrupoDistrito {
  distrito: string;
  seguimientoHabilitado: boolean;
  inmuebles: number;
}

export interface Grupo {
  id: string;
  nombre: string;
  descripcion?: string;
  distritos: GrupoDistrito[];
  actualizado: string;
}
