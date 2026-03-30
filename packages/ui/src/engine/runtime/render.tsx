'use client';

import React, { useMemo, useEffect, useRef } from 'react';
import type {
  ComponentNode,
  ChildNode,
  ActionExpression,
  EffectConfig,
  Expression,
  RuntimeContext,
  ActionSpec,
} from '../types';
import { isComponentNode, isActionExpression } from '../types';
import { evaluateExpression } from '../compiler/expr';
import { runActions } from '../compiler/actions';

function hasPreventDefault(value: unknown): value is { preventDefault: () => void } {
  return (
    typeof value === 'object' &&
    value !== null &&
    'preventDefault' in value &&
    typeof (value as { preventDefault?: unknown }).preventDefault === 'function'
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// DslNode — renders a single ComponentNode reactively
// ─────────────────────────────────────────────────────────────────────────────

interface DslNodeProps {
  node: ComponentNode;
  ctx: RuntimeContext;
  nodeKey?: React.Key;
}

export const DslNode: React.FC<DslNodeProps> = ({ node, ctx }) => {
  // ── 1. Extend context with env ────────────────────────────────────────────
  const nodeCtx = useMemo<RuntimeContext>(() => {
    if (!node.env) return ctx;
    const envValues: Record<string, unknown> = {};
    // Evaluate each env expression in order (later ones can see earlier ones)
    let accCtx = ctx;
    for (const [key, expr] of Object.entries(node.env)) {
      const val = evaluateExpression(expr, accCtx);
      envValues[key] = val;
      accCtx = { ...accCtx, refs: { ...accCtx.refs, ...envValues } };
    }
    return accCtx;
  }, [ctx, node.env]);

  // ── 2. Evaluate selectors and add to context ──────────────────────────────
  const ctxWithSelectors = useMemo<RuntimeContext>(() => {
    if (!node.selectors) return nodeCtx;
    const selectorValues: Record<string, unknown> = {};
    let accCtx = nodeCtx;
    for (const [key, expr] of Object.entries(node.selectors)) {
      const val = evaluateExpression(expr, accCtx);
      selectorValues[key] = val;
      // Each selector can reference previously computed selectors
      accCtx = {
        ...accCtx,
        refs: {
          ...accCtx.refs,
          __selectors: { ...(accCtx.refs['__selectors'] as Record<string, unknown> | undefined ?? {}), [key]: val },
        },
      };
    }
    return accCtx;
  }, [nodeCtx, node.selectors, ctx.pageState]);

  // ── 3. Evaluate props ─────────────────────────────────────────────────────
  const evaluatedProps = useMemo(() => {
    const props: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(node.props ?? {})) {
      if (isActionExpression(value)) {
        // Compile action to a handler function
        props[key] = (...args: unknown[]) => {
          if (key === 'onSubmit' && hasPreventDefault(args[0])) {
            args[0].preventDefault();
          }
          const actions = Array.isArray(value.$action) ? value.$action : [value.$action];
          void runActions(actions as ActionSpec[], ctxWithSelectors, args);
        };
      } else {
        props[key] = evaluateExpression(value as Expression, ctxWithSelectors);
      }
    }
    return props;
  }, [ctxWithSelectors, node.props]);

  // ── 4. Get component from registry ───────────────────────────────────────
  const Component = ctxWithSelectors.registries.components[node.component];
  if (!Component) {
    console.warn(`[Epic] Component "${node.component}" not found in registry`);
    return null;
  }

  // ── 5. Render children ────────────────────────────────────────────────────
  const renderedChildren = renderChildren(normalizeChildren(node.children), ctxWithSelectors);

  // ── 6. Wrap with effects if needed ────────────────────────────────────────
  const content = (
    <Component {...evaluatedProps}>
      {renderedChildren}
    </Component>
  );

  if (node.effects?.length) {
    return (
      <EffectsWrapper effects={node.effects} ctx={ctxWithSelectors}>
        {content}
      </EffectsWrapper>
    );
  }

  return content;
};

// ─────────────────────────────────────────────────────────────────────────────
// renderChildren — handle the mixed children array
// ─────────────────────────────────────────────────────────────────────────────

const renderChildren = (
  children: ChildNode[],
  ctx: RuntimeContext
): React.ReactNode => {
  const nodes: React.ReactNode[] = [];

  for (let i = 0; i < children.length; i++) {
    const child = children[i];
    const rendered = renderChild(child, ctx, i);
    if (rendered !== null && rendered !== undefined) {
      nodes.push(rendered);
    }
  }

  return nodes.length === 0 ? undefined : nodes.length === 1 ? nodes[0] : nodes;
};

const normalizeChildren = (children: ComponentNode['children'] | ChildNode): ChildNode[] => {
  if (children === null || children === undefined) return [];
  return Array.isArray(children) ? children : [children];
};

const renderChild = (child: ChildNode, ctx: RuntimeContext, key: number): React.ReactNode => {
  if (child === null || child === undefined) return null;
  if (typeof child === 'string') return child;

  if (isComponentNode(child)) {
    return <DslNode key={key} node={child} ctx={ctx} />;
  }

  // Expression — evaluate it
  const value = evaluateExpression(child as Expression, ctx);

  if (value === null || value === undefined) return null;
  if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
    return String(value);
  }
  if (isComponentNode(value)) {
    return <DslNode key={key} node={value as ComponentNode} ctx={ctx} />;
  }
  if (Array.isArray(value)) {
    return value.map((item, idx) => renderChild(item as ChildNode, ctx, key * 1000 + idx));
  }

  return null;
};

