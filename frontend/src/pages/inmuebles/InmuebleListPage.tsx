import { FormEvent, useMemo, useState } from 'react';
import { useGrupos } from '../../modules/grupos/hooks';
import {
  useCreateInmueble,
  useImportInmueblesExcel,
  useInmuebles,
  useUpdateInmueble
} from '../../modules/inmuebles/hooks';
import type { Inmueble, InmuebleFilters, InmuebleImportResult } from '../../modules/inmuebles/types';
import { InmuebleCreateSection } from './components/InmuebleCreateSection';
import { InmuebleImportSection } from './components/InmuebleImportSection';
import { InmuebleListSearchSection } from './components/InmuebleListSearchSection';

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

type InmueblesSection = 'listado' | 'crear' | 'importacion';

export function InmuebleListPage() {
  const [activeSection, setActiveSection] = useState<InmueblesSection>('listado');
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
    setActiveSection('crear');
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
      <div className="page-header">
        <h2>Inmuebles</h2>
        <p>Gestión operativa de inmuebles: búsqueda, alta, edición e importación por Excel.</p>
      </div>

      <div className="inmuebles-sections-nav" role="tablist" aria-label="Secciones de Inmuebles">
        <button
          type="button"
          role="tab"
          aria-selected={activeSection === 'listado'}
          className={`tab-button ${activeSection === 'listado' ? 'active' : ''}`}
          onClick={() => setActiveSection('listado')}
        >
          Listado y búsqueda
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={activeSection === 'crear'}
          className={`tab-button ${activeSection === 'crear' ? 'active' : ''}`}
          onClick={() => setActiveSection('crear')}
        >
          {editingInmueble ? 'Editar inmueble' : 'Crear inmueble'}
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={activeSection === 'importacion'}
          className={`tab-button ${activeSection === 'importacion' ? 'active' : ''}`}
          onClick={() => setActiveSection('importacion')}
        >
          Importación Excel
        </button>
      </div>

      {feedback && <p className="feedback success">{feedback}</p>}
      {feedbackError && <p className="feedback error">{feedbackError}</p>}
      {gruposQuery.isLoading && <p>Cargando grupos para el formulario...</p>}
      {gruposQuery.isError && <p className="feedback error">{getErrorMessage(gruposQuery.error)}</p>}

      {activeSection === 'listado' && (
        <InmuebleListSearchSection
          filters={filters}
          onFiltersChange={setFilters}
          onApplyFilters={handleApplyFilters}
          onResetFilters={handleResetFilters}
          inmuebles={inmueblesQuery.data ?? []}
          isLoading={inmueblesQuery.isLoading}
          isError={inmueblesQuery.isError}
          errorMessage={inmueblesQuery.isError ? getErrorMessage(inmueblesQuery.error) : null}
          onEdit={handleEdit}
        />
      )}

      {activeSection === 'crear' && (
        <InmuebleCreateSection
          form={inmuebleForm}
          editing={Boolean(editingInmueble)}
          grupos={grupos}
          submitLabel={submitLabel}
          isSubmitting={createInmuebleMutation.isPending || updateInmuebleMutation.isPending}
          onFormChange={setInmuebleForm}
          onSubmit={handleSubmitInmueble}
          onCancelEdit={resetForm}
        />
      )}

      {activeSection === 'importacion' && (
        <InmuebleImportSection
          importResult={importResult}
          isImporting={importMutation.isPending}
          onFileChange={setSelectedFile}
          onSubmit={handleImport}
        />
      )}
    </section>
  );
}
