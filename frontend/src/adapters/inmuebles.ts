export interface InmuebleRowVm {
  id: string;
  cuenta: string;
  titular: string;
  direccion: string;
  grupoId: string;
  grupoCodigo: string;
  grupoNombre: string;
  distritoId: string;
  distritoCodigo: string;
  distritoNombre: string;
  activo: boolean;
  seguimientoHabilitado: boolean;
  telefono: string;
  email: string;
  observaciones: string;
  estadoLabel: string;
}

const s = (v: unknown, d = "") => (typeof v === "string" ? v : d);
const b = (v: unknown, d = false) => (typeof v === "boolean" ? v : d);

export function mapInmuebleRow(input: any): InmuebleRowVm {
  const activo = b(input?.activo, true);
  return {
    id: s(input?.id),
    cuenta: s(input?.cuenta, "-"),
    titular: s(input?.titular, "-"),
    direccion: s(input?.direccion, "-"),
    grupoId: s(input?.grupoId),
    grupoCodigo: s(input?.grupoCodigo),
    grupoNombre: s(input?.grupoNombre ?? input?.grupo, "-"),
    distritoId: s(input?.distritoId),
    distritoCodigo: s(input?.distritoCodigo),
    distritoNombre: s(input?.distritoNombre ?? input?.distrito, "-"),
    activo,
    seguimientoHabilitado: b(input?.seguimientoHabilitado, false),
    telefono: s(input?.telefono),
    email: s(input?.email),
    observaciones: s(input?.observaciones),
    estadoLabel: activo ? "Activo" : "Inactivo",
  };
}
