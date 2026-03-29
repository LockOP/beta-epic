# @beta-epic/ui — Example App

A Vite + React + TypeScript app demonstrating the current `@beta-epic/ui` engine with two routes, each rendering a different DSL config through `GuiProvider` and `GuiComponent`.

## Routes

| Path | Description |
| --- | --- |
| `/` | Dashboard demo — selectors, hook refs, page-store updates, and route navigation |
| `/form` | Account Settings demo — validation selectors, direct `$arg` input handling, and `async.call` |

## Running

### 1. Install dependencies (from monorepo root)

```bash
pnpm install
```

### 2. Start the dev server

```bash
pnpm --filter example dev
```

Then open `http://localhost:5173`.

## Notes

- This app aliases `@beta-epic/ui` to `packages/ui/src/index.ts`, so it uses the current source package directly during development.
- The example does not register any custom DSL components. Both routes use only the default component registry exported from `@beta-epic/ui`.
- The dashboard route demonstrates selectors and the built-in `isMobile` hook ref.
- The dashboard route also uses `$subConfig` to reuse a stat-card fragment.
- The form route demonstrates page-local state, direct native input event handling through `$arg`, and `async.call` with a registered async function.
