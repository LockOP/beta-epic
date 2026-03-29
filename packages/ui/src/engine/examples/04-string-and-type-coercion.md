# String Operators

## Basic string transforms

```json
{ "$trim": { "$ref": "page.store:input" } }
```

```js
state.input.trim()
```

---

```json
{ "$lower": { "$ref": "page.store:username" } }
```

```js
state.username.toLowerCase()
```

---

```json
{ "$upper": { "$ref": "page.store:code" } }
```

```js
state.code.toUpperCase()
```

---

```json
{
  "$padStart": {
    "value": { "$ref": "page.store:orderNumber" },
    "len": 6,
    "char": "0"
  }
}
```

```js
String(state.orderNumber).padStart(6, "0")
```

---

```json
{
  "$padEnd": {
    "value": { "$ref": "page.store:label" },
    "len": 12,
    "char": "."
  }
}
```

```js
String(state.label).padEnd(12, ".")
```

---

```json
{ "$length": { "$ref": "page.store:bio" } }
```

```js
state.bio.length
```

---

## Slicing and replacement

```json
{ "$slice": { "value": { "$ref": "page.store:title" }, "start": 0, "end": 60 } }
```

```js
state.title.slice(0, 60)
```

---

```json
{
  "$replace": {
    "value": { "$ref": "page.store:slug" },
    "from": "-",
    "to": " "
  }
}
```

```js
state.slug.replaceAll("-", " ")
```

---

```json
{ "$split": { "value": { "$ref": "page.store:tags" }, "sep": "," } }
```

```js
state.tags.split(",")
```

---

```json
{ "$join": { "parts": [{ "$ref": "page.store:first" }, " ", { "$ref": "page.store:last" }] } }
```

```js
`${state.first} ${state.last}`
```

---

```json
{ "$concat": [{ "$ref": "page.store:count" }, " items"] }
```

```js
`${state.count} items`
// note: $concat coerces values to string; same as String(state.count) + " items"
```

---

## Search and matching

```json
{ "$includes": { "value": { "$ref": "page.store:email" }, "search": "@" } }
```

```js
state.email.includes("@")
```

---

```json
{ "$startsWith": { "value": { "$ref": "page.store:url" }, "prefix": "https" } }
```

```js
state.url.startsWith("https")
```

---

```json
{ "$endsWith": { "value": { "$ref": "page.store:filename" }, "suffix": ".pdf" } }
```

```js
state.filename.endsWith(".pdf")
```

---

```json
{ "$contains": { "value": { "$ref": "page.store:name" }, "search": { "$ref": "page.store:query" } } }
```

```js
state.name.toLowerCase().includes(state.query.toLowerCase())
// case-insensitive; empty search always returns true — ideal for search/filter UIs
```

---

```json
{ "$charAt": { "value": { "$ref": "page.store:code" }, "index": 0 } }
```

```js
state.code.charAt(0)
```

---

## Type coercion

```json
{ "$string": { "$ref": "page.store:count" } }
```

```js
String(state.count)
```

---

```json
{ "$number": { "$ref": "page.store:inputValue" } }
```

```js
Number(state.inputValue)
```

---

```json
{ "$bool": { "$ref": "page.store:value" } }
```

```js
Boolean(state.value)
```

---

```json
{ "$nullish": { "value": { "$ref": "page.store:name" }, "default": "Anonymous" } }
```

```js
state.name ?? "Anonymous"
```

---

## Combining with math

```json
{
  "$concat": [
    { "$string": { "$round": { "$ref": "page.store:score" } } },
    "% complete"
  ]
}
```

```js
`${Math.round(state.score)}% complete`
```
