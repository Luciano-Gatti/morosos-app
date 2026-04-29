package pe.morosos.seguimiento;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import pe.morosos.common.api.ErrorResponse;
import pe.morosos.common.exception.BusinessRuleException;
import pe.morosos.common.exception.ConflictException;
import pe.morosos.common.exception.ResourceNotFoundException;
import pe.morosos.common.exception.ValidationException;
import pe.morosos.etapa.entity.EtapaConfig;
import pe.morosos.etapa.repository.EtapaConfigRepository;
import pe.morosos.grupodistrito.entity.GrupoDistritoConfig;
import pe.morosos.grupodistrito.repository.GrupoDistritoConfigRepository;
import pe.morosos.inmueble.entity.Inmueble;
import pe.morosos.inmueble.repository.InmuebleRepository;
import pe.morosos.motivocierre.entity.MotivoCierre;
import pe.morosos.motivocierre.repository.MotivoCierreRepository;
import pe.morosos.seguimiento.entity.CasoSeguimiento;
import pe.morosos.seguimiento.entity.CasoSeguimientoEstado;
import pe.morosos.seguimiento.repository.CasoSeguimientoRepository;
import pe.morosos.seguimiento.repository.ProcesoCierreRepository;

@Service
@RequiredArgsConstructor
public class MotorReglasSeguimiento {

    private static final String REGULARIZACION = "REGULARIZACION";
    private static final String PLAN_DE_PAGO = "PLAN_DE_PAGO";
    private static final String CAMBIO_PARAMETRO = "CAMBIO_PARAMETRO";

    private final InmuebleRepository inmuebleRepository;
    private final GrupoDistritoConfigRepository grupoDistritoConfigRepository;
    private final CasoSeguimientoRepository casoSeguimientoRepository;
    private final EtapaConfigRepository etapaConfigRepository;
    private final MotivoCierreRepository motivoCierreRepository;
    private final ProcesoCierreRepository procesoCierreRepository;

    public Inmueble validarInicioSeguimiento(UUID inmuebleId) {
        Inmueble inmueble = inmuebleRepository.findById(inmuebleId)
                .orElseThrow(() -> new ResourceNotFoundException("Inmueble no encontrado"));

        if (!inmueble.isActivo()) throw new BusinessRuleException("No se puede iniciar seguimiento: inmueble inactivo");
        if (!inmueble.isSeguimientoHabilitado()) throw new BusinessRuleException("No se puede iniciar seguimiento: inmueble con seguimiento deshabilitado");

        GrupoDistritoConfig config = grupoDistritoConfigRepository
                .findByGrupoIdAndDistritoId(inmueble.getGrupo().getId(), inmueble.getDistrito().getId())
                .orElseThrow(() -> new BusinessRuleException("No existe configuración grupo+distrito para el inmueble"));

        if (!config.isSeguimientoHabilitado()) throw new BusinessRuleException("No se puede iniciar seguimiento: configuración grupo+distrito deshabilitada");

        if (casoSeguimientoRepository.existsByInmuebleIdAndEstado(inmuebleId, CasoSeguimientoEstado.ABIERTO)) {
            throw new ConflictException("El inmueble ya tiene un caso ABIERTO");
        }

        return inmueble;
    }

    public CasoSeguimiento validarCasoOperable(UUID casoId) {
        CasoSeguimiento caso = casoSeguimientoRepository.findById(casoId)
                .orElseThrow(() -> new ResourceNotFoundException("Caso de seguimiento no encontrado"));
        if (caso.getEstado() == CasoSeguimientoEstado.CERRADO) {
            throw new ConflictException("No se permiten acciones sobre casos CERRADOS");
        }
        return caso;
    }

    public CasoSeguimiento validarCasoAbierto(UUID casoId) {
        CasoSeguimiento caso = casoSeguimientoRepository.findById(casoId)
                .orElseThrow(() -> new ResourceNotFoundException("Caso de seguimiento no encontrado"));
        if (caso.getEstado() != CasoSeguimientoEstado.ABIERTO) {
            throw new ConflictException("El caso no está ABIERTO");
        }
        return caso;
    }

    public void validarPausar(CasoSeguimiento caso) {
        if (caso.getEstado() == CasoSeguimientoEstado.CERRADO) throw new ConflictException("No se puede pausar un caso CERRADO");
        if (caso.getEstado() == CasoSeguimientoEstado.PAUSADO) throw new ConflictException("El caso ya está PAUSADO");
    }

