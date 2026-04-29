package pe.morosos.seguimiento.entity;

import com.fasterxml.jackson.databind.JsonNode;
import jakarta.persistence.*;
import java.time.Instant;
import java.util.UUID;
import lombok.Getter;
import lombok.Setter;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.annotations.UuidGenerator;
import org.hibernate.type.SqlTypes;
import pe.morosos.etapa.entity.EtapaConfig;

@Getter @Setter @Entity @Table(name="caso_evento")
public class CasoEvento {
 @Id @GeneratedValue @UuidGenerator private UUID id;
 @ManyToOne(fetch=FetchType.LAZY, optional=false) @JoinColumn(name="caso_seguimiento_id", nullable=false) private CasoSeguimiento casoSeguimiento;
 @Enumerated(EnumType.STRING) @Column(name="tipo_evento", nullable=false, length=50) private CasoEventoTipo tipoEvento;
 @ManyToOne(fetch=FetchType.LAZY) @JoinColumn(name="etapa_origen_id") private EtapaConfig etapaOrigen;
 @ManyToOne(fetch=FetchType.LAZY) @JoinColumn(name="etapa_destino_id") private EtapaConfig etapaDestino;
 @Column(name="fecha_evento", nullable=false) private Instant fechaEvento;
 @Column(name="observacion", columnDefinition="text") private String observacion;
 @JdbcTypeCode(SqlTypes.JSON) @Column(name="metadata", columnDefinition="jsonb") private JsonNode metadata;
 @Column(name="created_by") private UUID createdBy;
 @Column(name="created_at", nullable=false) private Instant createdAt;
}
