package pe.morosos.common.exception;

import java.util.List;
import pe.morosos.common.api.ErrorResponse;

public class ValidationException extends RuntimeException {

    private final List<ErrorResponse.Detail> details;

    public ValidationException(String message, List<ErrorResponse.Detail> details) {
        super(message);
        this.details = details;
    }

    public List<ErrorResponse.Detail> getDetails() {
        return details;
    }
}
