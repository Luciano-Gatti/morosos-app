package pe.morosos.auth.google;

import com.google.api.client.auth.oauth2.TokenResponseException;
import com.google.api.client.googleapis.auth.oauth2.GoogleAuthorizationCodeTokenRequest;
import com.google.api.client.googleapis.auth.oauth2.GoogleTokenResponse;
import com.google.api.client.http.javanet.NetHttpTransport;
import com.google.api.client.json.gson.GsonFactory;
import java.io.IOException;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;

@Service
public class GoogleAuthorizationCodeExchangeService implements GoogleAuthorizationCodeExchanger {

    private final GoogleProperties properties;

    public GoogleAuthorizationCodeExchangeService(GoogleProperties properties) {
        this.properties = properties;
    }

    @Override
    public String exchangeForIdToken(String code, String redirectUri) {
        if (!properties.enabled() || !StringUtils.hasText(properties.clientId())) {
            throw new GoogleTokenVerificationException("Google login está deshabilitado.");
        }
        if (!StringUtils.hasText(properties.clientSecret())) {
            throw new GoogleTokenVerificationException("Google login no tiene GOOGLE_CLIENT_SECRET configurado.");
        }
        try {
            GoogleTokenResponse response = new GoogleAuthorizationCodeTokenRequest(
                    new NetHttpTransport(),
                    GsonFactory.getDefaultInstance(),
                    properties.clientId(),
                    properties.clientSecret(),
                    code,
                    redirectUri
            ).execute();
            String idToken = response.getIdToken();
            if (!StringUtils.hasText(idToken)) {
                throw new GoogleTokenVerificationException("Google no devolvió ID token.");
            }
            return idToken;
        } catch (TokenResponseException exception) {
            throw new GoogleTokenVerificationException("No se pudo intercambiar el código de Google.");
        } catch (IOException exception) {
            throw new GoogleTokenVerificationException("No se pudo conectar con Google.");
        }
    }
}
