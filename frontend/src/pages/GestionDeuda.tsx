import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  Upload,
  Search,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  MoreHorizontal,
  Eye,
  ChevronLeft,
  ChevronRight,
  Filter,
  CheckCircle2,
  XCircle,
  Clock,
  CalendarRange,
  Download,
  AlertTriangle,
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
import { cn } from "@/lib/utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { type CargaDeuda, type CargaEstado } from "@/types/deuda";
import { deudaApi } from "@/services/api/deudaApi";
import { useToast } from "@/hooks/use-toast";
import { ApiError } from "@/lib/apiClient";

type SortKey = "fecha" | "nombre" | "morosos" | "montoTotal";
type SortDir = "asc" | "desc";

const PAGE_SIZE = 10;

function toEstado(value: string): CargaEstado {
  const v = value?.toUpperCase?.() ?? "";
  if (v === "COMPLETADA") return "completada";
  if (v === "COMPLETADA_CON_ERRORES") return "con_errores";
  if (v === "FALLIDA") return "fallida";
  return "procesando";
}

function mapCargaApi(row: any): CargaDeuda {
  return {
    id: String(row.id ?? row.cargaId ?? ""),
    fecha: row.fecha ?? row.fechaCarga ?? row.createdAt ?? new Date().toISOString(),
    nombre: row.nombre ?? row.archivo ?? `Carga #${row.id ?? "-"}`,
    usuario: row.usuario ?? row.operador ?? "-",
    estado: toEstado(row.estado),
    morosos: Number(row.morosos ?? row.totalMorosos ?? 0),
    montoTotal: Number(row.montoTotal ?? row.totalMonto ?? 0),
    procesados: Number(row.procesados ?? row.registrosProcesados ?? 0),
    creados: Number(row.creados ?? row.registrosCreados ?? 0),
    errores: Number(row.errores ?? row.totalErrores ?? 0),
    noEncontradas: Number(row.noEncontradas ?? row.totalNoEncontradas ?? 0),
  };
}

const moneyFmt = new Intl.NumberFormat("es-AR", {
  style: "currency",
  currency: "ARS",
  maximumFractionDigits: 0,
});
const numberFmt = new Intl.NumberFormat("es-AR");

