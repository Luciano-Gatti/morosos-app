import { routePermissions } from "@/auth/routePermissions";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { PublicRoute } from "@/components/auth/PublicRoute";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AppLayout } from "@/components/layout/AppLayout";
import { AuthProvider } from "@/context/AuthContext";
import Dashboard from "./pages/Dashboard";
import Inmuebles from "./pages/Inmuebles";
import InmuebleDetalle from "./pages/InmuebleDetalle";
import HistorialSeguimiento from "./pages/HistorialSeguimiento";
import HistorialDeudaInmueble from "./pages/HistorialDeudaInmueble";
import ObservacionesExpedienteInmueble from "./pages/ObservacionesExpedienteInmueble";
import GestionDeuda from "./pages/GestionDeuda";
import CargaDetalle from "./pages/CargaDetalle";
import GestionEtapas from "./pages/GestionEtapas";
import Reportes from "./pages/Reportes";
import ConfiguracionGrupos from "./pages/ConfiguracionGrupos";
import ConfiguracionSeguimiento from "./pages/ConfiguracionSeguimiento";
import ConfiguracionEtapas from "./pages/ConfiguracionEtapas";
import ConfiguracionMotivosCierre from "./pages/ConfiguracionMotivosCierre";
import { PlaceholderPage } from "./pages/PlaceholderPage";
import NotFound from "./pages/NotFound.tsx";
import Login from "./pages/Login";
import Registro from "./pages/Registro";
import OlvideContrasena from "./pages/OlvideContrasena";
import RestablecerContrasena from "./pages/RestablecerContrasena";
import AdminUsuarios from "./pages/AdminUsuarios";
import AdminRolesPermisos from "./pages/AdminRolesPermisos";
import AuthAudit from "./pages/AuthAudit";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            <Route element={<ProtectedRoute />}>
              <Route element={<AppLayout />}>
                <Route element={<ProtectedRoute {...routePermissions.dashboard} />}>
                  <Route path="/" element={<Dashboard />} />
                  <Route path="/dashboard" element={<Dashboard />} />
                </Route>
                <Route element={<ProtectedRoute {...routePermissions.inmuebles} />}>
                  <Route path="/inmuebles" element={<Inmuebles />} />
                </Route>
                <Route element={<ProtectedRoute {...routePermissions.inmuebleDetalle} />}>
                  <Route path="/inmuebles/:id" element={<InmuebleDetalle />} />
                </Route>
                <Route element={<ProtectedRoute {...routePermissions.historialSeguimiento} />}>
                  <Route path="/inmuebles/:id/seguimiento" element={<HistorialSeguimiento />} />
                </Route>
                <Route element={<ProtectedRoute {...routePermissions.historialDeuda} />}>
                  <Route path="/inmuebles/:id/historial-deuda" element={<HistorialDeudaInmueble />} />
                </Route>
                <Route element={<ProtectedRoute {...routePermissions.observacionesExpediente} />}>
                  <Route path="/inmuebles/:id/observaciones-expediente" element={<ObservacionesExpedienteInmueble />} />
                </Route>
                <Route element={<ProtectedRoute {...routePermissions.deuda} />}>
                  <Route path="/deuda" element={<GestionDeuda />} />
                </Route>
                <Route element={<ProtectedRoute {...routePermissions.cargaDetalle} />}>
                  <Route path="/deuda/:id" element={<CargaDetalle />} />
                </Route>
                <Route element={<ProtectedRoute {...routePermissions.etapas} />}>
                  <Route path="/etapas" element={<GestionEtapas />} />
                </Route>
                <Route element={<ProtectedRoute {...routePermissions.reportes} />}>
                  <Route path="/reportes" element={<Reportes />} />
                  <Route path="/reportes/:reporteId" element={<Reportes />} />
                </Route>
                <Route path="/administracion" element={<Navigate to="/administracion/usuarios" replace />} />
                <Route element={<ProtectedRoute {...routePermissions.adminUsuarios} />}>
                  <Route path="/administracion/usuarios" element={<AdminUsuarios />} />
                </Route>
                <Route element={<ProtectedRoute {...routePermissions.adminRolesPermisos} />}>
                  <Route path="/administracion/roles-permisos" element={<AdminRolesPermisos />} />
                </Route>
                <Route element={<ProtectedRoute {...routePermissions.authAudit} />}>
                  <Route path="/administracion/auth-audit" element={<AuthAudit />} />
                </Route>
                <Route
                  path="/configuracion"
                  element={
                    <PlaceholderPage
                      title="Configuración"
                      description="Parámetros generales del sistema."
                      breadcrumb={[{ label: "Configuración" }]}
                    />
                  }
                />
                <Route element={<ProtectedRoute {...routePermissions.configuracionGrupos} />}>
                  <Route path="/configuracion/grupos" element={<ConfiguracionGrupos />} />
                </Route>
                <Route element={<ProtectedRoute {...routePermissions.configuracionSeguimiento} />}>
                  <Route path="/configuracion/seguimiento" element={<ConfiguracionSeguimiento />} />
                </Route>
                <Route element={<ProtectedRoute {...routePermissions.configuracionEtapas} />}>
                  <Route path="/configuracion/etapas" element={<ConfiguracionEtapas />} />
                </Route>
                <Route element={<ProtectedRoute {...routePermissions.configuracionMotivosCierre} />}>
                  <Route path="/configuracion/motivos-cierre" element={<ConfiguracionMotivosCierre />} />
                </Route>
                <Route path="/configuracion/usuarios" element={<Navigate to="/administracion/usuarios" replace />} />
              </Route>
            </Route>
            <Route element={<PublicRoute />}>
              <Route path="/login" element={<Login />} />
              <Route path="/registro" element={<Registro />} />
              <Route path="/olvide-contrasena" element={<OlvideContrasena />} />
              <Route path="/forgot-password" element={<OlvideContrasena />} />
              <Route path="/restablecer-contrasena" element={<RestablecerContrasena />} />
              <Route path="/reset-password" element={<RestablecerContrasena />} />
            </Route>
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
