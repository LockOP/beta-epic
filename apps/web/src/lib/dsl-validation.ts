import { isComponentNode, type ChildNode, type ComponentNode } from "@beta-epic/ui"

export interface DslValidationIssue {
  path: string
  message: string
}

const COMPARISON_OPERATORS = new Set(["$eq", "$neq", "$gt", "$gte", "$lt", "$lte"])

export function validateDslComponentTree(
  node: unknown,
  options?: { knownComponents?: Iterable<string>; path?: string },
): DslValidationIssue[] {
  const knownComponents = new Set(options?.knownComponents ?? [])
  const path = options?.path ?? "root"

  if (!isComponentNode(node)) {
    return [{ path, message: 'Expected a ComponentNode with a non-empty "component" string.' }]
  }

  return validateComponentNode(node, path, knownComponents)
}

function validateComponentNode(
  node: ComponentNode,
  path: string,
  knownComponents: Set<string>,
): DslValidationIssue[] {
  const issues: DslValidationIssue[] = []

  if (knownComponents.size > 0 && !knownComponents.has(node.component)) {
    issues.push({
      path: `${path}.component`,
      message: `Unknown component "${node.component}". Use only registered components.`,
    })
  }

  if ("children" in node && node.children !== undefined && !Array.isArray(node.children)) {
    issues.push({
      path: `${path}.children`,
      message: '"children" must be an array when present. For a single text child, use ["Text"].',
    })
  }

  issues.push(...validateDslValue(node.props, `${path}.props`, knownComponents))
  issues.push(...validateDslValue(node.env, `${path}.env`, knownComponents))
  issues.push(...validateDslValue(node.selectors, `${path}.selectors`, knownComponents))
  issues.push(...validateDslValue(node.effects, `${path}.effects`, knownComponents))

  const children = normalizeChildren(node.children)
  children.forEach((child, index) => {
    issues.push(...validateChild(child, `${path}.children[${index}]`, knownComponents))
  })

  return issues
}

function validateChild(
  child: ChildNode,
  path: string,
  knownComponents: Set<string>,
): DslValidationIssue[] {
  if (child === null || child === undefined || typeof child === "string") return []
  if (isComponentNode(child)) return validateComponentNode(child, path, knownComponents)
  return validateDslValue(child, path, knownComponents)
}

function validateDslValue(
  value: unknown,
  path: string,
  knownComponents: Set<string>,
): DslValidationIssue[] {
  if (value === null || value === undefined) return []
  if (typeof value !== "object") return []

  if (Array.isArray(value)) {
    return value.flatMap((item, index) => validateDslValue(item, `${path}[${index}]`, knownComponents))
  }

  if (isComponentNode(value)) {
    return validateComponentNode(value, path, knownComponents)
  }

  const obj = value as Record<string, unknown>
  const issues: DslValidationIssue[] = []

  if (typeof obj.$subConfig === "string") {
    issues.push(...validateDslValue(obj.subConfigProps, `${path}.subConfigProps`, knownComponents))
    return issues
  }

  for (const operator of COMPARISON_OPERATORS) {
    if (operator in obj) {
      const comparisonValue = obj[operator]
      if (
        !comparisonValue ||
        typeof comparisonValue !== "object" ||
        Array.isArray(comparisonValue) ||
        !("a" in (comparisonValue as Record<string, unknown>)) ||
        !("b" in (comparisonValue as Record<string, unknown>))
      ) {
        issues.push({
          path: `${path}.${operator}`,
          message: `${operator} must have shape { "a": <expr>, "b": <expr> }.`,
        })
      }
    }
  }

  for (const [key, entryValue] of Object.entries(obj)) {
    issues.push(...validateDslValue(entryValue, `${path}.${key}`, knownComponents))
  }

  return issues
}

function normalizeChildren(children: ComponentNode["children"] | ChildNode): ChildNode[] {
  if (children === null || children === undefined) return []
  return Array.isArray(children) ? children : [children]
}
