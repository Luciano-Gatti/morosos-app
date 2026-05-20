package pe.morosos.seguimiento.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import java.math.BigDecimal;
import java.time.Duration;
import java.time.Instant;
import java.time.LocalDate;
import java.util.*;
import lombok.RequiredArgsConstructor;
import org.springframework.util.StringUtils;
import org.springframework.data.domain.*;
import org.springframework.stereotype.Service;
import pe.morosos.deuda.entity.CargaDeudaEstado;
import pe.morosos.seguimiento.dto.*;
import org.springframework.transaction.annotation.Transactional;
import pe.morosos.audit.service.AuditService;
import pe.morosos.common.exception.BusinessRuleException;
import pe.morosos.etapa.entity.EtapaConfig;
import pe.morosos.etapa.repository.EtapaConfigRepository;
import pe.morosos.inmueble.entity.Inmueble;
import pe.morosos.inmueble.repository.InmuebleRepository;
import pe.morosos.parametro.service.ParametroSeguimientoRulesService;
import pe.morosos.motivocierre.entity.MotivoCierre;
import pe.morosos.seguimiento.MotorReglasSeguimiento;
import pe.morosos.seguimiento.dto.BulkActionResultResponse;
import pe.morosos.seguimiento.dto.EnviarEtapaRequest;
import pe.morosos.seguimiento.entity.*;
import pe.morosos.seguimiento.repository.CasoSeguimientoRepository;

@Service
@RequiredArgsConstructor
public class SeguimientoService {
    private final MotorReglasSeguimiento motor;
    private final CasoSeguimientoRepository casoRepository;
    private final EtapaConfigRepository etapaRepository;
    private final CasoEventoService casoEventoService;
    private final ProcesoCierreService procesoCierreService;
    private final CompromisoPagoService compromisoPagoService;
    private final AuditService auditService;
    private final ObjectMapper objectMapper;
    private final pe.morosos.deuda.repository.CargaDeudaRepository cargaDeudaRepository;
    private final pe.morosos.deuda.repository.CargaDeudaDetalleRepository cargaDeudaDetalleRepository;
    private final pe.morosos.seguimiento.repository.CasoEventoRepository casoEventoRepository;
    private final pe.morosos.seguimiento.repository.ProcesoCierreRepository procesoCierreRepository;
    private final pe.morosos.seguimiento.repository.ProcesoCierrePlanPagoRepository procesoCierrePlanPagoRepository;
    private final pe.morosos.seguimiento.repository.ProcesoCierreCambioParametroRepository procesoCierreCambioParametroRepository;
    private final pe.morosos.seguimiento.repository.CompromisoPagoRepository compromisoPagoRepository;
    private final InmuebleRepository inmuebleRepository;
    private final ParametroSeguimientoRulesService parametroRulesService;

    

    @Transactional(readOnly = true)
    public Page<SeguimientoBandejaRowResponse> findBandeja(String query, UUID grupoId, UUID distritoId, UUID etapaId,
                                                           CasoSeguimientoEstado estado, Integer cuotasMin, Pageable pageable) {
        String qNormalizada = StringUtils.hasText(query) ? query.trim().toLowerCase() : null;
        int umbralConfigurado = parametroRulesService.cuotasMinimasMorosidad();
        int minCuotas = cuotasMin == null ? umbralConfigurado : Math.max(cuotasMin, umbralConfigurado);
        Optional<pe.morosos.deuda.entity.CargaDeuda> cargaOpt = cargaDeudaRepository.findFirstByEstadoInOrderByCreatedAtDesc(
                List.of(CargaDeudaEstado.COMPLETADA, CargaDeudaEstado.COMPLETADA_CON_ERRORES));

        UUID cargaId = cargaOpt.map(pe.morosos.deuda.entity.CargaDeuda::getId).orElse(null);
        if (cargaId == null) {
            return Page.empty(pageable);
        }

        Pageable sanitizedPageable = sanitizeSort(pageable);

        Page<pe.morosos.deuda.repository.CargaDeudaDetalleRepository.SeguimientoBandejaProjection> page;
        if (qNormalizada == null) {
            page = cargaDeudaDetalleRepository.findBandejaSinBusqueda(
                    cargaId, grupoId, distritoId, etapaId, estado, minCuotas, sanitizedPageable);
        } else {
            String searchPattern = "%" + qNormalizada + "%";
            page = cargaDeudaDetalleRepository.findBandejaConBusqueda(
                    cargaId, searchPattern, grupoId, distritoId, etapaId, estado, minCuotas, sanitizedPageable);
        }

        return page.map(this::toRow);
    }


