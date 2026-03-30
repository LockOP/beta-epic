import { useEffect, useState } from "react";
import { GuiComponent, GuiProvider, isComponentNode, type ComponentNode } from "@beta-epic/ui";

// ── Change this to the chat ID you want to preview ───────────────────────────
const CHAT_ID = "69ca5e90c7d4bf821d2b14cf";
// ─────────────────────────────────────────────────────────────────────────────

interface WorkspaceFile {
  id: string;
  chatId: string;
  name: string;
  type: "initial_state" | "theme_tokens" | "root_config" | "subconfig";
  content: string;
  order: number;
}

interface PreviewData {
  rootConfig: ComponentNode | null;
  subConfigs: Record<string, ComponentNode>;
  initialState: Record<string, unknown>;
  theme?: { light: Record<string, string>; dark?: Partial<Record<string, string>> };
}

function parseJson(content: string): unknown {
  try { return JSON.parse(content); } catch { return null; }
}

function toStringRecord(value: unknown): Record<string, string> {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};
  return Object.fromEntries(
    Object.entries(value as Record<string, unknown>).filter(([, v]) => typeof v === "string"),
  ) as Record<string, string>;
}

function buildPreviewData(files: WorkspaceFile[]): PreviewData {
  const initialStateFile = files.find((f) => f.type === "initial_state");
  const themeFile        = files.find((f) => f.type === "theme_tokens");
  const rootConfigFile   = files.find((f) => f.type === "root_config");

  const initialState = (() => {
    const parsed = parseJson(initialStateFile?.content ?? "");
    return parsed && typeof parsed === "object" && !Array.isArray(parsed)
      ? (parsed as Record<string, unknown>)
      : {};
  })();

  const themeRecord = parseJson(themeFile?.content ?? "");
  const lightTheme  = toStringRecord(
    themeRecord && typeof themeRecord === "object" ? (themeRecord as Record<string, unknown>).light : null,
  );
  const darkTheme   = toStringRecord(
    themeRecord && typeof themeRecord === "object" ? (themeRecord as Record<string, unknown>).dark  : null,
  );

  const rawRoot  = parseJson(rootConfigFile?.content ?? "");
  const rootConfig = isComponentNode(rawRoot) ? rawRoot : null;

  const subConfigs = Object.fromEntries(
    files
      .filter((f) => f.type === "subconfig")
      .flatMap((f) => {
        const parsed = parseJson(f.content);
        return isComponentNode(parsed) ? [[f.name, parsed]] : [];
      }),
  ) as Record<string, ComponentNode>;

  return {
    rootConfig,
    subConfigs,
    initialState,
    theme: Object.keys(lightTheme).length > 0
      ? { light: lightTheme, ...(Object.keys(darkTheme).length > 0 ? { dark: darkTheme } : {}) }
      : undefined,
  };
}

export function HomePage() {
  const [data, setData]       = useState<PreviewData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    setError(null);

    fetch(`/api/chats/${CHAT_ID}/files`)
      .then((r) => {
        if (!r.ok) throw new Error(`API error ${r.status}`);
        return r.json() as Promise<WorkspaceFile[]>;
      })
      .then((files) => setData(buildPreviewData(files)))
      .catch((err: unknown) => setError(err instanceof Error ? err.message : String(err)))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center text-muted-foreground text-sm">
        Loading preview…
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-sm text-destructive">Error: {error}</p>
      </div>
    );
  }

  if (!data?.rootConfig) {
    return (
      <div className="flex min-h-screen items-center justify-center text-muted-foreground text-sm">
        No root config found for chat <code className="mx-1 font-mono">{CHAT_ID}</code>.
      </div>
    );
  }

  return (
    <GuiProvider theme={data.theme}>
      <GuiComponent
        rootConfig={data.rootConfig}
        refConfigs={data.subConfigs}
        store={{ sliceName: CHAT_ID, initialState: data.initialState }}
      />
    </GuiProvider>
  );
}
