import { FormEvent, useMemo, useState } from 'react';
import { useCrearCasosMasivo } from '../../modules/seguimientoMasivo/hooks';
import type { EtapaInicial } from '../../modules/seguimientoMasivo/types';
import { useMorosos } from '../../modules/morosos/hooks';
import type { Moroso, MorososFilters, MorososSortableFields } from '../../modules/morosos/types';

function getErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : 'Ocurrió un error inesperado.';
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

const etapaOptions: EtapaInicial[] = ['AVISO_DEUDA', 'INTIMACION', 'AVISO_CORTE', 'CORTE'];

export function MorososListPage() {
  const [filters, setFilters] = useState<MorososFilters>(emptyFilters);
  const [appliedFilters, setAppliedFilters] = useState<MorososFilters>(emptyFilters);
  const morososQuery = useMorosos(appliedFilters);

  const [sortBy, setSortBy] = useState<MorososSortableFields>('cuotasAdeudadas');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');

  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [etapaInicial, setEtapaInicial] = useState<EtapaInicial>('AVISO_DEUDA');
  const createCasosMutation = useCrearCasosMasivo();

  const [feedback, setFeedback] = useState<string | null>(null);
  const [feedbackError, setFeedbackError] = useState<string | null>(null);

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

  const visibleIds = sortedMorosos.map((moroso) => moroso.inmuebleId);
  const allVisibleSelected = visibleIds.length > 0 && visibleIds.every((id) => selectedIds.includes(id));

  const handleApplyFilters = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setAppliedFilters({ ...filters });
    setSelectedIds([]);
  };

  const handleResetFilters = () => {
    setFilters(emptyFilters);
    setAppliedFilters(emptyFilters);
    setSelectedIds([]);
  };

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => (prev.includes(id) ? prev.filter((value) => value !== id) : [...prev, id]));
  };

  const toggleSelectAllVisible = () => {
    if (allVisibleSelected) {
      setSelectedIds((prev) => prev.filter((id) => !visibleIds.includes(id)));
      return;
    }

    setSelectedIds((prev) => Array.from(new Set([...prev, ...visibleIds])));
  };

  const handleCreateCases = async () => {
    setFeedback(null);
    setFeedbackError(null);

    if (selectedIds.length === 0) {
      setFeedbackError('Seleccioná al menos un inmueble moroso.');
      return;
    }

    try {
      const result = await createCasosMutation.mutateAsync({
        inmuebleIds: selectedIds,
        etapaInicial
      });

      setFeedback(
        `Casos creados. Solicitados: ${result.totalSolicitados}, exitosos: ${result.exitosos}, errores: ${result.errores}.`
      );
      setSelectedIds([]);
    } catch (error) {
      setFeedbackError(getErrorMessage(error));
    }
  };

  return (
    <section>
      <h2>Lista general de morosos</h2>
      <p>Filtrá, ordená, seleccioná y creá casos en lote desde una vista única.</p>

      <form className="simple-form" onSubmit={handleApplyFilters}>
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
                seguimientoHabilitado:
                  event.target.value === '' ? undefined : event.target.value === 'true'
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

        <div className="actions">
          <button type="submit">Aplicar filtros</button>
          <button type="button" className="secondary" onClick={handleResetFilters}>
            Limpiar
          </button>
        </div>
      </form>

      <div className="toolbar">
        <label>
          Ordenar por
          <select value={sortBy} onChange={(event) => setSortBy(event.target.value as MorososSortableFields)}>
            <option value="cuotasAdeudadas">cuotasAdeudadas</option>
            <option value="montoAdeudado">montoAdeudado</option>
            <option value="propietarioNombre">propietarioNombre</option>
            <option value="numeroCuenta">numeroCuenta</option>
            <option value="direccionCompleta">direccionCompleta</option>
            <option value="grupo">grupo</option>
          </select>
        </label>

        <label>
          Dirección
          <select value={sortDirection} onChange={(event) => setSortDirection(event.target.value as 'asc' | 'desc')}>
            <option value="asc">Ascendente</option>
            <option value="desc">Descendente</option>
          </select>
        </label>

        <button type="button" className="secondary" onClick={toggleSelectAllVisible}>
          {allVisibleSelected ? 'Deseleccionar visibles' : 'Seleccionar visibles'}
        </button>
      </div>

      <div className="toolbar">
        <label>
          Etapa inicial
          <select value={etapaInicial} onChange={(event) => setEtapaInicial(event.target.value as EtapaInicial)}>
            {etapaOptions.map((etapa) => (
              <option key={etapa} value={etapa}>
                {etapa}
              </option>
            ))}
          </select>
        </label>

        <button type="button" onClick={handleCreateCases} disabled={createCasosMutation.isPending}>
          Crear casos para seleccionados ({selectedIds.length})
        </button>
      </div>

      {feedback && <p className="feedback success">{feedback}</p>}
      {feedbackError && <p className="feedback error">{feedbackError}</p>}

      {morososQuery.isLoading && <p>Cargando morosos...</p>}
      {morososQuery.isError && <p className="feedback error">{getErrorMessage(morososQuery.error)}</p>}

      {sortedMorosos.length > 0 && (
        <table className="simple-table">
          <thead>
            <tr>
              <th>
                <input type="checkbox" checked={allVisibleSelected} onChange={toggleSelectAllVisible} />
              </th>
              <th>Número cuenta</th>
              <th>Propietario</th>
              <th>Dirección</th>
              <th>Distrito</th>
              <th>Grupo</th>
              <th>Cuotas</th>
              <th>Monto</th>
              <th>Seg. habilitado</th>
              <th>Apto</th>
            </tr>
          </thead>
          <tbody>
            {sortedMorosos.map((moroso: Moroso) => (
              <tr key={moroso.inmuebleId}>
                <td>
                  <input
                    type="checkbox"
                    checked={selectedIds.includes(moroso.inmuebleId)}
                    onChange={() => toggleSelect(moroso.inmuebleId)}
                  />
                </td>
                <td>{moroso.numeroCuenta}</td>
                <td>{moroso.propietarioNombre}</td>
                <td>{moroso.direccionCompleta}</td>
                <td>{moroso.distrito}</td>
                <td>{moroso.grupo}</td>
                <td>{moroso.cuotasAdeudadas}</td>
                <td>{moroso.montoAdeudado}</td>
                <td>{moroso.seguimientoHabilitado ? 'Sí' : 'No'}</td>
                <td>{moroso.aptoParaSeguimiento ? 'Sí' : 'No'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {sortedMorosos.length === 0 && !morososQuery.isLoading && <p>No hay morosos para los filtros actuales.</p>}
    </section>
  );
}
