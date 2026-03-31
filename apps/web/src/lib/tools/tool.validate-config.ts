import { FILE_TYPES, type FileType } from "./types"
import { defaultComponentRegistry } from "@beta-epic/ui"
import { validateDslComponentTree } from "@/lib/dsl-validation"

const ALLOWED_DSL_OPERATOR_KEYS = new Set([
  "$action",
  "$subConfig",
  "$ref",
  "$arg",
  "$fn",
  "$http",
  "$pipe",
  "$if",
  "$switch",
  "$not",
  "$and",
  "$or",
  "$in",
  "$has",
  "$isEmpty",
  "$isNil",
  "$isNotNil",
  "$isArray",
  "$eq",
  "$neq",
  "$gt",
  "$gte",
  "$lt",
  "$lte",
  "$add",
  "$sub",
  "$mul",
  "$div",
  "$mod",
  "$pow",
  "$abs",
  "$negate",
  "$sqrt",
  "$ceil",
  "$floor",
  "$round",
  "$sum",
  "$min",
  "$max",
  "$clamp",
  "$concat",
  "$length",
  "$trim",
  "$lower",
  "$upper",
  "$replace",
  "$padStart",
  "$padEnd",
  "$split",
  "$join",
  "$includes",
  "$startsWith",
  "$endsWith",
  "$contains",
  "$charAt",
  "$string",
  "$number",
  "$bool",
  "$nullish",
  "$map",
  "$filter",
  "$reduce",
  "$find",
  "$findIndex",
  "$some",
  "$every",
  "$sort",
  "$count",
  "$first",
  "$last",
  "$flat",
  "$flatten",
  "$reverse",
  "$compact",
  "$uniq",
  "$slice",
  "$at",
  "$append",
  "$prepend",
  "$merge",
  "$get",
  "$entries",
  "$pick",
  "$omit",
  "$json",
  "$parse",
])

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value)
}

function collectEventHandlerIssues(
  node: unknown,
  path: string,
  issues: string[],
): void {
  if (!isPlainObject(node)) return

  const props = isPlainObject(node.props) ? node.props : null
  if (props) {
    for (const [propName, propValue] of Object.entries(props)) {
      if (!/^on[A-Z]/.test(propName)) continue
      if (!isPlainObject(propValue)) continue
      if ("$action" in propValue) continue

      const hint =
        "$if" in propValue
          ? `wrap the event handler in "$action", then put "$if" inside the action array`
          : `event handler props must use the shape { "$action": [...] }`
      issues.push(`${path}.props.${propName}: ${hint}.`)
    }
  }

  const children = node.children
  if (Array.isArray(children)) {
    children.forEach((child, index) => {
      collectEventHandlerIssues(child, `${path}.children[${index}]`, issues)
    })
  } else if (children !== undefined && children !== null) {
    collectEventHandlerIssues(children, `${path}.children`, issues)
  }
}

/** Components that accept a value prop and need onChange to be interactive */
const CONTROLLED_INPUT_COMPONENTS = new Set([
  "Input", "Textarea", "Select", "SelectTrigger",
  "Checkbox", "Switch", "RadioGroup", "Slider",
])

function collectControlledInputIssues(
  node: unknown,
  path: string,
  issues: string[],
): void {
  if (!isPlainObject(node)) return

  const component = typeof node.component === "string" ? node.component : null
  const props = isPlainObject(node.props) ? node.props : null

  if (component && CONTROLLED_INPUT_COMPONENTS.has(component) && props) {
    const hasValue = "value" in props
    const hasOnChange = "onChange" in props || "onValueChange" in props || "onCheckedChange" in props
    const hasReadOnly = props.readOnly === true || props.disabled === true
    if (hasValue && !hasOnChange && !hasReadOnly) {
      issues.push(
        `${path}: "${component}" has a "value" prop but no onChange/onValueChange/onCheckedChange handler. Add an onChange action or set readOnly/disabled to avoid a read-only field warning.`,
      )
    }
  }

  const children = node.children
  if (Array.isArray(children)) {
    children.forEach((child, index) => {
      collectControlledInputIssues(child, `${path}.children[${index}]`, issues)
    })
  } else if (children !== undefined && children !== null) {
    collectControlledInputIssues(children, `${path}.children`, issues)
  }
}

