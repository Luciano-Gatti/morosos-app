package pe.morosos.seguimiento.entity;

import jakarta.persistence.*;
import java.time.Instant;
import java.util.UUID;
import lombok.Getter;
import lombok.Setter;
import org.hibernate.annotations.UuidGenerator;
import pe.morosos.motivocierre.entity.MotivoCierre;

@Getter @Setter @Entity @Table(name="proceso_cierre")
public class ProcesoCierre {
 @Id @GeneratedValue @UuidGenerator private UUID id;
 @ManyToOne(fetch=FetchType.LAZY, optional=false) @JoinColumn(name="caso_seguimiento_id", nullable=false) private CasoSeguimiento casoSeguimiento;
 @ManyToOne(fetch=FetchType.LAZY, optional=false) @JoinColumn(name="motivo_cierre_id", nullable=false) private MotivoCierre motivoCierre;
 @Column(name="fecha_cierre", nullable=false) private Instant fechaCierre;
 @Column(name="observacion", columnDefinition="text") private String observacion;
 @Column(name="created_by") private UUID createdBy;
 @Column(name="created_at", nullable=false) private Instant createdAt;
}
