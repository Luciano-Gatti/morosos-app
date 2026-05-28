package pe.morosos.auth.audit.model;

public enum LoginAttemptResult {
    SUCCESS,
    INVALID_CREDENTIALS,
    USER_DISABLED,
    ERROR
}
