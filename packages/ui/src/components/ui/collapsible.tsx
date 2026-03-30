"use client"

import { Collapsible as CollapsiblePrimitive } from "radix-ui"

function Collapsible({
  ...props
}: React.ComponentProps<typeof CollapsiblePrimitive.Root>) {
  return <CollapsiblePrimitive.Root data-slot="collapsible" {...props} />
}

function CollapsibleTrigger({
  ...props
}: React.ComponentProps<typeof CollapsiblePrimitive.CollapsibleTrigger>) {
  return (
    <CollapsiblePrimitive.CollapsibleTrigger
      data-slot="collapsible-trigger"
      {...props}
    />
  )
}

function CollapsibleContent({
  ...props
}: React.ComponentProps<typeof CollapsiblePrimitive.CollapsibleContent>) {
  return (
    <CollapsiblePrimitive.CollapsibleContent
      data-slot="collapsible-content"
      {...props}
    />
  )
}

export { Collapsible, CollapsibleTrigger, CollapsibleContent }

export const CollapsibleContext = {
  Collapsible: `
  sub-components: CollapsibleTrigger, CollapsibleContent
  open?: boolean
  onOpenChange?: (open: boolean) => void
  defaultOpen?: boolean
  children: yes
  ---
  example config: { component: "Collapsible", props: { open: true, defaultOpen: true }, children: [{ component: "CollapsibleTrigger", children: ["Open"] }] }
  `.trim(),
  CollapsibleTrigger: `
  Sub-component of Collapsible.
  ---
  example config: { component: "CollapsibleTrigger", children: ["Open"] }
  `.trim(),
  CollapsibleContent: `
  Sub-component of Collapsible.
  ---
  example config: { component: "CollapsibleContent", children: ["Content"] }
  `.trim(),
}
