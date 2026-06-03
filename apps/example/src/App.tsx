import { type ReactNode } from "react";
import { GuiProvider } from "@beta-epic/ui";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { Eg1Page } from "./pages/eg1/page";
import { Eg2Page } from "./pages/eg2/page";
import { Eg3Page } from "./pages/eg3/page";
import { Eg4Page } from "./pages/eg4/page";

function ExampleProvider({ children }: { children: ReactNode }) {
  return <GuiProvider components={{}}>{children}</GuiProvider>;
}

function ExampleShell() {
  return (
    <div className="min-h-screen bg-background">
      <main>
        <Routes>
          <Route path="/" element={<Navigate to="/eg1" replace />} />
          <Route path="/eg1" element={<Eg1Page />} />
          <Route path="/eg2" element={<Eg2Page />} />
          <Route path="/eg3" element={<Eg3Page />} />
          <Route path="/eg4" element={<Eg4Page />} />
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
