package pe.morosos.parametro.service;

import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;
import java.util.stream.Collectors;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import pe.morosos.common.exception.ResourceNotFoundException;
import pe.morosos.deuda.entity.CargaDeuda;
import pe.morosos.deuda.entity.CargaDeudaEstado;
import pe.morosos.deuda.repository.CargaDeudaDetalleRepository;
import pe.morosos.deuda.repository.CargaDeudaRepository;
import pe.morosos.parametro.dto.ImpactoSeguimientoRequest;
import pe.morosos.parametro.dto.ImpactoSeguimientoResponse;
import pe.morosos.parametro.dto.ParametroCambioRequest;
import pe.morosos.parametro.dto.ParametroSeguimientoRequest;
import pe.morosos.parametro.dto.ParametroSeguimientoResponse;
import pe.morosos.parametro.entity.ParametroSeguimiento;
import pe.morosos.parametro.mapper.ParametroSeguimientoMapper;
import pe.morosos.parametro.repository.ParametroSeguimientoRepository;
import pe.morosos.seguimiento.entity.CasoSeguimiento;
import pe.morosos.seguimiento.entity.CasoSeguimientoEstado;
import pe.morosos.seguimiento.repository.CasoSeguimientoRepository;

@Service
@RequiredArgsConstructor
public class ParametroSeguimientoService {

    private final ParametroSeguimientoRepository repository;
    private final ParametroSeguimientoMapper mapper;
    private final CasoSeguimientoRepository casoSeguimientoRepository;
    private final CargaDeudaRepository cargaDeudaRepository;
    private final CargaDeudaDetalleRepository cargaDeudaDetalleRepository;

    @Transactional(readOnly = true)
    public List<ParametroSeguimientoResponse> findAll() {
        return repository.findAll().stream().map(mapper::toResponse).toList();
    }

    @Transactional
    public ParametroSeguimientoResponse updateByCodigo(String codigo, ParametroSeguimientoRequest request) {
        ParametroSeguimiento parametro = repository.findByCodigoIgnoreCase(codigo)
                .orElseThrow(() -> new ResourceNotFoundException("Parámetro de seguimiento no encontrado"));
        mapper.update(parametro, request);
        return mapper.toResponse(repository.save(parametro));
    }

    @Transactional(readOnly = true)
    public ImpactoSeguimientoResponse calcularImpacto(ImpactoSeguimientoRequest request) {
        Optional<ParametroCambioRequest> cambioCuotas = request.parametros().stream()
                .filter(p -> "CUOTAS_PARA_MOROSO".equalsIgnoreCase(p.clave()) || "cuotas_para_considerar_moroso".equalsIgnoreCase(p.clave()))
                .findFirst();

        if (cambioCuotas.isEmpty()) {
            return new ImpactoSeguimientoResponse(false, false, 0, 0, 0,
                    "El impacto automático para este parámetro todavía no está disponible.");
        }

        Integer nuevoUmbral = asInteger(cambioCuotas.get().valorNuevo());
        if (nuevoUmbral == null) {
            return new ImpactoSeguimientoResponse(false, false, 0, 0, 0,
                    "No se pudo calcular el impacto automático para el nuevo umbral enviado.");
        }

        List<CasoSeguimiento> abiertos = casoSeguimientoRepository.findByEstado(CasoSeguimientoEstado.ABIERTO);
        long totalAbiertos = abiertos.size();
        if (totalAbiertos == 0) {
            return new ImpactoSeguimientoResponse(false, true, 0, 0, 0,
                    "No hay procesos abiertos afectados por este cambio.");
        }

        Optional<CargaDeuda> cargaOpt = cargaDeudaRepository.findFirstByEstadoInOrderByCreatedAtDesc(
                List.of(CargaDeudaEstado.COMPLETADA, CargaDeudaEstado.COMPLETADA_CON_ERRORES));
        if (cargaOpt.isEmpty()) {
            return new ImpactoSeguimientoResponse(false, false, totalAbiertos, 0, 0,
                    "No hay una carga de deuda disponible para calcular impacto automático.");
        }

        Map<UUID, Integer> cuotasByInmueble = cargaDeudaDetalleRepository.findDeudaByCarga(cargaOpt.get().getId()).stream()
                .collect(Collectors.toMap(r -> (UUID) r[0], r -> (Integer) r[1], (left, right) -> left));

        long afectados = abiertos.stream()
                .map(caso -> cuotasByInmueble.get(caso.getInmueble().getId()))
                .filter(cuotas -> cuotas != null && cuotas < nuevoUmbral)
                .count();

        double porcentaje = totalAbiertos == 0 ? 0 : (afectados * 100d) / totalAbiertos;
        boolean hayImpacto = afectados > 0;
        String mensaje = hayImpacto
                ? afectados + " procesos abiertos dejarán de cumplir el nuevo umbral."
                : "No hay procesos abiertos afectados por este cambio.";
        return new ImpactoSeguimientoResponse(hayImpacto, true, totalAbiertos, afectados, porcentaje, mensaje);
    }

    private Integer asInteger(Object value) {
        if (value instanceof Number n) {
            return n.intValue();
        }
        if (value instanceof String s) {
            try {
                return Integer.parseInt(s.trim());
            } catch (NumberFormatException ignored) {
                return null;
            }
        }
        return null;
    }
}
