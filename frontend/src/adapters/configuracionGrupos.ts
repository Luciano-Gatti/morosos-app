import type { Grupo, GrupoDistrito } from "@/types/grupos";

export function mapGrupoDistritoConfig(row: any): GrupoDistrito & { id?: string; grupoId?: string; distritoId?: string } {
  return {
    id: row.id ? String(row.id) : undefined,
    grupoId: row.grupoId ? String(row.grupoId) : undefined,
    distritoId: row.distritoId ? String(row.distritoId) : undefined,
    distrito: row.distritoNombre ?? row.distrito ?? "-",
    seguimientoHabilitado: Boolean(row.seguimientoHabilitado ?? row.activo ?? false),
    inmuebles: Number(row.inmuebles ?? row.totalInmuebles ?? 0),
  };
}

export function mapGrupo(row: any, distritos: GrupoDistrito[] = []): Grupo {
  return {
    id: String(row.id),
    nombre: row.nombre ?? row.grupo ?? "-",
    descripcion: row.descripcion ?? undefined,
    actualizado: row.actualizado ?? row.updatedAt ?? "-",
    distritos,
  };
}

export function mapDistrito(row: any): { id: string; nombre: string; activo: boolean } {
  return {
    id: String(row.id),
    nombre: row.nombre ?? row.distrito ?? "-",
    activo: Boolean(row.activo ?? true),
  };
}

