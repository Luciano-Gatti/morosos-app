package pe.morosos.auth.exception;

public class JwtAuthenticationException extends RuntimeException {

    private final String code;

    public JwtAuthenticationException(String code, String message) {
        super(message);
        this.code = code;
    }

    public String getCode() {
        return code;
    }
}
