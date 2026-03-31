import { UIComponentContext } from "../../components/ui/index.context"
import { defaultComponentRegistry } from "../../engine/defaults/component-registry"

const REACT_FORWARD_REF_TYPE = Symbol.for("react.forward_ref")
const REACT_MEMO_TYPE = Symbol.for("react.memo")

function isValidDslComponentValue(value: unknown): boolean {
  if (typeof value === "string") return true // native tag
  if (typeof value === "function") return true // function component
  if (typeof value === "object" && value !== null && "$$typeof" in value) {
    const t = (value as { $$typeof?: unknown }).$$typeof
    return t === REACT_FORWARD_REF_TYPE || t === REACT_MEMO_TYPE
  }
  return false
}

function shouldIncludeRegistryKey(key: string, value: unknown): boolean {
  // Exclude docs/context objects and hooks/utilities from the registry list.
  if (key.endsWith("Context")) return false
  if (key.startsWith("use")) return false
  if (key === "toast") return false
  return isValidDslComponentValue(value)
}

// Components that are important to call out explicitly so the model uses them
// instead of reimplementing with divs. Grouped by semantic purpose.
const COMPONENT_GROUPS: Record<string, string[]> = {
  "table (USE for any tabular/row-column data — NEVER use div+grid-cols)": [
    "Table", "TableHeader", "TableBody", "TableFooter", "TableHead", "TableRow", "TableCell", "TableCaption",
  ],
  "data-table (feature-rich table with sorting/filtering)": [
    "DataTable",
  ],
  "card (USE for panels, surfaces, and content blocks)": [
    "Card", "CardHeader", "CardTitle", "CardDescription", "CardContent", "CardFooter",
  ],
  "badge (USE for labels, tags, status chips — NEVER use custom spans)": [
    "Badge",
  ],
  "button": [
    "Button",
  ],
  "input/form": [
    "Input", "Textarea", "Checkbox", "Switch", "RadioGroup", "RadioGroupItem",
    "Select", "SelectTrigger", "SelectValue", "SelectContent", "SelectItem", "SelectGroup",
    "NativeSelect", "NativeSelectOption", "Label",
  ],
  "navigation/tabs": [
    "Tabs", "TabsList", "TabsTrigger", "TabsContent",
  ],
  "dialog/overlay": [
    "Dialog", "DialogTrigger", "DialogContent", "DialogHeader", "DialogTitle",
    "DialogDescription", "DialogFooter", "DialogClose",
    "Sheet", "SheetTrigger", "SheetContent", "SheetHeader", "SheetTitle",
    "SheetDescription", "SheetFooter", "SheetClose",
    "Popover", "PopoverTrigger", "PopoverContent",
    "Tooltip", "TooltipTrigger", "TooltipContent", "TooltipProvider",
    "DropdownMenu", "DropdownMenuTrigger", "DropdownMenuContent", "DropdownMenuItem",
    "DropdownMenuLabel", "DropdownMenuSeparator", "DropdownMenuCheckboxItem", "DropdownMenuRadioItem",
  ],
  "alert/feedback": [
    "Alert", "AlertTitle", "AlertDescription",
  ],
  "typography": [
    "H1", "H2", "H3", "H4", "P", "Lead", "Large", "Small", "Muted", "InlineCode", "Blockquote",
  ],
  "layout": [
    "Separator", "ScrollArea", "Skeleton",
  ],
}

export const definition = {
  type: "function" as const,
  name: "get_all_components",
  description:
    "Get all registered DSL component keys from the default component registry (UI barrel + icons), grouped by semantic purpose.",
  parameters: {
    type: "object",
    properties: {},
    required: [] as string[],
    additionalProperties: false,
  },
}

export function execute(): Record<string, unknown> {
  // Authoritative source of what the DSL can render is the component registry.
  // UIComponentContext is best-effort documentation and may be incomplete (RSC boundary).
  const registryKeys = Object.keys(defaultComponentRegistry).filter((key) =>
    shouldIncludeRegistryKey(key, defaultComponentRegistry[key]),
  )
  const allKeys = new Set(registryKeys)

  // Mark which components in our groups actually exist in the registry
  const groups: Record<string, string[]> = {}
  const groupedKeys = new Set<string>()
  for (const [group, keys] of Object.entries(COMPONENT_GROUPS)) {
    const available = keys.filter((k) => allKeys.has(k))
    if (available.length > 0) {
      groups[group] = available
      available.forEach((k) => groupedKeys.add(k))
    }
  }

  // Remaining components not in any group
  const other = [...allKeys].filter((k) => !groupedKeys.has(k)).sort()

  return {
    instruction: "Always prefer registered components for their semantic purpose. Check the group labels — they tell you WHEN to use each group. Use get_components_context (bulk) to get props/variants for any component before using it.",
    groups,
    other,
    notes: [
      `This list is derived from the actual component registry (authoritative).`,
      `Some components may not have context docs (get_components_context) due to server/client module boundaries; if a key appears here, it is registered and can be used.`,
      `Native HTML tags may appear (div/span/section/main/form). Prefer using only "div" for layout wrappers unless the user explicitly asks for more semantic tags.`,
    ],
    // Pre-built examples — use these directly, no get_components_context call needed
    table_example: {
      note: "ALWAYS use this pattern for tabular data. NEVER use div+grid to simulate a table. Column widths go on TableHead via className.",
      json: {
        component: "Table",
        children: [
          {
            component: "TableHeader",
            children: [
              {
                component: "TableRow",
                children: [
                  { component: "TableHead", props: { className: "w-12" }, children: ["#"] },
                  { component: "TableHead", children: ["Name"] },
                  { component: "TableHead", props: { className: "w-32" }, children: ["Status"] },
                  { component: "TableHead", props: { className: "w-28 text-right" }, children: ["Amount"] },
                ],
              },
            ],
          },
          {
            component: "TableBody",
            children: [
              {
                "$map": {
                  over: { "$ref": "selectors:paginatedRows" },
                  as: "row",
                  return: {
                    component: "TableRow",
                    children: [
                      { component: "TableCell", props: { className: "w-12 text-muted-foreground" }, children: [{ "$ref": "var:row.id" }] },
                      { component: "TableCell", children: [{ "$ref": "var:row.name" }] },
                      { component: "TableCell", props: { className: "w-32" }, children: [{ component: "Badge", props: { variant: { "$ref": "var:row.statusVariant" } }, children: [{ "$ref": "var:row.status" }] }] },
                      { component: "TableCell", props: { className: "w-28 text-right" }, children: [{ "$ref": "var:row.amount" }] },
                    ],
                  },
                },
              },
            ],
          },
        ],
      },
    },
  }
}
