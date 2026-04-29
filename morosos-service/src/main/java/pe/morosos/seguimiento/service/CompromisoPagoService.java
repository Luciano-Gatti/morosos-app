package pe.morosos.seguimiento.service;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import pe.morosos.seguimiento.entity.*;
import pe.morosos.seguimiento.repository.CompromisoPagoRepository;

@Service
@RequiredArgsConstructor
public class CompromisoPagoService {
    private final CompromisoPagoRepository repository;

    public CompromisoPago crear(CasoSeguimiento caso, LocalDate desde, LocalDate hasta, BigDecimal monto, String observacion) {
        CompromisoPago c = new CompromisoPago();
        c.setCasoSeguimiento(caso);
        c.setFechaDesde(desde);
        c.setFechaHasta(hasta);
        c.setMontoComprometido(monto);
        c.setObservacion(observacion);
        c.setEstado(CompromisoPagoEstado.PENDIENTE);
        c.setCreatedAt(Instant.now());
        c.setCreatedBy(null);
        return repository.save(c);
    }
}
