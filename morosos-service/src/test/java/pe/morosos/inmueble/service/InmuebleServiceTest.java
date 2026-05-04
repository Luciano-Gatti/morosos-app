package pe.morosos.inmueble.service;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

import com.fasterxml.jackson.databind.ObjectMapper;
import java.util.Optional;
import java.util.UUID;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import pe.morosos.audit.service.AuditService;
import pe.morosos.common.exception.BusinessRuleException;
import pe.morosos.common.exception.ResourceNotFoundException;
import pe.morosos.distrito.entity.Distrito;
import pe.morosos.distrito.repository.DistritoRepository;
import pe.morosos.grupo.entity.Grupo;
import pe.morosos.grupo.repository.GrupoRepository;
import pe.morosos.grupodistrito.entity.GrupoDistritoConfig;
import pe.morosos.inmueble.dto.InmuebleUpdateRequest;
import pe.morosos.inmueble.entity.Inmueble;
import pe.morosos.inmueble.mapper.InmuebleMapper;
import pe.morosos.inmueble.repository.GrupoDistritoConfigLookupRepository;
import pe.morosos.inmueble.repository.InmuebleRepository;

@ExtendWith(MockitoExtension.class)
class InmuebleServiceTest {
    @Mock InmuebleRepository inmuebleRepository;
    @Mock GrupoRepository grupoRepository;
    @Mock DistritoRepository distritoRepository;
    @Mock GrupoDistritoConfigLookupRepository grupoDistritoConfigRepository;
    @Mock InmuebleMapper inmuebleMapper;
    @Mock AuditService auditService;

    InmuebleService service;

    @BeforeEach
    void setup() {
        service = new InmuebleService(inmuebleRepository, grupoRepository, distritoRepository,
                grupoDistritoConfigRepository, inmuebleMapper, auditService, new ObjectMapper());
    }

    @Test
    void updateSoloContactoConservaGrupoDistrito() {
        UUID id = UUID.randomUUID();
        Inmueble inmueble = inmuebleBase(id);
        InmuebleUpdateRequest req = new InmuebleUpdateRequest("123", "a@b.com", "obs", null, null);

        mockLookup(inmueble, inmueble.getGrupo(), inmueble.getDistrito());
        when(inmuebleRepository.save(inmueble)).thenReturn(inmueble);

        service.update(id, req);

        verify(inmuebleMapper).update(inmueble, req, inmueble.getGrupo(), inmueble.getDistrito());
        verify(auditService, never()).log(anyString(), any(), anyString(), any(), any(), anyString(), any(), any());
    }

    @Test
    void rechazaGrupoDistritoNoAsociados() {
        UUID id = UUID.randomUUID();
        Inmueble inmueble = inmuebleBase(id);
        Grupo g2 = grupo(UUID.randomUUID(), true, "G2");
        Distrito d2 = distrito(UUID.randomUUID(), true, "D2");
        InmuebleUpdateRequest req = new InmuebleUpdateRequest(null, null, null, d2.getId(), g2.getId());

        when(inmuebleRepository.findById(id)).thenReturn(Optional.of(inmueble));
        when(grupoRepository.findById(g2.getId())).thenReturn(Optional.of(g2));
        when(distritoRepository.findById(d2.getId())).thenReturn(Optional.of(d2));
        when(grupoDistritoConfigRepository.findByGrupoIdAndDistritoId(g2.getId(), d2.getId())).thenReturn(Optional.empty());

        BusinessRuleException ex = assertThrows(BusinessRuleException.class, () -> service.update(id, req));
        assertEquals("El grupo seleccionado no está asociado al distrito seleccionado.", ex.getMessage());
    }

    @Test
    void rechazaDistritoInexistente() {
        UUID id = UUID.randomUUID();
        Inmueble inmueble = inmuebleBase(id);
        UUID distritoId = UUID.randomUUID();
        InmuebleUpdateRequest req = new InmuebleUpdateRequest(null, null, null, distritoId, null);

        when(inmuebleRepository.findById(id)).thenReturn(Optional.of(inmueble));
        when(grupoRepository.findById(inmueble.getGrupo().getId())).thenReturn(Optional.of(inmueble.getGrupo()));
        when(distritoRepository.findById(distritoId)).thenReturn(Optional.empty());

        assertThrows(ResourceNotFoundException.class, () -> service.update(id, req));
    }

    @Test
    void registraAuditoriaCuandoCambiaGrupoODistrito() {
        UUID id = UUID.randomUUID();
        Inmueble inmueble = inmuebleBase(id);
        Grupo g2 = grupo(UUID.randomUUID(), true, "G2");
        InmuebleUpdateRequest req = new InmuebleUpdateRequest(null, null, null, null, g2.getId());

        mockLookup(inmueble, g2, inmueble.getDistrito());
        when(inmuebleRepository.save(inmueble)).thenAnswer(inv -> {
            inmueble.setGrupo(g2);
            return inmueble;
        });

        service.update(id, req);

        verify(auditService).log(eq("INMUEBLE"), eq(id), eq("INMUEBLE_GRUPO_DISTRITO_ACTUALIZADO"),
                isNull(), isNull(), contains("/api/v1/inmuebles/"), any(), any());
    }

    private void mockLookup(Inmueble inmueble, Grupo grupo, Distrito distrito) {
        when(inmuebleRepository.findById(inmueble.getId())).thenReturn(Optional.of(inmueble));
        when(grupoRepository.findById(grupo.getId())).thenReturn(Optional.of(grupo));
        when(distritoRepository.findById(distrito.getId())).thenReturn(Optional.of(distrito));
        when(grupoDistritoConfigRepository.findByGrupoIdAndDistritoId(grupo.getId(), distrito.getId()))
                .thenReturn(Optional.of(new GrupoDistritoConfig()));
    }

    private Inmueble inmuebleBase(UUID id) {
        Inmueble i = new Inmueble();
        i.setId(id);
        i.setGrupo(grupo(UUID.randomUUID(), true, "G1"));
        i.setDistrito(distrito(UUID.randomUUID(), true, "D1"));
        return i;
    }

    private Grupo grupo(UUID id, boolean activo, String nombre) { Grupo g = new Grupo(); g.setId(id); g.setActivo(activo); g.setNombre(nombre); return g; }
    private Distrito distrito(UUID id, boolean activo, String nombre) { Distrito d = new Distrito(); d.setId(id); d.setActivo(activo); d.setNombre(nombre); return d; }
}
