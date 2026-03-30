import type {
  ComponentNode,
  ChildNode,
  SubConfigRef,
  RefConfigs,
  Expression,
} from '../types';
import { isComponentNode, isSubConfigRef } from '../types';

/**
 * Pre-compilation pass: walk the entire config tree and replace every
 * { $subConfig: "name", subConfigProps?: {...} } with the actual fragment.
 *
 * subConfigProps are injected as env values into the fragment node
 * (merged with any existing env on the fragment, fragment env takes priority).
 *
 * This pass runs before any expression evaluation so $subConfig can appear
 * anywhere in the tree — children, prop values, action payloads, anywhere.
 *
 * @throws if a referenced $subConfig key is not found in refConfigs.
 */
export const substituteSubConfigs = (
  node: ComponentNode,
  refConfigs: RefConfigs
): ComponentNode => {
  return substituteNode(node, refConfigs) as ComponentNode;
};

// ─────────────────────────────────────────────────────────────────────────────
// Internal recursive helpers
// ─────────────────────────────────────────────────────────────────────────────

const substituteNode = (node: ComponentNode, refs: RefConfigs): ComponentNode => {
  const result: ComponentNode = { component: node.component };

  if (node.props) {
    result.props = substituteRecord(node.props, refs) as ComponentNode['props'];
  }
  if (node.env) {
    result.env = substituteRecord(node.env, refs) as Record<string, Expression>;
  }
  if (node.selectors) {
    result.selectors = substituteRecord(node.selectors, refs) as Record<string, Expression>;
  }
  if (node.effects) {
    result.effects = node.effects.map(effect => ({
      ...effect,
      run:     effect.run.map(a => substituteValue(a, refs)) as typeof effect.run,
      cleanup: effect.cleanup?.map(a => substituteValue(a, refs)) as typeof effect.cleanup,
    }));
  }
  if (node.children) {
    result.children = normalizeChildren(node.children).map(child => substituteChild(child, refs));
  }

  return result;
};

const normalizeChildren = (children: ComponentNode['children'] | ChildNode): ChildNode[] =>
  Array.isArray(children) ? children : [children];

const substituteChild = (child: ChildNode, refs: RefConfigs): ChildNode => {
  if (child === null || child === undefined) return child;
  if (typeof child === 'string') return child;

  if (isSubConfigRef(child)) {
    return resolveSubConfig(child, refs);
  }

  if (isComponentNode(child)) {
    return substituteNode(child, refs);
  }

  // Expression — walk through it
  return substituteValue(child, refs) as ChildNode;
};

const resolveSubConfig = (ref: SubConfigRef, refs: RefConfigs): ComponentNode => {
  const fragment = refs[ref.$subConfig];
  if (fragment === undefined) {
    throw new Error(`[Epic] $subConfig "${ref.$subConfig}" not found in refConfigs`);
  }

  // If the fragment is a ComponentNode, inject subConfigProps as env
  if (isComponentNode(fragment)) {
    let resolved = substituteNode(fragment, refs);
    if (ref.subConfigProps && Object.keys(ref.subConfigProps).length > 0) {
      // subConfigProps become env in the fragment; fragment's own env takes priority
      resolved = {
        ...resolved,
        env: {
          ...ref.subConfigProps as Record<string, Expression>,
          ...(resolved.env ?? {}),
        },
      };
    }
    return resolved;
  }

  // Fragment is an expression — wrap it in a transparent node
  // This handles $subConfig used where a ComponentNode is expected but the
  // fragment resolves to an expression value at runtime.
  // For non-ComponentNode fragments used in non-child positions, substituteValue handles them.
  throw new Error(
    `[Epic] $subConfig "${ref.$subConfig}" is an expression, not a ComponentNode. ` +
    `Use it in a prop value position, not as a child.`
  );
};

// Walk arbitrary DSL values (expressions, action specs, plain objects/arrays)
const substituteValue = (value: unknown, refs: RefConfigs): unknown => {
  if (value === null || value === undefined) return value;
  if (typeof value !== 'object') return value;

  if (Array.isArray(value)) {
    return value.map(item => substituteValue(item, refs));
  }

  const obj = value as Record<string, unknown>;

  // $subConfig used as an expression (e.g. inside a prop value or action payload)
  if ('$subConfig' in obj && typeof obj['$subConfig'] === 'string') {
    const fragment = refs[obj['$subConfig'] as string];
    if (fragment === undefined) {
      throw new Error(`[Epic] $subConfig "${obj['$subConfig']}" not found in refConfigs`);
    }
    const subProps = obj['subConfigProps'] as Record<string, Expression> | undefined;
    if (isComponentNode(fragment)) {
      let resolved = substituteNode(fragment, refs);
      if (subProps && Object.keys(subProps).length > 0) {
        resolved = {
          ...resolved,
          env: { ...subProps, ...(resolved.env ?? {}) },
        };
      }
      return resolved;
    }
    // Expression fragment — return the fragment as-is (it's an expression value)
    return fragment;
  }

  // ComponentNode inside an expression position (e.g. $if.then with a node)
  if (isComponentNode(obj)) {
    return substituteNode(obj, refs);
  }

  // Plain object — recurse into all values
  const result: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(obj)) {
    result[k] = substituteValue(v, refs);
  }
  return result;
};

const substituteRecord = (
  record: Record<string, unknown>,
  refs: RefConfigs
): Record<string, unknown> => {
  const result: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(record)) {
    result[k] = substituteValue(v, refs);
  }
  return result;
};
