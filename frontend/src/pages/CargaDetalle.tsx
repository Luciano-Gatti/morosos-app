import { useEffect, useState } from "react";
import { Link, useParams, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Search,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  ChevronLeft,
  ChevronRight,
  Filter,
  AlertTriangle,
  Download,
  CalendarClock,
  User2,
  Coins,
  Users,
  CheckCircle2,
  XCircle,
  Clock,
} from "lucide-react";
import { AppHeader } from "@/components/layout/AppHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { type CargaDeuda, type CargaEstado } from "@/types/deuda";
import type { InmuebleCarga, ErrorImportacion } from "@/types/deuda";
import { deudaApi } from "@/services/api/deudaApi";

type SortKey = "cuenta" | "titular" | "direccion" | "cuotas" | "monto";
type SortDir = "asc" | "desc";

const PAGE_SIZE = 12;

const toEstado = (v: string): CargaEstado => v === "COMPLETADA" ? "completada" : v === "COMPLETADA_CON_ERRORES" ? "con_errores" : v === "FALLIDA" ? "fallida" : "procesando";
const mapCarga = (row: any): CargaDeuda => ({ id: String(row.id ?? ""), fecha: row.fecha ?? row.createdAt ?? new Date().toISOString(), nombre: row.nombre ?? row.archivo ?? `Carga #${row.id ?? "-"}`, usuario: row.usuario ?? row.operador ?? "-", estado: toEstado(row.estado ?? "PROCESANDO"), morosos: Number(row.morosos ?? 0), montoTotal: Number(row.montoTotal ?? 0), procesados: Number(row.procesados ?? 0), creados: Number(row.creados ?? 0), errores: Number(row.errores ?? 0), noEncontradas: Number(row.noEncontradas ?? 0) });

const moneyFmt = new Intl.NumberFormat("es-AR", {
  style: "currency",
  currency: "ARS",
  maximumFractionDigits: 0,
});
const numberFmt = new Intl.NumberFormat("es-AR");

function formatFecha(iso: string) {
  const d = new Date(iso);
  return {
    fecha: d.toLocaleDateString("es-AR", { day: "2-digit", month: "2-digit", year: "numeric" }),
    hora: d.toLocaleTimeString("es-AR", { hour: "2-digit", minute: "2-digit" }),
  };
}

