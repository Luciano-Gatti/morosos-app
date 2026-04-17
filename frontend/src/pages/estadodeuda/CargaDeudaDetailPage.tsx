import { useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useCargaDeudaDetalle } from '../../modules/estadoDeuda/hooks';
import { useInmuebles } from '../../modules/inmuebles/hooks';

function getErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : 'Ocurrió un error inesperado.';
}

export function CargaDeudaDetailPage() {
  const { cargaId = '' } = useParams();
  const navigate = useNavigate();
  const detalleQuery = useCargaDeudaDetalle(cargaId);
  const inmueblesQuery = useInmuebles({});

  const [numeroCuentaFilter, setNumeroCuentaFilter] = useState('');
  const [grupoFilter, setGrupoFilter] = useState('');
  const [aptoFilter, setAptoFilter] = useState<'all' | 'true' | 'false'>('all');

  const rows = useMemo(() => {
    const inmueblesById = new Map((inmueblesQuery.data ?? []).map((inmueble) => [inmueble.id, inmueble]));

    return (detalleQuery.data ?? []).map((item) => {
      const inmueble = inmueblesById.get(item.inmuebleId);
      return {
        ...item,
        propietarioNombre: inmueble?.propietarioNombre ?? '',
        identificacionVisible: inmueble?.propietarioNombre?.trim() || item.inmuebleId,
        grupoNombre: inmueble?.grupoNombre ?? ''
      };
    });
  }, [detalleQuery.data, inmueblesQuery.data]);

  const gruposDisponibles = useMemo(
    () =>
      Array.from(new Set(rows.map((row) => row.grupoNombre).filter((grupoNombre) => grupoNombre.trim() !== ''))).sort(
        (a, b) => a.localeCompare(b)
      ),
    [rows]
  );

  const filteredRows = useMemo(() => {
    return rows.filter((row) => {
      if (numeroCuentaFilter.trim()) {
        const numeroCuenta = row.numeroCuenta.toLowerCase();
        if (!numeroCuenta.includes(numeroCuentaFilter.trim().toLowerCase())) {
          return false;
        }
      }

      if (grupoFilter && row.grupoNombre !== grupoFilter) {
        return false;
      }

      if (aptoFilter !== 'all') {
        const expected = aptoFilter === 'true';
        if (row.aptoParaSeguimiento !== expected) {
          return false;
        }
      }

      return true;
    });
  }, [rows, numeroCuentaFilter, grupoFilter, aptoFilter]);

  return (
    <section>
      <div className="section-title">
        <h2>Detalle de carga de deuda</h2>
        <button type="button" className="secondary" onClick={() => navigate('/estados-deuda/cargas')}>
          Volver a cargas
        </button>
      </div>

      <p>
        <strong>ID carga:</strong> {cargaId}
      </p>
      <div className="toolbar">
        <Link to="/estados-deuda/importacion">Ir a importación</Link>
        <Link to="/estados-deuda/reportes/morosos-historico">Ver reporte histórico</Link>
      </div>

      <form className="simple-form" onSubmit={(event) => event.preventDefault()}>
        <label>
          Número de cuenta
          <input value={numeroCuentaFilter} onChange={(event) => setNumeroCuentaFilter(event.target.value)} />
        </label>

        <label>
          Grupo
          <select value={grupoFilter} onChange={(event) => setGrupoFilter(event.target.value)}>
            <option value="">Todos</option>
            {gruposDisponibles.map((grupoNombre) => (
              <option key={grupoNombre} value={grupoNombre}>
                {grupoNombre}
              </option>
            ))}
          </select>
        </label>

        <label>
          Apto para seguimiento
          <select value={aptoFilter} onChange={(event) => setAptoFilter(event.target.value as 'all' | 'true' | 'false')}>
            <option value="all">Todos</option>
            <option value="true">Sí</option>
            <option value="false">No</option>
          </select>
        </label>
      </form>

      {detalleQuery.isLoading && <p>Cargando detalle de carga...</p>}
      {detalleQuery.isError && (
        <p className="feedback error">No se pudo cargar el detalle de esta carga. {getErrorMessage(detalleQuery.error)}</p>
      )}
      {inmueblesQuery.isLoading && <p>Cargando información de inmuebles...</p>}
      {inmueblesQuery.isError && (
        <p className="feedback error">No se pudo completar propietario/grupo para todos los registros.</p>
      )}

      {!detalleQuery.isLoading && !detalleQuery.isError && rows.length === 0 && (
        <p>La carga no tiene registros históricos para mostrar.</p>
      )}

      {!detalleQuery.isLoading && !detalleQuery.isError && rows.length > 0 && filteredRows.length === 0 && (
        <p>No hay registros que coincidan con los filtros aplicados.</p>
      )}

      {filteredRows.length > 0 && (
        <div className="table-container">
          <table className="simple-table">
            <thead>
              <tr>
                <th>Número de cuenta</th>
                <th>Identificación inmueble</th>
                <th>Grupo</th>
                <th>Cuotas adeudadas</th>
                <th>Monto adeudado</th>
                <th>Apto para seguimiento</th>
              </tr>
            </thead>
            <tbody>
              {filteredRows.map((item) => (
                <tr key={`${item.inmuebleId}-${item.numeroCuenta}`}>
                  <td>{item.numeroCuenta}</td>
                  <td>{item.identificacionVisible}</td>
                  <td>{item.grupoNombre || '-'}</td>
                  <td>{item.cuotasAdeudadas}</td>
                  <td>{item.montoAdeudado}</td>
                  <td>{item.aptoParaSeguimiento ? 'Sí' : 'No'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
