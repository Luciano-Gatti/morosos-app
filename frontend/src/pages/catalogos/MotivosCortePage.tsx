import { FormEvent, useState } from 'react';
import {
  useCreateMotivoCorte,
  useDeleteMotivoCorte,
  useMotivosCorte,
  useUpdateMotivoCorte
} from '../../modules/motivosCorte/hooks';
import type { MotivoCorte } from '../../modules/motivosCorte/types';

function getErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : 'Ocurrió un error inesperado.';
}

export function MotivosCortePage() {
  const motivosQuery = useMotivosCorte();
  const createMutation = useCreateMotivoCorte();
  const updateMutation = useUpdateMotivoCorte();
  const deleteMutation = useDeleteMotivoCorte();

  const [editingMotivo, setEditingMotivo] = useState<MotivoCorte | null>(null);
  const [nombre, setNombre] = useState('');
  const [activo, setActivo] = useState(true);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [feedbackError, setFeedbackError] = useState<string | null>(null);

  const resetForm = () => {
    setEditingMotivo(null);
    setNombre('');
    setActivo(true);
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
      if (editingMotivo) {
        await updateMutation.mutateAsync({
          id: editingMotivo.id,
          payload: { nombre: cleanedName, activo }
        });
        setFeedback('Motivo de corte actualizado correctamente.');
      } else {
        await createMutation.mutateAsync({ nombre: cleanedName, activo });
        setFeedback('Motivo de corte creado correctamente.');
      }
      resetForm();
    } catch (error) {
      setFeedbackError(getErrorMessage(error));
    }
  };

  const handleToggleActivo = async (motivo: MotivoCorte) => {
    setFeedback(null);
    setFeedbackError(null);

    try {
      await updateMutation.mutateAsync({
        id: motivo.id,
        payload: { nombre: motivo.nombre, activo: !motivo.activo }
      });
      setFeedback(`Motivo ${motivo.nombre} ${motivo.activo ? 'desactivado' : 'activado'} correctamente.`);
    } catch (error) {
      setFeedbackError(getErrorMessage(error));
    }
  };

  const handleDelete = async (motivo: MotivoCorte) => {
    setFeedback(null);
    setFeedbackError(null);

    const shouldDelete = window.confirm(
      `¿Seguro que querés eliminar "${motivo.nombre}"? La API validará si está en uso.`
    );

    if (!shouldDelete) {
      return;
    }

    try {
      await deleteMutation.mutateAsync(motivo.id);
      setFeedback('Motivo eliminado correctamente.');
      if (editingMotivo?.id === motivo.id) {
        resetForm();
      }
    } catch (error) {
      setFeedbackError(getErrorMessage(error));
    }
  };

  return (
    <section>
      <h2>Motivos de corte</h2>
      <p>Gestión de motivos de corte con control de estado activo y eliminación validada por backend.</p>

      <form className="simple-form" onSubmit={handleSubmit}>
        <label>
          Nombre
          <input value={nombre} maxLength={120} onChange={(event) => setNombre(event.target.value)} />
        </label>

        <label className="checkbox-field">
          <input type="checkbox" checked={activo} onChange={(event) => setActivo(event.target.checked)} />
          Activo
        </label>

        <div className="actions">
          <button
            type="submit"
            disabled={createMutation.isPending || updateMutation.isPending || deleteMutation.isPending}
          >
            {editingMotivo ? 'Guardar cambios' : 'Crear motivo de corte'}
          </button>
          {editingMotivo && (
            <button type="button" className="secondary" onClick={resetForm}>
              Cancelar edición
            </button>
          )}
        </div>
      </form>

      {feedback && <p className="feedback success">{feedback}</p>}
      {feedbackError && <p className="feedback error">{feedbackError}</p>}

      {motivosQuery.isLoading && <p>Cargando motivos de corte...</p>}
      {motivosQuery.isError && <p className="feedback error">{getErrorMessage(motivosQuery.error)}</p>}

      {motivosQuery.data && (
        <div className="table-container">
          <table className="simple-table">
          <thead>
            <tr>
              <th>Nombre</th>
              <th>Estado</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {motivosQuery.data.map((motivo) => (
              <tr key={motivo.id}>
                <td>{motivo.nombre}</td>
                <td>{motivo.activo ? 'Activo' : 'Inactivo'}</td>
                <td className="inline-actions">
                  <button
                    type="button"
                    className="secondary"
                    onClick={() => {
                      setEditingMotivo(motivo);
                      setNombre(motivo.nombre);
                      setActivo(motivo.activo);
                    }}
                  >
                    Editar
                  </button>
                  <button type="button" className="secondary" onClick={() => handleToggleActivo(motivo)}>
                    {motivo.activo ? 'Desactivar' : 'Activar'}
                  </button>
                  <button type="button" className="danger" onClick={() => handleDelete(motivo)}>
                    Eliminar
                  </button>
                </td>
              </tr>
            ))}
            {motivosQuery.data.length === 0 && (
              <tr>
                <td colSpan={3}>Sin motivos de corte registrados.</td>
              </tr>
            )}
          </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