    private Pageable sanitizeSort(Pageable pageable) {
        Map<String, String> allowlist = Map.of(
                "cuenta", "cuenta",
                "titular", "titular",
                "direccion", "direccion",
                "grupoNombre", "grupoNombre",
                "distritoNombre", "distritoNombre",
                "cuotasAdeudadas", "cuotasAdeudadas",
                "montoAdeudado", "montoAdeudado",
                "etapaActualNombre", "etapaActualNombre",
                "fechaUltimoMovimiento", "fechaUltimoMovimiento",
                "estado", "estado"
        );

        Sort.Order selected = pageable.getSort().stream()
                .filter(order -> allowlist.containsKey(order.getProperty()))
                .findFirst()
                .map(order -> order.withProperty(allowlist.get(order.getProperty())))
                .orElse(Sort.Order.asc("cuenta"));

        return PageRequest.of(pageable.getPageNumber(), pageable.getPageSize(), Sort.by(selected));
    }

    private SeguimientoBandejaRowResponse toRow(pe.morosos.deuda.repository.CargaDeudaDetalleRepository.SeguimientoBandejaProjection row) {
        Instant ultimo = row.getFechaUltimoMovimiento();
        Long dias = ultimo == null ? null : Duration.between(ultimo, Instant.now()).toDays();
        CasoSeguimientoEstado estado = row.getEstado();
        return new SeguimientoBandejaRowResponse(
                row.getCasoId(),
                row.getInmuebleId(),
                row.getCuenta(),
                row.getTitular(),
                row.getDireccion(),
                row.getGrupoId(),
                row.getGrupoNombre(),
                row.getDistritoId(),
                row.getDistritoNombre(),
                row.getCuotasAdeudadas() == null ? 0 : row.getCuotasAdeudadas(),
                row.getMontoAdeudado() == null ? BigDecimal.ZERO : row.getMontoAdeudado(),
                row.getEtapaActualId(),
                row.getEtapaActualNombre(),
                estado == null ? "NO_INICIADO" : estado.name(),
                ultimo,
                dias,
                estado == null
                        ? new SeguimientoBandejaAccionesResponse(true, false, false, false, false, false, false)
                        : accionesDisponibles(estado, Boolean.TRUE.equals(row.getEtapaFinal()))
        );
    }

    private SeguimientoBandejaAccionesResponse accionesDisponibles(CasoSeguimientoEstado estado, boolean esFinal) {
        boolean abierto = estado == CasoSeguimientoEstado.ABIERTO;
        boolean pausado = estado == CasoSeguimientoEstado.PAUSADO;
        boolean cerrado = estado == CasoSeguimientoEstado.CERRADO;
        return new SeguimientoBandejaAccionesResponse(
                false,
                abierto && !esFinal,
                !cerrado,
                abierto,
                pausado,
                abierto,
                !cerrado
        );
    }
@Transactional
    public BulkActionResultResponse iniciar(List<UUID> inmuebleIds, String observacion) {
        BulkActionResultResponse result = new BulkActionResultResponse(inmuebleIds.size());
        EtapaConfig primera = etapaRepository.findFirstByActivoTrueOrderByOrdenAsc()
                .orElseThrow(() -> new BusinessRuleException("No existe etapa activa para iniciar seguimiento"));
        for (UUID id : inmuebleIds) {
            try {
                Inmueble inmueble = motor.validarInicioSeguimiento(id);
                CasoSeguimiento c = new CasoSeguimiento();
                c.setInmueble(inmueble); c.setEtapaActual(primera); c.setEstado(CasoSeguimientoEstado.ABIERTO);
                c.setFechaInicio(Instant.now()); c.setFechaUltimoMovimiento(Instant.now()); c.setObservacion(observacion);
                c.setCreatedAt(Instant.now());
                c = casoRepository.save(c);
                casoEventoService.crearEvento(c, CasoEventoTipo.INICIO_PROCESO, null, primera, observacion, null);
                auditService.log("CASO_SEGUIMIENTO", c.getId(), "INICIAR_SEGUIMIENTO", null, null, null, null, null);
                result.aplicado(id, "Seguimiento iniciado");
            } catch (Exception ex) { result.error(id, ex.getMessage()); }
        }
        return result;
    }

