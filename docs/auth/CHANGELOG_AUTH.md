# Changelog Auth Service

## 2026-05-28 - ETAPA 0 - Base técnica

### Resumen

Se creó `auth-service` como proyecto Maven Spring Boot independiente para alojar la base técnica del futuro microservicio de autenticación y autorización, sin implementar login, JWT, Google login, reset de contraseña, usuarios, roles, permisos ni persistencia.

### Archivos principales creados

- `auth-service/pom.xml`
- `auth-service/README.md`
- `auth-service/src/main/java/pe/morosos/auth/AuthServiceApplication.java`
- `auth-service/src/main/java/pe/morosos/auth/common/HttpHeadersConstants.java`
- `auth-service/src/main/java/pe/morosos/auth/config/CorsConfig.java`
- `auth-service/src/main/java/pe/morosos/auth/config/CorsProperties.java`
- `auth-service/src/main/java/pe/morosos/auth/config/OpenApiConfig.java`
- `auth-service/src/main/java/pe/morosos/auth/error/ErrorResponse.java`
- `auth-service/src/main/java/pe/morosos/auth/error/GlobalExceptionHandler.java`
- `auth-service/src/main/java/pe/morosos/auth/health/HealthController.java`
- `auth-service/src/main/java/pe/morosos/auth/health/HealthResponse.java`
- `auth-service/src/main/java/pe/morosos/auth/observability/RequestTraceFilter.java`
- `auth-service/src/main/java/pe/morosos/auth/security/SecurityConfig.java`
- `auth-service/src/main/resources/application.yml`
- `auth-service/src/main/resources/application-local.yml`
- `auth-service/src/main/resources/application-dev.yml`
- `auth-service/src/main/resources/application-test.yml`
- `auth-service/src/main/resources/application-prod.yml`
- `docs/auth/00-etapa-0/auth-service-base.md`
