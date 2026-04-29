package pe.morosos.deuda.mapper;

import org.springframework.stereotype.Component;
import pe.morosos.deuda.dto.CargaDeudaDetalleResponse;
import pe.morosos.deuda.dto.CargaDeudaErrorResponse;
import pe.morosos.deuda.dto.CargaDeudaResponse;
import pe.morosos.deuda.entity.CargaDeuda;
import pe.morosos.deuda.entity.CargaDeudaDetalle;
import pe.morosos.deuda.entity.CargaDeudaError;

@Component
public class CargaDeudaMapper {

    public CargaDeudaResponse toResponse(CargaDeuda entity) {
        return new CargaDeudaResponse(
                entity.getId(),
                entity.getPeriodo(),
                entity.getEstado(),
                entity.getArchivoNombre(),
                entity.getTotalRegistros(),
                entity.getProcesados(),
                entity.getErrores(),
                entity.getMontoTotal(),
                entity.getCreatedBy(),
                entity.getCreatedAt(),
                entity.getUpdatedBy(),
                entity.getUpdatedAt()
        );
    }

    public CargaDeudaDetalleResponse toResponse(CargaDeudaDetalle entity) {
        return new CargaDeudaDetalleResponse(
                entity.getId(),
                entity.getCargaDeuda().getId(),
                entity.getInmueble().getId(),
                entity.getInmueble().getCuenta(),
                entity.getCuotasVencidas(),
                entity.getMontoVencido(),
                entity.getFechaUltimoVencimiento(),
                entity.getCreatedBy(),
                entity.getCreatedAt(),
                entity.getUpdatedBy(),
                entity.getUpdatedAt()
        );
    }

    public CargaDeudaErrorResponse toResponse(CargaDeudaError entity) {
        return new CargaDeudaErrorResponse(
                entity.getId(),
                entity.getCargaDeuda().getId(),
                entity.getFila(),
                entity.getCuenta(),
                entity.getMotivo(),
                entity.getPayload(),
                entity.getCreatedBy(),
                entity.getCreatedAt()
        );
    }
}
