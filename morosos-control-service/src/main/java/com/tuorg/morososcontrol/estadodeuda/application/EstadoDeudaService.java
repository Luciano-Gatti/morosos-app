package com.tuorg.morososcontrol.estadodeuda.application;

import com.tuorg.morososcontrol.estadodeuda.api.dto.CargaDeudaDetalleItemResponse;
import com.tuorg.morososcontrol.estadodeuda.api.dto.CargaDeudaListadoResponse;
import com.tuorg.morososcontrol.estadodeuda.api.dto.EstadoDeudaImportResponse;
import com.tuorg.morososcontrol.estadodeuda.api.dto.EstadoDeudaRequest;
import com.tuorg.morososcontrol.estadodeuda.api.dto.EstadoDeudaResponse;
import com.tuorg.morososcontrol.estadodeuda.api.dto.InmuebleEvolucionDeudaResponse;
import com.tuorg.morososcontrol.estadodeuda.api.dto.MorosoListadoResponse;
import com.tuorg.morososcontrol.estadodeuda.api.dto.ReporteMorososPorCargaResponse;
import org.springframework.web.multipart.MultipartFile;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;

public interface EstadoDeudaService {

    EstadoDeudaResponse create(EstadoDeudaRequest request);

    EstadoDeudaResponse update(UUID id, EstadoDeudaRequest request);

    EstadoDeudaResponse findById(UUID id);

    EstadoDeudaResponse findByInmueble(UUID inmuebleId);

    boolean calcularAptoParaSeguimiento(UUID inmuebleId);

    List<MorosoListadoResponse> listarMorosos(
            String numeroCuenta,
            String propietarioNombre,
            String direccionCompleta,
            String distrito,
            String grupo,
            Integer cuotasAdeudadas,
            BigDecimal montoAdeudado,
            Boolean seguimientoHabilitado,
            Boolean aptoParaSeguimiento
    );

    EstadoDeudaImportResponse importExcel(MultipartFile file, String observacion);

    List<CargaDeudaListadoResponse> listarCargas();

    List<CargaDeudaDetalleItemResponse> detalleCarga(UUID cargaId);

    List<InmuebleEvolucionDeudaResponse> evolucionInmueble(UUID inmuebleId);

    List<InmuebleEvolucionDeudaResponse> evolucionInmueblePorNumeroCuenta(String numeroCuenta);

    List<ReporteMorososPorCargaResponse> reporteMorososPorCarga();
}
