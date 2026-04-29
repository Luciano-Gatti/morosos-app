package pe.morosos.seguimiento.mapper;

import org.springframework.stereotype.Component;
import pe.morosos.seguimiento.dto.HistorialCierreResponse;
import pe.morosos.seguimiento.entity.ProcesoCierre;

@Component
public class ProcesoCierreMapper {

    public HistorialCierreResponse toHistorial(ProcesoCierre procesoCierre, Object pago, Object condonacion) {
        return new HistorialCierreResponse(
                procesoCierre.getId(),
                procesoCierre.getCasoSeguimiento().getId(),
                procesoCierre.getMotivoCierre().getCodigo(),
                procesoCierre.getFechaCierre(),
                procesoCierre.getObservacion(),
                pago,
                condonacion
        );
    }
}
