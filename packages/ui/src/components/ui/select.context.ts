export const SelectContext = {
  Select: `
  sub-components: SelectTrigger, SelectValue, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectSeparator, SelectScrollUpButton, SelectScrollDownButton
  SelectTrigger: size?: "default"* | "sm"
  SelectContent: position?: "item-aligned" | "popper", align?: string = "center"
  value?: string
  onValueChange?: (value: string) => void
  children: yes
  ---
  example config: { component: "Select", props: { value: "value" }, children: [{ component: "SelectTrigger", children: ["Open"] }] }
  `.trim(),
  SelectTrigger: `
  SelectTrigger: size?: "default"* | "sm"
  ---
  example config: { component: "SelectTrigger", props: { size: "default" } }
  `.trim(),
  SelectValue: `
  Sub-component of Select.
  ---
  example config: { component: "SelectValue", children: ["Selected value"] }
  `.trim(),
  SelectContent: `
  SelectContent: position?: "item-aligned" | "popper", align?: string = "center"
  ---
  example config: { component: "SelectContent", props: { position: "center" } }
  `.trim(),
  SelectGroup: `
  Sub-component of Select.
  ---
  example config: { component: "SelectGroup", children: ["Content"] }
  `.trim(),
  SelectItem: `
  Sub-component of Select.
  ---
  example config: { component: "SelectItem", children: ["Content"] }
  `.trim(),
  SelectLabel: `
  Sub-component of Select.
  ---
  example config: { component: "SelectLabel", children: ["Label"] }
  `.trim(),
  SelectSeparator: `
  Sub-component of Select.
  ---
  example config: { component: "SelectSeparator" }
  `.trim(),
  SelectScrollUpButton: `
  Sub-component of Select.
  ---
  example config: { component: "SelectScrollUpButton" }
  `.trim(),
  SelectScrollDownButton: `
  Sub-component of Select.
  ---
  example config: { component: "SelectScrollDownButton" }
  `.trim(),
}

