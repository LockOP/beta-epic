# $ref — Reading Values

`$ref` is how the DSL reads any value at runtime. The prefix before `:` determines the source.

## Namespace map

| Prefix | Reads from |
| ------ | ---------- |
| `page.store:field` | page-local state (`initialState`) |
| `selectors:name` | computed selector values declared on this node or an ancestor |
| `var:name` | iteration variable (`$map`/`$filter`/`$reduce` `as:`), env block vars, event/result/error/`$$` |
| `env:VAR_NAME` | `window.env` — client-side environment variables injected at startup |
| `redux:some.path` | global Redux store (any slice) |
| `url:field` | current URL — params, query string, pathname, origin, etc. |
| `refs:hook.field` | values returned by registered React hooks |
| `local:key` | `localStorage` — JSON-parsed, dot-path supported |
| `session:key` | `sessionStorage` — JSON-parsed, dot-path supported |

> **Handler argument access uses `$arg`, not `$ref`.** `{ "$arg": 0 }` reads the first raw argument passed to the current handler. `{ "$arg": 0, "path": "target.value" }` drills into it with a dot-path. See [25-args.md](./25-args.md).

> **Theme tokens are not accessible via `$ref`.**
> They are CSS custom properties (`--primary`, `--radius`, etc.) injected by `<GuiProvider theme={...} />`.
> Components consume them automatically via Tailwind classes. See [15-theme.md](./15-theme.md).

---

## page.store — page-local state

```json
{ "$ref": "page.store:count" }
{ "$ref": "page.store:user.name" }
{ "$ref": "page.store:filters.category" }
```

```js
// State lives in store[sliceName], seeded from initialState
store[sliceName].count
store[sliceName].user.name
store[sliceName].filters.category
```

---

## selectors — derived / computed values

```json
{ "$ref": "selectors:fullName" }
{ "$ref": "selectors:filteredItems" }
{ "$ref": "selectors:canSubmit" }
```

```js
// Recomputed once per state change, not on every render
fullName       // derived from store.firstName + store.lastName
filteredItems  // filtered array
canSubmit      // boolean from multiple conditions
```

Selectors are declared on any `ComponentNode` and flow downward to descendants of that node. See [13-selectors.md](./13-selectors.md).

---

## var — iteration variables and local env block vars

`var:` reads values injected into the runtime context. This covers three cases:

### 1. Iteration variables (from `as:`)

```json
{
  "$map": {
    "over": { "$ref": "page.store:products" },
    "as": "product",
    "return": {
      "component": "P",
      "children": [
        { "$ref": "var:product.name" }
      ]
    }
  }
}
```

```js
products.map(product => <P>{product.name}</P>)
```

The name comes from the `"as"` field. It lives in `var:`, not `page.store:`.

### 2. env block variables (local to a node)

```json
{
  "component": "Card",
  "env": {
    "displayName": { "$nullish": { "value": { "$ref": "page.store:user.name" }, "default": "Guest" } }
  },
  "children": [
    { "component": "P", "children": [{ "$ref": "var:displayName" }] }
  ]
}
```

```js
const displayName = state.user?.name ?? "Guest"
<Card><P>{displayName}</P></Card>
```

`env` block values are declared on a node and available in `var:` to that node and all its children.

### 3. Event / async context (event.value, result, error.message, $$)

```json
{ "$ref": "var:event.value" }
{ "$ref": "var:result" }
{ "$ref": "var:result.items" }
{ "$ref": "var:error.message" }
{ "$ref": "var:error.status" }
{ "$ref": "var:$$" }
```

These are also accessible as bare refs (no prefix):

```json
{ "$ref": "event.value" }
{ "$ref": "result" }
{ "$ref": "error.message" }
```

Both forms resolve from the same internal context. Bare refs are preferred for event/result/error.

---

## env — client-side environment variables

`env:` reads from `window.env` — a plain object host apps inject at startup to expose `.env` file values to the DSL without hard-coding them.

```ts
// _app.tsx or index.html inline script — inject before the app mounts
window.env = {
  API_URL:    process.env.NEXT_PUBLIC_API_URL,   // Next.js
  MAPS_KEY:   import.meta.env.VITE_MAPS_KEY,     // Vite
  APP_VERSION: process.env.REACT_APP_VERSION,    // CRA
}
```

```json
{ "$ref": "env:API_URL" }
{ "$ref": "env:MAPS_KEY" }
{ "$ref": "env:APP_VERSION" }
```

```js
window.env.API_URL
window.env.MAPS_KEY
window.env.APP_VERSION
```

> **`env:` is for window environment variables only.** Use `var:` for iteration variables and local env block vars.

---

## redux — global store

Read any path from the Redux store that lives outside the page's own slice.

```json
{ "$ref": "redux:auth.user" }
{ "$ref": "redux:cart.items" }
{ "$ref": "redux:settings.locale" }
```

```js
globalStore.auth.user
globalStore.cart.items
globalStore.settings.locale
```

---

## url — current URL

`url:` resolves a URL object built from the current `window.location`. All fields below are available:

```json
{ "$ref": "url:query.tab" }
{ "$ref": "url:query.filter" }
{ "$ref": "url:pathname" }
{ "$ref": "url:search" }
{ "$ref": "url:hash" }
{ "$ref": "url:fragment" }
{ "$ref": "url:origin" }
{ "$ref": "url:fullPath" }
{ "$ref": "url:href" }
```

```js
// For the URL: https://app.com/products/42?tab=details#reviews

query.tab    // "details"     (query string value)
pathname     // "/products/42"
search       // "?tab=details"
hash         // "#reviews"
fragment     // "reviews"     (hash without leading #)
origin       // "https://app.com"
fullPath     // "/products/42?tab=details#reviews"
href         // "https://app.com/products/42?tab=details#reviews"
```

> **`url:params.*` requires router integration.**
> `url:params` is always an empty object `{}` by default. It is only populated when the host app passes route params through a custom integration. `url:query.*` (query string) works without any integration.

**Reading query string params:**

```json
{
  "component": "Tabs",
  "props": {
    "activeTab": { "$ref": "url:query.tab" }
  }
}
```

---

## refs — registered hook values

Values returned by React hooks registered via `GuiProvider hooks={...}`. Re-evaluated on every hook update.

```tsx
<GuiProvider
  hooks={{
    windowSize:  () => useWindowSize(),
    currentUser: () => useAuth().user,
  }}
>
```

```json
{ "$ref": "refs:windowSize.width" }
{ "$ref": "refs:windowSize.height" }
{ "$ref": "refs:currentUser.email" }
{ "$ref": "refs:currentUser.role" }
```

```js
useWindowSize().width
useAuth().user.email
```

---

## Nested paths

All namespaces support dot-path traversal:

```json
{ "$ref": "page.store:order.shipping.address.city" }
{ "$ref": "var:product.variants.0.price" }
{ "$ref": "url:query.filters" }
{ "$ref": "redux:ui.sidebar.collapsed" }
```
