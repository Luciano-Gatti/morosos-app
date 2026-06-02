package pe.morosos.common.exception;

import static org.assertj.core.api.Assertions.assertThat;

import jakarta.servlet.http.HttpServletRequest;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mockito;
import org.springframework.boot.test.system.CapturedOutput;
import org.springframework.boot.test.system.OutputCaptureExtension;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import pe.morosos.common.api.ErrorResponse;

@ExtendWith(OutputCaptureExtension.class)
class GlobalExceptionHandlerTest {

    private final GlobalExceptionHandler handler = new GlobalExceptionHandler();

    @Test
    void errorInesperadoDevuelveJsonConsistenteYLogueaTraceId(CapturedOutput output) {
        HttpServletRequest request = Mockito.mock(HttpServletRequest.class);
        Mockito.when(request.getMethod()).thenReturn("POST");
        Mockito.when(request.getRequestURI()).thenReturn("/api/v1/seguimiento/enviar-etapa");
        Mockito.when(request.getHeader("X-Trace-Id")).thenReturn("trace-test-123");

        ResponseEntity<ErrorResponse> response = handler.handleUnexpected(new IllegalStateException("detalle interno"), request);

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.INTERNAL_SERVER_ERROR);
        assertThat(response.getBody()).isNotNull();
        assertThat(response.getBody().code()).isEqualTo("INTERNAL_ERROR");
        assertThat(response.getBody().message()).isEqualTo("Ocurrió un error interno.");
        assertThat(response.getBody().traceId()).isEqualTo("trace-test-123");
        assertThat(output).contains("Error interno no controlado. traceId=trace-test-123, method=POST, path=/api/v1/seguimiento/enviar-etapa");
        assertThat(output).contains("java.lang.IllegalStateException: detalle interno");
    }
}
