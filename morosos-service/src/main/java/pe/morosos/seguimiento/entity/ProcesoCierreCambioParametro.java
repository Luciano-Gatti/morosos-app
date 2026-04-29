package pe.morosos.seguimiento.entity;

import jakarta.persistence.*;
import java.util.UUID;
import lombok.Getter;
import lombok.Setter;
import org.hibernate.annotations.UuidGenerator;

@Getter @Setter @Entity @Table(name="proceso_cierre_cambio_parametro")
public class ProcesoCierreCambioParametro {
 @Id @GeneratedValue @UuidGenerator private UUID id;
 @ManyToOne(fetch=FetchType.LAZY, optional=false) @JoinColumn(name="proceso_cierre_id", nullable=false) private ProcesoCierre procesoCierre;
 @Column(name="parametro", nullable=false, length=150) private String parametro;
 @Column(name="valor_anterior", nullable=false, length=500) private String valorAnterior;
 @Column(name="valor_nuevo", nullable=false, length=500) private String valorNuevo;
}
