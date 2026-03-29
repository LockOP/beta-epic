# Actions — Store Mutations

Actions are imperative sequences triggered by events. They mutate state — expressions cannot.

> Field name: `payload` (not `value`)

---

## page.store.update — set a value

```json
{
  "$action": [
    { "type": "page.store.update", "path": "count", "payload": 5 }
  ]
}
```

```js
state.count = 5
```


---

```json
{
  "$action": [
    {
      "type": "page.store.update",
      "path": "count",
      "payload": { "$add": [{ "$ref": "page.store:count" }, 1] }
    }
  ]
}
```

```js
state.count = state.count + 1
```


---

## Update nested path

```json
{
  "$action": [
    { "type": "page.store.update", "path": "user.profile.bio", "payload": { "$ref": "event.value" } }
  ]
}
```

```js
state.user.profile.bio = event.value
```


---

## page.store.reset — revert to initial value

```json
{
  "$action": [
    { "type": "page.store.reset", "path": "form" }
  ]
}
```

```js
state.form = initialState.form
```


---

```json
{
  "$action": [
    { "type": "page.store.reset" }
  ]
}
```

```js
state = { ...initialState }   // reset entire store
```


---

## Multiple updates in one action

```json
{
  "$action": [
    { "type": "page.store.update", "path": "loading", "payload": true },
    { "type": "page.store.update", "path": "error",   "payload": null },
    { "type": "page.store.update", "path": "data",    "payload": null }
  ]
}
```

```js
state.loading = true
state.error   = null
state.data    = null
```


---

## Toggle boolean

```json
{
  "component": "Toggle",
  "props": {
    "checked": { "$ref": "page.store:darkMode" },
    "onChange": {
      "$action": [
        {
          "type": "page.store.update",
          "path": "darkMode",
          "payload": { "$not": { "$ref": "page.store:darkMode" } }
        }
      ]
    }
  }
}
```

```jsx
<Toggle
  checked={state.darkMode}
  onChange={() => setState(prev => ({ ...prev, darkMode: !prev.darkMode }))}
/>
```


---

## Action reading from event

```json
{
  "component": "TextInput",
  "props": {
    "value": { "$ref": "page.store:query" },
    "onChange": {
      "$action": [
        { "type": "page.store.update", "path": "query", "payload": { "$ref": "event.value" } }
      ]
    }
  }
}
```

```jsx
<TextInput
  value={state.query}
  onChange={(e) => setState(prev => ({ ...prev, query: e.target.value }))}
/>
```


---

## Conditional update in action

```json
{
  "$action": [
    {
      "$if": {
        "cond": { "$gt": { "a": { "$ref": "page.store:count" }, "b": 0 } },
        "then": [
          { "type": "page.store.update", "path": "count", "payload": { "$sub": [{ "$ref": "page.store:count" }, 1] } }
        ]
      }
    }
  ]
}
```

```js
if (state.count > 0) {
  state.count = state.count - 1
}
```


---

## redux.dispatch — dispatch a named Redux action

> **Requires host-app wiring.** `redux.dispatch` reads `ctx.reduxDispatch` from the runtime context. The engine does not supply this — it is a **silent no-op** until the host app injects it. Contact your platform team to enable Redux dispatch from DSL actions.

```json
{
  "$action": [
    { "type": "redux.dispatch", "action": "cart/clear" }
  ]
}
```

```js
dispatch({ type: "cart/clear" })
```


---

```json
{
  "$action": [
    {
      "type": "redux.dispatch",
      "action": "cart/addItem",
      "payload": { "$ref": "page.store:selectedProduct" }
    }
  ]
}
```

```js
dispatch({ type: "cart/addItem", payload: state.selectedProduct })
```


---

## Side-effects alongside store updates

```json
{
  "$action": [
    { "type": "page.store.update", "path": "items", "payload": [] },
    { "type": "snackbar", "message": "Cart cleared", "variant": "success" },
    { "type": "console.log", "payload": "Cart was cleared" }
  ]
}
```

```js
state.items = []
showToast("Cart cleared", "success")
console.log("Cart was cleared")
```


---

## actions.group — serial (default) or parallel

```json
{
  "$action": [
    {
      "type": "actions.group",
      "mode": "serial",
      "actions": [
        { "type": "page.store.update", "path": "step",      "payload": 1 },
        { "type": "page.store.update", "path": "validated", "payload": true }
      ]
    }
  ]
}
```

```js
// serial: one after the other
state.step      = 1
state.validated = true
```


---

```json
{
  "$action": [
    {
      "type": "actions.group",
      "mode": "parallel",
      "actions": [
        { "type": "async.call", "call": { "$http": { "url": "/api/a", "method": "GET" } }, "onSuccess": [] },
        { "type": "async.call", "call": { "$http": { "url": "/api/b", "method": "GET" } }, "onSuccess": [] }
      ]
    }
  ]
}
```

```js
// parallel: both fire at the same time
await Promise.all([fetch("/api/a"), fetch("/api/b")])
```

