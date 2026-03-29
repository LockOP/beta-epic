import { createContext, useContext } from 'react';
import type { Registries, ToastVariant } from '../types';

// ─────────────────────────────────────────────────────────────────────────────
// GuiContext — provided by GuiProvider, consumed by GuiComponent
// ─────────────────────────────────────────────────────────────────────────────

export interface GuiContextValue {
  registries: Registries;
  baseUrl?: string;
  getToken?: () => Promise<string | null>;
  navigate?: (to: string) => void;
  showToast?: (message: string, variant?: ToastVariant) => void;
  /** Optional external store (Redux, Zustand, etc.) for redux: refs */
  globalStore?: { getState: () => Record<string, unknown> };
}

export const GuiContext = createContext<GuiContextValue | null>(null);

export const useGuiContext = (): GuiContextValue => {
  const ctx = useContext(GuiContext);
  if (!ctx) {
    throw new Error('[Epic] useGuiContext must be called inside <GuiProvider>');
  }
  return ctx;
};
