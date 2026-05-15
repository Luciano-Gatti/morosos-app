package pe.morosos.seguimiento.entity;

import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.UUID;
import lombok.Getter;
import lombok.Setter;
import org.hibernate.annotations.UuidGenerator;

@Getter @Setter @Entity @Table(name="proceso_cierre_plan_pago")
public class ProcesoCierrePlanPago {
 @Id @GeneratedValue @UuidGenerator private UUID id;
 @ManyToOne(fetch=FetchType.LAZY, optional=false) @JoinColumn(name="proceso_cierre_id", nullable=false) private ProcesoCierre procesoCierre;
 @Column(name="cantidad_cuotas", nullable=false) private Integer cantidadCuotas;
 @Column(name="monto_total_plan", nullable=false, precision = 14, scale = 2) private BigDecimal montoTotalPlan;
 @Column(name="valor_cuota", nullable=false, precision = 14, scale = 2) private BigDecimal valorCuota;
 @Column(name="cuotas_pagadas_iniciales", nullable=false) private Integer cuotasPagadasIniciales;
 @Column(name="monto_pagado_inicial", nullable=false, precision = 14, scale = 2) private BigDecimal montoPagadoInicial;
 @Column(name="saldo_pendiente", nullable=false, precision = 14, scale = 2) private BigDecimal saldoPendiente;
 @Column(name="fecha_vencimiento_primera_cuota", nullable=false) private LocalDate fechaVencimientoPrimeraCuota;
}
