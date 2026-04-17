package com.tuorg.morososcontrol.seguimiento.api;

import com.tuorg.morososcontrol.seguimiento.api.dto.CreacionMasivaCasosRequest;
import com.tuorg.morososcontrol.seguimiento.api.dto.OperacionMasivaCasosRequest;
import com.tuorg.morososcontrol.seguimiento.api.dto.OperacionMasivaCasosResponse;
import com.tuorg.morososcontrol.seguimiento.api.dto.SeleccionInmueblesRequest;
import com.tuorg.morososcontrol.seguimiento.api.dto.SeleccionInmueblesResponse;
import com.tuorg.morososcontrol.seguimiento.application.CasoSeguimientoMasivoService;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/casos-seguimiento/masivo")
public class CasoSeguimientoMasivoController {

    private final CasoSeguimientoMasivoService casoSeguimientoMasivoService;

    public CasoSeguimientoMasivoController(CasoSeguimientoMasivoService casoSeguimientoMasivoService) {
        this.casoSeguimientoMasivoService = casoSeguimientoMasivoService;
    }

    @PostMapping("/validar-inmuebles-aptos")
    public SeleccionInmueblesResponse validarInmueblesAptos(@Valid @RequestBody SeleccionInmueblesRequest request) {
        return casoSeguimientoMasivoService.validarInmueblesAptos(request);
    }

    @PostMapping("/crear")
    public OperacionMasivaCasosResponse crearCasos(@Valid @RequestBody CreacionMasivaCasosRequest request) {
        return casoSeguimientoMasivoService.crearCasos(request);
    }

    @PostMapping("/avanzar-etapa")
    public OperacionMasivaCasosResponse avanzarEtapa(@Valid @RequestBody OperacionMasivaCasosRequest request) {
        return casoSeguimientoMasivoService.avanzarEtapa(request);
    }

    @PostMapping("/repetir-etapa")
    public OperacionMasivaCasosResponse repetirEtapa(@Valid @RequestBody OperacionMasivaCasosRequest request) {
        return casoSeguimientoMasivoService.repetirEtapa(request);
    }
}
