import { Navigate } from 'react-router-dom';

export function ImportacionDeudaPage() {
  return <Navigate to="/estados-deuda/cargas?tab=importar" replace />;
}
