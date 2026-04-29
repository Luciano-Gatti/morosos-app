package pe.morosos.seguimiento.mapper;

import org.springframework.stereotype.Component;
import pe.morosos.seguimiento.dto.CasoEventoResponse;
import pe.morosos.seguimiento.entity.CasoEvento;

@Component
public class CasoEventoMapper {

    public CasoEventoResponse toResponse(CasoEvento evento) {
        return new CasoEventoResponse(
                evento.getId(),
                evento.getCasoSeguimiento().getId(),
                evento.getTipoEvento().name(),
                evento.getEtapaOrigen() == null ? null : evento.getEtapaOrigen().getNombre(),
                evento.getEtapaDestino() == null ? null : evento.getEtapaDestino().getNombre(),
                evento.getFechaEvento(),
                evento.getObservacion(),
                evento.getMetadata()
        );
    }
}