    @Transactional
    public BulkActionResultResponse avanzar(List<UUID> casoIds, String observacion) {
        BulkActionResultResponse result = new BulkActionResultResponse(casoIds.size());
        for (UUID id : casoIds) {
            try {
                CasoSeguimiento caso = motor.validarCasoOperable(id);
                EtapaConfig origen = caso.getEtapaActual();
                EtapaConfig siguiente = motor.validarAvanceEtapa(caso);
                caso.setEtapaActual(siguiente); caso.setFechaUltimoMovimiento(Instant.now()); caso.setUpdatedAt(Instant.now());
                casoRepository.save(caso);
                casoEventoService.crearEvento(caso, CasoEventoTipo.AVANCE_ETAPA, origen, siguiente, observacion, null);
                auditService.log("CASO_SEGUIMIENTO", caso.getId(), "AVANZAR_ETAPA", null, null, null, null, null);
                result.aplicado(id, "Etapa avanzada");
            } catch (Exception ex) { result.error(id, ex.getMessage()); }
        }
        return result;
    }

    @Transactional
    public BulkActionResultResponse enviarEtapa(EnviarEtapaRequest request) {
        BulkActionResultResponse result = new BulkActionResultResponse(request.casoIds().size());
        EtapaConfig etapaDestino = etapaRepository.findById(request.etapaDestinoId())
                .orElseThrow(() -> new BusinessRuleException("La etapa destino no existe."));
        if (!etapaDestino.isActivo()) {
            throw new BusinessRuleException("La etapa destino está inactiva.");
        }
        EtapaConfig primeraEtapa = etapaRepository.findFirstByActivoTrueOrderByOrdenAsc()
                .orElseThrow(() -> new BusinessRuleException("No existe etapa activa para operar seguimiento"));

        for (UUID id : request.casoIds()) {
            try {
                CasoSeguimiento caso = casoRepository.findById(id)
                        .orElseThrow(() -> new BusinessRuleException("Caso de seguimiento no encontrado."));
                if (caso.getEstado() == CasoSeguimientoEstado.CERRADO) {
                    result.omitido(id, "No se permiten acciones sobre procesos cerrados.");
                    continue;
                }

                EtapaConfig etapaActual = caso.getEtapaActual();
                if (etapaActual == null) {
                    if (primeraEtapa.getId().equals(etapaDestino.getId())) {
                        caso.setEtapaActual(etapaDestino);
                        caso.setFechaUltimoMovimiento(Instant.now());
                        caso.setUpdatedAt(Instant.now());
                        casoRepository.save(caso);
                        casoEventoService.crearEvento(caso, CasoEventoTipo.AVANCE_ETAPA, null, etapaDestino, request.observacion(), null);
                        auditService.log("CASO_SEGUIMIENTO", caso.getId(), "ENVIAR_ETAPA_DETERMINADA", null, null, null, null, null);
                        result.aplicado(id, "Enviado a etapa destino.");
                    } else {
                        result.omitido(id, "No se puede iniciar directamente en una etapa avanzada.");
                    }
                    continue;
                }

                if (etapaActual.getOrden() < etapaDestino.getOrden()) {
                    caso.setEtapaActual(etapaDestino);
                    caso.setFechaUltimoMovimiento(Instant.now());
                    caso.setUpdatedAt(Instant.now());
                    casoRepository.save(caso);
                    casoEventoService.crearEvento(caso, CasoEventoTipo.AVANCE_ETAPA, etapaActual, etapaDestino, request.observacion(), null);
                    auditService.log("CASO_SEGUIMIENTO", caso.getId(), "ENVIAR_ETAPA_DETERMINADA", null, null, null, null, null);
                    result.aplicado(id, "Enviado a etapa destino.");
                } else if (etapaActual.getOrden() > etapaDestino.getOrden()) {
                    result.omitido(id, "No se puede retroceder.");
                } else if (request.repetirMismaEtapa()) {
                    caso.setFechaUltimoMovimiento(Instant.now());
                    caso.setUpdatedAt(Instant.now());
                    casoRepository.save(caso);
                    casoEventoService.crearEvento(caso, CasoEventoTipo.REPETICION_ETAPA, etapaActual, etapaActual, request.observacion(), null);
                    auditService.log("CASO_SEGUIMIENTO", caso.getId(), "REPETIR_ETAPA", null, null, null, null, null);
                    result.aplicado(id, "Etapa repetida.");
                } else {
                    result.omitido(id, "El caso ya se encuentra en la etapa destino.");
                }
            } catch (Exception ex) {
                result.error(id, ex.getMessage());
            }
        }
        return result;
    }

