import { useEffect, useMemo, useState } from "react";
import {
  Save,
  RotateCcw,
  AlertTriangle,
  Info,
  ShieldAlert,
  Settings2,
  Bell,
  CalendarClock,
  History,
  CircleDollarSign,
} from "lucide-react";
import { AppHeader } from "@/components/layout/AppHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { configuracionApi } from "@/services/api/configuracionApi";
import { mapParametroSeguimiento } from "@/adapters/parametrosSeguimiento";
import { ApiError } from "@/lib/apiClient";

const numberFmt = new Intl.NumberFormat("es-AR");

interface ParametrosSeguimiento {
  cuotasParaMoroso: number;
  reanudacionPorIncumplimiento: boolean;
  diasEntreEtapas: number;
  notificarCambiosEtapa: boolean;
  modoOperacion: "manual" | "asistido";
}

interface ImpactoSeguimiento {
  hayImpacto: boolean;
  impactoCalculable: boolean;
  totalProcesosAbiertos: number;
  procesosAfectados: number;
  porcentajeImpacto: number;
  mensaje: string;
}

const valoresIniciales: ParametrosSeguimiento = {
  cuotasParaMoroso: 3,
  reanudacionPorIncumplimiento: true,
  diasEntreEtapas: 15,
  notificarCambiosEtapa: true,
  modoOperacion: "asistido",
};

function parseBooleanParam(value: unknown, fallback: boolean): boolean {
  if (typeof value === "boolean") return value;
  if (typeof value === "string") {
    const normalized = value.trim().toLowerCase();
    if (normalized === "true") return true;
    if (normalized === "false") return false;
  }
  return fallback;
}

