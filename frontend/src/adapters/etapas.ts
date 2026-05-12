import type { EtapaConfig } from "@/types/configuracion";

export function mapEtapa(row: any): EtapaConfig {
  return {
    id: String(row.id),
    codigo: String(row.codigo ?? row.nombre ?? row.etapa ?? "etapa"),
    nombre: row.nombre ?? row.etapa ?? "Etapa",
    descripcion: row.descripcion ?? undefined,
    activo: Boolean(row.activo ?? true),
    esFinal: Boolean(row.esFinal ?? false),
    procesosAsociados: Number(row.procesosAsociados ?? row.procesos ?? 0),
  };
}
