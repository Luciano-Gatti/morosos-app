package pe.morosos.auth.google;

public interface GoogleAuthorizationCodeExchanger {
    String exchangeForIdToken(String code, String redirectUri);
}
