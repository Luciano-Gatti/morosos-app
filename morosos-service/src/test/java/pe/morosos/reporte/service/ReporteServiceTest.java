package pe.morosos.reporte.service;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.anyList;
import static org.mockito.Mockito.*;

import java.math.BigDecimal;
import java.util.*;
import org.junit.jupiter.api.Test;
import pe.morosos.audit.repository.AuditLogRepository;
import pe.morosos.deuda.entity.CargaDeuda;
import pe.morosos.deuda.repository.CargaDeudaDetalleRepository;
import pe.morosos.deuda.repository.CargaDeudaRepository;
import pe.morosos.deuda.repository.DeudaEfectivaActualRepository;
import pe.morosos.deuda.service.ClasificacionDeudaService;
import pe.morosos.distrito.entity.Distrito;
import pe.morosos.grupo.entity.Grupo;
import pe.morosos.inmueble.entity.Inmueble;
import pe.morosos.inmueble.repository.InmuebleRepository;
import pe.morosos.parametro.service.ParametroSeguimientoRulesService;
import pe.morosos.reporte.dto.EstadoInmueblesResponse;
import pe.morosos.reporte.dto.MorososGrupoDistritoResponse;

class ReporteServiceTest {
  @Test
  void clasificaPorCuotasYMantieneConsistenciaTotales() {
    TestFixture fixture = fixtureConUmbral(3);

    MorososGrupoDistritoResponse r = (MorososGrupoDistritoResponse) fixture.service.obtenerReporte("morosos-grupo-distrito", null, null, null, null, null, null, null, null, null);
    assertEquals(4, r.totalPadron());
    assertEquals(1, r.totalDeudores());
    assertEquals(2, r.totalMorosos());
    assertEquals(1, r.totalAlDia());
    assertEquals(r.totalPadron(), r.totalAlDia() + r.totalDeudores() + r.totalMorosos());
    assertEquals(3, r.parametroCuotasMoroso());
    assertEquals(2, r.porDistrito().size());
  }

  @Test
  void estadoInmueblesUsaMismoUmbralQueMorososGrupoDistrito() {
    TestFixture fixture = fixtureConUmbral(5);

    MorososGrupoDistritoResponse dashboardComparable = (MorososGrupoDistritoResponse) fixture.service.obtenerReporte("morosos-grupo-distrito", null, null, null, null, null, null, null, null, null);
    EstadoInmueblesResponse estado = (EstadoInmueblesResponse) fixture.service.obtenerReporte("estado-inmuebles", null, null, null, null, null, null, null, null, null);

    assertEquals(dashboardComparable.totalPadron(), estado.totales().totalInmuebles());
    assertEquals(dashboardComparable.totalAlDia(), estado.totales().alDia());
    assertEquals(dashboardComparable.totalDeudores(), estado.totales().deudores());
    assertEquals(dashboardComparable.totalMorosos(), estado.totales().morosos());
  }

  private static TestFixture fixtureConUmbral(int umbral) {
    var inmuebleRepo = mock(InmuebleRepository.class);
    var cargaRepo = mock(CargaDeudaRepository.class);
    var detalleRepo = mock(CargaDeudaDetalleRepository.class);
    var deudaEfectivaRepo = mock(DeudaEfectivaActualRepository.class);
    var rules = mock(ParametroSeguimientoRulesService.class);
    var auditRepo = mock(AuditLogRepository.class);
    var service = new ReporteService(inmuebleRepo, cargaRepo, detalleRepo, deudaEfectivaRepo, rules,
            new ClasificacionDeudaService(), auditRepo, null);

    var d1 = new Distrito(); d1.setId(UUID.randomUUID()); d1.setNombre("D1");
    var d2 = new Distrito(); d2.setId(UUID.randomUUID()); d2.setNombre("D2");
    var g1 = new Grupo(); g1.setId(UUID.randomUUID()); g1.setNombre("G1");

    var iAlDia = inmueble(UUID.randomUUID(), g1, d1, "001");
    var iDeudor = inmueble(UUID.randomUUID(), g1, d1, "002");
    var iMorosoX = inmueble(UUID.randomUUID(), g1, d2, "003");
    var iMorosoMayor = inmueble(UUID.randomUUID(), g1, d2, "004");

    when(inmuebleRepo.findActivosWithGrupoAndDistrito()).thenReturn(List.of(iAlDia, iDeudor, iMorosoX, iMorosoMayor));
    CargaDeuda carga = new CargaDeuda();
    carga.setId(UUID.randomUUID());
    when(cargaRepo.findFirstByEstadoInOrderByCreatedAtDesc(anyList())).thenReturn(Optional.of(carga));
    when(rules.cuotasMinimasMorosidad()).thenReturn(umbral);
    when(deudaEfectivaRepo.findAll()).thenReturn(List.of());
    when(detalleRepo.findDeudaByCarga(carga.getId())).thenReturn(List.of(
      new Object[]{iDeudor.getId(), umbral - 1, BigDecimal.TEN},
      new Object[]{iMorosoX.getId(), umbral, BigDecimal.ONE},
      new Object[]{iMorosoMayor.getId(), umbral + 3, BigDecimal.ONE}
    ));
    return new TestFixture(service);
  }

  private static Inmueble inmueble(UUID id, Grupo g, Distrito d, String cuenta) {
    var i = new Inmueble();
    i.setId(id);
    i.setGrupo(g);
    i.setDistrito(d);
    i.setActivo(true);
    i.setCuenta(cuenta);
    i.setTitular("Titular " + cuenta);
    return i;
  }

  private record TestFixture(ReporteService service) {}
}