// ─────────────────────────────────────────────────────────────────────────────
// EffectsWrapper — mounts/unmounts useEffect hooks for a node's effects array
// ─────────────────────────────────────────────────────────────────────────────

interface EffectsWrapperProps {
  effects: EffectConfig[];
  ctx: RuntimeContext;
  children: React.ReactNode;
}

const EffectsWrapper: React.FC<EffectsWrapperProps> = ({ effects, ctx, children }) => {
  // Render nested SingleEffect components wrapping the actual content
  // This avoids calling hooks in a loop (React rules).
  // Each effect becomes a wrapper layer.
  return effects.reduceRight<React.ReactNode>(
    (acc, effect, i) => (
      <SingleEffect key={i} effect={effect} ctx={ctx}>
        {acc}
      </SingleEffect>
    ),
    children
  ) as React.ReactElement;
};

// ─────────────────────────────────────────────────────────────────────────────
// SingleEffect — one useEffect for one EffectConfig
// ─────────────────────────────────────────────────────────────────────────────

interface SingleEffectProps {
  effect: EffectConfig;
  ctx: RuntimeContext;
  children: React.ReactNode;
}

const SingleEffect: React.FC<SingleEffectProps> = ({ effect, ctx, children }) => {
  // Evaluate current dep values
  const depValues = effect.deps.map(dep => evaluateExpression(dep, ctx));

  const isInitialMount = useRef(true);
  const debounceTimer  = useRef<ReturnType<typeof setTimeout> | null>(null);
  const cleanupRef     = useRef<(() => void) | null>(null);

  useEffect(() => {
    const runEffect = () => {
      // Run cleanup from previous run before starting new one
      cleanupRef.current?.();
      cleanupRef.current = null;

      void runActions(effect.run, ctx, []);

      if (effect.cleanup?.length) {
        cleanupRef.current = () => {
          void runActions(effect.cleanup!, ctx, []);
        };
      }
    };

    if (isInitialMount.current) {
      isInitialMount.current = false;
      // Initial mount always fires immediately regardless of debounce
      runEffect();
    } else if (effect.debounce && effect.debounce > 0) {
      // Cancel pending debounce, run cleanup, then debounce the new run
      if (debounceTimer.current) clearTimeout(debounceTimer.current);
      cleanupRef.current?.();
      cleanupRef.current = null;

      debounceTimer.current = setTimeout(runEffect, effect.debounce);
    } else {
      runEffect();
    }

    return () => {
      if (debounceTimer.current) clearTimeout(debounceTimer.current);
      cleanupRef.current?.();
      cleanupRef.current = null;
    };
    // depValues is stable-compared by React via the spread below
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, depValues);

  return <>{children}</>;
};
