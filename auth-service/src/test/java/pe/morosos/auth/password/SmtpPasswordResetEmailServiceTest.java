package pe.morosos.auth.password;

import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import jakarta.mail.Session;
import jakarta.mail.internet.MimeMessage;
import java.util.Properties;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.beans.factory.ObjectProvider;
import org.springframework.core.env.Environment;
import org.springframework.mail.MailSendException;
import org.springframework.mail.javamail.JavaMailSender;
import pe.morosos.auth.user.entity.Usuario;

@ExtendWith(MockitoExtension.class)
class SmtpPasswordResetEmailServiceTest {

    @Mock
    private JavaMailSender javaMailSender;

    @Mock
    private ObjectProvider<JavaMailSender> javaMailSenderProvider;

    @Mock
    private Environment environment;

    @Test
    void mailEnabledSendsWithJavaMailSender() {
        AppMailProperties properties = enabledProperties();
        when(javaMailSenderProvider.getIfAvailable()).thenReturn(javaMailSender);
        SmtpPasswordResetEmailService service = new SmtpPasswordResetEmailService(javaMailSenderProvider, properties, environment);
        MimeMessage mimeMessage = new MimeMessage(Session.getInstance(new Properties()));
        when(javaMailSender.createMimeMessage()).thenReturn(mimeMessage);

        service.sendPasswordResetInstructions(user(), "enabled@local.test", "http://localhost:5173/reset-password?token=secret", 30);

        verify(javaMailSender).send(mimeMessage);
    }

    @Test
    void mailDisabledDoesNotCallJavaMailSender() {
        AppMailProperties properties = disabledProperties();
        SmtpPasswordResetEmailService service = new SmtpPasswordResetEmailService(javaMailSenderProvider, properties, environment);
        when(environment.getActiveProfiles()).thenReturn(new String[] {"local"});

        service.sendPasswordResetInstructions(user(), "disabled@local.test", "http://localhost:5173/reset-password?token=secret", 30);

        verify(javaMailSender, never()).createMimeMessage();
    }

    @Test
    void mailEnabledFailureThrowsDomainException() {
        AppMailProperties properties = enabledProperties();
        when(javaMailSenderProvider.getIfAvailable()).thenReturn(javaMailSender);
        SmtpPasswordResetEmailService service = new SmtpPasswordResetEmailService(javaMailSenderProvider, properties, environment);
        MimeMessage mimeMessage = new MimeMessage(Session.getInstance(new Properties()));
        when(javaMailSender.createMimeMessage()).thenReturn(mimeMessage);
        org.mockito.Mockito.doThrow(new MailSendException("smtp down")).when(javaMailSender).send(mimeMessage);

        assertThatThrownBy(() -> service.sendPasswordResetInstructions(
                user(),
                "enabled@local.test",
                "http://localhost:5173/reset-password?token=secret",
                30
        )).isInstanceOf(PasswordResetEmailException.class);
    }

    private AppMailProperties enabledProperties() {
        return new AppMailProperties(
                true,
                "no-reply@example.com",
                "Sistema de Morosidad",
                new AppMailProperties.PasswordReset(30, "http://localhost:5173/reset-password")
        );
    }

    private AppMailProperties disabledProperties() {
        return new AppMailProperties(
                false,
                "no-reply@example.com",
                "Sistema de Morosidad",
                new AppMailProperties.PasswordReset(30, "http://localhost:5173/reset-password")
        );
    }

    private Usuario user() {
        Usuario usuario = new Usuario();
        usuario.setUsername("test");
        usuario.setEmail("test@local.test");
        usuario.setNombre("Test");
        return usuario;
    }
}
