# Combined Example — Multi-Step Wizard

Three-step onboarding wizard with per-step validation, progress indicator, back/next navigation, and session-persisted step. Uses: `selectors` (scoped to each step panel), `$switch`, `$trim`, `$and`, `async.call`, `session:`, `session.set`, `navigate`.

> **These component names are not in the default registry.** `WizardShell`, `ProgressBar`, `StepProfile`, `StepPreferences`, `StepBilling`, `ToggleGroup`, `PlanPicker` must be registered via `<GuiProvider components={{ ... }}>` before this config will render. The DSL patterns themselves are correct and complete.

---

## Initial state

```json
{
  "step": 0,
  "profile": { "name": "", "role": "" },
  "prefs":   { "theme": "light", "notifications": true },
  "billing": { "plan": "free" },
  "submitting": false
}
```

---

## DSL config

```json
{
  "component": "WizardShell",
  "selectors": {
    "isFirst": { "$eq": { "a": { "$ref": "page.store:step" }, "b": 0 } },
    "isLast":  { "$eq": { "a": { "$ref": "page.store:step" }, "b": 2 } }
  },
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
  ],
  "children": [
    {
      "component": "ProgressBar",
      "props": {
        "steps": 3,
        "current": { "$ref": "page.store:step" }
      }
    },
    {
      "$switch": {
        "on": { "$ref": "page.store:step" },
        "cases": {
          "0": {
            "component": "StepProfile",
            "selectors": {
              "nameValid": { "$gt": { "a": { "$length": { "$trim": { "$ref": "page.store:profile.name" } } }, "b": 0 } },
              "roleValid": { "$gt": { "a": { "$length": { "$ref": "page.store:profile.role" } }, "b": 0 } },
              "canNext":   { "$and": [{ "$ref": "selectors:nameValid" }, { "$ref": "selectors:roleValid" }] }
            },
            "children": [
              {
                "component": "Field",
                "children": [
                  { "component": "FieldLabel", "children": ["Full name"] },
                  {
                    "component": "Input",
                    "props": {
                      "value": { "$ref": "page.store:profile.name" },
                      "onChange": { "$action": [{ "type": "page.store.update", "path": "profile.name", "payload": { "$ref": "event.value" } }] }
                    }
                  }
                ]
              },
              {
                "component": "Field",
                "children": [
                  { "component": "FieldLabel", "children": ["Role"] },
                  {
                    "component": "NativeSelect",
                    "props": {
                      "value": { "$ref": "page.store:profile.role" },
                      "onChange": { "$action": [{ "type": "page.store.update", "path": "profile.role", "payload": { "$ref": "event.value" } }] }
                    },
                    "children": [
                      { "component": "NativeSelectOption", "props": { "value": "dev" }, "children": ["Developer"] },
                      { "component": "NativeSelectOption", "props": { "value": "design" }, "children": ["Designer"] },
                      { "component": "NativeSelectOption", "props": { "value": "mgr" }, "children": ["Manager"] }
                    ]
                  }
                ]
              },
              {
                "component": "Button",
                "props": {
                  "disabled": { "$not": { "$ref": "selectors:canNext" } },
                  "onClick": {
                    "$action": [{ "type": "page.store.update", "path": "step", "payload": 1 }]
                  }
                },
                "children": ["Next"]
              }
            ]
          },
          "1": {
            "component": "StepPreferences",
            "children": [
              {
                "component": "Field",
                "children": [
                  { "component": "FieldLabel", "children": ["Theme"] },
                  {
                    "component": "ToggleGroup",
                    "props": {
                      "type": "single",
                      "value": { "$ref": "page.store:prefs.theme" },
                      "onValueChange": { "$action": [{ "type": "page.store.update", "path": "prefs.theme", "payload": { "$ref": "event.value" } }] }
                    },
                    "children": [
                      { "component": "ToggleGroupItem", "props": { "value": "light" }, "children": ["Light"] },
                      { "component": "ToggleGroupItem", "props": { "value": "dark" }, "children": ["Dark"] }
                    ]
                  }
                ]
              },
              {
                "component": "Field",
                "children": [
                  { "component": "FieldLabel", "children": ["Email notifications"] },
                  {
                    "component": "Switch",
                    "props": {
                      "checked": { "$ref": "page.store:prefs.notifications" },
                      "onCheckedChange": { "$action": [{ "type": "page.store.update", "path": "prefs.notifications", "payload": { "$ref": "event.value" } }] }
                    }
                  }
                ]
              },
              {
                "component": "Row",
                "props": { "justify": "space-between" },
                "children": [
                  {
                    "component": "Button",
                    "props": {
                      "variant": "ghost",
                      "onClick": { "$action": [{ "type": "page.store.update", "path": "step", "payload": 0 }] }
                    },
                    "children": ["Back"]
                  },
                  {
                    "component": "Button",
                    "props": {
                      "onClick": { "$action": [{ "type": "page.store.update", "path": "step", "payload": 2 }] }
                    },
                    "children": ["Next"]
                  }
                ]
              }
            ]
          },
          "2": {
            "component": "StepBilling",
            "children": [
              {
                "component": "PlanPicker",
                "props": {
                  "value": { "$ref": "page.store:billing.plan" },
                  "onChange": { "$action": [{ "type": "page.store.update", "path": "billing.plan", "payload": { "$ref": "event.value" } }] }
                }
              },
              {
                "component": "Row",
                "props": { "justify": "space-between" },
                "children": [
                  {
                    "component": "Button",
                    "props": {
                      "variant": "ghost",
                      "onClick": { "$action": [{ "type": "page.store.update", "path": "step", "payload": 1 }] }
                    },
                    "children": ["Back"]
                  },
                  {
                    "component": "Button",
                    "props": {
                      "onClick": {
                        "$action": [
                          { "type": "page.store.update", "path": "submitting", "payload": true },
                          {
                            "type": "async.call",
                            "call": {
                              "$http": {
                                "method": "POST",
                                "url": "/api/onboarding",
                                "data": {
                                  "$merge": [
                                    { "profile": { "$ref": "page.store:profile" } },
                                    { "prefs":   { "$ref": "page.store:prefs" } },
                                    { "billing": { "$ref": "page.store:billing" } }
                                  ]
                                }
                              }
                            },
                            "onSuccess": [
                              { "type": "page.store.update", "path": "submitting", "payload": false },
                              { "type": "session.remove", "key": "wizardStep" },
                              { "type": "navigate", "to": "/dashboard" }
                            ],
                            "onError": [
                              { "type": "page.store.update", "path": "submitting", "payload": false },
                              { "type": "snackbar", "message": { "$ref": "error.message" }, "variant": "error" }
                            ]
                          }
                        ]
                      }
                    },
                    "children": [
                      { "$if": { "cond": { "$ref": "page.store:submitting" }, "then": "Finishing…", "else": "Finish" } }
                    ]
                  }
                ]
              }
            ]
          }
        }
      }
    }
  ]
}
```

---

## What to notice

- `selectors` on `WizardShell`: `isFirst`/`isLast` for navigation guards — available to all steps
- `selectors` on `StepProfile` (step 0): `nameValid`, `roleValid`, `canNext` — scoped only to that step panel, not visible in step 1 or step 2
- This shows **two selector scopes at different levels** coexisting: shell-level and step-level
- `$switch` on `page.store:step` — only the current step renders, others are not mounted
- Session storage persists step number — refreshing the page resumes where the user left off
- `session.remove` on successful submit — clears the persisted step so future visits start fresh
- Final submit uses `$merge` to assemble all three step payloads into one POST body
