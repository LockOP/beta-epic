# Conditionals

## $if — ternary

```json
{
  "$if": {
    "cond": { "$ref": "page.store:isLoggedIn" },
    "then": "Welcome back!",
    "else": "Please log in."
  }
}
```

```js
state.isLoggedIn ? "Welcome back!" : "Please log in."
```

---

```json
{
  "$if": {
    "cond": { "$gt": { "a": { "$ref": "page.store:count" }, "b": 0 } },
    "then": { "$ref": "page.store:count" },
    "else": 0
  }
}
```

```js
state.count > 0 ? state.count : 0
```

---

## $if — conditional component render

```json
{
  "$if": {
    "cond": { "$ref": "page.store:isAdmin" },
    "then": { "component": "AdminPanel" },
    "else": { "component": "ViewerPanel" }
  }
}
```

```jsx
state.isAdmin ? <AdminPanel /> : <ViewerPanel />
```

---

## $switch — multi-branch value

```json
{
  "$switch": {
    "on": { "$ref": "page.store:status" },
    "cases": {
      "loading": "Loading…",
      "error":   "Something went wrong.",
      "success": "All done!"
    },
    "default": "Unknown state"
  }
}
```

```js
const map = { loading: "Loading…", error: "Something went wrong.", success: "All done!" }
map[state.status] ?? "Unknown state"
```

---

## $switch — multi-branch component

```json
{
  "$switch": {
    "on": { "$ref": "page.store:role" },
    "cases": {
      "admin":  { "component": "AdminPanel" },
      "editor": { "component": "EditorPanel" }
    },
    "default": { "component": "ViewerPanel" }
  }
}
```

```jsx
const panels = { admin: <AdminPanel />, editor: <EditorPanel /> }
panels[state.role] ?? <ViewerPanel />
```

---

## Nested $if

```json
{
  "$if": {
    "cond": { "$ref": "page.store:loading" },
    "then": { "component": "Spinner" },
    "else": {
      "$if": {
        "cond": { "$neq": { "a": { "$ref": "page.store:error" }, "b": null } },
        "then": { "component": "ErrorBanner" },
        "else": { "component": "DataTable" }
      }
    }
  }
}
```

```jsx
state.loading
  ? <Spinner />
  : state.error != null
    ? <ErrorBanner />
    : <DataTable />
```

---

## $if inside a prop

```json
{
  "component": "Button",
  "props": {
    "label": "Submit",
    "variant": {
      "$if": {
        "cond": { "$ref": "selectors:canSubmit" },
        "then": "primary",
        "else": "ghost"
      }
    },
    "disabled": { "$not": { "$ref": "selectors:canSubmit" } }
  }
}
```

```jsx
<Button
  label="Submit"
  variant={canSubmit ? "primary" : "ghost"}
  disabled={!canSubmit}
/>
```

---

## $switch driving a color

```json
{
  "component": "Badge",
  "props": {
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
  "children": [{ "$ref": "page.store:status" }]
}
```

```jsx
const variantMap = { active: "default", pending: "secondary", error: "destructive" }
<Badge variant={variantMap[state.status] ?? "outline"}>{state.status}</Badge>
```
