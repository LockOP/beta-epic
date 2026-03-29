# Registered Functions — $fn and async.call

The function registry is where the host app exposes named functions to the DSL. There are two kinds:

- **Sync functions** — registered via `GuiProvider functions={...}`, called from expressions using `$fn`
- **Async functions** — registered via `GuiProvider functions={...}`, called from actions using `async.call`

The DSL never imports or references JS modules directly. All external capability goes through the registry.

> **Note:** `$trim`, `$lower`, `$upper`, `$contains`, `$includes`, `$replace`, `$split`, `$string`, `$number`, `$bool`, `$nullish`, etc. are **built-in DSL operators** — use those directly instead of registering functions for them. The function registry is for domain-specific logic the DSL cannot express natively (e.g. `formatCurrency`, `fetchUser`).

---

## Sync $fn — called from an expression

`$fn` is an expression operator. It evaluates to a value — never performs side effects.

```json
{ "$fn": "formatCurrency", "args": [{ "$ref": "page.store:price" }, "USD"] }
```

```js
formatCurrency(state.price, "USD")   // → "$1,234.00"
```

---

```json
{ "$fn": "formatDate", "args": [{ "$ref": "page.store:createdAt" }, "DD MMM YYYY"] }
```

```js
formatDate(state.createdAt, "DD MMM YYYY")
```

---

## $fn inside a prop

```json
{
  "component": "Text",
  "props": {
    "content": {
      "$fn": "formatDate",
      "args": [{ "$ref": "page.store:createdAt" }, "DD MMM YYYY"]
    }
  }
}
```

```jsx
<Text content={formatDate(state.createdAt, "DD MMM YYYY")} />
```

---

## $fn inside $filter (sync transform inside array op)

```json
{
  "$filter": {
    "over": { "$ref": "page.store:users" },
    "as": "u",
    "where": {
      "$fn": "matchesPermission",
      "args": [{ "$ref": "var:u.role" }, { "$ref": "page.store:requiredRole" }]
    }
  }
}
```

```js
state.users.filter(u => matchesPermission(u.role, state.requiredRole))
```

---

## $fn with path — extract a field from the result

`path` drills into the return value:

```json
{ "$fn": "getUser", "args": [1], "path": "profile.avatar" }
```

```js
getUser(1).profile.avatar
```

---

## async.call with $fn — calling an async registered function

When the registered function returns a Promise, use `async.call` instead of `$fn` directly.

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

```js
// host app registered:
registerFunction("fetchUser", async (id) => {
  const res = await fetch(`/api/users/${id}`)
  return res.json()
})

// DSL calls it:
try {
  const result = await fetchUser(state.userId)
  state.user = result
} catch (e) {
  state.error = e.message
}
```

---

## async.call — multiple args

```json
{
  "type": "async.call",
  "call": {
    "$fn": "searchProducts",
    "args": [
      { "$ref": "page.store:query" },
      { "$ref": "page.store:filters" },
      { "$ref": "page.store:page" }
    ]
  },
  "loading": "isSearching",
  "onSuccess": [
    { "type": "page.store.update", "path": "results", "payload": { "$ref": "result.items" } },
    { "type": "page.store.update", "path": "total",   "payload": { "$ref": "result.total" } }
  ]
}
```

```js
state.isSearching = true
const result = await searchProducts(state.query, state.filters, state.page)
state.results    = result.items
state.total      = result.total
state.isSearching = false
```

---

## Difference: $fn vs async.call

| | `$fn` | `async.call` |
| - | ---- | ------------ |
| Used in | expressions (props, conditions, selectors) | actions (event handlers, effects) |
| Returns | a value immediately | nothing — result goes to `onSuccess` |
| Async | never | yes |
| Side effects | never | yes |

```json
// WRONG — $fn cannot call an async function from a prop
{ "component": "Text", "props": { "content": { "$fn": "fetchUser", "args": [1] } } }

// RIGHT — async work in an effect, result stored in state, prop reads state
{
  "component": "Text",
  "props": { "content": { "$ref": "page.store:user.name" } },
  "effects": [{
    "deps": [],
    "run": [{
      "type": "async.call",
      "call": { "$fn": "fetchUser", "args": [1] },
      "onSuccess": [{ "type": "page.store.update", "path": "user", "payload": { "$ref": "result" } }]
    }]
  }]
}
```

---

## Registering functions (host app side)

```tsx
<GuiProvider
  functions={{
    formatCurrency: (amount: number, currency: string) =>
      amount.toLocaleString("en-US", { style: "currency", currency }),

    formatDate: (value: unknown, fmt: string) => {
      const d = new Date(value as string)
      return fmt
        .replace("DD", String(d.getDate()).padStart(2, "0"))
        .replace("MMM", d.toLocaleString("en-US", { month: "short" }))
        .replace("YYYY", String(d.getFullYear()))
    },

    // Async
    fetchUser: async (id: number) => {
      const res = await fetch(`/api/users/${id}`)
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      return res.json()
    },

    searchProducts: async (query: string, filters: object, page: number) => {
      const res = await fetch("/api/products/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query, filters, page }),
      })
      return res.json()
    },
  }}
>
  {children}
</GuiProvider>
```
