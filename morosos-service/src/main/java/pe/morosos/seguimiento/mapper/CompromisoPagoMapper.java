package pe.morosos.seguimiento.mapper;

import org.springframework.stereotype.Component;
import pe.morosos.seguimiento.dto.CompromisoPagoResponse;
import pe.morosos.seguimiento.dto.HistorialCompromisoResponse;
import pe.morosos.seguimiento.entity.CompromisoPago;

import java.util.UUID;

@Component
public class CompromisoPagoMapper {

    public HistorialCompromisoResponse toHistorial(CompromisoPago compromiso) {
        UUID casoId = null;
        if (compromiso.getCasoSeguimiento() != null) {
            casoId = compromiso.getCasoSeguimiento().getId();
        }

        return new HistorialCompromisoResponse(
                compromiso.getId(),
                casoId,
                compromiso.getFechaDesde(),
                compromiso.getFechaHasta(),
                compromiso.getMontoComprometido(),
                compromiso.getEstado().name(),
                compromiso.getObservacion(),
                compromiso.getCreatedBy()
        );
    }

    public CompromisoPagoResponse toResponse(CompromisoPago compromiso) {
        return new CompromisoPagoResponse(
                compromiso.getId(),
                compromiso.getCasoSeguimiento().getId(),
                compromiso.getFechaDesde(),
                compromiso.getFechaHasta(),
                compromiso.getMontoComprometido(),
                compromiso.getEstado().name(),
                compromiso.getObservacion()
        );
    }
}
