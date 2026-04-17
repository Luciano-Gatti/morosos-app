import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  useAvanzarEtapaCasos,
  useCasosSeguimiento,
  useRepetirEtapaCasos
} from '../../modules/casosSeguimiento/hooks';
import type { CasoSeguimiento, EtapaSeguimiento } from '../../modules/casosSeguimiento/types';

function getErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : 'Ocurrió un error inesperado.';
}

type FiltroEstado = 'TODOS' | 'ACTIVO' | 'PAUSADO';

type BandejaSectionProps = {
  titulo: string;
  etapa: EtapaSeguimiento;
  casos: CasoSeguimiento[];
};

function BandejaSection({ titulo, etapa, casos }: BandejaSectionProps) {
  const navigate = useNavigate();
  const avanzarMutation = useAvanzarEtapaCasos();
  const repetirMutation = useRepetirEtapaCasos();

  const [filtroNumeroCuenta, setFiltroNumeroCuenta] = useState('');
  const [filtroEstado, setFiltroEstado] = useState<FiltroEstado>('TODOS');
  const [seleccionados, setSeleccionados] = useState<string[]>([]);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [feedbackError, setFeedbackError] = useState<string | null>(null);

  const casosVisibles = useMemo(() => {
    return casos
      .filter((caso) => caso.etapaActual === etapa)
      .filter((caso) => caso.estadoSeguimiento !== 'CERRADO')
      .filter((caso) =>
        filtroNumeroCuenta.trim()
          ? caso.numeroCuenta.toLowerCase().includes(filtroNumeroCuenta.trim().toLowerCase())
          : true
      )
      .filter((caso) => {
        if (filtroEstado === 'TODOS') {
          return true;
        }
        return caso.estadoSeguimiento === filtroEstado;
      });
  }, [casos, etapa, filtroNumeroCuenta, filtroEstado]);

  const visibleIds = casosVisibles.map((caso) => caso.id);
  const allVisibleSelected = visibleIds.length > 0 && visibleIds.every((id) => seleccionados.includes(id));

  useEffect(() => {
    setSeleccionados((prev) => prev.filter((id) => visibleIds.includes(id)));
  }, [casosVisibles]);

  const toggleSeleccion = (id: string) => {
    setSeleccionados((prev) => (prev.includes(id) ? prev.filter((value) => value !== id) : [...prev, id]));
  };

  const toggleSeleccionTodosVisibles = () => {
    if (allVisibleSelected) {
      setSeleccionados((prev) => prev.filter((id) => !visibleIds.includes(id)));
      return;
    }

    setSeleccionados((prev) => Array.from(new Set([...prev, ...visibleIds])));
  };

  const ejecutarOperacion = async (tipo: 'avanzar' | 'repetir') => {
    setFeedback(null);
    setFeedbackError(null);

    if (seleccionados.length === 0) {
      setFeedbackError('Seleccioná al menos un caso.');
      return;
    }

    try {
      const result =
        tipo === 'avanzar'
          ? await avanzarMutation.mutateAsync({ casoIds: seleccionados })
          : await repetirMutation.mutateAsync({ casoIds: seleccionados });

      setFeedback(
        `${tipo === 'avanzar' ? 'Avance' : 'Repetición'} completada. Exitosos: ${result.exitosos}, errores: ${result.errores}.`
      );
      setSeleccionados([]);
    } catch (error) {
      setFeedbackError(getErrorMessage(error));
    }
  };

  return (
    <article className="bandeja-section">
      <h3>{titulo}</h3>

      <div className="toolbar">
        <label>
          Número de cuenta
          <input value={filtroNumeroCuenta} onChange={(event) => setFiltroNumeroCuenta(event.target.value)} />
        </label>
        <label>
          Estado
          <select value={filtroEstado} onChange={(event) => setFiltroEstado(event.target.value as FiltroEstado)}>
            <option value="TODOS">Todos (activos y pausados)</option>
            <option value="ACTIVO">Solo activos</option>
            <option value="PAUSADO">Solo pausados</option>
          </select>
        </label>
        <button type="button" className="secondary" onClick={toggleSeleccionTodosVisibles}>
          {allVisibleSelected ? 'Deseleccionar visibles' : 'Seleccionar visibles'}
        </button>
      </div>

      <div className="toolbar">
        <button
          type="button"
          onClick={() => ejecutarOperacion('avanzar')}
          disabled={avanzarMutation.isPending || repetirMutation.isPending}
        >
          Pasar a siguiente etapa
        </button>
        <button
          type="button"
          className="secondary"
          onClick={() => ejecutarOperacion('repetir')}
          disabled={avanzarMutation.isPending || repetirMutation.isPending}
        >
          Repetir etapa actual
        </button>
      </div>

      {feedback && <p className="feedback success">{feedback}</p>}
      {feedbackError && <p className="feedback error">{feedbackError}</p>}

      {casosVisibles.length > 0 && (
        <div className="table-container">
          <table className="simple-table">
            <thead>
              <tr>
                <th>
                  <input type="checkbox" checked={allVisibleSelected} onChange={toggleSeleccionTodosVisibles} />
                </th>
                <th>Número cuenta</th>
                <th>Estado</th>
                <th>Inicio</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {casosVisibles.map((caso) => (
                <tr key={caso.id} className={caso.estadoSeguimiento === 'PAUSADO' ? 'row-paused' : undefined}>
                  <td>
                    <input
                      type="checkbox"
                      checked={seleccionados.includes(caso.id)}
                      onChange={() => toggleSeleccion(caso.id)}
                    />
                  </td>
                  <td>{caso.numeroCuenta}</td>
                  <td>
                    {caso.estadoSeguimiento}
                    {caso.estadoSeguimiento === 'PAUSADO' ? ' (pausado)' : ''}
                  </td>
                  <td>{new Date(caso.fechaInicio).toLocaleDateString()}</td>
                  <td>
                    <button type="button" className="secondary" onClick={() => navigate(`/casos/${caso.id}`)}>
                      Abrir detalle
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {casosVisibles.length === 0 && <p>No hay casos visibles en esta bandeja.</p>}
    </article>
  );
}

export function BandejasEtapaPage() {
  const casosQuery = useCasosSeguimiento();

  return (
    <section>
      <h2>Bandejas por etapa</h2>
      <p>Casos cerrados no aparecen en bandejas activas. Los pausados se pueden diferenciar y filtrar.</p>

      {casosQuery.isLoading && <p>Cargando casos...</p>}
      {casosQuery.isError && <p className="feedback error">{getErrorMessage(casosQuery.error)}</p>}

      {casosQuery.data && (
        <div className="bandejas-grid">
          <BandejaSection titulo="Aviso de deuda" etapa="AVISO_DEUDA" casos={casosQuery.data} />
          <BandejaSection titulo="Intimación" etapa="INTIMACION" casos={casosQuery.data} />
          <BandejaSection titulo="Aviso de corte" etapa="AVISO_CORTE" casos={casosQuery.data} />
          <BandejaSection titulo="Corte" etapa="CORTE" casos={casosQuery.data} />
        </div>
      )}
    </section>
  );
}
