package pe.morosos.deuda.service;

import org.springframework.stereotype.Service;

@Service
public class ClasificacionDeudaService {

    public EstadoDeuda clasificar(Integer cuotasVencidas, Integer umbralMorosidad) {
        int cuotas = cuotasVencidas == null ? 0 : cuotasVencidas;
        int umbral = umbralMorosidad == null || umbralMorosidad <= 0 ? 1 : umbralMorosidad;

        if (cuotas <= 0) {
            return EstadoDeuda.AL_DIA;
        }
        if (cuotas < umbral) {
            return EstadoDeuda.DEUDOR;
        }
        return EstadoDeuda.MOROSO;
    }

    public String etiqueta(EstadoDeuda estado) {
        return switch (estado) {
            case AL_DIA -> "Al día";
            case DEUDOR -> "Deudor";
            case MOROSO -> "Moroso";
        };
    }
}
