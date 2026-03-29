# Combined Example — Form with Validation and Async Submit

Multi-field form with inline validation, derived `canSubmit`, optimistic UI, error recovery, and reset. Auto-saves draft to sessionStorage and restores on mount. Uses: `selectors`, `$trim`, `$includes`, `$and`/`$not`, `async.call`, `page.store.reset`, `snackbar`, `navigate`, `session.set`, `session.remove`, `session:`.

> **These component names are not in the default registry.** `Form`, `Field`, `TextInput`, `Textarea` must be registered via `<GuiProvider components={{ Form, Field, TextInput, Textarea }}>` before this config will render. The DSL patterns themselves are correct and complete.

---

## Initial state

```json
{
  "form": {
    "name":    "",
    "email":   "",
    "message": ""
  },
  "submitting": false,
  "submitted":  false,
  "error":      null
}
```

---

## DSL config

`selectors` declared on the `Form` node — available to the form and all its field children, invisible outside this form.

```json
{
  "component": "Form",
  "selectors": {
    "nameValid": {
      "$gt": {
        "a": { "$length": { "$trim": { "$ref": "page.store:form.name" } } },
        "b": 0
      }
    },
    "emailValid": {
      "$includes": { "value": { "$ref": "page.store:form.email" }, "search": "@" }
    },
    "messageValid": {
      "$gt": {
        "a": { "$length": { "$trim": { "$ref": "page.store:form.message" } } },
        "b": 9
      }
    },
    "canSubmit": {
      "$and": [
        { "$ref": "selectors:nameValid" },
        { "$ref": "selectors:emailValid" },
        { "$ref": "selectors:messageValid" },
        { "$not": { "$ref": "page.store:submitting" } }
      ]
    },
    "hasDraft": {
      "$neq": { "a": { "$ref": "session:contactDraft" }, "b": null }
    }
  },
  "effects": [
    {
      "deps": [],
      "run": [
        {
          "type": "page.store.update",
          "path": "form",
          "payload": {
            "$if": {
              "cond": { "$ref": "selectors:hasDraft" },
              "then": { "$ref": "session:contactDraft" },
              "else": { "$ref": "page.store:form" }
            }
          }
        }
      ]
    },
    {
      "deps": [
        { "$ref": "page.store:form.name" },
        { "$ref": "page.store:form.email" },
        { "$ref": "page.store:form.message" }
      ],
      "run": [
        { "type": "session.set", "key": "contactDraft", "payload": { "$ref": "page.store:form" } }
      ]
    }
  ],
  "props": {
    "onSubmit": {
      "$action": [
        { "type": "page.store.update", "path": "submitting", "payload": true },
        { "type": "page.store.update", "path": "error",      "payload": null },
        {
          "type": "async.call",
          "call": {
            "$http": {
              "method": "POST",
              "url":    "/api/contact",
              "data":   { "$ref": "page.store:form" },
              "headers": { "Content-Type": "application/json" }
            }
          },
          "onSuccess": [
            { "type": "page.store.update", "path": "submitted",  "payload": true },
            { "type": "page.store.update", "path": "submitting", "payload": false },
            { "type": "page.store.reset",  "path": "form" },
            { "type": "session.remove",    "key": "contactDraft" },
            { "type": "snackbar", "message": "Message sent!", "variant": "success" },
            { "type": "navigate", "to": "/thank-you" }
          ],
          "onError": [
            { "type": "page.store.update", "path": "error",      "payload": { "$ref": "error.message" } },
            { "type": "page.store.update", "path": "submitting", "payload": false },
            { "type": "snackbar", "message": { "$ref": "error.message" }, "variant": "error" }
          ]
        }
      ]
    }
  },
  "children": [
    {
      "component": "Field",
      "props": {
        "label": "Name",
        "error": {
          "$if": {
            "cond": {
              "$and": [
                { "$gt": { "a": { "$length": { "$ref": "page.store:form.name" } }, "b": 0 } },
                { "$not": { "$ref": "selectors:nameValid" } }
              ]
            },
            "then": "Name is required",
            "else": null
          }
        }
      },
      "children": [
        {
          "component": "TextInput",
          "props": {
            "value": { "$ref": "page.store:form.name" },
            "onChange": {
              "$action": [{ "type": "page.store.update", "path": "form.name", "payload": { "$ref": "event.value" } }]
            }
          }
        }
      ]
    },
    {
      "component": "Field",
      "props": {
        "label": "Email",
        "error": {
          "$if": {
            "cond": {
              "$and": [
                { "$gt": { "a": { "$length": { "$ref": "page.store:form.email" } }, "b": 0 } },
                { "$not": { "$ref": "selectors:emailValid" } }
              ]
            },
            "then": "Enter a valid email",
            "else": null
          }
        }
      },
      "children": [
        {
          "component": "TextInput",
          "props": {
            "value": { "$ref": "page.store:form.email" },
            "type":  "email",
            "onChange": {
              "$action": [{ "type": "page.store.update", "path": "form.email", "payload": { "$ref": "event.value" } }]
            }
          }
        }
      ]
    },
    {
      "component": "Field",
      "props": { "label": "Message" },
      "children": [
        {
          "component": "Textarea",
          "props": {
            "value": { "$ref": "page.store:form.message" },
            "rows":  4,
            "onChange": {
              "$action": [{ "type": "page.store.update", "path": "form.message", "payload": { "$ref": "event.value" } }]
            }
          }
        }
      ]
    },
    {
      "component": "Button",
      "props": {
        "label": {
          "$if": {
            "cond": { "$ref": "page.store:submitting" },
            "then": "Sending…",
            "else": "Send message"
          }
        },
        "type":     "submit",
        "disabled": { "$not": { "$ref": "selectors:canSubmit" } },
        "loading":  { "$ref": "page.store:submitting" }
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

function ContactForm({ sliceName }) {
  const dispatch   = useDispatch()
  const form       = useSelector(s => s[sliceName].form)
  const submitting = useSelector(s => s[sliceName].submitting)
  const error      = useSelector(s => s[sliceName].error)

  const set = (path, payload) =>
    dispatch({ type: `${sliceName}/pageStoreUpdate`, payload: { path, payload } })
  const resetForm = () =>
    dispatch({ type: `${sliceName}/pageStoreReset` })

  // restore draft from sessionStorage on mount
  useEffect(() => {
    const draft = JSON.parse(sessionStorage.getItem("contactDraft"))
    if (draft) set("form", draft)
  }, [])

  // auto-save draft to sessionStorage whenever form fields change
  useEffect(() => {
    sessionStorage.setItem("contactDraft", JSON.stringify(form))
  }, [form.name, form.email, form.message])

  // selectors — declared on Form, flow down to all field children
  const nameValid    = form.name.trim().length > 0
  const emailValid   = form.email.includes("@")
  const messageValid = form.message.trim().length > 9
  const canSubmit    = nameValid && emailValid && messageValid && !submitting

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!canSubmit) { toast("Please fill in all fields", "error"); return }

    set("submitting", true)
    set("error", null)
    try {
      await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      })
      resetForm()
      sessionStorage.removeItem("contactDraft")
      toast("Message sent!", "success")
      router.push("/thank-you")
    } catch (e) {
      set("error", e.message)
      toast(e.message, "error")
    } finally {
      set("submitting", false)
    }
  }

  return (
    <Form onSubmit={handleSubmit}>
      <Field label="Name" error={form.name.length > 0 && !nameValid ? "Name is required" : null}>
        <TextInput value={form.name} onChange={e => set("form.name", e.target.value)} />
      </Field>
      <Field label="Email" error={form.email.length > 0 && !emailValid ? "Enter a valid email" : null}>
        <TextInput value={form.email} type="email" onChange={e => set("form.email", e.target.value)} />
      </Field>
      <Field label="Message">
        <Textarea value={form.message} rows={4} onChange={e => set("form.message", e.target.value)} />
      </Field>
      <Button
        label={submitting ? "Sending…" : "Send message"}
        type="submit"
        disabled={!canSubmit}
        loading={submitting}
      />
    </Form>
  )
}
```

## What to notice

- `selectors` on `Form` node — `canSubmit`, `nameValid`, etc. are visible to the form and all its field children but nowhere else on the page
- `hasDraft` selector reads from `session:` — storage refs work inside selectors too
- First effect restores draft from `session:contactDraft` into the form store on mount
- Second effect auto-saves the whole `form` object to sessionStorage on every field change
- On success: `page.store.reset` resets form to `initialState`, then `session.remove` clears the draft
- Draft uses `sessionStorage` — intentional, closing the tab discards unsent drafts
- `canSubmit` drives the button's `disabled` prop — no guard needed inside the action since the button cannot be clicked when disabled
- `async.call` handles its own errors internally via `onError` — do not wrap it in `type: "try"`, which would never catch async failures
- Both `onSuccess` and `onError` set `submitting` back to `false`