    @Transactional
    public BulkActionResultResponse repetir(List<UUID> casoIds, String observacion) {
        BulkActionResultResponse result = new BulkActionResultResponse(casoIds.size());
        for (UUID id : casoIds) {
            try {
                CasoSeguimiento caso = motor.validarCasoOperable(id);
                motor.validarRepeticionEtapa(caso);
                caso.setFechaUltimoMovimiento(Instant.now()); caso.setUpdatedAt(Instant.now()); casoRepository.save(caso);
                casoEventoService.crearEvento(caso, CasoEventoTipo.REPETICION_ETAPA, caso.getEtapaActual(), caso.getEtapaActual(), observacion, null);
                auditService.log("CASO_SEGUIMIENTO", caso.getId(), "REPETIR_ETAPA", null, null, null, null, null);
                result.aplicado(id, "Etapa repetida");
            } catch (Exception ex) { result.error(id, ex.getMessage()); }
        }
        return result;
    }

    @Transactional
    public BulkActionResultResponse pausar(List<UUID> casoIds, String observacion) {
        BulkActionResultResponse result = new BulkActionResultResponse(casoIds.size());
        for (UUID id : casoIds) {
            try {
                CasoSeguimiento caso = motor.validarCasoOperable(id);
                motor.validarPausar(caso);
                caso.setEstado(CasoSeguimientoEstado.PAUSADO); caso.setFechaUltimoMovimiento(Instant.now()); caso.setUpdatedAt(Instant.now()); casoRepository.save(caso);
                casoEventoService.crearEvento(caso, CasoEventoTipo.OBSERVACION, caso.getEtapaActual(), caso.getEtapaActual(), observacion, objectMapper.valueToTree(Map.of("accion", "PAUSA")));
                auditService.log("CASO_SEGUIMIENTO", caso.getId(), "PAUSAR_CASO", null, null, null, null, null);
                result.aplicado(id, "Caso pausado");
            } catch (Exception ex) { result.error(id, ex.getMessage()); }
        }
        return result;
    }

    @Transactional
    public BulkActionResultResponse reabrir(List<UUID> casoIds, String observacion) {
        BulkActionResultResponse result = new BulkActionResultResponse(casoIds.size());
        for (UUID id : casoIds) {
            try {
                CasoSeguimiento caso = motor.validarCasoOperable(id);
                motor.validarReabrir(caso);
                caso.setEstado(CasoSeguimientoEstado.ABIERTO); caso.setFechaUltimoMovimiento(Instant.now()); caso.setUpdatedAt(Instant.now()); casoRepository.save(caso);
                casoEventoService.crearEvento(caso, CasoEventoTipo.OBSERVACION, caso.getEtapaActual(), caso.getEtapaActual(), observacion, objectMapper.valueToTree(Map.of("accion", "REAPERTURA")));
                auditService.log("CASO_SEGUIMIENTO", caso.getId(), "REABRIR_CASO", null, null, null, null, null);
                result.aplicado(id, "Caso reabierto");
            } catch (Exception ex) { result.error(id, ex.getMessage()); }
        }
        return result;
    }


