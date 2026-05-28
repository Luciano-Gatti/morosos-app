CREATE TABLE IF NOT EXISTS permisos (
    id UUID NOT NULL,
    codigo VARCHAR(120) NOT NULL,
    nombre VARCHAR(160) NOT NULL,
    descripcion VARCHAR(500) NOT NULL,
    modulo VARCHAR(80) NOT NULL,
    recurso VARCHAR(100) NOT NULL,
    accion VARCHAR(50) NOT NULL,
    activo BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL,
    created_by VARCHAR(120),
    updated_by VARCHAR(120),
    CONSTRAINT pk_permisos PRIMARY KEY (id),
    CONSTRAINT uk_permisos_codigo UNIQUE (codigo)
);

CREATE INDEX IF NOT EXISTS idx_permisos_modulo ON permisos (modulo);
CREATE INDEX IF NOT EXISTS idx_permisos_recurso ON permisos (recurso);
CREATE INDEX IF NOT EXISTS idx_permisos_accion ON permisos (accion);
CREATE INDEX IF NOT EXISTS idx_permisos_activo ON permisos (activo);

CREATE TABLE IF NOT EXISTS roles (
    id UUID NOT NULL,
    codigo VARCHAR(80) NOT NULL,
    nombre VARCHAR(160) NOT NULL,
    descripcion VARCHAR(500),
    activo BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL,
    created_by VARCHAR(120),
    updated_by VARCHAR(120),
    CONSTRAINT pk_roles PRIMARY KEY (id),
    CONSTRAINT uk_roles_codigo UNIQUE (codigo)
);

CREATE INDEX IF NOT EXISTS idx_roles_activo ON roles (activo);

CREATE TABLE IF NOT EXISTS rol_permisos (
    id UUID NOT NULL,
    rol_id UUID NOT NULL,
    permiso_id UUID NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL,
    CONSTRAINT pk_rol_permisos PRIMARY KEY (id),
    CONSTRAINT fk_rol_permisos_rol FOREIGN KEY (rol_id) REFERENCES roles (id),
    CONSTRAINT fk_rol_permisos_permiso FOREIGN KEY (permiso_id) REFERENCES permisos (id),
    CONSTRAINT uk_rol_permisos_rol_permiso UNIQUE (rol_id, permiso_id)
);

CREATE INDEX IF NOT EXISTS idx_rol_permisos_rol_id ON rol_permisos (rol_id);
CREATE INDEX IF NOT EXISTS idx_rol_permisos_permiso_id ON rol_permisos (permiso_id);

CREATE TABLE IF NOT EXISTS endpoint_permisos (
    id UUID NOT NULL,
    servicio VARCHAR(80) NOT NULL,
    metodo_http VARCHAR(10) NOT NULL,
    path_pattern VARCHAR(300) NOT NULL,
    permiso_id UUID NOT NULL,
    descripcion VARCHAR(500),
    activo BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL,
    CONSTRAINT pk_endpoint_permisos PRIMARY KEY (id),
    CONSTRAINT fk_endpoint_permisos_permiso FOREIGN KEY (permiso_id) REFERENCES permisos (id),
    CONSTRAINT uk_endpoint_permisos_servicio_metodo_path UNIQUE (servicio, metodo_http, path_pattern)
);

CREATE INDEX IF NOT EXISTS idx_endpoint_permisos_permiso_id ON endpoint_permisos (permiso_id);
CREATE INDEX IF NOT EXISTS idx_endpoint_permisos_servicio ON endpoint_permisos (servicio);
CREATE INDEX IF NOT EXISTS idx_endpoint_permisos_metodo_http ON endpoint_permisos (metodo_http);
CREATE INDEX IF NOT EXISTS idx_endpoint_permisos_activo ON endpoint_permisos (activo);
