import { Building2, AlertCircle, ClipboardList, CheckCircle2, ArrowUpRight, ArrowDownRight, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface Props {
  label: string;
  value: string;
  hint?: string;
  trend?: { value: string; direction: "up" | "down"; tone?: "good" | "bad" };
  icon: LucideIcon;
  accent?: "primary" | "debt" | "active" | "closed";
}

const accentMap = {
  primary: "bg-primary-soft text-primary",
  debt: "bg-status-debt-soft text-status-debt",
  active: "bg-status-active-soft text-status-active",
  closed: "bg-status-closed-soft text-status-closed",
};

export function SummaryCard({ label, value, hint, trend, icon: Icon, accent = "primary" }: Props) {
  return (
    <div className="relative rounded-lg border border-border bg-card p-5 shadow-institutional">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <div className="section-eyebrow">{label}</div>
          <div className="mt-2 font-serif text-[28px] font-semibold leading-none tracking-tight text-foreground tabular">
            {value}
          </div>
          {hint && <div className="mt-2 text-[12px] text-muted-foreground">{hint}</div>}
        </div>
        <div className={cn("flex h-10 w-10 shrink-0 items-center justify-center rounded-md", accentMap[accent])}>
          <Icon className="h-5 w-5" />
        </div>
      </div>
      {trend && (
        <div
          className={cn(
            "mt-4 inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-medium",
            trend.tone === "bad"
              ? "border-status-debt/20 bg-status-debt-soft text-status-debt"
              : "border-status-closed/20 bg-status-closed-soft text-status-closed",
          )}
        >
          {trend.direction === "up" ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
          {trend.value}
        </div>
      )}
    </div>
  );
}

export const dashboardIcons = { Building2, AlertCircle, ClipboardList, CheckCircle2 };
