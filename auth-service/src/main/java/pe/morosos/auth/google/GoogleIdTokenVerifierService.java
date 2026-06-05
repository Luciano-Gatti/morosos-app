package pe.morosos.auth.google;

import com.google.api.client.googleapis.auth.oauth2.GoogleIdToken;
import com.google.api.client.googleapis.auth.oauth2.GoogleIdTokenVerifier;
import com.google.api.client.http.javanet.NetHttpTransport;
import com.google.api.client.json.gson.GsonFactory;
import java.io.IOException;
import java.security.GeneralSecurityException;
import java.util.Collections;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;

@Service
public class GoogleIdTokenVerifierService implements GoogleTokenVerifier {

    private final GoogleProperties properties;

    public GoogleIdTokenVerifierService(GoogleProperties properties) {
        this.properties = properties;
    }

    @Override
    public GoogleUserClaims verify(String idToken) {
        if (!properties.enabled() || !StringUtils.hasText(properties.clientId())) {
            throw new GoogleTokenVerificationException("Google login está deshabilitado.");
        }
        try {
            GoogleIdTokenVerifier verifier = new GoogleIdTokenVerifier.Builder(new NetHttpTransport(), GsonFactory.getDefaultInstance())
                    .setAudience(Collections.singletonList(properties.clientId()))
                    .build();
            GoogleIdToken googleIdToken = verifier.verify(idToken);
            if (googleIdToken == null) {
                throw new GoogleTokenVerificationException("Token de Google inválido.");
            }
            GoogleIdToken.Payload payload = googleIdToken.getPayload();
            Boolean emailVerified = payload.getEmailVerified();
            return new GoogleUserClaims(
                    payload.getSubject(),
                    payload.getEmail(),
                    Boolean.TRUE.equals(emailVerified),
                    (String) payload.get("given_name"),
                    (String) payload.get("family_name"),
                    (String) payload.get("name"),
                    (String) payload.get("picture")
            );
        } catch (GeneralSecurityException | IOException exception) {
            throw new GoogleTokenVerificationException("No se pudo verificar el token de Google.");
        }
    }
}
