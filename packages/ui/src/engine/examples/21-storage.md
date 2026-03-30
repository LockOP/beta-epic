# Browser Storage — localStorage and sessionStorage

The DSL has built-in support for reading and writing browser storage. No function registration needed.

---

## Namespaces

| Operation | DSL |
| --------- | --- |
| Read localStorage | `{ "$ref": "local:key" }` |
| Read sessionStorage | `{ "$ref": "session:key" }` |
| Write localStorage | `{ "type": "local.set", "key": "...", "payload": <value> }` |
| Remove localStorage key | `{ "type": "local.remove", "key": "..." }` |
| Clear all localStorage | `{ "type": "local.clear" }` |
| Write sessionStorage | `{ "type": "session.set", "key": "...", "payload": <value> }` |
| Remove sessionStorage key | `{ "type": "session.remove", "key": "..." }` |
| Clear all sessionStorage | `{ "type": "session.clear" }` |

Values are automatically JSON-serialized on write and JSON-parsed on read. A missing key returns `null`.

---

## Reading — $ref

```json
{ "$ref": "local:theme" }
{ "$ref": "local:savedFilters" }
{ "$ref": "local:user.preferences.language" }

{ "$ref": "session:activeTab" }
{ "$ref": "session:wizardStep" }
```

```js
JSON.parse(localStorage.getItem("theme"))
JSON.parse(localStorage.getItem("savedFilters"))
JSON.parse(localStorage.getItem("user"))?.preferences?.language

JSON.parse(sessionStorage.getItem("activeTab"))
JSON.parse(sessionStorage.getItem("wizardStep"))
```

Dot-path traversal works for JSON objects stored under a single key:
`{ "$ref": "local:user.preferences.language" }` reads the `preferences.language` path inside the `user` key.

---

## Writing — actions

```json
{ "type": "local.set",    "key": "theme",       "payload": "dark" }
{ "type": "local.set",    "key": "savedFilters", "payload": { "$ref": "page.store:filters" } }
{ "type": "local.remove", "key": "theme" }
{ "type": "local.clear" }

{ "type": "session.set",    "key": "activeTab",  "payload": { "$ref": "event.value" } }
{ "type": "session.remove", "key": "activeTab" }
{ "type": "session.clear" }
```

`payload` accepts any expression — literals, `$ref`, `$if`, computed values, etc.

---

## Load saved value on mount

Restore a stored preference into the page store when the component mounts.

```json
{
  "effects": [
    {
      "deps": [],
      "run": [
        {
          "type": "page.store.update",
          "path": "theme",
          "payload": {
            "$if": {
              "cond": { "$neq": { "a": { "$ref": "local:theme" }, "b": null } },
              "then": { "$ref": "local:theme" },
              "else": "light"
            }
          }
        }
      ]
    }
  ]
}
```

```js
useEffect(() => {
  const saved = JSON.parse(localStorage.getItem("theme"))
  dispatch(setTheme(saved ?? "light"))
}, [])
```

---

## Persist on change (effect + deps)

Write to storage whenever a store field changes.

```json
{
  "effects": [
    {
      "deps": [{ "$ref": "page.store:filters" }],
      "run": [
        { "type": "local.set", "key": "savedFilters", "payload": { "$ref": "page.store:filters" } }
      ]
    }
  ]
}
```

```js
useEffect(() => {
  localStorage.setItem("savedFilters", JSON.stringify(filters))
}, [filters])
```

---

## Write and update store in the same action

```json
{
  "component": "NativeSelect",
  "props": {
    "value": { "$ref": "page.store:theme" },
    "onChange": {
      "$action": [
        { "type": "page.store.update", "path": "theme", "payload": { "$ref": "event.value" } },
        { "type": "local.set",         "key": "theme",  "payload": { "$ref": "event.value" } }
      ]
    }
  },
  "children": [
    { "component": "NativeSelectOption", "props": { "value": "light" }, "children": ["Light"] },
    { "component": "NativeSelectOption", "props": { "value": "dark" }, "children": ["Dark"] }
  ]
}
```

```js
const handleChange = (value) => {
  dispatch(setTheme(value))
  localStorage.setItem("theme", JSON.stringify(value))
}
```

---

## sessionStorage — wizard step

Save and restore a multi-step wizard's current step. Cleared automatically when the tab closes.

```json
{
  "effects": [
    {
      "deps": [],
      "run": [
        {
          "type": "page.store.update",
          "path": "step",
          "payload": {
            "$if": {
              "cond": { "$neq": { "a": { "$ref": "session:wizardStep" }, "b": null } },
              "then": { "$ref": "session:wizardStep" },
              "else": 0
            }
          }
        }
      ]
    },
    {
      "deps": [{ "$ref": "page.store:step" }],
      "run": [
        { "type": "session.set", "key": "wizardStep", "payload": { "$ref": "page.store:step" } }
      ]
    }
  ]
}
```

---

## Clear storage on logout

> `redux.dispatch` requires host-app wiring — it is a silent no-op without it. See [08-actions-store.md](./08-actions-store.md#redux-dispatch).

```json
{
  "$action": [
    { "type": "local.clear" },
    { "type": "session.clear" },
    { "type": "redux.dispatch", "action": "auth/logout" },
    { "type": "navigate", "to": "/login" }
  ]
}
```

---

## Reading storage in a selector

Storage refs are readable inside selectors, just like `page.store:` refs.

```json
{
  "selectors": {
    "effectiveTheme": {
      "$if": {
        "cond": { "$neq": { "a": { "$ref": "local:theme" }, "b": null } },
        "then": { "$ref": "local:theme" },
        "else": "light"
      }
    }
  }
}
```

---

## localStorage vs sessionStorage

```text
localStorage    persists across tabs, restarts, and browser closes
                use for: theme preference, saved filters, language, last route

sessionStorage  cleared when the tab closes
                use for: wizard step, scroll position, active tab, unsaved draft
```
