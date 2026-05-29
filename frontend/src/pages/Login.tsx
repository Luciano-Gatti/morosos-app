import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Link, useLocation, useNavigate, useSearchParams } from "react-router-dom";
import { Eye, EyeOff, Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { authService, isAuthError } from "@/services/api/authService";
import type { LoginFormValues } from "@/types/auth";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
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

export default function Login() {
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);
  const [infoMessage, setInfoMessage] = useState<string | null>(null);
  const { login } = useAuth();
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
    setIsLoading(true);
    setLoginError(null);
    setInfoMessage(null);

    try {
      await login(data.email, data.password, data.rememberMe);
      navigate(redirectTo, { replace: true });
    } catch (error) {
      if (isAuthError(error) && error.status === 401) {
        setLoginError("Credenciales inválidas.");
      } else if (isAuthError(error) && error.status === 403) {
        setLoginError("El usuario se encuentra inactivo o no autorizado.");
      } else {
        setLoginError("No se pudo conectar con el servicio de autenticación.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    const response = await authService.googleLogin();
    setLoginError(null);
    setInfoMessage(response.message);
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
                        disabled={isLoading}
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
                          disabled={isLoading}
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
                        disabled={isLoading}
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
                disabled={isLoading}
                className="h-11 w-full bg-[hsl(215,65%,28%)] text-white hover:bg-[hsl(215,65%,24%)]"
              >
                {isLoading ? (
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
          <Button
            type="button"
            variant="outline"
            onClick={handleGoogleLogin}
            disabled={isLoading}
            className="h-11 w-full border-[hsl(215,35%,28%)] bg-transparent text-[hsl(210,20%,85%)] hover:bg-[hsl(215,40%,16%)] hover:text-white"
          >
            <svg
              className="mr-2 h-4 w-4"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"
                fill="#4285F4"
              />
              <path
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.99.66-2.26 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                fill="#34A853"
              />
              <path
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                fill="#FBBC05"
              />
              <path
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                fill="#EA4335"
              />
            </svg>
            Iniciar sesión con Google
          </Button>

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
