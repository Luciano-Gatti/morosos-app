package pe.morosos.reporte.service;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.anyList;
import static org.mockito.Mockito.*;

import java.util.*;
import org.junit.jupiter.api.Test;
import pe.morosos.audit.repository.AuditLogRepository;
import pe.morosos.deuda.entity.CargaDeuda;
import pe.morosos.deuda.repository.CargaDeudaDetalleRepository;
import pe.morosos.deuda.repository.CargaDeudaRepository;
import pe.morosos.distrito.entity.Distrito;
import pe.morosos.grupo.entity.Grupo;
import pe.morosos.inmueble.entity.Inmueble;
import pe.morosos.inmueble.repository.InmuebleRepository;
import pe.morosos.parametro.entity.ParametroSeguimiento;
import pe.morosos.parametro.repository.ParametroSeguimientoRepository;
import pe.morosos.reporte.dto.MorososGrupoDistritoResponse;

class ReporteServiceTest {
  @Test
  void clasificaPorCuotasYMantieneConsistenciaTotales() {
    var inmuebleRepo = mock(InmuebleRepository.class);
    var cargaRepo = mock(CargaDeudaRepository.class);
    var detalleRepo = mock(CargaDeudaDetalleRepository.class);
    var parametroRepo = mock(ParametroSeguimientoRepository.class);
    var auditRepo = mock(AuditLogRepository.class);
    var service = new ReporteService(inmuebleRepo, cargaRepo, detalleRepo, parametroRepo, auditRepo, null);

    var d1 = new Distrito(); d1.setId(UUID.randomUUID()); d1.setNombre("D1");
    var d2 = new Distrito(); d2.setId(UUID.randomUUID()); d2.setNombre("D2");
    var g1 = new Grupo(); g1.setId(UUID.randomUUID()); g1.setNombre("G1");

    var iAlDia = inmueble(UUID.randomUUID(), g1, d1);
    var iDeudor = inmueble(UUID.randomUUID(), g1, d1);
    var iMorosoX = inmueble(UUID.randomUUID(), g1, d2);
    var iMorosoMayor = inmueble(UUID.randomUUID(), g1, d2);

    when(inmuebleRepo.findActivosWithGrupoAndDistrito()).thenReturn(List.of(iAlDia, iDeudor, iMorosoX, iMorosoMayor));
    when(cargaRepo.findFirstByEstadoInOrderByCreatedAtDesc(anyList())).thenReturn(Optional.of(new CargaDeuda()));
    var param = new ParametroSeguimiento(); param.setValor("3");
    when(parametroRepo.findByCodigoIgnoreCase("CUOTAS_PARA_MOROSO")).thenReturn(Optional.of(param));
    when(detalleRepo.findResumenByInmuebleLatestCarga()).thenReturn(List.of(
      new Object[]{iDeudor.getId(), 2, java.math.BigDecimal.TEN},
      new Object[]{iMorosoX.getId(), 3, java.math.BigDecimal.ONE},
      new Object[]{iMorosoMayor.getId(), 6, java.math.BigDecimal.ONE}
    ));

    MorososGrupoDistritoResponse r = (MorososGrupoDistritoResponse) service.obtenerReporte("morosos-grupo-distrito", null, null, null, null, null, null, null, null, null);
    assertEquals(4, r.totalPadron());
    assertEquals(1, r.totalDeudores());
    assertEquals(2, r.totalMorosos());
    assertEquals(1, r.totalAlDia());
    assertEquals(r.totalPadron(), r.totalAlDia() + r.totalDeudores() + r.totalMorosos());
    assertEquals(3, r.parametroCuotasMoroso());
    assertEquals(2, r.porDistrito().size());
  }

  private static Inmueble inmueble(UUID id, Grupo g, Distrito d) {
    var i = new Inmueble();
    i.setId(id);
    i.setGrupo(g);
    i.setDistrito(d);
    i.setActivo(true);
    return i;
  }
}
