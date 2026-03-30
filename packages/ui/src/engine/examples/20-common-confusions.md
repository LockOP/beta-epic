# Common Confusions

Side-by-side patterns that are easy to mix up.

---

## 1. $fn vs async.call — wrong context

```json
// WRONG — $fn in a prop tries to call fetchUser synchronously
// If fetchUser is async it returns a Promise object, not the user
{
  "component": "P",
  "children": [{ "$fn": "fetchUser", "args": [1] }]
}
```

```json
// RIGHT — async work in an effect, result stored in state, prop reads state
{
  "component": "P",
  "children": [{ "$ref": "page.store:user.name" }],
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

## 2. $http vs $fn — which to use for API calls

```json
// $http — no registration needed, inline URL, good for one-off endpoints
{
  "type": "async.call",
  "call": { "$http": { "method": "GET", "url": "/api/users" } },
  "onSuccess": [...]
}
```

```json
// $fn — registered async function, good when you need retry logic, auth headers,
// caching, or the call is reused across multiple configs
{
  "type": "async.call",
  "call": { "$fn": "fetchUsers", "args": [] },
  "onSuccess": [...]
}
```

```js
// When to use which:
// $http  → simple, direct, no shared logic
// $fn    → complex, shared, needs wrapping (auth, retry, transform)
```

---

## 3. page.store.update — payload vs value (wrong field name)

```json
// WRONG — "value" is not a recognised field; "payload" is undefined, which evaluates to null
// The path is set to null, not 1
{ "type": "page.store.update", "path": "count", "value": 1 }
```

```json
// RIGHT
{ "type": "page.store.update", "path": "count", "payload": 1 }
```

---

## 4. try block — "body" vs "try"

```json
// WRONG — "body" is not recognised
{
  "type": "try",
  "body": [{ "type": "async.call", ... }],
  "catch": [...]
}
```

```json
// RIGHT — the key is "try"
{
  "type": "try",
  "try": [{ "type": "async.call", ... }],
  "catch": [...]
}
```

---

## 5. selectors — wrong ref prefix

```json
// WRONG — reads from raw store, which doesn't have "fullName" unless you set it
{ "$ref": "page.store:fullName" }
```

```json
// RIGHT — selectors have their own namespace
{ "$ref": "selectors:fullName" }
```

---

## 6. env inside $map — how to access the iteration variable

```json
// WRONG — "item" is not a top-level store field
{
  "$map": {
    "over": { "$ref": "page.store:items" },
    "as": "item",
    "return": {
      "component": "P",
      "children": [{ "$ref": "page.store:item.name" }]
    }
  }
}
```

```json
// RIGHT — iteration variable lives in env:
{
  "$map": {
    "over": { "$ref": "page.store:items" },
    "as": "item",
    "return": {
      "component": "P",
      "children": [{ "$ref": "var:item.name" }]
    }
  }
}
```

---

## 7. snackbar — variant vs type

```json
// WRONG — "type" is the action discriminator, not the toast level
{ "type": "snackbar", "message": "Done", "type": "success" }
```

```json
// RIGHT
{ "type": "snackbar", "message": "Done", "variant": "success" }
```

---

## 8. debounce + cleanup — cleanup only fires for runs that actually executed

Cleanup is registered **after `run` executes**. If a debounced run is canceled before its timer fires, no cleanup is registered for that canceled run — only the cleanup from the previous actual run fires.

```json
{
  "deps": [{ "$ref": "page.store:roomId" }],
  "debounce": 500,
  "run": [
    { "type": "async.call", "call": { "$fn": "subscribeToRoom", "args": [{ "$ref": "page.store:roomId" }] } }
  ],
  "cleanup": [
    { "type": "async.call", "call": { "$fn": "unsubscribeFromRoom", "args": [{ "$ref": "page.store:roomId" }] } }
  ]
}
```

```
Timeline when roomId changes faster than 500ms:

  roomId → "A" (mount): subscribeToRoom("A") runs immediately (debounce skipped)
                         cleanup registered: unsubscribeFromRoom("A")
  roomId → "B": unsubscribeFromRoom("A") runs  ← cleanup from A's actual run
                cleanup ref cleared, timer set for 500ms
  roomId → "C" (before 500ms): timer cancelled
                nothing runs  ← B never executed, so no cleanup was registered for B
                timer set for 500ms
  500ms passes: subscribeToRoom("C") runs
                cleanup registered: unsubscribeFromRoom("C")
```

Still guard your cleanup against double-calls (e.g. if deps change on mount before debounce fires):

```js
registerFunction("unsubscribeFromRoom", async (roomId) => {
  const sub = activeSubscriptions.get(roomId)
  if (!sub) return  // ← guard: nothing to clean up
  sub.close()
  activeSubscriptions.delete(roomId)
})
```

---

## 9. Multiple API call patterns — when to use each

```json
// Pattern A: $http directly — simple, inline
{
  "type": "async.call",
  "call": { "$http": { "method": "GET", "url": "/api/data" } },
  "onSuccess": [...]
}
```

```json
// Pattern B: $fn with registered async fn — shared logic, auth, transform
{
  "type": "async.call",
  "call": { "$fn": "fetchDashboardData", "args": [{ "$ref": "page.store:filters" }] },
  "onSuccess": [...]
}
```

```json
// Pattern C: loading shorthand — auto-manages a boolean store field
{
  "type": "async.call",
  "call": { "$http": { "method": "GET", "url": "/api/data" } },
  "loading": "isFetching",
  "onSuccess": [...]
}
```

```json
// Pattern D: parallel via actions.group
{
  "type": "actions.group",
  "mode": "parallel",
  "actions": [
    { "type": "async.call", "call": { "$http": { "method": "GET", "url": "/api/a" } }, "onSuccess": [...] },
    { "type": "async.call", "call": { "$http": { "method": "GET", "url": "/api/b" } }, "onSuccess": [...] }
  ]
}
```

```json
// Pattern E: in an effect with debounce (search)
{
  "deps": [{ "$ref": "page.store:query" }],
  "debounce": 300,
  "run": [{
    "type": "async.call",
    "call": { "$http": { "method": "GET", "url": "/api/search", "params": { "q": { "$ref": "page.store:query" } } } },
    "onSuccess": [{ "type": "page.store.update", "path": "results", "payload": { "$ref": "result" } }]
  }]
}
```

```
Use A when: one-off endpoint, no shared logic
Use B when: reused call, needs auth/retry/transform on the function side
Use C when: you want a loading flag without manually setting it before/after
Use D when: multiple independent calls that can run simultaneously
Use E when: the call should fire reactively when state changes (with optional debounce)
```

---

## 10. $ref in action payload vs expression context

```json
// In an expression (prop value) — evaluates immediately at render time
{
  "component": "P",
  "children": [{ "$ref": "page.store:name" }]
}
```

```json
// In an action payload — evaluates at the moment the action fires (event time)
{
  "type": "page.store.update",
  "path": "snapshot",
  "payload": { "$ref": "page.store:name" }
}
```

```js
// Expression:  re-evaluates on every render when store.name changes
// Action payload: reads store.name at the moment the button is clicked

// These are NOT the same if the store changes between renders and the click
```
