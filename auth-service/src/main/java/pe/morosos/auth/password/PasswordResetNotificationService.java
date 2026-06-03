package pe.morosos.auth.password;

import pe.morosos.auth.user.entity.Usuario;

public interface PasswordResetNotificationService {

    void sendPasswordResetInstructions(Usuario usuario, String resetUrl);
}
