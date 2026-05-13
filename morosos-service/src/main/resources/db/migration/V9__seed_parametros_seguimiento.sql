INSERT INTO parametro_seguimiento (id, codigo, valor, descripcion, created_by, created_at, updated_by, updated_at)
VALUES
    ('1b5ace95-5227-4d63-bcbf-970e336d5276', 'CUOTAS_PARA_MOROSO', '3', 'Cantidad mínima de cuotas vencidas para considerar moroso.', 'SYSTEM_MOROSOS', NOW(), 'SYSTEM_MOROSOS', NOW()),
    ('d6f33d61-0a64-4fa4-952a-0151b8fef37b', 'REANUDACION_POR_INCUMPLIMIENTO', 'true', 'Reanudar seguimiento automáticamente ante incumplimiento de compromiso.', 'SYSTEM_MOROSOS', NOW(), 'SYSTEM_MOROSOS', NOW()),
    ('0b9244b1-f0d2-46a3-8a95-9d2b19688ec8', 'DIAS_ENTRE_ETAPAS', '15', 'Días mínimos de permanencia en etapa antes de poder avanzar.', 'SYSTEM_MOROSOS', NOW(), 'SYSTEM_MOROSOS', NOW()),
    ('cbf7d11e-2dcb-4b3b-9922-65d67d172bb8', 'NOTIFICAR_CAMBIOS_ETAPA', 'true', 'Enviar notificación cuando el caso cambia de etapa.', 'SYSTEM_MOROSOS', NOW(), 'SYSTEM_MOROSOS', NOW()),
    ('af4dcf33-8ef3-4266-80f6-ae9513f4626f', 'MODO_OPERACION', 'asistido', 'Modo operativo del flujo de seguimiento (manual o asistido).', 'SYSTEM_MOROSOS', NOW(), 'SYSTEM_MOROSOS', NOW())
ON CONFLICT (codigo) DO NOTHING;
