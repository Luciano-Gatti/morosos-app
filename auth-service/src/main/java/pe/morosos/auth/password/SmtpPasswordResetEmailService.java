package pe.morosos.auth.password;

import jakarta.mail.MessagingException;
import jakarta.mail.internet.InternetAddress;
import jakarta.mail.internet.MimeMessage;
import java.io.UnsupportedEncodingException;
import java.util.Arrays;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.ObjectProvider;
import org.springframework.core.env.Environment;
import org.springframework.mail.MailException;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;
import org.springframework.web.util.HtmlUtils;
import pe.morosos.auth.user.entity.Usuario;

@Service
public class SmtpPasswordResetEmailService implements PasswordResetEmailService {

    private static final Logger LOGGER = LoggerFactory.getLogger(SmtpPasswordResetEmailService.class);
    private static final String SUBJECT = "Restablecimiento de contraseña";

    private final ObjectProvider<JavaMailSender> javaMailSenderProvider;
    private final AppMailProperties appMailProperties;
    private final Environment environment;

    public SmtpPasswordResetEmailService(
            ObjectProvider<JavaMailSender> javaMailSenderProvider,
            AppMailProperties appMailProperties,
            Environment environment
    ) {
        this.javaMailSenderProvider = javaMailSenderProvider;
        this.appMailProperties = appMailProperties;
        this.environment = environment;
    }

    @Override
    public void sendPasswordResetInstructions(Usuario usuario, String recipientEmail, String resetUrl, long tokenTtlMinutes) {
        if (!appMailProperties.enabled()) {
            logDisabledDelivery(usuario, resetUrl);
            return;
        }

        JavaMailSender javaMailSender = javaMailSenderProvider.getIfAvailable();
        if (javaMailSender == null) {
            throw new PasswordResetEmailException("JavaMailSender no está configurado.", null);
        }

        try {
            MimeMessage message = javaMailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");
            helper.setFrom(buildFromAddress());
            helper.setTo(recipientEmail);
            helper.setSubject(SUBJECT);
            helper.setText(buildTextBody(resetUrl, tokenTtlMinutes), buildHtmlBody(resetUrl, tokenTtlMinutes));
            javaMailSender.send(message);
        } catch (MailException | MessagingException | UnsupportedEncodingException exception) {
            throw new PasswordResetEmailException("No se pudo enviar el correo de restablecimiento.", exception);
        }
    }

    private InternetAddress buildFromAddress() throws MessagingException, UnsupportedEncodingException {
        String from = appMailProperties.from();
        String fromName = appMailProperties.fromName();
        if (StringUtils.hasText(fromName)) {
            return new InternetAddress(from, fromName, "UTF-8");
        }
        return new InternetAddress(from);
    }

    private String buildTextBody(String resetUrl, long tokenTtlMinutes) {
        return "Hola,\n\n"
                + "Se solicitó restablecer la contraseña de tu cuenta.\n\n"
                + "Abrí este enlace para crear una nueva contraseña:\n"
                + resetUrl
                + "\n\nEl enlace vence en " + tokenTtlMinutes + " minutos.\n\n"
                + "Si no solicitaste este cambio, ignorá este correo.\n";
    }

    private String buildHtmlBody(String resetUrl, long tokenTtlMinutes) {
        String safeResetUrl = HtmlUtils.htmlEscape(resetUrl);
        return "<p>Hola,</p>"
                + "<p>Se solicitó restablecer la contraseña de tu cuenta.</p>"
                + "<p><a href=\"" + safeResetUrl + "\">Restablecer contraseña</a></p>"
                + "<p>El enlace vence en " + tokenTtlMinutes + " minutos.</p>"
                + "<p>Si no solicitaste este cambio, ignorá este correo.</p>";
    }

    private void logDisabledDelivery(Usuario usuario, String resetUrl) {
        if (isLocalOrDevProfile()) {
            LOGGER.info("Password reset link generated for local/dev testing. userId={} resetUrl={}", usuario.getId(), resetUrl);
            return;
        }
        LOGGER.info("Password reset email delivery disabled. userId={}", usuario.getId());
    }

    private boolean isLocalOrDevProfile() {
        return Arrays.stream(environment.getActiveProfiles())
                .anyMatch(profile -> "local".equalsIgnoreCase(profile) || "dev".equalsIgnoreCase(profile));
    }
}
