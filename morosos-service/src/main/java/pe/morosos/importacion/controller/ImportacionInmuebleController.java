package pe.morosos.importacion.controller;

import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import lombok.extern.slf4j.Slf4j;
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
@Slf4j
public class ImportacionInmuebleController {
 private final ImportacionInmuebleService service;
 @PreAuthorize("hasAuthority(T(pe.morosos.security.PermissionCodes).INMUEBLES_IMPORTAR)")
 @PostMapping public ImportacionInmuebleResponse importar(@RequestParam("file") MultipartFile file){
  log.info("POST /api/v1/inmuebles/importaciones recibido: nombre='{}', tamaño={} bytes", file != null ? file.getOriginalFilename() : null, file != null ? file.getSize() : 0);
  return service.importar(file);
 } 
 @PreAuthorize("hasAuthority(T(pe.morosos.security.PermissionCodes).INMUEBLES_VER_IMPORTACIONES)")
 @GetMapping("/{id}") public ImportacionInmuebleResponse get(@PathVariable UUID id){return service.get(id);} 
 @PreAuthorize("hasAuthority(T(pe.morosos.security.PermissionCodes).INMUEBLES_VER_ERRORES_IMPORTACION)")
 @GetMapping("/{id}/errores") public Page<ImportacionInmuebleErrorResponse> errores(@PathVariable UUID id, @ParameterObject @PageableDefault(size=50) Pageable p){return service.errores(id,p);} 
}
