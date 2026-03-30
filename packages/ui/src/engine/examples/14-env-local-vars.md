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
    { "component": "P", "children": [{ "$ref": "var:displayName" }] }
  ]
}
```

```jsx
const displayName = state.user?.name ?? "Guest"
<Card>
  <P>{displayName}</P>
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
    { "component": "P",     "children": [{ "$concat": ["$", { "$string": { "$ref": "var:discountedPrice" } }] }] },
    { "component": "Badge", "children": [{ "$concat": ["Save $", { "$string": { "$ref": "var:savings" } }] }] }
  ]
}
```

```jsx
const discountedPrice = Math.round(product.price * 0.85)
const savings         = Math.round(product.price - discountedPrice)
<ProductCard>
  <P>{`$${discountedPrice}`}</P>
  <Badge>{`Save $${savings}`}</Badge>
</ProductCard>
```

---

## env inside $map (iteration variable)

Inside `$map`, the `as` variable is automatically available as `var:<as>`.

```json
{
  "component": "Card",
  "children": [
    {
      "$map": {
        "over": { "$ref": "page.store:orders" },
        "as": "order",
        "return": {
          "component": "P",
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
          "children": [
            { "$concat": [{ "$ref": "var:order.id" }, " - Total: $", { "$string": { "$ref": "var:total" } }] }
          ]
        }
      }
    }
  ]
}
```

```jsx
state.orders.map(order => {
  const total = order.items.reduce((sum, item) => sum + item.price, 0)
  return <P>{`${order.id} - Total: $${total}`}</P>
})
```

---

## Nested env scopes

```json
{
  "component": "Card",
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
        { "component": "P", "children": [{ "$ref": "var:label" }] }
      ]
    }
  ]
}
```

```jsx
const isAdmin = state.user.role === "admin"
// isAdmin is in scope for the whole Card subtree

const label = isAdmin ? "Admin Dashboard" : "Dashboard"
<Card>
  <Card>
    <P>{label}</P>
  </Card>
</Card>
```

---

## env for conditional variant

```json
{
  "component": "Badge",
  "env": {
    "variant": {
      "$switch": {
        "on": { "$ref": "page.store:status" },
        "cases": {
          "active":  "default",
          "pending": "secondary",
          "error":   "destructive"
        },
        "default": "outline"
      }
    }
  },
  "props": {
    "variant": { "$ref": "var:variant" }
  },
  "children": [{ "$ref": "page.store:status" }]
}
```

```jsx
const variantMap = { active: "default", pending: "secondary", error: "destructive" }
const variant = variantMap[state.status] ?? "outline"
<Badge variant={variant}>{state.status}</Badge>
```
