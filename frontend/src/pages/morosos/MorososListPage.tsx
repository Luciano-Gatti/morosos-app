import { FormEvent, useMemo, useState } from 'react';
import { useMorosos } from '../../modules/morosos/hooks';
import type { Moroso, MorososFilters, MorososSortableFields } from '../../modules/morosos/types';

function getErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : 'Ocurrió un error inesperado.';
}

function formatFecha(fecha: string) {
  return new Date(fecha).toLocaleString();
}

const emptyFilters: MorososFilters = {
  numeroCuenta: '',
  propietarioNombre: '',
  direccionCompleta: '',
  distrito: '',
  grupo: '',
  cuotasAdeudadas: undefined,
  montoAdeudado: undefined,
  seguimientoHabilitado: undefined,
  aptoParaSeguimiento: undefined
};

export function MorososListPage() {
  const [filters, setFilters] = useState<MorososFilters>(emptyFilters);
  const [appliedFilters, setAppliedFilters] = useState<MorososFilters>(emptyFilters);
  const morososQuery = useMorosos(appliedFilters);

  const [sortBy, setSortBy] = useState<MorososSortableFields>('cuotasAdeudadas');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');

  const sortedMorosos = useMemo(() => {
    const rows = [...(morososQuery.data ?? [])];

    rows.sort((a, b) => {
      const direction = sortDirection === 'asc' ? 1 : -1;

      if (sortBy === 'cuotasAdeudadas') {
        return (a.cuotasAdeudadas - b.cuotasAdeudadas) * direction;
      }

      if (sortBy === 'montoAdeudado') {
        return (Number(a.montoAdeudado) - Number(b.montoAdeudado)) * direction;
      }

      return a[sortBy].localeCompare(b[sortBy]) * direction;
    });

    return rows;
  }, [morososQuery.data, sortBy, sortDirection]);

  const handleApplyFilters = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setAppliedFilters({ ...filters });
  };

  const handleResetFilters = () => {
    setFilters(emptyFilters);
    setAppliedFilters(emptyFilters);
  };

  return (
    <section>
      <div className="page-header">
        <h2>Lista general de morosos</h2>
        <p>Vista de consulta general para filtrar, ordenar y analizar morosos.</p>
      </div>

      <form className="simple-form form-grid-two card-block" onSubmit={handleApplyFilters}>
        <label>
          Número de cuenta
          <input
            value={filters.numeroCuenta ?? ''}
            onChange={(event) => setFilters((prev) => ({ ...prev, numeroCuenta: event.target.value }))}
          />
        </label>
        <label>
          Propietario
          <input
            value={filters.propietarioNombre ?? ''}
            onChange={(event) => setFilters((prev) => ({ ...prev, propietarioNombre: event.target.value }))}
          />
        </label>
        <label>
          Dirección
          <input
            value={filters.direccionCompleta ?? ''}
            onChange={(event) => setFilters((prev) => ({ ...prev, direccionCompleta: event.target.value }))}
          />
        </label>
        <label>
          Distrito
          <input
            value={filters.distrito ?? ''}
            onChange={(event) => setFilters((prev) => ({ ...prev, distrito: event.target.value }))}
          />
        </label>
        <label>
          Grupo
          <input
            value={filters.grupo ?? ''}
            onChange={(event) => setFilters((prev) => ({ ...prev, grupo: event.target.value }))}
          />
        </label>
        <label>
          Cuotas adeudadas
          <input
            type="number"
            min={0}
            step={1}
            value={filters.cuotasAdeudadas ?? ''}
            onChange={(event) =>
              setFilters((prev) => ({
                ...prev,
                cuotasAdeudadas: event.target.value ? Number(event.target.value) : undefined
              }))
            }
          />
        </label>
        <label>
          Monto adeudado
          <input
            type="number"
            min={0}
            step="0.01"
            value={filters.montoAdeudado ?? ''}
            onChange={(event) =>
              setFilters((prev) => ({
                ...prev,
                montoAdeudado: event.target.value ? Number(event.target.value) : undefined
              }))
            }
          />
        </label>
        <label>
          Seguimiento habilitado
          <select
            value={
              filters.seguimientoHabilitado === undefined ? '' : filters.seguimientoHabilitado ? 'true' : 'false'
            }
            onChange={(event) =>
              setFilters((prev) => ({
                ...prev,
                seguimientoHabilitado: event.target.value === '' ? undefined : event.target.value === 'true'
              }))
            }
          >
            <option value="">Todos</option>
            <option value="true">Sí</option>
            <option value="false">No</option>
          </select>
        </label>
        <label>
          Apto para seguimiento
          <select
            value={filters.aptoParaSeguimiento === undefined ? '' : filters.aptoParaSeguimiento ? 'true' : 'false'}
            onChange={(event) =>
              setFilters((prev) => ({
                ...prev,
                aptoParaSeguimiento: event.target.value === '' ? undefined : event.target.value === 'true'
              }))
            }
          >
            <option value="">Todos</option>
            <option value="true">Sí</option>
            <option value="false">No</option>
          </select>
        </label>

        <div className="actions align-right">
          <button type="submit">Aplicar filtros</button>
          <button type="button" className="secondary" onClick={handleResetFilters}>
            Limpiar
          </button>
        </div>
      </form>

      <div className="toolbar card-toolbar">
        <label>
          Ordenar por
          <select value={sortBy} onChange={(event) => setSortBy(event.target.value as MorososSortableFields)}>
            <option value="cuotasAdeudadas">Cuotas adeudadas</option>
            <option value="montoAdeudado">Monto adeudado</option>
            <option value="propietarioNombre">Propietario</option>
            <option value="numeroCuenta">Número de cuenta</option>
            <option value="direccionCompleta">Dirección</option>
            <option value="grupo">Grupo</option>
          </select>
        </label>

        <label>
          Dirección
          <select value={sortDirection} onChange={(event) => setSortDirection(event.target.value as 'asc' | 'desc')}>
            <option value="asc">Ascendente</option>
            <option value="desc">Descendente</option>
          </select>
        </label>

        <strong>Total resultados: {sortedMorosos.length}</strong>
      </div>

      {morososQuery.isLoading && <p>Cargando morosos...</p>}
      {morososQuery.isError && <p className="feedback error">{getErrorMessage(morososQuery.error)}</p>}

      {sortedMorosos.length > 0 && (
        <div className="table-container">
          <table className="simple-table">
            <thead>
              <tr>
                <th>Número cuenta</th>
                <th>Propietario</th>
                <th>Dirección</th>
                <th>Distrito</th>
                <th>Grupo</th>
                <th>Cuotas</th>
                <th>Monto</th>
                <th>Seg. habilitado</th>
                <th>Apto</th>
                <th>Estado actualizado</th>
              </tr>
            </thead>
            <tbody>
              {sortedMorosos.map((moroso: Moroso) => (
                <tr key={moroso.inmuebleId}>
                  <td>{moroso.numeroCuenta}</td>
                  <td>{moroso.propietarioNombre}</td>
                  <td>{moroso.direccionCompleta}</td>
                  <td>{moroso.distrito}</td>
                  <td>{moroso.grupo}</td>
                  <td>{moroso.cuotasAdeudadas}</td>
                  <td>{moroso.montoAdeudado}</td>
                  <td>{moroso.seguimientoHabilitado ? 'Sí' : 'No'}</td>
                  <td>{moroso.aptoParaSeguimiento ? 'Sí' : 'No'}</td>
                  <td>{formatFecha(moroso.fechaActualizacion)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {sortedMorosos.length === 0 && !morososQuery.isLoading && <p>No hay morosos para los filtros actuales.</p>}
    </section>
  );
}
