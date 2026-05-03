import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft,
  Save,
  X,
  Pencil,
  History,
  Receipt,
  StickyNote,
  Phone,
  Mail,
  MapPin,
  Building2,
  Hash,
  User,
  ChevronRight,
} from "lucide-react";
import { AppHeader } from "@/components/layout/AppHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { inmueblesPadron, distritosInmueble } from "@/data/inmuebles";
import { gruposIniciales, seguimientoHabilitadoEn } from "@/data/grupos";
import { inmueblesApi } from "@/services/api/inmueblesApi";
import { ApiError, USE_API } from "@/lib/apiClient";

interface ConfigState {
  grupo: string;
  distrito: string;
  telefono: string;
  email: string;
  activo: boolean;
  seguimientoHabilitado: boolean;
  observaciones: string;
}

export default function InmuebleDetalle() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();

  const inmuebleMock = useMemo(() => inmueblesPadron.find((i) => i.id === id), [id]);
  const [inmuebleApiData, setInmuebleApiData] = useState<any | null>(null);
  const inmueble = USE_API
    ? (inmuebleApiData
      ? {
          id: String(inmuebleApiData.id ?? id ?? ""),
          cuenta: String(inmuebleApiData.cuenta ?? "-"),
          titular: String(inmuebleApiData.titular ?? "-"),
          direccion: String(inmuebleApiData.direccion ?? "-"),
          grupo: String(inmuebleApiData.grupoNombre ?? inmuebleApiData.grupo ?? "-"),
          distrito: String(inmuebleApiData.distritoNombre ?? inmuebleApiData.distrito ?? "-"),
          activo: Boolean(inmuebleApiData.activo ?? true),
        }
      : null)
    : inmuebleMock;

  // Grupos del catálogo filtrados según el distrito seleccionado.
  const distritoInicial = inmueble?.distrito ?? distritosInmueble[0];
  const gruposDelDistritoInicial = gruposIniciales
    .filter((g) => g.distritos.some((d) => d.distrito === distritoInicial))
    .map((g) => g.nombre);
  const grupoInicial =
    inmueble?.grupo && gruposDelDistritoInicial.includes(inmueble.grupo)
      ? inmueble.grupo
      : gruposDelDistritoInicial[0] ?? "";

  const initial: ConfigState = useMemo(
    () => ({
      grupo: grupoInicial,
      distrito: distritoInicial,
      telefono: "+54 379 4-" + (300000 + Number(id ?? 0) * 137).toString().slice(-6),
      email: `contacto${id ?? "0"}@aosc.gob.ar`,
      activo: inmueble?.activo ?? true,
      seguimientoHabilitado: (inmueble?.activo ?? true) && Number(id ?? 0) % 4 !== 0,
      observaciones: "",
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [inmueble, id],
  );

  const [editing, setEditing] = useState(false);
  const [config, setConfig] = useState<ConfigState>(initial);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [togglingActivo, setTogglingActivo] = useState(false);
  const [togglingSeguimiento, setTogglingSeguimiento] = useState(false);
  const notFound = !inmueble;

  const dirty = JSON.stringify(config) !== JSON.stringify(initial);

  // Grupos disponibles según el distrito actualmente seleccionado.
  const gruposDelDistrito = useMemo(
    () =>
      gruposIniciales
        .filter((g) =>
          g.distritos.some((d) => d.distrito === config.distrito),
        )
        .map((g) => g.nombre),
    [config.distrito],
  );

  // ¿El par grupo+distrito tiene seguimiento habilitado en la configuración?
  const seguimientoPorParHabilitado = useMemo(() => {
    const grupo = gruposIniciales.find((g) => g.nombre === config.grupo);
    if (!grupo) return false;
    return seguimientoHabilitadoEn(grupo, config.distrito);
  }, [config.grupo, config.distrito]);

  // Elegibilidad efectiva del seguimiento del inmueble.
  const seguimientoElegible =
    config.activo && seguimientoPorParHabilitado;

  const fetchInmueble = async (targetId: string) => {
    setLoading(true);
    setError(null);
    try {
      const data = await inmueblesApi.getById(targetId);
      setInmuebleApiData(data);
    } catch (e: unknown) {
      setInmuebleApiData(null);
      setError(e instanceof ApiError ? e.message : "No se pudo cargar el inmueble.");
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!id) return;
    if (!USE_API) {
      setEditing(false);
      return;
    }
    try {
      setSaving(true);
      await inmueblesApi.update(id, {
        telefono: config.telefono,
        email: config.email,
        observaciones: config.observaciones || undefined,
      } as any);
      await fetchInmueble(id);
      setEditing(false);
      toast({ title: "Cambios guardados", description: "El inmueble fue actualizado correctamente." });
    } catch (e: unknown) {
      toast({
        title: "Error al guardar",
        description: e instanceof ApiError ? e.message : "No se pudieron guardar los cambios.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setConfig(initial);
    setEditing(false);
  };

  const handleToggleActivo = async (nextActivo: boolean) => {
    if (!editing || !id) return;
    if (!USE_API) {
      setConfig((prev) => ({
        ...prev,
        activo: nextActivo,
        seguimientoHabilitado: nextActivo ? prev.seguimientoHabilitado : false,
      }));
      return;
    }
    try {
      setTogglingActivo(true);
      await inmueblesApi.toggleActivo(id, nextActivo);
      await fetchInmueble(id);
      toast({ title: nextActivo ? "Inmueble activado" : "Inmueble inactivado" });
    } catch (e: unknown) {
      toast({
        title: "Error al actualizar estado",
        description: e instanceof ApiError ? e.message : "No se pudo actualizar el estado del inmueble.",
        variant: "destructive",
      });
    } finally {
      setTogglingActivo(false);
    }
  };

  const handleToggleSeguimiento = async (nextSeguimientoHabilitado: boolean) => {
    if (!editing || !id) return;
    if (!USE_API) {
      setConfig((prev) => ({ ...prev, seguimientoHabilitado: nextSeguimientoHabilitado }));
      return;
    }
    try {
      setTogglingSeguimiento(true);
      await inmueblesApi.toggleSeguimiento(id, nextSeguimientoHabilitado);
      await fetchInmueble(id);
      toast({ title: nextSeguimientoHabilitado ? "Seguimiento habilitado" : "Seguimiento deshabilitado" });
    } catch (e: unknown) {
      toast({
        title: "Error al actualizar seguimiento",
        description: e instanceof ApiError ? e.message : "No se pudo actualizar el seguimiento.",
        variant: "destructive",
      });
    } finally {
      setTogglingSeguimiento(false);
    }
  };

  useEffect(() => {
    if (!USE_API || !id) return;
    fetchInmueble(id);
  }, [id]);

  useEffect(() => {
    setConfig(initial);
    setEditing(false);
  }, [initial]);

  if (loading) {
    return (
      <>
        <AppHeader title="Inmueble" breadcrumb={[{ label: "Inmuebles", to: "/inmuebles" }, { label: "Detalle" }]} />
        <main className="flex-1 px-6 py-10">
          <div className="rounded-md border border-border bg-surface p-8 text-center text-[13px] text-muted-foreground">
            Cargando inmueble...
          </div>
        </main>
      </>
    );
  }

  if (error) {
    return (
      <>
        <AppHeader title="Error al cargar inmueble" breadcrumb={[{ label: "Inmuebles", to: "/inmuebles" }, { label: "Detalle" }]} />
        <main className="flex-1 px-6 py-10">
          <div className="rounded-md border border-destructive/30 bg-destructive/10 p-8 text-center text-[13px] text-destructive">
            {error}
          </div>
        </main>
      </>
    );
  }

  if (notFound) {
    return (
      <>
        <AppHeader
          title="Inmueble no encontrado"
          breadcrumb={[{ label: "Inmuebles", to: "/inmuebles" }, { label: "Detalle" }]}
        />
        <main className="flex-1 px-6 py-10">
          <div className="rounded-md border border-border bg-surface p-8 text-center text-[13px] text-muted-foreground">
            El inmueble solicitado no existe o fue dado de baja.
            <div className="mt-4">
              <Button variant="outline" size="sm" asChild>
                <Link to="/inmuebles">Volver al listado</Link>
              </Button>
            </div>
          </div>
        </main>
      </>
    );
  }

  return (
    <>
      <AppHeader
        title={`Inmueble · ${inmueble.cuenta}`}
        description={inmueble.titular}
        breadcrumb={[
          { label: "Inmuebles", to: "/inmuebles" },
          { label: inmueble.cuenta },
        ]}
        actions={
          <>
            <Button
              variant="outline"
              size="sm"
              className="h-9 gap-2"
              onClick={() => navigate("/inmuebles")}
            >
              <ArrowLeft className="h-4 w-4" />
              Volver al listado
            </Button>
            {!editing ? (
              <Button size="sm" className="h-9 gap-2" onClick={() => setEditing(true)}>
                <Pencil className="h-4 w-4" />
                Editar configuración
              </Button>
            ) : (
              <>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-9 gap-2"
                  onClick={handleCancel}
                >
                  <X className="h-4 w-4" />
                  Cancelar
                </Button>
                <Button
                  size="sm"
                  className="h-9 gap-2"
                  onClick={handleSave}
                  disabled={!dirty || saving}
                >
                  <Save className="h-4 w-4" />
                  Guardar cambios
                </Button>
              </>
            )}
          </>
        }
      />

      <main className="flex-1 space-y-6 px-6 py-6">
        {/* Bloque superior: datos principales */}
        <section className="rounded-md border border-border bg-surface shadow-sm">
          <SectionHeader
            title="Datos del inmueble"
            subtitle="Información identificatoria registrada en el padrón"
          />
          <div className="grid grid-cols-1 gap-x-8 gap-y-4 px-5 py-5 md:grid-cols-2 lg:grid-cols-3">
            <DataField icon={Hash} label="N° de cuenta" value={inmueble.cuenta} mono />
            <DataField icon={User} label="Titular" value={inmueble.titular} />
            <DataField
              icon={MapPin}
              label="Dirección"
              value={inmueble.direccion}
            />
            <DataField icon={MapPin} label="Distrito" value={config.distrito} />
            <DataField icon={Building2} label="Grupo" value={config.grupo} />
            <DataField
              label="Estado"
              value={
                <EstadoPill activo={config.activo} />
              }
            />
            <DataField icon={Phone} label="Teléfono de contacto" value={config.telefono} mono />
            <DataField icon={Mail} label="Email" value={config.email} />
            <DataField
              label="Seguimiento de morosidad"
              value={
                <span className="text-[13px] text-foreground">
                  {config.seguimientoHabilitado && seguimientoElegible
                    ? "Habilitado"
                    : "Deshabilitado"}
                </span>
              }
            />
          </div>
        </section>

        {/* Configuración editable + accesos */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <section className="rounded-md border border-border bg-surface shadow-sm lg:col-span-2">
            <SectionHeader
              title="Configuración operativa"
              subtitle="Parámetros editables del inmueble"
            />
            <div className="grid grid-cols-1 gap-4 px-5 py-5 md:grid-cols-2">
              <FieldGroup label="Distrito">
                <Select
                  value={config.distrito}
                  onValueChange={(v) => {
                    // Al cambiar de distrito, validamos que el grupo siga siendo válido.
                    const gruposEnDistrito = gruposIniciales
                      .filter((g) =>
                        g.distritos.some((d) => d.distrito === v),
                      )
                      .map((g) => g.nombre);
                    const nuevoGrupo = gruposEnDistrito.includes(config.grupo)
                      ? config.grupo
                      : gruposEnDistrito[0] ?? "";
                    setConfig({ ...config, distrito: v, grupo: nuevoGrupo });
                  }}
                  disabled={!editing}
                >
                  <SelectTrigger className="h-9 text-[13px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {distritosInmueble.map((d) => (
                      <SelectItem key={d} value={d} className="text-[13px]">
                        {d}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </FieldGroup>

              <FieldGroup label="Grupo">
                <Select
                  value={config.grupo}
                  onValueChange={(v) => setConfig({ ...config, grupo: v })}
                  disabled={!editing || gruposDelDistrito.length === 0}
                >
                  <SelectTrigger className="h-9 text-[13px]">
                    <SelectValue
                      placeholder={
                        gruposDelDistrito.length === 0
                          ? "Sin grupos en este distrito"
                          : "Seleccionar grupo..."
                      }
                    />
                  </SelectTrigger>
                  <SelectContent>
                    {gruposDelDistrito.map((g) => (
                      <SelectItem key={g} value={g} className="text-[13px]">
                        {g}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-[11.5px] text-muted-foreground">
                  Solo se muestran los grupos asociados al distrito seleccionado.
                </p>
              </FieldGroup>

              <FieldGroup label="Teléfono de contacto">
                <Input
                  value={config.telefono}
                  onChange={(e) => setConfig({ ...config, telefono: e.target.value })}
                  disabled={!editing}
                  className="h-9 text-[13px]"
                />
              </FieldGroup>

              <FieldGroup label="Email">
                <Input
                  type="email"
                  value={config.email}
                  onChange={(e) => setConfig({ ...config, email: e.target.value })}
                  disabled={!editing}
                  className="h-9 text-[13px]"
                />
              </FieldGroup>

              <ToggleRow
                label="Inmueble activo"
                hint="Si se desactiva, no se generarán nuevas gestiones."
                checked={config.activo}
                disabled={!editing || togglingActivo}
                onCheckedChange={handleToggleActivo}
              />

              <ToggleRow
                label="Seguimiento de morosidad"
                hint={
                  !seguimientoPorParHabilitado
                    ? "El par grupo + distrito no tiene seguimiento habilitado."
                    : "Habilita el flujo automático de avisos, intimaciones y cortes."
                }
                checked={config.seguimientoHabilitado}
                disabled={
                  !editing || !config.activo || !seguimientoPorParHabilitado || togglingSeguimiento
                }
                onCheckedChange={handleToggleSeguimiento}
              />

              <div className="md:col-span-2">
                <FieldGroup label="Observaciones internas">
                  <Textarea
                    value={config.observaciones}
                    onChange={(e) =>
                      setConfig({ ...config, observaciones: e.target.value })
                    }
                    disabled={!editing}
                    placeholder="Notas operativas visibles solo para el personal del organismo."
                    rows={4}
                    className="resize-none text-[13px]"
                  />
                </FieldGroup>
              </div>
            </div>
          </section>

          {/* Accesos relacionados */}
          <aside className="space-y-4">
            <section className="rounded-md border border-border bg-surface shadow-sm">
              <SectionHeader title="Accesos relacionados" />
              <div className="flex flex-col">
                <AccessRow
                  icon={History}
                  title="Historial de seguimiento"
                  description="Avisos, intimaciones y cortes registrados."
                  to={`/inmuebles/${inmueble.id}/seguimiento`}
                />
                <AccessRow
                  icon={Receipt}
                  title="Historial de deuda"
                  description="Períodos adeudados y pagos registrados."
                  to={`/inmuebles/${inmueble.id}/deuda`}
                />
                <AccessRow
                  icon={StickyNote}
                  title="Observaciones del expediente"
                  description="Notas y documentos cargados al inmueble."
                  to={`/inmuebles/${inmueble.id}/observaciones`}
                  last
                />
              </div>
            </section>

            <section className="rounded-md border border-border bg-surface shadow-sm">
              <SectionHeader title="Resumen operativo" />
              <dl className="divide-y divide-border text-[12.5px]">
                <ResumenRow label="Última gestión" value="12/03/2026" />
                <ResumenRow label="Etapa actual" value="Intimación" />
                <ResumenRow label="Períodos adeudados" value="3" />
                <ResumenRow label="Monto adeudado" value="$ 184.520,00" mono />
              </dl>
            </section>
          </aside>
        </div>
      </main>
    </>
  );
}

/* ---------- Subcomponentes ---------- */

function SectionHeader({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <div className="border-b border-border bg-surface-muted/40 px-5 py-3">
      <div className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
        {title}
      </div>
      {subtitle && (
        <div className="mt-0.5 text-[12px] text-muted-foreground/80">{subtitle}</div>
      )}
    </div>
  );
}

function DataField({
  icon: Icon,
  label,
  value,
  mono,
}: {
  icon?: React.ComponentType<{ className?: string }>;
  label: string;
  value: React.ReactNode;
  mono?: boolean;
}) {
  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
        {Icon && <Icon className="h-3 w-3" />}
        {label}
      </div>
      <div
        className={cn(
          "text-[13.5px] text-foreground",
          mono && "tabular font-medium",
        )}
      >
        {value}
      </div>
    </div>
  );
}

function FieldGroup({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <Label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
        {label}
      </Label>
      {children}
    </div>
  );
}

function ToggleRow({
  label,
  hint,
  checked,
  disabled,
  onCheckedChange,
}: {
  label: string;
  hint?: string;
  checked: boolean;
  disabled?: boolean;
  onCheckedChange: (v: boolean) => void;
}) {
  return (
    <div
      className={cn(
        "flex items-start justify-between gap-3 rounded-md border border-border bg-surface-muted/30 px-3 py-2.5",
        disabled && "opacity-70",
      )}
    >
      <div>
        <div className="text-[12.5px] font-medium text-foreground">{label}</div>
        {hint && (
          <div className="mt-0.5 text-[11.5px] text-muted-foreground">{hint}</div>
        )}
      </div>
      <Switch
        checked={checked}
        disabled={disabled}
        onCheckedChange={onCheckedChange}
      />
    </div>
  );
}

function AccessRow({
  icon: Icon,
  title,
  description,
  to,
  last,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  description: string;
  to: string;
  last?: boolean;
}) {
  return (
    <Link
      to={to}
      className={cn(
        "group flex items-center gap-3 px-4 py-3 transition-colors hover:bg-surface-muted/50",
        !last && "border-b border-border",
      )}
    >
      <div className="flex h-8 w-8 items-center justify-center rounded-md border border-border bg-surface-muted/60 text-muted-foreground group-hover:text-foreground">
        <Icon className="h-4 w-4" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-[13px] font-medium text-foreground">{title}</div>
        <div className="truncate text-[11.5px] text-muted-foreground">{description}</div>
      </div>
      <ChevronRight className="h-4 w-4 text-muted-foreground/70 transition-transform group-hover:translate-x-0.5 group-hover:text-foreground" />
    </Link>
  );
}

function ResumenRow({
  label,
  value,
  mono,
}: {
  label: string;
  value: React.ReactNode;
  mono?: boolean;
}) {
  return (
    <div className="flex items-center justify-between px-4 py-2.5">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className={cn("text-foreground", mono && "tabular font-medium")}>{value}</dd>
    </div>
  );
}

function EstadoPill({ activo }: { activo: boolean }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-[11.5px] font-medium",
        activo
          ? "border-status-active/20 bg-status-active-soft text-status-active"
          : "border-border bg-muted text-muted-foreground",
      )}
    >
      <span
        aria-hidden
        className={cn(
          "h-1.5 w-1.5 rounded-full",
          activo ? "bg-status-active" : "bg-muted-foreground/60",
        )}
      />
      {activo ? "Activo" : "Inactivo"}
    </span>
  );
}
