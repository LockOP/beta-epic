# Effects

Effects are the DSL equivalent of `useEffect`. They are declared on any `ComponentNode` in an `effects[]` array.

---

## Run once on mount

```json
{
  "component": "Page",
  "effects": [
    {
      "deps": [],
      "run": [
        {
          "type": "async.call",
          "call": { "$http": { "method": "GET", "url": "/api/data" } },
          "onSuccess": [
            { "type": "page.store.update", "path": "data", "payload": { "$ref": "result" } }
          ]
        }
      ]
    }
  ]
}
```

```js
useEffect(() => {
  fetch("/api/data").then(r => r.json()).then(data => setState(prev => ({ ...prev, data })))
}, [])
```

---

## Run on mount + when dep changes

```json
{
  "effects": [
    {
      "deps": [{ "$ref": "page.store:activeTab" }],
      "run": [
        {
          "type": "async.call",
          "call": {
            "$http": {
              "method": "GET",
              "url": "/api/items",
              "params": { "tab": { "$ref": "page.store:activeTab" } }
            }
          },
          "onSuccess": [
            { "type": "page.store.update", "path": "items", "payload": { "$ref": "result" } }
          ]
        }
      ]
    }
  ]
}
```

```js
useEffect(() => {
  fetch(`/api/items?tab=${state.activeTab}`).then(r => r.json()).then(items => setState(prev => ({ ...prev, items })))
}, [state.activeTab])
```

---

## Debounced reactive effect (search)

```json
{
  "effects": [
    {
      "deps": [{ "$ref": "page.store:query" }],
      "debounce": 300,
      "run": [
        {
          "type": "async.call",
          "call": { "$http": { "method": "GET", "url": "/api/search", "params": { "q": { "$ref": "page.store:query" } } } },
          "onSuccess": [
            { "type": "page.store.update", "path": "results", "payload": { "$ref": "result" } }
          ]
        }
      ]
    }
  ]
}
```

```js
useEffect(() => {
  const timer = setTimeout(() => {
    fetch(`/api/search?q=${state.query}`).then(r => r.json()).then(results => setState(prev => ({ ...prev, results })))
  }, 300)
  return () => clearTimeout(timer)
}, [state.query])
```

---

## Multiple deps

```json
{
  "effects": [
    {
      "deps": [
        { "$ref": "page.store:filters.category" },
        { "$ref": "page.store:filters.minPrice" },
        { "$ref": "page.store:page" }
      ],
      "run": [
        {
          "type": "async.call",
          "call": { "$fn": "fetchProducts", "args": [{ "$ref": "page.store:filters" }, { "$ref": "page.store:page" }] },
          "onSuccess": [
            { "type": "page.store.update", "path": "products", "payload": { "$ref": "result" } }
          ]
        }
      ]
    }
  ]
}
```

```js
useEffect(() => {
  fetchProducts(state.filters, state.page).then(products => setState(prev => ({ ...prev, products })))
}, [state.filters.category, state.filters.minPrice, state.page])
```

---

## Conditional skip inside effect (use $if action)

```json
{
  "effects": [
    {
      "deps": [{ "$ref": "page.store:userId" }],
      "run": [
        {
          "$if": {
            "cond": { "$isNotNil": { "$ref": "page.store:userId" } },
            "then": [
              {
                "type": "async.call",
                "call": { "$fn": "fetchUserProfile", "args": [{ "$ref": "page.store:userId" }] },
                "onSuccess": [
                  { "type": "page.store.update", "path": "profile", "payload": { "$ref": "result" } }
                ]
              }
            ]
          }
        }
      ]
    }
  ]
}
```

```js
useEffect(() => {
  if (state.userId == null) return
  fetchUserProfile(state.userId).then(profile => setState(prev => ({ ...prev, profile })))
}, [state.userId])
```

---

## Cleanup — unsubscribe / cancel

```json
{
  "effects": [
    {
      "deps": [{ "$ref": "page.store:roomId" }],
      "run": [
        {
          "type": "async.call",
          "call": { "$fn": "subscribeToRoom", "args": [{ "$ref": "page.store:roomId" }] }
        }
      ],
      "cleanup": [
        {
          "type": "async.call",
          "call": { "$fn": "unsubscribeFromRoom", "args": [{ "$ref": "page.store:roomId" }] }
        }
      ]
    }
  ]
}
```

```js
useEffect(() => {
  subscribeToRoom(state.roomId)
  return () => {
    unsubscribeFromRoom(state.roomId)
  }
}, [state.roomId])
```

---

## Multiple effects on one node

