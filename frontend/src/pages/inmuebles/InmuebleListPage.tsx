import { FormEvent, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useGrupos } from '../../modules/grupos/hooks';
import {
  useCreateInmueble,
  useImportInmueblesExcel,
  useInmuebles,
  useUpdateInmueble
} from '../../modules/inmuebles/hooks';
import type { Inmueble, InmuebleFilters, InmuebleImportResult } from '../../modules/inmuebles/types';

function getErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : 'Ocurrió un error inesperado.';
}

const emptyFilters: InmuebleFilters = {
  numeroCuenta: '',
  propietarioNombre: '',
  direccionCompleta: '',
  distrito: ''
};

const emptyInmuebleForm = {
  numeroCuenta: '',
  propietarioNombre: '',
  distrito: '',
  direccionCompleta: '',
  grupoId: '',
  activo: true
};

export function InmuebleListPage() {
  const [filters, setFilters] = useState<InmuebleFilters>(emptyFilters);
  const [appliedFilters, setAppliedFilters] = useState<InmuebleFilters>(emptyFilters);

  const inmueblesQuery = useInmuebles(appliedFilters);
  const gruposQuery = useGrupos();
  const createInmuebleMutation = useCreateInmueble();
  const updateInmuebleMutation = useUpdateInmueble();
  const importMutation = useImportInmueblesExcel();

  const [editingInmueble, setEditingInmueble] = useState<Inmueble | null>(null);
  const [inmuebleForm, setInmuebleForm] = useState(emptyInmuebleForm);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [importResult, setImportResult] = useState<InmuebleImportResult | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [feedbackError, setFeedbackError] = useState<string | null>(null);

  const grupos = gruposQuery.data ?? [];

  const submitLabel = useMemo(
    () => (editingInmueble ? 'Guardar cambios de inmueble' : 'Crear inmueble'),
    [editingInmueble]
  );

  const resetForm = () => {
    setEditingInmueble(null);
    setInmuebleForm(emptyInmuebleForm);
  };

  const handleApplyFilters = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setAppliedFilters({ ...filters });
  };

  const handleResetFilters = () => {
    setFilters(emptyFilters);
    setAppliedFilters(emptyFilters);
  };

  const handleEdit = (inmueble: Inmueble) => {
    setEditingInmueble(inmueble);
    setInmuebleForm({
      numeroCuenta: inmueble.numeroCuenta,
      propietarioNombre: inmueble.propietarioNombre,
      distrito: inmueble.distrito,
      direccionCompleta: inmueble.direccionCompleta,
      grupoId: inmueble.grupoId,
      activo: inmueble.activo
    });
    setFeedback(null);
    setFeedbackError(null);
  };

  const handleSubmitInmueble = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setFeedback(null);
    setFeedbackError(null);

    const payload = {
      numeroCuenta: inmuebleForm.numeroCuenta.trim(),
      propietarioNombre: inmuebleForm.propietarioNombre.trim(),
      distrito: inmuebleForm.distrito.trim(),
      direccionCompleta: inmuebleForm.direccionCompleta.trim(),
      grupoId: inmuebleForm.grupoId,
      activo: inmuebleForm.activo
    };

    if (
      !payload.numeroCuenta ||
      !payload.propietarioNombre ||
      !payload.distrito ||
      !payload.direccionCompleta ||
      !payload.grupoId
    ) {
      setFeedbackError('Completá todos los campos obligatorios del inmueble.');
      return;
    }

    try {
      if (editingInmueble) {
        await updateInmuebleMutation.mutateAsync({ id: editingInmueble.id, payload });
        setFeedback('Inmueble actualizado correctamente.');
      } else {
        await createInmuebleMutation.mutateAsync(payload);
        setFeedback('Inmueble creado correctamente.');
      }
      resetForm();
    } catch (error) {
      setFeedbackError(getErrorMessage(error));
    }
  };

  const handleImport = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setFeedback(null);
    setFeedbackError(null);

    if (!selectedFile) {
      setFeedbackError('Seleccioná un archivo Excel para importar.');
      return;
    }

    try {
      const result = await importMutation.mutateAsync(selectedFile);
      setImportResult(result);
      setFeedback('Importación finalizada.');
      setSelectedFile(null);
      event.currentTarget.reset();
    } catch (error) {
      setFeedbackError(getErrorMessage(error));
      setImportResult(null);
    }
  };

  return (
    <section>
      <h2>Inmuebles</h2>
      <p>Gestión operativa de inmuebles: búsqueda, alta, edición e importación por Excel.</p>

      <h3>Búsqueda</h3>
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
        <div className="actions">
          <button type="submit">Buscar</button>
          <button type="button" className="secondary" onClick={handleResetFilters}>
            Limpiar filtros
          </button>
        </div>
      </form>

      <h3>{editingInmueble ? 'Editar inmueble' : 'Crear inmueble'}</h3>
      <form className="simple-form" onSubmit={handleSubmitInmueble}>
        <label>
          Número de cuenta
          <input
            required
            maxLength={40}
            value={inmuebleForm.numeroCuenta}
            onChange={(event) => setInmuebleForm((prev) => ({ ...prev, numeroCuenta: event.target.value }))}
          />
        </label>
        <label>
          Propietario
          <input
            required
            maxLength={120}
            value={inmuebleForm.propietarioNombre}
            onChange={(event) =>
              setInmuebleForm((prev) => ({ ...prev, propietarioNombre: event.target.value }))
            }
          />
        </label>
        <label>
          Distrito
          <input
            required
            maxLength={80}
            value={inmuebleForm.distrito}
            onChange={(event) => setInmuebleForm((prev) => ({ ...prev, distrito: event.target.value }))}
          />
        </label>
        <label>
          Dirección completa
          <input
            required
            maxLength={220}
            value={inmuebleForm.direccionCompleta}
            onChange={(event) =>
              setInmuebleForm((prev) => ({ ...prev, direccionCompleta: event.target.value }))
            }
          />
        </label>
        <label>
          Grupo
          <select
            required
            value={inmuebleForm.grupoId}
            onChange={(event) => setInmuebleForm((prev) => ({ ...prev, grupoId: event.target.value }))}
          >
            <option value="">Seleccionar grupo</option>
            {grupos.map((grupo) => (
              <option key={grupo.id} value={grupo.id}>
                {grupo.nombre}
              </option>
            ))}
          </select>
        </label>

        <label className="checkbox-field">
          <input
            type="checkbox"
            checked={inmuebleForm.activo}
            onChange={(event) => setInmuebleForm((prev) => ({ ...prev, activo: event.target.checked }))}
          />
          Activo
        </label>

        <div className="actions">
          <button type="submit" disabled={createInmuebleMutation.isPending || updateInmuebleMutation.isPending}>
            {submitLabel}
          </button>
          {editingInmueble && (
            <button type="button" className="secondary" onClick={resetForm}>
              Cancelar edición
            </button>
          )}
        </div>
      </form>

      <h3>Importación Excel</h3>
      <form className="simple-form" onSubmit={handleImport}>
        <label>
          Archivo Excel (.xlsx)
          <input
            type="file"
            accept=".xlsx,.xls"
            onChange={(event) => setSelectedFile(event.target.files?.[0] ?? null)}
          />
        </label>
        <div className="actions">
          <button type="submit" disabled={importMutation.isPending}>
            Importar
          </button>
        </div>
      </form>

      {feedback && <p className="feedback success">{feedback}</p>}
      {feedbackError && <p className="feedback error">{feedbackError}</p>}

      {importResult && (
        <div className="import-result">
          <h4>Resultado de importación</h4>
          <ul>
            <li>Total procesados: {importResult.totalProcesados}</li>
            <li>Creados: {importResult.creados}</li>
            <li>Actualizados: {importResult.actualizados}</li>
            <li>Errores: {importResult.errores}</li>
          </ul>
          {importResult.detalleErrores.length > 0 && (
            <details>
              <summary>Detalle de errores</summary>
              <ul>
                {importResult.detalleErrores.map((error, index) => (
                  <li key={`${error}-${index}`}>{error}</li>
                ))}
              </ul>
            </details>
          )}
        </div>
      )}

      {gruposQuery.isLoading && <p>Cargando grupos para el formulario...</p>}
      {gruposQuery.isError && <p className="feedback error">{getErrorMessage(gruposQuery.error)}</p>}

      {inmueblesQuery.isLoading && <p>Cargando inmuebles...</p>}
      {inmueblesQuery.isError && <p className="feedback error">{getErrorMessage(inmueblesQuery.error)}</p>}

      {inmueblesQuery.data && (
        <div className="table-container">
          <table className="simple-table">
          <thead>
            <tr>
              <th>Número cuenta</th>
              <th>Propietario</th>
              <th>Dirección</th>
              <th>Distrito</th>
              <th>Grupo</th>
              <th>Activo</th>
              <th>Seguimiento habilitado</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {inmueblesQuery.data.map((inmueble) => (
              <tr key={inmueble.id}>
                <td>{inmueble.numeroCuenta}</td>
                <td>{inmueble.propietarioNombre}</td>
                <td>{inmueble.direccionCompleta}</td>
                <td>{inmueble.distrito}</td>
                <td>{inmueble.grupoNombre}</td>
                <td>{inmueble.activo ? 'Sí' : 'No'}</td>
                <td>{inmueble.seguimientoHabilitado ? 'Sí' : 'No'}</td>
                <td>
                  <Link to={`/inmuebles/${inmueble.id}`}>Ver ficha</Link>{' '}
                  <button type="button" className="secondary" onClick={() => handleEdit(inmueble)}>
                    Editar
                  </button>
                </td>
              </tr>
            ))}
            {inmueblesQuery.data.length === 0 && (
              <tr>
                <td colSpan={8}>Sin inmuebles para los filtros aplicados.</td>
              </tr>
            )}
          </tbody>
        </table>
        </div>
      )}
    </section>
  );
}
