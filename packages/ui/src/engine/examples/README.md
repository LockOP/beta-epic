# Engine DSL Examples

Each file shows DSL config alongside the equivalent JavaScript/JSX.

| File | Topic |
| ---- | ----- |
| [01-refs.md](./01-refs.md) | `$ref` — all namespaces: `page.store:`, `selectors:`, `env:`, `redux:`, `url:`, `refs:` — including client ENV vars |
| [02-conditionals.md](./02-conditionals.md) | `$if`, `$switch` |
| [03-math-operators.md](./03-math-operators.md) | Math operators |
| [04-string-and-type-coercion.md](./04-string-and-type-coercion.md) | String operators, type coercion |
| [05-logic-and-comparison.md](./05-logic-and-comparison.md) | `$and`, `$or`, `$not`, `$eq`, `$gt`, `$in`, `$has` |
| [06-array-operators.md](./06-array-operators.md) | `$map`, `$filter`, `$sort`, `$reduce`, `$find`, `$some`, `$every`, `$count`, `$slice`, `$uniq`, `$append` |
| [07-pipe.md](./07-pipe.md) | `$pipe` — left-to-right chaining without nesting |
| [08-actions-store.md](./08-actions-store.md) | `page.store.update`, `page.store.reset`, `redux.dispatch`, `actions.group` |
| [09-actions-async.md](./09-actions-async.md) | `async.call`, `$http`, `try/catch/finally`, parallel with `actions.group` |
| [10-actions-side-effects.md](./10-actions-side-effects.md) | `navigate`, `window.open`, `snackbar`, `console.log` |
| [11-fn-registry.md](./11-fn-registry.md) | `$fn` (sync, in expressions) and `async.call` with `$fn` (async, in actions) |
| [12-effects.md](./12-effects.md) | `effects[]` — DSL equivalent of `useEffect`, debounce + cleanup behaviour |
| [13-selectors.md](./13-selectors.md) | Derived state computed once per state change |
| [14-env-local-vars.md](./14-env-local-vars.md) | `env` — local variables scoped to a node subtree |
| [15-theme.md](./15-theme.md) | Theme tokens — CSS custom properties, `GuiProvider theme` prop, light/dark/custom themes |
| [16-object-operators.md](./16-object-operators.md) | `$get`, `$keys`, `$values`, `$merge`, `$pick`, `$omit` |
| [17-page-product-listing.md](./17-page-product-listing.md) | Full page: search + filter + sort + pagination |
| [18-page-form-submit.md](./18-page-form-submit.md) | Full page: form validation + async submit + reset |
| [19-page-dashboard.md](./19-page-dashboard.md) | Full page: parallel fetch + WebSocket subscription + debounce |
| [20-common-confusions.md](./20-common-confusions.md) | 10 WRONG/RIGHT confusion patterns |
| [21-storage.md](./21-storage.md) | `localStorage` and `sessionStorage` — built-in `local:` / `session:` refs and `local.set` / `session.set` actions |
| [22-page-wizard.md](./22-page-wizard.md) | Full page: multi-step wizard with per-step selectors, session-persisted step, `$switch` routing |
| [23-page-settings.md](./23-page-settings.md) | Full page: tabbed settings with three selector scopes, localStorage for appearance, API save per tab |
| [24-config-ref.md](./24-config-ref.md) | `$subConfig` — reusable config fragments, pre-compilation substitution, `subConfigProps`, usable anywhere |
| [25-args.md](./25-args.md) | `$arg` — raw handler argument access by index and dot-path |
