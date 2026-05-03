import { useEffect, useState } from "react";
import { AppHeader } from "@/components/layout/AppHeader";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { auditoriaApi } from "@/services/api/auditoriaApi";

type AuditRow = {
  id: string;
  fecha: string;
  action: string;
  entityType: string;
  entityId: string;
  actorId: string;
  resumen: string;
  requestPath: string;
  traceId: string;
};

const PAGE_SIZE = 20;

function mapAuditLog(row: any): AuditRow {
  return {
    id: String(row.id ?? row.eventId ?? crypto.randomUUID()),
    fecha: String(row.createdAt ?? row.fecha ?? "-"),
    action: String(row.action ?? row.accion ?? "-"),
    entityType: String(row.entityType ?? row.entidad ?? "-"),
    entityId: String(row.entityId ?? row.entidadId ?? "-"),
    actorId: String(row.actorId ?? row.usuario ?? "-"),
    resumen: String(row.summary ?? row.message ?? row.descripcion ?? "-"),
    requestPath: String(row.requestPath ?? row.path ?? "-"),
    traceId: String(row.traceId ?? row.correlationId ?? "-"),
  };
}

export default function AuditoriaMovimientos() {
  const [action, setAction] = useState("");
  const [entityType, setEntityType] = useState("");
  const [actorId, setActorId] = useState("");
  const [fechaDesde, setFechaDesde] = useState("");
  const [fechaHasta, setFechaHasta] = useState("");
  const [page, setPage] = useState(1);
  const [rows, setRows] = useState<AuditRow[]>([]);
  const [totalElements, setTotalElements] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        setError(null);
        const res = await auditoriaApi.movimientos({
          action: action || undefined,
          entityType: entityType || undefined,
          actorId: actorId || undefined,
          fechaDesde: fechaDesde || undefined,
          fechaHasta: fechaHasta || undefined,
          page: page - 1,
          size: PAGE_SIZE,
          sort: "createdAt,desc",
        });
        setRows((res.content ?? []).map(mapAuditLog));
        setTotalElements(res.totalElements ?? 0);
        setTotalPages(Math.max(1, res.totalPages ?? 1));
      } catch (e: any) {
        setError(e?.message ?? "No se pudo cargar auditoría.");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [action, entityType, actorId, fechaDesde, fechaHasta, page]);

  return (
    <>
      <AppHeader
        title="Auditoría / Movimientos"
        description="Consulta de movimientos auditados del sistema."
        breadcrumb={[{ label: "Auditoría" }, { label: "Movimientos" }]}
      />

      <main className="flex-1 space-y-4 px-6 py-6">
        <div className="grid grid-cols-1 gap-2 rounded-md border border-border bg-surface p-3 md:grid-cols-5">
          <Input value={action} onChange={(e) => { setAction(e.target.value); setPage(1); }} placeholder="Action" className="h-8 text-[12.5px]" />
          <Input value={entityType} onChange={(e) => { setEntityType(e.target.value); setPage(1); }} placeholder="Entity type" className="h-8 text-[12.5px]" />
          <Input value={actorId} onChange={(e) => { setActorId(e.target.value); setPage(1); }} placeholder="Actor ID" className="h-8 text-[12.5px]" />
          <Input type="date" value={fechaDesde} onChange={(e) => { setFechaDesde(e.target.value); setPage(1); }} className="h-8 text-[12.5px]" />
          <Input type="date" value={fechaHasta} onChange={(e) => { setFechaHasta(e.target.value); setPage(1); }} className="h-8 text-[12.5px]" />
        </div>

        {error && <div className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">{error}</div>}

        <div className="overflow-x-auto rounded-md border border-border bg-surface">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Fecha</TableHead>
                <TableHead>Action</TableHead>
                <TableHead>Entity type</TableHead>
                <TableHead>Entity ID</TableHead>
                <TableHead>Actor ID</TableHead>
                <TableHead>Resumen</TableHead>
                <TableHead>Path</TableHead>
                <TableHead>Trace ID</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.length === 0 && (
                <TableRow>
                  <TableCell colSpan={8} className="h-24 text-center text-sm text-muted-foreground">
                    {loading ? "Cargando movimientos..." : "Sin movimientos para mostrar."}
                  </TableCell>
                </TableRow>
              )}
              {rows.map((r) => (
                <TableRow key={r.id}>
                  <TableCell>{r.fecha}</TableCell>
                  <TableCell>{r.action}</TableCell>
                  <TableCell>{r.entityType}</TableCell>
                  <TableCell>{r.entityId}</TableCell>
                  <TableCell>{r.actorId}</TableCell>
                  <TableCell>{r.resumen}</TableCell>
                  <TableCell>{r.requestPath}</TableCell>
                  <TableCell>{r.traceId}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <span>Total: {totalElements}</span>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage((p) => Math.max(1, p - 1))}>Anterior</Button>
            <span>{page} / {totalPages}</span>
            <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => setPage((p) => Math.min(totalPages, p + 1))}>Siguiente</Button>
          </div>
        </div>
      </main>
    </>
  );
}

