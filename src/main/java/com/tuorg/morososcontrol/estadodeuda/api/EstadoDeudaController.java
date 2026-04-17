package com.tuorg.morososcontrol.estadodeuda.api;

import com.tuorg.morososcontrol.estadodeuda.api.dto.EstadoDeudaRequest;
import com.tuorg.morososcontrol.estadodeuda.api.dto.EstadoDeudaResponse;
import com.tuorg.morososcontrol.estadodeuda.api.dto.MorosoListadoResponse;
import com.tuorg.morososcontrol.estadodeuda.application.EstadoDeudaService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/estados-deuda")
public class EstadoDeudaController {

    private final EstadoDeudaService estadoDeudaService;

    public EstadoDeudaController(EstadoDeudaService estadoDeudaService) {
        this.estadoDeudaService = estadoDeudaService;
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public EstadoDeudaResponse create(@Valid @RequestBody EstadoDeudaRequest request) {
        return estadoDeudaService.create(request);
    }

    @PutMapping("/{id}")
    public EstadoDeudaResponse update(@PathVariable UUID id, @Valid @RequestBody EstadoDeudaRequest request) {
        return estadoDeudaService.update(id, request);
    }

    @GetMapping("/{id}")
    public EstadoDeudaResponse findById(@PathVariable UUID id) {
        return estadoDeudaService.findById(id);
    }

    @GetMapping
    public EstadoDeudaResponse findByInmueble(@RequestParam UUID inmuebleId) {
        return estadoDeudaService.findByInmueble(inmuebleId);
    }

    @GetMapping("/inmuebles/{inmuebleId}/aptitud")
    public Map<String, Object> calcularAptitud(@PathVariable UUID inmuebleId) {
        boolean apto = estadoDeudaService.calcularAptoParaSeguimiento(inmuebleId);
        return Map.of(
                "inmuebleId", inmuebleId,
                "aptoParaSeguimiento", apto
        );
    }

    @GetMapping("/morosos")
    public List<MorosoListadoResponse> listarMorosos(
            @RequestParam(required = false) String numeroCuenta,
            @RequestParam(required = false) String propietarioNombre,
            @RequestParam(required = false) String direccionCompleta,
            @RequestParam(required = false) String distrito,
            @RequestParam(required = false) String grupo,
            @RequestParam(required = false) Integer cuotasAdeudadas,
            @RequestParam(required = false) BigDecimal montoAdeudado,
            @RequestParam(required = false) Boolean seguimientoHabilitado,
            @RequestParam(required = false) Boolean aptoParaSeguimiento
    ) {
        return estadoDeudaService.listarMorosos(
                numeroCuenta,
                propietarioNombre,
                direccionCompleta,
                distrito,
                grupo,
                cuotasAdeudadas,
                montoAdeudado,
                seguimientoHabilitado,
                aptoParaSeguimiento
        );
    }
}
