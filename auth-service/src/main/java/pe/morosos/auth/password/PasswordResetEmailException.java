package pe.morosos.auth.password;

public class PasswordResetEmailException extends RuntimeException {

    public PasswordResetEmailException(String message, Throwable cause) {
        super(message, cause);
    }
}
