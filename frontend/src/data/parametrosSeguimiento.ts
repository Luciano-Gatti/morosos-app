// Parámetros operativos del sistema de seguimiento.
// Centralizados acá para que distintas vistas (Gestión de etapas, Seguimiento, etc.)
// utilicen los mismos valores que se configuran en /configuracion/seguimiento.

export const parametrosSeguimiento = {
  // Cantidad mínima de cuotas adeudadas para que un inmueble sea considerado
  // moroso e ingrese al circuito de gestión de etapas.
  cuotasParaMoroso: 3,
} as const;
