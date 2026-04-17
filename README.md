# morosos-control-service

Base de backend para V1 del microservicio de control de morosos.

## Stack
- Java 21
- Maven
- Spring Boot 3.x
- Spring Web
- Spring Data JPA
- Validation
- PostgreSQL (única base de datos para local y servidor)

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
1. Levantar PostgreSQL (local o contenedor) y crear la base de datos.
2. Configurar variables de entorno del datasource.

```bash
export DB_HOST=localhost
export DB_PORT=5432
export DB_NAME=morososdb
export DB_USERNAME=postgres
export DB_PASSWORD=postgres
mvn spring-boot:run
```

- API base: `http://localhost:8081/api/v1`
- El servicio utiliza PostgreSQL como única base de datos.

### Documentación OpenAPI (Swagger UI + Scalar)
Por defecto en local, la documentación está habilitada.

- OpenAPI JSON: `http://localhost:8081/v3/api-docs`
- Swagger UI: `http://localhost:8081/swagger-ui.html` (o `.../swagger-ui/index.html`)
- Scalar: `http://localhost:8081/scalar`

Para apagar documentación por variables:
```bash
export SPRINGDOC_API_DOCS_ENABLED=false
export SPRINGDOC_SWAGGER_UI_ENABLED=false
export SPRINGDOC_SCALAR_ENABLED=false
```

Para apagar documentación en producción, activar perfil `prod` (ya viene deshabilitado en `application-prod.yml`):
```bash
export SPRING_PROFILES_ACTIVE=prod
```

## Migraciones de esquema (Flyway)
Flyway es la estrategia oficial para evolucionar el esquema de base de datos en este microservicio.

### Estructura
- Las migraciones SQL están en `src/main/resources/db/migration`.
- Migraciones iniciales de esquema: `V1__init.sql` a `V10__create_registro_corte_table.sql`.

### Convención para nuevas migraciones
1. Crear un archivo con nombre `V<numero>__<descripcion>.sql`.
2. Usar un número incremental único (ejemplo: `V11__add_index_to_inmuebles.sql`).
3. Incluir únicamente cambios de esquema/datos necesarios para esa versión.
4. Al arrancar la app, Flyway aplicará automáticamente las migraciones pendientes en orden.

Ejemplo:
```sql
-- src/main/resources/db/migration/V11__add_index_to_inmuebles.sql
CREATE INDEX idx_inmuebles_numero_cuenta ON inmuebles(numero_cuenta);
```

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

## Frontend V1 (base)
Se agregó una base de frontend en `frontend/` usando React + TypeScript + Vite.

### Ejecutar frontend
```bash
cd frontend
npm install
npm run dev
```

### Configuración
- Copiar `.env.example` a `.env`.
- `VITE_API_URL` define la URL base del backend (por defecto `http://localhost:8081/api/v1`).

### Mantenimientos V1 ya disponibles
- Grupos: listado, creación y edición.
- Configuración general: visualización/edición de `minimoCuotasSeguimiento`.
- Tipos de corte: listado, creación y edición.
- Motivos de corte: listado, creación, edición, activar/desactivar y eliminación (sujeta a validación del backend).
- Inmuebles: listado, búsqueda por `numeroCuenta`/`propietarioNombre`/`direccionCompleta`/`distrito`, creación, edición e importación Excel con resumen de resultados.
- Estado de deuda: carga/edición de `cuotasAdeudadas` y `montoAdeudado`, mostrando `fechaActualizacion`.
- Lista general de morosos: filtros operativos, ordenamiento, selección múltiple (incluyendo seleccionar visibles), asignación de etapa inicial y creación masiva de casos.
- Bandejas por etapa (`Aviso de deuda`, `Intimación`, `Aviso de corte`, `Corte`): filtros básicos, selección múltiple, seleccionar visibles, avanzar/repetir etapa y acceso a detalle de caso; casos cerrados excluidos y pausados diferenciados/filtrables.
- Detalle de caso: datos del inmueble, estado/etapa, fechas, historial de etapas (vista operativa), compromisos, registros de corte en etapa `CORTE` y acciones de avanzar/repetir, pausar por compromiso, cerrar caso y registrar corte.
- Compromisos en detalle de caso: alta (`fechaDesde` obligatoria, `fechaHasta`/`observacion` opcionales), listado y acción para marcar incumplido/reactivar caso; al registrar compromiso se visualiza estado `PAUSADO`.
- Registros de corte en detalle de caso: formulario (fecha, tipo, motivo y observación opcional), visibilidad solo en etapa `CORTE` y historial de múltiples cortes del caso en orden operativo.
