import type { EtapaConfig } from "@/data/etapas";

export function mapEtapa(row: any): EtapaConfig {
  return {
    id: String(row.id),
    nombre: row.nombre ?? row.etapa ?? "Etapa",
    descripcion: row.descripcion ?? undefined,
    procesosAsociados: Number(row.procesosAsociados ?? row.procesos ?? 0),
  };
}
