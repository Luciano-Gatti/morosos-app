import { FormEvent, useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import {
  useAvanzarCaso,
  useCasoSeguimiento,
  useCerrarCaso,
  useCompromisosCaso,
  useCrearCompromisoCaso,
  useCrearRegistroCorteCaso,
  useMarcarCompromisoIncumplido,
  useRegistrosCorteCaso,
  useRepetirCaso
} from '../../modules/casosSeguimiento/hooks';
import type { EtapaSeguimiento } from '../../modules/casosSeguimiento/types';
import { useInmueble } from '../../modules/inmuebles/hooks';
import { useMotivosCorte } from '../../modules/motivosCorte/hooks';
import { useTiposCorte } from '../../modules/tiposCorte/hooks';

function getErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : 'Ocurrió un error inesperado.';
}

const etapasOrdenadas: EtapaSeguimiento[] = ['AVISO_DEUDA', 'INTIMACION', 'AVISO_CORTE', 'CORTE'];

export function CasoDetailPage() {
  const { casoId = '' } = useParams();

  const casoQuery = useCasoSeguimiento(casoId);
  const caso = casoQuery.data;

  const inmuebleQuery = useInmueble(caso?.inmuebleId ?? '');
  const compromisosQuery = useCompromisosCaso(casoId);
  const registrosCorteQuery = useRegistrosCorteCaso(casoId);

  const tiposCorteQuery = useTiposCorte();
  const motivosCorteQuery = useMotivosCorte();

  const avanzarMutation = useAvanzarCaso();
  const repetirMutation = useRepetirCaso();
  const cerrarMutation = useCerrarCaso();
  const crearCompromisoMutation = useCrearCompromisoCaso();
  const crearRegistroCorteMutation = useCrearRegistroCorteCaso();
  const marcarIncumplidoMutation = useMarcarCompromisoIncumplido();

  const [motivoCierre, setMotivoCierre] = useState('');
  const [compromisoFechaDesde, setCompromisoFechaDesde] = useState('');
  const [compromisoFechaHasta, setCompromisoFechaHasta] = useState('');
  const [compromisoObservacion, setCompromisoObservacion] = useState('');
  const [corteFecha, setCorteFecha] = useState('');
  const [tipoCorteId, setTipoCorteId] = useState('');
  const [motivoCorteId, setMotivoCorteId] = useState('');
  const [corteObservacion, setCorteObservacion] = useState('');
  const [feedback, setFeedback] = useState<string | null>(null);
  const [feedbackError, setFeedbackError] = useState<string | null>(null);

  const historialEtapas = useMemo(() => {
    if (!caso) {
      return [];
    }

    const indiceActual = etapasOrdenadas.indexOf(caso.etapaActual);

    return etapasOrdenadas.map((etapa, index) => ({
      etapa,
      estado: index < indiceActual ? 'COMPLETADA' : index === indiceActual ? 'ACTUAL' : 'PENDIENTE'
    }));
  }, [caso]);


  const historialCortes = useMemo(() => {
    return [...(registrosCorteQuery.data ?? [])].sort((a, b) => b.fecha.localeCompare(a.fecha));
  }, [registrosCorteQuery.data]);

  const handleAvanzar = async () => {
    setFeedback(null);
    setFeedbackError(null);
    try {
      await avanzarMutation.mutateAsync(casoId);
      setFeedback('Caso avanzado a la siguiente etapa.');
    } catch (error) {
      setFeedbackError(getErrorMessage(error));
    }
  };

  const handleRepetir = async () => {
    setFeedback(null);
    setFeedbackError(null);
    try {
      await repetirMutation.mutateAsync(casoId);
      setFeedback('Caso repetido en la etapa actual.');
    } catch (error) {
      setFeedbackError(getErrorMessage(error));
    }
  };

  const handleCerrarCaso = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setFeedback(null);
    setFeedbackError(null);

    if (!motivoCierre.trim()) {
      setFeedbackError('Ingresá un motivo de cierre.');
      return;
    }

    try {
      await cerrarMutation.mutateAsync({ casoId, payload: { motivoCierre: motivoCierre.trim() } });
      setFeedback('Caso cerrado correctamente.');
      setMotivoCierre('');
    } catch (error) {
      setFeedbackError(getErrorMessage(error));
    }
  };

  const handleCrearCompromiso = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setFeedback(null);
    setFeedbackError(null);

    if (!compromisoFechaDesde) {
      setFeedbackError('Seleccioná fecha desde para el compromiso.');
      return;
    }

    try {
      await crearCompromisoMutation.mutateAsync({
        casoId,
        payload: {
          fechaDesde: compromisoFechaDesde,
          fechaHasta: compromisoFechaHasta || undefined,
          observacion: compromisoObservacion.trim() || undefined
        }
      });

      setFeedback('Compromiso registrado. El caso puede pasar a PAUSADO según reglas de backend.');
      setCompromisoFechaDesde('');
      setCompromisoFechaHasta('');
      setCompromisoObservacion('');
    } catch (error) {
      setFeedbackError(getErrorMessage(error));
    }
  };


  const handleMarcarIncumplido = async (compromisoId: string) => {
    setFeedback(null);
    setFeedbackError(null);

    try {
      await marcarIncumplidoMutation.mutateAsync(compromisoId);
      setFeedback('Compromiso marcado como incumplido. El caso se reactivó según reglas de backend.');
    } catch (error) {
      setFeedbackError(getErrorMessage(error));
    }
  };

  const handleRegistrarCorte = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setFeedback(null);
    setFeedbackError(null);

    if (!corteFecha || !tipoCorteId || !motivoCorteId) {
      setFeedbackError('Completá fecha, tipo y motivo de corte.');
      return;
    }

    try {
      await crearRegistroCorteMutation.mutateAsync({
        casoId,
        payload: {
          fecha: corteFecha,
          tipoCorteId,
          motivoCorteId,
          observacion: corteObservacion.trim() || undefined
        }
      });
      setFeedback('Registro de corte guardado correctamente.');
      setCorteFecha('');
      setTipoCorteId('');
      setMotivoCorteId('');
      setCorteObservacion('');
    } catch (error) {
      setFeedbackError(getErrorMessage(error));
    }
  };

  return (
    <section>
      <h2>Detalle del caso</h2>

      {casoQuery.isLoading && <p>Cargando caso...</p>}
      {casoQuery.isError && <p className="feedback error">{getErrorMessage(casoQuery.error)}</p>}

      {caso && (
        <>
          <div className="detail-grid">
            <article className="detail-card">
              <h3>Datos del inmueble</h3>
              <p>
                <strong>Número de cuenta:</strong> {caso.numeroCuenta}
              </p>
              <p>
                <strong>ID inmueble:</strong> {caso.inmuebleId}
              </p>
              <p>
                <strong>Propietario:</strong> {inmuebleQuery.data?.propietarioNombre ?? '-'}
              </p>
              <p>
                <strong>Dirección:</strong> {inmuebleQuery.data?.direccionCompleta ?? '-'}
              </p>
              <p>
                <strong>Distrito:</strong> {inmuebleQuery.data?.distrito ?? '-'}
              </p>
              <p>
                <strong>Grupo:</strong> {inmuebleQuery.data?.grupoNombre ?? '-'}
              </p>
            </article>

            <article className="detail-card">
              <h3>Seguimiento</h3>
              {caso.estadoSeguimiento === 'PAUSADO' && (
                <p className="status-pill paused">Caso PAUSADO por compromiso</p>
              )}
              <p>
                <strong>Estado:</strong> {caso.estadoSeguimiento}
              </p>
              <p>
                <strong>Etapa actual:</strong> {caso.etapaActual}
              </p>
              <p>
                <strong>Fecha inicio:</strong> {new Date(caso.fechaInicio).toLocaleString()}
              </p>
              <p>
                <strong>Fecha cierre:</strong> {caso.fechaCierre ? new Date(caso.fechaCierre).toLocaleString() : '-'}
              </p>
              <p>
                <strong>Motivo cierre:</strong> {caso.motivoCierre || '-'}
              </p>
            </article>
          </div>

          <article className="detail-card">
            <h3>Acciones del caso</h3>
            <div className="actions">
              <button
                type="button"
                onClick={handleAvanzar}
                disabled={caso.estadoSeguimiento === 'CERRADO' || avanzarMutation.isPending}
              >
                Pasar a siguiente etapa
              </button>
              <button
                type="button"
                className="secondary"
                onClick={handleRepetir}
                disabled={caso.estadoSeguimiento === 'CERRADO' || repetirMutation.isPending}
              >
                Repetir etapa
              </button>
            </div>

            <form className="simple-form" onSubmit={handleCerrarCaso}>
              <label>
                Motivo de cierre
                <input
                  maxLength={300}
                  value={motivoCierre}
                  onChange={(event) => setMotivoCierre(event.target.value)}
                />
              </label>
              <div className="actions">
                <button type="submit" className="danger" disabled={caso.estadoSeguimiento === 'CERRADO'}>
                  Cerrar caso
                </button>
              </div>
            </form>
          </article>

          <article className="detail-card">
            <h3>Historial de etapas</h3>
            <ul className="timeline-list">
              {historialEtapas.map((item) => (
                <li key={item.etapa}>
                  <strong>{item.etapa}</strong>: {item.estado}
                </li>
              ))}
            </ul>
          </article>

          <article className="detail-card">
            <h3>Compromisos (pausa por compromiso)</h3>
            <form className="simple-form" onSubmit={handleCrearCompromiso}>
              <label>
                Fecha desde
                <input
                  type="date"
                  value={compromisoFechaDesde}
                  onChange={(event) => setCompromisoFechaDesde(event.target.value)}
                />
              </label>
              <label>
                Fecha hasta
                <input
                  type="date"
                  value={compromisoFechaHasta}
                  onChange={(event) => setCompromisoFechaHasta(event.target.value)}
                />
              </label>
              <label>
                Observación
                <input
                  maxLength={500}
                  value={compromisoObservacion}
                  onChange={(event) => setCompromisoObservacion(event.target.value)}
                />
              </label>
              <div className="actions">
                <button type="submit" disabled={caso.estadoSeguimiento === 'CERRADO'}>
                  Pausar mediante compromiso
                </button>
              </div>
            </form>

            {compromisosQuery.isLoading && <p>Cargando compromisos...</p>}
            {compromisosQuery.data && compromisosQuery.data.length > 0 && (
              <table className="simple-table">
                <thead>
                  <tr>
                    <th>Desde</th>
                    <th>Hasta</th>
                    <th>Estado</th>
                    <th>Observación</th>
                    <th>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {compromisosQuery.data.map((compromiso) => (
                    <tr key={compromiso.id}>
                      <td>{compromiso.fechaDesde}</td>
                      <td>{compromiso.fechaHasta ?? '-'}</td>
                      <td>{compromiso.estadoCompromiso}</td>
                      <td>{compromiso.observacion ?? '-'}</td>
                      <td>
                        <button
                          type="button"
                          className="secondary"
                          onClick={() => handleMarcarIncumplido(compromiso.id)}
                          disabled={compromiso.estadoCompromiso !== 'PENDIENTE' || caso.estadoSeguimiento === 'CERRADO'}
                        >
                          Marcar incumplido
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </article>

          <article className="detail-card">
            <h3>Registros de corte</h3>
            {caso.etapaActual !== 'CORTE' && (
              <p className="status-pill info">Solo disponible cuando la etapa actual es CORTE.</p>
            )}

            {caso.etapaActual === 'CORTE' && (
              <>
                <form className="simple-form" onSubmit={handleRegistrarCorte}>
                  <label>
                    Fecha *
                    <input
                      type="date"
                      required
                      max={new Date().toISOString().split('T')[0]}
                      value={corteFecha}
                      onChange={(event) => setCorteFecha(event.target.value)}
                    />
                  </label>
                  <label>
                    Tipo de corte *
                    <select required value={tipoCorteId} onChange={(event) => setTipoCorteId(event.target.value)}>
                      <option value="">Seleccionar tipo</option>
                      {(tiposCorteQuery.data ?? []).map((tipo) => (
                        <option key={tipo.id} value={tipo.id}>
                          {tipo.nombre}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label>
                    Motivo de corte *
                    <select required value={motivoCorteId} onChange={(event) => setMotivoCorteId(event.target.value)}>
                      <option value="">Seleccionar motivo</option>
                      {(motivosCorteQuery.data ?? []).map((motivo) => (
                        <option key={motivo.id} value={motivo.id}>
                          {motivo.nombre} {motivo.activo ? '' : '(inactivo)'}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label>
                    Observación (opcional)
                    <input
                      maxLength={500}
                      value={corteObservacion}
                      onChange={(event) => setCorteObservacion(event.target.value)}
                    />
                  </label>
                  <div className="actions">
                    <button type="submit" disabled={caso.estadoSeguimiento === 'CERRADO'}>
                      Registrar corte
                    </button>
                  </div>
                </form>

                {registrosCorteQuery.isLoading && <p>Cargando registros de corte...</p>}

                {historialCortes.length > 0 && (
                  <div className="corte-history">
                    <h4>Historial de cortes del caso</h4>
                    {historialCortes.map((registro, index) => (
                      <article key={registro.id} className="corte-item">
                        <p>
                          <strong>Corte #{historialCortes.length - index}</strong> · {registro.fecha}
                        </p>
                        <p>
                          <strong>Tipo:</strong> {registro.tipoCorte}
                        </p>
                        <p>
                          <strong>Motivo:</strong> {registro.motivoCorte}
                        </p>
                        <p>
                          <strong>Observación:</strong> {registro.observacion ?? '-'}
                        </p>
                      </article>
                    ))}
                  </div>
                )}

                {historialCortes.length === 0 && !registrosCorteQuery.isLoading && (
                  <p>Todavía no hay cortes registrados para este caso.</p>
                )}
              </>
            )}
          </article>

          {feedback && <p className="feedback success">{feedback}</p>}
          {feedbackError && <p className="feedback error">{feedbackError}</p>}
        </>
      )}
    </section>
  );
}
