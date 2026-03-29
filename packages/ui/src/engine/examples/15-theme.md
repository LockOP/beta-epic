# Theme Tokens

Theme tokens are **CSS custom properties** (shadcn-compatible). They are passed to `<GuiProvider theme={...} />` and scoped to the genXui subtree — they do not bleed into the host app's global `:root`.

The `theme` prop is **optional**. Built-in defaults are already defined in the library's stylesheet. You only need to pass overrides.

---

## Token names (shadcn-compatible CSS vars)

| Token | Usage |
| ----- | ----- |
| `--background` | Page / surface background |
| `--foreground` | Default text color |
| `--primary` | Brand primary |
| `--primary-foreground` | Text on primary background |
| `--secondary` | Secondary action color |
| `--secondary-foreground` | Text on secondary background |
| `--muted` | Subdued fill (chips, badges) |
| `--muted-foreground` | Subdued text |
| `--accent` | Highlight / hover state |
| `--accent-foreground` | Text on accent background |
| `--destructive` | Error / danger color |
| `--destructive-foreground` | Text on destructive background |
| `--card` | Card surface color |
| `--card-foreground` | Text on cards |
| `--popover` | Popover / dropdown surface |
| `--popover-foreground` | Text in popovers |
| `--border` | Border color |
| `--input` | Input border color |
| `--ring` | Focus ring color |
| `--radius` | Base border radius |
| `--chart-1` … `--chart-5` | Chart palette colors |

Values are HSL channel strings (no `hsl()` wrapper): `"262 80% 50%"`.

> **Key format:** Pass keys **without** the `--` prefix. `GuiProvider` prepends `--` automatically when injecting the inline style. Passing `'primary'` produces `--primary`; passing `'--primary'` would produce `----primary` (broken).

---

## Passing themes to GuiProvider

```tsx
// Minimum — use all built-in defaults, light mode
<GuiProvider>
  <App />
</GuiProvider>
```

```tsx
// Override specific tokens
<GuiProvider
  theme={{
    'primary':            '262 80% 50%',
    'primary-foreground': '0 0% 100%',
    'radius':             '0.75rem',
  }}
>
  <App />
</GuiProvider>
```

---

## Built-in light theme (defaults)

These are the values the library ships. No need to pass them unless you want to override.

```ts
const lightTheme = {
  'background':             '0 0% 100%',
  'foreground':             '240 10% 3.9%',
  'card':                   '0 0% 100%',
  'card-foreground':        '240 10% 3.9%',
  'popover':                '0 0% 100%',
  'popover-foreground':     '240 10% 3.9%',
  'primary':                '240 5.9% 10%',
  'primary-foreground':     '0 0% 98%',
  'secondary':              '240 4.8% 95.9%',
  'secondary-foreground':   '240 5.9% 10%',
  'muted':                  '240 4.8% 95.9%',
  'muted-foreground':       '240 3.8% 46.1%',
  'accent':                 '240 4.8% 95.9%',
  'accent-foreground':      '240 5.9% 10%',
  'destructive':            '0 84.2% 60.2%',
  'destructive-foreground': '0 0% 98%',
  'border':                 '240 5.9% 90%',
  'input':                  '240 5.9% 90%',
  'ring':                   '240 5.9% 10%',
  'radius':                 '0.625rem',
  'chart-1':                '12 76% 61%',
  'chart-2':                '173 58% 39%',
  'chart-3':                '197 37% 24%',
  'chart-4':                '43 74% 66%',
  'chart-5':                '27 87% 67%',
}
```

---

## Built-in dark theme

Pass these overrides when applying dark mode tokens.

```ts
const darkTheme = {
  'background':             '240 10% 3.9%',
  'foreground':             '0 0% 98%',
  'card':                   '240 10% 3.9%',
  'card-foreground':        '0 0% 98%',
  'popover':                '240 10% 3.9%',
  'popover-foreground':     '0 0% 98%',
  'primary':                '0 0% 98%',
  'primary-foreground':     '240 5.9% 10%',
  'secondary':              '240 3.7% 15.9%',
  'secondary-foreground':   '0 0% 98%',
  'muted':                  '240 3.7% 15.9%',
  'muted-foreground':       '240 5% 64.9%',
  'accent':                 '240 3.7% 15.9%',
  'accent-foreground':      '0 0% 98%',
  'destructive':            '0 62.8% 30.6%',
  'destructive-foreground': '0 0% 98%',
  'border':                 '240 3.7% 15.9%',
  'input':                  '240 3.7% 15.9%',
  'ring':                   '240 4.9% 83.9%',
}
```

---

## Custom brand theme (override only what differs)

You do not need to pass every token — only the ones you want to change.

```ts
const brandTheme = {
  'primary':                '262 80% 50%',   // purple brand
  'primary-foreground':     '0 0% 100%',
  'ring':                   '262 80% 50%',
  'radius':                 '0.75rem',        // rounder corners
}

<GuiProvider theme={brandTheme}>
  <App />
</GuiProvider>
```

---

## Toggling dark mode from a DSL config

Dark mode is a host-app concern — the DSL stores the preference and delegates the actual DOM change to a registered function.

1. Store the user's preference in the page store
2. Register a function in the host app that toggles the `.dark` class on the document
3. Call it from an effect when the preference changes

```json
// Initial state
{
  "colorScheme": "light"
}
```

```json
// DSL config
{
  "component": "Stack",
  "selectors": {
    "isDark": { "$eq": { "a": { "$ref": "page.store:colorScheme" }, "b": "dark" } }
  },
  "effects": [
    {
      "deps": [{ "$ref": "page.store:colorScheme" }],
      "run": [
        {
          "type": "async.call",
          "call": { "$fn": "applyColorScheme", "args": [{ "$ref": "page.store:colorScheme" }] }
        }
      ]
    }
  ],
  "children": [
    {
      "component": "Button",
      "props": {
        "label": {
          "$if": {
            "cond": { "$ref": "selectors:isDark" },
            "then": "Light mode",
            "else": "Dark mode"
          }
        },
        "variant": "ghost",
        "onClick": {
          "$action": [
            {
              "type": "page.store.update",
              "path": "colorScheme",
              "payload": {
                "$if": {
                  "cond": { "$ref": "selectors:isDark" },
                  "then": "light",
                  "else": "dark"
                }
              }
            }
          ]
        }
      }
    }
  ]
}
```

```tsx
// Host app — register the function once in GuiProvider
<GuiProvider
  functions={{
    applyColorScheme: (scheme: string) => {
      document.documentElement.classList.toggle('dark', scheme === 'dark')
    }
  }}
>
  <GuiComponent rootConfig={pageConfig} store={{ sliceName, initialState }} />
</GuiProvider>
```

---

## How components consume tokens

Token values cascade to all genXui components via CSS. Components built with Tailwind classes like `bg-primary`, `text-muted-foreground`, `border-border` automatically pick up your overrides — no extra wiring needed in DSL configs.

```text
GuiProvider
  └─ [data-epic-root]   ← inline style: { '--primary': '262 80% 50%', ... }
       └─ Button           ← Tailwind: bg-primary text-primary-foreground
       └─ Card             ← Tailwind: bg-card text-card-foreground
```

The genXui subtree is isolated — your overrides do not affect any Tailwind classes rendered outside this tree.
