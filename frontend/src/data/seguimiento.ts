import { inmueblesPadron, gruposInmueble, distritosInmueble } from "./inmuebles";

export const etapasSeguimiento = [
  "Aviso de deuda",
  "Intimación",
  "Aviso de corte",
  "Corte",
] as const;
export type EtapaSeguimiento = (typeof etapasSeguimiento)[number];

export const estadosProceso = ["No iniciado", "Activo", "Pausado", "Cerrado"] as const;
export type EstadoProceso = (typeof estadosProceso)[number];

// Grupos cuyo seguimiento NO está habilitado (aparecen en morosidad pero no en gestión de etapas)
export const gruposSinSeguimiento = new Set<string>(["Oficial"]);

export interface InmuebleMoroso {
  id: string;
  cuenta: string;
  titular: string;
  direccion: string;
  grupo: string;
  distrito: string;
  cuotasAdeudadas: number;
  montoAdeudado: number;
  etapa: EtapaSeguimiento | null; // null cuando proceso aún no iniciado
  estado: EstadoProceso;
  seguimientoHabilitado: boolean;
}

function pseudo(seed: number) {
  const x = Math.sin(seed * 9301 + 49297) * 233280;
  return x - Math.floor(x);
}

// Tomamos ~70% del padrón como morosos para que el listado tenga volumen real
export const inmueblesMorosos: InmuebleMoroso[] = inmueblesPadron
  .filter((inm, i) => pseudo(i + 1) > 0.28)
  .map((inm, i) => {
    const r = pseudo(parseInt(inm.id, 10) + 11);
    const r2 = pseudo(parseInt(inm.id, 10) + 23);
    const r3 = pseudo(parseInt(inm.id, 10) + 37);
    const cuotasAdeudadas = 1 + Math.floor(r * 18);
    const cuotaPromedio = 8500 + Math.floor(r2 * 42000);
    const montoAdeudado = Math.round((cuotasAdeudadas * cuotaPromedio) / 100) * 100;
    const seguimientoHabilitado = !gruposSinSeguimiento.has(inm.grupo);

    let etapa: EtapaSeguimiento | null = null;
    let estado: EstadoProceso = "No iniciado";

    if (seguimientoHabilitado) {
      // 70% activo, 15% pausado, 15% no iniciado
      if (r3 < 0.7) {
        estado = "Activo";
        const idx = Math.floor(r2 * etapasSeguimiento.length);
        etapa = etapasSeguimiento[idx];
      } else if (r3 < 0.85) {
        estado = "Pausado";
        const idx = Math.floor(r * etapasSeguimiento.length);
        etapa = etapasSeguimiento[idx];
      } else {
        estado = "No iniciado";
        etapa = null;
      }
    }

    return {
      id: inm.id,
      cuenta: inm.cuenta,
      titular: inm.titular,
      direccion: inm.direccion,
      grupo: inm.grupo,
      distrito: inm.distrito,
      cuotasAdeudadas,
      montoAdeudado,
      etapa,
      estado,
      seguimientoHabilitado,
    };
  })
  // Excluimos los que no tienen seguimiento habilitado (no gestionables en esta vista)
  .filter((m) => m.seguimientoHabilitado);

export { gruposInmueble as gruposSeguimiento, distritosInmueble as distritosSeguimiento };
