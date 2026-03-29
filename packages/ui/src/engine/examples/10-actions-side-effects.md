# Actions — Side Effects

Sync actions that produce an immediate effect outside the store (navigation, UI feedback, browser APIs, logging).

---

## navigate

```json
{ "type": "navigate", "to": "/dashboard" }
```

```js
router.push("/dashboard")
```

---

```json
{ "type": "navigate", "to": { "$ref": "page.store:redirectUrl" } }
```

```js
router.push(state.redirectUrl)
```

---

## window.open

```json
{ "type": "window.open", "url": { "$ref": "page.store:docUrl" }, "target": "_blank" }
```

```js
window.open(state.docUrl, "_blank")
```

---

## snackbar / toast

```json
{ "type": "snackbar", "message": "Saved!", "variant": "success" }
```

```json
{ "type": "snackbar", "message": "Something went wrong", "variant": "error" }
```

```json
{ "type": "snackbar", "message": "Heads up", "variant": "warning" }
```

```json
{ "type": "snackbar", "message": "FYI", "variant": "info" }
```

```js
toast("Saved!", "success")
toast("Something went wrong", "error")
```

---

## Dynamic snackbar message

```json
{
  "type": "snackbar",
  "message": { "$concat": ["Deleted ", { "$ref": "page.store:selectedItem.name" }] },
  "variant": "success"
}
```

```js
toast(`Deleted ${state.selectedItem.name}`, "success")
```

---

## console.log (debugging)

```json
{ "type": "console.log", "payload": { "$ref": "page.store:" } }
```

```js
console.log(state)
```

---

```json
{ "type": "console.log", "payload": { "$ref": "page.store:user" } }
```

```js
console.log(state.user)
```

---

## Combining side-effects after async success

```json
{
  "type": "async.call",
  "call": { "$http": { "method": "POST", "url": "/api/submit" } },
  "onSuccess": [
    { "type": "page.store.update", "path": "submitted", "payload": true },
    { "type": "snackbar",  "message": "Submitted!",  "variant": "success" },
    { "type": "navigate",  "to": "/thank-you" },
    { "type": "console.log", "payload": "Form submitted" }
  ]
}
```

```js
await fetch("/api/submit", { method: "POST" })
state.submitted = true
toast("Submitted!", "success")
router.push("/thank-you")
console.log("Form submitted")
```
