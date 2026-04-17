import { FormEvent, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import {
  useCargasDeuda,
  useImportEstadoDeudaExcel,
  useReporteMorososPorCarga
} from '../../modules/estadoDeuda/hooks';
import type { EstadoDeudaImportResult } from '../../modules/estadoDeuda/types';

function getErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : 'Ocurrió un error inesperado.';
}

function formatFecha(fecha: string) {
  return new Date(fecha).toLocaleString();
}

type CargasTab = 'importar' | 'historico' | 'reportes';

function parseTab(tab: string | null): CargasTab {
  if (tab === 'importar' || tab === 'reportes') {
    return tab;
  }

  return 'historico';
}

function ImportarCargaTab() {
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
    <div className="inmuebles-section-block">
      <h3>Importar carga</h3>
      <p>Subí el Excel de deuda histórica y revisá el resultado de la carga.</p>

      <form className="simple-form form-grid-two" onSubmit={handleSubmit}>
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

        <div className="actions align-right">
          <button type="submit" disabled={importMutation.isPending}>
            {importMutation.isPending ? 'Importando...' : 'Importar deuda'}
          </button>
        </div>
      </form>

      {feedback && <p className="feedback success">{feedback}</p>}
      {feedbackError && <p className="feedback error">{feedbackError}</p>}

      {result && (
        <div className="import-result">
          <h4>Resultado de importación</h4>
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
    </div>
  );
}

function HistoricoCargasTab() {
  const cargasQuery = useCargasDeuda();

  const cargasOrdenadas = useMemo(() => {
    const rows = [...(cargasQuery.data ?? [])];
    rows.sort((a, b) => new Date(b.fechaCarga).getTime() - new Date(a.fechaCarga).getTime());
    return rows;
  }, [cargasQuery.data]);

  return (
    <div className="inmuebles-section-block">
      <h3>Histórico de cargas</h3>
      <p>Listado histórico de cargas importadas de estado de deuda.</p>

      {cargasQuery.isLoading && <p>Cargando cargas de deuda...</p>}
      {cargasQuery.isError && (
        <p className="feedback error">No se pudo obtener el listado de cargas. {getErrorMessage(cargasQuery.error)}</p>
      )}

      {!cargasQuery.isLoading && !cargasQuery.isError && cargasOrdenadas.length === 0 && (
        <p>No hay cargas de deuda históricas registradas.</p>
      )}

      {cargasOrdenadas.length > 0 && (
        <div className="table-container">
          <table className="simple-table">
            <thead>
              <tr>
                <th>ID carga</th>
                <th>Fecha de carga</th>
                <th>Nombre de archivo</th>
                <th>Observación</th>
                <th>Registros históricos</th>
                <th>Acción</th>
              </tr>
            </thead>
            <tbody>
              {cargasOrdenadas.map((carga) => (
                <tr key={carga.id}>
                  <td>{carga.id}</td>
                  <td>{formatFecha(carga.fechaCarga)}</td>
                  <td>{carga.nombreArchivo}</td>
                  <td>{carga.observacion?.trim() || '-'}</td>
                  <td>{carga.cantidadRegistrosHistoricos}</td>
                  <td>
                    <Link to={`/estados-deuda/cargas/${carga.id}`}>Ver detalle</Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function ReportesCargasTab() {
  const reporteQuery = useReporteMorososPorCarga();

  const cargasOrdenadas = useMemo(() => {
    return [...(reporteQuery.data ?? [])]
      .map((carga) => ({
        ...carga,
        detallePorGrupo: [...carga.detallePorGrupo].sort((a, b) => a.grupoNombre.localeCompare(b.grupoNombre))
      }))
      .sort((a, b) => new Date(b.fechaCarga).getTime() - new Date(a.fechaCarga).getTime());
  }, [reporteQuery.data]);

  return (
    <div className="inmuebles-section-block">
      <h3>Reportes</h3>
      <p>Evolución de morosos por carga, con detalle de clasificación por grupo.</p>

      {reporteQuery.isLoading && <p>Cargando reporte histórico...</p>}
      {reporteQuery.isError && (
        <p className="feedback error">No se pudo obtener el reporte histórico. {getErrorMessage(reporteQuery.error)}</p>
      )}

      {!reporteQuery.isLoading && !reporteQuery.isError && cargasOrdenadas.length === 0 && (
        <p>No hay datos históricos de morosos para mostrar.</p>
      )}

      {cargasOrdenadas.length > 0 && (
        <div className="table-container">
          <table className="simple-table">
            <thead>
              <tr>
                <th>Fecha de carga</th>
                <th>Total morosos</th>
                <th>Monto total adeudado</th>
                <th>Detalle por grupo</th>
              </tr>
            </thead>
            <tbody>
              {cargasOrdenadas.map((carga) => (
                <tr key={carga.idCarga}>
                  <td>{formatFecha(carga.fechaCarga)}</td>
                  <td>{carga.cantidadTotalMorosos}</td>
                  <td>{carga.montoTotalAdeudado}</td>
                  <td>
                    {carga.detallePorGrupo.length === 0 ? (
                      <span>Sin detalle</span>
                    ) : (
                      <details>
                        <summary>Ver grupos ({carga.detallePorGrupo.length})</summary>
                        <div className="table-container">
                          <table className="simple-table">
                            <thead>
                              <tr>
                                <th>Grupo</th>
                                <th>Cantidad morosos</th>
                                <th>Monto adeudado del grupo</th>
                              </tr>
                            </thead>
                            <tbody>
                              {carga.detallePorGrupo.map((grupo) => (
                                <tr key={grupo.grupoId}>
                                  <td>{grupo.grupoNombre}</td>
                                  <td>{grupo.cantidadMorosos}</td>
                                  <td>{grupo.montoTotalAdeudadoDelGrupo}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </details>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export function CargasDeudaPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = parseTab(searchParams.get('tab'));

  const changeTab = (tab: CargasTab) => {
    setSearchParams({ tab });
  };

  return (
    <section>
      <div className="page-header">
        <h2>Cargas de deuda</h2>
        <p>Administrá importaciones, histórico de cargas y reportes desde una única sección.</p>
      </div>

      <div className="inmuebles-sections-nav" role="tablist" aria-label="Subsecciones de Cargas de deuda">
        <button
          type="button"
          role="tab"
          aria-selected={activeTab === 'importar'}
          className={`tab-button ${activeTab === 'importar' ? 'active' : ''}`}
          onClick={() => changeTab('importar')}
        >
          Importar carga
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={activeTab === 'historico'}
          className={`tab-button ${activeTab === 'historico' ? 'active' : ''}`}
          onClick={() => changeTab('historico')}
        >
          Histórico de cargas
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={activeTab === 'reportes'}
          className={`tab-button ${activeTab === 'reportes' ? 'active' : ''}`}
          onClick={() => changeTab('reportes')}
        >
          Reportes
        </button>
      </div>

      {activeTab === 'importar' && <ImportarCargaTab />}
      {activeTab === 'historico' && <HistoricoCargasTab />}
      {activeTab === 'reportes' && <ReportesCargasTab />}
    </section>
  );
}
