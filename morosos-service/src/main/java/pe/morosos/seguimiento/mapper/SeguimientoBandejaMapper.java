package pe.morosos.seguimiento.mapper;

import java.math.BigDecimal;
import org.springframework.stereotype.Component;
import pe.morosos.deuda.entity.CargaDeudaDetalle;
import pe.morosos.seguimiento.dto.SeguimientoBandejaRowResponse;
import pe.morosos.seguimiento.entity.CasoSeguimiento;

@Component
public class SeguimientoBandejaMapper {

    public SeguimientoBandejaRowResponse toRow(CargaDeudaDetalle deudaDetalle, CasoSeguimiento caso) {
        return new SeguimientoBandejaRowResponse(
                caso == null ? null : caso.getId(),
                deudaDetalle.getInmueble().getId(),
                deudaDetalle.getInmueble().getCuenta(),
                deudaDetalle.getInmueble().getTitular(),
                deudaDetalle.getInmueble().getDireccion(),
                deudaDetalle.getInmueble().getGrupo().getId(),
                deudaDetalle.getInmueble().getGrupo().getNombre(),
                deudaDetalle.getInmueble().getDistrito().getId(),
                deudaDetalle.getInmueble().getDistrito().getNombre(),
                deudaDetalle.getCuotasVencidas(),
                deudaDetalle.getMontoVencido() == null ? BigDecimal.ZERO : deudaDetalle.getMontoVencido(),
                caso == null || caso.getEtapaActual() == null ? null : caso.getEtapaActual().getId(),
                caso == null ? null : caso.getEtapaActual().getNombre(),
                caso == null ? null : caso.getEstado().name(),
                caso == null ? null : caso.getFechaUltimoMovimiento()
        );
    }
}
