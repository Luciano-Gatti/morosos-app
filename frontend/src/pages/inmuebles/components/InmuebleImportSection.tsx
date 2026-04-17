import { FormEvent } from 'react';
import type { InmuebleImportResult } from '../../../modules/inmuebles/types';

type InmuebleImportSectionProps = {
  importResult: InmuebleImportResult | null;
  isImporting: boolean;
  onFileChange: (file: File | null) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
};

export function InmuebleImportSection({
  importResult,
  isImporting,
  onFileChange,
  onSubmit
}: InmuebleImportSectionProps) {
  return (
    <div className="inmuebles-section-block">
      <h3>Importación Excel</h3>
      <form className="simple-form" onSubmit={onSubmit}>
        <label>
          Archivo Excel (.xlsx)
          <input type="file" accept=".xlsx,.xls" onChange={(event) => onFileChange(event.target.files?.[0] ?? null)} />
        </label>
        <div className="actions align-right">
          <button type="submit" disabled={isImporting}>
            Importar
          </button>
        </div>
      </form>

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
    </div>
  );
}
