package pe.morosos.importacion.entity;

import com.fasterxml.jackson.databind.JsonNode;
import jakarta.persistence.*;
import java.time.Instant;
import java.util.UUID;
import lombok.Getter;
import lombok.Setter;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.annotations.UuidGenerator;
import org.hibernate.type.SqlTypes;
import org.springframework.data.annotation.CreatedBy;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

@Getter @Setter @Entity @Table(name="importacion_inmueble_error") @EntityListeners(AuditingEntityListener.class)
public class ImportacionInmuebleError {
 @Id @GeneratedValue @UuidGenerator private UUID id;
 @ManyToOne(fetch = FetchType.LAZY, optional = false) @JoinColumn(name="importacion_id", nullable=false) private ImportacionInmueble importacion;
 @Column(name="fila", nullable=false) private Integer fila;
 @Column(name="cuenta", length=50) private String cuenta;
 @Column(name="motivo", nullable=false, length=500) private String motivo;
 @JdbcTypeCode(SqlTypes.JSON) @Column(name="payload", columnDefinition="jsonb") private JsonNode payload;
 @CreatedBy @Column(name="created_by", nullable=false, length=120) private String createdBy;
 @CreatedDate @Column(name="created_at", nullable=false) private Instant createdAt;
}
