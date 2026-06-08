import { render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { describe, expect, it } from "vitest";

import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { AuthContext, type AuthContextValue } from "@/context/authContextCore";

function renderWithAuth(contextValue: AuthContextValue, initialEntries: string[]) {
  return render(
    <AuthContext.Provider value={contextValue}>
      <MemoryRouter initialEntries={initialEntries}>
        <Routes>
          <Route element={<ProtectedRoute requiredAll={["USUARIOS_VER_LISTADO"]} />}>
            <Route path="/administracion/usuarios" element={<div>Usuarios</div>} />
          </Route>
          <Route path="/dashboard" element={<div>Dashboard</div>} />
          <Route path="/login" element={<div>Login</div>} />
        </Routes>
      </MemoryRouter>
    </AuthContext.Provider>,
  );
}

const baseContext: AuthContextValue = {
  user: {
    id: "1",
    username: "admin",
    email: "admin@test.com",
    nombre: "Admin",
    apellido: "Local",
    roles: ["ADMIN"],
    permissions: [],
    authVersion: 0,
  },
  accessToken: "token",
  isAuthenticated: true,
  isLoading: false,
  login: async () => undefined,
  loginWithGoogleToken: async () => null,
  loginWithGoogleCode: async () => null,
  logout: async () => undefined,
  refreshSessionFromMe: async () => undefined,
  hasPermission: (permissionCode: string) => permissionCode === "USUARIOS_VER_LISTADO",
  hasAnyPermission: (permissionCodes: string[]) => permissionCodes.includes("USUARIOS_VER_LISTADO"),
  hasAllPermissions: (permissionCodes: string[]) => permissionCodes.every((permissionCode) => permissionCode === "USUARIOS_VER_LISTADO"),
  hasRole: () => true,
};

describe("ProtectedRoute", () => {
  it("allows access when the user has the required permission", () => {
    renderWithAuth(baseContext, ["/administracion/usuarios"]);

    expect(screen.getByText("Usuarios")).toBeInTheDocument();
  });

  it("redirects to dashboard when the user lacks the required permission", () => {
    renderWithAuth(
      {
        ...baseContext,
        hasPermission: () => false,
        hasAnyPermission: () => false,
        hasAllPermissions: () => false,
      },
      ["/administracion/usuarios"],
    );

    expect(screen.getByText("Dashboard")).toBeInTheDocument();
  });
});
