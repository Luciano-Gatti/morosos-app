package pe.morosos.deuda.service;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;
import jakarta.persistence.criteria.Predicate;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import pe.morosos.common.exception.BusinessRuleException;
import pe.morosos.common.exception.ResourceNotFoundException;
import pe.morosos.deuda.dto.CargaDeudaDetalleResponse;
import pe.morosos.deuda.dto.CargaDeudaErrorResponse;
import pe.morosos.deuda.dto.CargaDeudaResponse;
import pe.morosos.deuda.entity.CargaDeuda;
import pe.morosos.deuda.entity.CargaDeudaDetalle;
import pe.morosos.deuda.entity.CargaDeudaError;
import pe.morosos.deuda.entity.CargaDeudaEstado;
import pe.morosos.deuda.mapper.CargaDeudaMapper;
import pe.morosos.deuda.repository.CargaDeudaDetalleRepository;
import pe.morosos.deuda.repository.CargaDeudaErrorRepository;
import pe.morosos.deuda.repository.CargaDeudaRepository;

@Service
@RequiredArgsConstructor
public class CargaDeudaQueryService {

    private final CargaDeudaRepository cargaDeudaRepository;
    private final CargaDeudaDetalleRepository detalleRepository;
    private final CargaDeudaErrorRepository errorRepository;
    private final CargaDeudaMapper mapper;

    @Transactional(readOnly = true)
    public Page<CargaDeudaResponse> findCargas(LocalDate periodo, LocalDate fromDate, CargaDeudaEstado estado, String search, Pageable pageable) {
        validatePeriodo(periodo);
        Pageable normalizedPageable = normalizeCargaSort(pageable);
        Specification<CargaDeuda> spec = buildCargaSpec(periodo, fromDate, estado, search);
        Page<CargaDeuda> page = cargaDeudaRepository.findAll(spec, normalizedPageable);
        return page.map(entity -> {
            validateCarga(entity);
            return mapper.toResponse(entity);
        });
    }

    @Transactional(readOnly = true)
    public CargaDeudaResponse findCargaById(UUID id) {
        CargaDeuda carga = cargaDeudaRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Carga de deuda no encontrada"));
        validateCarga(carga);
        return mapper.toResponse(carga);
    }

    @Transactional(readOnly = true)
    public Page<CargaDeudaDetalleResponse> findDetalles(UUID cargaId, String search, Integer cuotasMin, BigDecimal montoMin, Pageable pageable) {
        ensureCargaExists(cargaId);
        Pageable normalizedPageable = normalizeDetalleSort(pageable);
        Specification<CargaDeudaDetalle> spec = buildDetalleSpec(cargaId, search, cuotasMin, montoMin);
        return detalleRepository.findAll(spec, normalizedPageable)
                .map(detalle -> {
                    validateDetalle(detalle);
                    return mapper.toResponse(detalle);
                });
    }

    @Transactional(readOnly = true)
    public Page<CargaDeudaErrorResponse> findErrores(UUID cargaId, String search, Pageable pageable) {
        ensureCargaExists(cargaId);
        Pageable normalizedPageable = normalizeErroresSort(pageable);
        Specification<CargaDeudaError> spec = buildErroresSpec(cargaId, search);
        return errorRepository.findAll(spec, normalizedPageable).map(mapper::toResponse);
    }

    private Specification<CargaDeuda> buildCargaSpec(LocalDate periodo, LocalDate fromDate, CargaDeudaEstado estado, String search) {
        return (root, query, cb) -> {
            List<Predicate> predicates = new ArrayList<>();
            if (periodo != null) predicates.add(cb.equal(root.get("periodo"), periodo));
            if (fromDate != null) predicates.add(cb.greaterThanOrEqualTo(root.get("periodo"), fromDate));
            if (estado != null) predicates.add(cb.equal(root.get("estado"), estado));
            if (search != null && !search.isBlank()) {
                String like = "%" + search.trim().toLowerCase() + "%";
                predicates.add(cb.or(
                        cb.like(cb.lower(cb.coalesce(root.get("archivoNombre"), "")), like),
                        cb.like(cb.lower(cb.coalesce(root.get("createdBy"), "")), like),
                        cb.like(cb.lower(cb.function("to_char", String.class, root.get("periodo"), cb.literal("YYYY-MM"))), like),
                        cb.like(cb.lower(cb.function("to_char", String.class, root.get("periodo"), cb.literal("MM/YYYY"))), like)
                ));
            }
            return cb.and(predicates.toArray(Predicate[]::new));
        };
    }

