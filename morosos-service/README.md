# morosos-service

Microservicio de gestión de morosos.

## Ejecución local con JWT

El perfil `local` debe activarse explícitamente; no se debe depender de `spring.profiles.default` y el `application.yml` base no define ningún perfil default.

```bash
mvn spring-boot:run -Dspring-boot.run.profiles=local
```

Para pruebas locales de integración con `auth-service`, `application-local.yml` define un fallback temporal de `JWT_SECRET` no productivo y reemplazable. No es un secreto productivo ni un secreto definitivo de desarrollo. Mientras se use HS256, `auth-service` y `morosos-service` deben compartir exactamente el mismo `JWT_SECRET`; si difieren, el Resource Server rechazará los tokens con `401 invalid_token`.

Para cambiar la clave local, definir `JWT_SECRET` por variable de entorno en ambos servicios antes de iniciarlos. El audience único local/test es `gestion-aosc` y ambos servicios deben emitir/validar el claim estándar `aud` con ese valor. En producción, `JWT_SECRET` debe venir de una variable de entorno o gestor de secretos y `application-prod.yml` no debe tener fallback ni la clave local temporal.

NetBeans/Maven:

- Configurar el profile `local` explícitamente; o
- usar `spring-boot:run -Dspring-boot.run.profiles=local`.

Futuro recomendado: migrar a RS256/JWKS para que `morosos-service` valide con clave pública y no comparta secreto con `auth-service`.

El `application.yml` base usa `secret: ${JWT_SECRET:}` y por eso falla el arranque si no hay perfil local/prod ni `JWT_SECRET` válido. El fallback conocido solo se permite con perfiles activos `local` o `dev`; se prohíbe sin perfiles activos o con `prod` activo, y no se usa `getDefaultProfiles()` para autorizarlo. No se loggea `JWT_SECRET` ni tokens.

## Validación local de integración

1. Levantar `auth-service` en `8080` con `mvn spring-boot:run -Dspring-boot.run.profiles=local`.
2. Levantar `morosos-service` en `8081` con `mvn spring-boot:run -Dspring-boot.run.profiles=local`.
3. Levantar el frontend en `5173`.
4. Borrar del storage del navegador `morosos.auth.accessToken` y `morosos.auth.user`.
5. Iniciar sesión y confirmar que `GET http://localhost:8081/api/v1/dashboard/resumen` ya no devuelve `401 invalid_token`. Si devuelve `403`, el token ya es válido pero falta permiso; si devuelve `200`, la integración quedó funcionando.
