export interface Grupo {
  id: string;
  nombre: string;
  descripcion?: string;
  seguimientoHabilitado: boolean;
  inmuebles: number;
  actualizado: string;
}

export const gruposIniciales: Grupo[] = [
  {
    id: "g1",
    nombre: "Residencial A",
    descripcion: "Inmuebles residenciales del casco urbano.",
    seguimientoHabilitado: true,
    inmuebles: 1840,
    actualizado: "12/04/2026",
  },
  {
    id: "g2",
    nombre: "Residencial B",
    descripcion: "Inmuebles residenciales periféricos.",
    seguimientoHabilitado: true,
    inmuebles: 1245,
    actualizado: "10/04/2026",
  },
  {
    id: "g3",
    nombre: "Comercial",
    descripcion: "Locales y oficinas comerciales.",
    seguimientoHabilitado: true,
    inmuebles: 612,
    actualizado: "08/04/2026",
  },
  {
    id: "g4",
    nombre: "Industrial",
    descripcion: "Establecimientos industriales y depósitos.",
    seguimientoHabilitado: true,
    inmuebles: 184,
    actualizado: "05/04/2026",
  },
  {
    id: "g5",
    nombre: "Estatal",
    descripcion: "Inmuebles del Estado provincial y municipal.",
    seguimientoHabilitado: false,
    inmuebles: 96,
    actualizado: "02/04/2026",
  },
  {
    id: "g6",
    nombre: "Exento",
    descripcion: "Inmuebles con exención vigente. No participan del seguimiento.",
    seguimientoHabilitado: false,
    inmuebles: 42,
    actualizado: "28/03/2026",
  },
];
