package com.tuorg.morososcontrol.seguimiento.application;

import com.tuorg.morososcontrol.estadodeuda.application.EstadoDeudaService;
import com.tuorg.morososcontrol.inmueble.infrastructure.InmuebleRepository;
import com.tuorg.morososcontrol.seguimiento.api.dto.CasoSeguimientoCreateRequest;
import com.tuorg.morososcontrol.seguimiento.api.dto.CreacionMasivaCasosRequest;
import com.tuorg.morososcontrol.seguimiento.api.dto.InmuebleAptitudResponse;
import com.tuorg.morososcontrol.seguimiento.api.dto.OperacionMasivaCasosRequest;
import com.tuorg.morososcontrol.seguimiento.api.dto.OperacionMasivaCasosResponse;
import com.tuorg.morososcontrol.seguimiento.api.dto.SeleccionInmueblesRequest;
import com.tuorg.morososcontrol.seguimiento.api.dto.SeleccionInmueblesResponse;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.util.ArrayList;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Set;
import java.util.UUID;

@Service
public class CasoSeguimientoMasivoServiceImpl implements CasoSeguimientoMasivoService {

    private final CasoSeguimientoService casoSeguimientoService;
    private final EstadoDeudaService estadoDeudaService;
    private final InmuebleRepository inmuebleRepository;

    public CasoSeguimientoMasivoServiceImpl(
            CasoSeguimientoService casoSeguimientoService,
            EstadoDeudaService estadoDeudaService,
            InmuebleRepository inmuebleRepository
    ) {
        this.casoSeguimientoService = casoSeguimientoService;
        this.estadoDeudaService = estadoDeudaService;
        this.inmuebleRepository = inmuebleRepository;
    }

    @Override
    public SeleccionInmueblesResponse validarInmueblesAptos(SeleccionInmueblesRequest request) {
        Set<UUID> ids = normalizar(request.inmuebleIds());
        List<InmuebleAptitudResponse> resultados = new ArrayList<>();
        int aptos = 0;

        for (UUID inmuebleId : ids) {
            if (!inmuebleRepository.existsById(inmuebleId)) {
                resultados.add(new InmuebleAptitudResponse(inmuebleId, false, "Inmueble no encontrado"));
                continue;
            }

            try {
                boolean apto = estadoDeudaService.calcularAptoParaSeguimiento(inmuebleId);
                if (apto) {
                    aptos++;
                }
                resultados.add(new InmuebleAptitudResponse(inmuebleId, apto, apto ? "Apto" : "No apto para seguimiento"));
            } catch (ResponseStatusException ex) {
                resultados.add(new InmuebleAptitudResponse(inmuebleId, false, "No apto para seguimiento"));
            }
        }

        return new SeleccionInmueblesResponse(ids.size(), aptos, ids.size() - aptos, resultados);
    }

    @Override
    public OperacionMasivaCasosResponse crearCasos(CreacionMasivaCasosRequest request) {
        Set<UUID> ids = normalizar(request.inmuebleIds());
        List<UUID> procesados = new ArrayList<>();
        List<String> errores = new ArrayList<>();

        for (UUID inmuebleId : ids) {
            try {
                casoSeguimientoService.crearCaso(new CasoSeguimientoCreateRequest(inmuebleId, request.etapaInicial()));
                procesados.add(inmuebleId);
            } catch (Exception ex) {
                errores.add("Inmueble " + inmuebleId + ": " + obtenerMensaje(ex));
            }
        }

        return new OperacionMasivaCasosResponse(ids.size(), procesados.size(), errores.size(), procesados, errores);
    }

    @Override
    public OperacionMasivaCasosResponse avanzarEtapa(OperacionMasivaCasosRequest request) {
        return operarCasos(request, true);
    }

    @Override
    public OperacionMasivaCasosResponse repetirEtapa(OperacionMasivaCasosRequest request) {
        return operarCasos(request, false);
    }

    private OperacionMasivaCasosResponse operarCasos(OperacionMasivaCasosRequest request, boolean avanzar) {
        Set<UUID> ids = normalizar(request.casoIds());
        List<UUID> procesados = new ArrayList<>();
        List<String> errores = new ArrayList<>();

        for (UUID casoId : ids) {
            try {
                if (avanzar) {
                    casoSeguimientoService.avanzarEtapa(casoId);
                } else {
                    casoSeguimientoService.repetirEtapa(casoId);
                }
                procesados.add(casoId);
            } catch (Exception ex) {
                errores.add("Caso " + casoId + ": " + obtenerMensaje(ex));
            }
        }

        return new OperacionMasivaCasosResponse(ids.size(), procesados.size(), errores.size(), procesados, errores);
    }

    private Set<UUID> normalizar(List<UUID> ids) {
        return new LinkedHashSet<>(ids);
    }

    private String obtenerMensaje(Exception ex) {
        if (ex instanceof ResponseStatusException responseStatusException && responseStatusException.getReason() != null) {
            return responseStatusException.getReason();
        }
        return "Error no controlado";
    }
}
