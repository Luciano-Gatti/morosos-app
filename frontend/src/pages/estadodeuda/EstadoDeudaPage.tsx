import { FormEvent, useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  useCreateEstadoDeuda,
  useEstadoDeudaByInmueble,
  useUpdateEstadoDeuda
} from '../../modules/estadoDeuda/hooks';
import { useInmuebles } from '../../modules/inmuebles/hooks';

function getErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : 'Ocurrió un error inesperado.';
}

export function EstadoDeudaPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const inmueblesQuery = useInmuebles({});
  const [inmuebleId, setInmuebleId] = useState('');
  const [inmuebleSearch, setInmuebleSearch] = useState('');

  const estadoDeudaQuery = useEstadoDeudaByInmueble(inmuebleId);
  const createMutation = useCreateEstadoDeuda();
  const updateMutation = useUpdateEstadoDeuda();

  const [cuotasAdeudadas, setCuotasAdeudadas] = useState('0');
  const [montoAdeudado, setMontoAdeudado] = useState('0');
  const [feedback, setFeedback] = useState<string | null>(null);
  const [feedbackError, setFeedbackError] = useState<string | null>(null);

  const estadoDeuda = estadoDeudaQuery.data;
  const subnavItems = [
    { tab: 'importar', label: 'Importar carga' },
    { tab: 'historico', label: 'Histórico de cargas' },
    { tab: 'reportes', label: 'Reportes' }
  ];

  const activeTab = new URLSearchParams(location.search).get('tab') ?? 'importar';

  const inmuebleOptions = useMemo(
    () =>
      (inmueblesQuery.data ?? []).map((inmueble) => ({
        id: inmueble.id,
        label: `${inmueble.numeroCuenta} - ${inmueble.propietarioNombre}`
      })),
    [inmueblesQuery.data]
  );

  useEffect(() => {
    const selected = inmuebleOptions.find((option) => option.id === inmuebleId);
    setInmuebleSearch(selected?.label ?? '');
  }, [inmuebleId, inmuebleOptions]);

  useEffect(() => {
    if (!estadoDeuda) {
      setCuotasAdeudadas('0');
      setMontoAdeudado('0');
      return;
    }

    setCuotasAdeudadas(String(estadoDeuda.cuotasAdeudadas));
    setMontoAdeudado(String(estadoDeuda.montoAdeudado));
  }, [estadoDeuda]);

  const fechaActualizacion = useMemo(() => {
    if (!estadoDeuda?.fechaActualizacion) {
      return 'Sin registro todavía';
    }

    return new Date(estadoDeuda.fechaActualizacion).toLocaleString();
  }, [estadoDeuda]);

  const handleSelectInmueble = (nextInmuebleId: string) => {
    setInmuebleId(nextInmuebleId);
    setFeedback(null);
    setFeedbackError(null);
  };

  const handleInmuebleSearchChange = (value: string) => {
    setInmuebleSearch(value);

    const selectedOption = inmuebleOptions.find((option) => option.label === value);
    handleSelectInmueble(selectedOption?.id ?? '');
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setFeedback(null);
    setFeedbackError(null);

    if (!inmuebleId) {
      setFeedbackError('Seleccioná un inmueble.');
      return;
    }

    const cuotas = Number(cuotasAdeudadas);
    const monto = Number(montoAdeudado);

    if (!Number.isInteger(cuotas) || cuotas < 0) {
      setFeedbackError('Las cuotas adeudadas deben ser un entero mayor o igual a 0.');
      return;
    }

    if (Number.isNaN(monto) || monto < 0) {
      setFeedbackError('El monto adeudado debe ser mayor o igual a 0.');
      return;
    }

    const payload = {
      inmuebleId,
      cuotasAdeudadas: cuotas,
      montoAdeudado: monto
    };

    try {
      if (estadoDeuda?.id) {
        await updateMutation.mutateAsync({ id: estadoDeuda.id, payload });
        setFeedback('Estado de deuda actualizado correctamente.');
      } else {
        await createMutation.mutateAsync(payload);
        setFeedback('Estado de deuda cargado correctamente.');
      }
    } catch (error) {
      setFeedbackError(getErrorMessage(error));
    }
  };

  return (
    <section>
      <div className="page-header">
        <h2>Estado de deuda</h2>
        <p>Carga y edición de cuotas adeudadas y monto adeudado por inmueble.</p>
      </div>
      <div className="toolbar card-toolbar estado-deuda-subnav">
        {subnavItems.map((item) => (
          <button
            key={item.tab}
            type="button"
            className={`tab-button ${activeTab === item.tab ? 'active' : ''}`}
            onClick={() => navigate(`/estados-deuda/cargas?tab=${item.tab}`)}
          >
            {item.label}
          </button>
        ))}
      </div>

      <form className="simple-form form-grid-two card-block estado-deuda-form" onSubmit={handleSubmit}>
        <label>
          Inmueble
          <input
            type="text"
            list="estado-deuda-inmuebles"
            value={inmuebleSearch}
            placeholder="Buscar por cuenta o propietario"
            onChange={(event) => handleInmuebleSearchChange(event.target.value)}
          />
          <datalist id="estado-deuda-inmuebles">
            {inmuebleOptions.map((option) => (
              <option key={option.id} value={option.label} />
            ))}
          </datalist>
        </label>

        <label>
          Cuotas adeudadas
          <input
            type="number"
            min={0}
            step={1}
            value={cuotasAdeudadas}
            onChange={(event) => setCuotasAdeudadas(event.target.value)}
          />
        </label>

        <label>
          Monto adeudado
          <input
            type="number"
            min={0}
            step="0.01"
            value={montoAdeudado}
            onChange={(event) => setMontoAdeudado(event.target.value)}
          />
        </label>

        <p className="full-width">
          <strong>Última actualización:</strong> {fechaActualizacion}
        </p>

        <div className="actions align-right estado-deuda-submit">
          <button type="submit" disabled={createMutation.isPending || updateMutation.isPending}>
            {estadoDeuda ? 'Guardar cambios' : 'Cargar estado de deuda'}
          </button>
        </div>
      </form>

      {feedback && <p className="feedback success">{feedback}</p>}
      {feedbackError && <p className="feedback error">{feedbackError}</p>}

      {inmueblesQuery.isLoading && <p>Cargando inmuebles...</p>}
      {inmueblesQuery.isError && <p className="feedback error">{getErrorMessage(inmueblesQuery.error)}</p>}

      {inmuebleId && estadoDeudaQuery.isLoading && <p>Cargando estado de deuda...</p>}
      {inmuebleId && estadoDeudaQuery.isError && (
        <p className="feedback error">No se pudo obtener el estado de deuda de este inmueble.</p>
      )}
    </section>
  );
}
