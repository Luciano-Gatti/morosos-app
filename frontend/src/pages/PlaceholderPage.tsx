import { AppHeader, type Crumb } from "@/components/layout/AppHeader";
import { Construction } from "lucide-react";

interface Props {
  title: string;
  description?: string;
  breadcrumb?: Crumb[];
}

export function PlaceholderPage({ title, description, breadcrumb }: Props) {
  return (
    <>
      <AppHeader title={title} description={description} breadcrumb={breadcrumb} />
      <main className="flex-1 px-6 py-6">
        <div className="flex min-h-[420px] flex-col items-center justify-center rounded-lg border border-dashed border-border bg-card/50 px-6 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary-soft text-primary">
            <Construction className="h-5 w-5" />
          </div>
          <h2 className="mt-4 font-serif text-lg font-semibold text-foreground">
            Sección en preparación
          </h2>
          <p className="mt-1 max-w-md text-[13px] text-muted-foreground">
            Esta vista forma parte del sistema institucional. El diseño, los filtros y las acciones se
            definirán siguiendo los lineamientos del módulo de Dashboard.
          </p>
        </div>
      </main>
    </>
  );
}
