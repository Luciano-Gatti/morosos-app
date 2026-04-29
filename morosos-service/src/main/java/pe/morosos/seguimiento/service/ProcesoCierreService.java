package pe.morosos.seguimiento.service;

import java.time.Instant;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import pe.morosos.motivocierre.entity.MotivoCierre;
import pe.morosos.seguimiento.entity.*;
import pe.morosos.seguimiento.repository.*;

@Service
@RequiredArgsConstructor
public class ProcesoCierreService {
    private final ProcesoCierreRepository cierreRepository;
    private final ProcesoCierrePlanPagoRepository planPagoRepository;
    private final ProcesoCierreCambioParametroRepository cambioParametroRepository;

    public record PlanPagoData(Integer cantidadCuotas, java.time.LocalDate fechaVencimientoPrimeraCuota) {}
    public record CambioParametroData(String parametro, String valorAnterior, String valorNuevo) {}

    public ProcesoCierre crearCierre(CasoSeguimiento caso, MotivoCierre motivo, String observacion,
                                     PlanPagoData planPago, CambioParametroData cambioParametro) {
        ProcesoCierre cierre = new ProcesoCierre();
        cierre.setCasoSeguimiento(caso);
        cierre.setMotivoCierre(motivo);
        cierre.setObservacion(observacion);
        cierre.setFechaCierre(Instant.now());
        cierre.setCreatedAt(Instant.now());
        cierre.setCreatedBy(null);
        cierre = cierreRepository.save(cierre);

        String codigo = motivo.getCodigo().toUpperCase();
        if ("PLAN_DE_PAGO".equals(codigo)) {
            ProcesoCierrePlanPago p = new ProcesoCierrePlanPago();
            p.setProcesoCierre(cierre);
            p.setCantidadCuotas(planPago.cantidadCuotas());
            p.setFechaVencimientoPrimeraCuota(planPago.fechaVencimientoPrimeraCuota());
            planPagoRepository.save(p);
        } else if ("CAMBIO_PARAMETRO".equals(codigo)) {
            ProcesoCierreCambioParametro c = new ProcesoCierreCambioParametro();
            c.setProcesoCierre(cierre);
            c.setParametro(cambioParametro.parametro());
            c.setValorAnterior(cambioParametro.valorAnterior());
            c.setValorNuevo(cambioParametro.valorNuevo());
            cambioParametroRepository.save(c);
        }
        return cierre;
    }
}
