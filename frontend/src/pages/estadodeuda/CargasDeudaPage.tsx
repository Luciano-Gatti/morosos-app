import { Link } from 'react-router-dom';
import { useMemo } from 'react';
import { useCargasDeuda } from '../../modules/estadoDeuda/hooks';

function getErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : 'Ocurrió un error inesperado.';
}

function formatFecha(fecha: string) {
  return new Date(fecha).toLocaleString();
}

export function CargasDeudaPage() {
  const cargasQuery = useCargasDeuda();

  const cargasOrdenadas = useMemo(() => {
    const rows = [...(cargasQuery.data ?? [])];
    rows.sort((a, b) => new Date(a.fechaCarga).getTime() - new Date(b.fechaCarga).getTime());
    return rows;
  }, [cargasQuery.data]);

  return (
    <section>
      <h2>Cargas de deuda</h2>
      <p>Listado histórico de cargas importadas de estado de deuda.</p>

      {cargasQuery.isLoading && <p>Cargando cargas de deuda...</p>}
      {cargasQuery.isError && <p className="feedback error">{getErrorMessage(cargasQuery.error)}</p>}

      {!cargasQuery.isLoading && !cargasQuery.isError && cargasOrdenadas.length === 0 && (
        <p>No hay cargas de deuda históricas registradas.</p>
      )}

      {cargasOrdenadas.length > 0 && (
        <div className="table-container">
          <table className="simple-table">
            <thead>
              <tr>
                <th>ID carga</th>
                <th>Fecha de carga</th>
                <th>Nombre de archivo</th>
                <th>Observación</th>
                <th>Registros históricos</th>
                <th>Acción</th>
              </tr>
            </thead>
            <tbody>
              {cargasOrdenadas.map((carga) => (
                <tr key={carga.id}>
                  <td>{carga.id}</td>
                  <td>{formatFecha(carga.fechaCarga)}</td>
                  <td>{carga.nombreArchivo}</td>
                  <td>{carga.observacion?.trim() || '-'}</td>
                  <td>{carga.cantidadRegistrosHistoricos}</td>
                  <td>
                    <Link to={`/estados-deuda/cargas/${carga.id}`}>Ver detalle</Link>
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
