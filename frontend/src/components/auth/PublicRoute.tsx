import { Navigate, Outlet, useLocation } from "react-router-dom";

import { useAuth } from "@/contexts/AuthContext";

interface LocationState {
  from?: {
    pathname?: string;
    search?: string;
  };
}

export function PublicRoute() {
  const location = useLocation();
  const { isAuthenticated, isLoading } = useAuth();
  const state = location.state as LocationState | null;
  const redirectTo = state?.from?.pathname ? `${state.from.pathname}${state.from.search ?? ""}` : "/dashboard";

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background text-sm text-muted-foreground">
        Cargando sesión…
      </div>
    );
  }

  if (isAuthenticated) {
    return <Navigate to={redirectTo} replace />;
  }

  return <Outlet />;
}
