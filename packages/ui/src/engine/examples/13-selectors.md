# Selectors — Derived State

Selectors are derived values computed from state. They are declared **on a node** and flow **downward only** — available to that node and all its descendants, but not to parent nodes or siblings. Think of them like a variable declared at a scope that is visible inside that scope and below, but never above.

```text
Stack  (selectors: { filteredItems, totalCount })
  ├── Text        →  can read selectors:filteredItems   ✓
  ├── Grid        →  can read selectors:filteredItems   ✓
  │     └── Card  →  can read selectors:filteredItems   ✓
  └── ...

Parent of Stack   →  cannot read selectors:filteredItems  ✗
Sibling of Stack  →  cannot read selectors:filteredItems  ✗
```

This means you can declare selectors on any node — not just the root — keeping derived logic co-located with the subtree that needs it.

```json
{ "$ref": "page.store:count" }     // raw store field
{ "$ref": "selectors:fullName" }   // computed selector (only inside the node that declared it or below)
```

**Evaluation:** computed once per state change, cached for that render cycle. If 10 children all reference `selectors:filteredItems`, the filter runs once, not 10 times.

---

## Basic derived value

```json
{
  "component": "Card",
  "selectors": {
    "fullName": {
      "$concat": [{ "$ref": "page.store:firstName" }, " ", { "$ref": "page.store:lastName" }]
    }
  },
  "children": [
    { "component": "P", "children": [{ "$ref": "selectors:fullName" }] }
  ]
}
```

```js
const fullName = `${state.firstName} ${state.lastName}`
// available to P and any other descendant of Card
```

---

## Count from array

```json
{
  "component": "Card",
  "selectors": {
    "itemCount": { "$count": { "$ref": "page.store:items" } }
  },
  "children": [
    { "component": "Badge", "children": [{ "$ref": "selectors:itemCount" }] }
  ]
}
```

```js
const itemCount = state.items.length
```

---

## Filtered list

```json
{
  "component": "Card",
  "selectors": {
    "activeUsers": {
      "$filter": {
        "over": { "$ref": "page.store:users" },
        "as": "u",
        "where": { "$ref": "var:u.active" }
      }
    }
  },
  "children": [
    { "$map": { "over": { "$ref": "selectors:activeUsers" }, "as": "user", "return": { "component": "P", "children": [{ "$ref": "var:user.name" }] } } }
  ]
}
```

```js
const activeUsers = state.users.filter(u => u.active)
```

---

## Selector depending on another selector

Selectors can reference other selectors via `selectors:`. Evaluated in declaration order — a selector can only reference selectors declared before it.

```json
{
  "component": "Card",
  "selectors": {
    "filteredItems": {
      "$filter": {
        "over": { "$ref": "page.store:items" },
        "as": "i",
        "where": {
          "$contains": { "value": { "$ref": "var:i.name" }, "search": { "$ref": "page.store:query" } }
        }
      }
    },
    "filteredCount": { "$count": { "$ref": "selectors:filteredItems" } },
    "hasResults":    { "$gt": { "a": { "$ref": "selectors:filteredCount" }, "b": 0 } }
  },
  "children": [
    { "component": "P",       "children": [{ "$ref": "selectors:filteredCount" }] },
    { "component": "Results", "props": { "items":   { "$ref": "selectors:filteredItems" }, "empty": { "$not": { "$ref": "selectors:hasResults" } } } }
  ]
}
```

```js
const filteredItems = state.items.filter(i => contains(i.name, state.query))
const filteredCount = filteredItems.length
const hasResults    = filteredCount > 0
```

---

## Selectors scoped to a subtree (not the root)

Declare selectors only on the node that needs them — they don't pollute the rest of the page.

```json
{
  "component": "Page",
  "children": [
    {
      "component": "Header",
      "children": [{ "component": "Title", "props": { "text": "Products" } }]
    },
    {
      "component": "ProductGrid",
      "selectors": {
        "visible": {
          "$filter": {
            "over": { "$ref": "page.store:products" },
            "as": "p",
            "where": { "$ref": "var:p.inStock" }
          }
        }
      },
      "children": [
        {
          "$map": {
            "over": { "$ref": "selectors:visible" },
            "as": "product",
            "return": { "component": "Card", "props": { "name": { "$ref": "var:product.name" } } }
          }
        }
      ]
    }
  ]
}
```

`Header` cannot read `selectors:visible` — it's declared on `ProductGrid`, which is a sibling. Only `ProductGrid` and its descendants have access.

---

## Aggregated total (cart)

```json
{
  "component": "CartSummary",
  "selectors": {
    "subtotal": {
      "$reduce": {
        "over": { "$ref": "page.store:cartItems" },
        "as": "item",
        "acc": "sum",
        "init": 0,
        "return": {
          "$add": [
            { "$ref": "var:sum" },
            { "$mul": [{ "$ref": "var:item.price" }, { "$ref": "var:item.qty" }] }
          ]
        }
      }
    },
    "tax":   { "$round": { "$mul": [{ "$ref": "selectors:subtotal" }, 0.1] } },
    "total": { "$add": [{ "$ref": "selectors:subtotal" }, { "$ref": "selectors:tax" }] }
  },
  "children": [
    { "component": "Row", "props": { "label": "Subtotal", "value": { "$ref": "selectors:subtotal" } } },
    { "component": "Row", "props": { "label": "Tax (10%)", "value": { "$ref": "selectors:tax" } } },
    { "component": "Row", "props": { "label": "Total",    "value": { "$ref": "selectors:total" } } }
  ]
}
```

```js
const subtotal = state.cartItems.reduce((sum, item) => sum + item.price * item.qty, 0)
const tax      = Math.round(subtotal * 0.1)
const total    = subtotal + tax
```

---

## Boolean flag — form validation

```json
{
  "component": "Form",
  "selectors": {
    "nameValid":  { "$gt": { "a": { "$length": { "$trim": { "$ref": "page.store:form.name" } } }, "b": 0 } },
    "emailValid": { "$includes": { "value": { "$ref": "page.store:form.email" }, "search": "@" } },
    "canSubmit": {
      "$and": [
        { "$ref": "selectors:nameValid" },
        { "$ref": "selectors:emailValid" },
        { "$not": { "$ref": "page.store:submitting" } }
      ]
    }
  },
  "children": [
    { "component": "Button", "props": { "disabled": { "$not": { "$ref": "selectors:canSubmit" } } }, "children": ["Submit"] }
  ]
}
```

```js
const nameValid  = state.form.name.trim().length > 0
const emailValid = state.form.email.includes("@")
const canSubmit  = nameValid && emailValid && !state.submitting
```

---

## Shadowing — child node redeclares the same name

If a child node declares a selector with the same name as an ancestor, the child's version takes precedence within its own subtree.

```json
{
  "component": "Page",
  "selectors": {
    "label": { "$concat": ["Page: ", { "$ref": "page.store:title" }] }
  },
  "children": [
    { "component": "Header", "props": { "text": { "$ref": "selectors:label" } } },
    {
      "component": "Widget",
      "selectors": {
        "label": { "$concat": ["Widget: ", { "$ref": "page.store:widgetName" }] }
      },
      "children": [
        { "component": "P", "children": [{ "$ref": "selectors:label" }] }
      ]
    }
  ]
}
```

`Header` reads `"Page: ..."` — resolves from `Page`'s selector.
`Text` reads `"Widget: ..."` — resolves from the closer `Widget` selector.
