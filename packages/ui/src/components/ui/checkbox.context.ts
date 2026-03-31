export const CheckboxContext = {
  Checkbox: `
  checked?: boolean | "indeterminate"
  onCheckedChange?: (checked: boolean | "indeterminate") => void
  disabled?: boolean
  + all native checkbox props
  ---
  example config: { component: "Checkbox", props: { checked: "indeterminate", disabled: true } }
  `.trim(),
}

