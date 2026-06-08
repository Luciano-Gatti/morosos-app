import { createContext, useContext } from "react";

type AppLayoutContextValue = {
  isMobileViewport: boolean;
  openMobileMenu: () => void;
};

const AppLayoutContext = createContext<AppLayoutContextValue | null>(null);

export function AppLayoutProvider({
  value,
  children,
}: {
  value: AppLayoutContextValue;
  children: React.ReactNode;
}) {
  return <AppLayoutContext.Provider value={value}>{children}</AppLayoutContext.Provider>;
}

export function useAppLayout() {
  return useContext(AppLayoutContext);
}
