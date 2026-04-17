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


### Inmueble (`/api/v1/inmuebles`)
- `POST /api/v1/inmuebles`
- `POST /api/v1/inmuebles/importacion/excel` (multipart `.xlsx`)
- `GET /api/v1/inmuebles/{id}`
- `GET /api/v1/inmuebles?numeroCuenta=&propietarioNombre=&direccionCompleta=&distrito=`
- `PUT /api/v1/inmuebles/{id}`
- `DELETE /api/v1/inmuebles/{id}`


### EstadoDeuda (`/api/v1/estados-deuda`)
- `POST /api/v1/estados-deuda`
- `PUT /api/v1/estados-deuda/{id}`
- `GET /api/v1/estados-deuda/{id}`
- `GET /api/v1/estados-deuda?inmuebleId=`
- `GET /api/v1/estados-deuda/inmuebles/{inmuebleId}/aptitud`
- `GET /api/v1/estados-deuda/morosos?numeroCuenta=&propietarioNombre=&direccionCompleta=&distrito=&grupo=&cuotasAdeudadas=&montoAdeudado=&seguimientoHabilitado=&aptoParaSeguimiento=`


### CasoSeguimiento (`/api/v1/casos-seguimiento`)
- `POST /api/v1/casos-seguimiento` (creación manual indicando etapa inicial)
- `GET /api/v1/casos-seguimiento/{id}`
- `GET /api/v1/casos-seguimiento?inmuebleId=&estadoSeguimiento=`
- `POST /api/v1/casos-seguimiento/{id}/avanzar-etapa`
- `POST /api/v1/casos-seguimiento/{id}/repetir-etapa`
- `POST /api/v1/casos-seguimiento/{id}/cerrar`


### CompromisoPago (`/api/v1`)
- `POST /api/v1/casos-seguimiento/{casoId}/compromisos-pago`
- `POST /api/v1/compromisos-pago/{compromisoId}/incumplir`
- `GET /api/v1/casos-seguimiento/{casoId}/compromisos-pago`


### RegistroCorte (`/api/v1/casos-seguimiento/{casoId}/registros-corte`)
- `POST /api/v1/casos-seguimiento/{casoId}/registros-corte`
- `GET /api/v1/casos-seguimiento/{casoId}/registros-corte`


### Operaciones masivas de seguimiento (`/api/v1/casos-seguimiento/masivo`)
- `POST /api/v1/casos-seguimiento/masivo/validar-inmuebles-aptos`
- `POST /api/v1/casos-seguimiento/masivo/crear`
- `POST /api/v1/casos-seguimiento/masivo/avanzar-etapa`
- `POST /api/v1/casos-seguimiento/masivo/repetir-etapa`

## Ejecución local
```bash
mvn spring-boot:run
```

- API base: `http://localhost:8081/api/v1`
- H2 Console: `http://localhost:8081/h2-console`

## Nota de arquitectura
- En operaciones masivas, se respetan las mismas reglas de negocio del flujo individual: sin retrocesos, casos `CERRADO` no operables, casos `PAUSADO` no avanzan, y casos en `CORTE` no avanzan a etapa posterior.
- En `RegistroCorte`, solo se permiten nuevos registros cuando el caso está en etapa `CORTE`; un caso puede tener múltiples registros y se valida que `MotivoCorte` esté activo para nuevos registros.
- En `CompromisoPago`, al registrar compromiso el caso pasa a `PAUSADO`; si vence sin cumplimiento el compromiso pasa a `INCUMPLIDO` y el caso vuelve a `ACTIVO` (sin job programado, evaluación en operaciones del caso/listado de compromisos).
- En `CasoSeguimiento`, no se permite crear caso para inmueble no apto; no hay retroceso normal de etapa, sí repetición de etapa actual, y la etapa inicial se define manualmente al crear.
- En `CasoSeguimiento`, el cierre manual recibe motivo libre (por ejemplo: pago total o plan de pago), completa `fechaCierre`, cambia estado a `CERRADO` y no permite reapertura en esta V1.
- En `EstadoDeuda`, la aptitud para seguimiento operativo se calcula como: `seguimientoHabilitado=true` y `cuotasAdeudadas >= minimoCuotasSeguimiento` de `ConfiguracionGeneral` (sin crear casos automáticamente).
- `Grupo.nombre` se corresponde con el campo **Segmento** del Excel.
- `Grupo.seguimientoActivo` define si los inmuebles de ese grupo pueden entrar al seguimiento operativo.
- Si cambia `seguimientoActivo`, el servicio deja preparado el método `recalcularInmueblesAsociados(...)` como punto de extensión (sin lógica implementada todavía).
- En `MotivoCorte`, si `activo=false` no aparece en selección operativa (`/operativos`).
- En `MotivoCorte`, la eliminación valida uso mediante `MotivoCorteUsageChecker` (preparado para integrar con RegistroCorte en próxima iteración).
- En `Inmueble`, `numeroCuenta` es único y `grupo` es relación a `Grupo` (no se guarda segmento como string).
- En `Inmueble`, `seguimientoHabilitado` se calcula desde `grupo.seguimientoActivo` al crear/actualizar.
- Importación Excel de inmuebles: usa `numeroCuenta` como clave de negocio para crear/actualizar, crea `Grupo` automáticamente a partir de `Segmento` si no existe y recalcula `seguimientoHabilitado` desde `grupo.seguimientoActivo`.
- Este microservicio permanece desacoplado de autenticación/autorización para integrarse en una fase posterior con un AuthService externo.
