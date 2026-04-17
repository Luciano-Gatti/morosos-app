import { NavLink, Outlet } from 'react-router-dom';

type NavSection = {
  title: string;
  items: Array<{ to: string; label: string }>;
};

const navSections: NavSection[] = [
  {
    title: 'Operación diaria',
    items: [
      { to: '/inmuebles', label: 'Inmuebles' },
      { to: '/estados-deuda', label: 'Estado de deuda' },
      { to: '/morosos', label: 'Morosos' },
      { to: '/bandejas', label: 'Bandejas por etapa' }
    ]
  },
  {
    title: 'Configuración',
    items: [
      { to: '/grupos', label: 'Grupos' },
      { to: '/catalogos', label: 'Catálogos' },
      { to: '/dashboard', label: 'Dashboard' }
    ]
  }
];

export function AppShell() {
  return (
    <div className="app-shell">
      <aside className="sidebar">
        <h1>Morosos V1</h1>
        <nav>
          {navSections.map((section) => (
            <div key={section.title} className="nav-section">
              <p className="nav-section-title">{section.title}</p>
              {section.items.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  className={({ isActive }) => (isActive ? 'nav-link active' : 'nav-link')}
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
