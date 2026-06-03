import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Link } from "react-router-dom";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { authService, isAuthError } from "@/services/api/authService";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";

const registroSchema = z
  .object({
    username: z.string().min(1, "El usuario es requerido"),
    nombre: z.string().min(1, "El nombre es requerido"),
    apellido: z.string().min(1, "El apellido es requerido"),
    email: z.string().min(1, "El email es requerido").email("Ingresá un email válido"),
    password: z.string().min(8, "La contraseña debe tener al menos 8 caracteres").regex(/[A-Z]/, "Debe incluir una mayúscula").regex(/[a-z]/, "Debe incluir una minúscula").regex(/[0-9]/, "Debe incluir un número"),
    confirmPassword: z.string().min(1, "Confirmá la contraseña"),
  })
  .refine((data) => data.password === data.confirmPassword, { message: "Las contraseñas no coinciden", path: ["confirmPassword"] });

type RegistroFormData = z.infer<typeof registroSchema>;

export default function Registro() {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [registroError, setRegistroError] = useState<string | null>(null);
  const [registroMessage, setRegistroMessage] = useState<string | null>(null);

  const form = useForm<RegistroFormData>({
    resolver: zodResolver(registroSchema),
    defaultValues: { username: "", nombre: "", apellido: "", email: "", password: "", confirmPassword: "" },
  });

  const onSubmit = async (data: RegistroFormData) => {
    setIsLoading(true);
    setRegistroError(null);
    setRegistroMessage(null);
    try {
      const response = await authService.register(data);
      setRegistroMessage(response.message);
      form.reset();
    } catch (error) {
      setRegistroError(isAuthError(error) ? error.message : "No se pudo completar el registro. Intentá de nuevo.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center bg-[hsl(215,55%,12%)] px-4 py-12 sm:px-6 lg:px-8">
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -top-1/2 -right-1/4 h-[800px] w-[800px] rounded-full bg-[hsl(215,55%,22%)] opacity-40 blur-3xl" />
        <div className="absolute -bottom-1/4 -left-1/4 h-[600px] w-[600px] rounded-full bg-[hsl(215,50%,18%)] opacity-30 blur-3xl" />
      </div>

      <div className="relative z-10 w-full max-w-[440px]">
        <div className="rounded-xl border border-[hsl(215,40%,24%)] bg-[hsl(215,45%,10%)]/80 p-8 shadow-2xl backdrop-blur-sm sm:p-10">
          <div className="mb-8 text-center">
            <h1 className="font-serif text-3xl font-semibold tracking-tight text-white">Crear cuenta</h1>
            <p className="mt-1.5 text-sm text-[hsl(210,20%,70%)]">Tu acceso quedará pendiente de aprobación administrativa.</p>
          </div>

          {registroError && <div className="mb-5 rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive-foreground">{registroError}</div>}
          {registroMessage && <div className="mb-5 rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-100">{registroMessage}</div>}

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
              <FormField control={form.control} name="username" render={({ field }) => (
                <FormItem><FormLabel className="text-[hsl(210,20%,85%)]">Usuario</FormLabel><FormControl><Input placeholder="jperez" autoComplete="username" disabled={isLoading} className="h-11 border-[hsl(215,35%,28%)] bg-[hsl(215,40%,14%)] text-white" {...field} /></FormControl><FormMessage /></FormItem>
              )} />
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <FormField control={form.control} name="nombre" render={({ field }) => (
                  <FormItem><FormLabel className="text-[hsl(210,20%,85%)]">Nombre</FormLabel><FormControl><Input placeholder="Juan" autoComplete="given-name" disabled={isLoading} className="h-11 border-[hsl(215,35%,28%)] bg-[hsl(215,40%,14%)] text-white" {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={form.control} name="apellido" render={({ field }) => (
                  <FormItem><FormLabel className="text-[hsl(210,20%,85%)]">Apellido</FormLabel><FormControl><Input placeholder="Pérez" autoComplete="family-name" disabled={isLoading} className="h-11 border-[hsl(215,35%,28%)] bg-[hsl(215,40%,14%)] text-white" {...field} /></FormControl><FormMessage /></FormItem>
                )} />
              </div>
              <FormField control={form.control} name="email" render={({ field }) => (
                <FormItem><FormLabel className="text-[hsl(210,20%,85%)]">Email</FormLabel><FormControl><Input type="email" placeholder="nombre@aosc.gob.ar" autoComplete="email" disabled={isLoading} className="h-11 border-[hsl(215,35%,28%)] bg-[hsl(215,40%,14%)] text-white" {...field} /></FormControl><FormMessage /></FormItem>
              )} />
              <PasswordField name="password" label="Contraseña" show={showPassword} setShow={setShowPassword} disabled={isLoading} form={form} />
              <PasswordField name="confirmPassword" label="Confirmar contraseña" show={showConfirm} setShow={setShowConfirm} disabled={isLoading} form={form} />
              <Button type="submit" disabled={isLoading} className="h-11 w-full bg-[hsl(215,65%,28%)] text-white hover:bg-[hsl(215,65%,24%)]">
                {isLoading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Enviando registro...</> : "Crear cuenta"}
              </Button>
            </form>
          </Form>
          <p className="mt-6 text-center text-sm text-[hsl(210,20%,70%)]">¿Ya tenés cuenta? <Link to="/login" className="font-medium text-white underline-offset-4 hover:underline">Iniciar sesión</Link></p>
        </div>
      </div>
    </div>
  );
}

function PasswordField({ name, label, show, setShow, disabled, form }: { name: "password" | "confirmPassword"; label: string; show: boolean; setShow: (fn: (value: boolean) => boolean) => void; disabled: boolean; form: ReturnType<typeof useForm<RegistroFormData>> }) {
  return <FormField control={form.control} name={name} render={({ field }) => (
    <FormItem><FormLabel className="text-[hsl(210,20%,85%)]">{label}</FormLabel><FormControl><div className="relative"><Input type={show ? "text" : "password"} placeholder="••••••••" autoComplete="new-password" disabled={disabled} className="h-11 border-[hsl(215,35%,28%)] bg-[hsl(215,40%,14%)] pr-10 text-white" {...field} /><button type="button" onClick={() => setShow((v) => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-[hsl(215,15%,55%)]" tabIndex={-1}>{show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}</button></div></FormControl><FormMessage /></FormItem>
  )} />;
}
