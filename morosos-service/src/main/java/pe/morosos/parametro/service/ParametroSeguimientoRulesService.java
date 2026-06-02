package pe.morosos.parametro.service;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import pe.morosos.common.exception.BusinessRuleException;
import pe.morosos.parametro.repository.ParametroSeguimientoRepository;

@Service
@RequiredArgsConstructor
public class ParametroSeguimientoRulesService {

    private static final String PARAM_CUOTAS_MIN_MOROSIDAD = "CUOTAS_MINIMAS_MOROSIDAD";
    private static final String PARAM_CUOTAS_PARA_MOROSO = "CUOTAS_PARA_MOROSO";
    private static final String PARAM_DIAS_ENTRE_ETAPAS = "DIAS_ENTRE_ETAPAS";
    private static final int DEFAULT_CUOTAS_MIN_MOROSIDAD = 2;
    private static final int DEFAULT_DIAS_ENTRE_ETAPAS = 15;

    private final ParametroSeguimientoRepository parametroSeguimientoRepository;

    public int cuotasMinimasMorosidad() {
        return parametroEnteroConAlias(DEFAULT_CUOTAS_MIN_MOROSIDAD, PARAM_CUOTAS_PARA_MOROSO, PARAM_CUOTAS_MIN_MOROSIDAD);
    }

    public int diasMinimosEntreEtapas() {
        int dias = parametroEntero(PARAM_DIAS_ENTRE_ETAPAS, DEFAULT_DIAS_ENTRE_ETAPAS);
        return dias < 0 ? DEFAULT_DIAS_ENTRE_ETAPAS : dias;
    }

    private int parametroEntero(String codigo, int valorDefault) {
        return parametroSeguimientoRepository.findByCodigoIgnoreCase(codigo)
                .map(parametro -> parseEntero(codigo, parametro.getValor(), valorDefault))
                .orElse(valorDefault);
    }

    private int parametroEnteroConAlias(int valorDefault, String... codigos) {
        for (String codigo : codigos) {
            var parametroOpt = parametroSeguimientoRepository.findByCodigoIgnoreCase(codigo);
            if (parametroOpt.isPresent()) {
                return parseEntero(codigo, parametroOpt.get().getValor(), valorDefault);
            }
        }
        return valorDefault;
    }

    private int parseEntero(String codigo, String valor, int valorDefault) {
        if (valor == null || valor.isBlank()) {
            return valorDefault;
        }
        try {
            return Integer.parseInt(valor.trim());
        } catch (NumberFormatException ex) {
            throw new BusinessRuleException("El parámetro " + codigo + " no contiene un número entero válido");
        }
    }
}
