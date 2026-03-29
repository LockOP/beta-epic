import { type ReactNode } from "react";
import { Badge, GuiProvider, cn } from "@beta-epic/ui";
import { BrowserRouter, NavLink, Route, Routes } from "react-router-dom";
import { DashboardPage } from "@/pages/DashboardPage";
import { FormPage } from "@/pages/FormPage";

const nav = [
  { to: "/", label: "Dashboard" },
  { to: "/form", label: "Account Settings" },
];

const saveExampleProfile = async (profile: unknown, notifications: unknown) => {
  await new Promise((resolve) => setTimeout(resolve, 700));

  const email = (() => {
    if (profile && typeof profile === "object" && "email" in profile) {
      return String((profile as { email?: unknown }).email ?? "");
    }
    return "";
  })();

  if (email.includes("fail")) {
    throw new Error('Use an email without "fail" to simulate a successful save.');
  }

  return {
    savedAt: new Date().toLocaleTimeString(),
    profile,
    notifications,
  };
};

function ExampleProvider({ children }: { children: ReactNode }) {
  return (
    <GuiProvider functions={{ saveExampleProfile }}>
      {children}
    </GuiProvider>
  );
}

function ExampleShell() {
  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-background/90 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4">
          <div className="flex items-center gap-3">
            <span className="text-sm font-semibold">@beta-epic/ui example</span>
            <Badge variant="secondary">current engine</Badge>
          </div>
          <nav className="flex items-center gap-1">
            {nav.map(({ to, label }) => (
              <NavLink
                key={to}
                to={to}
                end={to === "/"}
                className={({ isActive }) =>
                  cn(
                    "rounded-md px-3 py-1.5 text-sm transition-colors",
                    isActive
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:bg-accent hover:text-foreground",
                  )
                }
              >
                {label}
              </NavLink>
            ))}
          </nav>
        </div>
      </header>

      <main>
        <Routes>
          <Route path="/" element={<DashboardPage />} />
          <Route path="/form" element={<FormPage />} />
        </Routes>
      </main>
    </div>
  );
}

export function App() {
  return (
    <BrowserRouter>
      <ExampleProvider>
        <ExampleShell />
      </ExampleProvider>
    </BrowserRouter>
  );
}