function collectUnknownDslOperatorIssues(
  value: unknown,
  path: string,
  issues: string[],
): void {
  if (Array.isArray(value)) {
    value.forEach((entry, index) => {
      collectUnknownDslOperatorIssues(entry, `${path}[${index}]`, issues)
    })
    return
  }

  if (!isPlainObject(value)) return

  const operatorKeys = Object.keys(value).filter((key) => key.startsWith("$"))
  for (const operatorKey of operatorKeys) {
    if (!ALLOWED_DSL_OPERATOR_KEYS.has(operatorKey)) {
      issues.push(
        `${path}.${operatorKey}: Unknown DSL operator. Use only supported DSL operators and function-call shapes from the engine docs/tools.`,
      )
    }
  }

  for (const [key, childValue] of Object.entries(value)) {
    collectUnknownDslOperatorIssues(childValue, `${path}.${key}`, issues)
  }
}

const STYLE_ALLOWED_BRACKETED_CLASSNAMES = new Set([
  // Common safe shadcn DSL exceptions used for segmented controls + compact cards.
  "p-[3px]",
  "rounded-[9px]",
])

function containsComponent(
  value: unknown,
  componentName: string,
): boolean {
  if (Array.isArray(value)) {
    return value.some((entry) => containsComponent(entry, componentName))
  }

  if (!isPlainObject(value)) return false

  if (value.component === componentName) return true

  for (const childValue of Object.values(value)) {
    if (containsComponent(childValue, componentName)) return true
  }

  return false
}

function collectStyleIssues(
  value: unknown,
  path: string,
  issues: string[],
): void {
  if (!isPlainObject(value)) return

  const component = typeof value.component === "string" ? value.component : null
  const props = isPlainObject(value.props) ? value.props : null

  if (component === "Select") {
    const children = Array.isArray(value.children) ? value.children : []
    const hasTrigger = containsComponent(children, "SelectTrigger")
    const hasContent = containsComponent(children, "SelectContent")
    if (!hasTrigger || !hasContent) {
      issues.push(
        `${path}: "Select" must include both "SelectTrigger" and "SelectContent" as descendants (shadcn popover select pattern).`,
      )
    }

    // Heuristic: ensure SelectValue exists somewhere inside the trigger subtree.
    // Missing SelectValue is a common cause of broken/inert selects in generated configs.
    const triggerNode = children.find(
      (child) => isPlainObject(child) && typeof child.component === "string" && child.component === "SelectTrigger",
    )
    if (triggerNode && !containsComponent(triggerNode.children, "SelectValue")) {
      issues.push(
        `${path}: "SelectTrigger" should include a "SelectValue" child so the Select value + a11y wiring works correctly.`,
      )
    }
  }

  if (
    component === "NativeSelect" ||
    component === "NativeSelectOption" ||
    component === "NativeSelectOptGroup"
  ) {
    issues.push(
      `${path}: Avoid "NativeSelect" (native <select>) for shadcn-style dropdown filters. Prefer the popover-based Select family (Select → SelectTrigger/SelectValue + SelectContent/SelectItem).`,
    )
  }

  const className = props && typeof props.className === "string" ? props.className : null
  if (className) {
    const bracketed = className.match(/\b(?:text|h|rounded)-\[[^\]]+\]/g) ?? []
    for (const token of bracketed) {
      if (STYLE_ALLOWED_BRACKETED_CLASSNAMES.has(token)) continue

      issues.push(
        `${path}.props.className: Avoid bracketed pixel sizing utilities like "${token}". Prefer semantic shadcn-friendly classes (text-xs/text-sm/text-base, h-8/h-9, rounded-md/rounded-lg). Allowed exceptions: ${Array.from(STYLE_ALLOWED_BRACKETED_CLASSNAMES).join(", ")}.`,
      )
    }

    const bracketedSpacing = className.match(/\b(?:m|mt|mb|ml|mr|mx|my|p|pt|pb|pl|pr|px|py|gap)-\[[^\]]+\]/g) ?? []
    for (const token of bracketedSpacing) {
      if (STYLE_ALLOWED_BRACKETED_CLASSNAMES.has(token)) continue
      issues.push(
        `${path}.props.className: Avoid bracketed spacing utilities like "${token}". Use semantic spacing classes (mt-2/mt-4/mt-6, pt-4/pt-6, gap-2/gap-3) instead. The only common safe exception is p-[3px] for segmented controls.`,
      )
    }

    if (/\bmt-auto\b/.test(className) || /\bpt-(?:72|80|96)\b/.test(className) || /\bpb-(?:72|80|96)\b/.test(className)) {
      issues.push(
        `${path}.props.className: Avoid using huge spacer utilities (mt-auto, pt-72/80/96, pb-72/80/96) to push footers/content. This is usually a layout bug (creates large empty space). Keep a tighter flow and place footers directly under content.`,
      )
    }

    if (component === "TableHead" || component === "TableCell") {
      if (/\btext-(?:lg|xl|2xl|3xl|4xl|5xl|6xl|7xl|8xl|9xl)\b/.test(className)) {
        issues.push(
          `${path}.props.className: Avoid oversized table typography (text-lg or larger) on "${component}". Shadcn tables are compact by default; prefer text-sm/text-base or omit text sizing entirely.`,
        )
      }
      if (/\bpy-(?:5|6|7|8|9|10|11|12)\b/.test(className)) {
        issues.push(
          `${path}.props.className: Avoid tall table rows (py-5 or larger) on "${component}". Prefer py-2/py-3 or let the Table defaults handle row height.`,
        )
      }
    }

    if (component === "Badge") {
      // Badge already has compact sizing (h-5 px-2 text-xs). Resizing it is a common drift cause.
      if (/\b(?:h-\d+|rounded-full|px-\d+|text-(?:xl|2xl|3xl|4xl)|text-\[[^\]]+\])\b/.test(className)) {
        issues.push(
          `${path}.props.className: Do not resize "Badge" (avoid h-*, rounded-full, px-*, text-* overrides). Use Badge variants (outline/secondary/destructive) and keep className minimal.`,
        )
      }
    }
  }

  const children = value.children
  if (Array.isArray(children)) {
    children.forEach((child, index) => {
      collectStyleIssues(child, `${path}.children[${index}]`, issues)
    })
  } else if (children !== undefined && children !== null) {
    collectStyleIssues(children, `${path}.children`, issues)
  }
}

