package com.tuorg.morososcontrol.inmueble.domain;

import com.tuorg.morososcontrol.grupo.domain.Grupo;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;

import java.util.UUID;

@Entity
@Table(name = "inmuebles")
public class Inmueble {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "numero_cuenta", nullable = false, unique = true)
    private String numeroCuenta;

    @Column(name = "propietario_nombre", nullable = false)
    private String propietarioNombre;

    @Column(name = "distrito", nullable = false)
    private String distrito;

    @Column(name = "direccion_completa", nullable = false)
    private String direccionCompleta;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "grupo_id", nullable = false)
    private Grupo grupo;

    @Column(name = "activo", nullable = false)
    private boolean activo;

    @Column(name = "seguimiento_habilitado", nullable = false)
    private boolean seguimientoHabilitado;

    public UUID getId() {
        return id;
    }

    public String getNumeroCuenta() {
        return numeroCuenta;
    }

    public void setNumeroCuenta(String numeroCuenta) {
        this.numeroCuenta = numeroCuenta;
    }

    public String getPropietarioNombre() {
        return propietarioNombre;
    }

    public void setPropietarioNombre(String propietarioNombre) {
        this.propietarioNombre = propietarioNombre;
    }

    public String getDistrito() {
        return distrito;
    }

    public void setDistrito(String distrito) {
        this.distrito = distrito;
    }

    public String getDireccionCompleta() {
        return direccionCompleta;
    }

    public void setDireccionCompleta(String direccionCompleta) {
        this.direccionCompleta = direccionCompleta;
    }

    public Grupo getGrupo() {
        return grupo;
    }

    public void setGrupo(Grupo grupo) {
        this.grupo = grupo;
    }

    public boolean isActivo() {
        return activo;
    }

    public void setActivo(boolean activo) {
        this.activo = activo;
    }

    public boolean isSeguimientoHabilitado() {
        return seguimientoHabilitado;
    }

    public void setSeguimientoHabilitado(boolean seguimientoHabilitado) {
        this.seguimientoHabilitado = seguimientoHabilitado;
    }
}
