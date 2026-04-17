import { FormEvent, useState } from 'react';
import { useImportEstadoDeudaExcel } from '../../modules/estadoDeuda/hooks';
import type { EstadoDeudaImportResult } from '../../modules/estadoDeuda/types';

function getErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : 'Ocurrió un error inesperado.';
}

export function ImportacionDeudaPage() {
  const importMutation = useImportEstadoDeudaExcel();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [observacion, setObservacion] = useState('');
  const [result, setResult] = useState<EstadoDeudaImportResult | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [feedbackError, setFeedbackError] = useState<string | null>(null);
  const [fileInputKey, setFileInputKey] = useState(0);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setFeedback(null);
    setFeedbackError(null);
    setResult(null);

    if (!selectedFile) {
      setFeedbackError('Seleccioná un archivo Excel para importar.');
      return;
    }

    try {
      const importResult = await importMutation.mutateAsync({
        file: selectedFile,
        observacion
      });
      setResult(importResult);
      setFeedback(
        `Importación finalizada: ${importResult.totalProcesados} procesados, ${importResult.actualizados} actualizados y ${importResult.errores} errores.`
      );
      setSelectedFile(null);
      setObservacion('');
      setFileInputKey((prev) => prev + 1);
      event.currentTarget.reset();
    } catch (error) {
      setResult(null);
      setFeedbackError(`No se pudo importar la deuda histórica. ${getErrorMessage(error)}`);
    }
  };

  return (
    <section>
      <h2>Importación de deuda</h2>
      <p>Subí el Excel de deuda histórica y revisá el resultado de la carga.</p>

      <form className="simple-form" onSubmit={handleSubmit}>
        <label>
          Archivo Excel (.xlsx / .xls)
          <input
            key={fileInputKey}
            type="file"
            accept=".xlsx,.xls"
            onChange={(event) => setSelectedFile(event.target.files?.[0] ?? null)}
          />
        </label>

        <label>
          Observación (opcional)
          <input value={observacion} onChange={(event) => setObservacion(event.target.value)} maxLength={220} />
        </label>

        <div className="actions">
          <button type="submit" disabled={importMutation.isPending}>
            {importMutation.isPending ? 'Importando...' : 'Importar deuda'}
          </button>
        </div>
      </form>

      {feedback && <p className="feedback success">{feedback}</p>}
      {feedbackError && <p className="feedback error">{feedbackError}</p>}

      {result && (
        <div className="import-result">
          <h3>Resultado de importación</h3>
          <ul>
            <li>Total procesados: {result.totalProcesados}</li>
            <li>Actualizados: {result.actualizados}</li>
            <li>Errores: {result.errores}</li>
            <li>Cuentas no encontradas: {result.cuentasNoEncontradas}</li>
          </ul>

          {result.detalleErrores.length > 0 && (
            <details>
              <summary>Detalle de errores</summary>
              <ul>
                {result.detalleErrores.map((error, index) => (
                  <li key={`${error}-${index}`}>{error}</li>
                ))}
              </ul>
            </details>
          )}

          {result.detalleCuentasNoEncontradas.length > 0 && (
            <details>
              <summary>Cuentas no encontradas</summary>
              <ul>
                {result.detalleCuentasNoEncontradas.map((cuenta, index) => (
                  <li key={`${cuenta}-${index}`}>{cuenta}</li>
                ))}
              </ul>
            </details>
          )}
        </div>
      )}
    </section>
  );
}
