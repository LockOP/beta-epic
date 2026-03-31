# Shadcn Component Smoke Test (DSL generation prompt)

Paste the prompt below into Studio chat to generate a **DSL-only “kitchen sink” page** that exercises **every UI component family** exported from `packages/ui/src/components/ui/index.ts`.

## Copy/paste prompt

```text
Create a DSL-only “Shadcn Component Smoke Test” page to verify every UI component family renders + behaves correctly.

This is NOT a Figma-fidelity task — optimize for correctness + coverage. Use shadcn defaults (sizes/variants) and keep the layout compact and readable.

## Output shape (file-based, not inline JSON)
Implement as a new example page in the repo:
- Create `apps/example/src/pages/eg-components/`
  - `page.tsx` (thin wrapper that renders GuiComponent)
  - `initial-state.ts`
  - `root-config.ts`
  - `sub-configs/index.ts` (optional, but recommended to keep root-config readable)
- Wire it into `apps/example/src/App.tsx` as route `/eg-components`.

## HARD COVERAGE REQUIREMENT
You MUST include at least one working example for every UI module exported here (lines 1–63), **except `native-select`** which must NOT be used in this smoke test:
`packages/ui/src/components/ui/index.ts` (lines 1–63)

That includes:
accordion, alert, alert-dialog, aspect-ratio, avatar, badge, breadcrumb, button, button-group, calendar, card,
carousel, chart, checkbox, collapsible, combobox, command, context-menu, data-table, date-picker, dialog,
direction, drawer, dropdown-menu, empty, field, hover-card, input, input-group, input-otp, item, json-viewer,
kbd, label, menubar, native-html (div only), navigation-menu, pagination, popover, progress, radio-group,
resizable, scroll-area, select, separator, sheet, sidebar, skeleton, slider, sonner, spinner, switch, table,
tabs, textarea, toast, toggle, toggle-group, tooltip, typography.

For modules with subcomponents, use the correct shadcn composition patterns (e.g. SelectTrigger→SelectValue + SelectContent/SelectItem, TableHeader/TableBody/TableRow/TableCell, DialogTrigger/DialogContent, etc).

## NO NATIVE COMPONENTS (except div)
- Do NOT use any native-html exports except `div`. That means: do not use `span`, `section`, `main`, or `form`.
- Do NOT use `NativeSelect`, `NativeSelectOption`, or `NativeSelectOptGroup` at all in this smoke test.

## INTERACTIVITY REQUIREMENT
Wire minimal state so we can confirm behavior:
- Input + Textarea: controlled with onChange writing to page.store
- Checkbox + Switch: toggles in page.store
- RadioGroup: value in page.store
- Slider: value in page.store
- Tabs: value in page.store
- Select: value in page.store (use the popover Select family, not NativeSelect)
- Pagination: current page in page.store
- At least one “Toast me” button that triggers a toast/snackbar

For overlay components (Dialog / AlertDialog / Drawer / Sheet / Popover / DropdownMenu / ContextMenu / HoverCard / Tooltip):
- Include working Triggers and real Content
- Include at least one action button inside content that triggers a toast/snackbar so clicks are verifiable

## STYLE / LAYOUT GUARDRAILS (keep it sane)
- Use default component sizing/variants. Avoid bracketed pixel utilities (`text-[...]`, `h-[...]`, `rounded-[...]`, `gap-[...]`, `p-[...]` etc) except if a component internally needs it.
- Prefer `text-sm` / `text-base`. Avoid `text-lg`+ in tables and dense UI.
- Use consistent spacing (`gap-3`/`gap-4`, `p-4`/`p-6`), and always add `gap-*` to horizontal flex rows.
- Use Cards and Separators to keep sections readable. Use a ScrollArea (or normal scrolling) because the page will be long.

## VALIDATION
- Call `get_all_components` up-front and ensure every component key you use is registered.
- If you need props/variants, use `get_components_context` in bulk (batch calls are fine).
- Run `validate_config` on the final `root-config.ts` JSON and fix issues.

Deliverable: visiting `/eg-components` renders a compact component gallery where every listed module above is present and interactive where applicable.
```
