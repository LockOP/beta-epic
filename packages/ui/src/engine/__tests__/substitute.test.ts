import { describe, it, expect } from 'vitest';
import { substituteSubConfigs } from '../compiler/substitute';
import type { ComponentNode, RefConfigs } from '../types';

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

const sub = (root: ComponentNode, refs: RefConfigs = {}) =>
  substituteSubConfigs(root, refs);

const card: ComponentNode = {
  component: 'Card',
  props: { size: 'sm' },
  children: [
    { component: 'CardTitle', children: [{ $ref: 'var:label' }] },
  ],
};

// ─────────────────────────────────────────────────────────────────────────────
// Basic substitution
// ─────────────────────────────────────────────────────────────────────────────

describe('$subConfig basic', () => {
  it('replaces $subConfig ref with the fragment', () => {
    const root: ComponentNode = {
      component: 'Container',
      children: [{ $subConfig: 'card' }],
    };
    const result = sub(root, { card });
    expect((result.children![0] as ComponentNode).component).toBe('Card');
  });

  it('preserves fragment props', () => {
    const root: ComponentNode = {
      component: 'Container',
      children: [{ $subConfig: 'card' }],
    };
    const result = sub(root, { card });
    expect((result.children![0] as ComponentNode).props).toEqual({ size: 'sm' });
  });

  it('throws for unknown $subConfig key', () => {
    const root: ComponentNode = {
      component: 'Container',
      children: [{ $subConfig: 'missing' }],
    };
    expect(() => sub(root, {})).toThrow('$subConfig "missing" not found');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// subConfigProps → env injection
// ─────────────────────────────────────────────────────────────────────────────

describe('subConfigProps', () => {
  it('injects subConfigProps as env into fragment', () => {
    const root: ComponentNode = {
      component: 'Container',
      children: [{ $subConfig: 'card', subConfigProps: { label: 'Revenue', value: 42 } }],
    };
    const result = sub(root, { card });
    const injected = result.children![0] as ComponentNode;
    expect(injected.env).toMatchObject({ label: 'Revenue', value: 42 });
  });

  it("fragment's own env takes priority over subConfigProps", () => {
    const cardWithEnv: ComponentNode = {
      ...card,
      env: { label: 'Overridden' },
    };
    const root: ComponentNode = {
      component: 'Container',
      children: [{ $subConfig: 'cardWithEnv', subConfigProps: { label: 'Ignored' } }],
    };
    const result = sub(root, { cardWithEnv });
    const injected = result.children![0] as ComponentNode;
    expect(injected.env!.label).toBe('Overridden');
  });

  it('handles empty subConfigProps gracefully', () => {
    const root: ComponentNode = {
      component: 'Container',
      children: [{ $subConfig: 'card', subConfigProps: {} }],
    };
    const result = sub(root, { card });
    // No env should be added for empty props
    expect((result.children![0] as ComponentNode).env).toBeUndefined();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Recursive substitution
// ─────────────────────────────────────────────────────────────────────────────

describe('nested substitution', () => {
  it('substitutes $subConfig inside fragment children', () => {
    const inner: ComponentNode = { component: 'Inner', children: [] };
    const outer: ComponentNode = {
      component: 'Outer',
      children: [{ $subConfig: 'inner' }],
    };
    const root: ComponentNode = {
      component: 'Root',
      children: [{ $subConfig: 'outer' }],
    };
    const result = sub(root, { inner, outer });
    const outerNode = result.children![0] as ComponentNode;
    expect(outerNode.component).toBe('Outer');
    expect((outerNode.children![0] as ComponentNode).component).toBe('Inner');
  });

  it('walks through $if then/else to substitute nodes', () => {
    const root: ComponentNode = {
      component: 'Root',
      children: [{
        $if: {
          cond: true,
          then: { $subConfig: 'card' } as unknown as ComponentNode,
          else: null,
        },
      }],
    };
    const result = sub(root, { card });
    // After substitution the $if.then should be the resolved card node
    const child = result.children![0] as Record<string, unknown>;
    const thenNode = (child['$if'] as Record<string, unknown>)['then'] as ComponentNode;
    expect(thenNode.component).toBe('Card');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Props and selectors walkthrough
// ─────────────────────────────────────────────────────────────────────────────

describe('props and selectors walkthrough', () => {
  it('walks props object and substitutes any $subConfig values', () => {
    const btn: ComponentNode = { component: 'Button' };
    const root: ComponentNode = {
      component: 'Root',
      props: { icon: { $subConfig: 'btn' } as unknown as ComponentNode },
    };
    const result = sub(root, { btn });
    expect((result.props!.icon as ComponentNode).component).toBe('Button');
  });

  it('walks selectors and substitutes inside', () => {
    const root: ComponentNode = {
      component: 'Root',
      selectors: {
        val: { $subConfig: 'someExpr' } as unknown as null,
      },
    };
    // Expression-type fragment (not ComponentNode)
    const result = sub(root, { someExpr: 42 as unknown as ComponentNode });
    expect(result.selectors!.val).toBe(42);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Pass-through — nodes without $subConfig are unchanged
// ─────────────────────────────────────────────────────────────────────────────

describe('pass-through', () => {
  it('returns equivalent tree when no $subConfig present', () => {
    const root: ComponentNode = {
      component: 'Page',
      props: { title: 'Hello' },
      children: [{ component: 'Text', children: ['world'] }],
    };
    const result = sub(root, {});
    expect(result).toEqual(root);
  });

  it('handles string children unchanged', () => {
    const root: ComponentNode = {
      component: 'Label',
      children: ['static text'],
    };
    const result = sub(root, {});
    expect(result.children![0]).toBe('static text');
  });
});
