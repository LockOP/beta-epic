# Single Page DSL Generation Prompt

Use this prompt when generating a single page for this repo.

## Prompt

You are generating **one page only** for the Beta Epic Gen UI engine.

Before doing any implementation, read and follow these repo references:

- `@packages/ui/src/engine/ENGINE.md`
- `@packages/ui/src/engine/examples/README.md`

You must treat those files as the source of truth for:

- the DSL model;
- allowed expression operators
- allowed action types
- selector and effect behavior
- `$subConfig` usage
- page-store and initial-state patterns

## Primary Goal

Implement the requested page **strictly through the engine DSL** using:

- `initial-state.ts`
- `root-config.ts`
- optional sub-config files for reusable fragments
- `page.tsx` as a thin `GuiComponent` wrapper only

The result must be a config-driven page, not a custom React implementation.

## Hard Constraints

1. Do **not** create a custom page component like `task-dashboard.tsx`, `foo-view.tsx`, or any page-specific React UI component.
2. Do **not** register page-specific components in `GuiProvider`.
3. Do **not** solve missing DSL work by adding custom React, `useState`, `useMemo`, `useEffect`, or local event handlers.
4. Do **not** put page behavior into `App.tsx` or provider wiring.
5. Do **not** fall back to registry additions unless I explicitly ask for a new reusable engine component.
6. If the engine cannot express part of the design with the currently available DSL and registered components, **stop and say exactly what is missing** instead of escaping to React.

## Required Output Shape

For a page slug like `<slug>`, generate or update only this structure:

```text
apps/example/src/pages/<slug>/
  initial-state.ts
  root-config.ts
  page.tsx
  sub-configs/
    <optional-fragments>.ts
```

If a `sub-configs/` folder is not needed, say so briefly, but prefer extracting repeated sections into sub-configs instead of duplicating large config blocks.

## File Responsibilities

### `initial-state.ts`

Put all client-side dynamic data here, including:

- seed data
- filters
- sort state
- pagination state
- selection state
- form state
- UI mode flags

This file should be the single place that defines the page store shape.

### `root-config.ts`

This must export the root `ComponentNode` for the page.

Use:

- `selectors` for derived state
- `effects` for mount and reactive behavior
- `$action` for event handlers
- `$subConfig` for reusable fragments
- `env` when local derived values are useful inside a subtree

Keep the page declarative and config-first.

### `sub-configs/*`

Extract reusable fragments here for:

- repeated table rows or cards
- toolbar sections
- filter groups
- empty states
- dialogs or drawers
- pagination blocks
- repeated action menus

Prefer meaningful fragment names.

### `page.tsx`

This file must stay minimal. It should only:

- import `GuiComponent`
- import `root-config`
- import `initial-state`
- optionally import `refConfigs` from sub-config files
- pass them into `GuiComponent`

It should look structurally like this:

```tsx
import { GuiComponent } from "@beta-epic/ui";
import { pageInitialState } from "./initial-state";
import { pageRootConfig } from "./root-config";
import { pageRefConfigs } from "./sub-configs";

export function SomePage() {
  return (
    <GuiComponent
      rootConfig={pageRootConfig}
      refConfigs={pageRefConfigs}
      store={{ sliceName: "some-page", initialState: pageInitialState }}
    />
  );
}
```

Do not add any other logic to `page.tsx`.

## Implementation Rules

1. Recreate the requested UI using existing registered components from `@beta-epic/ui`.
2. Use the DSL to express all interactions:
   - search
   - filters
   - sort
   - selection
   - pagination
   - tabs
   - dialogs
   - submit/reset flows
   - derived summaries
3. Use `selectors` heavily instead of duplicating expressions.
4. Use `effects` instead of custom React lifecycle code.
5. Use `$subConfig` when a fragment appears more than once or becomes visually large.
6. Use `initial-state.ts` for demo data if the page is local/client-only.
7. Leave explicit placeholders inside config text for special brand assets, custom logos, or unavailable icons rather than inventing them.

## Design Translation Rules

When translating a Figma page:

1. Match the layout and interaction intent as closely as possible with existing engine components.
2. Prefer the repo's existing tokens and components over raw custom styling.
3. If the design includes a special logo, illustration, or proprietary icon that does not exist in the repo, render a clear placeholder through config text or a generic existing component.
4. Preserve the page structure in config form even if some visuals must be approximated.
5. Check small visual distinctions explicitly before finishing:
   - whether a button should be bordered or borderless
   - exact spacing and density in repeated controls and rows
   - icon placement: leading, trailing, or absent
   - muted vs primary text emphasis
   - selected, hover, and active states
6. Do not normalize similar controls if the design differentiates them. If one button has a border and another does not, preserve that difference in the DSL config.

## Forbidden Escape Hatches

These are not allowed unless I explicitly ask for them:

- custom React page components
- provider-level component registration for one page
- page-specific hook registration
- page-specific function registration just to simulate UI state
- imperative browser-only logic in new TSX files
- solving a DSL limitation by writing JSX manually

## If You Hit A DSL Limitation

Do this instead:

1. Explain which exact part of the page cannot be expressed with the current engine.
2. Name the missing capability using engine terms.
3. Point to the closest relevant engine reference or example.
4. Propose the smallest engine-level addition needed.
5. Wait for approval before implementing any non-DSL fallback.

## Expected Working Style

When you answer, do not silently choose a React workaround.

First verify:

- which existing UI components are already available
- which engine features cover the requested behavior
- which example docs are most relevant

Then implement the page through config only.

## Suggested Request Template

Use this when I ask for a page:

```text
Generate page `<slug>` strictly via the Beta Epic engine DSL.

Read and follow:
- @packages/ui/src/engine/ENGINE.md
- @packages/ui/src/engine/examples/README.md

Rules:
- Use only `initial-state.ts`, `root-config.ts`, optional `sub-configs/*`, and a thin `page.tsx`.
- No custom page-specific React components.
- No page-specific registry additions in `GuiProvider`.
- All client-side dynamics must come from initial state + DSL selectors/actions/effects/sub-configs.
- If the engine cannot express something, stop and explain the missing DSL capability instead of falling back to React.

Page request:
<put design or Figma link here>
```

## Final Output Checklist

Before finishing, verify all of these are true:

- The page is implemented through config, not custom React UI.
- `page.tsx` is only a thin `GuiComponent` wrapper.
- All interactive state lives in `initial-state.ts`.
- Repeated structures are extracted into sub-configs where appropriate.
- No page-specific registry additions were introduced.
- No new page-specific TSX component file was created beyond `page.tsx`.
- The result aligns with `@packages/ui/src/engine/ENGINE.md`.
- Relevant patterns were taken from `@packages/ui/src/engine/examples/README.md`.
- Small visual details were checked explicitly, especially button border vs no-border treatment and other repeated control states.
