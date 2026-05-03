import { useEffect, useMemo, useState } from "react";
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
import { inmueblesPadron, gruposInmueble, distritosInmueble } from "@/data/inmuebles";
import { USE_API } from "@/lib/apiClient";
import { inmueblesApi } from "@/services/api/inmueblesApi";
import { configuracionApi } from "@/services/api/configuracionApi";
import { ImportarInmueblesDialog } from "@/components/inmuebles/ImportarInmueblesDialog";
import { mapInmuebleRow, type InmuebleRowVm } from "@/adapters/inmuebles";

type SortKey = "cuenta" | "titular" | "direccion" | "grupo" | "distrito" | "activo";
type SortDir = "asc" | "desc";

const filterFields: { value: "all" | "cuenta" | "titular" | "direccion"; label: string }[] = [
  { value: "all", label: "Todos los campos" },
  { value: "cuenta", label: "N° de cuenta" },
  { value: "titular", label: "Titular" },
  { value: "direccion", label: "Dirección" },
];

const PAGE_SIZE = 12;

export default function Inmuebles() {
  const [query, setQuery] = useState("");
  const [field, setField] = useState<"all" | "cuenta" | "titular" | "direccion">("all");
  const [grupo, setGrupo] = useState<string>("all");
  const [distrito, setDistrito] = useState<string>("all");
  const [estado, setEstado] = useState<string>("all");
  const [sortKey, setSortKey] = useState<SortKey>("cuenta");
  const [sortDir, setSortDir] = useState<SortDir>("asc");
  const [page, setPage] = useState(1);
  const [rows, setRows] = useState<InmuebleRowVm[]>(USE_API ? [] : inmueblesPadron.map((r: any) => mapInmuebleRow(r)));
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const [totalElements, setTotalElements] = useState(USE_API ? 0 : rows.length);
  const [totalPages, setTotalPages] = useState(USE_API ? 1 : Math.max(1, Math.ceil(rows.length / PAGE_SIZE)));
  const [catalogGrupos, setCatalogGrupos] = useState<Array<{ id: string; nombre: string }>>([]);
  const [catalogDistritos, setCatalogDistritos] = useState<Array<{ id: string; nombre: string }>>([]);
  const [catalogError, setCatalogError] = useState<string | null>(null);

  const filtered = useMemo(() => {
    if (USE_API) return rows;
    const q = query.trim().toLowerCase();
    return rows.filter((it) => {
      if (grupo !== "all" && it.grupoNombre !== grupo) return false;
      if (distrito !== "all" && it.distritoNombre !== distrito) return false;
      if (estado === "activo" && !it.activo) return false;
      if (estado === "inactivo" && it.activo) return false;
      if (!q) return true;
      if (field === "all") return it.cuenta.toLowerCase().includes(q) || it.titular.toLowerCase().includes(q) || it.direccion.toLowerCase().includes(q);
      return String((it as any)[field] ?? "").toLowerCase().includes(q);
    });
  }, [query, field, grupo, distrito, estado, rows]);

  const sorted = useMemo(() => {
    if (USE_API) return filtered;
    const copy = [...filtered];
    copy.sort((a, b) => {
      const mapKey = sortKey === "grupo" ? "grupoNombre" : sortKey === "distrito" ? "distritoNombre" : sortKey;
      const av = (a as any)[mapKey];
      const bv = (b as any)[mapKey];
      if (typeof av === "boolean" && typeof bv === "boolean") return av === bv ? 0 : av ? -1 : 1;
      const cmp = String(av).localeCompare(String(bv), "es", { numeric: true });
      return sortDir === "asc" ? cmp : -cmp;
    });
    return copy;
  }, [filtered, sortKey, sortDir]);

  const safePage = Math.min(page, Math.max(1, totalPages));
  const pageStart = (safePage - 1) * PAGE_SIZE;
  const pageRows = USE_API ? rows : sorted.slice(pageStart, pageStart + PAGE_SIZE);

  useEffect(() => {
    if (!USE_API) return;
    setCatalogError(null);
    Promise.all([configuracionApi.grupos({ size: 500 }), configuracionApi.distritos({ size: 500 })])
      .then(([gs, ds]) => {
        const gArr = Array.isArray((gs as any)?.content) ? (gs as any).content : Array.isArray(gs) ? (gs as any[]) : [];
        const dArr = Array.isArray((ds as any)?.content) ? (ds as any).content : Array.isArray(ds) ? (ds as any[]) : [];
        setCatalogGrupos(gArr.map((g: any) => ({ id: String(g.id ?? g.nombre), nombre: String(g.nombre ?? g.grupo ?? g.id) })));
        setCatalogDistritos(dArr.map((d: any) => ({ id: String(d.id ?? d.nombre), nombre: String(d.nombre ?? d.distrito ?? d.id) })));
      })
      .catch((e) => {
        setCatalogGrupos([]);
        setCatalogDistritos([]);
        setCatalogError(e?.message ?? "No se pudieron cargar los catálogos de grupos/distritos.");
      });
  }, []);

  useEffect(() => {
    if (!USE_API) return;
    setLoading(true);
    setError(null);
    const groupMatch = catalogGrupos.find((g) => g.nombre === grupo);
    const districtMatch = catalogDistritos.find((d) => d.nombre === distrito);
    const sortFieldMap: Record<SortKey, string> = { cuenta: "cuenta", titular: "titular", direccion: "direccion", grupo: "grupoNombre", distrito: "distritoNombre", activo: "activo" };
    inmueblesApi
      .list({
        page: page - 1,
        size: PAGE_SIZE,
        q: query || undefined,
        campo: field === "all" ? undefined : field,
        grupoId: grupo !== "all" ? groupMatch?.id : undefined,
        distritoId: distrito !== "all" ? districtMatch?.id : undefined,
        activo: estado === "all" ? undefined : estado === "activo",
        sort: `${sortFieldMap[sortKey]},${sortDir}`,
      })
      .then((res) => {
        setRows((res.content || []).map((r: any) => mapInmuebleRow(r)));
        setTotalElements(Number(res.totalElements ?? 0));
        setTotalPages(Math.max(1, Number(res.totalPages ?? 1)));
      })
      .catch((e) => {
        setRows([]);
        setTotalElements(0);
        setTotalPages(1);
        setError(e?.message ?? "No se pudo cargar el padrón de inmuebles.");
      })
      .finally(() => setLoading(false));
  }, [page, query, field, grupo, distrito, estado, sortKey, sortDir, refreshKey, catalogGrupos, catalogDistritos]);

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else {
      setSortKey(key);
      setSortDir("asc");
    }
    setPage(1);
  };

  const resetFilters = () => {
    setQuery("");
    setField("all");
    setGrupo("all");
    setDistrito("all");
    setEstado("all");
    setPage(1);
  };

  const hasFilters = query !== "" || field !== "all" || grupo !== "all" || distrito !== "all" || estado !== "all";
  const [importOpen, setImportOpen] = useState(false);
  const mockTotalPages = Math.max(1, Math.ceil(sorted.length / PAGE_SIZE));
  const viewTotalPages = USE_API ? totalPages : mockTotalPages;
  const viewTotal = USE_API ? totalElements : sorted.length;

  return (
    <>
      <AppHeader title="Inmuebles" description="Padrón general de inmuebles registrados en el sistema." breadcrumb={[{ label: "Inmuebles" }]} actions={<Button size="sm" className="h-9 gap-2" onClick={() => setImportOpen(true)}><Upload className="h-4 w-4" />Importar inmuebles</Button>} />
      <ImportarInmueblesDialog open={importOpen} onOpenChange={setImportOpen} onImported={() => setRefreshKey((n) => n + 1)} />
      <main className="flex-1 px-6 py-6">
        {loading && <div className="mb-2 text-xs text-muted-foreground">Cargando inmuebles…</div>}
        {error && <div className="mb-2 text-xs text-status-debt">Error API: {error}.</div>}
        {USE_API && catalogError && (
          <div className="mb-2 text-xs text-destructive">
            Catálogos no disponibles: {catalogError} Los filtros por grupo y distrito fueron deshabilitados.
          </div>
        )}
        <div className="rounded-md border border-border bg-surface shadow-sm">
          <div className="flex flex-wrap items-center gap-2 border-b border-border px-3 py-2.5">
            <div className="flex items-center gap-1.5 pr-1 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground"><Filter className="h-3.5 w-3.5" />Filtros</div>
            <Select value={field} onValueChange={(v) => { setField(v as typeof field); setPage(1); }}><SelectTrigger className="h-8 w-[160px] text-[12.5px]"><SelectValue /></SelectTrigger><SelectContent>{filterFields.map((f) => <SelectItem key={f.value} value={f.value} className="text-[13px]">{f.label}</SelectItem>)}</SelectContent></Select>
            <div className="relative min-w-[220px] flex-1 sm:max-w-xs"><Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" /><Input value={query} onChange={(e) => { setQuery(e.target.value); setPage(1); }} placeholder="Buscar..." className="h-8 pl-8 text-[12.5px]" /></div>
            <div className="mx-1 hidden h-5 w-px bg-border sm:block" />
            <Select value={grupo} onValueChange={(v) => { setGrupo(v); setPage(1); }}><SelectTrigger className="h-8 w-[150px] text-[12.5px]" disabled={USE_API && !!catalogError}><SelectValue placeholder="Grupo" /></SelectTrigger><SelectContent><SelectItem value="all" className="text-[13px]">Todos</SelectItem>{(USE_API ? catalogGrupos.map((g) => g.nombre) : gruposInmueble).map((g) => <SelectItem key={g} value={g} className="text-[13px]">{g}</SelectItem>)}</SelectContent></Select>
            <Select value={distrito} onValueChange={(v) => { setDistrito(v); setPage(1); }}><SelectTrigger className="h-8 w-[150px] text-[12.5px]" disabled={USE_API && !!catalogError}><SelectValue placeholder="Distrito" /></SelectTrigger><SelectContent><SelectItem value="all" className="text-[13px]">Todos</SelectItem>{(USE_API ? catalogDistritos.map((d) => d.nombre) : distritosInmueble).map((d) => <SelectItem key={d} value={d} className="text-[13px]">{d}</SelectItem>)}</SelectContent></Select>
            <Select value={estado} onValueChange={(v) => { setEstado(v); setPage(1); }}><SelectTrigger className="h-8 w-[130px] text-[12.5px]"><SelectValue placeholder="Estado" /></SelectTrigger><SelectContent><SelectItem value="all" className="text-[13px]">Todos</SelectItem><SelectItem value="activo" className="text-[13px]">Activos</SelectItem><SelectItem value="inactivo" className="text-[13px]">Inactivos</SelectItem></SelectContent></Select>
            {hasFilters && <Button variant="ghost" size="sm" onClick={resetFilters} className="ml-auto h-8 px-2 text-[12px] text-muted-foreground hover:text-foreground">Limpiar filtros</Button>}
          </div>
          <div className="overflow-x-auto">
            <Table><TableHeader><TableRow className="border-border bg-surface-muted/60 hover:bg-surface-muted/60"><SortableHead label="N° de cuenta" k="cuenta" sortKey={sortKey} sortDir={sortDir} onClick={toggleSort} className="w-[140px]" /><SortableHead label="Titular" k="titular" sortKey={sortKey} sortDir={sortDir} onClick={toggleSort} /><SortableHead label="Dirección" k="direccion" sortKey={sortKey} sortDir={sortDir} onClick={toggleSort} /><SortableHead label="Grupo" k="grupo" sortKey={sortKey} sortDir={sortDir} onClick={toggleSort} className="w-[140px]" /><SortableHead label="Distrito" k="distrito" sortKey={sortKey} sortDir={sortDir} onClick={toggleSort} className="w-[140px]" /><SortableHead label="Estado" k="activo" sortKey={sortKey} sortDir={sortDir} onClick={toggleSort} className="w-[110px]" /><TableHead className="w-[70px] text-right text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Opciones</TableHead></TableRow></TableHeader><TableBody>{pageRows.length === 0 && <TableRow><TableCell colSpan={7} className="h-32 text-center text-[13px] text-muted-foreground">No se encontraron inmuebles con los filtros aplicados.</TableCell></TableRow>}{pageRows.map((it) => <InmuebleRow key={it.id} inmueble={it} />)}</TableBody></Table>
          </div>
          <div className="flex flex-col items-center justify-between gap-2 border-t border-border px-3 py-2.5 text-[12px] text-muted-foreground sm:flex-row">
            <div>Mostrando <span className="tabular font-medium text-foreground">{viewTotal === 0 ? 0 : pageStart + 1}–{Math.min(pageStart + PAGE_SIZE, viewTotal)}</span> de <span className="tabular font-medium text-foreground">{viewTotal}</span> inmuebles</div>
            <div className="flex items-center gap-1"><Button variant="outline" size="sm" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={safePage <= 1} className="h-7 gap-1 px-2 text-[12px]"><ChevronLeft className="h-3.5 w-3.5" />Anterior</Button><div className="px-2 tabular text-[12px]">Página <span className="font-medium text-foreground">{safePage}</span> / <span className="font-medium text-foreground">{viewTotalPages}</span></div><Button variant="outline" size="sm" onClick={() => setPage((p) => Math.min(viewTotalPages, p + 1))} disabled={safePage >= viewTotalPages} className="h-7 gap-1 px-2 text-[12px]">Siguiente<ChevronRight className="h-3.5 w-3.5" /></Button></div>
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
}

