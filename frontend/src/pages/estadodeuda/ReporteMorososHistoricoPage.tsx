import { useMemo } from 'react';
import { useReporteMorososPorCarga } from '../../modules/estadoDeuda/hooks';

function getErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : 'Ocurrió un error inesperado.';
}

function formatFecha(fecha: string) {
  return new Date(fecha).toLocaleString();
}

export function ReporteMorososHistoricoPage() {
  const reporteQuery = useReporteMorososPorCarga();

  const cargasOrdenadas = useMemo(() => {
    const rows = [...(reporteQuery.data ?? [])];
    rows.sort((a, b) => new Date(a.fechaCarga).getTime() - new Date(b.fechaCarga).getTime());
    return rows;
  }, [reporteQuery.data]);

  return (
    <section>
      <h2>Reporte histórico de morosos</h2>
      <p>Evolución de morosos por carga, con detalle de clasificación por grupo.</p>

      {reporteQuery.isLoading && <p>Cargando reporte histórico...</p>}
      {reporteQuery.isError && <p className="feedback error">{getErrorMessage(reporteQuery.error)}</p>}

      {!reporteQuery.isLoading && !reporteQuery.isError && cargasOrdenadas.length === 0 && (
        <p>No hay datos históricos de morosos para mostrar.</p>
      )}

      {cargasOrdenadas.length > 0 && (
        <div className="table-container">
          <table className="simple-table">
            <thead>
              <tr>
                <th>Fecha de carga</th>
                <th>Total morosos</th>
                <th>Monto total adeudado</th>
                <th>Detalle por grupo</th>
              </tr>
            </thead>
            <tbody>
              {cargasOrdenadas.map((carga) => (
                <tr key={carga.idCarga}>
                  <td>{formatFecha(carga.fechaCarga)}</td>
                  <td>{carga.cantidadTotalMorosos}</td>
                  <td>{carga.montoTotalAdeudado}</td>
                  <td>
                    {carga.detallePorGrupo.length === 0 ? (
                      <span>Sin detalle</span>
                    ) : (
                      <details>
                        <summary>Ver grupos ({carga.detallePorGrupo.length})</summary>
                        <div className="table-container">
                          <table className="simple-table">
                            <thead>
                              <tr>
                                <th>Grupo</th>
                                <th>Cantidad morosos</th>
                                <th>Monto adeudado del grupo</th>
                              </tr>
                            </thead>
                            <tbody>
                              {carga.detallePorGrupo.map((grupo) => (
                                <tr key={grupo.grupoId}>
                                  <td>{grupo.grupoNombre}</td>
                                  <td>{grupo.cantidadMorosos}</td>
                                  <td>{grupo.montoTotalAdeudadoDelGrupo}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </details>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
