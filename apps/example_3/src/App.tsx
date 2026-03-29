import { type ReactNode } from "react";
import { Badge, GuiProvider, cn } from "@beta-epic/ui";
import { BrowserRouter, NavLink, Route, Routes } from "react-router-dom";
import { SearchPage } from "@/pages/SearchPage";
import { SubjectsPage } from "@/pages/SubjectsPage";

const nav = [
  { to: "/", label: "Search Explorer" },
  { to: "/subjects", label: "Subject Browser" },
];

function ExampleProvider({ children }: { children: ReactNode }) {
  return <GuiProvider>{children}</GuiProvider>;
}

function ExampleShell() {
  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-background/90 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-4">
          <div className="flex items-center gap-3">
            <span className="text-sm font-semibold">
              @beta-epic/ui example_3
            </span>
            <Badge variant="secondary">Open Library</Badge>
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
          <Route path="/" element={<SearchPage />} />
          <Route path="/subjects" element={<SubjectsPage />} />
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
