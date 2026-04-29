package pe.morosos.deuda.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import java.math.BigDecimal;
import java.time.LocalDate;
import lombok.Getter;
import lombok.Setter;
import pe.morosos.common.entity.BaseEntity;
import pe.morosos.inmueble.entity.Inmueble;

@Getter
@Setter
@Entity
@Table(name = "carga_deuda_detalle")
public class CargaDeudaDetalle extends BaseEntity {

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "carga_deuda_id", nullable = false)
    private CargaDeuda cargaDeuda;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "inmueble_id", nullable = false)
    private Inmueble inmueble;

    @Column(name = "cuotas_vencidas", nullable = false)
    private Integer cuotasVencidas;

    @Column(name = "monto_vencido", nullable = false, precision = 14, scale = 2)
    private BigDecimal montoVencido;

    @Column(name = "fecha_ultimo_vencimiento")
    private LocalDate fechaUltimoVencimiento;
}
