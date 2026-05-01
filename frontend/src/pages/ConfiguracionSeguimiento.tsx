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

const valoresIniciales: ParametrosSeguimiento = {
  cuotasParaMoroso: 3,
  reanudacionPorIncumplimiento: true,
  diasEntreEtapas: 15,
  notificarCambiosEtapa: true,
  modoOperacion: "asistido",
};

// Distribución demo de procesos abiertos por cantidad de cuotas adeudadas.
// Se usa para calcular el impacto al modificar el umbral.
const procesosAbiertosPorCuotas: Record<number, number> = {
  1: 184,
  2: 312,
  3: 421,
  4: 268,
  5: 192,
  6: 134,
  7: 98,
  8: 72,
  9: 54,
  10: 41,
};

const TOTAL_PROCESOS_ABIERTOS = Object.values(procesosAbiertosPorCuotas).reduce(
  (a, b) => a + b,
  0,
);

function procesosQueDejanDeCumplir(
  cuotasActual: number,
  cuotasNuevo: number,
): number {
  // Solo si el umbral sube quedan procesos por debajo del nuevo mínimo.
  if (cuotasNuevo <= cuotasActual) return 0;
  let total = 0;
  for (let c = cuotasActual; c < cuotasNuevo; c++) {
    total += procesosAbiertosPorCuotas[c] ?? 0;
  }
  return total;
}

export default function ConfiguracionSeguimiento() {
  const { toast } = useToast();
  const [guardado, setGuardado] = useState<ParametrosSeguimiento>(valoresIniciales);
  const [form, setForm] = useState<ParametrosSeguimiento>(valoresIniciales);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
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
        reanudacionPorIncumplimiento: Boolean(get("REANUDACION_POR_INCUMPLIMIENTO") ?? valoresIniciales.reanudacionPorIncumplimiento),
        diasEntreEtapas: Number(get("DIAS_ENTRE_ETAPAS") ?? valoresIniciales.diasEntreEtapas),
        notificarCambiosEtapa: Boolean(get("NOTIFICAR_CAMBIOS_ETAPA") ?? valoresIniciales.notificarCambiosEtapa),
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

  const procesosImpactados = procesosQueDejanDeCumplir(
    guardado.cuotasParaMoroso,
    form.cuotasParaMoroso,
  );

  const handleGuardar = () => {
    if (!hayCambios) return;
    setConfirmOpen(true);
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
                impactados={procesosImpactados}
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
              {procesosImpactados > 0 ? (
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

          {procesosImpactados > 0 && (
            <div className="rounded-md border border-status-debt/30 bg-status-debt-soft px-4 py-3">
              <div className="flex items-start gap-2.5">
                <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-status-debt" />
                <div className="text-[12.5px] leading-5 text-foreground">
                  <div className="font-semibold">
                    {numberFmt.format(procesosImpactados)} procesos abiertos dejarán de
                    cumplir el umbral.
                  </div>
                  <p className="mt-1 text-muted-foreground">
                    Al subir el umbral de morosidad de{" "}
                    <span className="font-medium text-foreground">
                      {guardado.cuotasParaMoroso} a {form.cuotasParaMoroso} cuotas
                    </span>
                    , esos procesos quedarán fuera de la condición actual. El sistema los
                    marcará como{" "}
                    <span className="font-medium text-foreground">
                      "pendientes de revisión"
                    </span>{" "}
                    y deberán ser cerrados manualmente o esperar a que se regularicen.
                  </p>
                  <p className="mt-2 text-[11.5px] text-muted-foreground">
                    Total de procesos abiertos en el sistema:{" "}
                    <span className="tabular font-medium text-foreground">
                      {numberFmt.format(TOTAL_PROCESOS_ABIERTOS)}
                    </span>{" "}
                    · Impacto:{" "}
                    <span className="font-medium text-status-debt">
                      {((procesosImpactados / TOTAL_PROCESOS_ABIERTOS) * 100).toFixed(1)}%
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
                procesosImpactados > 0 &&
                  "bg-status-debt text-status-debt-foreground hover:bg-status-debt/90",
              )}
            >
              {procesosImpactados > 0
                ? "Confirmar y aplicar cambios"
                : "Aplicar cambios"}
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
  impactados,
}: {
  actual: number;
  nuevo: number;
  impactados: number;
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
          {numberFmt.format(impactados)} procesos abiertos dejarían de cumplir la
          condición.
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
