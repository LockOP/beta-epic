# env — Local Variables

`env` declares local variables scoped to a node's subtree. Values are expressions resolved at render time. Children access them via `{ "$ref": "var:varName" }`.

---

## Basic local variable

```json
{
  "component": "Card",
  "env": {
    "displayName": { "$nullish": { "value": { "$ref": "page.store:user.name" }, "default": "Guest" } }
  },
  "children": [
    { "component": "Text", "props": { "content": { "$ref": "var:displayName" } } }
  ]
}
```

```jsx
const displayName = state.user?.name ?? "Guest"
<Card>
  <Text content={displayName} />
</Card>
```

---

## Precompute expensive expressions once

```json
{
  "component": "ProductCard",
  "env": {
    "discountedPrice": { "$round": { "$mul": [{ "$ref": "page.store:product.price" }, 0.85] } },
    "savings": {
      "$round": {
        "$sub": [{ "$ref": "page.store:product.price" }, { "$ref": "var:discountedPrice" }]
      }
    }
  },
  "children": [
    { "component": "Text",  "props": { "content": { "$concat": ["$", { "$string": { "$ref": "var:discountedPrice" } }] } } },
    { "component": "Badge", "props": { "label":   { "$concat": ["Save $", { "$string": { "$ref": "var:savings" } }] } } }
  ]
}
```

```jsx
const discountedPrice = Math.round(product.price * 0.85)
const savings         = Math.round(product.price - discountedPrice)
<ProductCard>
  <Text content={`$${discountedPrice}`} />
  <Badge label={`Save $${savings}`} />
</ProductCard>
```

---

## env inside $map (iteration variable)

Inside `$map`, the `as` variable is automatically available as `var:<as>`.

```json
{
  "component": "List",
  "children": [
    {
      "$map": {
        "over": { "$ref": "page.store:orders" },
        "as": "order",
        "return": {
          "component": "Row",
          "env": {
            "total": {
              "$reduce": {
                "over": { "$ref": "var:order.items" },
                "as": "item",
                "acc": "sum",
                "init": 0,
                "return": { "$add": [{ "$ref": "var:sum" }, { "$ref": "var:item.price" }] }
              }
            }
          },
          "props": {
            "label": { "$ref": "var:order.id" },
            "sub":   { "$concat": ["Total: $", { "$string": { "$ref": "var:total" } }] }
          }
        }
      }
    }
  ]
}
```

```jsx
state.orders.map(order => {
  const total = order.items.reduce((sum, item) => sum + item.price, 0)
  return <Row label={order.id} sub={`Total: $${total}`} />
})
```

---

## Nested env scopes

```json
{
  "component": "Section",
  "env": {
    "isAdmin": { "$eq": { "a": { "$ref": "page.store:user.role" }, "b": "admin" } }
  },
  "children": [
    {
      "component": "Card",
      "env": {
        "label": {
          "$if": {
            "cond": { "$ref": "var:isAdmin" },
            "then": "Admin Dashboard",
            "else": "Dashboard"
          }
        }
      },
      "children": [
        { "component": "Text", "props": { "content": { "$ref": "var:label" } } }
      ]
    }
  ]
}
```

```jsx
const isAdmin = state.user.role === "admin"
// isAdmin is in scope for the whole Section subtree

const label = isAdmin ? "Admin Dashboard" : "Dashboard"
<Section>
  <Card>
    <Text content={label} />
  </Card>
</Section>
```

---

## env for conditional variant

```json
{
  "component": "StatusBadge",
  "env": {
    "variant": {
      "$switch": {
        "on": { "$ref": "page.store:status" },
        "cases": {
          "active":  "success",
          "pending": "warning",
          "error":   "destructive"
        },
        "default": "secondary"
      }
    }
  },
  "props": {
    "label":   { "$ref": "page.store:status" },
    "variant": { "$ref": "var:variant" }
  }
}
```

```jsx
const variantMap = { active: "success", pending: "warning", error: "destructive" }
const variant = variantMap[state.status] ?? "secondary"
<StatusBadge label={state.status} variant={variant} />
```
