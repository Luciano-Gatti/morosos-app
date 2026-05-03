package pe.morosos.grupodistrito.service;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import pe.morosos.audit.service.AuditService;
import pe.morosos.common.exception.ConflictException;
import pe.morosos.common.exception.ResourceNotFoundException;
import pe.morosos.distrito.entity.Distrito;
import pe.morosos.distrito.repository.DistritoRepository;
import pe.morosos.grupo.entity.Grupo;
import pe.morosos.grupo.repository.GrupoRepository;
import pe.morosos.grupodistrito.dto.GrupoDistritoConfigRequest;
import pe.morosos.grupodistrito.entity.GrupoDistritoConfig;
import pe.morosos.grupodistrito.mapper.GrupoDistritoConfigMapper;
import pe.morosos.grupodistrito.repository.GrupoDistritoConfigRepository;
import pe.morosos.inmueble.repository.InmuebleRepository;

@ExtendWith(MockitoExtension.class)
class GrupoDistritoConfigServiceTest {

    @Mock GrupoDistritoConfigRepository repository;
    @Mock GrupoRepository grupoRepository;
    @Mock DistritoRepository distritoRepository;
    @Mock GrupoDistritoConfigMapper mapper;
    @Mock InmuebleRepository inmuebleRepository;
    @Mock AuditService auditService;

    GrupoDistritoConfigService service;

    @BeforeEach
    void setUp() {
        service = new GrupoDistritoConfigService(repository, grupoRepository, distritoRepository, mapper, inmuebleRepository, auditService);
    }

    @Test
    void createRelacionValida() {
        UUID gid = UUID.randomUUID(); UUID did = UUID.randomUUID();
        GrupoDistritoConfigRequest req = new GrupoDistritoConfigRequest(gid, did, true);
        Grupo g = grupo(gid, true); Distrito d = distrito(did, true); GrupoDistritoConfig entity = config(g,d,true);
        when(repository.existsByGrupoIdAndDistritoId(gid, did)).thenReturn(false);
        when(grupoRepository.findById(gid)).thenReturn(Optional.of(g));
        when(distritoRepository.findById(did)).thenReturn(Optional.of(d));
        when(mapper.toEntity(req, g, d)).thenReturn(entity);
        when(repository.save(entity)).thenReturn(entity);
        service.create(req);
        verify(repository).save(entity);
    }

    @Test
    void noPermitirDuplicado() {
        UUID gid = UUID.randomUUID(); UUID did = UUID.randomUUID();
        when(repository.existsByGrupoIdAndDistritoId(gid, did)).thenReturn(true);
        assertThrows(ConflictException.class, () -> service.create(new GrupoDistritoConfigRequest(gid, did, true)));
    }

    @Test
    void noCrearSiGrupoNoExiste() {
        UUID gid = UUID.randomUUID(); UUID did = UUID.randomUUID();
        when(repository.existsByGrupoIdAndDistritoId(gid, did)).thenReturn(false);
        when(grupoRepository.findById(gid)).thenReturn(Optional.empty());
        assertThrows(ResourceNotFoundException.class, () -> service.create(new GrupoDistritoConfigRequest(gid, did, true)));
    }

    @Test
    void noCrearSiDistritoNoExiste() {
        UUID gid = UUID.randomUUID(); UUID did = UUID.randomUUID();
        when(repository.existsByGrupoIdAndDistritoId(gid, did)).thenReturn(false);
        when(grupoRepository.findById(gid)).thenReturn(Optional.of(grupo(gid, true)));
        when(distritoRepository.findById(did)).thenReturn(Optional.empty());
        assertThrows(ResourceNotFoundException.class, () -> service.create(new GrupoDistritoConfigRequest(gid, did, true)));
    }

    @Test
    void actualizarSeguimientoHabilitado() {
        UUID id = UUID.randomUUID(); UUID gid = UUID.randomUUID(); UUID did = UUID.randomUUID();
        Grupo g = grupo(gid, true); Distrito d = distrito(did, true); GrupoDistritoConfig cfg = config(g, d, false); cfg.setId(id);
        when(repository.findById(id)).thenReturn(Optional.of(cfg));
        when(repository.existsByGrupoIdAndDistritoIdAndIdNot(gid, did, id)).thenReturn(false);
        when(grupoRepository.findById(gid)).thenReturn(Optional.of(g));
        when(distritoRepository.findById(did)).thenReturn(Optional.of(d));
        when(repository.save(any())).thenAnswer(inv -> inv.getArgument(0));
        service.update(id, new GrupoDistritoConfigRequest(gid, did, true));
        assertTrue(cfg.isSeguimientoHabilitado());
    }

    @Test
    void eliminarRelacionValida() {
        UUID id = UUID.randomUUID(); UUID gid = UUID.randomUUID(); UUID did = UUID.randomUUID();
        GrupoDistritoConfig cfg = config(grupo(gid, true), distrito(did, true), true); cfg.setId(id);
        when(repository.findById(id)).thenReturn(Optional.of(cfg));
        when(inmuebleRepository.countByGrupoIdAndDistritoId(gid, did)).thenReturn(0L);
        service.delete(id);
        verify(repository).delete(cfg);
    }

    @Test
    void bloquearEliminacionSiTieneInmuebles() {
        UUID id = UUID.randomUUID(); UUID gid = UUID.randomUUID(); UUID did = UUID.randomUUID();
        GrupoDistritoConfig cfg = config(grupo(gid, true), distrito(did, true), true); cfg.setId(id);
        when(repository.findById(id)).thenReturn(Optional.of(cfg));
        when(inmuebleRepository.countByGrupoIdAndDistritoId(gid, did)).thenReturn(2L);
        assertThrows(ConflictException.class, () -> service.delete(id));
    }

    @Test
    void listarRelacionesCorrectamente() {
        when(repository.findAll()).thenReturn(List.of(new GrupoDistritoConfig()));
        service.findAll();
        verify(repository).findAll();
    }

    private Grupo grupo(UUID id, boolean activo) { Grupo g = new Grupo(); g.setId(id); g.setNombre("G"); g.setActivo(activo); return g; }
    private Distrito distrito(UUID id, boolean activo) { Distrito d = new Distrito(); d.setId(id); d.setNombre("D"); d.setActivo(activo); return d; }
    private GrupoDistritoConfig config(Grupo g, Distrito d, boolean seg) { GrupoDistritoConfig c = new GrupoDistritoConfig(); c.setGrupo(g); c.setDistrito(d); c.setSeguimientoHabilitado(seg); return c; }
}
