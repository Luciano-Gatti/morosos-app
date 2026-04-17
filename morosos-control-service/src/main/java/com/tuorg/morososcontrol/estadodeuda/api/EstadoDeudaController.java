package com.tuorg.morososcontrol.estadodeuda.api;

import com.tuorg.morososcontrol.estadodeuda.api.dto.CargaDeudaDetalleItemResponse;
import com.tuorg.morososcontrol.estadodeuda.api.dto.CargaDeudaListadoResponse;
import com.tuorg.morososcontrol.estadodeuda.api.dto.EstadoDeudaImportExcelRequest;
import com.tuorg.morososcontrol.estadodeuda.api.dto.EstadoDeudaImportResponse;
import com.tuorg.morososcontrol.estadodeuda.api.dto.EstadoDeudaRequest;
import com.tuorg.morososcontrol.estadodeuda.api.dto.EstadoDeudaResponse;
import com.tuorg.morososcontrol.estadodeuda.api.dto.InmuebleEvolucionDeudaResponse;
import com.tuorg.morososcontrol.estadodeuda.api.dto.MorosoListadoResponse;
import com.tuorg.morososcontrol.estadodeuda.api.dto.ReporteMorososPorCargaResponse;
import com.tuorg.morososcontrol.estadodeuda.application.EstadoDeudaService;
import com.tuorg.morososcontrol.shared.dto.ApiErrorResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.media.ArraySchema;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
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
@Tag(name = "Estado de deuda", description = "Gestión de deuda, importaciones Excel y reportes de morosidad")
public class EstadoDeudaController {

    private final EstadoDeudaService estadoDeudaService;

