package pe.morosos.seguimiento.service;

import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneOffset;
import java.util.List;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import pe.morosos.etapa.entity.EtapaConfig;
import pe.morosos.etapa.repository.EtapaConfigRepository;
import pe.morosos.parametro.service.ParametroSeguimientoRulesService;
import pe.morosos.seguimiento.entity.CasoEvento;
import pe.morosos.seguimiento.entity.CasoEventoTipo;
import pe.morosos.seguimiento.entity.CasoSeguimientoEstado;
import pe.morosos.seguimiento.repository.CasoEventoRepository;

@Service
@RequiredArgsConstructor
public class SeguimientoFechaProgramadaService {

    private static final List<CasoEventoTipo> EVENTOS_ENTRADA_ETAPA = List.of(
            CasoEventoTipo.INICIO_PROCESO,
            CasoEventoTipo.AVANCE_ETAPA,
            CasoEventoTipo.ENVIAR_ETAPA,
            CasoEventoTipo.REPETICION_ETAPA
    );

    private final CasoEventoRepository casoEventoRepository;
    private final EtapaConfigRepository etapaConfigRepository;
    private final ParametroSeguimientoRulesService parametroRulesService;

    @Transactional(readOnly = true)
    public FechaProgramadaResultado calcular(UUIDCasoEtapa caso) {
        if (caso == null || caso.casoId() == null || caso.etapaActualId() == null) {
            return FechaProgramadaResultado.vacio(diasEntreEtapasAplicado());
        }
        if (caso.estado() == CasoSeguimientoEstado.CERRADO || Boolean.TRUE.equals(caso.etapaFinal()) || !tieneEtapaSiguiente(caso)) {
            return FechaProgramadaResultado.vacio(diasEntreEtapasAplicado());
        }

        int diasEntreEtapas = diasEntreEtapasAplicado();
        Instant fechaEntrada = buscarFechaEntradaEtapaActual(caso);
        if (fechaEntrada == null) {
            return new FechaProgramadaResultado(null, null, diasEntreEtapas);
        }

        LocalDate fechaEntradaEtapaActual = fechaEntrada.atOffset(ZoneOffset.UTC).toLocalDate();
        return new FechaProgramadaResultado(
                fechaEntradaEtapaActual,
                fechaEntradaEtapaActual.plusDays(diasEntreEtapas),
                diasEntreEtapas
        );
    }

    private boolean tieneEtapaSiguiente(UUIDCasoEtapa caso) {
        if (caso.etapaActualOrden() == null) {
            return false;
        }
        return etapaConfigRepository.findFirstByOrdenGreaterThanAndActivoTrueOrderByOrdenAsc(caso.etapaActualOrden()).isPresent();
    }

    private Instant buscarFechaEntradaEtapaActual(UUIDCasoEtapa caso) {
        return casoEventoRepository
                .findFirstByCasoSeguimientoIdAndEtapaDestinoIdAndTipoEventoInOrderByFechaEventoDesc(
                        caso.casoId(),
                        caso.etapaActualId(),
                        EVENTOS_ENTRADA_ETAPA
                )
                .map(CasoEvento::getFechaEvento)
                .orElse(null);
    }

    private int diasEntreEtapasAplicado() {
        return parametroRulesService.diasMinimosEntreEtapas();
    }

    public record UUIDCasoEtapa(
            UUID casoId,
            UUID etapaActualId,
            Integer etapaActualOrden,
            CasoSeguimientoEstado estado,
            Boolean etapaFinal
    ) {}

    public record FechaProgramadaResultado(
            LocalDate fechaEntradaEtapaActual,
            LocalDate fechaProgramada,
            Integer diasEntreEtapasAplicado
    ) {
        static FechaProgramadaResultado vacio(Integer diasEntreEtapasAplicado) {
            return new FechaProgramadaResultado(null, null, diasEntreEtapasAplicado);
        }
    }
}
