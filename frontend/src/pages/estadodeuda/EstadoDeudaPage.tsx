import { FormEvent, useEffect, useMemo, useState } from 'react';
import { useCreateEstadoDeuda, useEstadoDeudaByInmueble, useUpdateEstadoDeuda } from '../../modules/estadoDeuda/hooks';
import { useInmuebles } from '../../modules/inmuebles/hooks';

function getErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : 'Ocurrió un error inesperado.';
}

export function EstadoDeudaPage() {
  const inmueblesQuery = useInmuebles({});
  const [inmuebleId, setInmuebleId] = useState('');

  const estadoDeudaQuery = useEstadoDeudaByInmueble(inmuebleId);
  const createMutation = useCreateEstadoDeuda();
  const updateMutation = useUpdateEstadoDeuda();

  const [cuotasAdeudadas, setCuotasAdeudadas] = useState('0');
  const [montoAdeudado, setMontoAdeudado] = useState('0');
  const [feedback, setFeedback] = useState<string | null>(null);
  const [feedbackError, setFeedbackError] = useState<string | null>(null);

  const estadoDeuda = estadoDeudaQuery.data;

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
      setFeedbackError('cuotasAdeudadas debe ser entero mayor o igual a 0.');
      return;
    }

    if (Number.isNaN(monto) || monto < 0) {
      setFeedbackError('montoAdeudado debe ser mayor o igual a 0.');
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
      <h2>Estado de deuda</h2>
      <p>Carga y edición de cuotas adeudadas y monto adeudado por inmueble.</p>

      <form className="simple-form" onSubmit={handleSubmit}>
        <label>
          Inmueble
          <select value={inmuebleId} onChange={(event) => setInmuebleId(event.target.value)}>
            <option value="">Seleccionar inmueble</option>
            {(inmueblesQuery.data ?? []).map((inmueble) => (
              <option key={inmueble.id} value={inmueble.id}>
                {inmueble.numeroCuenta} - {inmueble.propietarioNombre}
              </option>
            ))}
          </select>
        </label>

        <label>
          cuotasAdeudadas
          <input
            type="number"
            min={0}
            step={1}
            value={cuotasAdeudadas}
            onChange={(event) => setCuotasAdeudadas(event.target.value)}
          />
        </label>

        <label>
          montoAdeudado
          <input
            type="number"
            min={0}
            step="0.01"
            value={montoAdeudado}
            onChange={(event) => setMontoAdeudado(event.target.value)}
          />
        </label>

        <p>
          <strong>fechaActualizacion:</strong> {fechaActualizacion}
        </p>

        <div className="actions">
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
        <p className="feedback error">No existe estado de deuda cargado para este inmueble todavía.</p>
      )}
    </section>
  );
}
