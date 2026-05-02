import { useRef, useState } from "react";
import {
  Upload,
  FileSpreadsheet,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Download,
  Loader2,
  X,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { inmueblesApi } from "@/services/api/inmueblesApi";
import { useToast } from "@/hooks/use-toast";
import { USE_API, ApiError } from "@/lib/apiClient";

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onImported?: () => void;
}

type Fase = "seleccion" | "procesando" | "resultado";

interface ErrorFila {
  fila: number;
  cuenta: string;
  motivo: string;
}

interface Resultado {
  procesados: number;
  creados: number;
  actualizados: number;
  errores: number;
  noEncontradas: number;
  detalleErrores: ErrorFila[];
}

const EXTENSIONES_VALIDAS = [".xlsx", ".xls", ".csv"];

function generarResultadoMock(file: File): Resultado {
  // Heurística simple basada en el tamaño del archivo para que el preview sea creíble
  const sizeKb = Math.max(1, Math.round(file.size / 1024));
  const procesados = Math.min(2400, 80 + sizeKb * 3);
  const errores = Math.floor(procesados * 0.04);
  const noEncontradas = Math.floor(procesados * 0.015);
  const creados = Math.floor((procesados - errores) * 0.42);
  const actualizados = procesados - errores - creados;

  const motivos = [
    "Cuenta no encontrada en el padrón",
    "Formato de N° de cuenta inválido",
    "Distrito no reconocido",
    "Grupo no reconocido",
    "Campo obligatorio vacío: titular",
    "Campo obligatorio vacío: dirección",
    "Cuenta duplicada en el archivo",
  ];

  const detalleErrores: ErrorFila[] = Array.from({ length: errores }, (_, i) => ({
    fila: 2 + ((i * 17 + 11) % Math.max(procesados, 50)),
    cuenta: String(100000 + ((i * 41 + 7) % 899999)),
    motivo: motivos[(i * 5) % motivos.length],
  })).sort((a, b) => a.fila - b.fila);

  return { procesados, creados, actualizados, errores, noEncontradas, detalleErrores };
}

