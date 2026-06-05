CREATE TABLE IF NOT EXISTS usuarios (
    id UUID NOT NULL,
    username VARCHAR(80) NOT NULL,
    email VARCHAR(180) NOT NULL,
    password_hash VARCHAR(255),
    nombre VARCHAR(120) NOT NULL,
    apellido VARCHAR(120),
    activo BOOLEAN NOT NULL DEFAULT TRUE,
    email_verificado BOOLEAN NOT NULL DEFAULT FALSE,
    provider_principal VARCHAR(80),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL,
    created_by VARCHAR(120),
    updated_by VARCHAR(120),
    CONSTRAINT pk_usuarios PRIMARY KEY (id)
);

CREATE UNIQUE INDEX IF NOT EXISTS uk_usuarios_username_lower ON usuarios (lower(username));
CREATE UNIQUE INDEX IF NOT EXISTS uk_usuarios_email_lower ON usuarios (lower(email));
CREATE INDEX IF NOT EXISTS idx_usuarios_activo ON usuarios (activo);
CREATE INDEX IF NOT EXISTS idx_usuarios_email_verificado ON usuarios (email_verificado);

CREATE TABLE IF NOT EXISTS usuario_roles (
    id UUID NOT NULL,
    usuario_id UUID NOT NULL,
    rol_id UUID NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL,
    CONSTRAINT pk_usuario_roles PRIMARY KEY (id),
    CONSTRAINT fk_usuario_roles_usuario FOREIGN KEY (usuario_id) REFERENCES usuarios (id),
    CONSTRAINT fk_usuario_roles_rol FOREIGN KEY (rol_id) REFERENCES roles (id),
    CONSTRAINT uk_usuario_roles_usuario_rol UNIQUE (usuario_id, rol_id)
);

CREATE INDEX IF NOT EXISTS idx_usuario_roles_usuario_id ON usuario_roles (usuario_id);
CREATE INDEX IF NOT EXISTS idx_usuario_roles_rol_id ON usuario_roles (rol_id);

CREATE TABLE IF NOT EXISTS identidades_externas (
    id UUID NOT NULL,
    usuario_id UUID NOT NULL,
    provider VARCHAR(40) NOT NULL,
    provider_subject VARCHAR(255) NOT NULL,
    email VARCHAR(180) NOT NULL,
    linked_at TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL,
    CONSTRAINT pk_identidades_externas PRIMARY KEY (id),
    CONSTRAINT fk_identidades_externas_usuario FOREIGN KEY (usuario_id) REFERENCES usuarios (id),
    CONSTRAINT uk_identidades_externas_provider_subject UNIQUE (provider, provider_subject),
    CONSTRAINT uk_identidades_externas_usuario_provider UNIQUE (usuario_id, provider)
);

CREATE INDEX IF NOT EXISTS idx_identidades_externas_usuario_id ON identidades_externas (usuario_id);
CREATE INDEX IF NOT EXISTS idx_identidades_externas_email ON identidades_externas (email);
CREATE INDEX IF NOT EXISTS idx_identidades_externas_provider ON identidades_externas (provider);

CREATE TABLE IF NOT EXISTS password_reset_tokens (
    id UUID NOT NULL,
    usuario_id UUID NOT NULL,
    token_hash VARCHAR(255) NOT NULL,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    used_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL,
    CONSTRAINT pk_password_reset_tokens PRIMARY KEY (id),
    CONSTRAINT fk_password_reset_tokens_usuario FOREIGN KEY (usuario_id) REFERENCES usuarios (id),
    CONSTRAINT uk_password_reset_tokens_token_hash UNIQUE (token_hash)
);

CREATE INDEX IF NOT EXISTS idx_password_reset_usuario_id ON password_reset_tokens (usuario_id);
CREATE INDEX IF NOT EXISTS idx_password_reset_expires_at ON password_reset_tokens (expires_at);
CREATE INDEX IF NOT EXISTS idx_password_reset_used_at ON password_reset_tokens (used_at);

CREATE TABLE IF NOT EXISTS login_attempts (
    id UUID NOT NULL,
    usuario_id UUID,
    username_email_usado VARCHAR(180) NOT NULL,
    resultado VARCHAR(50) NOT NULL,
    ip VARCHAR(80),
    user_agent VARCHAR(512),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL,
    CONSTRAINT pk_login_attempts PRIMARY KEY (id),
    CONSTRAINT fk_login_attempts_usuario FOREIGN KEY (usuario_id) REFERENCES usuarios (id)
);

CREATE INDEX IF NOT EXISTS idx_login_attempts_usuario_id ON login_attempts (usuario_id);
CREATE INDEX IF NOT EXISTS idx_login_attempts_username_email ON login_attempts (username_email_usado);
CREATE INDEX IF NOT EXISTS idx_login_attempts_resultado ON login_attempts (resultado);
CREATE INDEX IF NOT EXISTS idx_login_attempts_created_at ON login_attempts (created_at);
CREATE INDEX IF NOT EXISTS idx_login_attempts_ip ON login_attempts (ip);

CREATE TABLE IF NOT EXISTS audit_log (
    id UUID NOT NULL,
    entity_type VARCHAR(120) NOT NULL,
    entity_id VARCHAR(120),
    action VARCHAR(120) NOT NULL,
    actor_id VARCHAR(120),
    trace_id VARCHAR(120),
    request_path VARCHAR(300),
    old_values JSONB,
    new_values JSONB,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL,
    CONSTRAINT pk_audit_log PRIMARY KEY (id)
);

CREATE INDEX IF NOT EXISTS idx_audit_log_entity_type ON audit_log (entity_type);
CREATE INDEX IF NOT EXISTS idx_audit_log_entity_id ON audit_log (entity_id);
CREATE INDEX IF NOT EXISTS idx_audit_log_actor_id ON audit_log (actor_id);
CREATE INDEX IF NOT EXISTS idx_audit_log_action ON audit_log (action);
CREATE INDEX IF NOT EXISTS idx_audit_log_created_at ON audit_log (created_at);
CREATE INDEX IF NOT EXISTS idx_audit_log_trace_id ON audit_log (trace_id);
