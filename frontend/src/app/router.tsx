import { Navigate, createBrowserRouter } from 'react-router-dom';
import { AppShell } from '../components/layout/AppShell';
import { DashboardPage } from '../pages/dashboard/DashboardPage';
import { InmuebleListPage } from '../pages/inmuebles/InmuebleListPage';
import { InmuebleDetailPage } from '../pages/inmuebles/InmuebleDetailPage';
import { GrupoListPage } from '../pages/grupos/GrupoListPage';
import { CatalogosPage } from '../pages/catalogos/CatalogosPage';
import { ConfiguracionGeneralPage } from '../pages/catalogos/ConfiguracionGeneralPage';
import { TiposCortePage } from '../pages/catalogos/TiposCortePage';
import { MotivosCortePage } from '../pages/catalogos/MotivosCortePage';
import { EstadoDeudaPage } from '../pages/estadodeuda/EstadoDeudaPage';
import { MorososListPage } from '../pages/morosos/MorososListPage';
import { BandejasEtapaPage } from '../pages/bandejas/BandejasEtapaPage';
import { CasoDetailPage } from '../pages/casos/CasoDetailPage';

export const router = createBrowserRouter([
  {
    path: '/',
    element: <AppShell />,
    children: [
      { index: true, element: <Navigate to="/inmuebles" replace /> },
      { path: 'dashboard', element: <DashboardPage /> },
      { path: 'inmuebles', element: <InmuebleListPage /> },
      { path: 'inmuebles/:inmuebleId', element: <InmuebleDetailPage /> },
      { path: 'grupos', element: <GrupoListPage /> },
      { path: 'catalogos', element: <CatalogosPage /> },
      { path: 'configuracion-general', element: <ConfiguracionGeneralPage /> },
      { path: 'tipos-corte', element: <TiposCortePage /> },
      { path: 'motivos-corte', element: <MotivosCortePage /> },
      { path: 'estados-deuda', element: <EstadoDeudaPage /> },
      { path: 'morosos', element: <MorososListPage /> },
      { path: 'bandejas', element: <BandejasEtapaPage /> },
      { path: 'casos/:casoId', element: <CasoDetailPage /> }
    ]
  }
]);
