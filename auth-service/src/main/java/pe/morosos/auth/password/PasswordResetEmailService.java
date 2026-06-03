package pe.morosos.auth.password;

import pe.morosos.auth.user.entity.Usuario;

public interface PasswordResetEmailService {

    void sendPasswordResetInstructions(Usuario usuario, String recipientEmail, String resetUrl, long tokenTtlMinutes);
}