    @Transactional(readOnly = true)
    public HistorialSeguimientoResponse getHistorialByInmueble(UUID inmuebleId) {
        Inmueble inmueble = inmuebleRepository.findById(inmuebleId)
                .orElseThrow(() -> new BusinessRuleException("Inmueble no encontrado."));
        List<CasoSeguimiento> casos = casoRepository.findByInmuebleIdOrderByFechaInicioDesc(inmuebleId);

        List<HistorialCasoResponse> casosResponse = casos.stream()
                .map(caso -> new HistorialCasoResponse(
                        caso == null ? null : caso.getId(),
                        caso.getEstado().name(),
                        caso.getEtapaActual() == null ? null : caso.getEtapaActual().getNombre(),
                        caso.getFechaInicio(),
                        caso.getFechaUltimoMovimiento(),
                        caso.getObservacion()
                )).toList();

        List<CasoEventoResponse> eventosResponse = new ArrayList<>();
        List<HistorialCierreResponse> cierresResponse = new ArrayList<>();
        List<HistorialCompromisoResponse> compromisosResponse = new ArrayList<>();

        for (CasoSeguimiento caso : casos) {
            casoEventoRepository.findByCasoSeguimientoIdOrderByFechaEventoAsc(caso.getId()).forEach(evento ->
                    eventosResponse.add(new CasoEventoResponse(
                            evento.getId(),
                            caso == null ? null : caso.getId(),
                            evento.getTipoEvento().name(),
                            evento.getEtapaOrigen() == null ? null : evento.getEtapaOrigen().getNombre(),
                            evento.getEtapaDestino() == null ? null : evento.getEtapaDestino().getNombre(),
                            evento.getFechaEvento(),
                            evento.getObservacion(),
                            evento.getMetadata()
                    )));

            procesoCierreRepository.findByCasoSeguimientoId(caso.getId()).ifPresent(cierre -> {
                Object planPago = procesoCierrePlanPagoRepository.findAll().stream()
                        .filter(x -> x.getProcesoCierre().getId().equals(cierre.getId()))
                        .findFirst()
                        .map(x -> Map.of(
                                "cantidadCuotas", x.getCantidadCuotas(),
                                "fechaVencimientoPrimeraCuota", x.getFechaVencimientoPrimeraCuota()
                        ))
                        .orElse(null);
                Object cambioParametro = procesoCierreCambioParametroRepository.findAll().stream()
                        .filter(x -> x.getProcesoCierre().getId().equals(cierre.getId()))
                        .findFirst()
                        .map(x -> Map.of(
                                "parametro", x.getParametro(),
                                "valorAnterior", x.getValorAnterior(),
                                "valorNuevo", x.getValorNuevo()
                        ))
                        .orElse(null);

                cierresResponse.add(new HistorialCierreResponse(
                        cierre.getId(),
                        caso == null ? null : caso.getId(),
                        cierre.getMotivoCierre().getCodigo(),
                        cierre.getFechaCierre(),
                        cierre.getObservacion(),
                        planPago,
                        cambioParametro
                ));
            });

            compromisoPagoRepository.findByCasoSeguimientoIdOrderByFechaDesdeDesc(caso.getId()).forEach(compromiso ->
                    compromisosResponse.add(new HistorialCompromisoResponse(
                            compromiso.getId(),
                            caso == null ? null : caso.getId(),
                            compromiso.getFechaDesde(),
                            compromiso.getFechaHasta(),
                            compromiso.getMontoComprometido(),
                            compromiso.getEstado().name(),
                            compromiso.getObservacion()
                    )));
        }

        InmuebleResumenResponse inmuebleResponse = new InmuebleResumenResponse(
                inmueble.getId(),
                inmueble.getCuenta(),
                inmueble.getTitular(),
                inmueble.getDireccion(),
                inmueble.getGrupo() == null ? null : inmueble.getGrupo().getNombre(),
                inmueble.getDistrito() == null ? null : inmueble.getDistrito().getNombre()
        );

        return new HistorialSeguimientoResponse(inmuebleResponse, casosResponse, eventosResponse, cierresResponse, compromisosResponse);
    }

