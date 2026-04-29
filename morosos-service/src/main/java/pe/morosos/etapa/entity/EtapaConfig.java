package pe.morosos.etapa.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.Setter;
import pe.morosos.common.entity.BaseEntity;

@Getter
@Setter
@Entity
@Table(name = "etapa_config")
public class EtapaConfig extends BaseEntity {

    @Column(name = "codigo", nullable = false, unique = true, length = 50)
    private String codigo;

    @Column(name = "nombre", nullable = false, length = 150)
    private String nombre;

    @Column(name = "orden", nullable = false, unique = true)
    private Integer orden;

    @Column(name = "activo", nullable = false)
    private boolean activo = true;

    @Column(name = "es_final", nullable = false)
    private boolean esFinal = false;
}