    public EstadoDeudaController(EstadoDeudaService estadoDeudaService) {
        this.estadoDeudaService = estadoDeudaService;
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    @Operation(summary = "Crear estado de deuda", description = "Registra o actualiza el estado de deuda inicial de un inmueble.")
    @ApiResponses({
            @ApiResponse(responseCode = "201", description = "Estado de deuda creado"),
            @ApiResponse(responseCode = "400", description = "Solicitud inválida",
                    content = @Content(schema = @Schema(implementation = ApiErrorResponse.class)))
    })
    public EstadoDeudaResponse create(@Valid @RequestBody EstadoDeudaRequest request) {
        return estadoDeudaService.create(request);
    }

    @PostMapping(value = "/importacion/excel", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @Operation(
            summary = "Importar deuda desde Excel",
            description = "Procesa un archivo Excel de deuda y devuelve un resumen con actualizaciones, errores y cuentas no encontradas."
    )
    @io.swagger.v3.oas.annotations.parameters.RequestBody(
            required = true,
            content = @Content(
                    mediaType = MediaType.MULTIPART_FORM_DATA_VALUE,
                    schema = @Schema(implementation = EstadoDeudaImportExcelRequest.class)
            )
    )
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Importación procesada"),
            @ApiResponse(responseCode = "400", description = "Archivo inválido o vacío",
                    content = @Content(schema = @Schema(implementation = ApiErrorResponse.class)))
    })
    public EstadoDeudaImportResponse importExcel(
            @Parameter(hidden = true)
            @RequestParam("file") MultipartFile file,
            @Parameter(hidden = true)
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
    @Operation(summary = "Listar cargas de deuda", description = "Devuelve el historial de importaciones de deuda registradas.")
    @ApiResponse(responseCode = "200", description = "Listado de cargas")
    public List<CargaDeudaListadoResponse> listarCargas() {
        return estadoDeudaService.listarCargas();
    }

    @GetMapping("/cargas/{cargaId}")
    @Operation(summary = "Detalle de carga", description = "Obtiene el detalle de inmuebles y montos para una carga específica.")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Detalle de la carga"),
            @ApiResponse(responseCode = "404", description = "Carga no encontrada",
                    content = @Content(schema = @Schema(implementation = ApiErrorResponse.class)))
    })
    public List<CargaDeudaDetalleItemResponse> detalleCarga(@PathVariable UUID cargaId) {
        return estadoDeudaService.detalleCarga(cargaId);
    }


    @GetMapping("/inmuebles/historico")
    @Operation(
            summary = "Evolución de deuda por inmueble o cuenta",
            description = "Consulta histórico de deuda enviando `inmuebleId` o `numeroCuenta`."
    )
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Histórico encontrado"),
            @ApiResponse(responseCode = "400", description = "Falta parámetro de búsqueda",
                    content = @Content(schema = @Schema(implementation = ApiErrorResponse.class)))
    })
    public List<InmuebleEvolucionDeudaResponse> evolucionInmueble(
            @Parameter(description = "ID del inmueble a consultar")
            @RequestParam(required = false) UUID inmuebleId,
            @Parameter(description = "Número de cuenta del inmueble a consultar")
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
    @Operation(summary = "Evolución de deuda por ID de inmueble")
    @ApiResponse(responseCode = "200", description = "Histórico del inmueble")
    public List<InmuebleEvolucionDeudaResponse> evolucionInmueble(@PathVariable UUID inmuebleId) {
        return estadoDeudaService.evolucionInmueble(inmuebleId);
    }


    @GetMapping("/reportes/morosos-por-carga")
    @Operation(
            summary = "Reporte de morosos por carga",
            description = "Agrupa y resume cantidad de morosos y monto adeudado por cada carga de importación."
    )
    @ApiResponse(
            responseCode = "200",
            description = "Reporte generado",
            content = @Content(array = @ArraySchema(schema = @Schema(implementation = ReporteMorososPorCargaResponse.class)))
    )
    public List<ReporteMorososPorCargaResponse> reporteMorososPorCarga() {
        return estadoDeudaService.reporteMorososPorCarga();
    }

    @PutMapping("/{id}")
    @Operation(summary = "Actualizar estado de deuda", description = "Modifica cuotas y monto adeudado de un estado de deuda existente.")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Estado de deuda actualizado"),
            @ApiResponse(responseCode = "404", description = "Estado de deuda no encontrado",
                    content = @Content(schema = @Schema(implementation = ApiErrorResponse.class)))
    })
    public EstadoDeudaResponse update(@PathVariable UUID id, @Valid @RequestBody EstadoDeudaRequest request) {
        return estadoDeudaService.update(id, request);
    }

    @GetMapping("/{id}")
    @Operation(summary = "Obtener estado de deuda por ID")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Estado de deuda encontrado"),
            @ApiResponse(responseCode = "404", description = "Estado de deuda no encontrado",
                    content = @Content(schema = @Schema(implementation = ApiErrorResponse.class)))
    })
    public EstadoDeudaResponse findById(@PathVariable UUID id) {
        return estadoDeudaService.findById(id);
    }

    @GetMapping
    @Operation(summary = "Obtener estado de deuda por inmueble", description = "Devuelve el estado de deuda vigente para un inmueble.")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Estado de deuda encontrado"),
            @ApiResponse(responseCode = "404", description = "Inmueble sin estado de deuda",
                    content = @Content(schema = @Schema(implementation = ApiErrorResponse.class)))
    })
    public EstadoDeudaResponse findByInmueble(@RequestParam UUID inmuebleId) {
        return estadoDeudaService.findByInmueble(inmuebleId);
    }

    @GetMapping("/inmuebles/{inmuebleId}/aptitud")
    @Operation(
            summary = "Calcular aptitud para seguimiento",
            description = "Indica si el inmueble cumple reglas para habilitar gestión de seguimiento."
    )
    @ApiResponse(responseCode = "200", description = "Aptitud calculada")
    public Map<String, Object> calcularAptitud(@PathVariable UUID inmuebleId) {
        boolean apto = estadoDeudaService.calcularAptoParaSeguimiento(inmuebleId);
        return Map.of(
                "inmuebleId", inmuebleId,
                "aptoParaSeguimiento", apto
        );
    }

    @GetMapping("/morosos")
    @Operation(
            summary = "Listar morosos con filtros",
            description = "Permite consultar morosos aplicando filtros por cuenta, propietario, grupo, deuda y estado de seguimiento."
    )
    @ApiResponse(responseCode = "200", description = "Listado de morosos")
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
