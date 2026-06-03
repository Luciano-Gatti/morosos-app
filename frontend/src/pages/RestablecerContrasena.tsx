import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Link, useSearchParams } from "react-router-dom";
import { ArrowLeft, Eye, EyeOff, Loader2, AlertTriangle } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { BrandMark } from "@/components/BrandMark";
import { authService } from "@/services/api/authService";

const restablecerSchema = z
  .object({
    password: z
      .string()
      .min(1, "La contraseña es requerida")
      .min(8, "La contraseña debe tener al menos 8 caracteres")
      .regex(/[A-Za-zÁÉÍÓÚáéíóúÑñ]/, "La contraseña debe incluir al menos una letra")
      .regex(/\d/, "La contraseña debe incluir al menos un número"),
    confirmPassword: z.string().min(1, "Confirmá la contraseña"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Las contraseñas no coinciden",
    path: ["confirmPassword"],
  });

type RestablecerFormData = z.infer<typeof restablecerSchema>;

export default function RestablecerContrasena() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [exito, setExito] = useState(false);

  const form = useForm<RestablecerFormData>({
    resolver: zodResolver(restablecerSchema),
    defaultValues: {
      password: "",
      confirmPassword: "",
    },
  });

  // Si llega un token inválido por query param vacío, mostramos error
  useEffect(() => {
    if (!token) {
      setErrorMsg(null);
    }
  }, [token]);

  const onSubmit = async (data: RestablecerFormData) => {
    setIsLoading(true);
    setErrorMsg(null);

    try {
      await authService.resetPassword({
        token,
        newPassword: data.password,
        confirmPassword: data.confirmPassword,
      });
      setExito(true);
    } catch {
      setErrorMsg(
        "No se pudo restablecer la contraseña. El enlace puede ser inválido, haber expirado o ya haber sido usado."
      );
    } finally {
      setIsLoading(false);
    }
  };

  // Sin token → estado de error
  if (!token) {
    return (
      <div className="relative flex min-h-screen items-center justify-center bg-[hsl(215,55%,12%)] px-4 py-12 sm:px-6 lg:px-8">
        {/* Fondo decorativo sutil */}
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="absolute -top-1/2 -right-1/4 h-[800px] w-[800px] rounded-full bg-[hsl(215,55%,22%)] opacity-40 blur-3xl" />
          <div className="absolute -bottom-1/4 -left-1/4 h-[600px] w-[600px] rounded-full bg-[hsl(215,50%,18%)] opacity-30 blur-3xl" />
        </div>

        <div className="relative z-10 w-full max-w-[420px]">
          <div className="rounded-xl border border-[hsl(215,40%,24%)] bg-[hsl(215,45%,10%)]/80 p-8 text-center shadow-2xl backdrop-blur-sm sm:p-10">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10">
              <AlertTriangle className="h-6 w-6 text-destructive" />
            </div>

            <h1 className="font-serif text-2xl font-semibold tracking-tight text-white">
              Enlace no válido
            </h1>
            <p className="mt-3 text-sm text-[hsl(210,20%,70%)]">
              El enlace de restablecimiento no es válido o está incompleto.
            </p>

            <Button
              asChild
              className="mt-6 h-11 w-full bg-[hsl(215,65%,28%)] text-white hover:bg-[hsl(215,65%,24%)]"
            >
              <Link to="/olvide-contrasena">Solicitar un nuevo enlace</Link>
            </Button>

            <div className="mt-4 text-center">
              <Link
                to="/login"
                className="inline-flex items-center text-sm text-[hsl(210,60%,65%)] transition-colors hover:text-[hsl(210,60%,75%)] hover:underline"
              >
                <ArrowLeft className="mr-1.5 h-3.5 w-3.5" />
                Volver al inicio de sesión
              </Link>
            </div>
          </div>

          {/* Footer */}
          <p className="mt-6 text-center text-xs text-[hsl(215,15%,45%)]">
            AOSC — Ente Regulador. Todos los derechos reservados.
          </p>
        </div>
      </div>
    );
  }

  // Éxito
  if (exito) {
    return (
      <div className="relative flex min-h-screen items-center justify-center bg-[hsl(215,55%,12%)] px-4 py-12 sm:px-6 lg:px-8">
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="absolute -top-1/2 -right-1/4 h-[800px] w-[800px] rounded-full bg-[hsl(215,55%,22%)] opacity-40 blur-3xl" />
          <div className="absolute -bottom-1/4 -left-1/4 h-[600px] w-[600px] rounded-full bg-[hsl(215,50%,18%)] opacity-30 blur-3xl" />
        </div>

        <div className="relative z-10 w-full max-w-[420px]">
          <div className="rounded-xl border border-[hsl(215,40%,24%)] bg-[hsl(215,45%,10%)]/80 p-8 text-center shadow-2xl backdrop-blur-sm sm:p-10">
            <h1 className="font-serif text-2xl font-semibold tracking-tight text-white">
              ¡Contraseña actualizada!
            </h1>
            <p className="mt-3 text-sm text-[hsl(210,20%,70%)]">
              Ya podés iniciar sesión con tu nueva contraseña.
            </p>

            <Button
              asChild
              className="mt-6 h-11 w-full bg-[hsl(215,65%,28%)] text-white hover:bg-[hsl(215,65%,24%)]"
            >
              <Link to="/login">Ir al inicio de sesión</Link>
            </Button>
          </div>

          {/* Footer */}
          <p className="mt-6 text-center text-xs text-[hsl(215,15%,45%)]">
            AOSC — Ente Regulador. Todos los derechos reservados.
          </p>
        </div>
      </div>
    );
  }

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
          {/* Logo */}
          <div className="mb-6 flex justify-center">
            <BrandMark variant="light" showSubtitle={false} />
          </div>

          {/* Header */}
          <div className="mb-6 text-center">
            <h1 className="font-serif text-2xl font-semibold tracking-tight text-white">
              Crear nueva contraseña
            </h1>
            <p className="mt-2 text-sm text-[hsl(210,20%,70%)]">
              Ingresá una nueva contraseña para recuperar el acceso a tu
              cuenta.
            </p>
          </div>

          {/* Error general */}
          {errorMsg && (
            <div className="mb-5 rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive-foreground">
              {errorMsg}
            </div>
          )}

          <Form {...form}>
            <form
              onSubmit={form.handleSubmit(onSubmit)}
              className="space-y-5"
            >
              {/* Nueva contraseña */}
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-[hsl(210,20%,85%)]">
                      Nueva contraseña
                    </FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Input
                          type={showPassword ? "text" : "password"}
                          placeholder="••••••••"
                          autoComplete="new-password"
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
                    <p className="text-xs text-[hsl(210,20%,60%)]">
                      Mínimo 8 caracteres, con al menos una letra y un número.
                    </p>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Confirmar contraseña */}
              <FormField
                control={form.control}
                name="confirmPassword"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-[hsl(210,20%,85%)]">
                      Confirmar nueva contraseña
                    </FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Input
                          type={showConfirm ? "text" : "password"}
                          placeholder="••••••••"
                          autoComplete="new-password"
                          disabled={isLoading}
                          className="h-11 border-[hsl(215,35%,28%)] bg-[hsl(215,40%,14%)] pr-10 text-white placeholder:text-[hsl(215,15%,50%)] focus-visible:ring-[hsl(215,65%,32%)]"
                          {...field}
                        />
                        <button
                          type="button"
                          onClick={() => setShowConfirm((v) => !v)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-[hsl(215,15%,55%)] transition-colors hover:text-[hsl(210,20%,80%)]"
                          tabIndex={-1}
                        >
                          {showConfirm ? (
                            <EyeOff className="h-4 w-4" />
                          ) : (
                            <Eye className="h-4 w-4" />
                          )}
                        </button>
                      </div>
                    </FormControl>
                    <FormMessage />
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
                    Restableciendo…
                  </>
                ) : (
                  "Restablecer contraseña"
                )}
              </Button>
            </form>
          </Form>

          {/* Volver al login */}
          <div className="mt-6 text-center">
            <Link
              to="/login"
              className="inline-flex items-center text-sm text-[hsl(210,60%,65%)] transition-colors hover:text-[hsl(210,60%,75%)] hover:underline"
            >
              <ArrowLeft className="mr-1.5 h-3.5 w-3.5" />
              Volver al inicio de sesión
            </Link>
          </div>
        </div>

        {/* Footer */}
        <p className="mt-6 text-center text-xs text-[hsl(215,15%,45%)]">
          AOSC — Ente Regulador. Todos los derechos reservados.
        </p>
      </div>
    </div>
  );
}
