# Welcome to your Lovable project

TODO: Document your project here

## Auth: registro, Google y administración

- La pantalla de registro envía `POST /api/v1/auth/register` y muestra el mensaje de cuenta pendiente. No guarda tokens ni inicia sesión automáticamente.
- La pantalla de login carga Google Identity Services si `VITE_GOOGLE_CLIENT_ID` está configurado, obtiene el `credential`/ID token y lo envía a `POST /api/v1/auth/google`. El ID token no se persiste.
- La gestión administrativa está en `/configuracion/usuarios` y se muestra en el menú solo si el usuario tiene `USUARIOS_VER_LISTADO`.
- La UI oculta acciones según permissions, pero la autorización real la decide el backend.

### Variables frontend

- `VITE_AUTH_BASE_URL`: URL base de `auth-service`.
- `VITE_GOOGLE_CLIENT_ID`: Client ID web de Google Identity Services.
