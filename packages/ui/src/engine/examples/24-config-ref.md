# $subConfig — Reusable Config Fragments

`$subConfig` is a **pre-compilation substitution**. Before the engine compiles or evaluates anything, it finds every `$subConfig` reference in the full config tree, inlines the named fragment in its place, and substitutes any `subConfigProps` values directly into that fragment. The result is a plain expanded config — the engine then processes it as if you had written it inline all along.

This means `$subConfig` is not a component, a function call, or a runtime expression. It is **config segregation before processing** — a way to split a large config into named pieces and compose them back together. Because substitution happens first, a `$subConfig` can appear anywhere in the config tree: inside `children`, inside a prop value, inside an action, inside another `$subConfig`'s fragment.

---

## Registration

Named fragments are passed as the `refConfigs` prop on `<GuiComponent>`:

```jsx
<GuiComponent
  rootConfig={doc}
  refConfigs={{
    productCard: { "component": "Card", "children": [...] },
    saveAction:  [{ "type": "page.store.update", "path": "saving", "payload": true }, ...],
    labelExpr:   { "$fn": "formatCurrency", "args": [{ "$ref": "var:price" }, "USD"] }
  }}
/>
```

Fragments can be any valid DSL value — a `ComponentNode`, an expression, an action array, or a primitive. Whatever you register is what gets inlined.

---

## Basic usage — no parameters

Reference by name wherever that value belongs:

```json
{
  "component": "Stack",
  "children": [
    { "$subConfig": "productCard" },
    { "$subConfig": "productCard" }
  ]
}
```

Before compilation this becomes:

```json
{
  "component": "Stack",
  "children": [
    { "component": "Card", "children": [...] },
    { "component": "Card", "children": [...] }
  ]
}
```

---

## Parameterized usage — `subConfigProps`

Pass values into the fragment via `subConfigProps`. Each value is a DSL ref or expression written in the **calling** context. Before compilation, those values are injected as `env` into the fragment, where they are accessible via `var:`.

**Fragment definition:**

```json
{
  "component": "Card",
  "props": {
    "title":    { "$ref": "var:title" },
    "subtitle": { "$ref": "var:subtitle" }
  },
  "children": [
    {
      "component": "Text",
      "props": {
        "content": { "$fn": "formatCurrency", "args": [{ "$ref": "var:price" }, "USD"] }
      }
    },
    {
      "component": "Button",
      "props": {
        "label":    "Add to cart",
        "disabled": { "$not": { "$ref": "var:inStock" } }
      }
    }
  ]
}
```

**Usage with `subConfigProps`:**

```json
{
  "$subConfig": "productCard",
  "subConfigProps": {
    "title":    { "$ref": "page.store:selectedProduct.name" },
    "subtitle": { "$ref": "page.store:selectedProduct.category" },
    "price":    { "$ref": "page.store:selectedProduct.price" },
    "inStock":  { "$ref": "page.store:selectedProduct.inStock" }
  }
}
```

After substitution, the engine sees the full `productCard` node with `var:title`, `var:price`, etc. already bound to the passed expressions — exactly as if you had typed the expanded form by hand.

---

## Used anywhere — not just children

Because substitution happens before compilation, `$subConfig` can sit anywhere a DSL value is valid.

**As a prop value:**

```json
{
  "component": "Button",
  "props": {
    "label": { "$subConfig": "saveLabelExpr" }
  }
}
```

**As a prop value (expression position):**

```json
{
  "component": "Button",
  "props": {
    "label": { "$subConfig": "saveLabelExpr" }
  }
}
```

> **`$subConfig` cannot be used to inline an action array inside `$action: [...]`.**
> The substitutor returns the fragment as-is in an expression position. If the fragment is an action array `[{...}, {...}]`, it lands as a nested array inside the outer action list. The action runner does not flatten nested arrays — the inner actions are silently skipped.
>
> To reuse action sequences, put the repeated actions directly in each call site, or extract them into a registered function and call it via `async.call`.

**Inside another fragment — composing sub-configs:**

```json
{
  "component": "PageLayout",
  "children": [
    { "$subConfig": "header" },
    {
      "$subConfig": "contentArea",
      "subConfigProps": {
        "body": { "$subConfig": "productCard" }
      }
    },
    { "$subConfig": "footer" }
  ]
}
```

---

## Using `$subConfig` inside `$map`

The canonical list-rendering pattern:

