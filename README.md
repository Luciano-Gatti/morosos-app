# morosos-control-service

Base de backend para V1 del microservicio de control de morosos.

## Stack
- Java 21
- Maven
- Spring Boot 3.x
- Spring Web
- Spring Data JPA
- Validation
- H2 (relacional para entorno local)

## Alcance V1 actual
- Estructura de proyecto y capas base.
- Configuración local lista para levantar.
- Convención uniforme por módulo (`api`, `application`, `domain`, `infrastructure`).
- Sin seguridad/login/roles/permisos.
- Sin auditoría.

## Convención de nombres
- Controller: `<Entidad>Controller` en `...<modulo>.api`
- Service (contrato): `<Entidad>Service` en `...<modulo>.application`
- Service impl: `<Entidad>ServiceImpl` en `...<modulo>.application`
- Repository: `<Entidad>Repository` en `...<modulo>.infrastructure`
- Entity: `<Entidad>` en `...<modulo>.domain`
- DTO request/response: `<Entidad><Accion>Request`, `<Entidad>Response` en `...<modulo>.api.dto`

## Ejecución local
```bash
mvn spring-boot:run
```

- API base: `http://localhost:8081/api/v1`
- H2 Console: `http://localhost:8081/h2-console`

## Nota de arquitectura
Este microservicio permanece desacoplado de autenticación/autorización para integrarse en una fase posterior con un AuthService externo.
