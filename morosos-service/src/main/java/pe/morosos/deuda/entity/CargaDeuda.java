package pe.morosos.deuda.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.Table;
import java.math.BigDecimal;
import java.time.LocalDate;
import lombok.Getter;
import lombok.Setter;
import pe.morosos.common.entity.BaseEntity;

@Getter
@Setter
@Entity
@Table(name = "carga_deuda")
public class CargaDeuda extends BaseEntity {

    @Column(name = "periodo", nullable = false)
    private LocalDate periodo;

    @Enumerated(EnumType.STRING)
    @Column(name = "estado", nullable = false, length = 30)
    private CargaDeudaEstado estado;

    @Column(name = "archivo_nombre", length = 255)
    private String archivoNombre;

    @Column(name = "total_registros", nullable = false)
    private Integer totalRegistros;

    @Column(name = "procesados", nullable = false)
    private Integer procesados;

    @Column(name = "errores", nullable = false)
    private Integer errores;

    @Column(name = "monto_total", nullable = false, precision = 14, scale = 2)
    private BigDecimal montoTotal;
}
