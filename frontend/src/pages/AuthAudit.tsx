import { useEffect, useState } from "react";

import { AppHeader } from "@/components/layout/AppHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useAuth } from "@/hooks/useAuth";
import { authService, isAuthError } from "@/services/api/authService";
import type { AuthAuditItem } from "@/types/auth";

export default function AuthAudit() {
  const { accessToken } = useAuth();
  const [items, setItems] = useState<AuthAuditItem[]>([]);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [accion, setAccion] = useState("");
  const [usuario, setUsuario] = useState("");
  const [fechaDesde, setFechaDesde] = useState("");
  const [fechaHasta, setFechaHasta] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!accessToken) return;
    setLoading(true);
    setError(null);
    authService.adminAuthAudit(accessToken, { page, size: 20, accion, usuario, fechaDesde, fechaHasta })
      .then((response) => {
        setItems(response.content);
        setTotalPages(response.totalPages);
      })
      .catch((err) => {
        setError(isAuthError(err) ? err.message : "No se pudo cargar la auditoria.");
      })
      .finally(() => setLoading(false));
  }, [accessToken, accion, fechaDesde, fechaHasta, page, usuario]);

  return (
    <>
      <AppHeader
        title="Auditoria auth"
        description="Eventos de login, logout, refresh y cambios de roles/permisos."
        breadcrumb={[{ label: "Administracion" }, { label: "Auditoria auth" }]}
      />

      <main className="flex-1 px-4 py-4 sm:px-6 sm:py-6">
        <div className="rounded-md border border-border bg-surface shadow-sm">
          <div className="grid gap-2 border-b border-border px-4 py-3 md:grid-cols-4">
            <Input placeholder="Actor" value={usuario} onChange={(event) => { setUsuario(event.target.value); setPage(0); }} />
            <Input placeholder="Accion" value={accion} onChange={(event) => { setAccion(event.target.value); setPage(0); }} />
            <Input type="date" value={fechaDesde} onChange={(event) => { setFechaDesde(event.target.value); setPage(0); }} />
            <Input type="date" value={fechaHasta} onChange={(event) => { setFechaHasta(event.target.value); setPage(0); }} />
          </div>

          {loading && <div className="px-4 py-3 text-sm text-muted-foreground">Cargando auditoria...</div>}
          {error && <div className="px-4 py-3 text-sm text-destructive">{error}</div>}

          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Fecha</TableHead>
                  <TableHead>Accion</TableHead>
                  <TableHead>Actor</TableHead>
                  <TableHead>Entidad</TableHead>
                  <TableHead>Path</TableHead>
                  <TableHead>Trace</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell>{new Date(item.createdAt).toLocaleString("es-AR")}</TableCell>
                    <TableCell>{item.action}</TableCell>
                    <TableCell>{item.actorId ?? "-"}</TableCell>
                    <TableCell>{item.entityType}{item.entityId ? `:${item.entityId}` : ""}</TableCell>
                    <TableCell>{item.requestPath ?? "-"}</TableCell>
                    <TableCell>{item.traceId ?? "-"}</TableCell>
                  </TableRow>
                ))}
                {!loading && items.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={6} className="h-24 text-center text-sm text-muted-foreground">
                      Sin eventos para los filtros seleccionados.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>

          <div className="flex items-center justify-between border-t border-border px-4 py-3">
            <div className="text-sm text-muted-foreground">Pagina {page + 1} de {Math.max(totalPages, 1)}</div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" disabled={page <= 0} onClick={() => setPage((current) => Math.max(current - 1, 0))}>
                Anterior
              </Button>
              <Button variant="outline" size="sm" disabled={page + 1 >= totalPages} onClick={() => setPage((current) => current + 1)}>
                Siguiente
              </Button>
            </div>
          </div>
        </div>
      </main>
    </>
  );
}
