package com.tuorg.morososcontrol.estadodeuda.domain;

import com.tuorg.morososcontrol.inmueble.domain.Inmueble;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;

import java.math.BigDecimal;
import java.util.UUID;

@Entity
@Table(
        name = "estado_deuda_historico",
        uniqueConstraints = @UniqueConstraint(
                name = "uk_estado_deuda_historico_carga_inmueble",
                columnNames = {"carga_deuda_id", "inmueble_id"}
        )
)
public class EstadoDeudaHistorico {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "carga_deuda_id", nullable = false)
    private CargaDeuda cargaDeuda;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "inmueble_id", nullable = false)
    private Inmueble inmueble;

    @Column(name = "cuotas_adeudadas", nullable = false)
    private Integer cuotasAdeudadas;

    @Column(name = "monto_adeudado", nullable = false, precision = 15, scale = 2)
    private BigDecimal montoAdeudado;

    @Column(name = "apto_para_seguimiento", nullable = false)
    private Boolean aptoParaSeguimiento;

    @Column(name = "seguimiento_habilitado_en_ese_momento", nullable = false)
    private Boolean seguimientoHabilitadoEnEseMomento;

    public UUID getId() {
        return id;
    }

    public CargaDeuda getCargaDeuda() {
        return cargaDeuda;
    }

    public void setCargaDeuda(CargaDeuda cargaDeuda) {
        this.cargaDeuda = cargaDeuda;
    }

    public Inmueble getInmueble() {
        return inmueble;
    }

    public void setInmueble(Inmueble inmueble) {
        this.inmueble = inmueble;
    }

    public Integer getCuotasAdeudadas() {
        return cuotasAdeudadas;
    }

    public void setCuotasAdeudadas(Integer cuotasAdeudadas) {
        this.cuotasAdeudadas = cuotasAdeudadas;
    }

    public BigDecimal getMontoAdeudado() {
        return montoAdeudado;
    }

    public void setMontoAdeudado(BigDecimal montoAdeudado) {
        this.montoAdeudado = montoAdeudado;
    }

    public Boolean getAptoParaSeguimiento() {
        return aptoParaSeguimiento;
    }

    public void setAptoParaSeguimiento(Boolean aptoParaSeguimiento) {
        this.aptoParaSeguimiento = aptoParaSeguimiento;
    }

    public Boolean getSeguimientoHabilitadoEnEseMomento() {
        return seguimientoHabilitadoEnEseMomento;
    }

    public void setSeguimientoHabilitadoEnEseMomento(Boolean seguimientoHabilitadoEnEseMomento) {
        this.seguimientoHabilitadoEnEseMomento = seguimientoHabilitadoEnEseMomento;
    }
}
