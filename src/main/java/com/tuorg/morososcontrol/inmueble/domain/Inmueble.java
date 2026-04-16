package com.tuorg.morososcontrol.inmueble.domain;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
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

    @Column(name = "activo", nullable = false)
    private boolean activo;

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

    public boolean isActivo() {
        return activo;
    }

    public void setActivo(boolean activo) {
        this.activo = activo;
    }
}
