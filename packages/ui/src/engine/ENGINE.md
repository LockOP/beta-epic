# Gen UI Engine — Complete Reference

> **v3 Edition** · Supersedes GEN_UI_ENGINE_COMPLETE_REFERENCE.md
> Reflects decisions made through beta-epic implementation.
> Key change from v2: **namespace-style built-in exposure is dropped** — all data transformation lives in expression operators.

---

## Table of Contents

1. [What Is a Gen UI Engine?](#1-what-is-a-gen-ui-engine)
2. [Core Architecture](#2-core-architecture)
3. [ComponentNode — The Atomic Unit](#3-componentnode--the-atomic-unit)
4. [Expression System](#4-expression-system)
5. [Action System](#5-action-system)
6. [State Model](#6-state-model)
7. [Effects](#7-effects)
8. [Theme System](#8-theme-system)
9. [Registry System](#9-registry-system)
10. [AI Integration](#10-ai-integration)
11. [Tool Calling](#11-tool-calling)
12. [Model Capabilities](#12-model-capabilities)
13. [Structured Output & Streaming](#13-structured-output--streaming)
14. [Patch System](#14-patch-system)
15. [Error Recovery](#15-error-recovery)
16. [Performance Optimisations](#16-performance-optimisations)
17. [v1 → v2 → v3 Evolution](#17-v1--v2--v3-evolution)
18. [Config Examples](#18-config-examples)

---

## 1. What Is a Gen UI Engine?

A **Gen UI Engine** is a system where an AI model produces a **structured JSON config** that a rendering engine turns into a live, interactive React application — without any custom code per screen.

```
User prompt
    │
    ▼
AI model  ──►  JSON config  ──►  Engine (compile + render)  ──►  React UI
    │                │
    │         stored in DB /
    │         streamed to client
    │
    └──► tool calls (context helpers, API data, user info)
```

The AI never writes React, never writes TypeScript. It writes a **declarative config** using a domain-specific language (DSL). The engine owns all rendering, state, effects, and event handling.

### Why this matters

- **Security**: no arbitrary code execution; only registered operations run
- **Portability**: configs are plain JSON — versionable, diffable, patchable
- **Reliability**: the compile-then-render pipeline catches errors before they reach the DOM
- **AI-friendliness**: structured JSON is easier to generate and validate than code

---

## 2. Core Architecture

### Compile-then-render pipeline

```
JSON config
    │
    ├── validate (schema + registry checks)
    │
    ├── compile
    │     ├── expressions  →  bound closures (read-only, sync)
    │     ├── actions      →  event handlers (can be async)
    │     └── effects      →  lifecycle descriptors
    │
    └── render
          └── React tree from compiled nodes
                └── re-renders on store changes only
```

**Compile** and **render** are separate phases. Compilation reads the config once and produces stable closures. Rendering re-runs only when store state changes. This prevents O(n) re-compilation on every render.

### Data flow (unidirectional)

```
Store state
    │
    ▼
Compiled expressions  ──►  props / children / conditions
    │
    ▼
React component tree
    │
    ▼
User events  ──►  compiled actions  ──►  store.update / async / side-effects
                                              │
                                              └──► triggers re-render
```

---

## 3. ComponentNode — The Atomic Unit

Every UI element is a `ComponentNode`:

```ts
interface ComponentNode {
  component: string                      // registered component name
  props?: Record<string, Expression>    // static or dynamic props
  children?: ChildNode[]                // array of nodes or expression items
  effects?: EffectDescriptor[]          // lifecycle hooks
  env?: Record<string, Expression>      // local variables scoped to this subtree
  selectors?: Record<string, Expression>// derived values scoped to this subtree
}
```

### component

Maps to a registered React component. Unknown names are DSL validation errors and should be caught before rendering.

```json
{ "component": "Button", "children": ["Click me"] }
```

### props

Each prop value is an `Expression` — either a literal or a DSL operator.

```json
{
  "component": "Button",
  "props": {
    "disabled": { "$ref": "page.store:isSaving" },
    "variant": { "$if": { "cond": { "$ref": "page.store:isError" }, "then": "destructive", "else": "default" } }
  },
  "children": ["Save"]
}
```

### children

An array of `ChildNode` items. Each item is either a static `ComponentNode`, a `$if`/`$switch` expression, or a `$map` that expands to a list.

```json
{
  "component": "ItemGroup",
  "children": [
    {
      "$map": {
        "over": { "$ref": "page.store:items" },
        "as": "item",
        "return": {
          "component": "Item",
          "children": [
            {
              "component": "ItemContent",
              "children": [
                {
                  "component": "ItemTitle",
                  "children": [{ "$ref": "var:item.name" }]
                }
              ]
            }
          ]
        }
      }
    }
  ]
}
```

### env

Declares local variables available within this node's subtree via `var:`. Values are expressions resolved at render time.

```json
{
  "component": "Card",
  "env": {
    "fullName": {
      "$concat": [{ "$ref": "page.store:user.first" }, " ", { "$ref": "page.store:user.last" }]
    }
  },
  "children": [
    { "component": "P", "children": [{ "$ref": "var:fullName" }] }
  ]
}
```

---

## 4. Expression System

Expressions are **pure, synchronous, and deterministic**. They can only read from state — never mutate it. Async work belongs in actions.

### $ref — read a value

```json
{ "$ref": "page.store:count" }
{ "$ref": "var:item" }
{ "$ref": "selectors:filteredItems" }
{ "$ref": "url:query.tab" }
{ "$ref": "local:theme" }
```

Namespaces:

| Prefix | Source |
|--------|--------|
| `page.store:` | page-local Redux slice |
| `var:` | iteration vars (`as:`), `env` block vars, `event`, `result`, `error`, `$$` |
| `selectors:` | derived values declared on this node or an ancestor |
| `redux:` | global external store (read-only via `globalStore` prop) |
| `url:` | current URL fields (`query`, `pathname`, `href`, etc.) |
| `refs:` | values returned by registered React hooks |
| `local:` | `localStorage` (JSON-parsed, dot-path supported) |
| `session:` | `sessionStorage` (JSON-parsed, dot-path supported) |
| `env:` | `window.env` — client-side environment variables |

Theme tokens are **not** readable via `$ref`. They are CSS custom properties injected by `<GuiProvider theme={...} />`.

### $if — conditional

```json
{
  "$if": {
    "cond": { "$ref": "page.store:isLoggedIn" },
    "then": "Welcome back!",
    "else": "Please log in."
  }
}
```

### $switch — multi-branch

```json
{
  "$switch": {
    "on": { "$ref": "page.store:status" },
    "cases": {
      "loading": { "component": "Spinner" },
      "error": { "component": "ErrorBanner" },
      "success": { "component": "DataTable" }
    },
    "default": { "component": "Empty" }
  }
}
```

### $pipe — left-to-right chaining

Passes the result of each step as the implicit input to the next. The bare string `"$$"` in any step resolves to the accumulated value.

```json
{
  "$pipe": [
    { "$ref": "page.store:searchQuery" },
    { "$trim": "$$" },
    { "$lower": "$$" },
    { "$split": { "value": "$$", "sep": " " } }
  ]
}
```

### Comparison operators

`$eq`, `$neq`, `$gt`, `$gte`, `$lt`, `$lte` — all take `{ "a": expr, "b": expr }`.
`$in` — `{ "value": expr, "array": expr }`.
`$has` — `{ "obj": expr, "key": expr }`.

```json
{ "$gt": { "a": { "$ref": "page.store:count" }, "b": 0 } }
```

### Logic operators

```json
{ "$and": [expr1, expr2, expr3] }
{ "$or":  [expr1, expr2] }
{ "$not": expr }
```

### Math operators

```json
{ "$add": [{ "$ref": "page.store:price" }, { "$ref": "page.store:tax" }] }
{ "$sub": [a, b] }
{ "$mul": [a, b] }
{ "$div": [a, b] }
{ "$mod": [a, b] }
{ "$abs": value }
{ "$floor": value }
{ "$ceil": value }
{ "$round": value }
{ "$min": [a, b] }
{ "$max": [a, b] }
{ "$clamp": { "value": v, "min": lo, "max": hi } }
{ "$pow": { "base": b, "exp": e } }
```

### String operators

```json
{ "$trim": value }
{ "$lower": value }
{ "$upper": value }
{ "$padStart": { "value": v, "len": 6, "char": "0" } }
{ "$padEnd": { "value": v, "len": 12, "char": "." } }
{ "$slice": { "value": v, "start": 0, "end": 60 } }
{ "$replace": { "value": v, "from": "foo", "to": "bar" } }
{ "$split": { "value": v, "sep": "," } }
{ "$join": { "parts": [a, " ", b] } }
{ "$includes": { "value": v, "search": "query" } }
{ "$startsWith": { "value": v, "prefix": "http" } }
{ "$endsWith": { "value": v, "suffix": ".pdf" } }
{ "$length": value }
{ "$concat": [str1, str2, str3] }
```

### Array operators

```json
{ "$map": { "over": arrayExpr, "as": "item", "return": nodeOrExpr } }
{ "$filter": { "over": arrayExpr, "as": "item", "where": boolExpr } }
{ "$reduce": { "over": arrayExpr, "as": "item", "acc": "total", "init": 0, "return": sumExpr } }
{ "$sort": { "over": arrayExpr, "by": keyExpr, "dir": "asc" } }
{ "$find": { "over": arrayExpr, "as": "item", "where": boolExpr } }
{ "$some": { "over": arrayExpr, "as": "item", "where": boolExpr } }
{ "$every": { "over": arrayExpr, "as": "item", "where": boolExpr } }
{ "$count": arrayExpr }
{ "$first": arrayExpr }
{ "$last": arrayExpr }
{ "$slice": { "over": arrayExpr, "start": 0, "end": 10 } }
{ "$flat": arrayExpr }
{ "$uniq": arrayExpr }
{ "$append": { "to": arrayExpr, "item": itemExpr } }
{ "$prepend": { "to": arrayExpr, "item": itemExpr } }
```

### Object operators

```json
{ "$get": { "from": objExpr, "key": "field" } }
{ "$keys": objExpr }
{ "$values": objExpr }
{ "$entries": objExpr }
{ "$merge": [obj1, obj2] }
{ "$pick": { "from": objExpr, "keys": ["a", "b"] } }
{ "$omit": { "from": objExpr, "keys": ["secret"] } }
```

### Type / coercion operators

```json
{ "$string": value }
{ "$number": value }
{ "$bool": value }
{ "$nullish": { "value": v, "default": fallback } }
```

### Variable access inside array operators

Array operators (`$map`, `$filter`, `$reduce`, `$sort`, `$find`, `$some`, `$every`) bind the current element via the `as:` name, accessible inside via `var:<name>`.

```json
{
  "$filter": {
    "over": { "$ref": "page.store:products" },
    "as": "p",
    "where": {
      "$and": [
        { "$gte": { "a": { "$ref": "var:p.price" }, "b": 0 } },
        { "$includes": { "value": { "$ref": "var:p.name" }, "search": { "$ref": "page.store:query" } } }
      ]
    }
  }
}
```

`$sort` binds the current element as `var:item` regardless of `as:`:

```json
{ "$sort": { "over": arrayExpr, "by": { "$ref": "var:item.price" }, "dir": "asc" } }
```

### No namespace-style built-ins

> **v3 decision**: The old approach of auto-exposing JS built-ins under their native namespace (`String.trim`, `Array.filter`, `Math.floor`) is dropped. All data transformation is expressed through the operators above. This keeps the DSL self-contained, auditable, and independent of JS runtime semantics.

If an operation cannot be expressed with the operators above, it belongs in a **registered function** exposed through the registry — not as a raw JS namespace call.

---

## 5. Action System

Actions are **imperative sequences** triggered by events. Unlike expressions, actions can:
- Mutate store state
- Make async HTTP calls
- Trigger navigation, modals, notifications
- Call registered functions

Actions are compiled to event handlers during the compile phase.

### $action — the root wrapper

Every event handler value in `props` must be wrapped in `$action`. The array is executed sequentially.

```json
{
  "$action": [
    { "type": "page.store.update", "path": "count", "payload": { "$add": [{ "$ref": "page.store:count" }, 1] } }
  ]
}
```

### Store mutations

```json
{ "type": "page.store.update", "path": "user.name", "payload": "Alice" }
{ "type": "page.store.reset" }
{ "type": "page.store.reset", "path": "form" }
```

`payload` is an expression — literals, `$ref`, `$if`, `$merge`, etc. all work.

### Async calls — registered function

```json
{
  "type": "async.call",
  "call": { "$fn": "fetchUser", "args": [{ "$ref": "page.store:userId" }] },
  "onSuccess": [
    { "type": "page.store.update", "path": "user", "payload": { "$ref": "result" } }
  ],
  "onError": [
    { "type": "page.store.update", "path": "error", "payload": { "$ref": "error.message" } }
  ]
}
```

### Async calls — inline HTTP

```json
{
  "type": "async.call",
  "call": {
    "$http": {
      "method": "POST",
      "url": "/api/submit",
      "data": { "$ref": "page.store:form" },
      "headers": { "Content-Type": "application/json" }
    }
  },
  "loading": "submitting",
  "onSuccess": [
    { "type": "page.store.update", "path": "submitted", "payload": true }
  ],
  "onError": [
    { "type": "snackbar", "message": { "$ref": "error.message" }, "variant": "error" }
  ]
}
```

`$http` is an engine-built-in. `loading` is a shorthand: sets the named store path to `true` before the call and `false` after (success or error). `async.call` catches its own errors internally via `onError` — do not wrap it in `type: "try"` expecting the outer catch to fire.

### try / catch / finally — for synchronous action errors

`type: "try"` wraps synchronous actions that may throw (e.g. `redux.dispatch` with a throwing reducer). It does **not** catch `async.call` errors.

```json
{
  "type": "try",
  "try": [
    { "type": "redux.dispatch", "action": "cart/checkout" }
  ],
  "catch": [
    { "type": "snackbar", "message": { "$ref": "error.message" }, "variant": "error" }
  ],
  "finally": [
    { "type": "page.store.update", "path": "submitting", "payload": false }
  ]
}
```

### Navigation and UI side-effects

```json
{ "type": "navigate",    "to": "/dashboard" }
{ "type": "navigate",    "to": { "$ref": "page.store:redirectUrl" } }
{ "type": "window.open", "url": "https://example.com", "target": "_blank" }
{ "type": "snackbar",    "message": "Saved!", "variant": "success" }
{ "type": "console.log", "payload": { "$ref": "page.store:debug" } }
```

### Parallel async — actions.group

```json
{
  "type": "actions.group",
  "mode": "parallel",
  "actions": [
    { "type": "async.call", "call": { "$fn": "fetchUser",   "args": [{ "$ref": "page.store:userId" }] }, "onSuccess": [{ "type": "page.store.update", "path": "user",   "payload": { "$ref": "result" } }] },
    { "type": "async.call", "call": { "$fn": "fetchOrders", "args": [{ "$ref": "page.store:userId" }] }, "onSuccess": [{ "type": "page.store.update", "path": "orders", "payload": { "$ref": "result" } }] }
  ]
}
```

`mode: "serial"` (default) runs sequentially; `mode: "parallel"` runs all concurrently.

### redux.dispatch — requires host-app wiring

```json
{ "type": "redux.dispatch", "action": "cart/clear" }
{ "type": "redux.dispatch", "action": "cart/addItem", "payload": { "$ref": "page.store:selectedProduct" } }
```

`redux.dispatch` is a **silent no-op** unless the host app injects `reduxDispatch` into the runtime context. There is no built-in wiring — contact the host app team to enable this.

---

## 6. State Model

### Page store

A single Redux + Immer store per rendered page. Initialized from the config's `initialState` field.

```json
{
  "initialState": {
    "count": 0,
    "user": null,
    "items": [],
    "filters": { "query": "", "status": "all" }
  }
}
```

### Selectors

Derived values declared on a `ComponentNode` via `selectors`. They are computed once per render cycle and accessible via `selectors:name` in any descendant expression.

```json
{
  "component": "ItemGroup",
  "selectors": {
    "filteredItems": {
      "$filter": {
        "over": { "$ref": "page.store:items" },
        "as": "item",
        "where": { "$includes": { "value": { "$ref": "var:item.name" }, "search": { "$ref": "page.store:filters.query" } } }
      }
    },
    "itemCount": { "$count": { "$ref": "selectors:filteredItems" } }
  }
}
```

Selectors are **scoped to the node they are declared on and all its descendants** — they are NOT accessible outside that subtree. Reference them via `selectors:name`.

---

## 7. Effects

Effects replace imperative `useEffect` calls. They are declared on any `ComponentNode` and compiled to stable React hooks.

```json
{
  "component": "DataTable",
  "effects": [
    {
      "deps": [],
      "run": [
        {
          "type": "async.call",
          "call": { "$fn": "fetchItems", "args": [] },
          "onSuccess": [
            { "type": "page.store.update", "path": "items", "payload": { "$ref": "result" } }
          ]
        }
      ]
    },
    {
      "deps": [{ "$ref": "page.store:filters.query" }],
      "debounce": 300,
      "run": [
        {
          "$if": {
            "cond": { "$gt": { "a": { "$length": { "$ref": "page.store:filters.query" } }, "b": 2 } },
            "then": [
              {
                "type": "async.call",
                "call": { "$fn": "searchItems", "args": [{ "$ref": "page.store:filters.query" }] },
                "onSuccess": [
                  { "type": "page.store.update", "path": "results", "payload": { "$ref": "result" } }
                ]
              }
            ]
          }
        }
      ]
    },
    {
      "deps": [{ "$ref": "page.store:roomId" }],
      "run": [
        { "type": "async.call", "call": { "$fn": "subscribeToRoom", "args": [{ "$ref": "page.store:roomId" }] } }
      ],
      "cleanup": [
        { "type": "async.call", "call": { "$fn": "unsubscribeFromRoom", "args": [{ "$ref": "page.store:roomId" }] } }
      ]
    }
  ]
}
```

### Rules

- `deps: []` — runs once on mount (equivalent to `useEffect(() => ..., [])`)
- `deps: [expr, ...]` — runs on mount and whenever any dep expression value changes
- `debounce` — applies only to re-runs, not the initial mount
- `run` — an action sequence, compiled the same as any event handler
- `cleanup` — runs before next effect or on unmount
- No `prerequisite` field — use `$if` inside `run` to skip conditionally

---

## 8. Theme System

Themes are **CSS custom properties** (shadcn-compatible) injected as inline style on the genXui root element. Pass them via the `theme` prop on `<GuiProvider>`.

### Passing a theme

Keys are **without** the `--` prefix — GuiProvider prepends it automatically. Values are HSL channel strings (no `hsl()` wrapper).

```tsx
<GuiProvider
  theme={{
    'primary':            '262 80% 50%',
    'primary-foreground': '0 0% 100%',
    'radius':             '0.75rem',
  }}
>
  {children}
</GuiProvider>
```

This injects `--primary: 262 80% 50%`, `--primary-foreground: 0 0% 100%`, etc. on the wrapper element.

### Standard shadcn tokens

`background`, `foreground`, `primary`, `primary-foreground`, `secondary`, `secondary-foreground`, `muted`, `muted-foreground`, `accent`, `accent-foreground`, `destructive`, `destructive-foreground`, `card`, `card-foreground`, `popover`, `popover-foreground`, `border`, `input`, `ring`, `radius`, `chart-1` … `chart-5`.

### Theme tokens in the DSL

Theme tokens are **not readable via `$ref`**. There is no `theme:*` namespace. Components consume tokens automatically via Tailwind classes (`bg-primary`, `text-muted-foreground`, etc.) — no DSL wiring needed.

### Dark mode

Dark mode is a host-app concern. The canonical pattern: store the preference in the page store, register a function that toggles `document.documentElement.classList`, call it from an effect.

```tsx
<GuiProvider
  functions={{
    applyColorScheme: (scheme: string) => {
      document.documentElement.classList.toggle('dark', scheme === 'dark')
    }
  }}
>
```

See [15-theme.md](./examples/15-theme.md) for a complete example.

---

## 9. Registry System

The registry is the **security boundary** between DSL and runtime. Nothing runs unless registered.

### Component registry

Pass custom components via `GuiProvider`:

```tsx
<GuiProvider
  components={{
    Button:    ButtonComponent,
    DataTable: DataTableComponent,
    Form:      FormComponent,
  }}
>
```

DSL configs can only reference registered component names. Unregistered names render nothing.

### Function registry

Sync and async functions callable from `$fn` expressions and `async.call` actions:

```tsx
<GuiProvider
  functions={{
    // Sync — usable in expressions via { "$fn": "formatCurrency", "args": [...] }
    formatCurrency: (amount: number, currency: string) =>
      amount.toLocaleString('en-US', { style: 'currency', currency }),

    // Async — usable in actions via { "type": "async.call", "call": { "$fn": "fetchUser", ... } }
    fetchUser: async (id: string) => {
      const res = await fetch(`/api/users/${id}`)
      return res.json()
    },
  }}
>
```

### Hook registry

React hooks whose return values are injected into the DSL context as `refs:hookName.*`:

```tsx
<GuiProvider
  hooks={{
    currentUser: () => useAuth().user,
    windowSize:  () => useWindowSize(),
  }}
>
```

```json
{ "$ref": "refs:currentUser.email" }
{ "$ref": "refs:windowSize.width" }
```

---

## 10. AI Integration

### System prompt structure

```
1. Engine DSL reference (component catalogue, expression operators, action types)
2. Output schema (JSON schema for the config format)
3. Task-specific instructions (page purpose, available data, design constraints)
4. Few-shot examples (minimal, relevant to the task)
```

The DSL reference and output schema are injected via **prompt caching** — they rarely change and are expensive to tokenise repeatedly.

### MASTER_PROMPT

The engine ships a `MASTER_PROMPT` constant that encodes:
- All expression operators and their signatures
- All action types and their parameters
- Registry constraints (what's allowed vs what throws)
- Output format rules (valid JSON, no trailing commas, no comments)
- Common patterns (pagination, search, form submit)

This is prepended to every generation request.

### Output schema (structured output)

For models that support it, the output is constrained to a JSON schema matching the `ComponentConfig` type. This eliminates the need for JSON extraction heuristics on well-formed responses.

```ts
const OUTPUT_SCHEMA: ResponseFormatTextJSONSchemaConfig = {
  type: "json_schema",
  name: "component_config",
  schema: ComponentConfigSchema,
  strict: true,
}
```

### Generation modes

**Single-shot** (simple UIs):

```
prompt → one API call → full config
```

**Multi-step** (complex UIs):

```
Step 1: Layout skeleton + initialState
Step 2: Section fill (one call per section or batched)
Step 3: Interactions + effects[]
```

Canvas updates after each step. Streaming applies within each step.

---

## 11. Tool Calling

Tools give the AI access to **real-time context** it can't have in its weights: user identity, location, current data, luck scores, etc.

### Tool file structure

Each tool lives in its own file, exporting both its OpenAI definition and its executor:

```
packages/ui/src/context-helpers/tools/
  tool.get-user-info.ts
  tool.get-user-location.ts
  tool.calculate-personal-luck.ts
  definitions.ts   ← aggregates all definitions → TOOL_DEFINITIONS[]
  executor.ts      ← aggregates all executors → executeTool() + ToolInteraction type
  index.ts         ← re-exports both
```

### Tool file anatomy

```ts
// tool.get-user-info.ts
export const definition = {
  type: "function" as const,
  name: "get_user_info",
  description: "Returns the authenticated user's name, age, and date of birth.",
  parameters: {
    type: "object",
    properties: {},
    required: [],
    additionalProperties: false,
  },
}

export function execute(): Record<string, unknown> {
  const USER_DOB = "1991-07-15"
  const today = new Date()
  const dob = new Date(USER_DOB)
  let age = today.getFullYear() - dob.getFullYear()
  const beforeBirthday =
    today.getMonth() < dob.getMonth() ||
    (today.getMonth() === dob.getMonth() && today.getDate() < dob.getDate())
  if (beforeBirthday) age--
  return { name: "Arul", age, dateOfBirth: USER_DOB }
}
```

### Aggregating tools

```ts
// definitions.ts
import { definition as getUserInfo } from "./tool.get-user-info"
import { definition as getUserLocation } from "./tool.get-user-location"
import { definition as calculatePersonalLuck } from "./tool.calculate-personal-luck"
export const TOOL_DEFINITIONS = [getUserInfo, getUserLocation, calculatePersonalLuck]

// executor.ts
export interface ToolInteraction {
  callId: string
  name: string
  arguments: Record<string, unknown>
  output: Record<string, unknown> | null  // null during streaming (pending)
}

export function executeTool(name: string, args: Record<string, unknown>): Record<string, unknown> {
  switch (name) {
    case "get_user_info":           return executeGetUserInfo()
    case "get_user_location":       return executeGetUserLocation()
    case "calculate_personal_luck": return executeCalculatePersonalLuck(args.age as number)
    default: return { error: `Unknown tool: ${name}` }
  }
}
```

### Tool calling loop (backend)

```ts
const MAX_TOOL_ROUNDS = 6

for (let round = 0; round < MAX_TOOL_ROUNDS; round++) {
  const response = await openai.responses.create({ ...baseParams, input: inputList })
  const toolCalls = response.output.filter((item) => item.type === "function_call")

  if (toolCalls.length === 0) {
    // No more tools needed — this is the final response
    finalContent = caps.structuredOutput
      ? response.output_text
      : JSON.stringify({ message: response.output_text })
    break
  }

  // Accumulate response output for next round
  inputList.push(...response.output)

  for (const toolCall of toolCalls) {
    const args = JSON.parse(toolCall.arguments)
    emit({ type: "tool_call", callId: toolCall.call_id, name: toolCall.name, arguments: args })

    const output = executeTool(toolCall.name, args)
    emit({ type: "tool_output", callId: toolCall.call_id, output })

    inputList.push({
      type: "function_call_output",
      call_id: toolCall.call_id,
      output: JSON.stringify(output),
    })
  }
}
```

`inputList` grows with each round — the final response has full context of all tool interactions.

### UI representation

Tool calls are shown inline in the message thread, in the order they occurred:

```
┌─────────────────────────────────────────┐
│ 🔧 get_user_info                        │
│  Args          │ Output                 │
│  (none)        │ { name: "Arul",        │
│                │   age: 34,             │
│                │   dateOfBirth: "..." } │
└─────────────────────────────────────────┘

┌─────────────────────────────────────────┐
│ 🔧 calculate_personal_luck              │
│  Args          │ Output                 │
│  { age: 34 }   │ { score: 7,            │
│                │   description: "..." } │
└─────────────────────────────────────────┘

[Final assistant message]
```

While the output is pending (streamed incrementally), the Output column shows a bouncing dots indicator (`output: null`).

---

## 12. Model Capabilities

Different models support different API features. The engine tracks this explicitly rather than relying on runtime errors.

### Capability map

```ts
interface ModelCaps { reasoning: boolean; structuredOutput: boolean }

const MODEL_CAPS: Record<string, ModelCaps> = {
  "gpt-5.4":      { reasoning: false, structuredOutput: true },
  "gpt-5.2":      { reasoning: false, structuredOutput: true },
  "gpt-5.1":      { reasoning: false, structuredOutput: true },
  "gpt-5":        { reasoning: false, structuredOutput: true },
  "gpt-5-mini":   { reasoning: false, structuredOutput: true },
  "gpt-4.1":      { reasoning: false, structuredOutput: true },
  "gpt-4.1-mini": { reasoning: false, structuredOutput: true },
  "gpt-4o":       { reasoning: false, structuredOutput: true },
  "gpt-4o-mini":  { reasoning: false, structuredOutput: true },
  "o3":           { reasoning: true,  structuredOutput: true },
  "o4-mini":      { reasoning: true,  structuredOutput: true },
}

const DEFAULT_CAPS: ModelCaps = { reasoning: false, structuredOutput: false }
```

This map lives in **both** frontend and backend — frontend uses it to show/disable UI controls; backend uses it to gate API parameters.

### Why this matters

Sending `reasoning: { effort }` to `gpt-4o` causes an API error. If that error is silently swallowed in a finally block, the response saves as empty string to the database and the UI shows a loader forever. The capability map prevents this entirely.

### Default model

**`gpt-4.1-mini`** — cheapest model with 1M+ context support. Good default for most generation tasks.

### Backend parameter gating

```ts
const caps = MODEL_CAPS[chatModel] ?? DEFAULT_CAPS

const baseParams = { model: chatModel, instructions, tools: TOOL_DEFINITIONS, store: false }

if (caps.structuredOutput) {
  baseParams.text = { format: OUTPUT_SCHEMA }
}
if (caps.reasoning) {
  baseParams.reasoning = { effort: reasoningEffort ?? "medium" }
}
```

### Frontend UI gating

```tsx
<Toggle
  label="Extended thinking"
  checked={reasoningEffort !== "low"}
  disabled={!MODEL_CAPS[model]?.reasoning}
  tooltip={!MODEL_CAPS[model]?.reasoning ? "Not supported by this model" : undefined}
  onChange={...}
/>
```

Disabled with tooltip — not hidden — so users understand the control exists but isn't applicable.

---

## 13. Structured Output & Streaming

### Structured output (JSON schema)

For models that support it, the Responses API `text.format` field enforces the output schema. This guarantees the response is valid JSON matching the `ComponentConfig` type — no extraction heuristics needed.

```ts
baseParams.text = {
  format: {
    type: "json_schema",
    name: "component_config",
    schema: ComponentConfigSchema,
    strict: true,
  } as ResponseFormatTextJSONSchemaConfig
}
```

For models that don't support structured output, fall back to:

```ts
finalContent = JSON.stringify({ message: response.output_text })
```

### NDJSON streaming (tool call visibility)

The backend streams events to the frontend as newline-delimited JSON. Each event is one complete JSON object per line.

#### Event types

```ts
type StreamEvent =
  | { type: "tool_call";   callId: string; name: string; arguments: Record<string, unknown> }
  | { type: "tool_output"; callId: string; output: Record<string, unknown> }
  | { type: "response";    id: string; content: string; toolInteractions: ToolInteraction[] }
  | { type: "error";       message: string }
```

#### Backend emission

```ts
function emit(event: StreamEvent) {
  controller.enqueue(encoder.encode(JSON.stringify(event) + "\n"))
}
```

#### Frontend consumption

```ts
const reader = response.body!.getReader()
const decoder = new TextDecoder()
let buffer = ""

while (true) {
  const { done, value } = await reader.read()
  if (done) break
  buffer += decoder.decode(value, { stream: true })

  const lines = buffer.split("\n")
  buffer = lines.pop() ?? ""  // keep incomplete last line

  for (const line of lines) {
    if (!line.trim()) continue
    const event: StreamEvent = JSON.parse(line)

    if (event.type === "tool_call") {
      // Add pending ToolInteraction (output: null) to message state
    }
    if (event.type === "tool_output") {
      // Fill in output for the matching callId
    }
    if (event.type === "response") {
      // Replace placeholder message with final settled message
    }
    if (event.type === "error") {
      // Remove placeholder, show error
    }
  }
}
```

This makes tool calls appear in the UI as they happen, one by one — not waiting for the full round-trip.

---

## 14. Patch System

Once a config is rendered, edits go through **JSON patches** (RFC 6902). This is far cheaper than regenerating the entire config for small changes.

### Patch types

```json
{ "op": "replace", "path": "/initialState/count", "value": 10 }
{ "op": "add",     "path": "/children/2",          "value": { "component": "Divider" } }
{ "op": "remove",  "path": "/children/1" }
{ "op": "move",    "from": "/children/0", "path": "/children/2" }
```

### Fuzzy path resolution

When the AI generates a path like `/children/3/props/label` but the target node moved, the patch engine uses a fuzzy matcher to find the nearest valid path (by node type, sibling context, and edit distance). This prevents stale patches from failing silently.

### Patch prompt

The AI generates patches rather than a full config when responding to edit requests:

```
System: Here is the current config JSON.
User: Move the search input above the table.
AI: [{ "op": "move", "from": "/children/1", "path": "/children/0" }]
```

---

## 15. Error Recovery

### Truncation detection

If the AI response is cut off mid-JSON (context length exceeded), the engine:
1. Detects unclosed braces/brackets
2. Issues a **continuation request**: "You were cut off. Continue from: `...last valid token`"
3. Stitches the continuation onto the partial response
4. Validates and renders the completed config

### Malformed JSON repair

For responses with minor formatting errors (trailing commas, unquoted keys, JS comments):
1. Attempt `JSON.parse` — if it passes, done
2. Apply a sequence of repair transforms (strip comments, fix trailing commas, quote bare keys)
3. Retry parse — if it passes, done
4. Fall back to a minimal valid config with an error message node

### Schema validation errors

Invalid component types or expression shapes are caught at compile time. The engine renders up to the first invalid node, showing an inline error boundary for the bad subtree rather than failing the whole page.

---

## 16. Performance Optimisations

### Expression memoisation (two-tier)

**Tier 1 — render-cycle dedup**: Within a single render pass, expressions with identical input objects (by reference) return cached results. Avoids redundant evaluation of the same expression in multiple places.

**Tier 2 — cross-render caching**: Dependency-tracked cache keyed on expression node identity + input values. Invalidated when any referenced `page.store:*` or `var:*` value changes. Uses `WeakMap` for automatic GC.

Excluded: bare `$ref` (already O(1) property access), `var:` refs (local scope, cheap), literals.

### Array virtualisation ($map)

Transparent to the DSL author. When `$map` produces a list exceeding a computed threshold, the engine switches to a virtual scroll container:

```
effectiveThreshold = clamp(floor(500 / complexityScore), min=10, max=80)
complexityScore = componentNodeCount + (expressionCount × 0.5)
```

Only nodes in (or near) the viewport are mounted in the DOM. The DSL config is unchanged — virtualisation is an engine decision.

### Compiled node stamping

Each compiled `ComponentNode` receives a stable identity key derived from its config path. React uses this key for reconciliation. Prevents unnecessary unmount/remount when the config is partially patched.

### Selector caching

Selectors are evaluated once per state change using a dependency graph. If a selector's inputs didn't change, it returns the cached value — no re-computation. Downstream components re-render only when the selector output changes.

---

## 17. v1 → v2 → v3 Evolution

### v1 — TypeScript configs (abandoned)

- Configs were TypeScript objects, not JSON
- Custom components required TS interface extensions
- No AI generation — handwritten configs
- Tight coupling between config shape and React component props

### v2 — JSON configs + one-shot generation

**Wins:**
- Clean JSON config format, AI-generatable
- Registry system for security
- `compile-then-render` pipeline
- Declarative effects
- Page store with Immer
- Patch system for edits
- Basic error recovery (truncation, repair)
- Prompt caching for DSL reference

**Pain points:**
- No schema versioning — breaking changes were silent
- Eager expression evaluation — every expression evaluated on every render
- No streaming — full config before anything renders
- No view-state locking during patch application
- Array.map was expensive for large lists
- No selectors — derived state computed per-render
- Fire-and-forget actions — no feedback loop
- Namespace-style built-ins created JS coupling

### v3 — Current

**Changes from v2:**
- Expression operators replace namespace-style built-ins entirely
- Two-tier expression memoisation
- Engine-level array virtualisation (transparent)
- Dependency-tracked selectors
- NDJSON streaming for incremental UI updates
- Tool calling with incremental UI (tool calls appear as they stream)
- Model capability map — prevents silent API errors
- Multi-step generation for complex UIs
- Schema versioning (planned) with forward migrations
- Config tree diffing for patch optimisation

---

## 18. Config Examples

### 18.1 — Minimal toggle

```json
{
  "component": "ItemGroup",
  "children": [
    {
      "component": "Toggle",
      "props": {
        "checked": { "$ref": "page.store:on" },
        "onChange": {
          "$action": [
            { "type": "page.store.update", "path": "on", "payload": { "$not": { "$ref": "page.store:on" } } }
          ]
        }
      }
    },
    {
      "component": "P",
      "children": [{ "$if": { "cond": { "$ref": "page.store:on" }, "then": "On", "else": "Off" } }]
    }
  ]
}
```

### 18.2 — Counter with reset

```json
{
  "component": "ItemGroup",
  "children": [
    {
      "component": "Button",
      "props": {
        "disabled": { "$eq": { "a": { "$ref": "page.store:count" }, "b": 0 } },
        "onClick": {
          "$action": [
            { "type": "page.store.update", "path": "count", "payload": { "$sub": [{ "$ref": "page.store:count" }, 1] } }
          ]
        }
      },
      "children": ["-"]
    },
    { "component": "P", "children": [{ "$string": { "$ref": "page.store:count" } }] },
    {
      "component": "Button",
      "props": {
        "onClick": {
          "$action": [
            { "type": "page.store.update", "path": "count", "payload": { "$add": [{ "$ref": "page.store:count" }, 1] } }
          ]
        }
      },
      "children": ["+"]
    },
    {
      "component": "Button",
      "props": {
        "variant": "ghost",
        "disabled": { "$eq": { "a": { "$ref": "page.store:count" }, "b": 0 } },
        "onClick": { "$action": [{ "type": "page.store.reset", "path": "count" }] }
      },
      "children": ["Reset"]
    }
  ]
}
```

### 18.3 — Async data fetch on mount

```json
{
  "component": "ItemGroup",
  "effects": [
    {
      "deps": [],
      "run": [
        { "type": "page.store.update", "path": "loading", "payload": true },
        {
          "type": "async.call",
          "call": { "$http": { "method": "GET", "url": "/api/users" } },
          "onSuccess": [
            { "type": "page.store.update", "path": "users",   "payload": { "$ref": "result" } },
            { "type": "page.store.update", "path": "loading", "payload": false }
          ],
          "onError": [
            { "type": "page.store.update", "path": "error",   "payload": { "$ref": "error.message" } },
            { "type": "page.store.update", "path": "loading", "payload": false }
          ]
        }
      ]
    }
  ],
  "children": [
    {
      "$if": {
        "cond": { "$ref": "page.store:loading" },
        "then": { "component": "Spinner" },
        "else": {
          "$if": {
            "cond": { "$neq": { "a": { "$ref": "page.store:error" }, "b": null } },
            "then": { "component": "P", "children": [{ "$ref": "page.store:error" }] },
            "else": {
              "component": "ItemGroup",
              "children": [
                {
                  "$map": {
                    "over": { "$ref": "page.store:users" },
                    "as": "user",
                    "return": {
                      "component": "Item",
                      "children": [
                        {
                          "component": "ItemContent",
                          "children": [
                            {
                              "component": "ItemTitle",
                              "children": [{ "$ref": "var:user.name" }]
                            },
                            {
                              "component": "ItemDescription",
                              "children": [{ "$ref": "var:user.email" }]
                            }
                          ]
                        }
                      ]
                    }
                  }
                }
              ]
            }
          }
        }
      }
    }
  ]
}
```

### 18.4 — Searchable filtered list with selectors

`selectors` are declared on the root `ItemGroup` component node — they flow down to all children but are invisible above this node.

```json
{
  "component": "ItemGroup",
  "selectors": {
    "filteredProducts": {
      "$filter": {
        "over": { "$ref": "page.store:products" },
        "as": "p",
        "where": {
          "$and": [
            {
              "$includes": {
                "value": { "$lower": { "$ref": "var:p.name" } },
                "search": { "$lower": { "$ref": "page.store:query" } }
              }
            },
            {
              "$gte": { "a": { "$ref": "var:p.price" }, "b": { "$ref": "page.store:minPrice" } }
            }
          ]
        }
      }
    },
    "resultCount": { "$count": { "$ref": "selectors:filteredProducts" } }
  },
  "children": [
    {
      "component": "Input",
      "props": {
        "value": { "$ref": "page.store:query" },
        "placeholder": "Search products…",
        "onChange": {
          "$action": [{ "type": "page.store.update", "path": "query", "payload": { "$ref": "event.value" } }]
        }
      }
    },
    {
      "component": "P",
      "children": [
        {
          "$pipe": [
            { "$ref": "selectors:resultCount" },
            { "$string": "$$" },
            { "$concat": ["$$", " results"] }
          ]
        }
      ]
    },
    {
      "component": "Grid",
      "children": [
        {
          "$map": {
            "over": { "$ref": "selectors:filteredProducts" },
            "as": "product",
            "return": {
              "component": "ProductCard",
              "props": {
                "name": { "$ref": "var:product.name" },
                "price": { "$ref": "var:product.price" },
                "image": { "$ref": "var:product.imageUrl" }
              }
            }
          }
        }
      ]
    }
  ]
}
```

---

## Appendix: Adding a New Tool

1. Create `packages/ui/src/context-helpers/tools/tool.<name>.ts`
2. Export `definition` (OpenAI function definition) and `execute(args)` function
3. Import `definition` in `definitions.ts`, add to `TOOL_DEFINITIONS`
4. Import `execute` in `executor.ts`, add a `case` in `executeTool`
5. No other files need changing — the tool is automatically available in all API routes that import from `@beta-epic/ui`

## Appendix: DSL Quick Reference

| Want to… | Use |
|-----------|-----|
| Read store value | `{ "$ref": "page.store:field" }` |
| Read iteration var | `{ "$ref": "var:varName" }` |
| Conditional | `{ "$if": { "cond": …, "then": …, "else": … } }` |
| Multi-branch | `{ "$switch": { "on": …, "cases": {…}, "default": … } }` |
| Chain transforms | `{ "$pipe": [ step1, step2, … ] }` |
| Filter array | `{ "$filter": { "over": …, "as": "x", "where": … } }` |
| Map array | `{ "$map": { "over": …, "as": "x", "return": … } }` |
| Compute derived | Declare in node `selectors`, access via `{ "$ref": "selectors:name" }` |
| Add numbers | `{ "$add": [a, b] }` |
| String concat | `{ "$concat": [a, b] }` |
| Null fallback | `{ "$nullish": { "value": …, "default": … } }` |
| Update store | `{ "type": "page.store.update", "path": "…", "payload": … }` |
| Async fetch | `{ "type": "async.call", "call": { "$http": { "method": "GET", "url": "…" } }, "onSuccess": […] }` |
| Mount effect | `"effects": [{ "deps": [], "run": […] }]` |
| Reactive effect | `"effects": [{ "deps": [expr], "debounce": 300, "run": […] }]` |
