package pe.morosos.distrito.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.Setter;
import pe.morosos.common.entity.BaseEntity;

@Getter
@Setter
@Entity
@Table(name = "distrito")
public class Distrito extends BaseEntity {

    @Column(name = "codigo", nullable = false, unique = true, length = 50)
    private String codigo;

    @Column(name = "nombre", nullable = false, unique = true, length = 150)
    private String nombre;

    @Column(name = "activo", nullable = false)
    private boolean activo = true;
}
