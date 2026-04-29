package pe.morosos.deuda.entity;

import com.fasterxml.jackson.databind.JsonNode;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EntityListeners;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
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

@Getter
@Setter
@Entity
@Table(name = "carga_deuda_error")
@EntityListeners(AuditingEntityListener.class)
public class CargaDeudaError {

    @Id
    @GeneratedValue
    @UuidGenerator
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "carga_deuda_id", nullable = false)
    private CargaDeuda cargaDeuda;

    @Column(name = "fila", nullable = false)
    private Integer fila;

    @Column(name = "cuenta", length = 50)
    private String cuenta;

    @Column(name = "motivo", nullable = false, length = 500)
    private String motivo;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "payload", columnDefinition = "jsonb")
    private JsonNode payload;

    @CreatedBy
    @Column(name = "created_by", nullable = false, length = 120)
    private String createdBy;

    @CreatedDate
    @Column(name = "created_at", nullable = false)
    private Instant createdAt;
}