    @Transactional
    public CasoSeguimiento cerrar(UUID casoId, String motivoCodigo, String observacion, java.math.BigDecimal montoAbonado, ProcesoCierreService.PlanPagoData planPago,
                                  ProcesoCierreService.CambioParametroData cambioParametro) {
        CasoSeguimiento caso = motor.validarCasoAbierto(casoId);
        MotivoCierre motivo = motor.validarCierre(caso, motivoCodigo, planPago, cambioParametro);
        procesoCierreService.crearCierre(caso, motivo, observacion, montoAbonado, planPago, cambioParametro);
        caso.setEstado(CasoSeguimientoEstado.CERRADO); caso.setFechaUltimoMovimiento(Instant.now()); caso.setUpdatedAt(Instant.now()); casoRepository.save(caso);
        casoEventoService.crearEvento(caso, CasoEventoTipo.CIERRE_PROCESO, caso.getEtapaActual(), null, observacion, objectMapper.valueToTree(Map.of("motivoCodigo", motivo.getCodigo())));
        auditService.log("CASO_SEGUIMIENTO", caso.getId(), "CERRAR_PROCESO", null, null, null, null, null);
        return caso;
    }

    @Transactional
    public BulkActionResultResponse cerrarBulk(List<UUID> casoIds, String motivoCodigo, String observacion, java.math.BigDecimal montoAbonado,
                                               ProcesoCierreService.PlanPagoData planPago,
                                               ProcesoCierreService.CambioParametroData cambioParametro) {
        BulkActionResultResponse result = new BulkActionResultResponse(casoIds.size());
        for (UUID casoId : casoIds) {
            try {
                cerrar(casoId, motivoCodigo, observacion, montoAbonado, planPago, cambioParametro);
                result.aplicado(casoId, "Proceso cerrado");
            } catch (Exception ex) {
                result.error(casoId, ex.getMessage());
            }
        }
        return result;
    }

    @Transactional
    public CompromisoPago registrarCompromiso(UUID casoId, LocalDate fechaDesde, LocalDate fechaHasta, BigDecimal monto, String observacion) {
        CasoSeguimiento caso = motor.validarCasoOperable(casoId);
        motor.validarCompromiso(caso, fechaDesde, fechaHasta, monto);
        CompromisoPago c = compromisoPagoService.crear(caso, fechaDesde, fechaHasta, monto, observacion);
        java.util.Map<String, Object> meta = new java.util.HashMap<>();
        meta.put("fechaDesde", fechaDesde.toString());
        meta.put("fechaHasta", fechaHasta.toString());
        meta.put("monto", monto);
        casoEventoService.crearEvento(caso, CasoEventoTipo.COMPROMISO_REGISTRADO, caso.getEtapaActual(), caso.getEtapaActual(), observacion,
                objectMapper.valueToTree(meta));
        auditService.log("COMPROMISO_PAGO", c.getId(), "REGISTRAR_COMPROMISO", null, null, null, null, null);
        return c;
    }

    @Transactional
    public BulkActionResultResponse registrarCompromisosBulk(List<UUID> casoIds, LocalDate fechaDesde, LocalDate fechaHasta,
                                                             BigDecimal monto, String observacion) {
        BulkActionResultResponse result = new BulkActionResultResponse(casoIds.size());
        for (UUID casoId : casoIds) {
            try {
                registrarCompromiso(casoId, fechaDesde, fechaHasta, monto, observacion);
                result.aplicado(casoId, "Compromiso registrado");
            } catch (Exception ex) {
                result.error(casoId, ex.getMessage());
            }
        }
        return result;
    }
}
