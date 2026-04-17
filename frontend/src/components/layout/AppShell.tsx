import { NavLink, Outlet } from 'react-router-dom';

const navItems = [
  { to: '/inmuebles', label: 'Inmuebles' },
  { to: '/estados-deuda', label: 'Estado deuda' },
  { to: '/morosos', label: 'Morosos' },
  { to: '/bandejas', label: 'Bandejas etapa' },
  { to: '/grupos', label: 'Grupos' },
  { to: '/configuracion-general', label: 'Config. General' },
  { to: '/tipos-corte', label: 'Tipos de corte' },
  { to: '/motivos-corte', label: 'Motivos de corte' },
  { to: '/dashboard', label: 'Dashboard' }
];

export function AppShell() {
  return (
    <div className="app-shell">
      <aside className="sidebar">
        <h1>Morosos V1</h1>
        <nav>
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) => (isActive ? 'nav-link active' : 'nav-link')}
            >
              {item.label}
            </NavLink>
          ))}
        </nav>
      </aside>
      <main className="content">
        <Outlet />
      </main>
    </div>
  );
}