    private Specification<CargaDeudaDetalle> buildDetalleSpec(UUID cargaId, String search, Integer cuotasMin, BigDecimal montoMin) {
        return (root, query, cb) -> {
            List<Predicate> predicates = new ArrayList<>();
            predicates.add(cb.equal(root.get("cargaDeuda").get("id"), cargaId));
            if (cuotasMin != null) predicates.add(cb.greaterThanOrEqualTo(root.get("cuotasVencidas"), cuotasMin));
            if (montoMin != null) predicates.add(cb.greaterThanOrEqualTo(root.get("montoVencido"), montoMin));
            if (search != null && !search.isBlank()) {
                String like = "%" + search.trim().toLowerCase() + "%";
                predicates.add(cb.or(
                        cb.like(cb.lower(cb.coalesce(root.get("inmueble").get("cuenta"), "")), like),
                        cb.like(cb.lower(cb.coalesce(root.get("inmueble").get("titular"), "")), like),
                        cb.like(cb.lower(cb.coalesce(root.get("inmueble").get("direccion"), "")), like),
                        cb.like(cb.lower(cb.coalesce(root.get("inmueble").get("grupo").get("nombre"), "")), like),
                        cb.like(cb.lower(cb.coalesce(root.get("inmueble").get("distrito").get("nombre"), "")), like)
                ));
            }
            return cb.and(predicates.toArray(Predicate[]::new));
        };
    }

    private Specification<CargaDeudaError> buildErroresSpec(UUID cargaId, String search) {
        return (root, query, cb) -> {
            List<Predicate> predicates = new ArrayList<>();
            predicates.add(cb.equal(root.get("cargaDeuda").get("id"), cargaId));
            if (search != null && !search.isBlank()) {
                String like = "%" + search.trim().toLowerCase() + "%";
                predicates.add(cb.or(
                        cb.like(cb.lower(cb.coalesce(root.get("cuenta"), "")), like),
                        cb.like(cb.lower(cb.coalesce(root.get("motivo"), "")), like)
                ));
            }
            return cb.and(predicates.toArray(Predicate[]::new));
        };
    }

    private Pageable normalizeCargaSort(Pageable pageable) { return normalizeSort(pageable, "createdAt", "fecha", "createdAt", "nombre", "archivoNombre", "morosos", "totalRegistros", "montoTotal", "montoTotal", "estado", "estado"); }
    private Pageable normalizeDetalleSort(Pageable pageable) { return normalizeSort(pageable, "createdAt", "cuenta", "inmueble.cuenta", "titular", "inmueble.titular", "direccion", "inmueble.direccion", "cuotas", "cuotasVencidas", "monto", "montoVencido", "grupo", "inmueble.grupo.nombre", "distrito", "inmueble.distrito.nombre"); }
    private Pageable normalizeErroresSort(Pageable pageable) { return normalizeSort(pageable, "createdAt", "fila", "fila", "cuenta", "cuenta", "motivo", "motivo", "createdAt", "createdAt"); }

    private Pageable normalizeSort(Pageable pageable, String defaultSort, String... aliases) {
        if (pageable == null) return Pageable.ofSize(20).withPage(0).withSort(Sort.by(Sort.Direction.DESC, defaultSort));
        if (aliases.length % 2 != 0) return pageable;
        Sort sort = pageable.getSort().isSorted() ? pageable.getSort() : Sort.by(Sort.Direction.DESC, defaultSort);
        List<Sort.Order> mapped = new ArrayList<>();
        for (Sort.Order order : sort) {
            String property = order.getProperty();
            for (int i = 0; i < aliases.length; i += 2) if (aliases[i].equals(property)) property = aliases[i + 1];
            mapped.add(new Sort.Order(order.getDirection(), property));
        }
        return org.springframework.data.domain.PageRequest.of(pageable.getPageNumber(), pageable.getPageSize(), Sort.by(mapped));
    }

    private void ensureCargaExists(UUID cargaId) {
        if (!cargaDeudaRepository.existsById(cargaId)) {
            throw new ResourceNotFoundException("Carga de deuda no encontrada");
        }
    }

    private void validatePeriodo(LocalDate periodo) {
        if (periodo != null && periodo.getDayOfMonth() != 1) {
            throw new BusinessRuleException("El período debe corresponder al primer día del mes");
        }
    }

    private void validateCarga(CargaDeuda carga) {
        validatePeriodo(carga.getPeriodo());
    }

    private void validateDetalle(CargaDeudaDetalle detalle) {
        if (detalle.getCuotasVencidas() != null && detalle.getCuotasVencidas() < 0) {
            throw new BusinessRuleException("No se permiten cuotas vencidas negativas");
        }
        if (detalle.getMontoVencido() != null && detalle.getMontoVencido().compareTo(BigDecimal.ZERO) < 0) {
            throw new BusinessRuleException("No se permite monto vencido negativo");
        }
    }
}
