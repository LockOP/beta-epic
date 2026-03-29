# @beta-epic/ui — Example App 2

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
pnpm --filter example_2 dev
```

Then open `http://localhost:5173`.

## Notes

- This app aliases `@beta-epic/ui` to `packages/ui/src/index.ts`, so it uses the current source package directly during development.
- The host app registers only the async Open Library functions. All view structure, fetching effects, pagination state, and selection logic live in the DSL configs.
- Search and subject result cards are rendered through `$subConfig` fragments to keep the configs readable while staying component-free.