```json
{
  "component": "Dashboard",
  "effects": [
    {
      "deps": [],
      "run": [
        { "type": "async.call", "call": { "$fn": "fetchStats",  "args": [] }, "onSuccess": [{ "type": "page.store.update", "path": "stats",  "payload": { "$ref": "result" } }] },
        { "type": "async.call", "call": { "$fn": "fetchAlerts", "args": [] }, "onSuccess": [{ "type": "page.store.update", "path": "alerts", "payload": { "$ref": "result" } }] }
      ]
    },
    {
      "deps": [{ "$ref": "page.store:timeRange" }],
      "debounce": 200,
      "run": [
        { "type": "async.call", "call": { "$fn": "fetchChart", "args": [{ "$ref": "page.store:timeRange" }] }, "onSuccess": [{ "type": "page.store.update", "path": "chartData", "payload": { "$ref": "result" } }] }
      ]
    }
  ]
}
```

```js
// Two separate useEffect hooks on the same component
useEffect(() => {
  fetchStats().then(stats => setState(prev => ({ ...prev, stats })))
  fetchAlerts().then(alerts => setState(prev => ({ ...prev, alerts })))
}, [])

useEffect(() => {
  const t = setTimeout(() => {
    fetchChart(state.timeRange).then(chartData => setState(prev => ({ ...prev, chartData })))
  }, 200)
  return () => clearTimeout(t)
}, [state.timeRange])
```

---

## Effect with loading state

Use `loading` shorthand on `async.call` — it automatically sets the path to `true` before the call and `false` after (whether success or error):

```json
{
  "effects": [
    {
      "deps": [],
      "run": [
        {
          "type": "async.call",
          "call": { "$http": { "method": "GET", "url": "/api/init" } },
          "loading": "loading",
          "onSuccess": [
            { "type": "page.store.update", "path": "data", "payload": { "$ref": "result" } }
          ],
          "onError": [
            { "type": "page.store.update", "path": "error", "payload": { "$ref": "error.message" } }
          ]
        }
      ]
    }
  ]
}
```

```js
useEffect(() => {
  setState(prev => ({ ...prev, loading: true }))
  fetch("/api/init").then(r => r.json())
    .then(data => setState(prev => ({ ...prev, data, loading: false })))
    .catch(err => setState(prev => ({ ...prev, error: err.message, loading: false })))
}, [])
```

---

## debounce + cleanup together

When both are set, on every dep change the engine:

1. Cancels the pending debounce timer (if it hadn't fired yet)
2. Runs the cleanup from the **previous actual run** (not from any debounced-but-canceled run)
3. Waits debounce ms
4. Runs `run` (which registers the new cleanup for the next cycle)

**Cleanup is only registered after `run` actually executes.** If a debounced run is canceled before its timer fires, it never registered a cleanup — so there is nothing to clean up for that canceled run.

Also: **initial mount always runs immediately** regardless of `debounce`. Debounce only applies to re-runs.

```json
{
  "component": "ChatRoom",
  "effects": [
    {
      "deps": [{ "$ref": "page.store:roomId" }],
      "debounce": 500,
      "run": [
        {
          "type": "async.call",
          "call": { "$fn": "subscribeToRoom", "args": [{ "$ref": "page.store:roomId" }] }
        }
      ],
      "cleanup": [
        {
          "type": "async.call",
          "call": { "$fn": "unsubscribeFromRoom", "args": [{ "$ref": "page.store:roomId" }] }
        }
      ]
    }
  ]
}
```

```text
initial mount (roomId = "A"):
  debounce skipped → subscribeToRoom("A") runs immediately
  cleanup registered: unsubscribeFromRoom("A")

roomId changes to "B":
  1. cancel pending 500ms timer (none)
  2. unsubscribeFromRoom("A")   ← cleanup from A's actual run
  3. cleanup ref cleared (null)
  4. wait 500ms
  5. subscribeToRoom("B") runs
  6. cleanup registered: unsubscribeFromRoom("B")

roomId changes to "C" before 500ms elapses (B's timer canceled):
  1. cancel the pending 500ms timer for "B"
  2. cleanup ref is null — nothing runs   ← B never ran, so no cleanup was registered for B
  3. wait 500ms
  4. subscribeToRoom("C") runs
  5. cleanup registered: unsubscribeFromRoom("C")

unmount:
  1. cancel any pending timer
  2. unsubscribeFromRoom("C")   ← cleanup from C's actual run
```

Guard your cleanup function against the case where `run` never fired (e.g. if deps change on mount before the debounce fires):

```js
registerFunction("unsubscribeFromRoom", async (roomId) => {
  const sub = activeSubscriptions.get(roomId)
  if (!sub) return  // ← guard: nothing to clean up
  sub.close()
  activeSubscriptions.delete(roomId)
})
```

```js
// React equivalent
useEffect(() => {
  let timer: ReturnType<typeof setTimeout>

  if (isInitialMount) {
    subscribeToRoom(state.roomId)
  } else {
    timer = setTimeout(() => {
      subscribeToRoom(state.roomId)
    }, 500)
  }

  return () => {
    clearTimeout(timer)                  // step 1: cancel debounce
    unsubscribeFromRoom(state.roomId)    // step 2: cleanup
  }
}, [state.roomId])
```
