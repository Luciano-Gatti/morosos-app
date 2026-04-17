import { FormEvent, useState } from 'react';
import { useCreateTipoCorte, useTiposCorte, useUpdateTipoCorte } from '../../modules/tiposCorte/hooks';
import type { TipoCorte } from '../../modules/tiposCorte/types';

function getErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : 'Ocurrió un error inesperado.';
}

export function TiposCortePage() {
  const tiposCorteQuery = useTiposCorte();
  const createMutation = useCreateTipoCorte();
  const updateMutation = useUpdateTipoCorte();

  const [editingTipo, setEditingTipo] = useState<TipoCorte | null>(null);
  const [nombre, setNombre] = useState('');
  const [feedback, setFeedback] = useState<string | null>(null);
  const [feedbackError, setFeedbackError] = useState<string | null>(null);

  const resetForm = () => {
    setEditingTipo(null);
    setNombre('');
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setFeedback(null);
    setFeedbackError(null);

    const cleanedName = nombre.trim();
    if (!cleanedName) {
      setFeedbackError('El nombre es obligatorio.');
      return;
    }

    try {
      if (editingTipo) {
        await updateMutation.mutateAsync({ id: editingTipo.id, payload: { nombre: cleanedName } });
        setFeedback('Tipo de corte actualizado correctamente.');
      } else {
        await createMutation.mutateAsync({ nombre: cleanedName });
        setFeedback('Tipo de corte creado correctamente.');
      }
      resetForm();
    } catch (error) {
      setFeedbackError(getErrorMessage(error));
    }
  };

  return (
    <section>
      <h2>Tipos de corte</h2>
      <p>Gestión de tipos de corte disponibles para la operación.</p>

      <form className="simple-form" onSubmit={handleSubmit}>
        <label>
          Nombre
          <input value={nombre} maxLength={100} onChange={(event) => setNombre(event.target.value)} />
        </label>

        <div className="actions">
          <button type="submit" disabled={createMutation.isPending || updateMutation.isPending}>
            {editingTipo ? 'Guardar cambios' : 'Crear tipo de corte'}
          </button>
          {editingTipo && (
            <button type="button" className="secondary" onClick={resetForm}>
              Cancelar edición
            </button>
          )}
        </div>
      </form>

      {feedback && <p className="feedback success">{feedback}</p>}
      {feedbackError && <p className="feedback error">{feedbackError}</p>}

      {tiposCorteQuery.isLoading && <p>Cargando tipos de corte...</p>}
      {tiposCorteQuery.isError && <p className="feedback error">{getErrorMessage(tiposCorteQuery.error)}</p>}

      {tiposCorteQuery.data && (
        <table className="simple-table">
          <thead>
            <tr>
              <th>Nombre</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {tiposCorteQuery.data.map((tipo) => (
              <tr key={tipo.id}>
                <td>{tipo.nombre}</td>
                <td>
                  <button
                    type="button"
                    className="secondary"
                    onClick={() => {
                      setEditingTipo(tipo);
                      setNombre(tipo.nombre);
                    }}
                  >
                    Editar
                  </button>
                </td>
              </tr>
            ))}
            {tiposCorteQuery.data.length === 0 && (
              <tr>
                <td colSpan={2}>Sin tipos de corte registrados.</td>
              </tr>
            )}
          </tbody>
        </table>
      )}
    </section>
  );
}
