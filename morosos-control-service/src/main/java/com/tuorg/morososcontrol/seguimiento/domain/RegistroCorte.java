package com.tuorg.morososcontrol.seguimiento.domain;

import com.tuorg.morososcontrol.catalogo.domain.MotivoCorte;
import com.tuorg.morososcontrol.catalogo.domain.TipoCorte;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;

import java.time.LocalDate;
import java.util.UUID;

@Entity
@Table(name = "registros_corte")
public class RegistroCorte {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "caso_seguimiento_id", nullable = false)
    private CasoSeguimiento casoSeguimiento;

    @Column(name = "fecha", nullable = false)
    private LocalDate fecha;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "tipo_corte_id", nullable = false)
    private TipoCorte tipoCorte;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "motivo_corte_id", nullable = false)
    private MotivoCorte motivoCorte;

    @Column(name = "observacion")
    private String observacion;

    public UUID getId() {
        return id;
    }

    public CasoSeguimiento getCasoSeguimiento() {
        return casoSeguimiento;
    }

    public void setCasoSeguimiento(CasoSeguimiento casoSeguimiento) {
        this.casoSeguimiento = casoSeguimiento;
    }

    public LocalDate getFecha() {
        return fecha;
    }

    public void setFecha(LocalDate fecha) {
        this.fecha = fecha;
    }

    public TipoCorte getTipoCorte() {
        return tipoCorte;
    }

    public void setTipoCorte(TipoCorte tipoCorte) {
        this.tipoCorte = tipoCorte;
    }

    public MotivoCorte getMotivoCorte() {
        return motivoCorte;
    }

    public void setMotivoCorte(MotivoCorte motivoCorte) {
        this.motivoCorte = motivoCorte;
    }

    public String getObservacion() {
        return observacion;
    }

    public void setObservacion(String observacion) {
        this.observacion = observacion;
    }
}
