package pe.morosos.seguimiento.entity;

import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.util.UUID;
import lombok.Getter;
import lombok.Setter;
import org.hibernate.annotations.UuidGenerator;

@Getter @Setter @Entity @Table(name="compromiso_pago")
public class CompromisoPago {
 @Id @GeneratedValue @UuidGenerator private UUID id;
 @ManyToOne(fetch=FetchType.LAZY, optional=false) @JoinColumn(name="caso_seguimiento_id", nullable=false) private CasoSeguimiento casoSeguimiento;
 @Column(name="fecha_desde", nullable=false) private LocalDate fechaDesde;
 @Column(name="fecha_hasta", nullable=false) private LocalDate fechaHasta;
 @Column(name="monto_comprometido", precision=14, scale=2) private BigDecimal montoComprometido;
 @Enumerated(EnumType.STRING) @Column(name="estado", nullable=false, length=30) private CompromisoPagoEstado estado;
 @Column(name="observacion", columnDefinition="text") private String observacion;
 @Column(name="created_by") private UUID createdBy;
 @Column(name="created_at", nullable=false) private Instant createdAt;
 @Column(name="updated_by") private UUID updatedBy;
 @Column(name="updated_at") private Instant updatedAt;
}
