export interface HistorialSeguimientoViewModel {
  inmueble: {
    inmuebleId: string;
    cuenta: string;
    titular: string;
    direccion: string;
    grupo: string;
    distrito: string;
    activo: boolean;
    seguimientoHabilitado: boolean;
  };
  casos: Array<{
    casoId: string;
    estado: string;
    etapaActual: string;
    fechaInicio: string;
    fechaUltimoMovimiento: string;
    observacion: string;
  }>;
  eventos: Array<{
    eventoId: string;
    casoId: string;
    tipoEvento: string;
    tipoEventoLabel: string;
    etapaOrigen: string;
    etapaDestino: string;
    fechaEvento: string;
    observacion: string;
    metadata: Record<string, unknown> | null;
  }>;
  cierres: Array<{
    cierreId: string;
    casoId: string;
    motivoCodigo: string;
    motivoNombre: string;
    fechaCierre: string;
    observacion: string;
    planPago: Record<string, unknown> | null;
    cambioParametro: Record<string, unknown> | null;
  }>;
  compromisos: Array<{
    compromisoId: string;
    casoId: string;
    fechaDesde: string;
    fechaHasta: string;
    montoComprometido: number;
    estado: string;
    estadoLabel: string;
    observacion: string;
  }>;
  procesos: Array<{
    id: string;
    estado: "abierto" | "cerrado";
    registros: Array<any>;
    cierre: any;
    compromisos: any[];
  }>;
  observacionesLibres: Array<{ id: string; fecha: string; autor: string; cargo: string; texto: string }>;
}

const s = (v: unknown, d = "-") => (typeof v === "string" && v.trim() ? v : d);
const n = (v: unknown, d = 0) => (typeof v === "number" && Number.isFinite(v) ? v : d);
const b = (v: unknown, d = false) => (typeof v === "boolean" ? v : d);

export function mapHistorialSeguimiento(input: any, fallbackInmuebleId: string): HistorialSeguimientoViewModel {
  const inmuebleRaw = input?.inmueble ?? input?.inmuebleResumen ?? {};
  const casosRaw = Array.isArray(input?.casos) ? input.casos : [];

  const casos = casosRaw.map((c: any) => ({
    casoId: s(c?.id ?? c?.casoId, ""),
    estado: s(c?.estado, "abierto"),
    etapaActual: s(c?.etapaActual ?? c?.etapaNombre),
    fechaInicio: s(c?.fechaInicio),
    fechaUltimoMovimiento: s(c?.fechaUltimoMovimiento),
    observacion: s(c?.observacion, ""),
  }));

  const eventos: HistorialSeguimientoViewModel["eventos"] = [];
  const cierres: HistorialSeguimientoViewModel["cierres"] = [];
  const compromisos: HistorialSeguimientoViewModel["compromisos"] = [];

  const procesos = casosRaw.map((c: any, ci: number) => {
    const casoId = s(c?.id ?? c?.casoId, `caso-${ci}`);
    const eventosCaso = (Array.isArray(c?.eventos) ? c.eventos : []).map((e: any, ei: number) => {
      const mapped = {
        eventoId: s(e?.id, `${casoId}-evt-${ei}`),
        casoId,
        tipoEvento: s(e?.tipoAccion ?? e?.tipo, "evento"),
        tipoEventoLabel: s(e?.tipoAccionLabel ?? e?.tipoLabel ?? e?.tipoAccion ?? e?.tipo, "Evento"),
        etapaOrigen: s(e?.etapaOrigen),
        etapaDestino: s(e?.etapaDestino ?? e?.etapaNombre ?? e?.etapa, "Sin etapa"),
        fechaEvento: s(e?.fechaEvento ?? e?.fecha),
        observacion: s(e?.descripcion ?? e?.detalle ?? e?.observacion, ""),
        metadata: (e?.metadata ?? null) as Record<string, unknown> | null,
      };
      eventos.push(mapped);
      return {
        id: mapped.eventoId,
        fecha: mapped.fechaEvento,
        etapa: mapped.etapaDestino,
        estado: s(c?.estado, "Activo"),
        responsable: s(e?.actorNombre ?? e?.actorId, "Sistema"),
        tipoAccion: mapped.tipoEventoLabel,
        descripcion: mapped.observacion,
        metadata: mapped.metadata,
      };
    });

    (Array.isArray(c?.compromisos) ? c.compromisos : []).forEach((cp: any, cpi: number) => {
      compromisos.push({
        compromisoId: s(cp?.id, `${casoId}-comp-${cpi}`),
        casoId,
        fechaDesde: s(cp?.fechaDesde),
        fechaHasta: s(cp?.fechaHasta),
        montoComprometido: n(cp?.montoComprometido),
        estado: s(cp?.estado),
        estadoLabel: s(cp?.estadoLabel ?? cp?.estado),
        observacion: s(cp?.observacion, ""),
      });
    });

    const cierreRaw = c?.cierre ?? null;
    const cierre = cierreRaw
      ? {
          cierreId: s(cierreRaw?.id, `${casoId}-cierre`),
          casoId,
          motivoCodigo: s(cierreRaw?.motivoCodigo, ""),
          motivoNombre: s(cierreRaw?.motivoNombre ?? cierreRaw?.motivoDescripcion),
          fechaCierre: s(cierreRaw?.fechaCierre),
          observacion: s(cierreRaw?.observacion, ""),
          planPago: (cierreRaw?.planPago ?? null) as Record<string, unknown> | null,
          cambioParametro: (cierreRaw?.cambioParametro ?? null) as Record<string, unknown> | null,
        }
      : null;
    if (cierre) cierres.push(cierre);

    return {
      id: casoId,
      estado: s(c?.estado, "abierto").toLowerCase() === "cerrado" ? "cerrado" : "abierto",
      registros: eventosCaso,
      cierre,
      compromisos: compromisos.filter((x) => x.casoId === casoId),
    } as const;
  });

  return {
    inmueble: {
      inmuebleId: s(inmuebleRaw?.id ?? inmuebleRaw?.inmuebleId ?? fallbackInmuebleId, fallbackInmuebleId),
      cuenta: s(inmuebleRaw?.cuenta),
      titular: s(inmuebleRaw?.titular),
      direccion: s(inmuebleRaw?.direccion),
      grupo: s(inmuebleRaw?.grupo ?? inmuebleRaw?.grupoNombre),
      distrito: s(inmuebleRaw?.distrito ?? inmuebleRaw?.distritoNombre),
      activo: b(inmuebleRaw?.activo, true),
      seguimientoHabilitado: b(inmuebleRaw?.seguimientoHabilitado, true),
    },
    casos,
    eventos,
    cierres,
    compromisos,
    procesos,
    observacionesLibres: Array.isArray(input?.observaciones)
      ? input.observaciones.map((o: any, i: number) => ({ id: s(o?.id, `obs-${i}`), fecha: s(o?.fecha), autor: s(o?.autor, "Sistema"), cargo: s(o?.cargo, "-"), texto: s(o?.texto, "") }))
      : [],
  };
}

export function isHistorialEmpty(vm: HistorialSeguimientoViewModel): boolean {
  return vm.casos.length === 0 && vm.eventos.length === 0 && vm.cierres.length === 0 && vm.compromisos.length === 0;
}
