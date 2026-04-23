import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  Search,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  MoreHorizontal,
  Eye,
  History,
  MessageSquareText,
  ChevronLeft,
  ChevronRight,
  Filter,
  PlayCircle,
  PauseCircle,
  CircleDashed,
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import {
  inmueblesMorosos,
  etapasSeguimiento,
  estadosOperativos,
  gruposSeguimiento,
  distritosSeguimiento,
  type InmuebleMoroso,
  type EtapaSeguimiento,
  type EstadoOperativo,
} from "@/data/seguimiento";

type SortKey = "cuenta" | "cuotasAdeudadas" | "montoAdeudado" | "etapa";
type SortDir = "asc" | "desc";

const PAGE_SIZE = 12;

const moneyFmt = new Intl.NumberFormat("es-AR", {
  style: "currency",
  currency: "ARS",
  maximumFractionDigits: 0,
});
const numberFmt = new Intl.NumberFormat("es-AR");

export default function SeguimientoMorosos() {
  const [query, setQuery] = useState("");
  const [cuotasMin, setCuotasMin] = useState<string>("");
  const [deudaMin, setDeudaMin] = useState<string>("");
  const [grupo, setGrupo] = useState<string>("all");
  const [distrito, setDistrito] = useState<string>("all");
  const [etapa, setEtapa] = useState<"all" | EtapaSeguimiento>("all");
  const [estadoOp, setEstadoOp] = useState<"all" | EstadoOperativo>("all");
  const [sortKey, setSortKey] = useState<SortKey>("montoAdeudado");
  const [sortDir, setSortDir] = useState<SortDir>("desc");
  const [page, setPage] = useState(1);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const dMin = deudaMin === "" ? null : Number(deudaMin);
    const cMin = cuotasMin === "" ? null : Number(cuotasMin);
    return inmueblesMorosos.filter((m) => {
      if (q && !m.cuenta.toLowerCase().includes(q)) return false;
      if (cMin !== null && !Number.isNaN(cMin) && m.cuotasAdeudadas < cMin) return false;
      if (dMin !== null && !Number.isNaN(dMin) && m.montoAdeudado < dMin) return false;
      if (grupo !== "all" && m.grupo !== grupo) return false;
      if (distrito !== "all" && m.distrito !== distrito) return false;
      if (etapa !== "all" && m.etapa !== etapa) return false;
      if (estadoOp !== "all" && m.estadoOperativo !== estadoOp) return false;
      return true;
    });
  }, [query, cuotasMin, deudaMin, grupo, distrito, etapa, estadoOp]);

  const sorted = useMemo(() => {
    const copy = [...filtered];
    copy.sort((a, b) => {
      const av = a[sortKey];
      const bv = b[sortKey];
      let cmp = 0;
      if (typeof av === "number" && typeof bv === "number") {
        cmp = av - bv;
      } else {
        cmp = String(av ?? "").localeCompare(String(bv ?? ""), "es", { numeric: true });
      }
      return sortDir === "asc" ? cmp : -cmp;
    });
    return copy;
  }, [filtered, sortKey, sortDir]);

  const totalPages = Math.max(1, Math.ceil(sorted.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const pageStart = (safePage - 1) * PAGE_SIZE;
  const pageRows = sorted.slice(pageStart, pageStart + PAGE_SIZE);

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir(key === "cuenta" || key === "etapa" ? "asc" : "desc");
    }
    setPage(1);
  };

  const hasFilters =
    query !== "" ||
    cuotasMin !== "" ||
    deudaMin !== "" ||
    grupo !== "all" ||
    distrito !== "all" ||
    etapa !== "all" ||
    estadoOp !== "all";

  const resetFilters = () => {
    setQuery("");
    setCuotasMin("");
    setDeudaMin("");
    setGrupo("all");
    setDistrito("all");
    setEtapa("all");
    setEstadoOp("all");
    setPage(1);
  };

  return (
    <>
      <AppHeader
        title="Seguimiento de morosos"
        description="Inmuebles en proceso de seguimiento por mora. Consulta operativa con filtros y ordenamiento."
        breadcrumb={[{ label: "Seguimiento de morosos" }]}
      />

      <main className="flex-1 px-6 py-6">
        <div className="rounded-md border border-border bg-surface shadow-sm">
          {/* Barra de filtros */}
          <div className="flex flex-wrap items-center gap-2 border-b border-border px-3 py-2.5">
            <div className="flex items-center gap-1.5 pr-1 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              <Filter className="h-3.5 w-3.5" />
              Filtros
            </div>

            {/* Búsqueda por cuenta */}
            <div className="relative min-w-[200px] flex-1 sm:max-w-[240px]">
              <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={query}
                onChange={(e) => {
                  setQuery(e.target.value);
                  setPage(1);
                }}
                placeholder="N° de cuenta..."
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
              label="Deuda $ ≥"
              value={deudaMin}
              onChange={(v) => { setDeudaMin(v); setPage(1); }}
              placeholder="Desde"
              inputWidth="w-24"
            />

            <div className="mx-1 hidden h-5 w-px bg-border sm:block" />

            <Select value={grupo} onValueChange={(v) => { setGrupo(v); setPage(1); }}>
              <SelectTrigger className="h-8 w-[140px] text-[12.5px]">
                <SelectValue placeholder="Grupo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all" className="text-[13px]">Todos los grupos</SelectItem>
                {gruposSeguimiento.map((g) => (
                  <SelectItem key={g} value={g} className="text-[13px]">{g}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={distrito} onValueChange={(v) => { setDistrito(v); setPage(1); }}>
              <SelectTrigger className="h-8 w-[140px] text-[12.5px]">
                <SelectValue placeholder="Distrito" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all" className="text-[13px]">Todos los distritos</SelectItem>
                {distritosSeguimiento.map((d) => (
                  <SelectItem key={d} value={d} className="text-[13px]">{d}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={etapa} onValueChange={(v) => { setEtapa(v as typeof etapa); setPage(1); }}>
              <SelectTrigger className="h-8 w-[150px] text-[12.5px]">
                <SelectValue placeholder="Etapa" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all" className="text-[13px]">Todas las etapas</SelectItem>
                {etapasSeguimiento.map((e) => (
                  <SelectItem key={e} value={e} className="text-[13px]">{e}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={estadoOp} onValueChange={(v) => { setEstadoOp(v as typeof estadoOp); setPage(1); }}>
              <SelectTrigger className="h-8 w-[140px] text-[12.5px]">
                <SelectValue placeholder="Estado" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all" className="text-[13px]">Todos los estados</SelectItem>
                {estadosOperativos.map((e) => (
                  <SelectItem key={e} value={e} className="text-[13px]">{e}</SelectItem>
                ))}
              </SelectContent>
            </Select>

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

          {/* Resumen */}
          <div className="flex flex-wrap items-center gap-x-6 gap-y-1 border-b border-border bg-surface-muted/40 px-3 py-2 text-[12px] text-muted-foreground">
            <div>
              <span className="tabular font-semibold text-foreground">{numberFmt.format(filtered.length)}</span>{" "}
              inmuebles morosos
            </div>
            <div>
              Cuotas adeudadas:{" "}
              <span className="tabular font-semibold text-foreground">
                {numberFmt.format(filtered.reduce((s, m) => s + m.cuotasAdeudadas, 0))}
              </span>
            </div>
            <div>
              Deuda total:{" "}
              <span className="tabular font-semibold text-foreground">
                {moneyFmt.format(filtered.reduce((s, m) => s + m.montoAdeudado, 0))}
              </span>
            </div>
          </div>

          {/* Tabla */}
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="border-border bg-surface-muted/60 hover:bg-surface-muted/60">
                  <SortableHead label="N° cuenta" k="cuenta" sortKey={sortKey} sortDir={sortDir} onClick={toggleSort} className="w-[130px]" />
                  <TableHead className="h-9 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Titular</TableHead>
                  <TableHead className="h-9 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Dirección</TableHead>
                  <TableHead className="h-9 w-[120px] text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Grupo</TableHead>
                  <TableHead className="h-9 w-[120px] text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Distrito</TableHead>
                  <SortableHead label="Cuotas" k="cuotasAdeudadas" sortKey={sortKey} sortDir={sortDir} onClick={toggleSort} className="w-[90px] text-right" align="right" />
                  <SortableHead label="Deuda" k="montoAdeudado" sortKey={sortKey} sortDir={sortDir} onClick={toggleSort} className="w-[140px] text-right" align="right" />
                  <SortableHead label="Etapa" k="etapa" sortKey={sortKey} sortDir={sortDir} onClick={toggleSort} className="w-[140px]" />
                  <TableHead className="h-9 w-[130px] text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Estado</TableHead>
                  <TableHead className="h-9 w-[70px] text-right text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Opciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pageRows.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={10} className="h-32 text-center text-[13px] text-muted-foreground">
                      No se encontraron inmuebles con los filtros aplicados.
                    </TableCell>
                  </TableRow>
                )}
                {pageRows.map((m) => (
                  <MorosoRow key={m.id} moroso={m} />
                ))}
              </TableBody>
            </Table>
          </div>

          {/* Paginación */}
          <div className="flex flex-col items-center justify-between gap-2 border-t border-border px-3 py-2.5 text-[12px] text-muted-foreground sm:flex-row">
            <div>
              Mostrando{" "}
              <span className="tabular font-medium text-foreground">
                {sorted.length === 0 ? 0 : pageStart + 1}–{Math.min(pageStart + PAGE_SIZE, sorted.length)}
              </span>{" "}
              de <span className="tabular font-medium text-foreground">{sorted.length}</span> morosos
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
        </div>
      </main>
    </>
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
    <TableHead className={cn("h-9 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground", className)}>
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

function MorosoRow({ moroso }: { moroso: InmuebleMoroso }) {
  return (
    <TableRow className="border-border hover:bg-surface-muted/40">
      <TableCell className="py-2.5 tabular text-[13px] font-medium text-foreground">{moroso.cuenta}</TableCell>
      <TableCell className="py-2.5 text-[13px] text-foreground">{moroso.titular}</TableCell>
      <TableCell className="py-2.5 text-[13px] text-muted-foreground">{moroso.direccion}</TableCell>
      <TableCell className="py-2.5 text-[13px] text-foreground">{moroso.grupo}</TableCell>
      <TableCell className="py-2.5 text-[13px] text-foreground">{moroso.distrito}</TableCell>
      <TableCell className="py-2.5 text-right tabular text-[13px] font-medium text-foreground">
        {moroso.cuotasAdeudadas}
      </TableCell>
      <TableCell className="py-2.5 text-right tabular text-[13px] font-semibold text-foreground">
        {new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS", maximumFractionDigits: 0 }).format(moroso.montoAdeudado)}
      </TableCell>
      <TableCell className="py-2.5">
        <EtapaPill etapa={moroso.etapa} />
      </TableCell>
      <TableCell className="py-2.5">
        <EstadoOpPill estado={moroso.estadoOperativo} />
      </TableCell>
      <TableCell className="py-2 text-right">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 text-muted-foreground hover:bg-surface-muted hover:text-foreground"
              aria-label="Opciones del moroso"
            >
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              Acciones
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="text-[13px]" asChild>
              <Link to={`/inmuebles/${moroso.id}/seguimiento`}>
                <History className="mr-2 h-4 w-4" />
                Ver historial y observaciones
              </Link>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </TableCell>
    </TableRow>
  );
}

function EtapaPill({ etapa }: { etapa: EtapaSeguimiento | null }) {
  if (!etapa) {
    return <span className="text-[12px] italic text-muted-foreground">—</span>;
  }
  const cls: Record<EtapaSeguimiento, string> = {
    "Aviso de deuda": "border-border bg-muted text-foreground",
    "Intimación": "border-amber-500/20 bg-amber-500/10 text-amber-700 dark:text-amber-400",
    "Aviso de corte": "border-orange-500/20 bg-orange-500/10 text-orange-700 dark:text-orange-400",
    "Corte": "border-destructive/20 bg-destructive/10 text-destructive",
  };
  return (
    <span className={cn("inline-flex items-center rounded-md border px-2 py-0.5 text-[11.5px] font-medium", cls[etapa])}>
      {etapa}
    </span>
  );
}

function EstadoOpPill({ estado }: { estado: EstadoOperativo }) {
  const map: Record<EstadoOperativo, { cls: string; Icon: typeof PlayCircle }> = {
    "Activo": { cls: "border-status-active/20 bg-status-active-soft text-status-active", Icon: PlayCircle },
    "Pausado": { cls: "border-amber-500/20 bg-amber-500/10 text-amber-700 dark:text-amber-400", Icon: PauseCircle },
    "No iniciado": { cls: "border-border bg-muted text-muted-foreground", Icon: CircleDashed },
  };
  const { cls, Icon } = map[estado];
  return (
    <span className={cn("inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-[11.5px] font-medium", cls)}>
      <Icon className="h-3 w-3" />
      {estado}
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
