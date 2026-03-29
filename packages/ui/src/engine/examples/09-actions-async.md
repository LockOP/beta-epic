# Actions — Async & HTTP

Async work only happens in action context. Expressions are always synchronous.

> `async.call` uses `call`. `try` block key is `try` (not `body`).

---

## async.call — call a registered function

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
try {
  const result = await fetchUser(state.userId)
  state.user = result
} catch (error) {
  state.error = error.message
}
```

---

## $http — inline fetch

```json
{
  "type": "async.call",
  "call": {
    "$http": {
      "method": "GET",
      "url": "/api/products",
      "params": { "category": { "$ref": "page.store:activeCategory" } }
    }
  },
  "onSuccess": [
    { "type": "page.store.update", "path": "products", "payload": { "$ref": "result" } }
  ],
  "onError": [
    { "type": "page.store.update", "path": "error", "payload": { "$ref": "error.message" } }
  ]
}
```

```js
const result = await fetch(`/api/products?category=${state.activeCategory}`).then(r => r.json())
state.products = result
```

---

## POST with body

```json
{
  "type": "async.call",
  "call": {
    "$http": {
      "method": "POST",
      "url": "/api/orders",
      "data": { "$ref": "page.store:form" },
      "headers": { "Content-Type": "application/json" }
    }
  },
  "onSuccess": [
    { "type": "page.store.update", "path": "orderId", "payload": { "$ref": "result.id" } },
    { "type": "snackbar", "message": "Order placed!", "variant": "success" },
    { "type": "navigate", "to": "/orders" }
  ],
  "onError": [
    { "type": "snackbar", "message": { "$ref": "error.message" }, "variant": "error" }
  ]
}
```

```js
const result = await fetch("/api/orders", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify(state.form),
}).then(r => r.json())
state.orderId = result.id
```

---

## loading shorthand — auto sets a store path true/false

```json
{
  "type": "async.call",
  "call": { "$http": { "method": "GET", "url": "/api/data" } },
  "loading": "isFetching",
  "onSuccess": [
    { "type": "page.store.update", "path": "data", "payload": { "$ref": "result" } }
  ]
}
```

```js
state.isFetching = true
const data = await fetch("/api/data").then(r => r.json())
state.data = data
state.isFetching = false
```

---

## Error handling — use onError on async.call

`async.call` catches its own errors internally. Use `onError` — not an outer `type: "try"` — to handle async failures.

```json
{
  "type": "async.call",
  "call": { "$http": { "method": "DELETE", "url": "/api/items/42" } },
  "onSuccess": [
    { "type": "page.store.update", "path": "submitting", "payload": false },
    { "type": "page.store.reset",  "path": "selectedItem" },
    { "type": "snackbar", "message": "Deleted", "variant": "success" }
  ],
  "onError": [
    { "type": "page.store.update", "path": "submitting", "payload": false },
    { "type": "page.store.update", "path": "error",      "payload": { "$ref": "error.message" } },
    { "type": "snackbar", "message": "Delete failed", "variant": "error" }
  ]
}
```

```js
try {
  await fetch("/api/items/42", { method: "DELETE" })
  state.submitting = false
  state.selectedItem = initialState.selectedItem
  toast("Deleted", "success")
} catch (error) {
  state.submitting = false
  state.error = error.message
  toast("Delete failed", "error")
}
```

---

## try / catch / finally — for non-async action sequences

`type: "try"` wraps **synchronous** actions that may throw (e.g., `redux.dispatch` with a throwing reducer). It does **not** catch errors from `async.call` — those are already caught internally.

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

```js
try {
  dispatch(cartCheckout())
} catch (error) {
  toast(error.message, "error")
} finally {
  state.submitting = false
}
```

---

## actions.group — parallel async calls

```json
{
  "type": "actions.group",
  "mode": "parallel",
  "actions": [
    {
      "type": "async.call",
      "call": { "$fn": "fetchUser",   "args": [{ "$ref": "page.store:userId" }] },
      "onSuccess": [{ "type": "page.store.update", "path": "user",   "payload": { "$ref": "result" } }]
    },
    {
      "type": "async.call",
      "call": { "$fn": "fetchOrders", "args": [{ "$ref": "page.store:userId" }] },
      "onSuccess": [{ "type": "page.store.update", "path": "orders", "payload": { "$ref": "result" } }]
    }
  ]
}
```

```js
await Promise.all([
  fetchUser(state.userId).then(user     => { state.user   = user }),
  fetchOrders(state.userId).then(orders => { state.orders = orders }),
])
```
