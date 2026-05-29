import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Link } from "react-router-dom";
import { Eye, EyeOff, Loader2 } from "lucide-react";

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

const registroSchema = z
  .object({
    nombre: z.string().min(1, "El nombre es requerido"),
    apellido: z.string().min(1, "El apellido es requerido"),
    email: z
      .string()
      .min(1, "El email es requerido")
      .email("Ingresá un email válido"),
    password: z
      .string()
      .min(8, "La contraseña debe tener al menos 8 caracteres"),
    confirmPassword: z.string().min(1, "Confirmá la contraseña"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Las contraseñas no coinciden",
    path: ["confirmPassword"],
  });

type RegistroFormData = z.infer<typeof registroSchema>;

export default function Registro() {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [registroError, setRegistroError] = useState<string | null>(null);
  const [registroOk, setRegistroOk] = useState(false);

  const form = useForm<RegistroFormData>({
    resolver: zodResolver(registroSchema),
    defaultValues: {
      nombre: "",
      apellido: "",
      email: "",
      password: "",
      confirmPassword: "",
    },
  });

  const onSubmit = async (data: RegistroFormData) => {
    setIsLoading(true);
    setRegistroError(null);

    try {
      // TODO: conectar con authService.register()
      await new Promise((resolve) => setTimeout(resolve, 1200));

      // eslint-disable-next-line no-console
      console.log("Registro simulado:", {
        nombre: data.nombre,
        apellido: data.apellido,
        email: data.email,
      });

      setRegistroOk(true);
    } catch {
      setRegistroError("No se pudo completar el registro. Intentá de nuevo.");
    } finally {
      setIsLoading(false);
    }
  };

  if (registroOk) {
    return (
      <div className="relative flex min-h-screen items-center justify-center bg-[hsl(215,55%,12%)] px-4 py-12 sm:px-6 lg:px-8">
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="absolute -top-1/2 -right-1/4 h-[800px] w-[800px] rounded-full bg-[hsl(215,55%,22%)] opacity-40 blur-3xl" />
          <div className="absolute -bottom-1/4 -left-1/4 h-[600px] w-[600px] rounded-full bg-[hsl(215,50%,18%)] opacity-30 blur-3xl" />
        </div>

        <div className="relative z-10 w-full max-w-[420px]">
          <div className="rounded-xl border border-[hsl(215,40%,24%)] bg-[hsl(215,45%,10%)]/80 p-8 text-center shadow-2xl backdrop-blur-sm sm:p-10">
            <h1 className="font-serif text-2xl font-semibold tracking-tight text-white">
              ¡Cuenta creada!
            </h1>
            <p className="mt-3 text-sm text-[hsl(210,20%,70%)]">
              Revisá tu email para confirmar la cuenta. Las cuentas nuevas
              pueden requerir aprobación de un administrador antes de acceder
              al sistema.
            </p>
            <Button asChild className="mt-6 h-11 w-full bg-[hsl(215,65%,28%)] text-white hover:bg-[hsl(215,65%,24%)]">
              <Link to="/login">Ir al inicio de sesión</Link>
            </Button>
          </div>
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
          {/* Header */}
          <div className="mb-8 text-center">
            <h1 className="font-serif text-3xl font-semibold tracking-tight text-white">
              Crear cuenta
            </h1>
          </div>

          {/* Error general */}
          {registroError && (
            <div className="mb-5 rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive-foreground">
              {registroError}
            </div>
          )}

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
              {/* Nombre */}
              <FormField
                control={form.control}
                name="nombre"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-[hsl(210,20%,85%)]">
                      Nombre
                    </FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Juan"
                        autoComplete="given-name"
                        disabled={isLoading}
                        className="h-11 border-[hsl(215,35%,28%)] bg-[hsl(215,40%,14%)] text-white placeholder:text-[hsl(215,15%,50%)] focus-visible:ring-[hsl(215,65%,32%)]"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Apellido */}
              <FormField
                control={form.control}
                name="apellido"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-[hsl(210,20%,85%)]">
                      Apellido
                    </FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Pérez"
                        autoComplete="family-name"
                        disabled={isLoading}
                        className="h-11 border-[hsl(215,35%,28%)] bg-[hsl(215,40%,14%)] text-white placeholder:text-[hsl(215,15%,50%)] focus-visible:ring-[hsl(215,65%,32%)]"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Email */}
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-[hsl(210,20%,85%)]">
                      Email
                    </FormLabel>
                    <FormControl>
                      <Input
                        type="email"
                        placeholder="nombre@aosc.gob.ar"
                        autoComplete="email"
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
                      Confirmar contraseña
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

              {/* Texto aclaratorio */}
              <p className="text-center text-xs text-[hsl(210,20%,60%)]">
                Las cuentas nuevas pueden requerir aprobación de un
                administrador antes de acceder al sistema.
              </p>

              {/* Botón principal */}
              <Button
                type="submit"
                disabled={isLoading}
                className="h-11 w-full bg-[hsl(215,65%,28%)] text-white hover:bg-[hsl(215,65%,24%)]"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creando cuenta…
                  </>
                ) : (
                  "Crear cuenta"
                )}
              </Button>
            </form>
          </Form>

          {/* Enlace a login */}
          <p className="mt-6 text-center text-sm text-[hsl(210,20%,70%)]">
            ¿Ya tenés cuenta?{" "}
            <Link
              to="/login"
              className="font-medium text-[hsl(210,60%,65%)] transition-colors hover:text-[hsl(210,60%,75%)] hover:underline"
            >
              Iniciar sesión
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
