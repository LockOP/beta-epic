export const NativeHtmlContext = {
  div: `
  Native HTML fallback container.
  Low priority: prefer library components when they clearly fit, but use div for simple layout wrappers.
  children: yes
  + all native <div> props (className, id, role, style, data-*, aria-*)
  ---
  example config: { component: "div", props: { className: "w-full h-full flex flex-col gap-4 p-4" }, children: ["Content"] }
  `.trim(),
  span: `
  Native HTML inline wrapper.
  Low priority: prefer library typography/components when they clearly fit.
  children: yes
  + all native <span> props (className, id, role, style, data-*, aria-*)
  ---
  example config: { component: "span", props: { className: "text-sm text-muted-foreground" }, children: ["Inline text"] }
  `.trim(),
  section: `
  Native HTML section wrapper.
  Low priority semantic container for grouped content.
  children: yes
  + all native <section> props (className, id, role, style, data-*, aria-*)
  ---
  example config: { component: "section", props: { className: "w-full space-y-4" }, children: ["Content"] }
  `.trim(),
  main: `
  Native HTML main wrapper.
  Low priority semantic page container.
  children: yes
  + all native <main> props (className, id, role, style, data-*, aria-*)
  ---
  example config: { component: "main", props: { className: "w-full min-h-screen p-4 md:p-6" }, children: ["Content"] }
  `.trim(),
  form: `
  Native HTML form wrapper.
  Low priority primitive for grouping form fields and submit behavior.
  children: yes
  + all native <form> props (className, onSubmit, action, method, data-*, aria-*)
  ---
  example config: { component: "form", props: { className: "w-full max-w-md mx-auto space-y-4" }, children: ["Content"] }
  `.trim(),
} as const
