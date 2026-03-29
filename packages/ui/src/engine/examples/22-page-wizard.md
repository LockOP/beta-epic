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
                "props": { "label": "Full name" },
                "children": [
                  {
                    "component": "TextInput",
                    "props": {
                      "value": { "$ref": "page.store:profile.name" },
                      "onChange": { "$action": [{ "type": "page.store.update", "path": "profile.name", "payload": { "$ref": "event.value" } }] }
                    }
                  }
                ]
              },
              {
                "component": "Field",
                "props": { "label": "Role" },
                "children": [
                  {
                    "component": "Select",
                    "props": {
                      "value": { "$ref": "page.store:profile.role" },
                      "options": [
                        { "label": "Developer",  "value": "dev" },
                        { "label": "Designer",   "value": "design" },
                        { "label": "Manager",    "value": "mgr" }
                      ],
                      "onChange": { "$action": [{ "type": "page.store.update", "path": "profile.role", "payload": { "$ref": "event.value" } }] }
                    }
                  }
                ]
              },
              {
                "component": "Button",
                "props": {
                  "label": "Next",
                  "disabled": { "$not": { "$ref": "selectors:canNext" } },
                  "onClick": {
                    "$action": [{ "type": "page.store.update", "path": "step", "payload": 1 }]
                  }
                }
              }
            ]
          },
          "1": {
            "component": "StepPreferences",
            "children": [
              {
                "component": "Field",
                "props": { "label": "Theme" },
                "children": [
                  {
                    "component": "ToggleGroup",
                    "props": {
                      "value": { "$ref": "page.store:prefs.theme" },
                      "options": [
                        { "label": "Light", "value": "light" },
                        { "label": "Dark",  "value": "dark" }
                      ],
                      "onChange": { "$action": [{ "type": "page.store.update", "path": "prefs.theme", "payload": { "$ref": "event.value" } }] }
                    }
                  }
                ]
              },
              {
                "component": "Field",
                "props": { "label": "Email notifications" },
                "children": [
                  {
                    "component": "Switch",
                    "props": {
                      "checked": { "$ref": "page.store:prefs.notifications" },
                      "onChange": { "$action": [{ "type": "page.store.update", "path": "prefs.notifications", "payload": { "$ref": "event.value" } }] }
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
                      "label": "Back", "variant": "ghost",
                      "onClick": { "$action": [{ "type": "page.store.update", "path": "step", "payload": 0 }] }
                    }
                  },
                  {
                    "component": "Button",
                    "props": {
                      "label": "Next",
                      "onClick": { "$action": [{ "type": "page.store.update", "path": "step", "payload": 2 }] }
                    }
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
                      "label": "Back", "variant": "ghost",
                      "onClick": { "$action": [{ "type": "page.store.update", "path": "step", "payload": 1 }] }
                    }
                  },
                  {
                    "component": "Button",
                    "props": {
                      "label": { "$if": { "cond": { "$ref": "page.store:submitting" }, "then": "Finishing…", "else": "Finish" } },
                      "loading": { "$ref": "page.store:submitting" },
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
                    }
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
