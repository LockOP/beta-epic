/**
 * DSL_RULES — the canonical Epic DSL specification.
 *
 * Contains only schema rules, expression/action syntax, patterns, and gotchas.
 * Does NOT include role framing or output-format instructions — those belong
 * in the consuming app's master prompt so each app can control them.
 */
export const DSL_RULES = `
═══════════════════════════════════════════════════════════
COMPONENT NODE SHAPE
═══════════════════════════════════════════════════════════

A ComponentNode has these optional fields:

{
  "component": "ComponentName",   // required — registered component key (usually PascalCase, but some native tags like "div" may also be registered)
  "props": { ... },               // static or expression values passed as props
  "children": [ ...nodes... ],    // child ComponentNodes, $map results, or $if expressions
  "selectors": { ... },           // derived values, computed once per state change (see Selectors)
  "env": { ... },                 // local variables available to this node and all descendants via var:
  "effects": [ ...effects... ]    // side-effect triggers (like useEffect), see Effects
}

IMPORTANT:
- "children" must always be an array when present.
- For a single text child, write "children": ["Hello"].
- Never write "children": "Hello" or "children": { ... }.
- Only use component names that actually exist in the registry.
- Do not invent generic names like "Text", "List", "ListItem", or "Stack" unless the registry explicitly contains them.
- If the UI is tabular (column headers + repeated rows), you MUST use the Table component family (TableHeader/TableBody/TableRow/TableHead/TableCell). Never simulate a table with div + grid-cols-* for headers/rows.
- Native HTML tags such as "div" may be registered as low-priority fallbacks. Use them mainly for simple wrappers/layout when a library component is not a better fit.
- Prefer styling and layout through className with Tailwind CSS v3 utilities.
- Do NOT invent style-like props such as maxWidth, minWidth, width, height, margin, padding, gap, display, alignItems, justifyContent, or flexDirection unless the component context explicitly confirms that prop exists.
- For sizing/spacing/layout constraints, prefer className values such as max-w-md, w-full, h-full, mx-auto, p-4, px-4, py-6, gap-4, flex, flex-col, grid, items-center, justify-between.

Prop values can be:
- A plain literal: "hello", 42, true, null
- An expression object: { "$ref": "..." }, { "$if": ... }, { "$fn": ... }, etc.
- An action array on event props: { "$action": [ ...actions... ] }

CLASSNAME / TAILWIND GUIDANCE:
- Prefer className for layout, spacing, sizing, alignment, borders, radius, colors, and responsive behavior.
- Put Tailwind utilities ONLY in className strings. Never put Tailwind utilities in prop keys.
  BAD:  { "props": { "w-[360px]": "w-[360px]" } }
  GOOD: { "props": { "className": "w-[360px]" } }
- Use Tailwind CSS v3 utility classes only.
- Good sizing/layout examples:
  w-full, h-full, min-h-screen, max-w-sm, max-w-md, max-w-lg, max-w-2xl, mx-auto
  flex, inline-flex, flex-col, flex-row, flex-wrap, grid, grid-cols-1, grid-cols-2
  items-start, items-center, items-stretch, justify-start, justify-center, justify-between
  gap-2, gap-4, gap-6, p-4, p-6, px-4, py-3, mt-4, mb-6
- Good surface examples:
  rounded-md, rounded-lg, border, border-border, bg-background, bg-card, text-foreground, text-muted-foreground, shadow-sm
- Good responsive examples:
  sm:px-4, md:px-6, lg:px-8, sm:grid-cols-1, md:grid-cols-2, lg:grid-cols-3, xl:grid-cols-4
  text-sm md:text-base lg:text-lg
  flex-col md:flex-row
- When centering a bounded form/card/page section, prefer patterns like:
  "className": "w-full max-w-md mx-auto p-4"
  "className": "flex min-h-screen items-center justify-center p-4"
- Avoid Tailwind v4-only syntax or directives.

═══════════════════════════════════════════════════════════
$ref NAMESPACES
═══════════════════════════════════════════════════════════

$ref reads a value at runtime. The prefix before ":" determines the source:

  { "$ref": "page.store:field" }         // page-local Redux state, seeded from initialState
  { "$ref": "page.store:user.name" }     // dot-path into nested state
  { "$ref": "selectors:derivedName" }    // computed selector (declared on this node or an ancestor)
  { "$ref": "var:iterVar.field" }        // $map/$filter/$reduce iteration variable
  { "$ref": "var:envVarName" }           // env block variable
  { "$ref": "event.value" }              // shorthand for first handler arg's .value (input onChange)
  { "$ref": "result" }                   // return value of async.call onSuccess
  { "$ref": "error.message" }            // error in async.call onError or type:"try" catch
  { "$ref": "url:query.tab" }            // query string param
  { "$ref": "url:pathname" }             // current pathname
  { "$ref": "redux:auth.user" }          // global Redux store path
  { "$ref": "env:API_URL" }              // window.env variable
  { "$ref": "local:key" }                // localStorage (JSON-parsed, dot-path supported)
  { "$ref": "session:key" }              // sessionStorage (JSON-parsed, dot-path supported)
  { "$ref": "refs:hookName.field" }      // registered React hook return value

IMPORTANT: Use { "$arg": 0 } (not $ref) to read raw handler arguments by index.
  { "$arg": 0 }                          // first handler argument as-is
  { "$arg": 0, "path": "currentTarget.value" } // dot-path into first argument

═══════════════════════════════════════════════════════════
EXPRESSIONS (OPERATORS)
═══════════════════════════════════════════════════════════

Expressions are synchronous and can be used anywhere a prop value is expected.
They CANNOT mutate state — use actions for mutations.

CONDITIONALS:
  { "$if": { "cond": <expr>, "then": <expr>, "else": <expr> } }
  { "$switch": { "on": <expr>, "cases": { "a": <val>, "b": <val> }, "default": <val> } }

LOGIC:
  { "$and": [ <expr>, <expr> ] }
  { "$or":  [ <expr>, <expr> ] }
  { "$not": <expr> }

COMPARISON:
  { "$eq":  { "a": <expr>, "b": <expr> } }
  { "$neq": { "a": <expr>, "b": <expr> } }
  { "$gt":  { "a": <expr>, "b": <expr> } }
  { "$gte": { "a": <expr>, "b": <expr> } }
  { "$lt":  { "a": <expr>, "b": <expr> } }
  { "$lte": { "a": <expr>, "b": <expr> } }

MATH:
  { "$add": [ <expr>, <expr> ] }
  { "$sub": [ <expr>, <expr> ] }
  { "$mul": [ <expr>, <expr> ] }
  { "$div": [ <expr>, <expr> ] }
  { "$mod": [ <expr>, <expr> ] }
  { "$abs": <expr> }
  { "$round": <expr> }
  { "$floor": <expr> }
  { "$ceil":  <expr> }

STRING:
  { "$concat": [ <expr>, <expr> ] }
  { "$trim": <expr> }
  { "$upper": <expr> }
  { "$lower": <expr> }
  { "$split": { "value": <expr>, "sep": <expr> } }
  { "$replace": { "value": <expr>, "from": <expr>, "to": <expr> } }
  { "$includes": { "value": <expr>, "search": <expr> } }
  { "$contains": { "value": <expr>, "search": <expr> } }
  { "$startsWith": { "value": <expr>, "prefix": <expr> } }
  { "$endsWith": { "value": <expr>, "suffix": <expr> } }
  { "$length": <expr> }
  { "$charAt": { "value": <expr>, "index": <expr> } }
  { "$slice": { "value": <expr>, "start": <expr>, "end": <expr> } }

TYPE COERCION:
  { "$string": <expr> }
  { "$number": <expr> }
  { "$bool": <expr> }
  { "$nullish": { "value": <expr>, "default": <expr> } }

TYPE CHECKS:
  { "$isEmpty": <expr> }
  { "$isNil": <expr> }
  { "$isNotNil": <expr> }
  { "$isArray": <expr> }

ARRAY:
  { "$map":    { "over": <expr>, "as": "var", "return": <node/expr> } }
  { "$filter": { "over": <expr>, "as": "var", "where": <expr> } }
  { "$reduce": { "over": <expr>, "as": "var", "acc": "accumName", "init": <val>, "return": <expr> } }
  { "$find":   { "over": <expr>, "as": "var", "where": <expr> } }
  { "$some":   { "over": <expr>, "as": "var", "where": <expr> } }
  { "$every":  { "over": <expr>, "as": "var", "where": <expr> } }
  { "$sort":   { "over": <expr>, "by": <expr>, "dir": "asc"|"desc" } }
  { "$slice":  { "over": <expr>, "start": <expr>, "end": <expr> } }
  { "$count":  <expr> }
  { "$first":  <expr> }
  { "$last":   <expr> }
  { "$flat":   <expr> }
  { "$uniq":   <expr> }
  { "$flatten": <expr> }
  { "$join":   { "arr": <expr>, "sep": <expr> } }
  { "$append": { "to": <expr>, "item": <expr> } }
  { "$prepend": { "to": <expr>, "item": <expr> } }

OBJECT:
  { "$get":   { "from": <expr>, "key": <expr> } }
  { "$merge": [ <expr>, <expr> ] }
  { "$pick":  { "from": <expr>, "keys": [ ... ] } }
  { "$omit":  { "from": <expr>, "keys": [ ... ] } }
  { "$keys":  <expr> }
  { "$values": <expr> }
  { "$entries": <expr> }

PIPE:
  { "$pipe": [ <expr1>, <expr2>, ... ] }
  { "$ref": "var:$$" }  // access pipe accumulator

FUNCTION CALL:
  { "$fn": "functionName", "args": [ <expr>, ... ] }
  // Built-in fns: now, today, formatDate, formatNumber, formatCurrency, cn

HTTP EXPRESSION (inside async.call only):
  { "$http": { "method": "GET"|"POST"|"PUT"|"PATCH"|"DELETE", "url": <expr>,
               "params": { ... }, "data": { ... }, "headers": { ... } } }

═══════════════════════════════════════════════════════════
SELECTORS (DERIVED STATE)
═══════════════════════════════════════════════════════════

Selectors are computed once per state change and cached. Declared on a node, available to that node and ALL its descendants — not to parents or siblings.

{
  "selectors": {
    "filteredItems": {
      "$filter": { "over": { "$ref": "page.store:items" }, "as": "i",
                   "where": { "$contains": { "value": { "$ref": "var:i.name" }, "search": { "$ref": "page.store:query" } } } }
    },
    "itemCount": { "$count": { "$ref": "selectors:filteredItems" } }
  }
}

A selector can reference another selector declared before it using { "$ref": "selectors:name" }.

═══════════════════════════════════════════════════════════
EFFECTS
═══════════════════════════════════════════════════════════

Effects run action sequences when deps change (like useEffect). Declared on any ComponentNode.

{
  "effects": [
    { "deps": [],                                                   "run": [ ...actions... ] },
    { "deps": [ { "$ref": "page.store:query" } ],                   "run": [ ...actions... ] },
    { "deps": [ { "$ref": "page.store:query" } ], "debounce": 350,  "run": [ ...actions... ] }
  ]
}

"debounce" (optional, milliseconds) — delays triggering the effect while the dep is still changing.
Use for search inputs, live filters, or any effect that would fire too frequently without it.

═══════════════════════════════════════════════════════════
ACTIONS
═══════════════════════════════════════════════════════════

Actions run in sequence inside "$action" arrays or effect "run" arrays. They CANNOT be used in expression positions.

STORE MUTATIONS:
  { "type": "page.store.update", "path": "field",     "payload": <expr> }
  { "type": "page.store.reset",  "path": "form" }
  { "type": "page.store.reset" }

NAVIGATION:
  { "type": "navigate",    "to": "/path" }
  { "type": "window.open", "url": <expr>, "target": "_blank" }

UI FEEDBACK:
  { "type": "snackbar", "message": "Saved!", "variant": "success"|"error"|"warning"|"info" }
  { "type": "console.log", "payload": <expr> }

STORAGE:
  { "type": "local.set",      "key": "myKey", "payload": <expr> }
  { "type": "local.remove",   "key": "myKey" }
  { "type": "session.set",    "key": "myKey", "payload": <expr> }
  { "type": "session.remove", "key": "myKey" }

ASYNC:
  {
    "type": "async.call",
    "call": { "$http": { "method": "GET", "url": "/api/data" } },
    "loading": "isFetching",
    "onSuccess": [ ...actions... ],
    "onError":   [ ...actions... ]
  }

GROUPING:
  { "type": "actions.group", "mode": "serial",   "actions": [ ...actions... ] }
  { "type": "actions.group", "mode": "parallel", "actions": [ ...actions... ] }

CONDITIONAL ACTION:
  { "$if": { "cond": <expr>, "then": [ ...actions... ], "else": [ ...actions... ] } }

TRY/CATCH (sync only):
  { "type": "try", "try": [ ...actions... ], "catch": [ ...actions... ], "finally": [ ...actions... ] }

REDUX:
  { "type": "redux.dispatch", "action": "sliceName/actionName", "payload": <expr> }

═══════════════════════════════════════════════════════════
$subConfig (REUSABLE FRAGMENTS)
═══════════════════════════════════════════════════════════

$subConfig is a pre-compilation substitution. Named fragments are registered in refConfigs and inlined before the engine runs.

BASIC:        { "$subConfig": "productCard" }
PARAMETERIZED:
  {
    "$subConfig": "productCard",
    "subConfigProps": {
      "title": { "$ref": "var:product.name" },
      "price": { "$ref": "var:product.price" }
    }
  }

Inside a fragment, access props via { "$ref": "var:propName" }.
Fragments CANNOT inline action arrays inside "$action": [...].

═══════════════════════════════════════════════════════════
THEME TOKENS
═══════════════════════════════════════════════════════════

Theme tokens are CSS custom properties injected by <GuiProvider theme={...} />.
Set at host-app level — do NOT reference them in DSL config via $ref.

Theme shape: { light: { ...tokens }, dark?: { ...tokens } }
- The provider merges these with built-in defaults.
- light and dark may both be partial override maps when the host app supports defaults.
- If dark is omitted, the built-in dark defaults are still used.

Available tokens (pass WITHOUT -- prefix):
  background, foreground, primary, primary-foreground,
  secondary, secondary-foreground, muted, muted-foreground,
  accent, accent-foreground, destructive, destructive-foreground,
  card, card-foreground, popover, popover-foreground,
  border, input, ring, radius, chart-1…chart-5

Colour values are HSL channel strings (no hsl() wrapper): "262 80% 50%"
Non-colour values: "0.5rem", "0.75rem", etc.

═══════════════════════════════════════════════════════════
INITIAL STATE RULES
═══════════════════════════════════════════════════════════

- Every field read via page.store: MUST be present in initialState
- Every field written via page.store.update MUST be present in initialState
- Use null for "no value yet", false for boolean flags, [] for arrays, "" for text fields
- Nest logically: { "form": { "name": "", "email": "" } }

═══════════════════════════════════════════════════════════
COMMON PATTERNS
═══════════════════════════════════════════════════════════

FETCH ON MOUNT:
  effects: [{ "deps": [], "run": [
    { "type": "page.store.update", "path": "loading", "payload": true },
    { "type": "async.call",
      "call": { "$http": { "method": "GET", "url": "/api/data" } },
      "onSuccess": [
        { "type": "page.store.update", "path": "data",    "payload": { "$ref": "result" } },
        { "type": "page.store.update", "path": "loading", "payload": false }
      ],
      "onError": [
        { "type": "page.store.update", "path": "error",   "payload": { "$ref": "error.message" } },
        { "type": "page.store.update", "path": "loading", "payload": false }
      ]
    }
  ]}]

CONTROLLED INPUT:
  { "component": "Input",
    "props": {
      "value": { "$ref": "page.store:query" },
      "onChange": { "$action": [
        { "type": "page.store.update", "path": "query", "payload": { "$arg": 0, "path": "currentTarget.value" } }
      ]}
    }
  }

TOGGLE:
  { "type": "page.store.update", "path": "open", "payload": { "$not": { "$ref": "page.store:open" } } }

═══════════════════════════════════════════════════════════
RULES AND GOTCHAS
═══════════════════════════════════════════════════════════

1. Expressions are synchronous — never use $http in expression position. Use async.call in effects or action arrays.
2. $ref "event.value" only works when the handler's first argument has a .value property. Use { "$arg": 0 } for raw args.
3. Selectors flow DOWNWARD only — a child's selector is not visible to its parent or siblings.
4. $subConfig cannot inline action arrays inside "$action": [...].
5. async.call handles errors via onError — NEVER wrap it in type:"try".
6. page.store.reset with no "path" resets the ENTIRE store. Use "path" to reset one field.
7. Action field is "payload" (not "value"): { "type": "page.store.update", "path": "x", "payload": ... }
8. $concat produces a string — don't use JS template literals.
9. Selectors can reference earlier selectors via selectors: — only ones declared above them in the same object.
10. env block variables are accessed via var: — same namespace as $map iteration variables.
11. All component names must be registered. Use get_all_components to see the full list, get_components_context (bulk) for props/variants.
12. Use get_all_fns to see available built-in functions, get_fn_context for signatures and examples.
13. Prefer className with Tailwind CSS v3 utilities over guessed layout props like maxWidth, padding, margin, gap, or height.
14. Build responsive layouts by default using Tailwind breakpoints for mobile, tablet, laptop, and desktop (typically base, md, lg, xl).
15. ALWAYS prefer registered library components over custom div/grid constructions:
    - Tabular data → Table / TableHeader / TableBody / TableHead / TableRow / TableCell. NEVER build a table using div + grid-cols or any custom grid layout.
      Column widths are controlled via className on TableHead: "w-12", "w-32", "w-48", "min-w-[200px]", "max-w-xs", etc.
      NEVER switch to div+grid just because you need fixed column widths — TableHead className handles this.
    - Badges/chips  → Badge component.
    - Action buttons → Button component with correct variant (default, outline, ghost, destructive, secondary).
    - Search field  → Input component (not a styled div).
    - Select/dropdown → Select / SelectTrigger / SelectContent / SelectItem.
    - Tabs          → Tabs / TabsList / TabsTrigger / TabsContent.
    - Cards/panels  → Card / CardHeader / CardContent / CardFooter.
    - Checkboxes    → Checkbox component.
    Using a registered component for its semantic purpose is ALWAYS preferred over reimplementing it with raw divs.
`.trim()
