package com.tuorg.morososcontrol.config;

import com.tuorg.morososcontrol.catalogo.domain.MotivoCorte;
import com.tuorg.morososcontrol.catalogo.domain.TipoCorte;
import com.tuorg.morososcontrol.catalogo.infrastructure.MotivoCorteRepository;
import com.tuorg.morososcontrol.catalogo.infrastructure.TipoCorteRepository;
import com.tuorg.morososcontrol.grupo.domain.Grupo;
import com.tuorg.morososcontrol.grupo.infrastructure.GrupoRepository;
import com.tuorg.morososcontrol.regla.domain.ConfiguracionGeneral;
import com.tuorg.morososcontrol.regla.infrastructure.ConfiguracionGeneralRepository;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Configuration
public class V1SeedDataConfig {

    @Bean
    CommandLineRunner seedV1Data(
            GrupoRepository grupoRepository,
            TipoCorteRepository tipoCorteRepository,
            MotivoCorteRepository motivoCorteRepository,
            ConfiguracionGeneralRepository configuracionGeneralRepository
    ) {
        return args -> seedCatalogs(grupoRepository, tipoCorteRepository, motivoCorteRepository, configuracionGeneralRepository);
    }

    @Transactional
    protected void seedCatalogs(
            GrupoRepository grupoRepository,
            TipoCorteRepository tipoCorteRepository,
            MotivoCorteRepository motivoCorteRepository,
            ConfiguracionGeneralRepository configuracionGeneralRepository
    ) {
        seedGrupos(grupoRepository);
        seedTiposCorte(tipoCorteRepository);
        seedMotivosCorte(motivoCorteRepository);
        seedConfiguracionGeneral(configuracionGeneralRepository);
    }

    private void seedGrupos(GrupoRepository grupoRepository) {
        List<GrupoSeed> seeds = List.of(
                new GrupoSeed("Residencial", true),
                new GrupoSeed("Comercial", true),
                new GrupoSeed("Social", false)
        );

        for (GrupoSeed seed : seeds) {
            if (!grupoRepository.existsByNombreIgnoreCase(seed.nombre())) {
                Grupo grupo = new Grupo();
                grupo.setNombre(seed.nombre());
                grupo.setSeguimientoActivo(seed.seguimientoActivo());
                grupoRepository.save(grupo);
            }
        }
    }

    private void seedTiposCorte(TipoCorteRepository tipoCorteRepository) {
        for (String nombre : List.of("Aviso", "Suspensión", "Reconexión")) {
            if (!tipoCorteRepository.existsByNombreIgnoreCase(nombre)) {
                TipoCorte tipoCorte = new TipoCorte();
                tipoCorte.setNombre(nombre);
                tipoCorteRepository.save(tipoCorte);
            }
        }
    }

    private void seedMotivosCorte(MotivoCorteRepository motivoCorteRepository) {
        List<MotivoCorteSeed> seeds = List.of(
                new MotivoCorteSeed("Falta de pago", true),
                new MotivoCorteSeed("Incumplimiento de compromiso", true),
                new MotivoCorteSeed("Ajuste administrativo", false)
        );

        for (MotivoCorteSeed seed : seeds) {
            if (!motivoCorteRepository.existsByNombreIgnoreCase(seed.nombre())) {
                MotivoCorte motivoCorte = new MotivoCorte();
                motivoCorte.setNombre(seed.nombre());
                motivoCorte.setActivo(seed.activo());
                motivoCorteRepository.save(motivoCorte);
            }
        }
    }

    private void seedConfiguracionGeneral(ConfiguracionGeneralRepository configuracionGeneralRepository) {
        if (configuracionGeneralRepository.count() == 0) {
            ConfiguracionGeneral configuracion = new ConfiguracionGeneral();
            configuracion.setMinimoCuotasSeguimiento(2);
            configuracionGeneralRepository.save(configuracion);
        }
    }

    private record GrupoSeed(String nombre, boolean seguimientoActivo) {
    }

    private record MotivoCorteSeed(String nombre, boolean activo) {
    }
}
