export interface InmuebleDetalleViewModel {
  id: string;
  cuenta: string;
  titular: string;
  direccion: string;
  telefono: string;
  email: string;
  observaciones: string;
  activo: boolean;
  seguimientoHabilitado: boolean;
  grupoId: string;
  grupoCodigo: string;
  grupoNombre: string;
  distritoId: string;
  distritoCodigo: string;
  distritoNombre: string;
  createdAt: string;
  updatedAt: string;
  estadoLabel: string;
  seguimientoLabel: string;
  resumenOperativo: {
    ultimaGestion: string | null;
    etapaActualNombre: string | null;
    estadoProceso: string | null;
    periodosAdeudados: number;
    montoAdeudado: number;
  };
}

const asString = (v: unknown, d = "") => (typeof v === "string" ? v : d);
const asBool = (v: unknown, d = false) => (typeof v === "boolean" ? v : d);

export function mapInmuebleDetalle(input: any): InmuebleDetalleViewModel {
  const activo = asBool(input?.activo, true);
  const seguimientoHabilitado = asBool(input?.seguimientoHabilitado, false);
  return {
    id: asString(input?.id),
    cuenta: asString(input?.cuenta, "-"),
    titular: asString(input?.titular, "-"),
    direccion: asString(input?.direccion, "-"),
    telefono: asString(input?.telefono, ""),
    email: asString(input?.email, ""),
    observaciones: asString(input?.observaciones, ""),
    activo,
    seguimientoHabilitado,
    grupoId: asString(input?.grupoId),
    grupoCodigo: asString(input?.grupoCodigo),
    grupoNombre: asString(input?.grupoNombre ?? input?.grupo, "-"),
    distritoId: asString(input?.distritoId),
    distritoCodigo: asString(input?.distritoCodigo),
    distritoNombre: asString(input?.distritoNombre ?? input?.distrito, "-"),
    createdAt: asString(input?.createdAt),
    updatedAt: asString(input?.updatedAt),
    estadoLabel: activo ? "Activo" : "Inactivo",
    seguimientoLabel: seguimientoHabilitado ? "Habilitado" : "Deshabilitado",
    resumenOperativo: {
      ultimaGestion: typeof input?.resumenOperativo?.ultimaGestion === "string" ? input.resumenOperativo.ultimaGestion : null,
      etapaActualNombre: typeof input?.resumenOperativo?.etapaActualNombre === "string" ? input.resumenOperativo.etapaActualNombre : null,
      estadoProceso: typeof input?.resumenOperativo?.estadoProceso === "string" ? input.resumenOperativo.estadoProceso : null,
      periodosAdeudados: Number(input?.resumenOperativo?.periodosAdeudados ?? 0),
      montoAdeudado: Number(input?.resumenOperativo?.montoAdeudado ?? 0),
    },
  };
}
