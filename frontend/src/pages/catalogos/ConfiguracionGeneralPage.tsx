import { FormEvent, useEffect, useState } from 'react';
import {
  useConfiguracionesGenerales,
  useCreateConfiguracionGeneral,
  useUpdateConfiguracionGeneral
} from '../../modules/configuracionGeneral/hooks';

function getErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : 'Ocurrió un error inesperado.';
}

export function ConfiguracionGeneralPage() {
  const configuracionesQuery = useConfiguracionesGenerales();
  const createMutation = useCreateConfiguracionGeneral();
  const updateMutation = useUpdateConfiguracionGeneral();

  const [minimoCuotasSeguimiento, setMinimoCuotasSeguimiento] = useState('1');
  const [feedback, setFeedback] = useState<string | null>(null);
  const [feedbackError, setFeedbackError] = useState<string | null>(null);

  const configuracionActual = configuracionesQuery.data?.[0] ?? null;

  useEffect(() => {
    if (configuracionActual) {
      setMinimoCuotasSeguimiento(String(configuracionActual.minimoCuotasSeguimiento));
    }
  }, [configuracionActual]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setFeedback(null);
    setFeedbackError(null);

    const parsed = Number(minimoCuotasSeguimiento);
    if (!Number.isInteger(parsed) || parsed < 1) {
      setFeedbackError('minimoCuotasSeguimiento debe ser un entero mayor o igual a 1.');
      return;
    }

    const payload = { minimoCuotasSeguimiento: parsed };

    try {
      if (configuracionActual) {
        await updateMutation.mutateAsync({ id: configuracionActual.id, payload });
        setFeedback('Configuración general actualizada correctamente.');
      } else {
        await createMutation.mutateAsync(payload);
        setFeedback('Configuración general creada correctamente.');
      }
    } catch (error) {
      setFeedbackError(getErrorMessage(error));
    }
  };

  return (
    <section>
      <h2>Configuración general</h2>
      <p>Definí el mínimo de cuotas adeudadas para habilitar seguimiento operativo.</p>

      <form className="simple-form" onSubmit={handleSubmit}>
        <label>
          minimoCuotasSeguimiento
          <input
            type="number"
            min={1}
            step={1}
            value={minimoCuotasSeguimiento}
            onChange={(event) => setMinimoCuotasSeguimiento(event.target.value)}
          />
        </label>

        <div className="actions">
          <button type="submit" disabled={createMutation.isPending || updateMutation.isPending}>
            Guardar
          </button>
        </div>
      </form>

      {feedback && <p className="feedback success">{feedback}</p>}
      {feedbackError && <p className="feedback error">{feedbackError}</p>}

      {configuracionesQuery.isLoading && <p>Cargando configuración...</p>}
      {configuracionesQuery.isError && (
        <p className="feedback error">{getErrorMessage(configuracionesQuery.error)}</p>
      )}
    </section>
  );
}