    public void validarReabrir(CasoSeguimiento caso) {
        if (caso.getEstado() == CasoSeguimientoEstado.CERRADO) throw new ConflictException("No se puede reabrir un caso CERRADO");
        if (caso.getEstado() != CasoSeguimientoEstado.PAUSADO) throw new ConflictException("Solo se puede reabrir un caso PAUSADO");
    }

    public EtapaConfig validarAvanceEtapa(CasoSeguimiento caso) {
        if (caso.getEstado() == CasoSeguimientoEstado.CERRADO) throw new ConflictException("No se puede avanzar un caso CERRADO");
        if (caso.getEtapaActual() == null) throw new BusinessRuleException("El caso no tiene etapa actual");
        if (caso.getEtapaActual().isEsFinal()) throw new BusinessRuleException("El caso ya está en etapa final");

        return etapaConfigRepository.findFirstByOrdenGreaterThanAndActivoTrueOrderByOrdenAsc(caso.getEtapaActual().getOrden())
                .orElseThrow(() -> new BusinessRuleException("No existe una etapa siguiente activa para avanzar"));
    }

    public void validarRepeticionEtapa(CasoSeguimiento caso) {
        if (caso.getEstado() == CasoSeguimientoEstado.CERRADO) throw new ConflictException("No se puede repetir etapa en caso CERRADO");
        if (caso.getEtapaActual() == null) throw new BusinessRuleException("El caso no tiene etapa actual");
    }

    public MotivoCierre validarCierre(CasoSeguimiento caso, String motivoCodigo, Object planPago, Object cambioParametro) {
        if (caso.getEstado() == CasoSeguimientoEstado.CERRADO) throw new ConflictException("No se puede cerrar un caso ya CERRADO");
        if (procesoCierreRepository.existsByCasoSeguimientoId(caso.getId())) throw new ConflictException("El caso ya tiene proceso de cierre");

        MotivoCierre motivo = motivoCierreRepository.findByCodigoIgnoreCase(motivoCodigo)
                .orElseThrow(() -> new ResourceNotFoundException("Motivo de cierre no encontrado"));

        if (!motivo.isActivo()) throw new BusinessRuleException("El motivo de cierre está inactivo");

        String codigo = motivo.getCodigo().toUpperCase();
        switch (codigo) {
            case PLAN_DE_PAGO -> {
                if (planPago == null) throw new ValidationException("PLAN_DE_PAGO requiere detalle planPago", List.of(new ErrorResponse.Detail("planPago", "Requerido")));
                if (cambioParametro != null) throw new ValidationException("PLAN_DE_PAGO no admite cambioParametro", List.of(new ErrorResponse.Detail("cambioParametro", "No permitido")));
            }
            case CAMBIO_PARAMETRO -> {
                if (cambioParametro == null) throw new ValidationException("CAMBIO_PARAMETRO requiere detalle cambioParametro", List.of(new ErrorResponse.Detail("cambioParametro", "Requerido")));
                if (planPago != null) throw new ValidationException("CAMBIO_PARAMETRO no admite planPago", List.of(new ErrorResponse.Detail("planPago", "No permitido")));
            }
            case REGULARIZACION -> {
                if (planPago != null || cambioParametro != null) {
                    throw new ValidationException("REGULARIZACION no admite detalles", List.of(new ErrorResponse.Detail("detalle", "No permitido")));
                }
            }
            default -> {
                if (planPago != null || cambioParametro != null) {
                    throw new ValidationException("Motivo configurable no admite planPago ni cambioParametro", List.of(new ErrorResponse.Detail("detalle", "No permitido")));
                }
            }
        }
        return motivo;
    }

    public void validarCompromiso(CasoSeguimiento caso, LocalDate fechaDesde, LocalDate fechaHasta, BigDecimal montoComprometido) {
        if (caso.getEstado() == CasoSeguimientoEstado.CERRADO) throw new ConflictException("No se puede registrar compromiso sobre caso CERRADO");
        if (fechaDesde == null) throw new ValidationException("fechaDesde es obligatoria", List.of(new ErrorResponse.Detail("fechaDesde", "Requerida")));
        if (fechaHasta == null) throw new ValidationException("fechaHasta es obligatoria", List.of(new ErrorResponse.Detail("fechaHasta", "Requerida")));
        if (fechaHasta.isBefore(fechaDesde)) throw new ValidationException("fechaHasta debe ser mayor o igual a fechaDesde", List.of(new ErrorResponse.Detail("fechaHasta", "Rango inválido")));
        if (montoComprometido != null && montoComprometido.compareTo(BigDecimal.ZERO) < 0) {
            throw new ValidationException("montoComprometido no puede ser negativo", List.of(new ErrorResponse.Detail("montoComprometido", "Valor inválido")));
        }
    }
}
