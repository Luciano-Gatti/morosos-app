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
  const eventosRaw = Array.isArray(input?.eventos) ? input.eventos : [];
  const cierresRaw = Array.isArray(input?.cierres) ? input.cierres : [];
  const compromisosRaw = Array.isArray(input?.compromisos) ? input.compromisos : [];

  const toEstadoEtapa = (tipoEvento: string, estadoCaso: string, isUltimo: boolean) => {
    if (tipoEvento === "CIERRE_PROCESO") return "Cerrado";
    if (!isUltimo) return "Cerrado";
    const e = estadoCaso.toUpperCase();
    if (e === "PAUSADO") return "Pausado";
    if (e === "CERRADO") return "Cerrado";
    if (e === "ABIERTO" || e === "INICIADO") return "Iniciado";
    return "No iniciado";
  };

  const casos = casosRaw.map((c: any) => ({
    casoId: s(c?.id ?? c?.casoId, ""),
    estado: s(c?.estado, "NO_INICIADO"),
    etapaActual: s(c?.etapaActual ?? c?.etapaNombre, "Sin etapa asignada"),
    fechaInicio: s(c?.fechaInicio),
    fechaUltimoMovimiento: s(c?.fechaUltimoMovimiento),
    observacion: s(c?.observacion, ""),
  }));

  const eventos: HistorialSeguimientoViewModel["eventos"] = eventosRaw.map((e: any, i: number) => ({
    eventoId: s(e?.id ?? e?.eventoId, `evt-${i}`),
    casoId: s(e?.casoId),
    tipoEvento: s(e?.tipoEvento ?? e?.tipoAccion ?? e?.tipo, "evento"),
    tipoEventoLabel: s(e?.tipoEventoLabel ?? e?.tipoAccionLabel ?? e?.tipoEvento, "Evento"),
    etapaOrigen: s(e?.etapaOrigen, "Sin etapa asignada"),
    etapaDestino: s(e?.etapaDestino ?? e?.etapaNombre ?? e?.etapa, "Sin etapa asignada"),
    fechaEvento: s(e?.fechaEvento ?? e?.fecha),
    observacion: s(e?.observacion ?? e?.descripcion ?? e?.detalle, "No informado"),
    metadata: (e?.metadata ?? null) as Record<string, unknown> | null,
  }));
  const cierres: HistorialSeguimientoViewModel["cierres"] = cierresRaw.map((c: any, i: number) => ({
    cierreId: s(c?.id ?? c?.cierreId, `cierre-${i}`),
    casoId: s(c?.casoId),
    motivoCodigo: s(c?.motivoCodigo, ""),
    motivoNombre: s(c?.motivoNombre ?? c?.motivoDescripcion, "No informado"),
    fechaCierre: s(c?.fechaCierre),
    observacion: s(c?.observacion, "No informado"),
    planPago: (c?.planPago ?? null) as Record<string, unknown> | null,
    cambioParametro: (c?.cambioParametro ?? null) as Record<string, unknown> | null,
  }));
  const compromisos: HistorialSeguimientoViewModel["compromisos"] = compromisosRaw.map((cp: any, i: number) => ({
    compromisoId: s(cp?.id ?? cp?.compromisoId, `comp-${i}`),
    casoId: s(cp?.casoId),
    fechaDesde: s(cp?.fechaDesde),
    fechaHasta: s(cp?.fechaHasta),
    montoComprometido: n(cp?.montoComprometido),
    estado: s(cp?.estado),
    estadoLabel: s(cp?.estadoLabel ?? cp?.estado),
    observacion: s(cp?.observacion, "No informado"),
  }));

  const procesos = casosRaw.map((c: any, ci: number) => {
    const casoId = s(c?.id ?? c?.casoId, `caso-${ci}`);
    const eventosCasoRaw = eventos.filter((e) => e.casoId === casoId);
    const eventosCaso = eventosCasoRaw.map((mapped, idx) => {
      const tipoEvento = s(mapped.tipoEvento, "").toUpperCase();
      const isUltimo = idx === eventosCasoRaw.length - 1;
      return {
        id: mapped.eventoId,
        fecha: mapped.fechaEvento,
        etapa: mapped.etapaDestino,
        estado: toEstadoEtapa(tipoEvento, s(c?.estado, "ABIERTO"), isUltimo),
        responsable: "Sistema",
        tipoAccion: mapped.tipoEventoLabel,
        observaciones: mapped.observacion,
        numeroProceso: casoId,
        hora: mapped.fechaEvento.includes("T") ? mapped.fechaEvento.split("T")[1]?.slice(0, 5) : "00:00",
        metadata: mapped.metadata,
        cierre: tipoEvento === "CIERRE_PROCESO" ? (cierres.find((x) => x.casoId === casoId)?.motivoNombre ?? null) : null,
      };
    });
    if (eventosCaso.length === 0) {
      eventosCaso.push({
        id: `${casoId}-apertura`,
        fecha: s(c?.fechaInicio),
        hora: "00:00",
        etapa: s(c?.etapaActual ?? c?.etapaNombre, "Sin etapa asignada"),
        estado: "No iniciado",
        responsable: "No informado",
        tipoAccion: "Sin seguimiento iniciado",
        observaciones: s(c?.observacion, "No informado"),
        numeroProceso: casoId,
        metadata: null,
      });
    }
    const cierre = cierres.find((x) => x.casoId === casoId) ?? null;

    return {
      id: casoId,
      estado: s(c?.estado, "NO_INICIADO").toUpperCase() === "CERRADO" ? "cerrado" : "abierto",
      fechaInicio: s(c?.fechaInicio, "No informado"),
      fechaFin: cierre?.fechaCierre ?? null,
      motivoCierre: cierre?.motivoNombre ?? null,
      registros: eventosCaso,
      cierre,
      compromisos: compromisos.filter((x) => x.casoId === casoId),
    } as const;
  });

  if (procesos.length === 0) {
    procesos.push({
      id: "NO_INICIADO",
      estado: "abierto",
      fechaInicio: "No informado",
      fechaFin: null,
      motivoCierre: null,
      cierre: null,
      compromisos: [],
      registros: [{
        id: "no-iniciado",
        fecha: "No informado",
        hora: "00:00",
        etapa: "Sin etapa asignada",
        estado: "No iniciado",
        responsable: "Sistema",
        tipoAccion: "Sin seguimiento iniciado",
        observaciones: "El inmueble aún no tiene un proceso de seguimiento iniciado.",
        numeroProceso: "NO_INICIADO",
        metadata: null,
      }],
    } as any);
  }

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
