'use client';

import React, { useMemo, useRef } from 'react';
import { useGuiContext } from './context';
import { usePageStore } from '../store/page-store';
import { substituteSubConfigs } from '../compiler/substitute';
import { DslNode } from '../runtime/render';
import type {
  ComponentNode,
  RefConfigs,
  RuntimeContext,
  UrlInfo,
} from '../types';

// ─────────────────────────────────────────────────────────────────────────────
// GuiComponent props
// ─────────────────────────────────────────────────────────────────────────────

export interface GuiComponentProps {
  /** The root DSL config. */
  rootConfig: ComponentNode;

  /**
   * Named config fragments for { $subConfig: "name" }.
   * Values can be ComponentNode or Expression fragments.
   */
  refConfigs?: RefConfigs;

  /**
   * Values injected into the DSL context (ctx.refs).
   * Readable via { "$ref": "refs:key" } or as a bare ref { "$ref": "key" }.
   * Note: { "$ref": "env:key" } reads window.env, NOT this object.
   */
  environment?: Record<string, unknown>;

  /**
   * Page-local state slice.
   * - sliceName: identifier for this instance (used in action dispatches)
   * - initialState: the initial state shape
   */
  store?: {
    sliceName: string;
    initialState: Record<string, unknown>;
  };

  /**
   * Custom navigate handler for this component instance.
   * Falls back to GuiProvider navigate.
   */
  onNavigate?: (to: string) => void;
}

// ─────────────────────────────────────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────────────────────────────────────

export const GuiComponent: React.FC<GuiComponentProps> = ({
  rootConfig,
  refConfigs = {},
  environment,
  store,
  onNavigate,
}) => {
  const guiCtx = useGuiContext();

  // ── Page store ────────────────────────────────────────────────────────────
  const initialState = store?.initialState ?? {};
  const [pageState, dispatchPage] = usePageStore(initialState);
  const sliceName = store?.sliceName ?? '__default';
  const initialStateRef = useRef(initialState);

  // ── $subConfig substitution (structural, runs when rootConfig changes) ────
  const substitutedConfig = useMemo(() => {
    try {
      return substituteSubConfigs(rootConfig, refConfigs);
    } catch (err) {
      console.error('[Epic] $subConfig substitution failed:', err);
      return rootConfig;
    }
  }, [rootConfig, refConfigs]);

  // ── URL info ──────────────────────────────────────────────────────────────
  const url = useMemo<UrlInfo>(() => buildUrlInfo(), []);

  // ── Hook values from GuiProvider ──────────────────────────────────────────
  const hookValues = (guiCtx as typeof guiCtx & { hookValues?: Record<string, unknown> }).hookValues ?? {};

  // ── Build RuntimeContext ──────────────────────────────────────────────────
  const ctx = useMemo<RuntimeContext>(() => ({
    registries:       guiCtx.registries,
    pageState,
    dispatchPage: (action) => dispatchPage(action as Parameters<typeof dispatchPage>[0]),
    sliceName,
    initialPageState: initialStateRef.current,
    globalStore:      guiCtx.globalStore,
    refs: {
      ...hookValues,
      ...(environment ?? {}),
      __selectors: {},
    },
    url,
    navigate:  onNavigate ?? guiCtx.navigate,
    showToast: guiCtx.showToast,
    baseUrl:   guiCtx.baseUrl,
    getToken:  guiCtx.getToken,
  }), [
    guiCtx,
    pageState,
    sliceName,
    hookValues,
    environment,
    url,
    onNavigate,
  ]);

  return <DslNode node={substitutedConfig} ctx={ctx} />;
};

// ─────────────────────────────────────────────────────────────────────────────
// URL info builder
// ─────────────────────────────────────────────────────────────────────────────

const buildUrlInfo = (): UrlInfo => {
  if (typeof window === 'undefined') {
    return { params: {}, query: {}, pathname: '', search: '', hash: '', fragment: '', origin: '', fullPath: '', href: '' };
  }
  const { pathname, search, hash, origin, href } = window.location;
  const query: Record<string, string> = {};
  new URLSearchParams(search).forEach((v, k) => { query[k] = v; });

  return {
    params:   {}, // Populated by router integration if available
    query,
    pathname,
    search,
    hash,
    fragment: hash.replace(/^#/, ''),
    origin,
    fullPath: pathname + search + hash,
    href,
  };
};
