import { FormEvent, useEffect, useMemo, useState } from 'react';
import { useAvanzarEtapaCasos, useCasosSeguimiento, useRepetirEtapaCasos } from '../../modules/casosSeguimiento/hooks';
import type { EtapaSeguimiento } from '../../modules/casosSeguimiento/types';
import { useInmuebles } from '../../modules/inmuebles/hooks';
import { useMorosos } from '../../modules/morosos/hooks';

function getErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : 'Ocurrió un error inesperado.';
}

type BandejaFilters = {
  etapa: EtapaSeguimiento;
  cuentaInmueble: string;
  propietario: string;
  grupo: string;
};

const defaultFilters: BandejaFilters = {
  etapa: 'AVISO_DEUDA',
  cuentaInmueble: '',
  propietario: '',
  grupo: ''
};

export function BandejasEtapaPage() {
  const casosQuery = useCasosSeguimiento();
  const inmueblesQuery = useInmuebles({});
  const morososQuery = useMorosos({});

  const avanzarMutation = useAvanzarEtapaCasos();
  const repetirMutation = useRepetirEtapaCasos();

  const [filters, setFilters] = useState<BandejaFilters>(defaultFilters);
  const [appliedFilters, setAppliedFilters] = useState<BandejaFilters>(defaultFilters);
  const [selectedCasoIds, setSelectedCasoIds] = useState<string[]>([]);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [feedbackError, setFeedbackError] = useState<string | null>(null);

  const rows = useMemo(() => {
    const inmueblesById = new Map((inmueblesQuery.data ?? []).map((inmueble) => [inmueble.id, inmueble]));
    const morososByInmuebleId = new Map((morososQuery.data ?? []).map((moroso) => [moroso.inmuebleId, moroso]));

    return (casosQuery.data ?? [])
      .filter((caso) => caso.estadoSeguimiento !== 'CERRADO')
      .map((caso) => {
        const inmueble = inmueblesById.get(caso.inmuebleId);
        const moroso = morososByInmuebleId.get(caso.inmuebleId);

        return {
          casoId: caso.id,
          inmuebleId: caso.inmuebleId,
          numeroCuenta: caso.numeroCuenta,
          propietarioNombre: inmueble?.propietarioNombre ?? moroso?.propietarioNombre ?? '-',
          direccionCompleta: inmueble?.direccionCompleta ?? moroso?.direccionCompleta ?? '-',
          grupoNombre: inmueble?.grupoNombre ?? moroso?.grupo ?? '-',
          etapaActual: caso.etapaActual,
          seguimientoHabilitado:
            moroso?.seguimientoHabilitado ?? (inmueble ? (inmueble.seguimientoHabilitado ? 'Sí' : 'No') : '-'),
          aptoParaSeguimiento: moroso ? (moroso.aptoParaSeguimiento ? 'Sí' : 'No') : '-'
        };
      });
  }, [casosQuery.data, inmueblesQuery.data, morososQuery.data]);

  const filteredRows = useMemo(() => {
    return rows
      .filter((row) => row.etapaActual === appliedFilters.etapa)
      .filter((row) => {
        if (!appliedFilters.cuentaInmueble.trim()) {
          return true;
        }

        const search = appliedFilters.cuentaInmueble.trim().toLowerCase();
        return row.numeroCuenta.toLowerCase().includes(search) || row.inmuebleId.toLowerCase().includes(search);
      })
      .filter((row) =>
        appliedFilters.propietario.trim()
          ? row.propietarioNombre.toLowerCase().includes(appliedFilters.propietario.trim().toLowerCase())
          : true
      )
      .filter((row) =>
        appliedFilters.grupo.trim() ? row.grupoNombre.toLowerCase() === appliedFilters.grupo.trim().toLowerCase() : true
      );
  }, [rows, appliedFilters]);

  const grupoOptions = useMemo(() => {
    const options = new Set(
      rows
        .map((row) => row.grupoNombre)
        .filter((grupo) => grupo && grupo !== '-')
    );

    return [...options].sort((a, b) => a.localeCompare(b));
  }, [rows]);

  const visibleCasoIds = filteredRows.map((row) => row.casoId);
  const allVisibleSelected =
    visibleCasoIds.length > 0 && visibleCasoIds.every((casoId) => selectedCasoIds.includes(casoId));

  useEffect(() => {
    setSelectedCasoIds((prev) => prev.filter((casoId) => visibleCasoIds.includes(casoId)));
  }, [visibleCasoIds]);

  const handleApplyFilters = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setAppliedFilters({ ...filters });
    setSelectedCasoIds([]);
    setFeedback(null);
    setFeedbackError(null);
  };

  const handleResetFilters = () => {
    setFilters(defaultFilters);
    setAppliedFilters(defaultFilters);
    setSelectedCasoIds([]);
    setFeedback(null);
    setFeedbackError(null);
  };

  const toggleSelectCaso = (casoId: string) => {
    setSelectedCasoIds((prev) =>
      prev.includes(casoId) ? prev.filter((selectedId) => selectedId !== casoId) : [...prev, casoId]
    );
  };

  const toggleSelectAllVisible = () => {
    if (allVisibleSelected) {
      setSelectedCasoIds((prev) => prev.filter((casoId) => !visibleCasoIds.includes(casoId)));
      return;
    }

    setSelectedCasoIds((prev) => Array.from(new Set([...prev, ...visibleCasoIds])));
  };

  const handleSelectAll = () => {
    setSelectedCasoIds((prev) => Array.from(new Set([...prev, ...visibleCasoIds])));
  };

  const executeMassAction = async (action: 'avanzar' | 'repetir') => {
    setFeedback(null);
    setFeedbackError(null);

    if (selectedCasoIds.length === 0) {
      setFeedbackError('Seleccioná al menos un inmueble/caso para operar.');
      return;
    }

    try {
      const result =
        action === 'avanzar'
          ? await avanzarMutation.mutateAsync({ casoIds: selectedCasoIds })
          : await repetirMutation.mutateAsync({ casoIds: selectedCasoIds });

      setFeedback(
        `${action === 'avanzar' ? 'Avance' : 'Repetición'} completada. Exitosos: ${result.exitosos}, errores: ${result.errores}.`
      );
      setSelectedCasoIds([]);
    } catch (error) {
      setFeedbackError(getErrorMessage(error));
    }
  };

  return (
    <section>
      <div className="page-header">
        <h2>Bandeja por etapa</h2>
        <p>Vista operativa para filtrar por etapa, seleccionar inmuebles y ejecutar acciones masivas.</p>
      </div>

      <form className="simple-form form-grid-two card-block bandeja-filters" onSubmit={handleApplyFilters}>
        <label>
          Etapa
          <select
            value={filters.etapa}
            onChange={(event) => setFilters((prev) => ({ ...prev, etapa: event.target.value as EtapaSeguimiento }))}
          >
            <option value="AVISO_DEUDA">Aviso de deuda</option>
            <option value="INTIMACION">Intimación</option>
            <option value="AVISO_CORTE">Aviso de corte</option>
            <option value="CORTE">Corte</option>
          </select>
        </label>

        <label>
          Número de cuenta o inmueble
          <input
            value={filters.cuentaInmueble}
            onChange={(event) => setFilters((prev) => ({ ...prev, cuentaInmueble: event.target.value }))}
          />
        </label>

        <label>
          Propietario
          <input
            value={filters.propietario}
            onChange={(event) => setFilters((prev) => ({ ...prev, propietario: event.target.value }))}
          />
        </label>

        <label>
          Grupo
          <select value={filters.grupo} onChange={(event) => setFilters((prev) => ({ ...prev, grupo: event.target.value }))}>
            <option value="">Todos</option>
            {grupoOptions.map((grupo) => (
              <option key={grupo} value={grupo}>
                {grupo}
              </option>
            ))}
          </select>
        </label>

        <div className="actions align-right">
          <button type="submit">Buscar</button>
          <button type="button" className="secondary" onClick={handleResetFilters}>
            Limpiar
          </button>
        </div>
      </form>

      <div className="toolbar card-toolbar bandeja-actions">
        <strong>Seleccionados: {selectedCasoIds.length}</strong>
        <button type="button" className="secondary" onClick={handleSelectAll}>
          Seleccionar todos
        </button>
        <button
          type="button"
          onClick={() => executeMassAction('avanzar')}
          disabled={avanzarMutation.isPending || repetirMutation.isPending}
        >
          Pasar a siguiente etapa
        </button>
        <button
          type="button"
          className="secondary"
          onClick={() => executeMassAction('repetir')}
          disabled={avanzarMutation.isPending || repetirMutation.isPending}
        >
          Repetir etapa
        </button>
        <button type="button" className="secondary" onClick={() => setSelectedCasoIds([])}>
          Deseleccionar todo
        </button>
      </div>

      {feedback && <p className="feedback success">{feedback}</p>}
      {feedbackError && <p className="feedback error">{feedbackError}</p>}

      {casosQuery.isLoading && <p>Cargando casos...</p>}
      {inmueblesQuery.isLoading && <p>Completando datos de inmuebles...</p>}
      {morososQuery.isLoading && <p>Completando datos de seguimiento...</p>}

      {casosQuery.isError && <p className="feedback error">{getErrorMessage(casosQuery.error)}</p>}
      {inmueblesQuery.isError && <p className="feedback error">No se pudieron completar datos de inmuebles.</p>}
      {morososQuery.isError && <p className="feedback error">No se pudieron completar datos de aptitud de seguimiento.</p>}

      {filteredRows.length > 0 && (
        <div className="table-container">
          <table className="simple-table">
            <thead>
              <tr>
                <th>
                  <input type="checkbox" checked={allVisibleSelected} onChange={toggleSelectAllVisible} />
                </th>
                <th>Número de cuenta</th>
                <th>Propietario</th>
                <th>Dirección</th>
                <th>Grupo</th>
                <th>Etapa actual</th>
                <th>Seguimiento habilitado</th>
                <th>Apto para seguimiento</th>
              </tr>
            </thead>
            <tbody>
              {filteredRows.map((row) => (
                <tr key={row.casoId}>
                  <td>
                    <input
                      type="checkbox"
                      checked={selectedCasoIds.includes(row.casoId)}
                      onChange={() => toggleSelectCaso(row.casoId)}
                    />
                  </td>
                  <td>{row.numeroCuenta}</td>
                  <td>{row.propietarioNombre}</td>
                  <td>{row.direccionCompleta}</td>
                  <td>{row.grupoNombre}</td>
                  <td>{row.etapaActual}</td>
                  <td>{row.seguimientoHabilitado}</td>
                  <td>{row.aptoParaSeguimiento}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {!casosQuery.isLoading && filteredRows.length === 0 && (
        <p>No hay inmuebles/casos para la etapa y filtros aplicados.</p>
      )}
    </section>
  );
}
