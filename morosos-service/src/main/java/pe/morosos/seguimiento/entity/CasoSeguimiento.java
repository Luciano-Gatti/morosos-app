package pe.morosos.seguimiento.entity;

import jakarta.persistence.*;
import java.time.Instant;
import java.util.UUID;
import lombok.Getter;
import lombok.Setter;
import org.hibernate.annotations.UuidGenerator;
import pe.morosos.etapa.entity.EtapaConfig;
import pe.morosos.inmueble.entity.Inmueble;

@Getter @Setter @Entity @Table(name="caso_seguimiento")
public class CasoSeguimiento {
 @Id @GeneratedValue @UuidGenerator private UUID id;
 @ManyToOne(fetch=FetchType.LAZY, optional=false) @JoinColumn(name="inmueble_id", nullable=false) private Inmueble inmueble;
 @ManyToOne(fetch=FetchType.LAZY, optional=false) @JoinColumn(name="etapa_actual_id", nullable=false) private EtapaConfig etapaActual;
 @Enumerated(EnumType.STRING) @Column(name="estado", nullable=false, length=20) private CasoSeguimientoEstado estado;
 @Column(name="fecha_inicio", nullable=false) private Instant fechaInicio;
 @Column(name="fecha_ultimo_movimiento", nullable=false) private Instant fechaUltimoMovimiento;
 @Column(name="observacion", columnDefinition="text") private String observacion;
 @Column(name="created_by") private UUID createdBy;
 @Column(name="created_at", nullable=false) private Instant createdAt;
 @Column(name="updated_by") private UUID updatedBy;
 @Column(name="updated_at") private Instant updatedAt;
}
