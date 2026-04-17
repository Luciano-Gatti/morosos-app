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
- Módulos funcionales implementados:
  - **Grupos** y **Configuración General**
  - **Catálogos de corte**: TipoCorte y MotivoCorte
- Sin seguridad/login/roles/permisos.
- Sin auditoría.

## Convención de nombres
- Controller: `<Entidad>Controller` en `...<modulo>.api`
- Service (contrato): `<Entidad>Service` en `...<modulo>.application`
- Service impl: `<Entidad>ServiceImpl` en `...<modulo>.application`
- Repository: `<Entidad>Repository` en `...<modulo>.infrastructure`
- Entity: `<Entidad>` en `...<modulo>.domain`
- DTO request/response: `<Entidad>Request`, `<Entidad>Response` en `...<modulo>.api.dto`

## Endpoints implementados
### Grupos (`/api/v1/grupos`)
- `POST /api/v1/grupos`
- `GET /api/v1/grupos/{id}`
- `GET /api/v1/grupos`
- `PUT /api/v1/grupos/{id}`
- `DELETE /api/v1/grupos/{id}`

### Configuración General (`/api/v1/configuraciones-generales`)
- `POST /api/v1/configuraciones-generales`
- `GET /api/v1/configuraciones-generales/{id}`
- `GET /api/v1/configuraciones-generales`
- `PUT /api/v1/configuraciones-generales/{id}`
- `DELETE /api/v1/configuraciones-generales/{id}`

### TipoCorte (`/api/v1/tipos-corte`)
- `POST /api/v1/tipos-corte`
- `GET /api/v1/tipos-corte/{id}`
- `GET /api/v1/tipos-corte`
- `PUT /api/v1/tipos-corte/{id}`
- `DELETE /api/v1/tipos-corte/{id}`

### MotivoCorte (`/api/v1/motivos-corte`)
- `POST /api/v1/motivos-corte`
- `GET /api/v1/motivos-corte/{id}`
- `GET /api/v1/motivos-corte`
- `GET /api/v1/motivos-corte/operativos` (solo `activo=true`)
- `PUT /api/v1/motivos-corte/{id}`
- `DELETE /api/v1/motivos-corte/{id}`

## Ejecución local
```bash
mvn spring-boot:run
```

- API base: `http://localhost:8081/api/v1`
- H2 Console: `http://localhost:8081/h2-console`

## Nota de arquitectura
- `Grupo.nombre` se corresponde con el campo **Segmento** del Excel.
- `Grupo.seguimientoActivo` define si los inmuebles de ese grupo pueden entrar al seguimiento operativo.
- Si cambia `seguimientoActivo`, el servicio deja preparado el método `recalcularInmueblesAsociados(...)` como punto de extensión (sin lógica implementada todavía).
- En `MotivoCorte`, si `activo=false` no aparece en selección operativa (`/operativos`).
- En `MotivoCorte`, la eliminación valida uso mediante `MotivoCorteUsageChecker` (preparado para integrar con RegistroCorte en próxima iteración).
- Este microservicio permanece desacoplado de autenticación/autorización para integrarse en una fase posterior con un AuthService externo.
