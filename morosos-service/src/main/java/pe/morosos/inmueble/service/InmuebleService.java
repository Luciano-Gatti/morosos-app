package pe.morosos.inmueble.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ObjectNode;
import java.math.BigDecimal;
import java.time.Instant;
import java.time.ZoneOffset;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import pe.morosos.common.exception.BusinessRuleException;
import pe.morosos.common.exception.ResourceNotFoundException;
import pe.morosos.distrito.entity.Distrito;
import pe.morosos.audit.service.AuditService;
import pe.morosos.distrito.repository.DistritoRepository;
import pe.morosos.grupo.entity.Grupo;
import pe.morosos.grupo.repository.GrupoRepository;
import pe.morosos.grupodistrito.entity.GrupoDistritoConfig;
import pe.morosos.inmueble.dto.InmuebleFilterRequest;
import pe.morosos.inmueble.dto.InmuebleResponse;
import pe.morosos.inmueble.dto.ResumenOperativoResponse;
import pe.morosos.inmueble.dto.InmuebleUpdateRequest;
import pe.morosos.inmueble.entity.Inmueble;
import pe.morosos.inmueble.mapper.InmuebleMapper;
import pe.morosos.inmueble.repository.GrupoDistritoConfigLookupRepository;
import pe.morosos.inmueble.repository.InmuebleRepository;
import pe.morosos.inmueble.repository.InmuebleSpecifications;
import pe.morosos.deuda.entity.CargaDeudaEstado;
import pe.morosos.deuda.entity.DeudaEfectivaActual;
import pe.morosos.deuda.repository.CargaDeudaDetalleRepository;
import pe.morosos.deuda.repository.CargaDeudaRepository;
import pe.morosos.deuda.repository.DeudaEfectivaActualRepository;
import pe.morosos.seguimiento.entity.CasoSeguimiento;
import pe.morosos.seguimiento.entity.CasoSeguimientoEstado;
import pe.morosos.seguimiento.repository.CasoEventoRepository;
import pe.morosos.seguimiento.repository.CasoSeguimientoRepository;

@Service
@RequiredArgsConstructor
public class InmuebleService {

    private final InmuebleRepository inmuebleRepository;
    private final GrupoRepository grupoRepository;
    private final DistritoRepository distritoRepository;
    private final GrupoDistritoConfigLookupRepository grupoDistritoConfigRepository;
    private final InmuebleMapper inmuebleMapper;
    private final AuditService auditService;
    private final ObjectMapper objectMapper;
    private final CasoSeguimientoRepository casoSeguimientoRepository;
    private final CasoEventoRepository casoEventoRepository;
    private final DeudaEfectivaActualRepository deudaEfectivaActualRepository;
    private final CargaDeudaRepository cargaDeudaRepository;
    private final CargaDeudaDetalleRepository cargaDeudaDetalleRepository;

    @Transactional(readOnly = true)
    public Page<InmuebleResponse> findAll(InmuebleFilterRequest filter, Pageable pageable) {
        Specification<Inmueble> spec = Specification
                .where(InmuebleSpecifications.search(filter.q(), filter.campo()))
                .and(InmuebleSpecifications.grupoEquals(filter.grupoId()))
                .and(InmuebleSpecifications.distritoEquals(filter.distritoId()))
                .and(InmuebleSpecifications.activoEquals(filter.activo()));

        return inmuebleRepository.findAll(spec, pageable).map(inmuebleMapper::toResponse);
    }

    @Transactional(readOnly = true)
    public InmuebleResponse findById(UUID id) {
        Inmueble entity = findEntity(id);
        return inmuebleMapper.toResponse(entity, buildResumenOperativo(entity.getId()));
    }

    private ResumenOperativoResponse buildResumenOperativo(UUID inmuebleId) {
        List<CasoSeguimiento> casos = casoSeguimientoRepository.findByInmuebleIdOrderByFechaInicioDesc(inmuebleId);
        CasoSeguimiento casoPrioritario = casos.stream()
                .filter(c -> c.getEstado() == CasoSeguimientoEstado.ABIERTO || c.getEstado() == CasoSeguimientoEstado.PAUSADO)
                .findFirst()
                .orElse(casos.isEmpty() ? null : casos.get(0));

        Instant ultimaGestion = null;
        UUID etapaActualId = null;
        String etapaActualNombre = null;
        String estadoProceso = null;
        if (casoPrioritario != null) {
            ultimaGestion = casoPrioritario.getFechaUltimoMovimiento();
            if (ultimaGestion == null) {
                ultimaGestion = casoEventoRepository.findByCasoSeguimientoIdOrderByFechaEventoDesc(casoPrioritario.getId())
                        .stream().findFirst().map(e -> e.getFechaEvento()).orElse(null);
            }
            if (casoPrioritario.getEtapaActual() != null) {
                etapaActualId = casoPrioritario.getEtapaActual().getId();
                etapaActualNombre = casoPrioritario.getEtapaActual().getNombre();
            }
            estadoProceso = casoPrioritario.getEstado() == null ? null : casoPrioritario.getEstado().name();
        }

        Integer periodosAdeudados = 0;
        BigDecimal montoAdeudado = BigDecimal.ZERO;
        Optional<DeudaEfectivaActual> deudaActual = deudaEfectivaActualRepository.findByInmuebleId(inmuebleId);
        if (deudaActual.isPresent()) {
            periodosAdeudados = deudaActual.get().getCuotasAdeudadas() == null ? 0 : deudaActual.get().getCuotasAdeudadas();
            montoAdeudado = deudaActual.get().getMontoAdeudado() == null ? BigDecimal.ZERO : deudaActual.get().getMontoAdeudado();
        } else {
            var detalleOpt = cargaDeudaRepository.findFirstByEstadoInOrderByCreatedAtDesc(List.of(CargaDeudaEstado.COMPLETADA, CargaDeudaEstado.COMPLETADA_CON_ERRORES))
                    .flatMap(carga -> cargaDeudaDetalleRepository.findFirstByCargaDeudaIdAndInmuebleId(carga.getId(), inmuebleId));
            if (detalleOpt.isPresent()) {
                periodosAdeudados = detalleOpt.get().getCuotasVencidas() == null ? 0 : detalleOpt.get().getCuotasVencidas();
                montoAdeudado = detalleOpt.get().getMontoVencido() == null ? BigDecimal.ZERO : detalleOpt.get().getMontoVencido();
            }
        }

        return new ResumenOperativoResponse(
                ultimaGestion == null ? null : ultimaGestion.atOffset(ZoneOffset.UTC),
                etapaActualId,
                etapaActualNombre,
                estadoProceso,
                periodosAdeudados,
                montoAdeudado
        );
    }

