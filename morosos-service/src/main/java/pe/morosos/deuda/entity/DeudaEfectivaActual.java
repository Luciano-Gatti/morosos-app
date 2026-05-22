package pe.morosos.deuda.entity;

import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.Instant;
import lombok.Getter;
import lombok.Setter;
import pe.morosos.common.entity.BaseEntity;
import pe.morosos.inmueble.entity.Inmueble;
import pe.morosos.seguimiento.entity.CasoSeguimiento;

@Getter
@Setter
@Entity
@Table(name = "deuda_efectiva_actual")
public class DeudaEfectivaActual extends BaseEntity {

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "inmueble_id", nullable = false, unique = true)
    private Inmueble inmueble;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "caso_seguimiento_id")
    private CasoSeguimiento casoSeguimiento;

    @Column(name = "origen", nullable = false, length = 40)
    private String origen;

    @Column(name = "cuotas_adeudadas", nullable = false)
    private Integer cuotasAdeudadas;

    @Column(name = "monto_adeudado", nullable = false, precision = 14, scale = 2)
    private BigDecimal montoAdeudado;

    @Column(name = "fecha_actualizacion", nullable = false)
    private Instant fechaActualizacion;
}
