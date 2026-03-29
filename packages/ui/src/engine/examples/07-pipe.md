# $pipe — Left-to-Right Chaining

`$pipe` passes the output of each step as `$$` (implicit pipe value) to the next step. Avoids deeply nested expressions.

---

## Basic chaining

```json
{
  "$pipe": [
    { "$ref": "page.store:query" },
    { "$trim": "$$" },
    { "$lower": "$$" }
  ]
}
```

```js
state.query.trim().toLowerCase()
```

---

## String transform chain

```json
{
  "$pipe": [
    { "$ref": "page.store:title" },
    { "$trim": "$$" },
    { "$slice": { "value": "$$", "start": 0, "end": 60 } },
    { "$concat": ["$$", "…"] }
  ]
}
```

```js
state.title.trim().slice(0, 60) + "…"
```

---

## Number to display label

```json
{
  "$pipe": [
    { "$ref": "page.store:count" },
    { "$string": "$$" },
    { "$concat": ["$$", " results"] }
  ]
}
```

```js
`${state.count} results`
```

---

## Array chain: filter → sort → slice

```json
{
  "$pipe": [
    { "$ref": "page.store:items" },
    { "$filter": { "over": "$$", "as": "i", "where": { "$ref": "var:i.active" } } },
    { "$sort":   { "over": "$$", "by": { "$ref": "var:item.name" }, "dir": "asc" } },
    { "$slice":  { "over": "$$", "start": 0, "end": 10 } }
  ]
}
```

```js
state.items
  .filter(i => i.active)
  .sort((a, b) => a.name < b.name ? -1 : a.name > b.name ? 1 : 0)
  .slice(0, 10)
```

---

## Array → aggregate → display

```json
{
  "$pipe": [
    { "$ref": "page.store:orders" },
    {
      "$reduce": {
        "over": "$$",
        "as": "order",
        "acc": "sum",
        "init": 0,
        "return": { "$add": [{ "$ref": "var:sum" }, { "$ref": "var:order.total" }] }
      }
    },
    { "$round": "$$" },
    { "$string": "$$" },
    { "$concat": ["$", "$$"] }
  ]
}
```

```js
"$" + String(Math.round(state.orders.reduce((sum, order) => sum + order.total, 0)))
```

---

## Without $pipe (nested — hard to read)

```json
{
  "$concat": [
    "$",
    {
      "$string": {
        "$round": {
          "$reduce": {
            "over": { "$ref": "page.store:orders" },
            "as": "order",
            "acc": "sum",
            "init": 0,
            "return": { "$add": [{ "$ref": "var:sum" }, { "$ref": "var:order.total" }] }
          }
        }
      }
    }
  ]
}
```

Same result as the `$pipe` version above — but reads inside-out. Use `$pipe` when there are 3+ steps.

---

## Pipe feeding into a prop

```json
{
  "component": "Badge",
  "props": {
    "label": {
      "$pipe": [
        { "$ref": "page.store:unreadCount" },
        { "$clamp": { "value": "$$", "min": 0, "max": 99 } },
        { "$string": "$$" },
        { "$if": { "cond": { "$gte": { "a": { "$ref": "page.store:unreadCount" }, "b": 99 } }, "then": { "$concat": ["$$", "+"] }, "else": "$$" } }
      ]
    }
  }
}
```

```js
const clamped = Math.min(Math.max(state.unreadCount, 0), 99)
const label   = state.unreadCount >= 99 ? `${clamped}+` : String(clamped)
<Badge label={label} />
```

---

## Pipe + env (local variable)

```json
{
  "component": "Card",
  "env": {
    "displayPrice": {
      "$pipe": [
        { "$ref": "page.store:product.price" },
        { "$mul": ["$$", 1.1] },
        { "$round": "$$" },
        { "$concat": ["$", { "$string": "$$" }] }
      ]
    }
  },
  "children": [
    { "component": "Text", "props": { "content": { "$ref": "var:displayPrice" } } }
  ]
}
```

```jsx
const displayPrice = "$" + String(Math.round(state.product.price * 1.1))
<Card>
  <Text content={displayPrice} />
</Card>
```
