# @beta-epic/ui — Example App 4

A minimal Vite + React + TypeScript app for mounting the current `@beta-epic/ui` engine with a single empty route.

## Routes

| Path | Description |
| --- | --- |
| `/` | Empty route with `GuiProvider` and `GuiComponent` wiring only |

## Running

### 1. Install dependencies (from monorepo root)

```bash
pnpm install
```

### 2. Start the dev server

```bash
pnpm --filter example_4 dev
```

Then open `http://localhost:5173`.

## Notes

- This app aliases `@beta-epic/ui` to `packages/ui/src/index.ts`, so it uses the current source package directly during development.
- The route is intentionally minimal and does not register any extra functions, hooks, or custom components.
