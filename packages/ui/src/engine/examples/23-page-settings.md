# Combined Example — Settings Page

Tabbed settings page: profile, notifications, and appearance tabs. Each tab has its own form and save flow. Preferences persisted to localStorage. Uses: `selectors` (tab-scoped), `$switch`, `$trim`, `$includes`, `effects`, `async.call`, `local.set`, `local:`, `snackbar`.

> **These component names are not in the default registry.** `SettingsPage`, `PageHeader`, `TabBar`, `ProfileTab`, `NotificationsTab`, `AppearanceTab`, `ToggleGroup` must be registered via `<GuiProvider components={{ ... }}>` before this config will render. The DSL patterns themselves are correct and complete.

---

## Initial state

```json
{
  "activeTab":   "profile",
  "profile":     { "name": "", "email": "", "bio": "" },
  "notifs":      { "email": true, "push": false, "digest": "weekly" },
  "appearance":  { "theme": "light", "density": "comfortable", "language": "en" },
  "saving":      false,
  "savedAt":     null
}
```

---

## DSL config

```json
{
  "component": "SettingsPage",
  "selectors": {
    "tabLabel": {
      "$switch": {
        "on": { "$ref": "page.store:activeTab" },
        "cases": {
          "profile":      "Profile",
          "notifications": "Notifications",
          "appearance":   "Appearance"
        },
        "default": "Settings"
      }
    }
  },
  "effects": [
    {
      "deps": [],
      "run": [
        {
          "type": "page.store.update",
          "path": "appearance",
          "payload": {
            "$if": {
              "cond": { "$neq": { "a": { "$ref": "local:settings.appearance" }, "b": null } },
              "then": { "$ref": "local:settings.appearance" },
              "else": { "$ref": "page.store:appearance" }
            }
          }
        },
        {
          "type": "async.call",
          "call": { "$http": { "method": "GET", "url": "/api/settings" } },
          "onSuccess": [
            { "type": "page.store.update", "path": "profile", "payload": { "$ref": "result.profile" } },
            { "type": "page.store.update", "path": "notifs",  "payload": { "$ref": "result.notifs" } }
          ]
        }
      ]
    },
    {
      "deps": [{ "$ref": "page.store:appearance" }],
      "run": [
        { "type": "local.set", "key": "settings", "payload": { "appearance": { "$ref": "page.store:appearance" } } }
      ]
    }
  ],
  "children": [
    {
      "component": "PageHeader",
      "props": { "title": { "$ref": "selectors:tabLabel" } }
    },
    {
      "component": "TabBar",
      "props": {
        "value": { "$ref": "page.store:activeTab" },
        "tabs": [
          { "label": "Profile",       "value": "profile" },
          { "label": "Notifications", "value": "notifications" },
          { "label": "Appearance",    "value": "appearance" }
        ],
        "onChange": {
          "$action": [{ "type": "page.store.update", "path": "activeTab", "payload": { "$ref": "event.value" } }]
        }
      }
    },
    {
      "$switch": {
        "on": { "$ref": "page.store:activeTab" },
        "cases": {

          "profile": {
            "component": "ProfileTab",
            "selectors": {
              "nameValid":  { "$gt": { "a": { "$length": { "$trim": { "$ref": "page.store:profile.name" } } }, "b": 0 } },
              "emailValid": { "$includes": { "value": { "$ref": "page.store:profile.email" }, "search": "@" } },
              "canSave": {
                "$and": [
                  { "$ref": "selectors:nameValid" },
                  { "$ref": "selectors:emailValid" },
                  { "$not": { "$ref": "page.store:saving" } }
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
                      "cond": { "$and": [{ "$gt": { "a": { "$length": { "$ref": "page.store:profile.name" } }, "b": 0 } }, { "$not": { "$ref": "selectors:nameValid" } }] },
                      "then": "Name is required",
                      "else": null
                    }
                  }
                },
                "children": [{ "component": "TextInput", "props": { "value": { "$ref": "page.store:profile.name" }, "onChange": { "$action": [{ "type": "page.store.update", "path": "profile.name", "payload": { "$ref": "event.value" } }] } } }]
              },
              {
                "component": "Field",
                "props": { "label": "Email" },
                "children": [{ "component": "TextInput", "props": { "value": { "$ref": "page.store:profile.email" }, "type": "email", "onChange": { "$action": [{ "type": "page.store.update", "path": "profile.email", "payload": { "$ref": "event.value" } }] } } }]
              },
              {
                "component": "Field",
                "props": { "label": "Bio" },
                "children": [{ "component": "Textarea", "props": { "value": { "$ref": "page.store:profile.bio" }, "rows": 3, "onChange": { "$action": [{ "type": "page.store.update", "path": "profile.bio", "payload": { "$ref": "event.value" } }] } } }]
              },
              {
                "component": "Button",
                "props": {
                  "label":    { "$if": { "cond": { "$ref": "page.store:saving" }, "then": "Saving…", "else": "Save profile" } },
                  "loading":  { "$ref": "page.store:saving" },
                  "disabled": { "$not": { "$ref": "selectors:canSave" } },
                  "onClick": {
                    "$action": [
                      { "type": "page.store.update", "path": "saving", "payload": true },
                      {
                        "type": "async.call",
                        "call": { "$http": { "method": "PATCH", "url": "/api/settings/profile", "data": { "$ref": "page.store:profile" } } },
                        "onSuccess": [
                          { "type": "page.store.update", "path": "saving", "payload": false },
                          { "type": "snackbar", "message": "Profile saved", "variant": "success" }
                        ],
                        "onError": [
                          { "type": "page.store.update", "path": "saving", "payload": false },
                          { "type": "snackbar", "message": { "$ref": "error.message" }, "variant": "error" }
                        ]
                      }
                    ]
                  }
                }
              }
            ]
          },

          "notifications": {
            "component": "NotificationsTab",
            "children": [
              {
                "component": "Field",
                "props": { "label": "Email notifications" },
                "children": [{ "component": "Switch", "props": { "checked": { "$ref": "page.store:notifs.email" }, "onChange": { "$action": [{ "type": "page.store.update", "path": "notifs.email", "payload": { "$ref": "event.value" } }] } } }]
              },
              {
                "component": "Field",
                "props": { "label": "Push notifications" },
                "children": [{ "component": "Switch", "props": { "checked": { "$ref": "page.store:notifs.push" }, "onChange": { "$action": [{ "type": "page.store.update", "path": "notifs.push", "payload": { "$ref": "event.value" } }] } } }]
              },
              {
                "component": "Field",
                "props": { "label": "Digest frequency" },
                "children": [
                  {
                    "component": "Select",
                    "props": {
                      "value": { "$ref": "page.store:notifs.digest" },
                      "options": [
                        { "label": "Daily",   "value": "daily" },
                        { "label": "Weekly",  "value": "weekly" },
                        { "label": "Never",   "value": "never" }
                      ],
                      "onChange": { "$action": [{ "type": "page.store.update", "path": "notifs.digest", "payload": { "$ref": "event.value" } }] }
                    }
                  }
                ]
              },
              {
                "component": "Button",
                "props": {
                  "label":   { "$if": { "cond": { "$ref": "page.store:saving" }, "then": "Saving…", "else": "Save notifications" } },
                  "loading": { "$ref": "page.store:saving" },
                  "onClick": {
                    "$action": [
                      { "type": "page.store.update", "path": "saving", "payload": true },
                      {
                        "type": "async.call",
                        "call": { "$http": { "method": "PATCH", "url": "/api/settings/notifs", "data": { "$ref": "page.store:notifs" } } },
                        "onSuccess": [
                          { "type": "page.store.update", "path": "saving", "payload": false },
                          { "type": "snackbar", "message": "Notifications saved", "variant": "success" }
                        ],
                        "onError": [
                          { "type": "page.store.update", "path": "saving", "payload": false },
                          { "type": "snackbar", "message": { "$ref": "error.message" }, "variant": "error" }
                        ]
                      }
                    ]
                  }
                }
              }
            ]
          },

          "appearance": {
            "component": "AppearanceTab",
            "selectors": {
              "isDark": { "$eq": { "a": { "$ref": "page.store:appearance.theme" }, "b": "dark" } }
            },
            "children": [
              {
                "component": "Field",
                "props": { "label": "Theme" },
                "children": [
                  {
                    "component": "ToggleGroup",
                    "props": {
                      "value": { "$ref": "page.store:appearance.theme" },
                      "options": [{ "label": "Light", "value": "light" }, { "label": "Dark", "value": "dark" }],
                      "onChange": { "$action": [{ "type": "page.store.update", "path": "appearance.theme", "payload": { "$ref": "event.value" } }] }
                    }
                  }
                ]
              },
              {
                "component": "Field",
                "props": { "label": "Density" },
                "children": [
                  {
                    "component": "ToggleGroup",
                    "props": {
                      "value": { "$ref": "page.store:appearance.density" },
                      "options": [{ "label": "Comfortable", "value": "comfortable" }, { "label": "Compact", "value": "compact" }],
                      "onChange": { "$action": [{ "type": "page.store.update", "path": "appearance.density", "payload": { "$ref": "event.value" } }] }
                    }
                  }
                ]
              },
              {
                "component": "Field",
                "props": { "label": "Language" },
                "children": [
                  {
                    "component": "Select",
                    "props": {
                      "value": { "$ref": "page.store:appearance.language" },
                      "options": [{ "label": "English", "value": "en" }, { "label": "Spanish", "value": "es" }, { "label": "French", "value": "fr" }],
                      "onChange": { "$action": [{ "type": "page.store.update", "path": "appearance.language", "payload": { "$ref": "event.value" } }] }
                    }
                  }
                ]
              },
              {
                "component": "Text",
                "props": {
                  "content": {
                    "$if": {
                      "cond": { "$ref": "selectors:isDark" },
                      "then": "Dark mode is on — changes apply immediately",
                      "else": "Light mode is active"
                    }
                  }
                }
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

- **Three selector scopes:**
  - `SettingsPage`: `tabLabel` — used by the page header, available everywhere
  - `ProfileTab`: `nameValid`, `emailValid`, `canSave` — only visible within the profile tab
  - `AppearanceTab`: `isDark` — only visible within the appearance tab
- Appearance changes are persisted to localStorage immediately via the deps effect — no save button needed for local UI prefs
- Profile and notifications changes require an explicit save — each tab has its own `saving` flag using the shared `page.store:saving` field
- `$switch` on `activeTab` — unmounted tabs don't render, so their selectors also don't exist until the tab is active
- Mount effect: restores appearance from localStorage first (instant), then fetches profile/notifs from API (async)
