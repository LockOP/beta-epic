# Combined Example — Product Listing Page

Search + filter + sort + pagination + async fetch. Persists sort preference to localStorage. Uses: `effects`, `selectors`, `$pipe`, `$filter`, `$sort`, `$slice`, `$map`, `async.call`, `$http`, `page.store.update`, `$if`, `local.set`, `local:`.

> **These component names are not in the default registry.** `SearchInput`, `ProductCard`, `Grid`, `Pagination`, etc. must be registered via `<GuiProvider components={{ SearchInput, ProductCard, ... }}>` before this config will render. The DSL patterns themselves are correct and complete.

---

## Initial state

```json
{
  "products": [],
  "query":    "",
  "sortBy":   "price",
  "sortDir":  "asc",
  "page":     0,
  "pageSize": 12,
  "loading":  false,
  "error":    null
}
```

---

## DSL config

`selectors` are declared on the root `Card` node — they flow down to all children but are invisible to anything above this node.

```json
{
  "component": "Card",
  "selectors": {
    "filtered": {
      "$filter": {
        "over": { "$ref": "page.store:products" },
        "as": "p",
        "where": {
          "$contains": { "value": { "$ref": "var:p.name" }, "search": { "$ref": "page.store:query" } }
        }
      }
    },
    "sorted": {
      "$sort": {
        "over": { "$ref": "selectors:filtered" },
        "by":   { "$get": { "from": { "$ref": "var:item" }, "key": { "$ref": "page.store:sortBy" } } },
        "dir":  { "$ref": "page.store:sortDir" }
      }
    },
    "paginated": {
      "$slice": {
        "over":  { "$ref": "selectors:sorted" },
        "start": { "$mul": [{ "$ref": "page.store:page" }, { "$ref": "page.store:pageSize" }] },
        "end":   { "$mul": [{ "$add": [{ "$ref": "page.store:page" }, 1] }, { "$ref": "page.store:pageSize" }] }
      }
    },
    "totalPages": {
      "$ceil": { "$div": [{ "$count": { "$ref": "selectors:filtered" } }, { "$ref": "page.store:pageSize" }] }
    },
    "resultLabel": {
      "$pipe": [
        { "$count": { "$ref": "selectors:filtered" } },
        { "$string": "$$" },
        { "$concat": ["$$", " products"] }
      ]
    }
  },
  "effects": [
    {
      "deps": [],
      "run": [
        { "type": "page.store.update", "path": "loading", "payload": true },
        {
          "type": "async.call",
          "call": { "$http": { "method": "GET", "url": "/api/products" } },
          "onSuccess": [
            { "type": "page.store.update", "path": "products", "payload": { "$ref": "result" } },
            { "type": "page.store.update", "path": "loading",  "payload": false }
          ],
          "onError": [
            { "type": "page.store.update", "path": "error",   "payload": { "$ref": "error.message" } },
            { "type": "page.store.update", "path": "loading", "payload": false }
          ]
        },
        {
          "type": "page.store.update",
          "path": "sortBy",
          "payload": {
            "$if": {
              "cond": { "$neq": { "a": { "$ref": "local:productSort.by" }, "b": null } },
              "then": { "$ref": "local:productSort.by" },
              "else": "price"
            }
          }
        },
        {
          "type": "page.store.update",
          "path": "sortDir",
          "payload": {
            "$if": {
              "cond": { "$neq": { "a": { "$ref": "local:productSort.dir" }, "b": null } },
              "then": { "$ref": "local:productSort.dir" },
              "else": "asc"
            }
          }
        }
      ]
    },
    {
      "deps": [{ "$ref": "page.store:query" }],
      "run": [
        { "type": "page.store.update", "path": "page", "payload": 0 }
      ]
    },
    {
      "deps": [{ "$ref": "page.store:sortBy" }, { "$ref": "page.store:sortDir" }],
      "run": [
        {
          "type": "local.set",
          "key": "productSort",
          "payload": {
            "$merge": [
              { "by": { "$ref": "page.store:sortBy" } },
              { "dir": { "$ref": "page.store:sortDir" } }
            ]
          }
        }
      ]
    }
  ],
  "children": [
    {
      "component": "SearchInput",
      "props": {
        "value":       { "$ref": "page.store:query" },
        "placeholder": "Search products…",
        "onChange": {
          "$action": [
            { "type": "page.store.update", "path": "query", "payload": { "$ref": "event.value" } }
          ]
        }
      }
    },
    {
      "component": "Row",
      "props": { "justify": "space-between" },
      "children": [
        {
          "component": "P",
          "children": [{ "$ref": "selectors:resultLabel" }]
        },
        {
          "component": "NativeSelect",
          "props": {
            "value": { "$ref": "page.store:sortBy" },
            "onChange": {
              "$action": [
                { "type": "page.store.update", "path": "sortBy", "payload": { "$ref": "event.value" } },
                { "type": "page.store.update", "path": "page",   "payload": 0 }
              ]
            }
          },
          "children": [
            { "component": "NativeSelectOption", "props": { "value": "price" }, "children": ["Price"] },
            { "component": "NativeSelectOption", "props": { "value": "name" }, "children": ["Name"] },
            { "component": "NativeSelectOption", "props": { "value": "rating" }, "children": ["Rating"] }
          ]
        }
      ]
    },
    {
      "$if": {
        "cond": { "$ref": "page.store:loading" },
        "then": { "component": "Spinner" },
        "else": {
          "$if": {
            "cond": { "$neq": { "a": { "$ref": "page.store:error" }, "b": null } },
            "then": { "component": "ErrorBanner", "props": { "message": { "$ref": "page.store:error" } } },
            "else": {
              "component": "Grid",
              "props": { "cols": 3 },
              "children": [
                {
                  "$map": {
                    "over": { "$ref": "selectors:paginated" },
                    "as": "product",
                    "return": {
                      "component": "ProductCard",
                      "props": {
                        "name":   { "$ref": "var:product.name" },
                        "price":  { "$fn": "formatCurrency", "args": [{ "$ref": "var:product.price" }, "USD"] },
                        "rating": { "$ref": "var:product.rating" },
                        "image":  { "$ref": "var:product.imageUrl" }
                      }
                    }
                  }
                }
              ]
            }
          }
        }
      }
    },
    {
      "component": "Pagination",
      "props": {
        "page":       { "$ref": "page.store:page" },
        "totalPages": { "$ref": "selectors:totalPages" },
        "onNext": {
          "$action": [
            { "type": "page.store.update", "path": "page", "payload": { "$add": [{ "$ref": "page.store:page" }, 1] } }
          ]
        },
        "onPrev": {
          "$action": [
            { "type": "page.store.update", "path": "page", "payload": { "$sub": [{ "$ref": "page.store:page" }, 1] } }
          ]
        },
        "prevDisabled": { "$eq":  { "a": { "$ref": "page.store:page" }, "b": 0 } },
        "nextDisabled": { "$gte": { "a": { "$add": [{ "$ref": "page.store:page" }, 1] }, "b": { "$ref": "selectors:totalPages" } } }
      }
    }
  ]
}
```

