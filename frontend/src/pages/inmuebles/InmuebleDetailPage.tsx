import { Link, useNavigate, useParams } from 'react-router-dom';
import { useMemo } from 'react';
import { useInmueble } from '../../modules/inmuebles/hooks';
import { useHistorialDeudaByInmueble } from '../../modules/estadoDeuda/hooks';

function getErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : 'Ocurrió un error inesperado.';
}

function formatFecha(fecha: string) {
  return new Date(fecha).toLocaleString();
}

export function InmuebleDetailPage() {
  const { inmuebleId } = useParams();
  const navigate = useNavigate();
  const detailId = inmuebleId ?? '';
  const inmuebleQuery = useInmueble(detailId);
  const historialQuery = useHistorialDeudaByInmueble(detailId);

  const historialCronologico = useMemo(() => {
    const rows = [...(historialQuery.data ?? [])];
    rows.sort((a, b) => new Date(b.fechaCarga).getTime() - new Date(a.fechaCarga).getTime());
    return rows;
  }, [historialQuery.data]);

  return (
    <section>
      <div className="section-title">
        <h2>Detalle de inmueble</h2>
        <button type="button" className="secondary" onClick={() => navigate('/inmuebles')}>
          Volver a inmuebles
        </button>
      </div>
      {inmuebleQuery.isLoading && <p>Cargando datos del inmueble...</p>}
      {inmuebleQuery.isError && <p className="feedback error">{getErrorMessage(inmuebleQuery.error)}</p>}
      {inmuebleQuery.data && (
        <p>
          <strong>{inmuebleQuery.data.numeroCuenta}</strong> - {inmuebleQuery.data.propietarioNombre}
        </p>
      )}

      <p>
        <strong>ID:</strong> {inmuebleId}
      </p>

      <h3>Historial de deuda</h3>
      <p>Evolución financiera del inmueble según cada carga histórica de estado de deuda.</p>
      <div className="toolbar">
        <Link to="/estados-deuda/cargas?tab=historico">Ver histórico de cargas</Link>
        <Link to="/estados-deuda/cargas?tab=reportes">Ver reportes</Link>
      </div>

      {historialQuery.isLoading && <p>Cargando historial de deuda...</p>}
      {historialQuery.isError && (
        <p className="feedback error">No se pudo obtener el historial de deuda del inmueble. {getErrorMessage(historialQuery.error)}</p>
      )}

      {!historialQuery.isLoading && !historialQuery.isError && historialCronologico.length === 0 && (
        <p>No hay historial de deuda registrado para este inmueble.</p>
      )}

      {historialCronologico.length > 0 && (
        <div className="table-container">
          <table className="simple-table">
            <thead>
              <tr>
                <th>Fecha de carga</th>
                <th>Cuotas adeudadas</th>
                <th>Monto adeudado</th>
                <th>Apto para seguimiento</th>
                <th>Archivo</th>
              </tr>
            </thead>
            <tbody>
              {historialCronologico.map((item, index) => (
                <tr key={`${item.fechaCarga}-${index}`}>
                  <td>{formatFecha(item.fechaCarga)}</td>
                  <td>{item.cuotasAdeudadas}</td>
                  <td>{item.montoAdeudado}</td>
                  <td>{item.aptoParaSeguimiento ? 'Sí' : 'No'}</td>
                  <td>{item.nombreArchivo?.trim() || '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
