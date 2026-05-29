package pe.morosos.auth.exception;

public class AccountDisabledException extends RuntimeException {

    public AccountDisabledException() {
        super("El usuario se encuentra inactivo.");
    }
}
