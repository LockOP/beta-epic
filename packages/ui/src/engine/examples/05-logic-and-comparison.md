# Logic & Comparison Operators

## Equality

```json
{ "$eq": { "a": { "$ref": "page.store:status" }, "b": "active" } }
```

```js
state.status === "active"
```

---

```json
{ "$neq": { "a": { "$ref": "page.store:error" }, "b": null } }
```

```js
state.error !== null
```

---

## Numeric comparison

```json
{ "$gt": { "a": { "$ref": "page.store:count" }, "b": 0 } }
```

```js
state.count > 0
```

---

```json
{ "$gte": { "a": { "$ref": "page.store:age" }, "b": 18 } }
```

```js
state.age >= 18
```

---

```json
{ "$lt": { "a": { "$ref": "page.store:remaining" }, "b": 10 } }
```

```js
state.remaining < 10
```

---

```json
{ "$lte": { "a": { "$ref": "page.store:score" }, "b": 100 } }
```

```js
state.score <= 100
```

---

## Logic

```json
{
  "$and": [
    { "$ref": "page.store:isLoggedIn" },
    { "$ref": "page.store:hasPermission" }
  ]
}
```

```js
state.isLoggedIn && state.hasPermission
```

---

```json
{
  "$or": [
    { "$eq": { "a": { "$ref": "page.store:role" }, "b": "admin" } },
    { "$eq": { "a": { "$ref": "page.store:role" }, "b": "editor" } }
  ]
}
```

```js
state.role === "admin" || state.role === "editor"
```

---

```json
{ "$not": { "$ref": "page.store:loading" } }
```

```js
!state.loading
```

---

```json
{
  "$not": {
    "$and": [
      { "$ref": "page.store:loading" },
      { "$ref": "page.store:hasData" }
    ]
  }
}
```

```js
!(state.loading && state.hasData)
```

---

## $in — value in array

```json
{
  "$in": {
    "value": { "$ref": "page.store:selectedId" },
    "array": { "$ref": "page.store:allowedIds" }
  }
}
```

```js
state.allowedIds.includes(state.selectedId)
```

---

```json
{
  "$in": {
    "value": { "$ref": "page.store:status" },
    "array": ["active", "pending", "review"]
  }
}
```

```js
["active", "pending", "review"].includes(state.status)
```

---

## $has — object has key

```json
{ "$has": { "obj": { "$ref": "page.store:user" }, "key": "email" } }
```

```js
"email" in state.user
// or: state.user.hasOwnProperty("email")
```

---

## $isEmpty / $isNil / $isNotNil / $isArray

```json
{ "$isEmpty": { "$ref": "page.store:results" } }
```

```js
state.results === null || state.results === undefined ||
state.results === "" || (Array.isArray(state.results) && state.results.length === 0)
// true for: null, undefined, "", []
```

---

```json
{ "$isNil": { "$ref": "page.store:user" } }
```

```js
state.user === null || state.user === undefined
```

---

```json
{ "$isNotNil": { "$ref": "page.store:token" } }
```

```js
state.token !== null && state.token !== undefined
```

---

```json
{ "$isArray": { "$ref": "page.store:tags" } }
```

```js
Array.isArray(state.tags)
```

---

## Compound conditions

```json
{
  "$and": [
    { "$gt": { "a": { "$ref": "page.store:qty" }, "b": 0 } },
    { "$lte": { "a": { "$ref": "page.store:qty" }, "b": { "$ref": "page.store:stock" } } },
    { "$neq": { "a": { "$ref": "page.store:status" }, "b": "sold_out" } }
  ]
}
```

```js
state.qty > 0 && state.qty <= state.stock && state.status !== "sold_out"
```

---

## Conditions driving props

```json
{
  "component": "Button",
  "props": {
    "label": "Add to cart",
    "disabled": {
      "$or": [
        { "$ref": "page.store:loading" },
        { "$not": { "$ref": "page.store:inStock" } }
      ]
    },
    "variant": {
      "$if": {
        "cond": { "$ref": "page.store:inCart" },
        "then": "secondary",
        "else": "primary"
      }
    }
  }
}
```

```js
<Button
  label="Add to cart"
  disabled={state.loading || !state.inStock}
  variant={state.inCart ? "secondary" : "primary"}
/>
```
