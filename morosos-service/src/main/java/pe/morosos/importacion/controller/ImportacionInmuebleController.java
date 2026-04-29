package pe.morosos.importacion.controller;

import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.springdoc.core.annotations.ParameterObject;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import pe.morosos.importacion.dto.ImportacionInmuebleErrorResponse;
import pe.morosos.importacion.dto.ImportacionInmuebleResponse;
import pe.morosos.importacion.service.ImportacionInmuebleService;

@RestController
@RequestMapping("/api/v1/inmuebles/importaciones")
@RequiredArgsConstructor
public class ImportacionInmuebleController {
 private final ImportacionInmuebleService service;
 @PostMapping public ImportacionInmuebleResponse importar(@RequestParam("file") MultipartFile file){return service.importar(file);} 
 @GetMapping("/{id}") public ImportacionInmuebleResponse get(@PathVariable UUID id){return service.get(id);} 
 @GetMapping("/{id}/errores") public Page<ImportacionInmuebleErrorResponse> errores(@PathVariable UUID id, @ParameterObject @PageableDefault(size=50) Pageable p){return service.errores(id,p);} 
}
