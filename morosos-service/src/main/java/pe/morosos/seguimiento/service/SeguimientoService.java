package pe.morosos.seguimiento.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import java.math.BigDecimal;
import java.time.Duration;
import java.time.Instant;
import java.time.LocalDate;
import java.util.*;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.*;
import org.springframework.stereotype.Service;
import pe.morosos.deuda.entity.CargaDeudaEstado;
import pe.morosos.seguimiento.dto.SeguimientoBandejaAccionesResponse;
import pe.morosos.seguimiento.dto.SeguimientoBandejaRowResponse;
import org.springframework.transaction.annotation.Transactional;
import pe.morosos.audit.service.AuditService;
import pe.morosos.common.exception.BusinessRuleException;
import pe.morosos.etapa.entity.EtapaConfig;
import pe.morosos.etapa.repository.EtapaConfigRepository;
import pe.morosos.inmueble.entity.Inmueble;
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

    

    @Transactional(readOnly = true)
    public Page<SeguimientoBandejaRowResponse> findBandeja(String query, UUID grupoId, UUID distritoId, UUID etapaId,
                                                           CasoSeguimientoEstado estado, Integer cuotasMin, Pageable pageable) {
        int minCuotas = cuotasMin == null ? 0 : cuotasMin;
        Optional<pe.morosos.deuda.entity.CargaDeuda> cargaOpt = cargaDeudaRepository.findFirstByEstadoInOrderByCreatedAtDesc(
                List.of(CargaDeudaEstado.COMPLETADA, CargaDeudaEstado.COMPLETADA_CON_ERRORES));

        UUID cargaId = cargaOpt.map(pe.morosos.deuda.entity.CargaDeuda::getId).orElse(null);
        List<Object[]> rows = cargaId == null ? List.of() : cargaDeudaDetalleRepository.findDeudaByCarga(cargaId);
        Map<UUID, Object[]> deudaByInmueble = new HashMap<>();
        for (Object[] r : rows) deudaByInmueble.put((UUID) r[0], r);

        List<CasoSeguimiento> casos = casoRepository.findAll();
        Map<UUID, CasoSeguimiento> casoByInmueble = new HashMap<>();
        for (CasoSeguimiento caso : casos) casoByInmueble.put(caso.getInmueble().getId(), caso);

        List<SeguimientoBandejaRowResponse> data = new ArrayList<>();
        for (Object[] r : rows) {
            UUID inmuebleId = (UUID) r[0];
            Integer cuotas = (Integer) r[1];
            BigDecimal monto = (BigDecimal) r[2];
            CasoSeguimiento caso = casoByInmueble.get(inmuebleId);
            if (cuotas != null && cuotas < minCuotas) continue;
            if (!matchesFilters(caso, query, grupoId, distritoId, etapaId, estado)) continue;
            data.add(toRow(caso, inmuebleId, cuotas, monto));
        }

        data.sort(buildComparator(pageable));
        int from = Math.min((int) pageable.getOffset(), data.size());
        int to = Math.min(from + pageable.getPageSize(), data.size());
        return new PageImpl<>(data.subList(from, to), pageable, data.size());
    }

    private boolean matchesFilters(CasoSeguimiento caso, String query, UUID grupoId, UUID distritoId, UUID etapaId, CasoSeguimientoEstado estado) {
        if (caso == null) return false;
        var i = caso.getInmueble();
        if (grupoId != null && !grupoId.equals(i.getGrupo().getId())) return false;
        if (distritoId != null && !distritoId.equals(i.getDistrito().getId())) return false;
        if (etapaId != null && (caso.getEtapaActual() == null || !etapaId.equals(caso.getEtapaActual().getId()))) return false;
        if (estado != null && caso.getEstado() != estado) return false;
        if (query != null && !query.isBlank()) {
            String q = query.toLowerCase(Locale.ROOT);
            if (!(contains(i.getCuenta(), q) || contains(i.getTitular(), q) || contains(i.getDireccion(), q))) return false;
        }
        return true;
    }

    private boolean contains(String value, String query){ return value != null && value.toLowerCase(Locale.ROOT).contains(query); }

    private SeguimientoBandejaRowResponse toRow(CasoSeguimiento caso, UUID inmuebleId, Integer cuotas, BigDecimal monto) {
        var i = caso.getInmueble();
        Instant ultimo = caso.getFechaUltimoMovimiento();
        Long dias = ultimo == null ? null : Duration.between(ultimo, Instant.now()).toDays();
        return new SeguimientoBandejaRowResponse(
                caso.getId(),
                inmuebleId,
                i.getCuenta(),
                i.getTitular(),
                i.getDireccion(),
                i.getGrupo().getId(),
                i.getGrupo().getNombre(),
                i.getDistrito().getId(),
                i.getDistrito().getNombre(),
                cuotas == null ? 0 : cuotas,
                monto == null ? BigDecimal.ZERO : monto,
                caso.getEtapaActual() == null ? null : caso.getEtapaActual().getId(),
                caso.getEtapaActual() == null ? null : caso.getEtapaActual().getNombre(),
                caso.getEstado().name(),
                ultimo,
                dias,
                accionesDisponibles(caso)
        );
    }

    private SeguimientoBandejaAccionesResponse accionesDisponibles(CasoSeguimiento caso) {
        boolean abierto = caso.getEstado() == CasoSeguimientoEstado.ABIERTO;
        boolean pausado = caso.getEstado() == CasoSeguimientoEstado.PAUSADO;
        boolean cerrado = caso.getEstado() == CasoSeguimientoEstado.CERRADO;
        boolean esFinal = caso.getEtapaActual() != null && caso.getEtapaActual().isEsFinal();
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

    private Comparator<SeguimientoBandejaRowResponse> buildComparator(Pageable pageable) {
        Comparator<SeguimientoBandejaRowResponse> cmp = Comparator.comparing(SeguimientoBandejaRowResponse::fechaUltimoMovimiento,
                Comparator.nullsLast(Comparator.naturalOrder())).reversed();
        for (Sort.Order order : pageable.getSort()) {
            Comparator<SeguimientoBandejaRowResponse> c = switch (order.getProperty()) {
                case "cuotasAdeudadas", "cuotasVencidas" -> Comparator.comparing(SeguimientoBandejaRowResponse::cuotasAdeudadas, Comparator.nullsLast(Comparator.naturalOrder()));
                case "montoAdeudado", "montoVencido" -> Comparator.comparing(SeguimientoBandejaRowResponse::montoAdeudado, Comparator.nullsLast(Comparator.naturalOrder()));
                case "fechaUltimoMovimiento" -> Comparator.comparing(SeguimientoBandejaRowResponse::fechaUltimoMovimiento, Comparator.nullsLast(Comparator.naturalOrder()));
                default -> cmp;
            };
            cmp = order.isAscending() ? c : c.reversed();
        }
        return cmp;
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

    @Transactional
    public CasoSeguimiento cerrar(UUID casoId, String motivoCodigo, String observacion, ProcesoCierreService.PlanPagoData planPago,
                                  ProcesoCierreService.CambioParametroData cambioParametro) {
        CasoSeguimiento caso = motor.validarCasoAbierto(casoId);
        MotivoCierre motivo = motor.validarCierre(caso, motivoCodigo, planPago, cambioParametro);
        procesoCierreService.crearCierre(caso, motivo, observacion, planPago, cambioParametro);
        caso.setEstado(CasoSeguimientoEstado.CERRADO); caso.setFechaUltimoMovimiento(Instant.now()); caso.setUpdatedAt(Instant.now()); casoRepository.save(caso);
        casoEventoService.crearEvento(caso, CasoEventoTipo.CIERRE_PROCESO, caso.getEtapaActual(), null, observacion, objectMapper.valueToTree(Map.of("motivoCodigo", motivo.getCodigo())));
        auditService.log("CASO_SEGUIMIENTO", caso.getId(), "CERRAR_PROCESO", null, null, null, null, null);
        return caso;
    }

    @Transactional
    public BulkActionResultResponse cerrarBulk(List<UUID> casoIds, String motivoCodigo, String observacion,
                                               ProcesoCierreService.PlanPagoData planPago,
                                               ProcesoCierreService.CambioParametroData cambioParametro) {
        BulkActionResultResponse result = new BulkActionResultResponse(casoIds.size());
        for (UUID casoId : casoIds) {
            try {
                cerrar(casoId, motivoCodigo, observacion, planPago, cambioParametro);
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
