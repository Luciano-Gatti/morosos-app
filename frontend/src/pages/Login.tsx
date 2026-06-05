import { useCallback, useEffect, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Link, useLocation, useNavigate, useSearchParams } from "react-router-dom";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { isAuthError } from "@/services/api/authService";
import type { LoginFormValues } from "@/types/auth";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { useAuth } from "@/hooks/useAuth";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";

const loginSchema = z.object({
  email: z
    .string()
    .min(1, "El email o usuario es requerido"),
  password: z.string().min(1, "La contraseña es requerida"),
  rememberMe: z.boolean().default(false),
});

type LoginFormData = LoginFormValues;

interface LocationState {
  from?: {
    pathname?: string;
    search?: string;
  };
}

const ACCOUNT_PENDING_APPROVAL_MESSAGE = "Tu cuenta está pendiente de aprobación por un administrador.";

export default function Login() {
  const googleCodeClientRef = useRef<GoogleCodeClient | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);
  const [infoMessage, setInfoMessage] = useState<string | null>(null);
  const [isGoogleReady, setIsGoogleReady] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID as string | undefined;
  const isGoogleConfigured = Boolean(googleClientId);
  const { login, loginWithGoogleCode } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const state = location.state as LocationState | null;
  const fromQuery = searchParams.get("from");
  const redirectTo = state?.from?.pathname
    ? `${state.from.pathname}${state.from.search ?? ""}`
    : fromQuery || "/dashboard";

  const form = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
      rememberMe: false,
    },
  });

  const onSubmit = async (data: LoginFormData) => {
    setIsSubmitting(true);
    setLoginError(null);
    setInfoMessage(null);

    try {
      await login({ usernameOrEmail: data.email, password: data.password, rememberMe: data.rememberMe });
      navigate(redirectTo, { replace: true });
    } catch (error) {
      if (isAuthError(error) && error.code === "ACCOUNT_PENDING_APPROVAL") {
        setInfoMessage(ACCOUNT_PENDING_APPROVAL_MESSAGE);
      } else if (isAuthError(error) && error.code === "ACCOUNT_REJECTED") {
        setLoginError(error.message);
      } else if (isAuthError(error) && error.code === "ACCOUNT_DISABLED") {
        setLoginError(error.message);
      } else if (isAuthError(error) && error.status === 401) {
        setLoginError("Credenciales inválidas.");
      } else if (isAuthError(error) && error.status === 403) {
        setLoginError("El usuario se encuentra inactivo o no autorizado.");
      } else {
        setLoginError("No se pudo conectar con el servicio de autenticación.");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGoogleCode = useCallback(async ({ code, error, error_description }: GoogleCodeResponse) => {
    if (error) {
      setLoginError(error_description || "Google no autorizó el inicio de sesión.");
      setIsGoogleLoading(false);
      return;
    }

    if (!code) {
      setLoginError("Google no devolvió un código válido.");
      setIsGoogleLoading(false);
      return;
    }

    setIsGoogleLoading(true);
    setLoginError(null);
    setInfoMessage(null);

    try {
      const pendingMessage = await loginWithGoogleCode(code, window.location.origin);
      if (pendingMessage) {
        setInfoMessage(ACCOUNT_PENDING_APPROVAL_MESSAGE);
        return;
      }
      navigate(redirectTo, { replace: true });
    } catch (error) {
      if (isAuthError(error) && error.code === "ACCOUNT_PENDING_APPROVAL") {
        setInfoMessage(ACCOUNT_PENDING_APPROVAL_MESSAGE);
      } else if (isAuthError(error) && error.code === "GOOGLE_LOGIN_DISABLED") {
        setLoginError("El inicio de sesión con Google está deshabilitado.");
      } else if (isAuthError(error) && error.code === "GOOGLE_CLIENT_SECRET_NOT_CONFIGURED") {
        setLoginError("Google login no tiene GOOGLE_CLIENT_SECRET configurado en el auth-service.");
      } else {
        setLoginError(isAuthError(error) ? error.message : "No se pudo iniciar sesión con Google.");
      }
    } finally {
      setIsGoogleLoading(false);
    }
  }, [loginWithGoogleCode, navigate, redirectTo]);

  useEffect(() => {
    if (!googleClientId) {
      setIsGoogleReady(false);
      return;
    }

    let isMounted = true;

    const initializeGoogle = () => {
      const google = window.google;
      if (!google?.accounts?.oauth2) {
        setIsGoogleReady(false);
        return;
      }

      googleCodeClientRef.current = google.accounts.oauth2.initCodeClient({
        client_id: googleClientId,
        scope: "openid email profile",
        ux_mode: "popup",
        callback: handleGoogleCode,
        error_callback: (error) => {
          setIsGoogleLoading(false);
          if (error.type === "popup_closed") {
            return;
          }
          setLoginError("No se pudo abrir el flujo de Google. Intentá nuevamente o usá tus credenciales locales.");
        },
      });
      if (isMounted) setIsGoogleReady(true);
    };

    if (window.google?.accounts?.oauth2) {
      initializeGoogle();
      return () => {
        isMounted = false;
        googleCodeClientRef.current = null;
      };
    }

    const existingScript = document.querySelector<HTMLScriptElement>('script[src="https://accounts.google.com/gsi/client"]');
    const script = existingScript ?? document.createElement("script");

    script.src = "https://accounts.google.com/gsi/client";
    script.async = true;
    script.defer = true;
    script.onload = initializeGoogle;
    script.onerror = () => {
      setIsGoogleReady(false);
      setLoginError("No se pudo cargar Google Identity Services. Intentá nuevamente más tarde.");
    };

    if (!existingScript) {
      document.head.appendChild(script);
    }

    return () => {
      isMounted = false;
      googleCodeClientRef.current = null;
    };
  }, [googleClientId, handleGoogleCode]);

  const handleGoogleLogin = () => {
    if (!googleClientId) {
      setLoginError("Iniciar sesión con Google no está configurado.");
      return;
    }

    const googleCodeClient = googleCodeClientRef.current;
    if (!googleCodeClient || !isGoogleReady) {
      setLoginError("Google Identity Services todavía se está cargando. Intentá nuevamente en unos segundos.");
      return;
    }

    setIsGoogleLoading(true);
    setLoginError(null);
    setInfoMessage(null);
    googleCodeClient.requestCode();
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center bg-[hsl(215,55%,12%)] px-4 py-12 sm:px-6 lg:px-8">
      {/* Fondo decorativo sutil */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -top-1/2 -right-1/4 h-[800px] w-[800px] rounded-full bg-[hsl(215,55%,22%)] opacity-40 blur-3xl" />
        <div className="absolute -bottom-1/4 -left-1/4 h-[600px] w-[600px] rounded-full bg-[hsl(215,50%,18%)] opacity-30 blur-3xl" />
      </div>

      <div className="relative z-10 w-full max-w-[420px]">
        {/* Card */}
        <div className="rounded-xl border border-[hsl(215,40%,24%)] bg-[hsl(215,45%,10%)]/80 p-8 shadow-2xl backdrop-blur-sm sm:p-10">
          {/* Header */}
          <div className="mb-8 text-center">
            <h1 className="font-serif text-3xl font-semibold tracking-tight text-white">
              Iniciar Sesión
            </h1>
            <p className="mt-1.5 text-sm text-[hsl(210,20%,70%)]">
              Accedé al sistema de seguimiento AOSC
            </p>
          </div>

          {/* Error general */}
          {loginError && (
            <div className="mb-5 rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive-foreground">
              {loginError}
            </div>
          )}
          {infoMessage && (
            <div className="mb-5 rounded-lg border border-[hsl(210,60%,35%)] bg-[hsl(210,60%,20%)]/40 px-4 py-3 text-sm text-[hsl(210,60%,80%)]">
              {infoMessage}
            </div>
          )}

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
              {/* Email o usuario */}
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-[hsl(210,20%,85%)]">
                      Email o usuario
                    </FormLabel>
                    <FormControl>
                      <Input
                        type="text"
                        placeholder="usuario o nombre@aosc.gob.ar"
                        autoComplete="username email"
                        disabled={isSubmitting}
                        className="h-11 border-[hsl(215,35%,28%)] bg-[hsl(215,40%,14%)] text-white placeholder:text-[hsl(215,15%,50%)] focus-visible:ring-[hsl(215,65%,32%)]"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Contraseña */}
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-[hsl(210,20%,85%)]">
                      Contraseña
                    </FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Input
                          type={showPassword ? "text" : "password"}
                          placeholder="••••••••"
                          autoComplete="current-password"
                          disabled={isSubmitting}
                          className="h-11 border-[hsl(215,35%,28%)] bg-[hsl(215,40%,14%)] pr-10 text-white placeholder:text-[hsl(215,15%,50%)] focus-visible:ring-[hsl(215,65%,32%)]"
                          {...field}
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword((v) => !v)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-[hsl(215,15%,55%)] transition-colors hover:text-[hsl(210,20%,80%)]"
                          tabIndex={-1}
                        >
                          {showPassword ? (
                            <EyeOff className="h-4 w-4" />
                          ) : (
                            <Eye className="h-4 w-4" />
                          )}
                        </button>
                      </div>
                    </FormControl>
                    <div className="mt-1.5 flex justify-start">
                      <Link
                        to="/olvide-contrasena"
                        className="text-sm text-[hsl(210,60%,65%)] transition-colors hover:text-[hsl(210,60%,75%)] hover:underline"
                      >
                        Restablecer contraseña
                      </Link>
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Permanecer conectado */}
              <FormField
                control={form.control}
                name="rememberMe"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-center space-x-2.5 space-y-0">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                        disabled={isSubmitting}
                        className="border-[hsl(215,35%,35%)] data-[state=checked]:border-primary data-[state=checked]:bg-primary"
                      />
                    </FormControl>
                    <FormLabel className="cursor-pointer text-sm font-normal text-[hsl(210,20%,75%)]">
                      Permanecer conectado
                    </FormLabel>
                  </FormItem>
                )}
              />

              {/* Botón principal */}
              <Button
                type="submit"
                disabled={isSubmitting}
                className="h-11 w-full bg-[hsl(215,65%,28%)] text-white hover:bg-[hsl(215,65%,24%)]"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Iniciando sesión…
                  </>
                ) : (
                  "Iniciar sesión"
                )}
              </Button>
            </form>
          </Form>

          {/* Separador */}
          <div className="my-6 flex items-center">
            <div className="flex-1 border-t border-[hsl(215,35%,24%)]" />
            <span className="mx-3 text-xs text-[hsl(215,15%,50%)]">
              o
            </span>
            <div className="flex-1 border-t border-[hsl(215,35%,24%)]" />
          </div>

          {/* Google */}
          {isGoogleConfigured ? (
            <button
              type="button"
              onClick={handleGoogleLogin}
              disabled={isSubmitting || isGoogleLoading || !isGoogleReady}
              aria-label="Continuar con Google"
              className="relative flex h-11 w-full items-center justify-center rounded-md border border-[#334155] bg-[#1e293b] px-4 text-sm font-medium text-[hsl(210,20%,92%)] transition-colors hover:bg-[#263449] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[hsl(210,60%,65%)] focus-visible:ring-offset-2 focus-visible:ring-offset-[hsl(215,45%,10%)] disabled:cursor-not-allowed disabled:opacity-70"
            >
              <svg
                className="absolute left-4 h-5 w-5"
                aria-hidden="true"
                viewBox="0 0 18 18"
                focusable="false"
              >
                <path fill="#4285F4" d="M17.64 9.2c0-.64-.06-1.25-.16-1.84H9v3.48h4.84a4.14 4.14 0 0 1-1.8 2.72v2.26h2.92c1.7-1.57 2.68-3.88 2.68-6.62z" />
                <path fill="#34A853" d="M9 18c2.43 0 4.47-.8 5.96-2.18l-2.92-2.26c-.8.54-1.84.86-3.04.86-2.34 0-4.33-1.58-5.04-3.72H.94v2.33A9 9 0 0 0 9 18z" />
                <path fill="#FBBC05" d="M3.96 10.7A5.41 5.41 0 0 1 3.68 9c0-.59.1-1.16.28-1.7V4.97H.94A9 9 0 0 0 0 9c0 1.45.35 2.82.94 4.03l3.02-2.33z" />
                <path fill="#EA4335" d="M9 3.58c1.32 0 2.5.45 3.44 1.35l2.58-2.58A8.64 8.64 0 0 0 9 0 9 9 0 0 0 .94 4.97L3.96 7.3C4.67 5.16 6.66 3.58 9 3.58z" />
              </svg>
              <span>{isGoogleLoading ? "Conectando con Google…" : "Continuar con Google"}</span>
            </button>
          ) : (
            <Button
              type="button"
              variant="outline"
              disabled
              aria-label="Continuar con Google"
              className="h-11 w-full border-[#334155] bg-[#1e293b] text-[hsl(210,20%,85%)] opacity-80"
            >
              Google no configurado
            </Button>
          )}

          {/* Registro */}
          <p className="mt-6 text-center text-sm text-[hsl(210,20%,70%)]">
            ¿No tenés cuenta?{" "}
            <Link
              to="/registro"
              className="font-medium text-[hsl(210,60%,65%)] transition-colors hover:text-[hsl(210,60%,75%)] hover:underline"
            >
              Crear cuenta
            </Link>
          </p>
        </div>

        {/* Footer */}
        <p className="mt-6 text-center text-xs text-[hsl(215,15%,45%)]">
          AOSC — Ente Regulador. Todos los derechos reservados.
        </p>
      </div>
    </div>
  );
}
