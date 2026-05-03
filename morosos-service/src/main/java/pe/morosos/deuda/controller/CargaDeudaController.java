package pe.morosos.deuda.controller;

import java.time.LocalDate;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.springdoc.core.annotations.ParameterObject;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;
import pe.morosos.deuda.dto.CargaDeudaDetalleResponse;
import pe.morosos.deuda.dto.CargaDeudaErrorResponse;
import pe.morosos.deuda.dto.CargaDeudaResponse;
import pe.morosos.deuda.entity.CargaDeudaEstado;
import pe.morosos.deuda.service.CargaDeudaQueryService;
import pe.morosos.deuda.service.ImportacionDeudaService;

@RestController
@RequestMapping("/api/v1/deuda/cargas")
@RequiredArgsConstructor
public class CargaDeudaController {

    private final CargaDeudaQueryService service;
    private final ImportacionDeudaService importacionDeudaService;

    @PostMapping
    public CargaDeudaResponse importar(@RequestParam("periodo") @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate periodo,
                                       @RequestParam("file") MultipartFile file) {
        return importacionDeudaService.importar(periodo, file);
    }

    @GetMapping
    public Page<CargaDeudaResponse> findCargas(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate periodo,
            @RequestParam(required = false, name = "fromDate") @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate fromDate,
            @RequestParam(required = false) CargaDeudaEstado estado,
            @RequestParam(required = false) String search,
            @ParameterObject @PageableDefault(size = 20, sort = "createdAt", direction = Sort.Direction.DESC)
            Pageable pageable
    ) {
        return service.findCargas(periodo, fromDate, estado, search, pageable);
    }

    @GetMapping("/{id}")
    public CargaDeudaResponse findById(@PathVariable UUID id) {
        return service.findCargaById(id);
    }

    @GetMapping("/{id}/detalles")
    public Page<CargaDeudaDetalleResponse> findDetalles(@PathVariable UUID id,
                                                        @RequestParam(required = false) String search,
                                                        @RequestParam(required = false) Integer cuotasMin,
                                                        @RequestParam(required = false) java.math.BigDecimal montoMin,
                                                        @ParameterObject @PageableDefault(size = 20) Pageable pageable) {
        return service.findDetalles(id, search, cuotasMin, montoMin, pageable);
    }

    @GetMapping("/{id}/errores")
    public Page<CargaDeudaErrorResponse> findErrores(@PathVariable UUID id,
                                                     @RequestParam(required = false) String search,
                                                     @ParameterObject @PageableDefault(size = 20) Pageable pageable) {
        return service.findErrores(id, search, pageable);
    }
}
