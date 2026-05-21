package pe.morosos.seguimiento.mapper;

import org.springframework.stereotype.Component;
import pe.morosos.seguimiento.dto.HistorialCierreResponse;
import pe.morosos.seguimiento.entity.ProcesoCierre;
import pe.morosos.motivocierre.entity.MotivoCierre;

@Component
public class ProcesoCierreMapper {

    public HistorialCierreResponse toHistorial(ProcesoCierre procesoCierre, Object pago, Object condonacion) {
        MotivoCierre motivoCierre = procesoCierre.getMotivoCierre();
        String motivoCierreNombre = motivoCierre == null
                ? "Motivo de cierre no registrado"
                : (motivoCierre.getNombre() != null ? motivoCierre.getNombre() : motivoCierre.getCodigo());

        return new HistorialCierreResponse(
                procesoCierre.getId(),
                procesoCierre.getCasoSeguimiento().getId(),
                motivoCierre == null ? null : motivoCierre.getId(),
                motivoCierre == null ? null : motivoCierre.getCodigo(),
                motivoCierreNombre,
                procesoCierre.getFechaCierre(),
                procesoCierre.getObservacion(),
                procesoCierre.getCreatedBy(),
                pago,
                condonacion
        );
    }
}