export default function CargaDetalle() {
  const { id = "" } = useParams();
  const navigate = useNavigate();
  const [carga, setCarga] = useState<CargaDeuda | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [query, setQuery] = useState("");
  const [cuotasMin, setCuotasMin] = useState("");
  const [montoMin, setMontoMin] = useState("");
  const [sortKey, setSortKey] = useState<SortKey>("monto");
  const [sortDir, setSortDir] = useState<SortDir>("desc");
  const [page, setPage] = useState(1);
  const [erroresOpen, setErroresOpen] = useState(false);
  const [erroresPage, setErroresPage] = useState(1);
  const [erroresTotalPages, setErroresTotalPages] = useState(1);
  const [erroresTotalElements, setErroresTotalElements] = useState(0);

  const [inmuebles, setInmuebles] = useState<InmuebleCarga[]>([]);
  const [erroresList, setErroresList] = useState<ErrorImportacion[]>([]);
  const [detalleTotalPages, setDetalleTotalPages] = useState(1);
  const [detalleTotalElements, setDetalleTotalElements] = useState(0);

  useEffect(() => {
    const load = async () => {
      if (!id) return;
      try {
        setLoading(true);
        setError(null);
        const sort = `${sortKey},${sortDir}`;
        const [c, d, e] = await Promise.all([
          deudaApi.getCarga(id),
          deudaApi.getDetalles(id, {
            page: page - 1,
            size: PAGE_SIZE,
            search: query.trim() || undefined,
            cuotasMin: cuotasMin === "" ? undefined : Number(cuotasMin),
            montoMin: montoMin === "" ? undefined : Number(montoMin),
            sort,
          }),
          deudaApi.getErrores(id, { page: erroresPage - 1, size: PAGE_SIZE }),
        ]);
        setCarga(mapCarga(c));
        setInmuebles((d?.content ?? d ?? []).map((r: any) => ({ cuenta: String(r.cuenta ?? r.idCuenta ?? "-"), titular: r.titular ?? "-", direccion: r.direccion ?? "-", cuotas: Number(r.cuotas ?? 0), monto: Number(r.monto ?? 0) })));
        setDetalleTotalPages(Math.max(1, d?.totalPages || 1));
        setDetalleTotalElements(d?.totalElements || 0);
        setErroresList((e?.content ?? e ?? []).map((r: any, i: number) => ({ fila: Number(r.fila ?? i + 1), cuenta: String(r.cuenta ?? "-"), descripcion: r.descripcion ?? r.error ?? "Error" })));
        setErroresTotalPages(Math.max(1, e?.totalPages || 1));
        setErroresTotalElements(e?.totalElements || 0);
      } catch (err) {
        setError("No se pudo cargar el detalle");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [id, page, query, cuotasMin, montoMin, sortKey, sortDir, erroresPage]);

  const totalPages = Math.max(1, detalleTotalPages);
  const safePage = Math.min(page, totalPages);
  const pageStart = (safePage - 1) * PAGE_SIZE;
  const pageRows = inmuebles;

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else {
      setSortKey(key);
      setSortDir(key === "cuotas" || key === "monto" ? "desc" : "asc");
    }
    setPage(1);
  };

  const hasFilters = query !== "" || cuotasMin !== "" || montoMin !== "";
  const resetFilters = () => {
    setQuery("");
    setCuotasMin("");
    setMontoMin("");
    setPage(1);
  };

  if (!carga) {
    return (
      <>
        <AppHeader
          title="Carga no encontrada"
          breadcrumb={[{ label: "Gestión de deuda", to: "/deuda" }, { label: "Detalle" }]}
        />
        <main className="flex-1 px-6 py-10">
          <div className="rounded-md border border-border bg-surface p-8 text-center">
            <p className="text-[13px] text-muted-foreground">
              La carga solicitada no existe o fue eliminada.
            </p>
            <Button asChild variant="outline" size="sm" className="mt-4">
              <Link to="/deuda">Volver al listado</Link>
            </Button>
          </div>
        </main>
      </>
    );
  }

  const { fecha, hora } = formatFecha(carga.fecha);
  const sumaMonto = inmuebles.reduce((acc, r) => acc + r.monto, 0);
  const promedioCuotas =
    inmuebles.length === 0
      ? 0
      : Math.round((inmuebles.reduce((a, r) => a + r.cuotas, 0) / inmuebles.length) * 10) / 10;

  return (
    <>
      <AppHeader
        title={carga.nombre}
        description="Detalle de inmuebles incluidos en la carga."
        breadcrumb={[
          { label: "Gestión de deuda", to: "/deuda" },
          { label: `Carga #${carga.id}` },
        ]}
        actions={
          <>
            <Button variant="outline" size="sm" className="h-9 gap-2" onClick={() => navigate("/deuda")}>
              <ArrowLeft className="h-4 w-4" />
              Volver
            </Button>
            {(carga.errores > 0 || carga.noEncontradas > 0) && (
              <Button
                variant="outline"
                size="sm"
                className="h-9 gap-2 border-amber-300 bg-amber-50 text-amber-900 hover:bg-amber-100 hover:text-amber-900"
                onClick={() => setErroresOpen(true)}
              >
                <AlertTriangle className="h-4 w-4" />
                Ver errores ({numberFmt.format(carga.errores + carga.noEncontradas)})
              </Button>
            )}
            <Button size="sm" className="h-9 gap-2">
              <Download className="h-4 w-4" />
              Exportar detalle
            </Button>
          </>
        }
      />

      <main className="flex-1 space-y-4 px-6 py-6">
        {/* Cabecera de la carga */}
        <section className="rounded-md border border-border bg-surface shadow-sm">
          <div className="flex flex-wrap items-start gap-x-8 gap-y-3 px-5 py-4">
            <FichaItem
              icon={<CalendarClock className="h-4 w-4" />}
              label="Fecha y hora"
              value={
                <span className="tabular">
                  {fecha} <span className="text-muted-foreground">· {hora} hs</span>
                </span>
              }
            />
            <FichaItem
              icon={<User2 className="h-4 w-4" />}
              label="Operador"
              value={carga.usuario}
            />
            <div className="ml-auto">
              <EstadoPill estado={carga.estado} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-px border-t border-border bg-border lg:grid-cols-4">
            <Metric
              icon={<Users className="h-4 w-4" />}
              label="Inmuebles morosos"
              value={numberFmt.format(carga.morosos)}
            />
            <Metric
              icon={<Coins className="h-4 w-4" />}
              label="Monto total adeudado"
              value={moneyFmt.format(carga.montoTotal)}
              mono
            />
            <Metric
              icon={<CheckCircle2 className="h-4 w-4 text-emerald-700" />}
              label="Procesados / Creados"
              value={
                <span className="tabular">
                  {numberFmt.format(carga.procesados)}{" "}
                  <span className="text-muted-foreground">/ {numberFmt.format(carga.creados)}</span>
                </span>
              }
            />
            <Metric
              icon={<AlertTriangle className={cn("h-4 w-4", carga.errores + carga.noEncontradas > 0 ? "text-amber-700" : "text-muted-foreground")} />}
              label="Errores / No encontradas"
              value={
                <span className="tabular">
                  {numberFmt.format(carga.errores)}{" "}
                  <span className="text-muted-foreground">/ {numberFmt.format(carga.noEncontradas)}</span>
                </span>
              }
              tone={carga.errores + carga.noEncontradas > 0 ? "warn" : "default"}
            />
          </div>
        </section>

        {/* Tabla de inmuebles */}
        <section className="rounded-md border border-border bg-surface shadow-sm">
          <div className="flex items-center justify-between border-b border-border px-4 py-2.5">
            <div>
              <h2 className="text-[13px] font-semibold text-foreground">
                Inmuebles incluidos
              </h2>
              <p className="text-[11.5px] text-muted-foreground">
                Situación de deuda al momento de la carga
              </p>
            </div>
            <div className="text-right text-[11.5px] text-muted-foreground">
              <div>
                <span className="font-medium text-foreground tabular">
                  {numberFmt.format(detalleTotalElements)}
                </span>{" "}
                resultados
              </div>
              <div className="tabular">
                Total filtrado: <span className="font-medium text-foreground">{moneyFmt.format(sumaMonto)}</span>{" "}
                · Prom. cuotas <span className="font-medium text-foreground">{promedioCuotas}</span>
              </div>
            </div>
          </div>

          {/* Filtros */}
          <div className="flex flex-wrap items-center gap-2 border-b border-border bg-surface-muted/40 px-3 py-2.5">
            <div className="flex items-center gap-1.5 pr-1 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              <Filter className="h-3.5 w-3.5" />
              Filtros
            </div>
            <div className="relative min-w-[240px] flex-1 sm:max-w-xs">
              <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={query}
                onChange={(e) => {
                  setQuery(e.target.value);
                  setPage(1);
                }}
                placeholder="Buscar por cuenta, titular o dirección..."
                className="h-8 pl-8 text-[12.5px]"
              />
            </div>

            <div className="mx-1 hidden h-5 w-px bg-border sm:block" />

            <MinFilter
              label="Cuotas ≥"
              value={cuotasMin}
              onChange={(v) => { setCuotasMin(v); setPage(1); }}
              placeholder="Mín."
              inputWidth="w-16"
            />

            <MinFilter
              label="Monto $ ≥"
              value={montoMin}
              onChange={(v) => { setMontoMin(v); setPage(1); }}
              placeholder="Desde"
              inputWidth="w-24"
            />

            {hasFilters && (
              <Button
                variant="ghost"
                size="sm"
                onClick={resetFilters}
                className="ml-auto h-8 px-2 text-[12px] text-muted-foreground hover:text-foreground"
              >
                Limpiar filtros
              </Button>
            )}
          </div>

          {/* Tabla */}
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="border-border bg-surface-muted/60 hover:bg-surface-muted/60">
                  <SortableHead label="Cuenta" k="cuenta" sortKey={sortKey} sortDir={sortDir} onClick={toggleSort} className="w-[130px]" />
                  <SortableHead label="Titular" k="titular" sortKey={sortKey} sortDir={sortDir} onClick={toggleSort} />
                  <SortableHead label="Dirección" k="direccion" sortKey={sortKey} sortDir={sortDir} onClick={toggleSort} />
                  <SortableHead label="Cuotas adeud." k="cuotas" sortKey={sortKey} sortDir={sortDir} onClick={toggleSort} className="w-[130px] text-right" align="right" />
                  <SortableHead label="Monto adeudado" k="monto" sortKey={sortKey} sortDir={sortDir} onClick={toggleSort} className="w-[160px] text-right" align="right" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {pageRows.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={5} className="h-32 text-center text-[13px] text-muted-foreground">
                      {loading ? "Cargando detalle..." : error ?? "No se encontraron inmuebles con los filtros aplicados."}
                    </TableCell>
                  </TableRow>
                )}
                {pageRows.map((r) => (
                  <TableRow key={r.cuenta} className="border-border hover:bg-surface-muted/40">
                    <TableCell className="py-2 align-middle tabular text-[13px] font-medium text-foreground">
                      {r.cuenta}
                    </TableCell>
                    <TableCell className="py-2 align-middle text-[13px] text-foreground">
                      {r.titular}
                    </TableCell>
                    <TableCell className="py-2 align-middle text-[12.5px] text-muted-foreground">
                      {r.direccion}
                    </TableCell>
                    <TableCell className="py-2 text-right align-middle">
                      <CuotasBadge cuotas={r.cuotas} />
                    </TableCell>
                    <TableCell className="py-2 text-right align-middle tabular text-[13px] font-medium text-foreground">
                      {moneyFmt.format(r.monto)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {/* Paginación */}
          <div className="flex flex-col items-center justify-between gap-2 border-t border-border px-3 py-2.5 text-[12px] text-muted-foreground sm:flex-row">
            <div>
              Mostrando{" "}
              <span className="tabular font-medium text-foreground">
                {detalleTotalElements === 0 ? 0 : pageStart + 1}–
                {Math.min(pageStart + PAGE_SIZE, detalleTotalElements)}
              </span>{" "}
              de <span className="tabular font-medium text-foreground">{detalleTotalElements}</span> inmuebles
            </div>
            <div className="flex items-center gap-1">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={safePage <= 1}
                className="h-7 gap-1 px-2 text-[12px]"
              >
                <ChevronLeft className="h-3.5 w-3.5" />
                Anterior
              </Button>
              <div className="px-2 tabular text-[12px]">
                Página <span className="font-medium text-foreground">{safePage}</span> /{" "}
                <span className="font-medium text-foreground">{totalPages}</span>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={safePage >= totalPages}
                className="h-7 gap-1 px-2 text-[12px]"
              >
                Siguiente
                <ChevronRight className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>
        </section>
      </main>

      {/* Modal de errores */}
      <Dialog open={erroresOpen} onOpenChange={setErroresOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-[15px]">
              <AlertTriangle className="h-4 w-4 text-amber-700" />
              Errores de importación
            </DialogTitle>
            <DialogDescription className="text-[12.5px]">
              Registros de la carga que no pudieron procesarse.
            </DialogDescription>
          </DialogHeader>

          <div className="flex items-center justify-between rounded-md border border-border bg-surface-muted/40 px-3 py-2 text-[12px] text-muted-foreground">
            <span>
              Total: <span className="font-medium text-foreground tabular">{numberFmt.format(erroresTotalElements)}</span> errores
            </span>
            <Button variant="outline" size="sm" className="h-7 gap-1.5 px-2 text-[12px]">
              <Download className="h-3.5 w-3.5" />
              Descargar log
            </Button>
          </div>

          <div className="max-h-[55vh] overflow-y-auto rounded-md border border-border">
            <Table>
              <TableHeader className="sticky top-0 bg-surface">
                <TableRow className="border-border bg-surface-muted/60 hover:bg-surface-muted/60">
                  <TableHead className="w-[80px] text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                    Fila
                  </TableHead>
                  <TableHead className="w-[140px] text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                    Cuenta
                  </TableHead>
                  <TableHead className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                    Descripción del error
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {erroresList.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={3} className="h-24 text-center text-[13px] text-muted-foreground">
                      {loading ? "Cargando errores..." : "Esta carga no registró errores."}
                    </TableCell>
                  </TableRow>
                )}
                {erroresList.map((e, idx) => (
                  <TableRow key={`${e.fila}-${idx}`} className="border-border hover:bg-surface-muted/40">
                    <TableCell className="py-2 tabular text-[12.5px] text-muted-foreground">
                      #{e.fila}
                    </TableCell>
                    <TableCell className="py-2 tabular text-[12.5px] font-medium text-foreground">
                      {e.cuenta}
                    </TableCell>
                    <TableCell className="py-2 text-[12.5px] text-foreground">
                      <span className="inline-flex items-center gap-2">
                        <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-amber-600" />
                        {e.descripcion}
                      </span>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          <div className="mt-3 flex items-center justify-between text-[12px] text-muted-foreground">
            <div>
              Página <span className="font-medium text-foreground">{erroresPage}</span> /{" "}
              <span className="font-medium text-foreground">{erroresTotalPages}</span>
            </div>
            <div className="flex items-center gap-1">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setErroresPage((p) => Math.max(1, p - 1))}
                disabled={erroresPage <= 1}
                className="h-7 px-2 text-[12px]"
              >
                <ChevronLeft className="h-3.5 w-3.5" />
                Anterior
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setErroresPage((p) => Math.min(erroresTotalPages, p + 1))}
                disabled={erroresPage >= erroresTotalPages}
                className="h-7 px-2 text-[12px]"
              >
                Siguiente
                <ChevronRight className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

function FichaItem({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: React.ReactNode;
}) {
  return (
    <div className="min-w-[160px]">
      <div className="flex items-center gap-1.5 text-[10.5px] font-semibold uppercase tracking-wider text-muted-foreground">
        <span className="text-muted-foreground/80">{icon}</span>
        {label}
      </div>
      <div className="mt-0.5 text-[13px] font-medium text-foreground">{value}</div>
    </div>
  );
}

function Metric({
  icon,
  label,
  value,
  mono,
  tone = "default",
}: {
  icon: React.ReactNode;
  label: string;
  value: React.ReactNode;
  mono?: boolean;
  tone?: "default" | "warn";
}) {
  return (
    <div className="bg-surface px-5 py-3.5">
      <div className="flex items-center gap-1.5 text-[10.5px] font-semibold uppercase tracking-wider text-muted-foreground">
        {icon}
        {label}
      </div>
      <div
        className={cn(
          "mt-1 text-[18px] font-semibold leading-tight text-foreground",
          mono && "tabular",
          tone === "warn" && "text-amber-800",
        )}
      >
        {value}
      </div>
    </div>
  );
}

interface SortableHeadProps {
  label: string;
  k: SortKey;
  sortKey: SortKey;
  sortDir: SortDir;
  onClick: (k: SortKey) => void;
  className?: string;
  align?: "left" | "right";
}

function SortableHead({ label, k, sortKey, sortDir, onClick, className, align = "left" }: SortableHeadProps) {
  const active = sortKey === k;
  const Icon = !active ? ArrowUpDown : sortDir === "asc" ? ArrowUp : ArrowDown;
  return (
    <TableHead
      className={cn(
        "h-9 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground",
        className,
      )}
    >
      <button
        type="button"
        onClick={() => onClick(k)}
        className={cn(
          "flex w-full items-center gap-1.5 transition-colors hover:text-foreground",
          align === "right" && "justify-end",
          active && "text-foreground",
        )}
      >
        {label}
        <Icon className={cn("h-3 w-3 opacity-60", active && "opacity-100")} />
      </button>
    </TableHead>
  );
}

function CuotasBadge({ cuotas }: { cuotas: number }) {
  const tone =
    cuotas >= 13
      ? "bg-red-50 text-red-800 ring-red-200"
      : cuotas >= 7
      ? "bg-amber-50 text-amber-900 ring-amber-200"
      : cuotas >= 4
      ? "bg-yellow-50 text-yellow-900 ring-yellow-200"
      : "bg-emerald-50 text-emerald-800 ring-emerald-200";
  return (
    <span
      className={cn(
        "inline-flex min-w-[44px] items-center justify-center rounded px-1.5 py-0.5 tabular text-[12px] font-semibold ring-1 ring-inset",
        tone,
      )}
    >
      {cuotas}
    </span>
  );
}

function EstadoPill({ estado }: { estado: CargaEstado }) {
  const cfg = {
    completada: {
      label: "Completada",
      className: "bg-emerald-50 text-emerald-800 ring-emerald-200",
      Icon: CheckCircle2,
    },
    con_errores: {
      label: "Con errores",
      className: "bg-amber-50 text-amber-900 ring-amber-200",
      Icon: AlertTriangle,
    },
    fallida: {
      label: "Fallida",
      className: "bg-red-50 text-red-800 ring-red-200",
      Icon: XCircle,
    },
    procesando: {
      label: "Procesando",
      className: "bg-sky-50 text-sky-800 ring-sky-200",
      Icon: Clock,
    },
  }[estado];
  const Icon = cfg.Icon;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded px-2 py-0.5 text-[11.5px] font-semibold ring-1 ring-inset",
        cfg.className,
      )}
    >
      <Icon className="h-3.5 w-3.5" />
      {cfg.label}
    </span>
  );
}

interface MinFilterProps {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
  inputWidth: string;
}

function MinFilter({ label, value, onChange, placeholder, inputWidth }: MinFilterProps) {
  const handle = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = e.target.value;
    if (v === "" || /^\d+$/.test(v)) onChange(v);
  };
  return (
    <div className="flex h-8 items-center gap-1.5 rounded-md border border-input bg-background px-2 text-[12.5px]">
      <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
        {label}
      </span>
      <input
        type="text"
        inputMode="numeric"
        pattern="[0-9]*"
        value={value}
        onChange={handle}
        placeholder={placeholder}
        className={cn(
          "h-6 bg-transparent text-right tabular text-[12.5px] text-foreground placeholder:text-muted-foreground/60 focus:outline-none",
          inputWidth,
        )}
      />
    </div>
  );
}
