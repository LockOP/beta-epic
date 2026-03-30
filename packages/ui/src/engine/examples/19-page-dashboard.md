# Combined Example — Dashboard with Parallel Fetch + Live Subscription

Parallel data loading, live WebSocket subscription with cleanup, debounced chart refetch, derived KPIs, dark mode toggle. Persists timeRange and colorScheme to localStorage. Uses: `effects`, `selectors`, `actions.group`, `$fn`, `async.call`, `local.set`, `local:`.

> **These component names are not in the default registry.** `DashboardLayout`, `KpiRow`, `KpiCard`, `TopBar`, `AlertBadge`, `LineChart` etc. must be registered via `<GuiProvider components={{ ... }}>` before this config will render. The DSL patterns themselves are correct and complete.

---

## Initial state

```json
{
  "stats":       null,
  "alerts":      [],
  "chartData":   [],
  "timeRange":   "7d",
  "colorScheme": "light",
  "loading":     true
}
```

---

## DSL config

`selectors` declared on `DashboardLayout` — available to every child panel but not to anything that renders this dashboard from outside.

```json
{
  "component": "DashboardLayout",
  "selectors": {
    "criticalAlerts": {
      "$filter": {
        "over": { "$ref": "page.store:alerts" },
        "as": "a",
        "where": { "$eq": { "a": { "$ref": "var:a.severity" }, "b": "critical" } }
      }
    },
    "alertBadge": {
      "$pipe": [
        { "$count": { "$ref": "selectors:criticalAlerts" } },
        { "$clamp": { "value": "$$", "min": 0, "max": 99 } },
        { "$string": "$$" },
        {
          "$if": {
            "cond": { "$gte": { "a": { "$count": { "$ref": "selectors:criticalAlerts" } }, "b": 99 } },
            "then": { "$concat": ["$$", "+"] },
            "else": "$$"
          }
        }
      ]
    },
    "revenueFormatted": {
      "$fn": "formatCurrency",
      "args": [{ "$ref": "page.store:stats.revenue" }, "USD"]
    },
    "isDark": {
      "$eq": { "a": { "$ref": "page.store:colorScheme" }, "b": "dark" }
    }
  },
  "effects": [
    {
      "deps": [],
      "run": [
        {
          "type": "page.store.update",
          "path": "timeRange",
          "payload": {
            "$if": {
              "cond": { "$neq": { "a": { "$ref": "local:dashboard.timeRange" }, "b": null } },
              "then": { "$ref": "local:dashboard.timeRange" },
              "else": "7d"
            }
          }
        },
        {
          "type": "page.store.update",
          "path": "colorScheme",
          "payload": {
            "$if": {
              "cond": { "$neq": { "a": { "$ref": "local:dashboard.colorScheme" }, "b": null } },
              "then": { "$ref": "local:dashboard.colorScheme" },
              "else": "light"
            }
          }
        },
        {
          "type": "actions.group",
          "mode": "parallel",
          "actions": [
            {
              "type": "async.call",
              "call": { "$http": { "method": "GET", "url": "/api/stats" } },
              "onSuccess": [{ "type": "page.store.update", "path": "stats", "payload": { "$ref": "result" } }]
            },
            {
              "type": "async.call",
              "call": { "$http": { "method": "GET", "url": "/api/alerts" } },
              "onSuccess": [{ "type": "page.store.update", "path": "alerts", "payload": { "$ref": "result" } }]
            }
          ]
        },
        { "type": "page.store.update", "path": "loading", "payload": false }
      ]
    },
    {
      "deps": [{ "$ref": "page.store:timeRange" }],
      "debounce": 300,
      "run": [
        {
          "type": "async.call",
          "call": {
            "$http": {
              "method": "GET",
              "url":    "/api/chart",
              "params": { "range": { "$ref": "page.store:timeRange" } }
            }
          },
          "onSuccess": [{ "type": "page.store.update", "path": "chartData", "payload": { "$ref": "result" } }]
        }
      ]
    },
    {
      "deps": [{ "$ref": "page.store:timeRange" }, { "$ref": "page.store:colorScheme" }],
      "run": [
        {
          "type": "local.set",
          "key": "dashboard",
          "payload": {
            "$merge": [
              { "timeRange":   { "$ref": "page.store:timeRange" } },
              { "colorScheme": { "$ref": "page.store:colorScheme" } }
            ]
          }
        }
      ]
    },
    {
      "deps": [],
      "run": [
        {
          "type": "async.call",
          "call": { "$fn": "subscribeToAlerts", "args": [] },
          "onSuccess": [
            { "type": "page.store.update", "path": "alerts", "payload": { "$ref": "result" } }
          ]
        }
      ],
      "cleanup": [
        { "type": "async.call", "call": { "$fn": "unsubscribeFromAlerts", "args": [] } }
      ]
    }
  ],
  "props": {
    "darkMode": { "$ref": "selectors:isDark" }
  },
  "children": [
    {
      "component": "TopBar",
      "children": [
        {
          "component": "AlertBadge",
          "props": {
            "count":    { "$ref": "selectors:alertBadge" },
            "critical": { "$gt": { "a": { "$count": { "$ref": "selectors:criticalAlerts" } }, "b": 0 } }
          }
        },
        {
          "component": "Button",
          "props": {
            "variant": "ghost",
            "onClick": {
              "$action": [
                {
                  "type": "page.store.update",
                  "path": "colorScheme",
                  "payload": {
                    "$if": {
                      "cond": { "$ref": "selectors:isDark" },
                      "then": "light",
                      "else": "dark"
                    }
                  }
                }
              ]
            }
          },
          "children": [
            {
              "$if": {
                "cond": { "$ref": "selectors:isDark" },
                "then": "Light mode",
                "else": "Dark mode"
              }
            }
          ]
        }
      ]
    },
    {
      "component": "KpiRow",
      "children": [
        { "component": "KpiCard", "props": { "label": "Revenue", "value": { "$ref": "selectors:revenueFormatted" } } },
        { "component": "KpiCard", "props": { "label": "Users",   "value": { "$fn": "formatNumber", "args": [{ "$ref": "page.store:stats.userCount" }] } } },
        { "component": "KpiCard", "props": { "label": "Orders",  "value": { "$fn": "formatNumber", "args": [{ "$ref": "page.store:stats.orderCount" }] } } }
      ]
    },
    {
      "component": "Row",
      "children": [
        {
          "component": "NativeSelect",
          "props": {
            "value": { "$ref": "page.store:timeRange" },
            "onChange": {
              "$action": [
                { "type": "page.store.update", "path": "timeRange", "payload": { "$ref": "event.value" } }
              ]
            }
          },
          "children": [
            { "component": "NativeSelectOption", "props": { "value": "7d" }, "children": ["Last 7 days"] },
            { "component": "NativeSelectOption", "props": { "value": "30d" }, "children": ["Last 30 days"] },
            { "component": "NativeSelectOption", "props": { "value": "90d" }, "children": ["Last 90 days"] }
          ]
        }
      ]
    },
    {
      "component": "LineChart",
      "props": { "data": { "$ref": "page.store:chartData" } }
    }
  ]
}
```

---

## What to notice

- `selectors` on `DashboardLayout` — `isDark`, `alertBadge`, `criticalAlerts`, `revenueFormatted` are available to `TopBar`, `KpiRow`, and all descendants, but not to any parent that embeds this dashboard
- **Four effects:** restore prefs from localStorage + parallel fetch → debounced chart → persist prefs → one-shot fetch with cleanup
- `$merge` combines two `$ref` values into one object before `local.set`
- `local:dashboard.timeRange` reads a nested field from the stored JSON object
- `colorScheme` lives in the page store (source of truth) — toggle updates the store, persist effect syncs to localStorage
- `alertBadge` uses `$pipe` with a conditional to append "+" when count ≥ 99
- The fourth effect's `cleanup` unsubscribes on unmount. `async.call` is one-shot — `onSuccess` fires once with the resolved value. Registered functions have no dispatch access, so subsequent socket events cannot push further updates into the store. For polling, use a deps-based effect that refetches when watched state changes; add `debounce` for rate-limiting.
