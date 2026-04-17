import { FormEvent, useMemo, useState } from 'react';
import { useCreateGrupo, useGrupos, useUpdateGrupo } from '../../modules/grupos/hooks';
import type { Grupo } from '../../modules/grupos/types';

function getErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : 'Ocurrió un error inesperado.';
}

export function GrupoListPage() {
  const gruposQuery = useGrupos();
  const createGrupoMutation = useCreateGrupo();
  const updateGrupoMutation = useUpdateGrupo();

  const [editingGrupo, setEditingGrupo] = useState<Grupo | null>(null);
  const [nombre, setNombre] = useState('');
  const [seguimientoActivo, setSeguimientoActivo] = useState(true);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [feedbackError, setFeedbackError] = useState<string | null>(null);

  const submitText = useMemo(() => (editingGrupo ? 'Guardar cambios' : 'Crear grupo'), [editingGrupo]);

  const resetForm = () => {
    setEditingGrupo(null);
    setNombre('');
    setSeguimientoActivo(true);
  };

  const handleEdit = (grupo: Grupo) => {
    setEditingGrupo(grupo);
    setNombre(grupo.nombre);
    setSeguimientoActivo(grupo.seguimientoActivo);
    setFeedback(null);
    setFeedbackError(null);
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setFeedback(null);
    setFeedbackError(null);

    const payload = {
      nombre: nombre.trim(),
      seguimientoActivo
    };

    if (!payload.nombre) {
      setFeedbackError('El nombre es obligatorio.');
      return;
    }

    try {
      if (editingGrupo) {
        await updateGrupoMutation.mutateAsync({ id: editingGrupo.id, payload });
        setFeedback('Grupo actualizado correctamente.');
      } else {
        await createGrupoMutation.mutateAsync(payload);
        setFeedback('Grupo creado correctamente.');
      }
      resetForm();
    } catch (error) {
      setFeedbackError(getErrorMessage(error));
    }
  };

  return (
    <section>
      <h2>Grupos</h2>
      <p>Gestión básica de grupos para operación interna.</p>

      <form className="simple-form" onSubmit={handleSubmit}>
        <label>
          Nombre
          <input value={nombre} onChange={(event) => setNombre(event.target.value)} maxLength={100} />
        </label>

        <label className="checkbox-field">
          <input
            type="checkbox"
            checked={seguimientoActivo}
            onChange={(event) => setSeguimientoActivo(event.target.checked)}
          />
          Seguimiento activo
        </label>

        <div className="actions">
          <button type="submit" disabled={createGrupoMutation.isPending || updateGrupoMutation.isPending}>
            {submitText}
          </button>
          {editingGrupo && (
            <button type="button" className="secondary" onClick={resetForm}>
              Cancelar edición
            </button>
          )}
        </div>
      </form>

      {feedback && <p className="feedback success">{feedback}</p>}
      {feedbackError && <p className="feedback error">{feedbackError}</p>}

      {gruposQuery.isLoading && <p>Cargando grupos...</p>}
      {gruposQuery.isError && <p className="feedback error">{getErrorMessage(gruposQuery.error)}</p>}

      {gruposQuery.data && (
        <div className="table-container">
          <table className="simple-table">
          <thead>
            <tr>
              <th>Nombre</th>
              <th>Seguimiento</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {gruposQuery.data.map((grupo) => (
              <tr key={grupo.id}>
                <td>{grupo.nombre}</td>
                <td>{grupo.seguimientoActivo ? 'Activo' : 'Inactivo'}</td>
                <td>
                  <button type="button" className="secondary" onClick={() => handleEdit(grupo)}>
                    Editar
                  </button>
                </td>
              </tr>
            ))}
            {gruposQuery.data.length === 0 && (
              <tr>
                <td colSpan={3}>Sin grupos registrados.</td>
              </tr>
            )}
          </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
