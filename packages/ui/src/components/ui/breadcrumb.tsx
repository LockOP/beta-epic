import * as React from "react"
import { Slot } from "radix-ui"

import { cn } from "../../lib/utils"
import { ChevronRightIcon, MoreHorizontalIcon } from "lucide-react"

function Breadcrumb({ className, ...props }: React.ComponentProps<"nav">) {
  return (
    <nav
      aria-label="breadcrumb"
      data-slot="breadcrumb"
      className={cn(className)}
      {...props}
    />
  )
}

function BreadcrumbList({ className, ...props }: React.ComponentProps<"ol">) {
  return (
    <ol
      data-slot="breadcrumb-list"
      className={cn(
        "flex flex-wrap items-center gap-1.5 text-sm wrap-break-word text-muted-foreground",
        className
      )}
      {...props}
    />
  )
}

function BreadcrumbItem({ className, ...props }: React.ComponentProps<"li">) {
  return (
    <li
      data-slot="breadcrumb-item"
      className={cn("inline-flex items-center gap-1", className)}
      {...props}
    />
  )
}

function BreadcrumbLink({
  asChild,
  className,
  ...props
}: React.ComponentProps<"a"> & {
  asChild?: boolean
}) {
  const Comp = asChild ? Slot.Root : "a"

  return (
    <Comp
      data-slot="breadcrumb-link"
      className={cn("transition-colors hover:text-foreground", className)}
      {...props}
    />
  )
}

function BreadcrumbPage({ className, ...props }: React.ComponentProps<"span">) {
  return (
    <span
      data-slot="breadcrumb-page"
      role="link"
      aria-disabled="true"
      aria-current="page"
      className={cn("font-normal text-foreground", className)}
      {...props}
    />
  )
}

function BreadcrumbSeparator({
  children,
  className,
  ...props
}: React.ComponentProps<"li">) {
  return (
    <li
      data-slot="breadcrumb-separator"
      role="presentation"
      aria-hidden="true"
      className={cn("[&>svg]:size-3.5", className)}
      {...props}
    >
      {children ?? (
        <ChevronRightIcon />
      )}
    </li>
  )
}

function BreadcrumbEllipsis({
  className,
  ...props
}: React.ComponentProps<"span">) {
  return (
    <span
      data-slot="breadcrumb-ellipsis"
      role="presentation"
      aria-hidden="true"
      className={cn(
        "flex size-5 items-center justify-center [&>svg]:size-4",
        className
      )}
      {...props}
    >
      <MoreHorizontalIcon
      />
      <span className="sr-only">More</span>
    </span>
  )
}

export {
  Breadcrumb,
  BreadcrumbList,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbPage,
  BreadcrumbSeparator,
  BreadcrumbEllipsis,
}

export const BreadcrumbContext = {
  Breadcrumb: `
  sub-components: BreadcrumbList, BreadcrumbItem, BreadcrumbLink, BreadcrumbPage, BreadcrumbSeparator, BreadcrumbEllipsis
  asChild?: boolean
  children: yes
  + all native <nav> props
  ---
  example config: { component: "Breadcrumb", props: { asChild: true }, children: [{ component: "BreadcrumbList", children: ["Content"] }] }
  `.trim(),
  BreadcrumbList: `
  Sub-component of Breadcrumb.
  ---
  example config: { component: "BreadcrumbList", children: ["Content"] }
  `.trim(),
  BreadcrumbItem: `
  Sub-component of Breadcrumb.
  ---
  example config: { component: "BreadcrumbItem", children: ["Content"] }
  `.trim(),
  BreadcrumbLink: `
  Sub-component of Breadcrumb.
  ---
  example config: { component: "BreadcrumbLink", children: ["Link"] }
  `.trim(),
  BreadcrumbPage: `
  Sub-component of Breadcrumb.
  ---
  example config: { component: "BreadcrumbPage", children: ["Current page"] }
  `.trim(),
  BreadcrumbSeparator: `
  Sub-component of Breadcrumb.
  ---
  example config: { component: "BreadcrumbSeparator" }
  `.trim(),
  BreadcrumbEllipsis: `
  Sub-component of Breadcrumb.
  ---
  example config: { component: "BreadcrumbEllipsis" }
  `.trim(),
}
