import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { PublicRoute } from "@/components/auth/PublicRoute";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AppLayout } from "@/components/layout/AppLayout";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { PublicRoute } from "@/components/auth/PublicRoute";
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
                <Route path="/" element={<Dashboard />} />
                <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/inmuebles" element={<Inmuebles />} />
            <Route path="/inmuebles/:id" element={<InmuebleDetalle />} />
            <Route path="/inmuebles/:id/seguimiento" element={<HistorialSeguimiento />} />
            <Route path="/inmuebles/:id/historial-deuda" element={<HistorialDeudaInmueble />} />
            <Route path="/inmuebles/:id/observaciones-expediente" element={<ObservacionesExpedienteInmueble />} />
            <Route path="/deuda" element={<GestionDeuda />} />
            <Route path="/deuda/:id" element={<CargaDetalle />} />
            <Route path="/etapas" element={<GestionEtapas />} />
            <Route path="/reportes" element={<Reportes />} />
            <Route path="/reportes/:reporteId" element={<Reportes />} />
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
            <Route path="/configuracion/grupos" element={<ConfiguracionGrupos />} />
            <Route path="/configuracion/seguimiento" element={<ConfiguracionSeguimiento />} />
            <Route path="/configuracion/etapas" element={<ConfiguracionEtapas />} />
                <Route path="/configuracion/motivos-cierre" element={<ConfiguracionMotivosCierre />} />
              </Route>
              <Route path="*" element={<NotFound />} />
            </Route>
            <Route element={<PublicRoute />}>
              <Route path="/login" element={<Login />} />
              <Route path="/registro" element={<Registro />} />
              <Route path="/olvide-contrasena" element={<OlvideContrasena />} />
              <Route path="/forgot-password" element={<OlvideContrasena />} />
              <Route path="/restablecer-contrasena" element={<RestablecerContrasena />} />
              <Route path="/reset-password" element={<RestablecerContrasena />} />
            </Route>
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
