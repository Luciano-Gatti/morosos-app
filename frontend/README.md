# Welcome to your Lovable project

TODO: Document your project here

## Auth: registro, Google y administración

- La pantalla de registro envía `POST /api/v1/auth/register` y muestra el mensaje de cuenta pendiente. No guarda tokens ni inicia sesión automáticamente.
- La pantalla de login carga Google Identity Services si `VITE_GOOGLE_CLIENT_ID` está configurado, solicita un authorization code con popup mode y lo envía a `POST /api/v1/auth/google/code`. El frontend no persiste tokens de Google; solo guarda el JWT propio que devuelve `auth-service` cuando la cuenta está aprobada.
- La gestión administrativa está en `/configuracion/usuarios` y se muestra en el menú solo si el usuario tiene `USUARIOS_VER_LISTADO`.
- La UI oculta acciones según permissions, pero la autorización real la decide el backend.

### Variables frontend

- `VITE_AUTH_BASE_URL`: URL base de `auth-service`.
- `VITE_GOOGLE_CLIENT_ID`: Client ID web público de Google Identity Services. Para local: `492537971639-h16aabnpmu0hcrn5vcbk6bvn2evkjbgf.apps.googleusercontent.com`.

En Google Cloud Console, el OAuth Client debe autorizar el origin del frontend local (`http://localhost:5173` y, si se usa, `http://127.0.0.1:5173`). En popup mode ese origin es también el `redirect_uri` que el backend usa al intercambiar el code.

Google solo autentica identidad. La aprobación, roles y permisos los decide el administrador desde `auth-service`; un usuario nuevo queda pendiente y no recibe JWT funcional hasta ser aprobado.
