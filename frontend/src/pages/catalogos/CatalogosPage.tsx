import { Link } from 'react-router-dom';

export function CatalogosPage() {
  return (
    <section>
      <h2>Catálogos y configuración</h2>
      <p>Seleccioná el mantenimiento que querés operar.</p>
      <ul className="catalog-links">
        <li>
          <Link to="/configuracion-general">Configuración general</Link>
        </li>
        <li>
          <Link to="/tipos-corte">Tipos de corte</Link>
        </li>
        <li>
          <Link to="/motivos-corte">Motivos de corte</Link>
        </li>
      </ul>
    </section>
  );
}