    @Transactional
    public InmuebleResponse update(UUID id, InmuebleUpdateRequest request) {
        Inmueble inmueble = findEntity(id);

        UUID distritoIdObjetivo = request.distritoId() != null ? request.distritoId() : inmueble.getDistrito().getId();
        UUID grupoIdObjetivo = request.grupoId() != null ? request.grupoId() : inmueble.getGrupo().getId();

        Grupo grupo = grupoRepository.findById(grupoIdObjetivo)
                .orElseThrow(() -> new ResourceNotFoundException("Grupo no encontrado"));
        Distrito distrito = distritoRepository.findById(distritoIdObjetivo)
                .orElseThrow(() -> new ResourceNotFoundException("Distrito no encontrado"));

        if (!grupo.isActivo()) {
            throw new BusinessRuleException("No se puede asignar un grupo inactivo");
        }
        if (!distrito.isActivo()) {
            throw new BusinessRuleException("No se puede asignar un distrito inactivo");
        }

        grupoDistritoConfigRepository
                .findByGrupoIdAndDistritoId(grupoIdObjetivo, distritoIdObjetivo)
                .orElseThrow(() -> new BusinessRuleException(
                        "El grupo seleccionado no está asociado al distrito seleccionado."));

        UUID grupoAnteriorId = inmueble.getGrupo().getId();
        String grupoAnteriorNombre = inmueble.getGrupo().getNombre();
        UUID distritoAnteriorId = inmueble.getDistrito().getId();
        String distritoAnteriorNombre = inmueble.getDistrito().getNombre();

        inmuebleMapper.update(inmueble, request, grupo, distrito);
        Inmueble updated = inmuebleRepository.save(inmueble);

        if (!grupoAnteriorId.equals(updated.getGrupo().getId()) || !distritoAnteriorId.equals(updated.getDistrito().getId())) {
            ObjectNode oldValues = objectMapper.createObjectNode()
                    .put("grupoId", grupoAnteriorId.toString())
                    .put("grupoNombre", grupoAnteriorNombre)
                    .put("distritoId", distritoAnteriorId.toString())
                    .put("distritoNombre", distritoAnteriorNombre);
            ObjectNode newValues = objectMapper.createObjectNode()
                    .put("grupoId", updated.getGrupo().getId().toString())
                    .put("grupoNombre", updated.getGrupo().getNombre())
                    .put("distritoId", updated.getDistrito().getId().toString())
                    .put("distritoNombre", updated.getDistrito().getNombre());
            auditService.log("INMUEBLE", updated.getId(), "INMUEBLE_GRUPO_DISTRITO_ACTUALIZADO", null, null,
                    "/api/v1/inmuebles/" + id, oldValues, newValues);
        }

        return inmuebleMapper.toResponse(updated);
    }

    @Transactional
    public InmuebleResponse updateActivo(UUID id, boolean activo) {
        Inmueble inmueble = findEntity(id);
        inmueble.setActivo(activo);
        return inmuebleMapper.toResponse(inmuebleRepository.save(inmueble));
    }

    @Transactional
    public InmuebleResponse updateSeguimientoHabilitado(UUID id, boolean seguimientoHabilitado) {
        Inmueble inmueble = findEntity(id);

        GrupoDistritoConfig config = grupoDistritoConfigRepository
                .findByGrupoIdAndDistritoId(inmueble.getGrupo().getId(), inmueble.getDistrito().getId())
                .orElseThrow(() -> new BusinessRuleException(
                        "No existe configuración para la combinación grupo-distrito del inmueble"));

        validateSeguimientoConsistency(config.isSeguimientoHabilitado(), seguimientoHabilitado);

        inmueble.setSeguimientoHabilitado(seguimientoHabilitado);
        return inmuebleMapper.toResponse(inmuebleRepository.save(inmueble));
    }

    private Inmueble findEntity(UUID id) {
        return inmuebleRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Inmueble no encontrado"));
    }

    private void validateSeguimientoConsistency(boolean reglaGeneral, boolean overrideInmueble) {
        if (!reglaGeneral && overrideInmueble) {
            throw new BusinessRuleException(
                    "Inconsistencia: no se puede habilitar seguimiento en inmueble cuando la regla general está deshabilitada"
            );
        }
    }
}
