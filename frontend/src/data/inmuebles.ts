export interface Inmueble {
  id: string;
  cuenta: string;
  titular: string;
  direccion: string;
  grupo: string;
  distrito: string;
  activo: boolean;
}

const grupos = ["Residencial A", "Residencial B", "Comercial", "Industrial", "Oficial"];
const distritos = ["Loreto", "Ituzaingó"];
const titulares = [
  "González, María Inés",
  "Comercial del Sur S.R.L.",
  "Pereyra, Carlos A.",
  "Industrias Norte S.A.",
  "Martínez, Laura B.",
  "Rodríguez, Hugo D.",
  "Fernández, Roberto",
  "López, Ana María",
  "Distribuidora Litoral S.A.",
  "Sosa, Juan Manuel",
  "Acosta, Verónica",
  "Cooperativa Agraria Ltda.",
  "Benítez, Ramón",
  "Suárez, Gabriela",
  "Ferretería del Centro S.R.L.",
  "Ojeda, Norberto",
  "Molina, Patricia",
  "Vázquez, Sergio E.",
  "Hotel Plaza S.A.",
  "Romero, Estela",
];
const calles = [
  "Av. San Martín",
  "Belgrano",
  "Sarmiento",
  "Mitre",
  "España",
  "Rivadavia",
  "Pellegrini",
  "9 de Julio",
  "25 de Mayo",
  "Av. Costanera",
  "Bolívar",
  "Junín",
];

function pick<T>(arr: T[], i: number): T {
  return arr[i % arr.length];
}

export const inmueblesPadron: Inmueble[] = Array.from({ length: 86 }, (_, i) => {
  const idx = i + 1;
  const cuentaA = String(40 + (idx * 7) % 600).padStart(4, "0");
  const cuentaB = String((idx * 113) % 1000).padStart(3, "0");
  const cuentaC = String((idx * 3) % 10);
  return {
    id: String(idx),
    cuenta: `${cuentaA}-${cuentaB}-${cuentaC}`,
    titular: pick(titulares, i),
    direccion: `${pick(calles, i)} ${100 + ((idx * 37) % 4800)}`,
    grupo: pick(grupos, i),
    distrito: pick(distritos, i + 2),
    activo: i % 9 !== 0,
  };
});

export const gruposInmueble = grupos;
export const distritosInmueble = distritos;
