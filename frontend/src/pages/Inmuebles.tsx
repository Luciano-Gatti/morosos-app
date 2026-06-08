import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowDown,
  ArrowUp,
  ArrowUpDown,
  ChevronLeft,
  ChevronRight,
  Eye,
  Filter,
  MoreHorizontal,
  Search,
  Upload,
} from "lucide-react";

import { mapInmuebleRow, type InmuebleRowVm } from "@/adapters/inmuebles";
import { ImportarInmueblesDialog } from "@/components/inmuebles/ImportarInmueblesDialog";
import { AppHeader } from "@/components/layout/AppHeader";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
import { configuracionApi } from "@/services/api/configuracionApi";
import { inmueblesApi } from "@/services/api/inmueblesApi";

type SortKey = "cuenta" | "titular" | "direccion" | "grupo" | "distrito" | "activo";
type SortDir = "asc" | "desc";

const filterFields: { value: "all" | "cuenta" | "titular" | "direccion"; label: string }[] = [
  { value: "all", label: "Todos los campos" },
  { value: "cuenta", label: "N de cuenta" },
  { value: "titular", label: "Titular" },
  { value: "direccion", label: "Direccion" },
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
  const [rows, setRows] = useState<InmuebleRowVm[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [catalogGrupos, setCatalogGrupos] = useState<Array<{ id: string; nombre: string }>>([]);
  const [catalogDistritos, setCatalogDistritos] = useState<Array<{ id: string; nombre: string }>>([]);
  const [catalogError, setCatalogError] = useState<string | null>(null);
  const [catalogWarning, setCatalogWarning] = useState<string | null>(null);
  const [importOpen, setImportOpen] = useState(false);

  const safePage = Math.min(page, Math.max(1, totalPages));
  const pageStart = (safePage - 1) * PAGE_SIZE;
  const pageRows = rows;

  useEffect(() => {
    setCatalogError(null);
    setCatalogWarning(null);

    Promise.all([configuracionApi.grupos({ size: 500 }), configuracionApi.distritos({ size: 500 })])
      .then(([gs, ds]) => {
        const gArr = Array.isArray((gs as any)?.content) ? (gs as any).content : Array.isArray(gs) ? (gs as any[]) : [];
        const dArr = Array.isArray((ds as any)?.content) ? (ds as any).content : Array.isArray(ds) ? (ds as any[]) : [];
        const gruposValidos = gArr
          .filter((g: any) => g?.id !== undefined && g?.id !== null && String(g.id).trim() !== "")
          .map((g: any) => ({ id: String(g.id), nombre: String(g.nombre ?? g.descripcion ?? "Sin nombre") }));
        const distritosValidos = dArr
          .filter((d: any) => d?.id !== undefined && d?.id !== null && String(d.id).trim() !== "")
          .map((d: any) => ({ id: String(d.id), nombre: String(d.nombre ?? d.descripcion ?? "Sin nombre") }));

        setCatalogGrupos(gruposValidos);
        setCatalogDistritos(distritosValidos);

        const gruposInvalidos = gArr.length - gruposValidos.length;
        const distritosInvalidos = dArr.length - distritosValidos.length;

        if (gruposInvalidos > 0 || distritosInvalidos > 0) {
          setCatalogWarning("Algunos grupos o distritos no tienen ID valido y no se pueden usar como filtro.");
        }
      })
      .catch((e) => {
        setCatalogGrupos([]);
        setCatalogDistritos([]);
        setCatalogWarning(null);
        setCatalogError(e?.message ?? "No se pudieron cargar los catalogos de grupos y distritos.");
      });
  }, []);

  useEffect(() => {
    setLoading(true);
    setError(null);

    const sortFieldMap: Record<SortKey, string> = {
      cuenta: "cuenta",
      titular: "titular",
      direccion: "direccion",
      grupo: "grupoNombre",
      distrito: "distritoNombre",
      activo: "activo",
    };

    inmueblesApi
      .list({
        page: page - 1,
        size: PAGE_SIZE,
        q: query || undefined,
        campo: field === "all" ? undefined : field,
        grupoId: grupo !== "all" ? grupo : undefined,
        distritoId: distrito !== "all" ? distrito : undefined,
        activo: estado === "all" ? undefined : estado === "activo",
        sort: `${sortFieldMap[sortKey]},${sortDir}`,
      })
      .then((res) => {
        setRows((res.content || []).map((row: any) => mapInmuebleRow(row)));
        setTotalElements(Number(res.totalElements ?? 0));
        setTotalPages(Math.max(1, Number(res.totalPages ?? 1)));
      })
      .catch((e) => {
        setRows([]);
        setTotalElements(0);
        setTotalPages(1);
        setError(e?.message ?? "No se pudo cargar el padron de inmuebles.");
      })
      .finally(() => setLoading(false));
  }, [page, query, field, grupo, distrito, estado, sortKey, sortDir, refreshKey]);

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDir((value) => (value === "asc" ? "desc" : "asc"));
    } else {
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

  const hasFilters =
    query !== "" || field !== "all" || grupo !== "all" || distrito !== "all" || estado !== "all";

  return (
    <>
      <AppHeader
        title="Inmuebles"
        description="Padron general de inmuebles registrados en el sistema."
        breadcrumb={[{ label: "Inmuebles" }]}
        actions={
          <Button size="sm" className="h-9 gap-2" onClick={() => setImportOpen(true)}>
            <Upload className="h-4 w-4" />
            Importar inmuebles
          </Button>
        }
      />

      <ImportarInmueblesDialog
        open={importOpen}
        onOpenChange={setImportOpen}
        onImported={() => setRefreshKey((value) => value + 1)}
      />

      <main className="flex-1 px-4 py-4 sm:px-6 sm:py-6">
        {loading && <div className="mb-2 text-xs text-muted-foreground">Cargando inmuebles...</div>}
        {error && <div className="mb-2 text-xs text-status-debt">Error API: {error}.</div>}
        {catalogError && (
          <div className="mb-2 text-xs text-destructive">
            Catalogos no disponibles: {catalogError}. Los filtros por grupo y distrito fueron deshabilitados.
          </div>
        )}
        {catalogWarning && <div className="mb-2 text-xs text-destructive">{catalogWarning}</div>}

        <div className="rounded-md border border-border bg-surface shadow-sm">
          <div className="flex flex-col gap-2 border-b border-border px-3 py-2.5 sm:flex-row sm:flex-wrap sm:items-center">
            <div className="flex items-center gap-1.5 pr-1 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              <Filter className="h-3.5 w-3.5" />
              Filtros
            </div>

            <Select
              value={field}
              onValueChange={(value) => {
                setField(value as typeof field);
                setPage(1);
              }}
            >
              <SelectTrigger className="h-8 w-full text-[12.5px] sm:w-[160px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {filterFields.map((filter) => (
                  <SelectItem key={filter.value} value={filter.value} className="text-[13px]">
                    {filter.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <div className="relative min-w-0 flex-1 sm:min-w-[220px] sm:max-w-xs">
              <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={query}
                onChange={(event) => {
                  setQuery(event.target.value);
                  setPage(1);
                }}
                placeholder="Buscar..."
                className="h-8 pl-8 text-[12.5px]"
              />
            </div>

            <div className="mx-1 hidden h-5 w-px bg-border sm:block" />

            <Select
              value={grupo}
              onValueChange={(value) => {
                setGrupo(value);
                setPage(1);
              }}
            >
              <SelectTrigger
                className="h-8 w-full text-[12.5px] sm:w-[150px]"
                disabled={!!catalogError || catalogGrupos.length === 0}
              >
                <SelectValue placeholder="Grupo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all" className="text-[13px]">Todos</SelectItem>
                {catalogGrupos.map((item) => (
                  <SelectItem key={item.id} value={item.id} className="text-[13px]">
                    {item.nombre}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select
              value={distrito}
              onValueChange={(value) => {
                setDistrito(value);
                setPage(1);
              }}
            >
              <SelectTrigger
                className="h-8 w-full text-[12.5px] sm:w-[150px]"
                disabled={!!catalogError || catalogDistritos.length === 0}
              >
                <SelectValue placeholder="Distrito" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all" className="text-[13px]">Todos</SelectItem>
                {catalogDistritos.map((item) => (
                  <SelectItem key={item.id} value={item.id} className="text-[13px]">
                    {item.nombre}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select
              value={estado}
              onValueChange={(value) => {
                setEstado(value);
                setPage(1);
              }}
            >
              <SelectTrigger className="h-8 w-full text-[12.5px] sm:w-[130px]">
                <SelectValue placeholder="Estado" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all" className="text-[13px]">Todos</SelectItem>
                <SelectItem value="activo" className="text-[13px]">Activos</SelectItem>
                <SelectItem value="inactivo" className="text-[13px]">Inactivos</SelectItem>
              </SelectContent>
            </Select>

            {hasFilters && (
              <Button
                variant="ghost"
                size="sm"
                onClick={resetFilters}
                className="h-8 w-full px-2 text-[12px] text-muted-foreground hover:text-foreground sm:ml-auto sm:w-auto"
              >
                Limpiar filtros
              </Button>
            )}
          </div>

          <div className="space-y-3 p-3 md:hidden">
            {pageRows.length === 0 && (
              <div className="rounded-md border border-dashed border-border px-4 py-8 text-center text-[13px] text-muted-foreground">
                No se encontraron inmuebles con los filtros aplicados.
              </div>
            )}
            {pageRows.map((item) => (
              <InmuebleCard key={item.id} inmueble={item} />
            ))}
          </div>

          <div className="hidden overflow-x-auto md:block">
            <Table className="min-w-[900px]">
              <TableHeader>
                <TableRow className="border-border bg-surface-muted/60 hover:bg-surface-muted/60">
                  <SortableHead label="N de cuenta" k="cuenta" sortKey={sortKey} sortDir={sortDir} onClick={toggleSort} className="w-[140px]" />
                  <SortableHead label="Titular" k="titular" sortKey={sortKey} sortDir={sortDir} onClick={toggleSort} />
                  <SortableHead label="Direccion" k="direccion" sortKey={sortKey} sortDir={sortDir} onClick={toggleSort} />
                  <SortableHead label="Grupo" k="grupo" sortKey={sortKey} sortDir={sortDir} onClick={toggleSort} className="w-[140px]" />
                  <SortableHead label="Distrito" k="distrito" sortKey={sortKey} sortDir={sortDir} onClick={toggleSort} className="w-[140px]" />
                  <SortableHead label="Estado" k="activo" sortKey={sortKey} sortDir={sortDir} onClick={toggleSort} className="w-[110px]" />
                  <TableHead className="w-[70px] text-right text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                    Opciones
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pageRows.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={7} className="h-32 text-center text-[13px] text-muted-foreground">
                      No se encontraron inmuebles con los filtros aplicados.
                    </TableCell>
                  </TableRow>
                )}
                {pageRows.map((item) => (
                  <InmuebleRow key={item.id} inmueble={item} />
                ))}
              </TableBody>
            </Table>
          </div>

          <div className="flex flex-col items-center justify-between gap-2 border-t border-border px-3 py-2.5 text-[12px] text-muted-foreground sm:flex-row">
            <div>
              Mostrando <span className="tabular font-medium text-foreground">{totalElements === 0 ? 0 : pageStart + 1}-{Math.min(pageStart + PAGE_SIZE, totalElements)}</span> de{" "}
              <span className="tabular font-medium text-foreground">{totalElements}</span> inmuebles
            </div>
            <div className="flex flex-wrap items-center justify-center gap-1">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((value) => Math.max(1, value - 1))}
                disabled={safePage <= 1}
                className="h-7 gap-1 px-2 text-[12px]"
              >
                <ChevronLeft className="h-3.5 w-3.5" />
                Anterior
              </Button>
              <div className="px-2 tabular text-[12px]">
                Pagina <span className="font-medium text-foreground">{safePage}</span> /{" "}
                <span className="font-medium text-foreground">{totalPages}</span>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((value) => Math.min(totalPages, value + 1))}
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
  onClick: (key: SortKey) => void;
  className?: string;
}

function SortableHead({ label, k, sortKey, sortDir, onClick, className }: SortableHeadProps) {
  const active = sortKey === k;
  const Icon = !active ? ArrowUpDown : sortDir === "asc" ? ArrowUp : ArrowDown;

  return (
    <TableHead className={cn("h-9 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground", className)}>
      <button
        type="button"
        onClick={() => onClick(k)}
        className={cn("flex items-center gap-1.5 transition-colors hover:text-foreground", active && "text-foreground")}
      >
        {label}
        <Icon className={cn("h-3 w-3 opacity-60", active && "opacity-100")} />
      </button>
    </TableHead>
  );
}

function InmuebleRow({ inmueble }: { inmueble: InmuebleRowVm }) {
  return (
    <TableRow className="border-border hover:bg-surface-muted/40">
      <TableCell className="py-2.5 font-mono text-[13px] font-medium text-foreground">{inmueble.cuenta}</TableCell>
      <TableCell className="py-2.5 text-[13px] text-foreground">{inmueble.titular}</TableCell>
      <TableCell className="py-2.5 text-[13px] text-muted-foreground">{inmueble.direccion}</TableCell>
      <TableCell className="py-2.5 text-[13px] text-foreground">{inmueble.grupoNombre}</TableCell>
      <TableCell className="py-2.5 text-[13px] text-foreground">{inmueble.distritoNombre}</TableCell>
      <TableCell className="py-2.5"><EstadoPill activo={inmueble.activo} /></TableCell>
      <TableCell className="py-2 text-right">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuLabel className="text-[12px]">Acciones</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link to={`/inmuebles/${inmueble.id}`} className="flex cursor-pointer items-center gap-2 text-[13px]">
                <Eye className="h-3.5 w-3.5" />
                Ver detalle
              </Link>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </TableCell>
    </TableRow>
  );
}

function InmuebleCard({ inmueble }: { inmueble: InmuebleRowVm }) {
  return (
    <article className="rounded-md border border-border bg-background p-3 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="font-mono text-[12px] font-semibold text-foreground">{inmueble.cuenta}</div>
          <div className="mt-1 text-[13px] font-medium text-foreground">{inmueble.titular}</div>
          <div className="mt-1 text-[12px] text-muted-foreground">{inmueble.direccion}</div>
        </div>
        <EstadoPill activo={inmueble.activo} />
      </div>

      <div className="mt-3 grid grid-cols-2 gap-2 text-[12px]">
        <div className="rounded-md bg-surface-muted/50 px-2.5 py-2">
          <div className="text-muted-foreground">Grupo</div>
          <div className="font-medium text-foreground">{inmueble.grupoNombre}</div>
        </div>
        <div className="rounded-md bg-surface-muted/50 px-2.5 py-2">
          <div className="text-muted-foreground">Distrito</div>
          <div className="font-medium text-foreground">{inmueble.distritoNombre}</div>
        </div>
      </div>

      <div className="mt-3 flex">
        <Button asChild variant="outline" size="sm" className="w-full gap-2">
          <Link to={`/inmuebles/${inmueble.id}`}>
            <Eye className="h-4 w-4" />
            Ver detalle
          </Link>
        </Button>
      </div>
    </article>
  );
}

function EstadoPill({ activo }: { activo: boolean }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium",
        activo ? "bg-status-active-soft text-status-active" : "bg-status-off-soft text-status-off",
      )}
    >
      {activo ? "Activo" : "Inactivo"}
    </span>
  );
}
