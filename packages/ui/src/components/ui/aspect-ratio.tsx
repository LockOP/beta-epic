"use client"

import { AspectRatio as AspectRatioPrimitive } from "radix-ui"

function AspectRatio({
  ...props
}: React.ComponentProps<typeof AspectRatioPrimitive.Root>) {
  return <AspectRatioPrimitive.Root data-slot="aspect-ratio" {...props} />
}

export { AspectRatio }

export const AspectRatioContext = {
  AspectRatio: `
  ratio?: number
  children: yes
  ---
  example config: { component: "AspectRatio", props: { ratio: 1 }, children: ["Content"] }
  `.trim(),
}
