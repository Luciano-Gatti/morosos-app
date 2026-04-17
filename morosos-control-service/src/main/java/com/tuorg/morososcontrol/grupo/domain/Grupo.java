package com.tuorg.morososcontrol.grupo.domain;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

import java.util.UUID;

@Entity
@Table(name = "grupos")
public class Grupo {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "nombre", nullable = false, unique = true)
    private String nombre;

    @Column(name = "seguimiento_activo", nullable = false)
    private boolean seguimientoActivo;

    public UUID getId() {
        return id;
    }

    public String getNombre() {
        return nombre;
    }

    public void setNombre(String nombre) {
        this.nombre = nombre;
    }

    public boolean isSeguimientoActivo() {
        return seguimientoActivo;
    }

    public void setSeguimientoActivo(boolean seguimientoActivo) {
        this.seguimientoActivo = seguimientoActivo;
    }
}
