import { NavLink, Outlet, matchPath, useLocation } from 'react-router-dom';

type NavSection = {
  title: string;
  items: Array<{ to: string; label: string; activeMatch?: string[] }>;
};

const navSections: NavSection[] = [
  {
    title: 'Operación diaria',
    items: [
      { to: '/inmuebles', label: 'Inmuebles', activeMatch: ['/inmuebles', '/inmuebles/:inmuebleId'] },
      { to: '/estados-deuda', label: 'Estado de deuda', activeMatch: ['/estados-deuda', '/estados-deuda/importacion'] },
      { to: '/estados-deuda/cargas', label: 'Cargas de deuda', activeMatch: ['/estados-deuda/cargas/*'] },
      { to: '/morosos', label: 'Morosos (consulta)', activeMatch: ['/morosos'] },
      { to: '/bandejas', label: 'Bandeja por etapa', activeMatch: ['/bandejas', '/casos/:casoId'] }
    ]
  },
  {
    title: 'Configuración',
    items: [
      { to: '/grupos', label: 'Grupos', activeMatch: ['/grupos'] },
      { to: '/catalogos', label: 'Catálogos', activeMatch: ['/catalogos', '/configuracion-general', '/tipos-corte', '/motivos-corte'] },
      { to: '/dashboard', label: 'Dashboard', activeMatch: ['/dashboard'] }
    ]
  }
];

function normalizePath(pathname: string) {
  if (pathname === '/') {
    return pathname;
  }

  return pathname.endsWith('/') ? pathname.slice(0, -1) : pathname;
}

const navSectionsWithMatchers: NavSection[] = navSections.map((section) => ({
  ...section,
  items: section.items.map((item) => ({
    ...item,
    activeMatch: item.activeMatch ?? [item.to]
  }))
}));

export function AppShell() {
  const location = useLocation();
  const currentPath = normalizePath(location.pathname);

  const isItemActive = (activeMatch: string[]) =>
    activeMatch.some((pattern) => Boolean(matchPath({ path: pattern, end: true }, currentPath)));

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <h1>Morosos V1</h1>
        <nav>
          {navSectionsWithMatchers.map((section) => (
            <div key={section.title} className="nav-section">
              <p className="nav-section-title">{section.title}</p>
              {section.items.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  className={isItemActive(item.activeMatch ?? [item.to]) ? 'nav-link active' : 'nav-link'}
                >
                  {item.label}
                </NavLink>
              ))}
            </div>
          ))}
        </nav>
      </aside>
      <main className="content">
        <Outlet />
      </main>
    </div>
  );
}
