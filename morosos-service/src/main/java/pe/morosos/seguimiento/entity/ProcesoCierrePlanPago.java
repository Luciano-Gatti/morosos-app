package pe.morosos.seguimiento.entity;

import jakarta.persistence.*;
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
 @Column(name="fecha_vencimiento_primera_cuota", nullable=false) private LocalDate fechaVencimientoPrimeraCuota;
}
