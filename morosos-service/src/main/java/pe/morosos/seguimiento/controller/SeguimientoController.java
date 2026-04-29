package pe.morosos.seguimiento.controller;

import jakarta.validation.Valid;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.springdoc.core.annotations.ParameterObject;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import pe.morosos.common.api.PageResponse;
import pe.morosos.seguimiento.dto.AvanzarEtapaRequest;
import pe.morosos.seguimiento.dto.BulkActionResultResponse;
import pe.morosos.seguimiento.dto.CerrarProcesoRequest;
import pe.morosos.seguimiento.dto.CompromisoPagoRequest;
import pe.morosos.seguimiento.dto.CompromisoPagoResponse;
import pe.morosos.seguimiento.dto.HistorialCasoResponse;
import pe.morosos.seguimiento.dto.HistorialSeguimientoResponse;
import pe.morosos.seguimiento.dto.IniciarSeguimientoRequest;
import pe.morosos.seguimiento.dto.PausarCasoRequest;
import pe.morosos.seguimiento.dto.ReabrirCasoRequest;
import pe.morosos.seguimiento.dto.RepetirEtapaRequest;
import pe.morosos.seguimiento.dto.SeguimientoBandejaRowResponse;
import pe.morosos.seguimiento.entity.CasoSeguimientoEstado;
import pe.morosos.seguimiento.mapper.CasoSeguimientoMapper;
import pe.morosos.seguimiento.mapper.CompromisoPagoMapper;
import pe.morosos.seguimiento.service.ProcesoCierreService;
import pe.morosos.seguimiento.service.SeguimientoService;

@RestController
@RequestMapping("/api/v1/seguimiento")
@RequiredArgsConstructor
@Validated
public class SeguimientoController {

    private final SeguimientoService seguimientoService;
    private final CasoSeguimientoMapper casoSeguimientoMapper;
    private final CompromisoPagoMapper compromisoPagoMapper;

    @GetMapping("/bandeja")
    public PageResponse<SeguimientoBandejaRowResponse> getBandeja(
            @RequestParam(required = false) String query,
            @RequestParam(required = false) UUID grupoId,
            @RequestParam(required = false) UUID distritoId,
            @RequestParam(required = false) UUID etapaId,
            @RequestParam(required = false) CasoSeguimientoEstado estado,
            @RequestParam(required = false) Integer cuotasMin,
            @ParameterObject @PageableDefault(size = 20) Pageable pageable
    ) {
        return PageResponse.from(seguimientoService.findBandeja(query, grupoId, distritoId, etapaId, estado, cuotasMin, pageable));
    }

    @PostMapping("/iniciar")
    public BulkActionResultResponse iniciar(@Valid @RequestBody IniciarSeguimientoRequest request) {
        return seguimientoService.iniciar(request.inmuebleIds(), request.observacion());
    }

    @PostMapping("/avanzar")
    public BulkActionResultResponse avanzar(@Valid @RequestBody AvanzarEtapaRequest request) {
        return seguimientoService.avanzar(request.casoIds(), request.observacion());
    }

    @PostMapping("/repetir")
    public BulkActionResultResponse repetir(@Valid @RequestBody RepetirEtapaRequest request) {
        return seguimientoService.repetir(request.casoIds(), request.observacion());
    }

    @PostMapping("/pausar")
    public BulkActionResultResponse pausar(@Valid @RequestBody PausarCasoRequest request) {
        return seguimientoService.pausar(request.casoIds(), request.observacion());
    }

    @PostMapping("/reabrir")
    public BulkActionResultResponse reabrir(@Valid @RequestBody ReabrirCasoRequest request) {
        return seguimientoService.reabrir(request.casoIds(), request.observacion());
    }

    @PostMapping("/cerrar")
    public HistorialCasoResponse cerrar(@Valid @RequestBody CerrarProcesoRequest request) {
        ProcesoCierreService.PlanPagoData planPagoData = request.planPago() == null
                ? null
                : new ProcesoCierreService.PlanPagoData(
                request.planPago().cantidadCuotas(),
                request.planPago().fechaVencimientoPrimeraCuota()
        );
        ProcesoCierreService.CambioParametroData cambioParametroData = request.cambioParametro() == null
                ? null
                : new ProcesoCierreService.CambioParametroData(
                request.cambioParametro().parametro(),
                request.cambioParametro().valorAnterior(),
                request.cambioParametro().valorNuevo()
        );

        return casoSeguimientoMapper.toHistorial(seguimientoService.cerrar(
                request.casoSeguimientoId(),
                request.motivoCodigo(),
                request.observacion(),
                planPagoData,
                cambioParametroData
        ));
    }

    @PostMapping("/compromisos")
    public CompromisoPagoResponse registrarCompromiso(@Valid @RequestBody CompromisoPagoRequest request) {
        return compromisoPagoMapper.toResponse(seguimientoService.registrarCompromiso(
                request.casoSeguimientoId(),
                request.fechaDesde(),
                request.fechaHasta(),
                request.montoComprometido(),
                request.observacion()
        ));
    }

    @GetMapping("/inmuebles/{inmuebleId}/historial")
    public HistorialSeguimientoResponse getHistorial(@PathVariable UUID inmuebleId) {
        return seguimientoService.getHistorialByInmueble(inmuebleId);
    }
}