function formatFecha(iso: string) {
  const d = new Date(iso);
  const fecha = d.toLocaleDateString("es-AR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
  const hora = d.toLocaleTimeString("es-AR", {
    hour: "2-digit",
    minute: "2-digit",
  });
  return { fecha, hora };
}

export default function GestionDeuda() {
  const { toast } = useToast();
  const [query, setQuery] = useState("");
  const [estado, setEstado] = useState<"all" | CargaEstado>("all");
  const [periodo, setPeriodo] = useState<"all" | "7" | "30" | "90">("all");
  const [sortKey, setSortKey] = useState<SortKey>("fecha");
  const [sortDir, setSortDir] = useState<SortDir>("desc");
  const [page, setPage] = useState(1);
  const [rows, setRows] = useState<CargaDeuda[]>([]);
  const [totalPages, setTotalPages] = useState(1);
  const [totalElements, setTotalElements] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [importOpen, setImportOpen] = useState(false);
  const [importFile, setImportFile] = useState<File | null>(null);
  const [importPeriodo, setImportPeriodo] = useState("");
  const [importing, setImporting] = useState(false);

  const isPeriodoValido = (value: string) => /^\d{4}-(0[1-9]|1[0-2])$/.test(value);
  const resetImportForm = () => {
    setImportFile(null);
    setImportPeriodo("");
  };
  useEffect(() => {
    const fetchCargas = async () => {
      try {
        setLoading(true);
        setError(null);
        const now = new Date();
        const fromDate = periodo === "all" ? undefined : new Date(now.getTime() - Number(periodo) * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
        const estadoApi = estado === "all" ? undefined : ({ completada: "COMPLETADA", con_errores: "COMPLETADA_CON_ERRORES", fallida: "FALLIDA", procesando: "PROCESANDO" } as const)[estado];
        const sort = `${sortKey},${sortDir}`;
        const res = await deudaApi.getCargas({
          page: page - 1,
          size: PAGE_SIZE,
          estado: estadoApi,
          fromDate,
          search: query.trim() || undefined,
          sort,
        });
        setRows((res.content || []).map(mapCargaApi));
        setTotalPages(Math.max(1, res.totalPages || 1));
        setTotalElements(res.totalElements || 0);
      } catch (e) {
        setError("No se pudo cargar la gestión de deuda");
      } finally {
        setLoading(false);
      }
    };
    fetchCargas();
  }, [page, estado, periodo, sortDir, sortKey, query]);

  const safePage = Math.min(page, totalPages);
  const pageStart = (safePage - 1) * PAGE_SIZE;
  const pageRows = rows;
  const toggleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir(key === "fecha" ? "desc" : "asc");
    }
    setPage(1);
  };

  const hasFilters = query !== "" || estado !== "all" || periodo !== "all";
  const resetFilters = () => {
    setQuery("");
    setEstado("all");
    setPeriodo("all");
    setPage(1);
  };

  const handleImportar = async () => {
    if (!importFile) {
      toast({ title: "Archivo requerido", description: "Seleccioná un archivo .csv o .xlsx.", variant: "destructive" });
      return;
    }
    if (!isPeriodoValido(importPeriodo)) {
      toast({ title: "Período inválido", description: "Ingresá un período válido en formato YYYY-MM.", variant: "destructive" });
      return;
    }
    const ext = importFile.name.toLowerCase();
    if (!(ext.endsWith(".csv") || ext.endsWith(".xlsx"))) {
      toast({ title: "Formato no permitido", description: "Solo se permiten archivos .csv o .xlsx.", variant: "destructive" });
      return;
    }
    try {
      setImporting(true);
      const fd = new FormData();
      fd.append("file", importFile);
      fd.append("periodo", `${importPeriodo}-01`);
      await deudaApi.importarCarga(fd);
      toast({ title: "Importación iniciada", description: "La carga de deuda se envió correctamente." });
      resetImportForm();
      setImportOpen(false);
      setPage(1);
    } catch (e) {
      toast({
        title: "Error de importación",
        description: e instanceof ApiError ? e.message : "No se pudo importar la deuda.",
        variant: "destructive",
      });
    } finally {
      setImporting(false);
    }
  };

  return (
    <>
      <AppHeader
        title="Gestión de deuda"
        description="Importación, control y consulta de estados de deuda por inmueble."
        breadcrumb={[{ label: "Gestión de deuda" }]}
        actions={
          <>
            <Button variant="outline" size="sm" className="h-9 gap-2">
              <Download className="h-4 w-4" />
              Plantilla
            </Button>
            <Button size="sm" className="h-9 gap-2" onClick={() => setImportOpen(true)}>
              <Upload className="h-4 w-4" />
              Cargar deuda
            </Button>
          </>
        }
      />

      <main className="flex-1 space-y-4 px-6 py-6">
        {/* Tabla y filtros */}
        <div className="rounded-md border border-border bg-surface shadow-sm">
          <div className="flex flex-wrap items-center gap-2 border-b border-border px-3 py-2.5">
            <div className="flex items-center gap-1.5 pr-1 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              <Filter className="h-3.5 w-3.5" />
              Filtros
            </div>

            <div className="relative min-w-[220px] flex-1 sm:max-w-xs">
              <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={query}
                onChange={(e) => {
                  setQuery(e.target.value);
                  setPage(1);
                }}
                placeholder="Buscar por nombre u operador..."
                className="h-8 pl-8 text-[12.5px]"
              />
            </div>

            <div className="mx-1 hidden h-5 w-px bg-border sm:block" />

            <Select value={periodo} onValueChange={(v) => { setPeriodo(v as typeof periodo); setPage(1); }}>
              <SelectTrigger className="h-8 w-[170px] text-[12.5px]">
                <CalendarRange className="mr-1 h-3.5 w-3.5 text-muted-foreground" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all" className="text-[13px]">Todo el período</SelectItem>
                <SelectItem value="7" className="text-[13px]">Últimos 7 días</SelectItem>
                <SelectItem value="30" className="text-[13px]">Últimos 30 días</SelectItem>
                <SelectItem value="90" className="text-[13px]">Últimos 90 días</SelectItem>
              </SelectContent>
            </Select>

            <Select value={estado} onValueChange={(v) => { setEstado(v as typeof estado); setPage(1); }}>
              <SelectTrigger className="h-8 w-[150px] text-[12.5px]">
                <SelectValue placeholder="Estado" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all" className="text-[13px]">Todos</SelectItem>
                <SelectItem value="completada" className="text-[13px]">Completada</SelectItem>
                <SelectItem value="con_errores" className="text-[13px]">Con errores</SelectItem>
                <SelectItem value="fallida" className="text-[13px]">Fallida</SelectItem>
                <SelectItem value="procesando" className="text-[13px]">Procesando</SelectItem>
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

          {/* Tabla */}
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="border-border bg-surface-muted/60 hover:bg-surface-muted/60">
                  <SortableHead
                    label="Fecha y hora"
                    k="fecha"
                    sortKey={sortKey}
                    sortDir={sortDir}
                    onClick={toggleSort}
                    className="w-[160px]"
                  />
                  <SortableHead
                    label="Carga"
                    k="nombre"
                    sortKey={sortKey}
                    sortDir={sortDir}
                    onClick={toggleSort}
                  />
                  <TableHead className="w-[130px] text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                    Estado
                  </TableHead>
                  <SortableHead
                    label="Morosos"
                    k="morosos"
                    sortKey={sortKey}
                    sortDir={sortDir}
                    onClick={toggleSort}
                    className="w-[110px] text-right"
                    align="right"
                  />
                  <SortableHead
                    label="Monto total"
                    k="montoTotal"
                    sortKey={sortKey}
                    sortDir={sortDir}
                    onClick={toggleSort}
                    className="w-[150px] text-right"
                    align="right"
                  />
                  <TableHead className="w-[260px] text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                    Resultado de importación
                  </TableHead>
                  <TableHead className="w-[70px] text-right text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                    Opciones
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pageRows.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={7} className="h-32 text-center text-[13px] text-muted-foreground">
                      {loading ? "Cargando cargas..." : error ?? "No se encontraron cargas con los filtros aplicados."}
                    </TableCell>
                  </TableRow>
                )}
                {pageRows.map((c) => (
                  <CargaRow key={c.id} carga={c} />
                ))}
              </TableBody>
            </Table>
          </div>

          {/* Paginación */}
          <div className="flex flex-col items-center justify-between gap-2 border-t border-border px-3 py-2.5 text-[12px] text-muted-foreground sm:flex-row">
            <div>
              Mostrando{" "}
              <span className="tabular font-medium text-foreground">
                {totalElements === 0 ? 0 : pageStart + 1}–
                {Math.min(pageStart + PAGE_SIZE, totalElements)}
              </span>{" "}
              de <span className="tabular font-medium text-foreground">{totalElements}</span> cargas
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
      <Dialog open={importOpen} onOpenChange={(v) => { if (!importing) setImportOpen(v); }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Importar deuda</DialogTitle>
            <DialogDescription>
              Seleccioná archivo y período de la carga.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1">
              <label className="text-[12px] font-medium text-foreground">Archivo (.csv o .xlsx)</label>
              <Input
                type="file"
                accept=".csv,.xlsx"
                disabled={importing}
                onChange={(e) => setImportFile(e.target.files?.[0] ?? null)}
              />
            </div>
            <div className="space-y-1">
              <label className="text-[12px] font-medium text-foreground">Período (YYYY-MM)</label>
              <Input
                type="month"
                value={importPeriodo}
                disabled={importing}
                onChange={(e) => setImportPeriodo(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" disabled={importing} onClick={() => setImportOpen(false)}>
              Cancelar
            </Button>
            <Button disabled={importing} onClick={handleImportar}>
              {importing ? "Importando..." : "Confirmar importación"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
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

function CargaRow({ carga }: { carga: CargaDeuda }) {
  const { fecha, hora } = formatFecha(carga.fecha);
  return (
    <TableRow className="border-border hover:bg-surface-muted/40">
      <TableCell className="py-2.5 align-top">
        <div className="tabular text-[13px] font-medium text-foreground">{fecha}</div>
        <div className="tabular text-[11.5px] text-muted-foreground">{hora} hs</div>
      </TableCell>
      <TableCell className="py-2.5 align-top">
        <div className="text-[13px] font-medium text-foreground">{carga.nombre}</div>
        <div className="mt-0.5 flex items-center gap-1.5 text-[11.5px] text-muted-foreground">
          <span>por {carga.usuario}</span>
        </div>
      </TableCell>
      <TableCell className="py-2.5 align-top">
        <EstadoPill estado={carga.estado} />
      </TableCell>
      <TableCell className="py-2.5 text-right align-top tabular text-[13px] font-medium text-foreground">
        {carga.estado === "fallida" ? "—" : numberFmt.format(carga.morosos)}
      </TableCell>
      <TableCell className="py-2.5 text-right align-top tabular text-[13px] font-medium text-foreground">
        {carga.estado === "fallida" ? "—" : moneyFmt.format(carga.montoTotal)}
      </TableCell>
      <TableCell className="py-2.5 align-top">
        <ResultadoSummary carga={carga} />
      </TableCell>
      <TableCell className="py-2 text-right align-top">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 text-muted-foreground hover:bg-surface-muted hover:text-foreground"
              aria-label="Opciones de la carga"
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
              <Link to={`/deuda/${carga.id}`}>
                <Eye className="mr-2 h-4 w-4" />
                Ver detalle de la carga
              </Link>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </TableCell>
    </TableRow>
  );
}

function ResultadoSummary({ carga }: { carga: CargaDeuda }) {
  if (carga.estado === "fallida") {
    return (
      <div className="text-[12px] text-muted-foreground">
        La importación no pudo completarse.
      </div>
    );
  }
  if (carga.estado === "procesando") {
    return (
      <div className="text-[12px] text-muted-foreground">Procesamiento en curso…</div>
    );
  }
  return (
    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[11.5px]">
      <Metric label="Procesados" value={carga.procesados} />
      <Metric label="Creados" value={carga.creados} tone="positive" />
      <Metric label="Actualizados" value={carga.actualizados} tone="info" />
      <Metric label="Errores" value={carga.errores} tone={carga.errores > 0 ? "danger" : "muted"} />
      <Metric label="No encontradas" value={carga.noEncontradas} tone={carga.noEncontradas > 0 ? "warn" : "muted"} />
    </div>
  );
}

function Metric({
  label,
  value,
  tone = "muted",
}: {
  label: string;
  value: number;
  tone?: "muted" | "positive" | "info" | "warn" | "danger";
}) {
  const toneClass = {
    muted: "text-muted-foreground",
    positive: "text-status-active",
    info: "text-foreground",
    warn: "text-amber-600 dark:text-amber-400",
    danger: "text-destructive",
  }[tone];
  return (
    <div className="flex items-center gap-1 leading-tight">
      <span className="text-muted-foreground">{label}:</span>
      <span className={cn("tabular font-semibold", toneClass)}>{numberFmt.format(value)}</span>
    </div>
  );
}

function EstadoPill({ estado }: { estado: CargaEstado }) {
  const config = {
    completada: {
      label: "Completada",
      icon: CheckCircle2,
      cls: "border-status-active/20 bg-status-active-soft text-status-active",
    },
    con_errores: {
      label: "Con errores",
      icon: AlertTriangle,
      cls: "border-amber-500/20 bg-amber-500/10 text-amber-700 dark:text-amber-400",
    },
    fallida: {
      label: "Fallida",
      icon: XCircle,
      cls: "border-destructive/20 bg-destructive/10 text-destructive",
    },
    procesando: {
      label: "Procesando",
      icon: Clock,
      cls: "border-border bg-muted text-muted-foreground",
    },
  }[estado];
  const Icon = config.icon;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-[11.5px] font-medium",
        config.cls,
      )}
    >
      <Icon className="h-3 w-3" />
      {config.label}
    </span>
  );
}

function ResumenTile({
  label,
  value,
  icon,
  mono = false,
  tone = "default",
}: {
  label: string;
  value: string;
  icon: React.ReactNode;
  mono?: boolean;
  tone?: "default" | "warn";
}) {
  return (
    <div className="rounded-md border border-border bg-surface px-3.5 py-3 shadow-sm">
      <div className="flex items-center justify-between text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
        <span>{label}</span>
        <span
          className={cn(
            "flex h-6 w-6 items-center justify-center rounded border border-border bg-surface-muted text-muted-foreground",
            tone === "warn" && "border-amber-500/30 bg-amber-500/10 text-amber-600 dark:text-amber-400",
          )}
        >
          {icon}
        </span>
      </div>
      <div
        className={cn(
          "mt-1.5 text-[20px] font-semibold leading-tight text-foreground",
          mono && "tabular",
        )}
      >
        {value}
      </div>
    </div>
  );
}
