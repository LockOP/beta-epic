'use client';

import React, { useId, useMemo, useRef } from 'react';
import { GuiContext } from './context';
import { defaultComponentRegistry } from '../defaults/component-registry';
import { defaultFnRegistry } from '../defaults/fn-registry';
import { defaultHookRegistry } from '../defaults/hook-registry';
import { DEFAULT_DARK_TOKENS, DEFAULT_LIGHT_TOKENS } from '../defaults/theme-tokens';
import type { ComponentType, Registries, ToastVariant } from '../types';
import { toast, ToastProvider } from '../../components/ui/toast';

// ─────────────────────────────────────────────────────────────────────────────
// GuiProvider props
// ─────────────────────────────────────────────────────────────────────────────

export interface GuiProviderProps {
  children: React.ReactNode;

  // ── Registry extensions ───────────────────────────────────────────────────
  /** Additional / override component mappings. DSL uses these by component name. */
  components?: Record<string, ComponentType>;
  /** Additional / override function mappings. Used via { "$fn": "name" }. */
  functions?: Record<string, (...args: unknown[]) => unknown>;
  /**
   * React hooks to call at the provider level.
   * Return values are available via { "$ref": "refs:hookName.field" }.
   *
   *   hooks={{ currentUser: () => useAuth().user }}
   *   → { "$ref": "refs:currentUser.email" }
   */
  hooks?: Record<string, () => unknown>;

  // ── HTTP ──────────────────────────────────────────────────────────────────
  /** Base URL prepended to relative $http URLs. */
  baseUrl?: string;
  /** Returns a Bearer token for every $http call. */
  getToken?: () => Promise<string | null>;

  // ── Navigation ────────────────────────────────────────────────────────────
  /** Custom navigate handler. Defaults to SPA-style history navigation. */
  navigate?: (to: string) => void;

  // ── Toast ─────────────────────────────────────────────────────────────────
  /** Custom toast handler for snackbar actions. Defaults to the built-in Sonner toaster. */
  showToast?: (message: string, variant?: ToastVariant) => void;

  // ── Global store ─────────────────────────────────────────────────────────
  /** External store (Redux, Zustand). Read via { "$ref": "redux:path" }. */
  globalStore?: { getState: () => Record<string, unknown> };

  // ── Theme ─────────────────────────────────────────────────────────────────
  /**
   * Theme token overrides split by mode.
   * - `light` overrides the built-in light defaults.
   * - `dark` overrides the built-in dark defaults under `.dark`.
   */
  theme?: {
    light?: Partial<Record<string, string>>
    dark?: Partial<Record<string, string>>
  };
}

const useDefaultNavigate = (): ((to: string) => void) =>
  React.useCallback((to: string) => {
    if (typeof window === 'undefined') return;

    const nextUrl = new URL(to, window.location.href);
    const currentUrl = new URL(window.location.href);
    const nextHref = `${nextUrl.pathname}${nextUrl.search}${nextUrl.hash}`;
    const currentHref = `${currentUrl.pathname}${currentUrl.search}${currentUrl.hash}`;

    if (nextUrl.origin !== currentUrl.origin) {
      window.location.href = nextUrl.toString();
      return;
    }

    if (nextHref === currentHref) return;

    window.history.pushState({}, '', nextHref);
    window.dispatchEvent(new PopStateEvent('popstate'));
  }, []);

const useDefaultToast = (): ((message: string, variant?: ToastVariant) => void) =>
  React.useCallback((message: string, variant?: ToastVariant) => {
    switch (variant) {
      case 'success':
        toast.success(message);
        break;
      case 'error':
        toast.error(message);
        break;
      case 'warning':
        toast.warning(message);
        break;
      case 'info':
        toast.info(message);
        break;
      default:
        toast(message);
        break;
    }
  }, []);

// ─────────────────────────────────────────────────────────────────────────────
// Theme helpers
// ─────────────────────────────────────────────────────────────────────────────

function toCssVars(tokens: Record<string, string>): string {
  return Object.entries(tokens).map(([k, v]) => `  --${k}: ${v};`).join('\n')
}

