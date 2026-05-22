create table if not exists deuda_efectiva_actual (
    id uuid primary key,
    inmueble_id uuid not null unique references inmueble(id),
    caso_seguimiento_id uuid null references caso_seguimiento(id),
    origen varchar(40) not null,
    cuotas_adeudadas integer not null,
    monto_adeudado numeric(14,2) not null,
    fecha_actualizacion timestamptz not null default now(),
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now(),
    created_by varchar(120),
    updated_by varchar(120)
);

create index if not exists idx_deuda_efectiva_actual_inmueble on deuda_efectiva_actual (inmueble_id);
