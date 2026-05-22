package pe.morosos.deuda.service;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.function.Function;
import java.util.stream.Collectors;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import pe.morosos.deuda.entity.DeudaEfectivaActual;
import pe.morosos.deuda.repository.DeudaEfectivaActualRepository;
import pe.morosos.inmueble.entity.Inmueble;
import pe.morosos.seguimiento.entity.CasoSeguimiento;

@Service
@RequiredArgsConstructor
public class DeudaEfectivaService {
    private final DeudaEfectivaActualRepository repository;

    @Transactional
    public void actualizarDesdeCarga(Inmueble inmueble, Integer cuotas, BigDecimal monto) {
        upsert(inmueble, null, "CARGA_DEUDA", cuotas, monto);
    }

    @Transactional
    public void resolverPorCierre(CasoSeguimiento caso, String origen) {
        upsert(caso.getInmueble(), caso, origen, 0, BigDecimal.ZERO);
    }

    @Transactional(readOnly = true)
    public Map<UUID, DeudaEfectivaActual> obtenerPorInmuebles(List<UUID> inmuebleIds) {
        return repository.findByInmuebleIdIn(inmuebleIds).stream().collect(Collectors.toMap(d -> d.getInmueble().getId(), Function.identity()));
    }

    private void upsert(Inmueble inmueble, CasoSeguimiento caso, String origen, Integer cuotas, BigDecimal monto) {
        DeudaEfectivaActual deuda = repository.findByInmuebleId(inmueble.getId()).orElseGet(DeudaEfectivaActual::new);
        deuda.setInmueble(inmueble);
        deuda.setCasoSeguimiento(caso);
        deuda.setOrigen(origen);
        deuda.setCuotasAdeudadas(cuotas == null ? 0 : cuotas);
        deuda.setMontoAdeudado(monto == null ? BigDecimal.ZERO : monto);
        deuda.setFechaActualizacion(Instant.now());
        repository.save(deuda);
    }
}
