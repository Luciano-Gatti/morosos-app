import logo from "@/assets/logo-aosc.png";
import { cn } from "@/lib/utils";

interface Props {
  className?: string;
  variant?: "light" | "dark";
  showSubtitle?: boolean;
}

export function BrandMark({ className, variant = "dark", showSubtitle = true }: Props) {
  return (
    <div className={cn("flex items-center gap-3", className)}>
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-white p-1 ring-1 ring-black/5">
        <img src={logo} alt="AOSC — Ente Regulador" className="h-full w-full object-contain" />
      </div>
      <div className="min-w-0">
        <div
          className={cn(
            "font-serif text-[15px] font-semibold leading-tight tracking-tight",
            variant === "light" ? "text-sidebar-primary" : "text-foreground",
          )}
        >
          AOSC
        </div>
        {showSubtitle && (
          <div
            className={cn(
              "text-[10px] font-medium uppercase tracking-[0.14em] leading-tight",
              variant === "light" ? "text-sidebar-muted" : "text-muted-foreground",
            )}
          >
            Ente Regulador
          </div>
        )}
      </div>
    </div>
  );
}
