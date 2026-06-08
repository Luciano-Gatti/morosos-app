import { PERMISSIONS, type PermissionCode } from "@/auth/permissions";

export interface RoutePermissionConfig {
  requiredAny?: PermissionCode[];
  requiredAll?: PermissionCode[];
}

export const reportViewPermissions: PermissionCode[] = [
  PERMISSIONS.REPORTES_VER_MOROSOS_GRUPO_DISTRITO,
  PERMISSIONS.REPORTES_VER_ESTADO_INMUEBLES,
  PERMISSIONS.REPORTES_VER_ACCIONES_FECHAS,
  PERMISSIONS.REPORTES_VER_HISTORIAL_MOVIMIENTOS,
  PERMISSIONS.REPORTES_VER_PORCENTAJES_MOROSIDAD,
  PERMISSIONS.REPORTES_VER_ACCIONES_REGULARIZACION,
];

export const routePermissions = {
  dashboard: { requiredAll: [PERMISSIONS.DASHBOARD_VER_RESUMEN] },
  inmuebles: { requiredAll: [PERMISSIONS.INMUEBLES_VER_LISTADO] },
  inmuebleDetalle: { requiredAll: [PERMISSIONS.INMUEBLES_VER_DETALLE] },
  historialSeguimiento: { requiredAll: [PERMISSIONS.SEGUIMIENTO_VER_HISTORIAL_INMUEBLE] },
  historialDeuda: { requiredAll: [PERMISSIONS.INMUEBLES_VER_HISTORIAL_DEUDA] },
  observacionesExpediente: { requiredAll: [PERMISSIONS.INMUEBLES_VER_OBSERVACIONES_EXPEDIENTE] },
  deuda: { requiredAll: [PERMISSIONS.DEUDA_VER_CARGAS] },
  cargaDetalle: { requiredAll: [PERMISSIONS.DEUDA_VER_DETALLE_CARGA] },
  etapas: { requiredAll: [PERMISSIONS.SEGUIMIENTO_VER_BANDEJA] },
  reportes: { requiredAny: reportViewPermissions },
  adminUsuarios: { requiredAll: [PERMISSIONS.USUARIOS_VER_LISTADO] },
  adminRolesPermisos: { requiredAll: [PERMISSIONS.ROLES_VER_LISTADO, PERMISSIONS.PERMISOS_VER_LISTADO] },
  configuracionGrupos: { requiredAny: [PERMISSIONS.CONFIG_VER_GRUPOS, PERMISSIONS.CONFIG_VER_DISTRITOS] },
  configuracionSeguimiento: { requiredAll: [PERMISSIONS.CONFIG_VER_PARAMETROS_SEGUIMIENTO] },
  configuracionEtapas: { requiredAll: [PERMISSIONS.CONFIG_VER_ETAPAS] },
  configuracionMotivosCierre: { requiredAll: [PERMISSIONS.CONFIG_VER_MOTIVOS_CIERRE] },
  authAudit: { requiredAll: [PERMISSIONS.AUDITORIA_VER_MOVIMIENTOS] },
} satisfies Record<string, RoutePermissionConfig>;
