export type Grupo = {
  id: string;
  nombre: string;
  seguimientoActivo: boolean;
};

export type GrupoPayload = {
  nombre: string;
  seguimientoActivo: boolean;
};
