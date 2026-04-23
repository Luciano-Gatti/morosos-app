export interface InmuebleCarga {
  cuenta: string;
  titular: string;
  direccion: string;
  cuotas: number;
  monto: number;
}

export interface ErrorImportacion {
  fila: number;
  cuenta: string;
  descripcion: string;
}

const titulares = [
  "Acosta, María Elena",
  "Benítez, Roberto Carlos",
  "Cáceres, Norma Beatriz",
  "Domínguez, Jorge Luis",
  "Escobar, Patricia del Valle",
  "Fernández, Hugo Alberto",
  "Gómez, Silvia Ester",
  "Herrera, Marcelo Daniel",
  "Ibáñez, Lucía Mariana",
  "Juárez, Pedro Antonio",
  "Krause, Andrea Verónica",
  "López, Ricardo Omar",
  "Molina, Claudia Inés",
  "Núñez, Sergio Fabián",
  "Ortiz, Mónica Cristina",
  "Paredes, Diego Sebastián",
  "Quiroga, Liliana Mabel",
  "Ramírez, Eduardo Hernán",
  "Sánchez, Adriana Noemí",
  "Torres, Walter Damián",
];

const calles = [
  "Av. Belgrano",
  "9 de Julio",
  "San Martín",
  "Sarmiento",
  "Mitre",
  "Av. España",
  "Rivadavia",
  "Pellegrini",
  "Alberdi",
  "Av. 3 de Abril",
  "Bolívar",
  "Quintana",
  "Av. Costanera",
  "Independencia",
  "Las Heras",
];

const distritos = ["Centro", "Norte", "Sur", "Loreto", "Mercedes", "Goya", "Industrial"];

function pseudoFloat(seed: number) {
  const x = Math.sin(seed) * 10000;
  return x - Math.floor(x);
}

export function generarInmueblesCarga(cargaId: string, cantidad: number): InmuebleCarga[] {
  const seedBase = Number.parseInt(cargaId, 10) * 137 || 1;
  return Array.from({ length: cantidad }, (_, i) => {
    const s = seedBase + i;
    const cuenta = String(100000 + ((s * 31) % 899999));
    const titular = titulares[(s * 7) % titulares.length];
    const calle = calles[(s * 13) % calles.length];
    const altura = 100 + ((s * 23) % 4800);
    const distrito = distritos[(s * 11) % distritos.length];
    const direccion = `${calle} ${altura}, ${distrito}`;
    const cuotas = 1 + Math.floor(pseudoFloat(s) * 18);
    const montoBase = 8500 + Math.floor(pseudoFloat(s + 1) * 65000);
    const monto = Math.round((cuotas * montoBase) / 100) * 100;
    return { cuenta, titular, direccion, cuotas, monto };
  });
}

const tiposError = [
  "Cuenta no encontrada en el padrón",
  "Formato de monto inválido",
  "Cantidad de cuotas fuera de rango",
  "Titular no coincide con el padrón",
  "Fecha de vencimiento inválida",
  "Campo obligatorio vacío: monto",
  "Campo obligatorio vacío: cuenta",
  "Cuenta duplicada en el archivo",
  "Inmueble dado de baja",
  "Distrito no reconocido",
];

export function generarErroresImportacion(
  cargaId: string,
  cantidad: number,
): ErrorImportacion[] {
  const seedBase = Number.parseInt(cargaId, 10) * 211 || 1;
  return Array.from({ length: cantidad }, (_, i) => {
    const s = seedBase + i;
    const fila = 2 + ((s * 17) % 1800);
    const cuenta = String(100000 + ((s * 41) % 899999));
    const descripcion = tiposError[(s * 5) % tiposError.length];
    return { fila, cuenta, descripcion };
  }).sort((a, b) => a.fila - b.fila);
}
