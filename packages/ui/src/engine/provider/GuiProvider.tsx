'use client';

import React, { useId, useMemo, useRef } from 'react';
import { GuiContext } from './context';
import { defaultComponentRegistry } from '../defaults/component-registry';
import { defaultFnRegistry } from '../defaults/fn-registry';
import { defaultHookRegistry } from '../defaults/hook-registry';
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
   * Theme tokens split by mode.
   * - `light` tokens are always applied.
   * - `dark` tokens override under `.dark` (any ancestor with that class).
   *   Omitted dark tokens are auto-generated: HSL colours have their lightness
   *   inverted, non-colour values (radius, etc.) are copied unchanged.
   */
  theme?: { light: Record<string, string>; dark?: Partial<Record<string, string>> };
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
// Component
// ─────────────────────────────────────────────────────────────────────────────

// ─────────────────────────────────────────────────────────────────────────────
// Theme helpers
// ─────────────────────────────────────────────────────────────────────────────

/** Matches "H S% L%" HSL channel strings (no hsl() wrapper). */
const HSL_RE = /^\d+(\.\d+)?\s+\d+(\.\d+)?%\s+\d+(\.\d+)?%$/

function isHslColor(value: string): boolean {
  return HSL_RE.test(value.trim())
}

function invertLightness(hsl: string): string {
  const [h, s, l] = hsl.trim().split(/\s+/)
  return `${h} ${s} ${Math.round(100 - parseFloat(l))}%`
}

/** Build a resolved dark token map, auto-filling anything not provided. */
function resolveDarkTokens(
  light: Record<string, string>,
  userDark: Partial<Record<string, string>> = {},
): Record<string, string> {
  const dark: Record<string, string> = {}
  for (const [key, value] of Object.entries(light)) {
    dark[key] = key in userDark
      ? userDark[key]!
      : isHslColor(value) ? invertLightness(value) : value
  }
  return dark
}

function toCssVars(tokens: Record<string, string>): string {
  return Object.entries(tokens).map(([k, v]) => `  --${k}: ${v};`).join('\n')
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
  const themeCSS = useMemo(() => {
    if (!theme) return null
    const dark = resolveDarkTokens(theme.light, theme.dark)
    return [
      `[data-epic-root="${scopeId}"] {\n${toCssVars(theme.light)}\n}`,
      `.dark [data-epic-root="${scopeId}"] {\n${toCssVars(dark)}\n}`,
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
