package pe.morosos.seguimiento.entity;

import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.util.UUID;
import lombok.Getter;
import lombok.Setter;
import org.hibernate.annotations.UuidGenerator;

@Getter @Setter @Entity @Table(name = "plan_pago_pago")
public class PlanPagoPago {
    @Id @GeneratedValue @UuidGenerator private UUID id;
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "proceso_cierre_plan_pago_id", nullable = false)
    private ProcesoCierrePlanPago procesoCierrePlanPago;
    @Column(name = "fecha_pago", nullable = false) private LocalDate fechaPago;
    @Column(name = "cantidad_cuotas_pagadas", nullable = false) private Integer cantidadCuotasPagadas;
    @Column(name = "monto_pagado", nullable = false, precision = 14, scale = 2) private BigDecimal montoPagado;
    @Column(name = "observacion") private String observacion;
    @Column(name = "created_by") private UUID createdBy;
    @Column(name = "created_at", nullable = false) private Instant createdAt;
}
