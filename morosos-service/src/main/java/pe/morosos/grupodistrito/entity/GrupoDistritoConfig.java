package pe.morosos.grupodistrito.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.Setter;
import pe.morosos.common.entity.BaseEntity;
import pe.morosos.distrito.entity.Distrito;
import pe.morosos.grupo.entity.Grupo;

@Getter
@Setter
@Entity
@Table(name = "grupo_distrito_config")
public class GrupoDistritoConfig extends BaseEntity {

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "grupo_id", nullable = false)
    private Grupo grupo;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "distrito_id", nullable = false)
    private Distrito distrito;

    @Column(name = "seguimiento_habilitado", nullable = false)
    private boolean seguimientoHabilitado;
}
