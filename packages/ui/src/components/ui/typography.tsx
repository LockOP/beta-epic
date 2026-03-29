import * as React from "react"

import { cn } from "../../lib/utils"

export function H1({
  className,
  ...props
}: React.ComponentProps<"h1">) {
  return (
    <h1
      className={cn("scroll-m-20 text-4xl font-extrabold tracking-tight lg:text-5xl", className)}
      {...props}
    />
  )
}

export function H2({
  className,
  ...props
}: React.ComponentProps<"h2">) {
  return (
    <h2
      className={cn("scroll-m-20 border-b pb-2 text-3xl font-semibold tracking-tight", className)}
      {...props}
    />
  )
}

export function H3({
  className,
  ...props
}: React.ComponentProps<"h3">) {
  return (
    <h3
      className={cn("scroll-m-20 text-2xl font-semibold tracking-tight", className)}
      {...props}
    />
  )
}

export function H4({
  className,
  ...props
}: React.ComponentProps<"h4">) {
  return (
    <h4
      className={cn("scroll-m-20 text-xl font-semibold tracking-tight", className)}
      {...props}
    />
  )
}

export function P({
  className,
  ...props
}: React.ComponentProps<"p">) {
  return <p className={cn("leading-7 [&:not(:first-child)]:mt-6", className)} {...props} />
}

export function Blockquote({
  className,
  ...props
}: React.ComponentProps<"blockquote">) {
  return (
    <blockquote className={cn("mt-6 border-l-2 pl-6 italic", className)} {...props} />
  )
}

export function InlineCode({
  className,
  ...props
}: React.ComponentProps<"code">) {
  return (
    <code
      className={cn("relative rounded bg-muted px-[0.3rem] py-[0.2rem] font-mono text-sm", className)}
      {...props}
    />
  )
}

export function Lead({
  className,
  ...props
}: React.ComponentProps<"p">) {
  return <p className={cn("text-xl text-muted-foreground", className)} {...props} />
}

export function Large({
  className,
  ...props
}: React.ComponentProps<"div">) {
  return <div className={cn("text-lg font-semibold", className)} {...props} />
}

export function Small({
  className,
  ...props
}: React.ComponentProps<"small">) {
  return <small className={cn("text-sm leading-none font-medium", className)} {...props} />
}

export function Muted({
  className,
  ...props
}: React.ComponentProps<"p">) {
  return <p className={cn("text-sm text-muted-foreground", className)} {...props} />
}

export const TypographyContext = {
  Typography: `
  components: H1, H2, H3, H4, P, Blockquote, InlineCode, Lead, Large, Small, Muted
  Each renders the appropriate semantic HTML element
  children: yes
  + all native element props
  `.trim(),
  H1: `
  Component in Typography family.
  `.trim(),
  H2: `
  Component in Typography family.
  `.trim(),
  H3: `
  Component in Typography family.
  `.trim(),
  H4: `
  Component in Typography family.
  `.trim(),
  P: `
  Component in Typography family.
  `.trim(),
  Blockquote: `
  Component in Typography family.
  `.trim(),
  InlineCode: `
  Component in Typography family.
  `.trim(),
  Lead: `
  Component in Typography family.
  `.trim(),
  Large: `
  Component in Typography family.
  `.trim(),
  Small: `
  Component in Typography family.
  `.trim(),
  Muted: `
  Component in Typography family.
  `.trim(),
}
