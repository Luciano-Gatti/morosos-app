package com.tuorg.morososcontrol.seguimiento.api;

import com.tuorg.morososcontrol.seguimiento.api.dto.CompromisoPagoRequest;
import com.tuorg.morososcontrol.seguimiento.api.dto.CompromisoPagoResponse;
import com.tuorg.morososcontrol.seguimiento.application.CompromisoPagoService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1")
public class CompromisoPagoController {

    private final CompromisoPagoService compromisoPagoService;

    public CompromisoPagoController(CompromisoPagoService compromisoPagoService) {
        this.compromisoPagoService = compromisoPagoService;
    }

    @PostMapping("/casos-seguimiento/{casoId}/compromisos-pago")
    @ResponseStatus(HttpStatus.CREATED)
    public CompromisoPagoResponse registrarCompromiso(
            @PathVariable UUID casoId,
            @Valid @RequestBody CompromisoPagoRequest request
    ) {
        return compromisoPagoService.registrarCompromiso(casoId, request);
    }

    @PostMapping("/compromisos-pago/{compromisoId}/incumplir")
    public CompromisoPagoResponse marcarIncumplido(@PathVariable UUID compromisoId) {
        return compromisoPagoService.marcarIncumplido(compromisoId);
    }

    @GetMapping("/casos-seguimiento/{casoId}/compromisos-pago")
    public List<CompromisoPagoResponse> listarPorCaso(@PathVariable UUID casoId) {
        compromisoPagoService.actualizarCompromisosVencidos(casoId);
        return compromisoPagoService.listarPorCaso(casoId);
    }
}