function mergeThemeTokens(
  defaults: Record<string, string>,
  overrides?: Partial<Record<string, string>>,
): Record<string, string> {
  const merged = { ...defaults }

  if (!overrides) {
    return merged
  }

  for (const [key, value] of Object.entries(overrides)) {
    if (value !== undefined) {
      merged[key] = value
    }
  }

  return merged
}

/** Scoped base styles equivalent to the @layer base block in index.css */
function buildBaseCSS(scopeId: string): string {
  const root = `[data-epic-root="${scopeId}"]`
  return [
    `${root} :where(*, *::before, *::after) {`,
    `  border-color: hsl(var(--border));`,
    `}`,
    `${root} {`,
    `  background-color: hsl(var(--background));`,
    `  color: hsl(var(--foreground));`,
    `  -webkit-font-smoothing: antialiased;`,
    `  -moz-osx-font-smoothing: grayscale;`,
    `  font-feature-settings: "rlig" 1, "calt" 1;`,
    `}`,
  ].join('\n')
}

export const GuiProvider: React.FC<GuiProviderProps> = ({
  children,
  components,
  functions,
  hooks,
  baseUrl,
  getToken,
  navigate,
  showToast,
  globalStore,
  theme,
}) => {
  const rawId = useId()
  // useId returns ":r0:" style strings — sanitise for use in CSS selectors
  const scopeId = rawId.replace(/:/g, '-').replace(/^-|-$/g, '')

  const defaultNavigate = useDefaultNavigate();
  const defaultToast = useDefaultToast();

  // ── Call all registered hooks ─────────────────────────────────────────────
  // Hooks must be called unconditionally, so we collect them here.
  // The HookRunner pattern handles this: each hook is a function, we call it.
  const allHooks = { ...defaultHookRegistry, ...hooks };

  // Call each hook (React rules: must be called at top level)
  // We use a stable ref to avoid calling on every render if hooks object changes
  const hookValuesRef = useRef<Record<string, unknown>>({});
  for (const [key, hookFn] of Object.entries(allHooks)) {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    hookValuesRef.current[key] = hookFn();
  }

  // ── Merge registries ──────────────────────────────────────────────────────
  const registries = useMemo<Registries>(() => ({
    components: { ...defaultComponentRegistry, ...(components ?? {}) },
    functions:  { ...defaultFnRegistry, ...(functions ?? {}) },
    hooks:      { ...defaultHookRegistry, ...(hooks ?? {}) },
  }), [components, functions, hooks]);

  // ── Default navigate ──────────────────────────────────────────────────────
  const handleNavigate = navigate ?? defaultNavigate;

  // ── Default toast ─────────────────────────────────────────────────────────
  const handleToast = showToast ?? defaultToast;

  // ── Context value ─────────────────────────────────────────────────────────
  const contextValue = useMemo(() => ({
    registries,
    baseUrl,
    getToken,
    navigate:   handleNavigate,
    showToast:  handleToast,
    globalStore,
    hookValues: hookValuesRef.current,
  }), [registries, baseUrl, getToken, handleNavigate, handleToast, globalStore]);

  // ── Theme injection ───────────────────────────────────────────────────────
  // Default tokens are always applied; the `theme` prop overrides on top.
  // Base styles (border-color, bg, text, font-smoothing) are also injected
  // so the consumer app needs no index.css setup.
  const themeCSS = useMemo(() => {
    const light = mergeThemeTokens(DEFAULT_LIGHT_TOKENS, theme?.light)
    const dark = mergeThemeTokens(DEFAULT_DARK_TOKENS, theme?.dark)
    return [
      `[data-epic-root="${scopeId}"] {\n${toCssVars(light)}\n}`,
      `.dark [data-epic-root="${scopeId}"] {\n${toCssVars(dark)}\n}`,
      buildBaseCSS(scopeId),
    ].join('\n')
  }, [theme, scopeId])

  return (
    <GuiContext.Provider value={contextValue}>
      {themeCSS && <style>{themeCSS}</style>}
      <div data-epic-root={scopeId}>
        {children}
        <ToastProvider />
      </div>
    </GuiContext.Provider>
  );
};
