# @beta-epic/ui — Example App

A minimal Vite + React + TypeScript app with three empty GUI placeholder routes.

## Routes

| Path | Description |
| --- | --- |
| `/eg1` | Figma-inspired task dashboard with client-side filters, selection, and pagination |
| `/eg2` | Empty GUI page with `eg2 empty page` text |
| `/eg3` | Empty GUI page with `eg3 empty page` text |

The root route `/` redirects to `/eg1`.

Each route lives in its own `pages/` folder and keeps its GUI `root-config.ts`
and `initial-state.ts` next to the page component.

`/eg1` also includes a page-local client component that is registered through
`GuiProvider` so the route can stay config-driven while still supporting richer
interactive behavior.

## Running

```bash
pnpm install
pnpm --filter example dev
```

Then open `http://localhost:5173`.
