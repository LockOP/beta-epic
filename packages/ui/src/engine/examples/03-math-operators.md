# Math Operators

## Basic arithmetic

```json
{ "$add": [{ "$ref": "page.store:price" }, { "$ref": "page.store:tax" }] }
```

```js
state.price + state.tax
```

---

```json
{ "$sub": [{ "$ref": "page.store:total" }, { "$ref": "page.store:discount" }] }
```

```js
state.total - state.discount
```

---

```json
{ "$mul": [{ "$ref": "page.store:qty" }, { "$ref": "page.store:unitPrice" }] }
```

```js
state.qty * state.unitPrice
```

---

```json
{ "$div": [{ "$ref": "page.store:total" }, { "$ref": "page.store:count" }] }
```

```js
state.total / state.count
```

---

```json
{ "$mod": [{ "$ref": "page.store:index" }, 2] }
```

```js
state.index % 2
```

---

## Rounding and bounds

```json
{ "$floor": { "$div": [{ "$ref": "page.store:total" }, 100] } }
```

```js
Math.floor(state.total / 100)
```

---

```json
{ "$round": { "$ref": "page.store:average" } }
```

```js
Math.round(state.average)
```

---

```json
{ "$abs": { "$sub": [{ "$ref": "page.store:a" }, { "$ref": "page.store:b" }] } }
```

```js
Math.abs(state.a - state.b)
```

---

```json
{ "$clamp": { "value": { "$ref": "page.store:score" }, "min": 0, "max": 100 } }
```

```js
Math.min(Math.max(state.score, 0), 100)
```

---

## Extremes and powers

```json
{ "$min": [{ "$ref": "page.store:a" }, { "$ref": "page.store:b" }] }
```

```js
Math.min(state.a, state.b)
```

---

```json
{ "$max": [{ "$ref": "page.store:a" }, { "$ref": "page.store:b" }] }
```

```js
Math.max(state.a, state.b)
```

---

```json
{ "$pow": { "base": { "$ref": "page.store:base" }, "exp": 2 } }
```

```js
Math.pow(state.base, 2)
```
