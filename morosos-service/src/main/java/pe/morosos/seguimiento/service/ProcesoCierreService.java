package pe.morosos.seguimiento.service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.Instant;
import java.time.LocalDate;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import pe.morosos.common.exception.ValidationException;
import pe.morosos.motivocierre.entity.MotivoCierre;
import pe.morosos.seguimiento.entity.*;
import pe.morosos.seguimiento.repository.*;

@Service
@RequiredArgsConstructor
public class ProcesoCierreService {
    private final ProcesoCierreRepository cierreRepository;
    private final ProcesoCierrePlanPagoRepository planPagoRepository;
    private final ProcesoCierreCambioParametroRepository cambioParametroRepository;
    private final PlanPagoPagoRepository planPagoPagoRepository;

    public record PlanPagoData(BigDecimal montoTotalPlan, Integer cantidadTotalCuotas, Integer cantidadCuotasQuePagaAhora, LocalDate fechaVencimientoPrimeraCuota) {}
    public record CambioParametroData(String parametro, String valorAnterior, String valorNuevo) {}

    public ProcesoCierre crearCierre(CasoSeguimiento caso, MotivoCierre motivo, String observacion,
                                     java.math.BigDecimal montoAbonado, PlanPagoData planPago, CambioParametroData cambioParametro) {
        ProcesoCierre cierre = new ProcesoCierre();
        cierre.setCasoSeguimiento(caso);
        cierre.setMotivoCierre(motivo);
        cierre.setObservacion(observacion);
        cierre.setMontoAbonado(montoAbonado);
        cierre.setFechaCierre(Instant.now());
        cierre.setCreatedAt(Instant.now());
        cierre.setCreatedBy(null);
        cierre = cierreRepository.save(cierre);

        String codigo = motivo.getCodigo().toUpperCase();
        if ("PLAN_DE_PAGO".equals(codigo)) {
            if (planPago.cantidadCuotasQuePagaAhora() > planPago.cantidadTotalCuotas()) {
                throw new ValidationException("La cantidad de cuotas pagadas ahora no puede superar el total", java.util.List.of());
            }
            BigDecimal valorCuota = planPago.montoTotalPlan().divide(BigDecimal.valueOf(planPago.cantidadTotalCuotas()), 2, RoundingMode.HALF_UP);
            BigDecimal montoPagadoInicial = valorCuota.multiply(BigDecimal.valueOf(planPago.cantidadCuotasQuePagaAhora())).setScale(2, RoundingMode.HALF_UP);
            BigDecimal saldoPendiente = planPago.montoTotalPlan().subtract(montoPagadoInicial).setScale(2, RoundingMode.HALF_UP);

            ProcesoCierrePlanPago p = new ProcesoCierrePlanPago();
            p.setProcesoCierre(cierre);
            p.setCantidadCuotas(planPago.cantidadTotalCuotas());
            p.setMontoTotalPlan(planPago.montoTotalPlan().setScale(2, RoundingMode.HALF_UP));
            p.setValorCuota(valorCuota);
            p.setCuotasPagadasIniciales(planPago.cantidadCuotasQuePagaAhora());
            p.setMontoPagadoInicial(montoPagadoInicial);
            p.setSaldoPendiente(saldoPendiente);
            p.setFechaVencimientoPrimeraCuota(planPago.fechaVencimientoPrimeraCuota());
            p = planPagoRepository.save(p);

            if (planPago.cantidadCuotasQuePagaAhora() > 0) {
                PlanPagoPago pagoInicial = new PlanPagoPago();
                pagoInicial.setProcesoCierrePlanPago(p);
                pagoInicial.setFechaPago(LocalDate.now());
                pagoInicial.setCantidadCuotasPagadas(planPago.cantidadCuotasQuePagaAhora());
                pagoInicial.setMontoPagado(montoPagadoInicial);
                pagoInicial.setObservacion("Pago inicial al alta del plan");
                pagoInicial.setCreatedAt(Instant.now());
                pagoInicial.setCreatedBy(null);
                planPagoPagoRepository.save(pagoInicial);
            }
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