```json
{
  "$map": {
    "over": { "$ref": "page.store:products" },
    "as": "product",
    "return": {
      "$subConfig": "productCard",
      "subConfigProps": {
        "title":    { "$ref": "var:product.name" },
        "subtitle": { "$ref": "var:product.category" },
        "price":    { "$ref": "var:product.price" },
        "inStock":  { "$ref": "var:product.inStock" }
      }
    }
  }
}
```

Define the card once, vary the data at each use site.

---

## Fragment with its own selectors

Fragments are full node definitions — they can carry `selectors`, `env`, and nested `children`. The substitution inlines the entire node as-is.

```json
{
  "component": "Row",
  "selectors": {
    "initials": {
      "$pipe": [
        { "$split": { "value": { "$ref": "var:name" }, "sep": " " } },
        {
          "$map": {
            "over": "$$",
            "as": "word",
            "return": { "$charAt": { "value": { "$ref": "var:word" }, "index": 0 } }
          }
        },
        { "$join": { "arr": "$$", "sep": "" } }
      ]
    }
  },
  "children": [
    { "component": "Avatar", "props": { "initials": { "$ref": "selectors:initials" } } },
    { "component": "Text",   "props": { "content":  { "$ref": "var:name" } } },
    { "component": "Text",   "props": { "content":  { "$ref": "var:email" }, "variant": "caption" } }
  ]
}
```

`selectors:initials` is scoped to this fragment subtree after inlining.

---

## Full example — stat dashboard

**`refConfigs` passed to `<GuiComponent>`:**

```json
{
  "kpiTile": {
    "component": "Card",
    "props": { "variant": "stat" },
    "children": [
      { "component": "Text",  "props": { "content": { "$ref": "var:label" }, "variant": "caption" } },
      { "component": "Text",  "props": { "content": { "$ref": "var:value" }, "variant": "display" } },
      {
        "component": "Badge",
        "props": {
          "label": { "$ref": "var:trend" },
          "color": { "$if": { "cond": { "$ref": "var:positive" }, "then": "green", "else": "red" } }
        }
      }
    ]
  }
}
```

**Page config:**

```json
{
  "component": "DashboardPage",
  "selectors": {
    "revenueFormatted": { "$fn": "formatCurrency", "args": [{ "$ref": "page.store:stats.revenue" }, "USD"] },
    "usersFormatted":   { "$fn": "formatNumber",   "args": [{ "$ref": "page.store:stats.users" }] },
    "ordersFormatted":  { "$fn": "formatNumber",   "args": [{ "$ref": "page.store:stats.orders" }] }
  },
  "children": [
    {
      "component": "KpiRow",
      "children": [
        {
          "$subConfig": "kpiTile",
          "subConfigProps": {
            "label":    "Revenue",
            "value":    { "$ref": "selectors:revenueFormatted" },
            "trend":    { "$ref": "page.store:stats.revenueTrend" },
            "positive": { "$ref": "page.store:stats.revenuePositive" }
          }
        },
        {
          "$subConfig": "kpiTile",
          "subConfigProps": {
            "label":    "Users",
            "value":    { "$ref": "selectors:usersFormatted" },
            "trend":    { "$ref": "page.store:stats.usersTrend" },
            "positive": { "$ref": "page.store:stats.usersPositive" }
          }
        },
        {
          "$subConfig": "kpiTile",
          "subConfigProps": {
            "label":    "Orders",
            "value":    { "$ref": "selectors:ordersFormatted" },
            "trend":    { "$ref": "page.store:stats.ordersTrend" },
            "positive": { "$ref": "page.store:stats.ordersPositive" }
          }
        }
      ]
    }
  ]
}
```

---

## What to notice

- **Pre-compilation substitution** — `$subConfig` is resolved before the engine compiles or evaluates any expressions. The output is a flat, expanded config.
- **Usable anywhere** — children, prop values, action arrays, inside other fragments. It can represent a component, a sub-component, an expression, an action sequence, or any DSL value.
- **`subConfigProps` evaluated at the call site** — `$ref`, `$fn`, `selectors:`, `var:` all resolve in the calling scope, then are injected into the fragment's `env` namespace (accessible via `var:` inside the fragment).
- **Just config segregation** — there is no runtime concept of a "sub-config". By the time the engine runs, everything has been inlined. It is purely a way to organize and reuse DSL config before processing.
- **Fragment's own `env` takes priority** over `subConfigProps` if the same key is declared in both.
- **Missing key throws** at substitution time: `[Epic] $subConfig "name" not found in refConfigs`.
