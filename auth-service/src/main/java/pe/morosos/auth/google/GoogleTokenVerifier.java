package pe.morosos.auth.google;

public interface GoogleTokenVerifier {
    GoogleUserClaims verify(String idToken);
}
