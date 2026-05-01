import type { MotivoCierre } from "@/data/motivosCierre";

export function mapMotivoCierre(row: any): MotivoCierre {
  return {
    id: String(row.id),
    codigo: row.codigo ?? undefined,
    nombre: row.nombre ?? "Motivo",
    descripcion: row.descripcion ?? row.observacion ?? undefined,
    activo: Boolean(row.activo ?? true),
    isSystem: Boolean(row.isSystem ?? row.sistema ?? false),
    usos: Number(row.usos ?? row.cantidadUsos ?? 0),
  };
}

