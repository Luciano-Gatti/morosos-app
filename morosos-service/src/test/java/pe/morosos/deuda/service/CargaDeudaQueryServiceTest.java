package pe.morosos.deuda.service;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.UUID;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import pe.morosos.deuda.entity.CargaDeudaEstado;
import pe.morosos.deuda.mapper.CargaDeudaMapper;
import pe.morosos.deuda.repository.CargaDeudaDetalleRepository;
import pe.morosos.deuda.repository.CargaDeudaErrorRepository;
import pe.morosos.deuda.repository.CargaDeudaRepository;

@ExtendWith(MockitoExtension.class)
class CargaDeudaQueryServiceTest {
    @Mock CargaDeudaRepository cargaDeudaRepository;
    @Mock CargaDeudaDetalleRepository detalleRepository;
    @Mock CargaDeudaErrorRepository errorRepository;

    CargaDeudaQueryService service;

    @BeforeEach
    void setUp() {
        service = new CargaDeudaQueryService(cargaDeudaRepository, detalleRepository, errorRepository, new CargaDeudaMapper());
    }

    @Test void listarCargasPaginado(){ when(cargaDeudaRepository.findAll(any(Specification.class), any(Pageable.class))).thenReturn(Page.empty()); service.findCargas(null,null,null,null,PageRequest.of(1,10)); verify(cargaDeudaRepository).findAll(any(Specification.class), any(Pageable.class)); }
    @Test void listarCargasConEstadoYFromDate(){ when(cargaDeudaRepository.findAll(any(Specification.class), any(Pageable.class))).thenReturn(Page.empty()); service.findCargas(null, LocalDate.of(2026,1,1), CargaDeudaEstado.COMPLETADA, null, PageRequest.of(0,20)); verify(cargaDeudaRepository).findAll(any(Specification.class), any(Pageable.class)); }
    @Test void listarCargasConSearch(){ when(cargaDeudaRepository.findAll(any(Specification.class), any(Pageable.class))).thenReturn(Page.empty()); service.findCargas(null,null,null,"operador",PageRequest.of(0,20)); verify(cargaDeudaRepository).findAll(any(Specification.class), any(Pageable.class)); }

    @Test
    void listarCargasConSortAliasFecha() {
        when(cargaDeudaRepository.findAll(any(Specification.class), any(Pageable.class))).thenReturn(Page.empty());
        ArgumentCaptor<Pageable> captor = ArgumentCaptor.forClass(Pageable.class);
        service.findCargas(null,null,null,null, PageRequest.of(0,20, Sort.by("fecha").descending()));
        verify(cargaDeudaRepository).findAll(any(Specification.class), captor.capture());
        assertEquals("createdAt", captor.getValue().getSort().iterator().next().getProperty());
    }

    @Test void detallesConSearchYFiltros(){ UUID id=UUID.randomUUID(); when(cargaDeudaRepository.existsById(id)).thenReturn(true); when(detalleRepository.findAll(any(Specification.class), any(Pageable.class))).thenReturn(Page.empty()); service.findDetalles(id,"titular",3,new BigDecimal("1000"),PageRequest.of(0,10)); verify(detalleRepository).findAll(any(Specification.class), any(Pageable.class)); }

    @Test
    void detallesConSortAliasCuenta() {
        UUID id=UUID.randomUUID(); when(cargaDeudaRepository.existsById(id)).thenReturn(true); when(detalleRepository.findAll(any(Specification.class), any(Pageable.class))).thenReturn(Page.empty());
        ArgumentCaptor<Pageable> captor=ArgumentCaptor.forClass(Pageable.class);
        service.findDetalles(id,null,null,null,PageRequest.of(0,10,Sort.by("cuenta").ascending()));
        verify(detalleRepository).findAll(any(Specification.class), captor.capture());
        assertEquals("inmueble.cuenta", captor.getValue().getSort().iterator().next().getProperty());
    }

    @Test
    void erroresPaginadosPageSize() {
        UUID id=UUID.randomUUID(); when(cargaDeudaRepository.existsById(id)).thenReturn(true); when(errorRepository.findAll(any(Specification.class), any(Pageable.class))).thenReturn(Page.empty());
        ArgumentCaptor<Pageable> captor=ArgumentCaptor.forClass(Pageable.class);
        service.findErrores(id,null,PageRequest.of(2,25));
        verify(errorRepository).findAll(any(Specification.class), captor.capture());
        assertEquals(2,captor.getValue().getPageNumber());
        assertEquals(25,captor.getValue().getPageSize());
    }

    @Test void erroresConSearch(){ UUID id=UUID.randomUUID(); when(cargaDeudaRepository.existsById(id)).thenReturn(true); when(errorRepository.findAll(any(Specification.class), any(Pageable.class))).thenReturn(Page.empty()); service.findErrores(id,"cuenta",PageRequest.of(0,20)); verify(errorRepository).findAll(any(Specification.class), any(Pageable.class)); }
}