function SortableHead({ label, k, sortKey, sortDir, onClick, className }: SortableHeadProps) {
  const active = sortKey === k;
  const Icon = !active ? ArrowUpDown : sortDir === "asc" ? ArrowUp : ArrowDown;
  return <TableHead className={cn("h-9 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground", className)}><button type="button" onClick={() => onClick(k)} className={cn("flex items-center gap-1.5 transition-colors hover:text-foreground", active && "text-foreground")}>{label}<Icon className={cn("h-3 w-3 opacity-60", active && "opacity-100")} /></button></TableHead>;
}

function InmuebleRow({ inmueble }: { inmueble: InmuebleRowVm }) {
  return (
    <TableRow className="border-border hover:bg-surface-muted/40">
      <TableCell className="py-2.5 tabular text-[13px] font-medium text-foreground">{inmueble.cuenta}</TableCell>
      <TableCell className="py-2.5 text-[13px] text-foreground">{inmueble.titular}</TableCell>
      <TableCell className="py-2.5 text-[13px] text-muted-foreground">{inmueble.direccion}</TableCell>
      <TableCell className="py-2.5 text-[13px] text-foreground">{inmueble.grupoNombre}</TableCell>
      <TableCell className="py-2.5 text-[13px] text-foreground">{inmueble.distritoNombre}</TableCell>
      <TableCell className="py-2.5"><EstadoPill activo={inmueble.activo} /></TableCell>
      <TableCell className="py-2 text-right"><DropdownMenu><DropdownMenuTrigger asChild><Button variant="ghost" size="icon" className="h-8 w-8"><MoreHorizontal className="h-4 w-4" /></Button></DropdownMenuTrigger><DropdownMenuContent align="end" className="w-48"><DropdownMenuLabel className="text-[12px]">Acciones</DropdownMenuLabel><DropdownMenuSeparator /><DropdownMenuItem asChild><Link to={`/inmuebles/${inmueble.id}`} className="flex cursor-pointer items-center gap-2 text-[13px]"><Eye className="h-3.5 w-3.5" />Ver detalle</Link></DropdownMenuItem></DropdownMenuContent></DropdownMenu></TableCell>
    </TableRow>
  );
}

function EstadoPill({ activo }: { activo: boolean }) {
  return <span className={cn("inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium", activo ? "bg-status-active-soft text-status-active" : "bg-status-off-soft text-status-off")}>{activo ? "Activo" : "Inactivo"}</span>;
}
