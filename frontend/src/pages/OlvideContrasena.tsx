import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Link } from "react-router-dom";
import { ArrowLeft, Loader2, MailCheck } from "lucide-react";

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

const olvideSchema = z.object({
  email: z
    .string()
    .min(1, "El email o usuario es requerido")
    .refine(
      (val) => {
        // Si parece email, validar formato; si no, aceptar como usuario
        const looksLikeEmail = val.includes("@");
        if (!looksLikeEmail) return true;
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val);
      },
      { message: "Ingresá un email válido" }
    ),
});

type OlvideFormData = z.infer<typeof olvideSchema>;

export default function OlvideContrasena() {
  const [isLoading, setIsLoading] = useState(false);
  const [enviado, setEnviado] = useState(false);

  const form = useForm<OlvideFormData>({
    resolver: zodResolver(olvideSchema),
    defaultValues: {
      email: "",
    },
  });

  const onSubmit = async (data: OlvideFormData) => {
    setIsLoading(true);

    try {
      // Simulación de envío — reemplazar por authService.resetPassword(data.email)
      await new Promise((resolve) => setTimeout(resolve, 1500));

      // eslint-disable-next-line no-console
      console.log("Solicitud de restablecimiento simulada:", {
        email: data.email,
      });

      setEnviado(true);
    } catch {
      // Por seguridad, no mostramos error al usuario
      setEnviado(true);
    } finally {
      setIsLoading(false);
    }
  };

  if (enviado) {
    return (
      <div className="relative flex min-h-screen items-center justify-center bg-[hsl(215,55%,12%)] px-4 py-12 sm:px-6 lg:px-8">
        {/* Fondo decorativo sutil */}
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="absolute -top-1/2 -right-1/4 h-[800px] w-[800px] rounded-full bg-[hsl(215,55%,22%)] opacity-40 blur-3xl" />
          <div className="absolute -bottom-1/4 -left-1/4 h-[600px] w-[600px] rounded-full bg-[hsl(215,50%,18%)] opacity-30 blur-3xl" />
        </div>

        <div className="relative z-10 w-full max-w-[420px]">
          <div className="rounded-xl border border-[hsl(215,40%,24%)] bg-[hsl(215,45%,10%)]/80 p-8 text-center shadow-2xl backdrop-blur-sm sm:p-10">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-[hsl(215,40%,20%)]">
              <MailCheck className="h-6 w-6 text-[hsl(210,60%,65%)]" />
            </div>

            <h1 className="font-serif text-2xl font-semibold tracking-tight text-white">
              Revisá tu email
            </h1>
            <p className="mt-3 text-sm text-[hsl(210,20%,70%)]">
              Si la cuenta existe, enviaremos instrucciones para restablecer la
              contraseña al correo asociado.
            </p>

            <Button
              asChild
              className="mt-6 h-11 w-full bg-[hsl(215,65%,28%)] text-white hover:bg-[hsl(215,65%,24%)]"
            >
              <Link to="/login">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Volver al inicio de sesión
              </Link>
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
              Restablecer contraseña
            </h1>
            <p className="mt-2 text-sm text-[hsl(210,20%,70%)]">
              Ingresá tu correo electrónico o usuario y te enviaremos las
              instrucciones para restablecer tu contraseña.
            </p>
          </div>

          <Form {...form}>
            <form
              onSubmit={form.handleSubmit(onSubmit)}
              className="space-y-5"
            >
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
                        placeholder="nombre@aosc.gob.ar"
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

              {/* Botón principal */}
              <Button
                type="submit"
                disabled={isLoading}
                className="h-11 w-full bg-[hsl(215,65%,28%)] text-white hover:bg-[hsl(215,65%,24%)]"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Enviando…
                  </>
                ) : (
                  "Enviar instrucciones"
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
