package com.tuorg.morososcontrol.estadodeuda.api;

import com.tuorg.morososcontrol.estadodeuda.api.dto.CargaDeudaDetalleItemResponse;
import com.tuorg.morososcontrol.estadodeuda.api.dto.CargaDeudaListadoResponse;
import com.tuorg.morososcontrol.estadodeuda.api.dto.EstadoDeudaImportResponse;
import com.tuorg.morososcontrol.estadodeuda.api.dto.EstadoDeudaRequest;
import com.tuorg.morososcontrol.estadodeuda.api.dto.EstadoDeudaResponse;
import com.tuorg.morososcontrol.estadodeuda.api.dto.InmuebleEvolucionDeudaResponse;
import com.tuorg.morososcontrol.estadodeuda.api.dto.MorosoListadoResponse;
import com.tuorg.morososcontrol.estadodeuda.api.dto.ReporteMorososPorCargaResponse;
import com.tuorg.morososcontrol.estadodeuda.application.EstadoDeudaService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.server.ResponseStatusException;

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

    @PostMapping("/importacion/excel")
    public EstadoDeudaImportResponse importExcel(
            @RequestParam("file") MultipartFile file,
            @RequestParam(required = false) String observacion
    ) {
        if (file.isEmpty()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "El archivo Excel está vacío");
        }
        String contentType = file.getContentType();
        if (contentType != null && !MediaType.APPLICATION_OCTET_STREAM_VALUE.equals(contentType)
                && !contentType.equals("application/vnd.ms-excel")
                && !contentType.equals("application/vnd.openxmlformats-officedocument.spreadsheetml.sheet")) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Formato de archivo no soportado");
        }
        return estadoDeudaService.importExcel(file, observacion);
    }

    @GetMapping("/cargas")
    public List<CargaDeudaListadoResponse> listarCargas() {
        return estadoDeudaService.listarCargas();
    }

    @GetMapping("/cargas/{cargaId}")
    public List<CargaDeudaDetalleItemResponse> detalleCarga(@PathVariable UUID cargaId) {
        return estadoDeudaService.detalleCarga(cargaId);
    }


    @GetMapping("/inmuebles/historico")
    public List<InmuebleEvolucionDeudaResponse> evolucionInmueble(
            @RequestParam(required = false) UUID inmuebleId,
            @RequestParam(required = false) String numeroCuenta
    ) {
        if (inmuebleId != null) {
            return estadoDeudaService.evolucionInmueble(inmuebleId);
        }
        if (numeroCuenta != null && !numeroCuenta.isBlank()) {
            return estadoDeudaService.evolucionInmueblePorNumeroCuenta(numeroCuenta);
        }

        throw new ResponseStatusException(
                HttpStatus.BAD_REQUEST,
                "Debe enviar inmuebleId o numeroCuenta"
        );
    }

    @GetMapping("/inmuebles/{inmuebleId}/historico")
    public List<InmuebleEvolucionDeudaResponse> evolucionInmueble(@PathVariable UUID inmuebleId) {
        return estadoDeudaService.evolucionInmueble(inmuebleId);
    }


    @GetMapping("/reportes/morosos-por-carga")
    public List<ReporteMorososPorCargaResponse> reporteMorososPorCarga() {
        return estadoDeudaService.reporteMorososPorCarga();
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
