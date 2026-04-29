package pe.morosos.inmueble.entity;

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
@Table(name = "inmueble")
public class Inmueble extends BaseEntity {

    @Column(name = "cuenta", nullable = false, unique = true, length = 50)
    private String cuenta;

    @Column(name = "titular", nullable = false, length = 250)
    private String titular;

    @Column(name = "direccion", nullable = false, length = 300)
    private String direccion;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "grupo_id", nullable = false)
    private Grupo grupo;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "distrito_id", nullable = false)
    private Distrito distrito;

    @Column(name = "activo", nullable = false)
    private boolean activo = true;

    @Column(name = "seguimiento_habilitado", nullable = false)
    private boolean seguimientoHabilitado = true;

    @Column(name = "telefono", length = 50)
    private String telefono;

    @Column(name = "email", length = 150)
    private String email;

    @Column(name = "observacion", columnDefinition = "text")
    private String observacion;
}