export default function ConfiguracionSeguimiento() {
  const { toast } = useToast();
  const [guardado, setGuardado] = useState<ParametrosSeguimiento>(valoresIniciales);
  const [form, setForm] = useState<ParametrosSeguimiento>(valoresIniciales);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [calculandoImpacto, setCalculandoImpacto] = useState(false);
  const [impactoError, setImpactoError] = useState<string | null>(null);
  const [impacto, setImpacto] = useState<ImpactoSeguimiento | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [parametrosDisponibles, setParametrosDisponibles] = useState<Set<string>>(new Set());
  const [empty, setEmpty] = useState(false);

  const fetchParametros = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await configuracionApi.parametrosSeguimiento();
      const rows = (data?.content ?? data ?? []).map(mapParametroSeguimiento);
      setParametrosDisponibles(new Set(rows.map((r) => r.codigo)));
      setEmpty(rows.length === 0);
      const get = (code: string) => rows.find((r: any) => r.codigo === code)?.valor;
      const next = {
        cuotasParaMoroso: Number(get("CUOTAS_PARA_MOROSO") ?? valoresIniciales.cuotasParaMoroso),
        reanudacionPorIncumplimiento: parseBooleanParam(
          get("REANUDACION_POR_INCUMPLIMIENTO"),
          valoresIniciales.reanudacionPorIncumplimiento,
        ),
        diasEntreEtapas: Number(get("DIAS_ENTRE_ETAPAS") ?? valoresIniciales.diasEntreEtapas),
        notificarCambiosEtapa: parseBooleanParam(
          get("NOTIFICAR_CAMBIOS_ETAPA"),
          valoresIniciales.notificarCambiosEtapa,
        ),
        modoOperacion: String(get("MODO_OPERACION") ?? valoresIniciales.modoOperacion) === "manual" ? "manual" : "asistido",
      } as ParametrosSeguimiento;
      setGuardado(next);
      setForm(next);
    } catch (e) {
      setError("No se pudieron cargar los parámetros de seguimiento");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchParametros(); }, []);

  const cambios = useMemo(() => {
    const diffs: { key: keyof ParametrosSeguimiento; label: string; antes: string; despues: string }[] = [];
    if (form.cuotasParaMoroso !== guardado.cuotasParaMoroso) {
      diffs.push({
        key: "cuotasParaMoroso",
        label: "Cuotas para considerar moroso",
        antes: `${guardado.cuotasParaMoroso}`,
        despues: `${form.cuotasParaMoroso}`,
      });
    }
    if (form.diasEntreEtapas !== guardado.diasEntreEtapas) {
      diffs.push({
        key: "diasEntreEtapas",
        label: "Días entre etapas",
        antes: `${guardado.diasEntreEtapas} días`,
        despues: `${form.diasEntreEtapas} días`,
      });
    }
    if (form.modoOperacion !== guardado.modoOperacion) {
      diffs.push({
        key: "modoOperacion",
        label: "Modo de operación",
        antes: guardado.modoOperacion === "manual" ? "Manual" : "Asistido",
        despues: form.modoOperacion === "manual" ? "Manual" : "Asistido",
      });
    }
    (
      [
        ["reanudacionPorIncumplimiento", "Reanudación por incumplimiento de compromiso"],
        ["notificarCambiosEtapa", "Notificar cambios de etapa"],
      ] as const
    ).forEach(([k, label]) => {
      if (form[k] !== guardado[k]) {
        diffs.push({
          key: k,
          label,
          antes: guardado[k] ? "Activo" : "Inactivo",
          despues: form[k] ? "Activo" : "Inactivo",
        });
      }
    });
    return diffs;
  }, [form, guardado]);

  const hayCambios = cambios.length > 0;

  const handleGuardar = async () => {
    if (!hayCambios) return;
    try {
      setCalculandoImpacto(true);
      setImpactoError(null);
      const response = await configuracionApi.calcularImpactoParametrosSeguimiento({
        parametros: cambios.map((c) => ({
          clave: c.key === "cuotasParaMoroso" ? "CUOTAS_PARA_MOROSO" : c.key,
          valorAnterior: c.key === "cuotasParaMoroso" ? guardado.cuotasParaMoroso : c.antes,
          valorNuevo: c.key === "cuotasParaMoroso" ? form.cuotasParaMoroso : c.despues,
        })),
      });
      setImpacto(response as ImpactoSeguimiento);
    } catch (e) {
      setImpacto(null);
      setImpactoError(e instanceof ApiError ? e.message : "No se pudo calcular el impacto en este momento.");
    } finally {
      setCalculandoImpacto(false);
      setConfirmOpen(true);
    }
  };

  const handleConfirmar = async () => {
    try {
      setSaving(true);
      const cambiosMap = [
        ["CUOTAS_PARA_MOROSO", form.cuotasParaMoroso],
        ["REANUDACION_POR_INCUMPLIMIENTO", form.reanudacionPorIncumplimiento],
        ["DIAS_ENTRE_ETAPAS", form.diasEntreEtapas],
        ["NOTIFICAR_CAMBIOS_ETAPA", form.notificarCambiosEtapa],
        ["MODO_OPERACION", form.modoOperacion],
      ].filter(([codigo]) => parametrosDisponibles.has(codigo)) as readonly [string, string | number | boolean][];
      if (cambiosMap.length === 0) {
        toast({
          title: "Sin parámetros editables",
          description: "El backend no devolvió parámetros configurables.",
          variant: "destructive",
        });
        return;
      }
      for (const [codigo, valor] of cambiosMap) {
        await configuracionApi.actualizarParametroSeguimiento(codigo, { valor });
      }
      await fetchParametros();
      setConfirmOpen(false);
      toast({ title: "Parámetros actualizados", description: "La configuración del proceso de seguimiento fue guardada." });
    } catch (e) {
      toast({ title: "Error al guardar", description: e instanceof ApiError ? e.message : "No se pudieron guardar los parámetros.", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const handleDescartar = () => {
    setForm(guardado);
    toast({
      title: "Cambios descartados",
      description: "Se restauraron los valores guardados anteriormente.",
    });
  };

  return (
    <>
      <AppHeader
        title="Parámetros de seguimiento"
        description="Configuración general del proceso de seguimiento de morosidad. Estos parámetros impactan directamente en cómo se identifican los morosos y avanzan los procesos."
        breadcrumb={[{ label: "Configuración", to: "/configuracion" }, { label: "Seguimiento" }]}
        actions={
          <>
            <Button
              variant="outline"
              size="sm"
              onClick={handleDescartar}
              disabled={!hayCambios || saving}
              className="h-8 gap-1.5 text-[12.5px]"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              Descartar
            </Button>
            <Button
              size="sm"
              onClick={handleGuardar}
              disabled={!hayCambios || saving}
              className="h-8 gap-1.5 text-[12.5px]"
            >
              <Save className="h-3.5 w-3.5" />
              Guardar cambios
            </Button>
          </>
        }
      />

      <main className="flex-1 px-6 py-6">
        <div className="mx-auto max-w-4xl space-y-5">
          {error && <div className="rounded-md border border-destructive/30 bg-destructive/10 px-4 py-3 text-[12.5px] text-destructive">{error}</div>}
          {loading && <div className="rounded-md border border-border bg-surface-muted/40 px-4 py-3 text-[12.5px] text-muted-foreground">Cargando parámetros...</div>}
          {!loading && !error && empty && (
            <div className="rounded-md border border-border bg-surface-muted/40 px-4 py-6 text-[12.5px] text-muted-foreground">
              No hay parámetros de seguimiento configurados en backend.
            </div>
          )}
          {/* Aviso superior */}
          <div className="flex items-start gap-3 rounded-md border border-primary/20 bg-primary-soft/40 px-4 py-3">
            <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
            <div className="text-[12.5px] leading-5 text-foreground">
              <span className="font-semibold">Configuración sensible.</span>{" "}
              Los parámetros definidos aquí afectan la identificación de morosos y la
              progresión de los procesos abiertos. Los cambios se aplican al guardar y
              quedan registrados en la auditoría del sistema.
            </div>
          </div>

          {/* Bloque 1 — Umbral de morosidad */}
          <SettingSection
            icon={CircleDollarSign}
            title="Umbral de morosidad"
            description="Define a partir de cuántas cuotas adeudadas un inmueble es considerado moroso e ingresa al circuito de seguimiento."
          >
            <div className="grid gap-4 md:grid-cols-[260px_1fr] md:items-start">
              <div className="space-y-1.5">
                <Label htmlFor="cuotas" className="text-[12.5px] font-medium">
                  Cuotas para considerar moroso
                </Label>
                <Input
                  id="cuotas"
                  type="number"
                  inputMode="numeric"
                  min={1}
                  max={24}
                  value={form.cuotasParaMoroso}
                  onChange={(e) =>
                    setForm((f) => ({
                      ...f,
                      cuotasParaMoroso: Math.max(1, Math.min(24, Number(e.target.value) || 1)),
                    }))
                  }
                  className="h-9 w-32 text-[14px] tabular"
                />
                <p className="text-[11.5px] text-muted-foreground">
                  Valor entre 1 y 24 cuotas.
                </p>
              </div>
              <ImpactCallout
                actual={guardado.cuotasParaMoroso}
                nuevo={form.cuotasParaMoroso}
              />
            </div>

          </SettingSection>

          {/* Bloque 2 — Progresión del proceso */}
          <SettingSection
            icon={CalendarClock}
            title="Progresión del proceso"
            description="Reglas que rigen el avance entre etapas y la operación general del seguimiento."
          >
            <div className="grid gap-4 md:grid-cols-[260px_1fr] md:items-start">
              <div className="space-y-1.5">
                <Label htmlFor="diasEtapas" className="text-[12.5px] font-medium">
                  Días entre etapas
                </Label>
                <Input
                  id="diasEtapas"
                  type="number"
                  inputMode="numeric"
                  min={1}
                  max={120}
                  value={form.diasEntreEtapas}
                  onChange={(e) =>
                    setForm((f) => ({
                      ...f,
                      diasEntreEtapas: Math.max(1, Math.min(120, Number(e.target.value) || 1)),
                    }))
                  }
                  className="h-9 w-32 text-[14px] tabular"
                />
                <p className="text-[11.5px] text-muted-foreground">
                  Tiempo mínimo de permanencia en cada etapa antes de habilitar el avance.
                </p>
              </div>
              <InfoNote>
                Los procesos no podrán pasar a la siguiente etapa hasta cumplir este
                plazo, salvo que se fuerce el avance manual con justificación.
              </InfoNote>
            </div>

            <Separator className="my-5" />

            <div className="grid gap-4 md:grid-cols-[260px_1fr] md:items-start">
              <div className="space-y-1.5">
                <Label htmlFor="modo" className="text-[12.5px] font-medium">
                  Modo de operación
                </Label>
                <Select
                  value={form.modoOperacion}
                  onValueChange={(v) =>
                    setForm((f) => ({ ...f, modoOperacion: v as "manual" | "asistido" }))
                  }
                >
                  <SelectTrigger id="modo" className="h-9 w-full max-w-[220px] text-[13px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="manual" className="text-[13px]">Manual</SelectItem>
                    <SelectItem value="asistido" className="text-[13px]">Asistido</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-[11.5px] text-muted-foreground">
                  En modo asistido el sistema sugiere el próximo paso del proceso.
                </p>
              </div>
              <InfoNote>
                <span className="font-medium text-foreground">Manual:</span> el operador
                define cada acción.{" "}
                <span className="font-medium text-foreground">Asistido:</span> el sistema
                propone avances y notificaciones según los plazos configurados.
              </InfoNote>
            </div>
          </SettingSection>

          {/* Bloque 3 — Comportamiento automático */}
          <SettingSection
            icon={Settings2}
            title="Comportamiento automático"
            description="Acciones que el sistema ejecuta sin intervención del operador cuando se cumplen ciertas condiciones."
          >
            <div className="divide-y divide-border">
              <ToggleRow
                icon={History}
                title="Reanudación por incumplimiento de compromiso"
                description="Si un compromiso de pago no se cumple, el proceso se reanuda automáticamente en la etapa donde fue pausado."
                checked={form.reanudacionPorIncumplimiento}
                onChange={(v) => setForm((f) => ({ ...f, reanudacionPorIncumplimiento: v }))}
              />
              <ToggleRow
                icon={Bell}
                title="Notificar cambios de etapa"
                description="Envía notificaciones internas a los operadores responsables cuando un proceso cambia de etapa."
                checked={form.notificarCambiosEtapa}
                onChange={(v) => setForm((f) => ({ ...f, notificarCambiosEtapa: v }))}
              />
            </div>
          </SettingSection>

          {/* Footer sticky de cambios pendientes */}
          {hayCambios && (
            <div className="sticky bottom-4 z-10 flex flex-wrap items-center gap-3 rounded-md border border-status-paused/40 bg-status-paused-soft px-4 py-2.5 shadow-md">
              <AlertTriangle className="h-4 w-4 text-status-paused" />
              <div className="flex-1 text-[12.5px] text-foreground">
                Hay{" "}
                <span className="font-semibold">
                  {cambios.length} {cambios.length === 1 ? "cambio pendiente" : "cambios pendientes"}
                </span>{" "}
                sin guardar.
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleDescartar}
                  className="h-8 text-[12.5px]"
                >
                  Descartar
                </Button>
                <Button
                  size="sm"
                  onClick={handleGuardar}
                  className="h-8 gap-1.5 text-[12.5px]"
                >
                  <Save className="h-3.5 w-3.5" />
                  Guardar
                </Button>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Confirmación con advertencia de impacto */}
      <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <DialogContent className="sm:max-w-[560px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-[15px]">
              {impacto?.hayImpacto ? (
                <>
                  <AlertTriangle className="h-4 w-4 text-status-debt" />
                  Confirmar cambios — Impacto detectado
                </>
              ) : (
                <>
                  <ShieldAlert className="h-4 w-4 text-primary" />
                  Confirmar cambios de configuración
                </>
              )}
            </DialogTitle>
            <DialogDescription className="text-[12.5px]">
              Revisá los cambios antes de aplicarlos. Esta acción quedará registrada en la
              auditoría del sistema.
            </DialogDescription>
          </DialogHeader>

          {calculandoImpacto && (
            <div className="rounded-md border border-border bg-surface-muted/40 px-4 py-3 text-[12.5px] text-muted-foreground">
              Calculando impacto real...
            </div>
          )}

          {impactoError && (
            <div className="rounded-md border border-status-paused/30 bg-status-paused-soft px-4 py-3 text-[12.5px] text-foreground">
              No se pudo calcular el impacto automáticamente. Podés confirmar igual y guardar los cambios.
            </div>
          )}

          {impacto && !impacto.hayImpacto && (
            <div className="rounded-md border border-border bg-surface-muted/40 px-4 py-3 text-[12.5px] text-muted-foreground">
              {impacto.mensaje}
            </div>
          )}

          {impacto?.hayImpacto && (
            <div className="rounded-md border border-status-debt/30 bg-status-debt-soft px-4 py-3">
              <div className="flex items-start gap-2.5">
                <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-status-debt" />
                <div className="text-[12.5px] leading-5 text-foreground">
                  <div className="font-semibold">
                    {impacto?.mensaje}
                  </div>
                  <p className="mt-1 text-muted-foreground">
                    Impacto calculado con datos reales de procesos abiertos y última carga de deuda disponible en backend.
                  </p>
                  <p className="mt-2 text-[11.5px] text-muted-foreground">
                    Total de procesos abiertos en el sistema:{" "}
                    <span className="tabular font-medium text-foreground">
                      {numberFmt.format(impacto?.totalProcesosAbiertos ?? 0)}
                    </span>{" "}
                    · Impacto:{" "}
                    <span className="font-medium text-status-debt">
                      {(impacto?.porcentajeImpacto ?? 0).toFixed(1)}%
                    </span>
                  </p>
                </div>
              </div>
            </div>
          )}

          <div className="rounded-md border border-border bg-surface-muted/40">
            <div className="border-b border-border px-3 py-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              Resumen de cambios
            </div>
            <ul className="divide-y divide-border">
              {cambios.map((c) => (
                <li key={c.key} className="flex items-center gap-3 px-3 py-2 text-[12.5px]">
                  <span className="flex-1 text-foreground">{c.label}</span>
                  <span className="tabular text-muted-foreground line-through">
                    {c.antes}
                  </span>
                  <span className="text-muted-foreground">→</span>
                  <span className="tabular font-medium text-foreground">{c.despues}</span>
                </li>
              ))}
            </ul>
          </div>

          <DialogFooter className="gap-2 sm:gap-2">
            <Button
              variant="outline"
              onClick={() => setConfirmOpen(false)}
              className="h-9 text-[13px]"
            >
              Cancelar
            </Button>
            <Button
              onClick={handleConfirmar}
              disabled={saving}
              className={cn(
                "h-9 text-[13px]",
                impacto?.hayImpacto &&
                  "bg-status-debt text-status-debt-foreground hover:bg-status-debt/90",
              )}
            >
              {impacto?.hayImpacto ? "Confirmar y aplicar cambios" : "Aplicar cambios"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

/* -------------------- Subcomponentes -------------------- */

function SettingSection({
  icon: Icon,
  title,
  description,
  children,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <section className="overflow-hidden rounded-md border border-border bg-surface shadow-sm">
      <header className="flex items-start gap-3 border-b border-border bg-surface-muted/40 px-5 py-3.5">
        <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-md border border-border bg-surface">
          <Icon className="h-4 w-4 text-primary" />
        </div>
        <div className="min-w-0">
          <h2 className="font-serif text-[15px] font-semibold leading-tight text-foreground">
            {title}
          </h2>
          <p className="mt-0.5 text-[12px] leading-4 text-muted-foreground">
            {description}
          </p>
        </div>
      </header>
      <div className="p-5">{children}</div>
    </section>
  );
}

function InfoNote({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-start gap-2 rounded-md border border-border bg-surface-muted/40 px-3 py-2.5 text-[12px] leading-5 text-muted-foreground">
      <Info className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary/70" />
      <div>{children}</div>
    </div>
  );
}

function ImpactCallout({
  actual,
  nuevo,
}: {
  actual: number;
  nuevo: number;
}) {
  if (nuevo === actual) {
    return (
      <InfoNote>
        Valor actual del sistema. Los procesos abiertos cumplen este umbral.
      </InfoNote>
    );
  }

  if (nuevo < actual) {
    return (
      <div className="flex items-start gap-2 rounded-md border border-status-active/30 bg-status-active-soft px-3 py-2.5 text-[12px] leading-5 text-foreground">
        <Info className="mt-0.5 h-3.5 w-3.5 shrink-0 text-status-active" />
        <div>
          Reducir el umbral{" "}
          <span className="font-medium">
            ampliará el universo de morosos
          </span>{" "}
          en próximas evaluaciones. Los procesos actuales mantienen su estado.
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-start gap-2 rounded-md border border-status-debt/30 bg-status-debt-soft px-3 py-2.5 text-[12px] leading-5 text-foreground">
      <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-status-debt" />
      <div>
        <div className="font-semibold">
          El impacto se calculará con datos reales al confirmar cambios.
        </div>
        <div className="mt-0.5 text-muted-foreground">
          Al elevar el umbral, esos procesos quedarán pendientes de revisión. Se te
          pedirá confirmación antes de aplicar el cambio.
        </div>
      </div>
    </div>
  );
}

function ToggleRow({
  icon: Icon,
  title,
  description,
  checked,
  onChange,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  description: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <div className="flex items-start justify-between gap-4 py-3.5 first:pt-0 last:pb-0">
      <div className="flex items-start gap-3">
        <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-md border border-border bg-surface-muted/60">
          <Icon className="h-3.5 w-3.5 text-muted-foreground" />
        </div>
        <div className="min-w-0">
          <div className="text-[13px] font-medium leading-5 text-foreground">{title}</div>
          <p className="mt-0.5 max-w-xl text-[12px] leading-4 text-muted-foreground">
            {description}
          </p>
        </div>
      </div>
      <Switch checked={checked} onCheckedChange={onChange} className="mt-1" />
    </div>
  );
}
