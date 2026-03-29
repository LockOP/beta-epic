# $arg — Raw Handler Argument Access

`$arg` reads a raw argument from the current handler call by position. It works in any expression position — action payloads, prop values, selectors, and effect deps.

---

## Basic usage

```json
{ "$arg": 0 }
```

Returns the first argument passed to the handler as-is.

```json
{ "$arg": 1 }
```

Returns the second argument.

```json
{ "$arg": 0, "path": "target.value" }
```

Returns a dot-path value from the first argument.

---

## When handler args are available

`$arg` is populated whenever an `$action` fires — i.e., inside `onClick`, `onChange`, `onSubmit`, or any other event prop. It reads `ctx.args`, which is the raw array of arguments the component passed when calling that handler.

Outside of an action context (e.g. in a selector or static prop), `ctx.args` is absent and `$arg` returns `null`.

---

## Use cases

### Simple value from a component that passes the value directly

If a component calls `onChange(value)` with a plain string or boolean:

```json
{
  "$action": [
    { "type": "page.store.update", "path": "name", "payload": { "$arg": 0 } }
  ]
}
```

`$arg: 0` is the value. No wrapper object needed on the component side.

---

### Nested path — component passes a raw DOM event

If a component calls `onChange(event)` with a React synthetic event:

```json
{
  "$action": [
    {
      "type": "page.store.update",
      "path": "name",
      "payload": { "$arg": 0, "path": "currentTarget.value" }
    }
  ]
}
```

`$arg: 0` is the event object; `path` drills in.

---

### Multi-argument callbacks

Some callbacks pass more than one argument. For example a slider that calls `onChange(value, meta)`:

```json
{
  "$action": [
    { "type": "page.store.update", "path": "volume",    "payload": { "$arg": 0 } },
    { "type": "page.store.update", "path": "sliderMeta", "payload": { "$arg": 1 } }
  ]
}
```

---

### Using $arg in a conditional action

```json
{
  "$action": [
    {
      "$if": {
        "cond": { "$gt": { "a": { "$arg": 0 }, "b": 0 } },
        "then": [
          { "type": "page.store.update", "path": "quantity", "payload": { "$arg": 0 } }
        ],
        "else": [
          { "type": "snackbar", "message": "Quantity must be positive", "variant": "error" }
        ]
      }
    }
  ]
}
```

---

## $arg vs event.value shorthand

The engine keeps `event.value` and `event.checked` as convenience shorthands for the first handler arg. They are automatically populated alongside `$arg`.

| Pattern | When to use |
|---|---|
| `{ "$ref": "event.value" }` | Component passes `{ value: ... }` shaped object, or a plain primitive |
| `{ "$ref": "event.checked" }` | Component passes `{ checked: ... }` shaped object |
| `{ "$arg": 0 }` | Component passes the value directly as a primitive or any other shape |
| `{ "$arg": 0, "path": "target.value" }` | Component passes a raw DOM/React event |
| `{ "$arg": 1 }` | Second argument of a multi-arg callback |

**Recommendation:** prefer `$arg` — it works regardless of how the component shapes its callback. `event.value` is a legacy convenience that assumes a specific object shape.

---

## What to notice

- `$arg` index is zero-based
- `path` supports the same dot-path syntax as `$ref` (e.g. `"a.b.c"`, `"items.0.name"`)
- If the index is out of bounds or `path` does not exist, `$arg` returns `null`
- `$arg` works in all expression positions: action `payload`, prop values, `$if` conditions, `$and`/`$or` operands
- `ctx.args` is reset on every handler invocation — `$arg` always reflects the current call's arguments
