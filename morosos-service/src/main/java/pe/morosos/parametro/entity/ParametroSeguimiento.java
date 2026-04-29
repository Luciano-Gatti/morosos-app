package pe.morosos.parametro.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.Setter;
import pe.morosos.common.entity.BaseEntity;

@Getter
@Setter
@Entity
@Table(name = "parametro_seguimiento")
public class ParametroSeguimiento extends BaseEntity {

    @Column(name = "codigo", nullable = false, unique = true, length = 100)
    private String codigo;

    @Column(name = "valor", nullable = false, length = 500)
    private String valor;

    @Column(name = "descripcion", length = 500)
    private String descripcion;
}
