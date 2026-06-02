package pe.morosos.seguimiento.service;

import com.fasterxml.jackson.databind.JsonNode;
import java.time.Instant;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import pe.morosos.seguimiento.entity.*;
import pe.morosos.seguimiento.repository.CasoEventoRepository;

@Service
@RequiredArgsConstructor
public class CasoEventoService {
    private final CasoEventoRepository repository;

    public CasoEvento crearEvento(CasoSeguimiento caso, CasoEventoTipo tipo, pe.morosos.etapa.entity.EtapaConfig etapaOrigen,
                                  pe.morosos.etapa.entity.EtapaConfig etapaDestino, String observacion, JsonNode metadata) {
        return crearEvento(caso, tipo, etapaOrigen, etapaDestino, observacion, metadata, Instant.now());
    }

    public CasoEvento crearEvento(CasoSeguimiento caso, CasoEventoTipo tipo, pe.morosos.etapa.entity.EtapaConfig etapaOrigen,
                                  pe.morosos.etapa.entity.EtapaConfig etapaDestino, String observacion, JsonNode metadata,
                                  Instant fechaEvento) {
        Instant fechaMovimiento = fechaEvento == null ? Instant.now() : fechaEvento;
        CasoEvento e = new CasoEvento();
        e.setCasoSeguimiento(caso);
        e.setTipoEvento(tipo);
        e.setEtapaOrigen(etapaOrigen);
        e.setEtapaDestino(etapaDestino);
        e.setObservacion(observacion);
        e.setMetadata(metadata);
        e.setFechaEvento(fechaMovimiento);
        e.setCreatedAt(fechaMovimiento);
        e.setCreatedBy((UUID) null);
        return repository.save(e);
    }
}