function descargarErroresCSV(file: File, errores: ErrorFila[]) {
  const header = "Fila,Cuenta,Motivo\n";
  const rows = errores
    .map((e) => `${e.fila},"${e.cuenta}","${e.motivo.replace(/"/g, '""')}"`)
    .join("\n");
  const csv = "\ufeff" + header + rows;
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  const base = file.name.replace(/\.[^.]+$/, "");
  a.href = url;
  a.download = `errores_${base}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

function fmtSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

function isValido(name: string) {
  const lower = name.toLowerCase();
  return EXTENSIONES_VALIDAS.some((ext) => lower.endsWith(ext));
}

export function ImportarInmueblesDialog({ open, onOpenChange, onImported }: Props) {
  const { toast } = useToast();
  const [fase, setFase] = useState<Fase>("seleccion");
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [resultado, setResultado] = useState<Resultado | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const reset = () => {
    setFase("seleccion");
    setFile(null);
    setError(null);
    setDragOver(false);
    setResultado(null);
  };

  const handleClose = (next: boolean) => {
    if (!next) {
      // pequeño delay para evitar flash de contenido al cerrar
      setTimeout(reset, 150);
    }
    onOpenChange(next);
  };

  const seleccionar = (f: File | null | undefined) => {
    if (!f) return;
    if (!isValido(f.name)) {
      setError("Formato no soportado. Solo se permiten archivos .xlsx, .xls o .csv.");
      setFile(null);
      return;
    }
    setError(null);
    setFile(f);
  };

  const procesar = async () => {
    if (!file) return;
    setFase("procesando");
    try {
      if (!USE_API) {
        setResultado(generarResultadoMock(file));
        setFase("resultado");
        return;
      }
      const imp = await inmueblesApi.importarInmuebles(file);
      const id = String(imp.id ?? "");
      const estado = await inmueblesApi.getImportacionInmueble(id);
      const erroresPage = await inmueblesApi.getErroresImportacionInmueble(id, { page: 0, size: 50 });
      setResultado({
        procesados: Number(estado.procesados ?? estado.totalRegistros ?? 0),
        creados: Number(estado.creados ?? 0),
        actualizados: Number(estado.actualizados ?? 0),
        errores: Number(estado.errores ?? 0),
        noEncontradas: 0,
        detalleErrores: (erroresPage.content ?? []).map((e: any) => ({
          fila: Number(e.fila ?? e.rowNumber ?? 0),
          cuenta: String(e.cuenta ?? "-"),
          motivo: String(e.motivo ?? e.descripcion ?? "Error"),
        })),
      });
      setFase("resultado");
      onImported?.();
      toast({ title: "Importación finalizada", description: "El archivo fue procesado correctamente." });
    } catch (e) {
      toast({ title: "Error de importación", description: e instanceof ApiError ? e.message : "No se pudo importar el archivo.", variant: "destructive" });
      setFase("seleccion");
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent
        className={cn(
          "max-w-2xl gap-0 p-0 overflow-hidden",
          fase === "resultado" && "max-w-3xl",
        )}
      >
        {/* Header */}
        <div className="border-b border-border bg-primary-soft/40 px-6 py-4">
          <DialogHeader className="space-y-1 text-left">
            <DialogTitle className="font-serif text-[18px] font-semibold tracking-tight text-foreground">
              {fase === "resultado" ? "Resultado de la importación" : "Importar inmuebles"}
            </DialogTitle>
            <DialogDescription className="text-[12.5px] text-muted-foreground">
              {fase === "resultado"
                ? "Resumen del procesamiento del archivo cargado."
                : "Cargá un archivo Excel o CSV con el padrón de inmuebles a importar."}
            </DialogDescription>
          </DialogHeader>
        </div>

        {fase === "seleccion" && (
          <div className="space-y-4 px-6 py-5">
            {/* Instrucciones */}
            <div className="rounded-md border border-border bg-surface-muted/40 px-4 py-3">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                Instrucciones
              </p>
              <ul className="mt-1.5 space-y-1 text-[12.5px] text-foreground/80">
                <li>• Formatos aceptados: <span className="font-medium text-foreground">.xlsx</span>, <span className="font-medium text-foreground">.xls</span> o <span className="font-medium text-foreground">.csv</span>.</li>
                <li>• Columnas requeridas: N° de cuenta, titular, dirección, grupo, distrito.</li>
                <li>• La primera fila debe contener los nombres de columna.</li>
                <li>• Las cuentas existentes serán actualizadas; las nuevas, creadas.</li>
              </ul>
            </div>

            {/* Dropzone */}
            <label
              onDragOver={(e) => {
                e.preventDefault();
                setDragOver(true);
              }}
              onDragLeave={() => setDragOver(false)}
              onDrop={(e) => {
                e.preventDefault();
                setDragOver(false);
                seleccionar(e.dataTransfer.files?.[0]);
              }}
              className={cn(
                "flex cursor-pointer flex-col items-center justify-center rounded-md border-2 border-dashed px-6 py-8 text-center transition-colors",
                dragOver
                  ? "border-primary bg-primary-soft/40"
                  : "border-border bg-surface hover:bg-surface-muted/50",
              )}
            >
              <input
                ref={inputRef}
                type="file"
                accept=".xlsx,.xls,.csv"
                className="hidden"
                onChange={(e) => seleccionar(e.target.files?.[0])}
              />
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary-soft text-primary">
                <Upload className="h-5 w-5" />
              </div>
              <p className="mt-2 text-[13px] font-medium text-foreground">
                Arrastrá el archivo o hacé click para seleccionarlo
              </p>
              <p className="mt-0.5 text-[11.5px] text-muted-foreground">
                Solo se acepta un archivo por carga.
              </p>
            </label>

            {/* Archivo seleccionado */}
            {file && (
              <div className="flex items-center gap-3 rounded-md border border-border bg-surface px-3 py-2.5">
                <div className="flex h-8 w-8 items-center justify-center rounded bg-primary-soft text-primary">
                  <FileSpreadsheet className="h-4 w-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[13px] font-medium text-foreground">{file.name}</p>
                  <p className="text-[11.5px] text-muted-foreground">{fmtSize(file.size)}</p>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 text-muted-foreground hover:text-foreground"
                  onClick={() => {
                    setFile(null);
                    if (inputRef.current) inputRef.current.value = "";
                  }}
                  aria-label="Quitar archivo"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            )}

            {error && (
              <div className="flex items-start gap-2 rounded-md border border-destructive/30 bg-destructive/5 px-3 py-2 text-[12.5px] text-destructive">
                <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
                <p>{error}</p>
              </div>
            )}
          </div>
        )}

        {fase === "procesando" && (
          <div className="flex flex-col items-center justify-center gap-3 px-6 py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-[13px] font-medium text-foreground">Procesando archivo…</p>
            <p className="text-[12px] text-muted-foreground">
              Validando registros y aplicando cambios al padrón.
            </p>
          </div>
        )}

        {fase === "resultado" && resultado && (
          <ResultadoView resultado={resultado} file={file} />
        )}

        {/* Footer */}
        <DialogFooter className="border-t border-border bg-surface-muted/30 px-6 py-3">
          {fase === "seleccion" && (
            <>
              <Button variant="outline" size="sm" onClick={() => handleClose(false)}>
                Cancelar
              </Button>
              <Button size="sm" disabled={!file} onClick={procesar} className="gap-1.5">
                <Upload className="h-4 w-4" />
                Importar archivo
              </Button>
            </>
          )}
          {fase === "procesando" && (
            <Button variant="outline" size="sm" disabled>
              Procesando…
            </Button>
          )}
          {fase === "resultado" && (
            <>
              <Button variant="outline" size="sm" onClick={reset}>
                Importar otro archivo
              </Button>
              <Button size="sm" onClick={() => handleClose(false)}>
                Cerrar
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function ResultadoView({ resultado, file }: { resultado: Resultado; file: File | null }) {
  const huboErrores = resultado.errores > 0 || resultado.noEncontradas > 0;
  return (
    <div className="space-y-4 px-6 py-5">
      {/* Estado general */}
      <div
        className={cn(
          "flex items-start gap-3 rounded-md border px-3 py-2.5",
          huboErrores
            ? "border-amber-500/30 bg-amber-50 text-amber-900 dark:bg-amber-950/30 dark:text-amber-100"
            : "border-status-active/30 bg-status-active-soft text-status-active",
        )}
      >
        {huboErrores ? (
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
        ) : (
          <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
        )}
        <div className="text-[12.5px] leading-relaxed">
          <p className="font-semibold">
            {huboErrores
              ? "Importación finalizada con observaciones"
              : "Importación finalizada correctamente"}
          </p>
          <p className={cn(huboErrores ? "text-amber-900/80 dark:text-amber-100/80" : "text-status-active/80")}>
            {huboErrores
              ? "Algunos registros no pudieron procesarse. Revisá el detalle a continuación."
              : "Todos los registros del archivo fueron procesados sin errores."}
          </p>
        </div>
      </div>

      {/* Métricas */}
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-5">
        <Metric label="Procesados" value={resultado.procesados} tone="neutral" />
        <Metric label="Creados" value={resultado.creados} tone="active" />
        <Metric label="Actualizados" value={resultado.actualizados} tone="info" />
        <Metric label="Errores" value={resultado.errores} tone="error" />
        <Metric label="No encontradas" value={resultado.noEncontradas} tone="warning" />
      </div>

      {/* Detalle de errores */}
      {resultado.detalleErrores.length > 0 && (
        <div className="rounded-md border border-border bg-surface">
          <div className="flex items-center justify-between border-b border-border px-3 py-2">
            <div>
              <p className="text-[12.5px] font-semibold text-foreground">
                Detalle de errores
              </p>
              <p className="text-[11.5px] text-muted-foreground">
                {resultado.detalleErrores.length} registros con observaciones
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              className="h-8 gap-1.5 text-[12px]"
              onClick={() => file && descargarErroresCSV(file, resultado.detalleErrores)}
              disabled={!file}
            >
              <Download className="h-3.5 w-3.5" />
              Descargar detalle (.csv)
            </Button>
          </div>
          <div className="max-h-[260px] overflow-y-auto">
            <table className="w-full">
              <thead className="sticky top-0 bg-surface-muted/60">
                <tr className="border-b border-border">
                  <th className="px-3 py-2 text-left text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Fila</th>
                  <th className="px-3 py-2 text-left text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Cuenta</th>
                  <th className="px-3 py-2 text-left text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Motivo</th>
                </tr>
              </thead>
              <tbody>
                {resultado.detalleErrores.slice(0, 50).map((e, i) => (
                  <tr key={i} className="border-b border-border/60 last:border-0">
                    <td className="px-3 py-2 text-[12.5px] tabular text-foreground">{e.fila}</td>
                    <td className="px-3 py-2 text-[12.5px] tabular text-foreground">{e.cuenta}</td>
                    <td className="px-3 py-2 text-[12.5px] text-muted-foreground">{e.motivo}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {resultado.detalleErrores.length > 50 && (
              <p className="border-t border-border bg-surface-muted/30 px-3 py-2 text-[11.5px] text-muted-foreground">
                Mostrando 50 de {resultado.detalleErrores.length}. Descargá el archivo para ver el detalle completo.
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

type Tone = "neutral" | "active" | "info" | "error" | "warning";

function Metric({ label, value, tone }: { label: string; value: number; tone: Tone }) {
  const toneCls: Record<Tone, string> = {
    neutral: "text-foreground",
    active: "text-status-active",
    info: "text-primary",
    error: "text-destructive",
    warning: "text-amber-600 dark:text-amber-400",
  };
  const Icon = tone === "error" ? XCircle : tone === "warning" ? AlertTriangle : CheckCircle2;
  return (
    <div className="rounded-md border border-border bg-surface px-3 py-2.5">
      <p className="text-[10.5px] font-semibold uppercase tracking-wider text-muted-foreground">
        {label}
      </p>
      <div className="mt-0.5 flex items-baseline gap-1.5">
        <span className={cn("font-serif text-[20px] font-semibold tabular leading-none", toneCls[tone])}>
          {value.toLocaleString("es-AR")}
        </span>
        {(tone === "error" || tone === "warning" || tone === "active") && value > 0 && (
          <Icon className={cn("h-3.5 w-3.5 opacity-70", toneCls[tone])} />
        )}
      </div>
    </div>
  );
}