export const definition = {
  type: "function" as const,
  name: "validate_config",
  description:
    "Validate the JSON content of a workspace file before or after writing. Returns a list of structural issues, or confirms the content is valid.",
  parameters: {
    type: "object",
    properties: {
      content: {
        type: "string",
        description: "The JSON string to validate.",
      },
      file_type: {
        type: "string",
        enum: [...FILE_TYPES],
        description: "The file type — determines which structural rules to apply.",
      },
    },
    required: ["content", "file_type"] as string[],
    additionalProperties: false,
  },
}

export function execute(
  _context: { chatId: string },
  args: { content: string; file_type: FileType },
): Record<string, unknown> {
  // 1. Parse check
  let parsed: unknown
  try {
    parsed = JSON.parse(args.content)
  } catch (e) {
    return { valid: false, issues: [`JSON parse error: ${(e as Error).message}`] }
  }

  if (typeof parsed !== "object" || parsed === null || Array.isArray(parsed)) {
    return { valid: false, issues: ["Root value must be a JSON object."] }
  }

  const obj = parsed as Record<string, unknown>
  const issues: string[] = []

  // 2. Type-specific structural checks
  switch (args.file_type) {
    case "initial_state": {
      // Bare key/value object — all values are valid, just must be an object (already checked above)
      break
    }

    case "theme_tokens": {
      if (!("light" in obj) || typeof obj.light !== "object" || obj.light === null) {
        issues.push('Missing required "light" key — theme tokens must have shape { light: {...}, dark?: {...} }.')
        break
      }
      for (const [k, v] of Object.entries(obj.light as Record<string, unknown>)) {
        if (typeof v !== "string") {
          issues.push(`light.${k} must be a string (HSL channel value), got ${typeof v}.`)
        }
      }
      if ("dark" in obj && obj.dark !== null && typeof obj.dark === "object") {
        for (const [k, v] of Object.entries(obj.dark as Record<string, unknown>)) {
          if (typeof v !== "string") {
            issues.push(`dark.${k} must be a string (HSL channel value), got ${typeof v}.`)
          }
        }
      }
      break
    }

    case "root_config":
    case "subconfig": {
      issues.push(
        ...validateDslComponentTree(parsed, {
          path: "root",
          knownComponents: Object.keys(defaultComponentRegistry),
        }).map((issue) => `${issue.path}: ${issue.message}`),
      )
      collectEventHandlerIssues(parsed, "root", issues)
      collectControlledInputIssues(parsed, "root", issues)
      collectUnknownDslOperatorIssues(parsed, "root", issues)
      collectStyleIssues(parsed, "root", issues)
      break
    }
  }

  if (issues.length > 0) return { valid: false, issues }
  return { valid: true, issues: [] }
}
