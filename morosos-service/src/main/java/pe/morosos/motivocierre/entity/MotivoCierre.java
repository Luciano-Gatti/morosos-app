package pe.morosos.motivocierre.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.Setter;
import pe.morosos.common.entity.BaseEntity;

@Getter
@Setter
@Entity
@Table(name = "motivo_cierre")
public class MotivoCierre extends BaseEntity {

    @Column(name = "codigo", nullable = false, unique = true, length = 50)
    private String codigo;

    @Column(name = "nombre", nullable = false, unique = true, length = 150)
    private String nombre;

    @Column(name = "is_system", nullable = false)
    private boolean isSystem;

    @Column(name = "activo", nullable = false)
    private boolean activo = true;
}
