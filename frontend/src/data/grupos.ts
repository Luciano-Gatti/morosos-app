/**
 * Modelo de Grupo con relación grupo↔distrito.
 *
 * Un grupo puede estar asociado a uno o más distritos. El seguimiento
 * de morosidad se configura POR distrito dentro del grupo, no a nivel
 * global del grupo.
 */
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

/** Total de inmuebles del grupo, sumando todos sus distritos. */
export function totalInmueblesGrupo(g: Grupo): number {
  return g.distritos.reduce((acc, d) => acc + d.inmuebles, 0);
}

/** Resumen "Activo en X de Y distritos". */
export function resumenSeguimiento(g: Grupo): {
  activos: number;
  total: number;
  estado: "todos" | "ninguno" | "parcial" | "sin-distritos";
} {
  const total = g.distritos.length;
  if (total === 0) return { activos: 0, total: 0, estado: "sin-distritos" };
  const activos = g.distritos.filter((d) => d.seguimientoHabilitado).length;
  let estado: "todos" | "ninguno" | "parcial" = "parcial";
  if (activos === 0) estado = "ninguno";
  else if (activos === total) estado = "todos";
  return { activos, total, estado };
}

/** ¿El par grupo+distrito tiene seguimiento habilitado? */
export function seguimientoHabilitadoEn(
  g: Grupo,
  distrito: string,
): boolean {
  return g.distritos.some(
    (d) => d.distrito === distrito && d.seguimientoHabilitado,
  );
}

export const gruposIniciales: Grupo[] = [
  {
    id: "g1",
    nombre: "Residencial A",
    descripcion: "Inmuebles residenciales del casco urbano.",
    distritos: [
      { distrito: "Loreto", seguimientoHabilitado: true, inmuebles: 1120 },
      { distrito: "Ituzaingó", seguimientoHabilitado: true, inmuebles: 720 },
    ],
    actualizado: "12/04/2026",
  },
  {
    id: "g2",
    nombre: "Residencial B",
    descripcion: "Inmuebles residenciales periféricos.",
    distritos: [
      { distrito: "Loreto", seguimientoHabilitado: true, inmuebles: 745 },
      { distrito: "Ituzaingó", seguimientoHabilitado: false, inmuebles: 500 },
    ],
    actualizado: "10/04/2026",
  },
  {
    id: "g3",
    nombre: "Comercial",
    descripcion: "Locales y oficinas comerciales.",
    distritos: [
      { distrito: "Loreto", seguimientoHabilitado: true, inmuebles: 348 },
      { distrito: "Ituzaingó", seguimientoHabilitado: true, inmuebles: 264 },
    ],
    actualizado: "08/04/2026",
  },
  {
    id: "g4",
    nombre: "Industrial",
    descripcion: "Establecimientos industriales y depósitos.",
    distritos: [
      { distrito: "Loreto", seguimientoHabilitado: true, inmuebles: 124 },
    ],
    actualizado: "05/04/2026",
  },
  {
    id: "g5",
    nombre: "Estatal",
    descripcion: "Inmuebles del Estado provincial y municipal.",
    distritos: [
      { distrito: "Loreto", seguimientoHabilitado: false, inmuebles: 56 },
      { distrito: "Ituzaingó", seguimientoHabilitado: false, inmuebles: 40 },
    ],
    actualizado: "02/04/2026",
  },
  {
    id: "g6",
    nombre: "Exento",
    descripcion:
      "Inmuebles con exención vigente. No participan del seguimiento.",
    distritos: [
      { distrito: "Loreto", seguimientoHabilitado: false, inmuebles: 42 },
    ],
    actualizado: "28/03/2026",
  },
];