---

## JS equivalent (condensed)

```jsx
// initialState seeds a Redux slice created dynamically per page:
//   createEpicPageSlice(sliceName, initialState)
// sliceName is passed as a prop when mounting <GuiComponent store={{ sliceName, initialState }} />
// All state lives in store[sliceName], NOT in React component state.

function ProductListing({ sliceName }) {
  const dispatch  = useDispatch()
  const products  = useSelector(s => s[sliceName].products)
  const query     = useSelector(s => s[sliceName].query)
  const sortBy    = useSelector(s => s[sliceName].sortBy)
  const sortDir   = useSelector(s => s[sliceName].sortDir)
  const page      = useSelector(s => s[sliceName].page)
  const loading   = useSelector(s => s[sliceName].loading)
  const error     = useSelector(s => s[sliceName].error)
  const PAGE_SIZE = useSelector(s => s[sliceName].pageSize)

  const set = (path, payload) =>
    dispatch({ type: `${sliceName}/pageStoreUpdate`, payload: { path, payload } })

  // mount — fetch products + restore saved sort preference
  useEffect(() => {
    set("loading", true)
    fetch("/api/products").then(r => r.json())
      .then(data => { set("products", data); set("loading", false) })
      .catch(e  => { set("error", e.message); set("loading", false) })

    const saved = JSON.parse(localStorage.getItem("productSort"))
    if (saved?.by)  set("sortBy",  saved.by)
    if (saved?.dir) set("sortDir", saved.dir)
  }, [])

  // reset page when query changes
  useEffect(() => { set("page", 0) }, [query])

  // persist sort preference whenever it changes
  useEffect(() => {
    localStorage.setItem("productSort", JSON.stringify({ by: sortBy, dir: sortDir }))
  }, [sortBy, sortDir])

  // selectors — declared on this component, available to all children below
  const filtered    = products.filter(p => p.name.includes(query))
  const sorted      = [...filtered].sort((a, b) => a[sortBy] > b[sortBy] ? 1 : -1)
  const paginated   = sorted.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE)
  const totalPages  = Math.ceil(filtered.length / PAGE_SIZE)
  const resultLabel = `${filtered.length} products`

  if (loading) return <Spinner />
  if (error)   return <ErrorBanner message={error} />

  return (
    <Stack>
      <SearchInput value={query} onChange={e => set("query", e.target.value)} />
      <Row justify="space-between">
        <Text content={resultLabel} />
        <Select value={sortBy} onChange={e => { set("sortBy", e.value); set("page", 0) }} options={...} />
      </Row>
      <Grid cols={3}>
        {paginated.map(product => (
          <ProductCard
            name={product.name}
            price={formatCurrency(product.price, "USD")}
            rating={product.rating}
            image={product.imageUrl}
          />
        ))}
      </Grid>
      <Pagination
        page={page} totalPages={totalPages}
        onNext={() => set("page", page + 1)}
        onPrev={() => set("page", page - 1)}
        prevDisabled={page === 0}
        nextDisabled={page + 1 >= totalPages}
      />
    </Stack>
  )
}
```

## What to notice

- `selectors` is declared on the root `Stack` node, not at document root — flows down to all children
- Mount effect restores `local:productSort.by` and `local:productSort.dir` from localStorage
- Third effect persists both sort fields together under one key using `$merge`
- `$ref "local:productSort.by"` reads the `by` field out of the stored JSON — dot-path works on stored JSON
- Selectors chain: `filtered → sorted → paginated` — each reads the previous via `selectors:`
- `$pipe` builds the result label: count → toString → concat
- Loading/error state handled with nested `$if` before the grid renders
