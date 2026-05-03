import { accionesMes, accionesLabels, distritosStats, resumenMorosidad, ultimosMovimientos } from "@/data/mock";

export function getDashboardDemoData() {
  return { resumenMorosidad, accionesMes, distritosStats, ultimosMovimientos };
}

export { accionesMes, distritosStats, resumenMorosidad, ultimosMovimientos, accionesLabels };
