export type SeguimientoRow = {
  id: string;
  casoId: string;
  inmuebleId: string;
  cuenta: string;
  titular: string;
  direccion: string;
  grupo: string;
  distrito: string;
  cuotasAdeudadas: number;
  montoAdeudado: number;
  etapa: string | null;
  estado: "No iniciado" | "Activo" | "Pausado" | "Cerrado";
  accionesDisponibles?: {
    puedeIniciar?: boolean;
    puedeAvanzar?: boolean;
    puedeRepetir?: boolean;
    puedePausar?: boolean;
    puedeReabrir?: boolean;
    puedeCerrar?: boolean;
    puedeRegistrarCompromiso?: boolean;
  } | null;
};

export function mapEstadoCasoLabel(value: string): SeguimientoRow["estado"] {
  const v = (value ?? "").toUpperCase();
  if (v === "ACTIVO") return "Activo";
  if (v === "PAUSADO") return "Pausado";
  if (v === "CERRADO") return "Cerrado";
  return "No iniciado";
}

export function mapSeguimientoBandejaRow(row: any): SeguimientoRow {
  return {
    id: String(row.id ?? row.casoId ?? row.inmuebleId ?? ""),
    casoId: String(row.casoId ?? row.id ?? ""),
    inmuebleId: String(row.inmuebleId ?? row.idInmueble ?? ""),
    cuenta: String(row.cuenta ?? "-"),
    titular: row.titular ?? "-",
    direccion: row.direccion ?? "-",
    grupo: row.grupo ?? "-",
    distrito: row.distrito ?? "-",
    cuotasAdeudadas: Number(row.cuotasAdeudadas ?? row.cuotasVencidas ?? 0),
    montoAdeudado: Number(row.montoAdeudado ?? row.montoVencido ?? 0),
    etapa: row.etapaActual ?? row.etapa ?? null,
    estado: mapEstadoCasoLabel(row.estadoCaso ?? row.estado),
    accionesDisponibles:
      row && typeof row.accionesDisponibles === "object" && !Array.isArray(row.accionesDisponibles)
        ? row.accionesDisponibles
        : null,
  };
}
