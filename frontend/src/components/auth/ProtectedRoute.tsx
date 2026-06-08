import { Navigate, Outlet, useLocation } from "react-router-dom";

import { useAuth } from "@/hooks/useAuth";

interface ProtectedRouteProps {
  requiredAny?: string[];
  requiredAll?: string[];
}

export function ProtectedRoute({ requiredAny, requiredAll }: ProtectedRouteProps) {
  const location = useLocation();
  const { hasAllPermissions, hasAnyPermission, isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background text-sm text-muted-foreground">
        Cargando sesión…
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  const hasRequiredAll = !requiredAll?.length || hasAllPermissions(requiredAll);
  const hasRequiredAny = !requiredAny?.length || hasAnyPermission(requiredAny);

  if (!hasRequiredAll || !hasRequiredAny) {
    if (location.pathname === "/dashboard" || location.pathname === "/") {
      return (
        <div className="flex min-h-screen items-center justify-center bg-background px-4">
          <div className="max-w-md text-center">
            <h1 className="text-lg font-semibold text-foreground">Acceso denegado</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              Tu cuenta no tiene permisos para entrar a esta pantalla.
            </p>
          </div>
        </div>
      );
    }

    return <Navigate to="/dashboard" replace state={{ from: location, forbidden: true }} />;
  }

  return <Outlet />;
}
