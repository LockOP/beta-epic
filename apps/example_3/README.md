# @beta-epic/ui — Example App 3

A Vite + React + TypeScript app demonstrating the current `@beta-epic/ui` engine against the live Open Library APIs.

## Routes

| Path | Description |
| --- | --- |
| `/` | Search explorer — paginated book search plus work-detail loading |
| `/subjects` | Subject browser — curated subject tabs with paginated shelves |

## Running

### 1. Install dependencies (from monorepo root)

```bash
pnpm install
```

### 2. Start the dev server

```bash
pnpm --filter example_3 dev
```

Then open `http://localhost:5173`.

## Notes

- This app aliases `@beta-epic/ui` to `packages/ui/src/index.ts`, so it uses the current source package directly during development.
- This version uses native DSL `$http` actions for all Open Library requests. The host app does not register any API helper functions.
