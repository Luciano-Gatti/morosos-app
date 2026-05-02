export type ParametroSeguimiento = {
  codigo: string;
  nombre: string;
  descripcion?: string;
  valor: string | number | boolean;
  tipoDato?: "NUMBER" | "BOOLEAN" | "STRING";
  min?: number;
  max?: number;
};

export function mapParametroSeguimiento(row: any): ParametroSeguimiento {
  const tipo = (row.tipoDato ?? "").toUpperCase();
  return {
    codigo: String(row.codigo ?? row.key ?? ""),
    nombre: row.nombre ?? row.codigo ?? "Parámetro",
    descripcion: row.descripcion ?? row.observacion ?? undefined,
    valor: row.valor,
    tipoDato: tipo === "NUMBER" || tipo === "BOOLEAN" || tipo === "STRING" ? tipo : undefined,
    min: row.minimo ?? row.min ?? undefined,
    max: row.maximo ?? row.max ?? undefined,
  };
}

