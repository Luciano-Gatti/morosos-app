import { ChevronRight, Bell } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export interface Crumb {
  label: string;
  to?: string;
}

interface Props {
  title: string;
  description?: string;
  breadcrumb?: Crumb[];
  actions?: React.ReactNode;
}

export function AppHeader({ title, description, breadcrumb, actions }: Props) {
  return (
    <header className="sticky top-0 z-20 border-b border-border bg-surface/95 backdrop-blur supports-[backdrop-filter]:bg-surface/80">
      {/* Top utility bar */}
      <div className="flex h-12 items-center justify-between gap-4 border-b border-border/60 px-6">
        <nav aria-label="Migas de pan" className="flex items-center gap-1.5 text-[12px] text-muted-foreground">
          <Link to="/" className="hover:text-foreground">Inicio</Link>
          {breadcrumb?.map((c, i) => (
            <span key={i} className="flex items-center gap-1.5">
              <ChevronRight className="h-3 w-3 opacity-60" />
              {c.to ? (
                <Link to={c.to} className="hover:text-foreground">{c.label}</Link>
              ) : (
                <span className={cn(i === breadcrumb.length - 1 && "text-foreground font-medium")}>{c.label}</span>
              )}
            </span>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" className="h-8 w-8" aria-label="Notificaciones">
            <Bell className="h-4 w-4" />
          </Button>
          <div className="ml-1 flex items-center gap-2 border-l border-border pl-3">
            <div className="flex h-7 w-7 items-center justify-center rounded-full bg-primary text-[11px] font-semibold text-primary-foreground">
              JR
            </div>
            <div className="hidden text-right md:block">
              <div className="text-[12px] font-medium leading-tight text-foreground">J. Ramírez</div>
              <div className="text-[10px] leading-tight text-muted-foreground">Operador</div>
            </div>
          </div>
        </div>
      </div>

      {/* Title row */}
      <div className="flex flex-col gap-3 px-6 py-5 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="font-serif text-[26px] font-semibold leading-tight text-foreground">
            {title}
          </h1>
          {description && (
            <p className="mt-1 max-w-2xl text-[13px] text-muted-foreground">{description}</p>
          )}
        </div>
        {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
      </div>
    </header>
  );
}
