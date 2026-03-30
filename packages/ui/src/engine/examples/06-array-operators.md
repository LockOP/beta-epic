# Array Operators

## $map — transform each item

```json
{
  "$map": {
    "over": { "$ref": "page.store:users" },
    "as": "user",
    "return": {
      "component": "P",
      "children": [{ "$ref": "var:user.name" }]
    }
  }
}
```

```jsx
state.users.map(user => (
  <P>{user.name}</P>
))
```

---

```json
{
  "$map": {
    "over": { "$ref": "page.store:prices" },
    "as": "p",
    "return": {
      "$mul": [{ "$ref": "var:p" }, 1.2]
    }
  }
}
```

```js
state.prices.map(p => p * 1.2)
```

---

## $filter — keep matching items

```json
{
  "$filter": {
    "over": { "$ref": "page.store:products" },
    "as": "p",
    "where": { "$ref": "var:p.inStock" }
  }
}
```

```js
state.products.filter(p => p.inStock)
```

---

```json
{
  "$filter": {
    "over": { "$ref": "page.store:tasks" },
    "as": "t",
    "where": {
      "$and": [
        { "$neq": { "a": { "$ref": "var:t.status" }, "b": "done" } },
        {
          "$includes": {
            "value": { "$lower": { "$ref": "var:t.title" } },
            "search": { "$lower": { "$ref": "page.store:query" } }
          }
        }
      ]
    }
  }
}
```

```js
state.tasks.filter(t =>
  t.status !== "done" &&
  t.title.toLowerCase().includes(state.query.toLowerCase())
)
```

---

## $sort — order items

```json
{
  "$sort": {
    "over": { "$ref": "page.store:products" },
    "by": { "$ref": "var:item.price" },
    "dir": "asc"
  }
}
```

```js
[...state.products].sort((a, b) => a.price - b.price)
```

---

```json
{
  "$sort": {
    "over": { "$ref": "page.store:posts" },
    "by": { "$ref": "var:item.createdAt" },
    "dir": "desc"
  }
}
```

```js
[...state.posts].sort((a, b) => b.createdAt - a.createdAt)
```

---

## $reduce — aggregate to single value

```json
{
  "$reduce": {
    "over": { "$ref": "page.store:items" },
    "as": "item",
    "acc": "total",
    "init": 0,
    "return": {
      "$add": [
        { "$ref": "var:total" },
        { "$mul": [{ "$ref": "var:item.price" }, { "$ref": "var:item.qty" }] }
      ]
    }
  }
}
```

```js
state.items.reduce((total, item) => total + item.price * item.qty, 0)
```

---

## $find — first match

```json
{
  "$find": {
    "over": { "$ref": "page.store:users" },
    "as": "u",
    "where": { "$eq": { "a": { "$ref": "var:u.id" }, "b": { "$ref": "page.store:selectedId" } } }
  }
}
```

```js
state.users.find(u => u.id === state.selectedId)
```

---

## $some / $every — boolean tests

```json
{
  "$some": {
    "over": { "$ref": "page.store:items" },
    "as": "item",
    "where": { "$ref": "var:item.outOfStock" }
  }
}
```

```js
state.items.some(item => item.outOfStock)
```

---

```json
{
  "$every": {
    "over": { "$ref": "page.store:tasks" },
    "as": "t",
    "where": { "$eq": { "a": { "$ref": "var:t.status" }, "b": "done" } }
  }
}
```

```js
state.tasks.every(t => t.status === "done")
```

---

## $count

```json
{ "$count": { "$ref": "page.store:items" } }
```

```js
state.items.length
```

---

## $first / $last

```json
{ "$first": { "$ref": "page.store:results" } }
```

```js
state.results[0]
```

---

```json
{ "$last": { "$ref": "page.store:results" } }
```

```js
state.results[state.results.length - 1]
```

---

## $slice — take a range

```json
{
  "$slice": {
    "over": { "$ref": "page.store:items" },
    "start": 0,
    "end": 10
  }
}
```

```js
state.items.slice(0, 10)
```

---

## $flat

```json
{ "$flat": { "$ref": "page.store:nestedArrays" } }
```

```js
state.nestedArrays.flat()
```

---

## $uniq — deduplicate

```json
{ "$uniq": { "$ref": "page.store:tags" } }
```

```js
[...new Set(state.tags)]
```

---

## $compact — remove falsy values

```json
{ "$compact": { "$ref": "page.store:tags" } }
```

```js
state.tags.filter(Boolean)
// removes null, undefined, "", 0, false
```

---

## $reverse

```json
{ "$reverse": { "$ref": "page.store:messages" } }
```

```js
[...state.messages].reverse()
// non-mutating
```

---

## $at — get item by index

```json
{ "$at": { "arr": { "$ref": "page.store:results" }, "index": 0 } }
```

```js
state.results[0] ?? null
```

---

```json
{ "$at": { "arr": { "$ref": "page.store:results" }, "index": { "$ref": "page.store:selectedIndex" }, "fallback": null } }
```

```js
state.results[state.selectedIndex] ?? null
// use fallback for safe out-of-bounds access
```

---

## $findIndex — index of first match

```json
{
  "$findIndex": {
    "over": { "$ref": "page.store:users" },
    "as": "u",
    "where": { "$eq": { "a": { "$ref": "var:u.id" }, "b": { "$ref": "page.store:selectedId" } } }
  }
}
```

```js
state.users.findIndex(u => u.id === state.selectedId)
// returns -1 if not found
```

---

## $append / $prepend

```json
{ "$append": { "to": { "$ref": "page.store:items" }, "item": { "id": 99, "name": "New" } } }
```

```js
[...state.items, { id: 99, name: "New" }]
```

---

```json
{ "$prepend": { "to": { "$ref": "page.store:messages" }, "item": { "$ref": "page.store:draft" } } }
```

```js
[state.draft, ...state.messages]
```

---

## Chained array operations (using $pipe)

```json
{
  "$pipe": [
    { "$ref": "page.store:products" },
    { "$filter": { "over": "$$", "as": "p", "where": { "$ref": "var:p.inStock" } } },
    { "$sort": { "over": "$$", "by": { "$ref": "var:item.price" }, "dir": "asc" } },
    { "$slice": { "over": "$$", "start": 0, "end": 20 } }
  ]
}
```

```js
state.products
  .filter(p => p.inStock)
  .sort((a, b) => a.price - b.price)
  .slice(0, 20)
```

---

## Combined: filter + map in children

```json
{
  "component": "Grid",
  "children": [
    {
      "$map": {
        "over": {
          "$filter": {
            "over": { "$ref": "page.store:products" },
            "as": "p",
            "where": { "$ref": "var:p.featured" }
          }
        },
        "as": "product",
        "return": {
          "component": "ProductCard",
          "props": {
            "name":  { "$ref": "var:product.name" },
            "price": { "$ref": "var:product.price" }
          }
        }
      }
    }
  ]
}
```

```jsx
<Grid>
  {state.products
    .filter(p => p.featured)
    .map(product => (
      <ProductCard name={product.name} price={product.price} />
    ))}
</Grid>
```
