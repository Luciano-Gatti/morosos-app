package com.tuorg.morososcontrol.inmueble.api;

import com.tuorg.morososcontrol.inmueble.api.dto.InmuebleCreateRequest;
import com.tuorg.morososcontrol.inmueble.api.dto.InmuebleImportResponse;
import com.tuorg.morososcontrol.inmueble.api.dto.InmuebleResponse;
import com.tuorg.morososcontrol.inmueble.application.InmuebleService;
import jakarta.validation.Valid;
import org.springframework.http.MediaType;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.DeleteMapping;
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

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/inmuebles")
public class InmuebleController {

    private final InmuebleService inmuebleService;

    public InmuebleController(InmuebleService inmuebleService) {
        this.inmuebleService = inmuebleService;
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public InmuebleResponse create(@Valid @RequestBody InmuebleCreateRequest request) {
        return inmuebleService.create(request);
    }

    @PostMapping("/importacion/excel")
    public InmuebleImportResponse importExcel(@RequestParam("file") MultipartFile file) {
        if (file.isEmpty()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "El archivo Excel está vacío");
        }
        String contentType = file.getContentType();
        if (contentType != null && !MediaType.APPLICATION_OCTET_STREAM_VALUE.equals(contentType)
                && !contentType.equals("application/vnd.ms-excel")
                && !contentType.equals("application/vnd.openxmlformats-officedocument.spreadsheetml.sheet")) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Formato de archivo no soportado");
        }
        return inmuebleService.importExcel(file);
    }

    @GetMapping("/{id}")
    public InmuebleResponse findById(@PathVariable UUID id) {
        return inmuebleService.findById(id);
    }

    @GetMapping
    public List<InmuebleResponse> findAll(
            @RequestParam(required = false) String numeroCuenta,
            @RequestParam(required = false) String propietarioNombre,
            @RequestParam(required = false) String direccionCompleta,
            @RequestParam(required = false) String distrito
    ) {
        return inmuebleService.findAll(numeroCuenta, propietarioNombre, direccionCompleta, distrito);
    }

    @PutMapping("/{id}")
    public InmuebleResponse update(@PathVariable UUID id, @Valid @RequestBody InmuebleCreateRequest request) {
        return inmuebleService.update(id, request);
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@PathVariable UUID id) {
        inmuebleService.delete(id);
    }
}
