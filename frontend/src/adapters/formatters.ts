export const moneyFormatter = new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS", maximumFractionDigits: 0 });

export function formatCurrency(amount: number): string {
  return moneyFormatter.format(amount || 0);
}

export function formatDate(value?: string | null): string {
  if (!value) return "-";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  return d.toLocaleDateString("es-AR");
}

const estadoLabels: Record<string, string> = {
  ABIERTO: "Abierto",
  CERRADO: "Cerrado",
  PAUSADO: "Pausado",
  ACTIVO: "Activo",
  INACTIVO: "Inactivo",
};

export function estadoLabel(estado?: string): string {
  if (!estado) return "-";
  return estadoLabels[estado] ?? estado;
}

const tipoAccionLabels: Record<string, string> = {
  AVISO_DEUDA: "Aviso de deuda",
  AVISO_CORTE: "Aviso de corte",
  INTIMACION: "Intimación",
  CORTE: "Corte",
};

export function tipoAccionLabel(tipo?: string): string {
  if (!tipo) return "-";
  return tipoAccionLabels[tipo] ?? tipo;
}
