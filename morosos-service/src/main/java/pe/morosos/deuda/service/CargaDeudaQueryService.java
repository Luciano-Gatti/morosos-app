package pe.morosos.deuda.service;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
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
    public Page<CargaDeudaResponse> findCargas(LocalDate periodo, CargaDeudaEstado estado, Pageable pageable) {
        validatePeriodo(periodo);
        Page<CargaDeuda> page;
        if (periodo != null && estado != null) {
            page = cargaDeudaRepository.findByPeriodoAndEstado(periodo, estado, pageable);
        } else if (periodo != null) {
            page = cargaDeudaRepository.findByPeriodo(periodo, pageable);
        } else if (estado != null) {
            page = cargaDeudaRepository.findByEstado(estado, pageable);
        } else {
            page = cargaDeudaRepository.findAll(pageable);
        }
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
    public Page<CargaDeudaDetalleResponse> findDetalles(UUID cargaId, Pageable pageable) {
        ensureCargaExists(cargaId);
        return detalleRepository.findByCargaDeudaId(cargaId, pageable)
                .map(detalle -> {
                    validateDetalle(detalle);
                    return mapper.toResponse(detalle);
                });
    }

    @Transactional(readOnly = true)
    public Page<CargaDeudaErrorResponse> findErrores(UUID cargaId, Pageable pageable) {
        ensureCargaExists(cargaId);
        return errorRepository.findByCargaDeudaId(cargaId, pageable).map(mapper::toResponse);
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
