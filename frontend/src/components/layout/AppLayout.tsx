import { useEffect, useMemo, useState } from "react";
import { Outlet } from "react-router-dom";

import { AppSidebar } from "./AppSidebar";
import { AppLayoutProvider } from "./AppLayoutContext";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { cn } from "@/lib/utils";

export function AppLayout() {
  const [collapsed, setCollapsed] = useState(false);
  const [isMobileViewport, setIsMobileViewport] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia("(max-width: 1023px)");
    const handleChange = () => {
      const mobile = mediaQuery.matches;
      setIsMobileViewport(mobile);
      if (!mobile) setMobileMenuOpen(false);
    };

    handleChange();
    mediaQuery.addEventListener("change", handleChange);
    return () => mediaQuery.removeEventListener("change", handleChange);
  }, []);

  const layoutContext = useMemo(
    () => ({
      isMobileViewport,
      openMobileMenu: () => setMobileMenuOpen(true),
    }),
    [isMobileViewport],
  );

  return (
    <AppLayoutProvider value={layoutContext}>
      <div className="min-h-screen overflow-x-hidden bg-background">
        {!isMobileViewport && (
          <AppSidebar collapsed={collapsed} onToggle={() => setCollapsed((value) => !value)} />
        )}

        <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
          <SheetContent
            side="left"
            className="w-[88vw] max-w-[320px] border-r border-sidebar-border bg-sidebar p-0 text-sidebar-foreground"
          >
            <SheetHeader className="sr-only">
              <SheetTitle>Menu principal</SheetTitle>
              <SheetDescription>Navegacion del sistema</SheetDescription>
            </SheetHeader>
            <AppSidebar
              mobile
              collapsed={false}
              onToggle={() => setMobileMenuOpen(false)}
              onNavigate={() => setMobileMenuOpen(false)}
            />
          </SheetContent>
        </Sheet>

        <div
          className={cn(
            "flex min-h-screen min-w-0 flex-col",
            !isMobileViewport && (collapsed ? "lg:pl-[72px]" : "lg:pl-[260px]"),
          )}
        >
          <Outlet />
        </div>
      </div>
    </AppLayoutProvider>
  );
}
