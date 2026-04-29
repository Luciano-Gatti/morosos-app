package pe.morosos.seguimiento.mapper;

import org.springframework.stereotype.Component;
import pe.morosos.seguimiento.dto.HistorialCasoResponse;
import pe.morosos.seguimiento.entity.CasoSeguimiento;

@Component
public class CasoSeguimientoMapper {

    public HistorialCasoResponse toHistorial(CasoSeguimiento caso) {
        return new HistorialCasoResponse(
                caso.getId(),
                caso.getEstado().name(),
                caso.getEtapaActual().getNombre(),
                caso.getFechaInicio(),
                caso.getFechaUltimoMovimiento(),
                caso.getObservacion()
        );
    }
}
