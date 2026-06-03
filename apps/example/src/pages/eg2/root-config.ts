// apps/example/src/pages/eg2/root-config.ts
import type { ComponentNode } from "@beta-epic/ui";

export const eg2RootConfig: ComponentNode = {
  component: "SidebarProvider",
  props: {
    open: { $ref: "page.store:sidebarOpen" },
    onOpenChange: {
      $action: {
        type: "page.store.update",
        path: "sidebarOpen",
        payload: { $arg: 0 },
      },
    },
    className: "min-h-svh bg-background text-foreground",
  },
  selectors: {
    pageSizeNumber: { $number: { $ref: "page.store:pageSize" } },
    activeRange: {
      $find: {
        over: { $ref: "page.store:chartRanges" },
        as: "range",
        where: {
          $eq: {
            a: { $ref: "var:range.id" },
            b: { $ref: "page.store:chartRange" },
          },
        },
      },
    },
    filteredReviews: {
      $filter: {
        over: { $ref: "page.store:reviews" },
        as: "row",
        where: {
          $or: [
            {
              $contains: {
                value: { $lower: { $ref: "var:row.title" } },
                search: { $lower: { $ref: "page.store:tableQuery" } },
              },
            },
            {
              $contains: {
                value: { $lower: { $ref: "var:row.type" } },
                search: { $lower: { $ref: "page.store:tableQuery" } },
              },
            },
            {
              $contains: {
                value: { $lower: { $ref: "var:row.reviewer" } },
                search: { $lower: { $ref: "page.store:tableQuery" } },
              },
            },
          ],
        },
      },
    },
    totalPages: {
      $if: {
        cond: {
          $gt: {
            a: { $count: { $ref: "selectors:filteredReviews" } },
            b: 0,
          },
        },
        then: {
          $ceil: {
            $div: [
              { $count: { $ref: "selectors:filteredReviews" } },
              { $ref: "selectors:pageSizeNumber" },
            ],
          },
        },
        else: 1,
      },
    },
    paginatedReviews: {
      $slice: {
        over: { $ref: "selectors:filteredReviews" },
        start: {
          $mul: [
            { $ref: "page.store:page" },
            { $ref: "selectors:pageSizeNumber" },
          ],
        },
        end: {
          $mul: [
            { $add: [{ $ref: "page.store:page" }, 1] },
            { $ref: "selectors:pageSizeNumber" },
          ],
        },
      },
    },
    selectedCount: { $count: { $ref: "page.store:selectedIds" } },
    pageStart: {
      $if: {
        cond: {
          $gt: {
            a: { $count: { $ref: "selectors:paginatedReviews" } },
            b: 0,
          },
        },
        then: {
          $add: [
            {
              $mul: [
                { $ref: "page.store:page" },
                { $ref: "selectors:pageSizeNumber" },
              ],
            },
            1,
          ],
        },
        else: 0,
      },
    },
    pageEnd: {
      $add: [
        {
          $mul: [
            { $ref: "page.store:page" },
            { $ref: "selectors:pageSizeNumber" },
          ],
        },
        { $count: { $ref: "selectors:paginatedReviews" } },
      ],
    },
    prevDisabled: {
      $eq: { a: { $ref: "page.store:page" }, b: 0 },
    },
    nextDisabled: {
      $gte: {
        a: { $add: [{ $ref: "page.store:page" }, 1] },
        b: { $ref: "selectors:totalPages" },
      },
    },
  },
  children: [
    {
      component: "Sidebar",
      props: {
        variant: "inset",
        collapsible: "icon",
      },
      children: [
        {
          component: "SidebarHeader",
          children: [
            {
              component: "div",
              props: {
                className:
                  "flex items-center gap-3 rounded-lg px-2 py-2 text-sidebar-foreground",
              },
              children: [
                {
                  component: "div",
                  props: {
                    className:
                      "flex size-8 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground",
                  },
                  children: [{ component: "Layers" }],
                },
                {
                  component: "div",
                  props: { className: "min-w-0 flex-1" },
                  children: [
                    {
                      component: "P",
                      props: {
                        className: "mt-0 text-sm font-medium leading-none",
                      },
                      children: ["Acme Inc"],
                    },
                    {
                      component: "Muted",
                      props: {
                        className: "mt-1 text-xs text-sidebar-foreground/70",
                      },
                      children: ["Beta Epic workspace"],
                    },
                  ],
                },
              ],
            },
          ],
        },
        {
          component: "SidebarContent",
          children: [
            {
              component: "SidebarGroup",
              children: [
                {
                  component: "SidebarGroupLabel",
                  children: ["Platform"],
                },
                {
                  component: "SidebarGroupContent",
                  children: [
                    {
                      component: "SidebarMenu",
                      children: [
                        {
                          component: "SidebarMenuItem",
                          children: [
                            {
                              component: "SidebarMenuButton",
                              props: {
                                isActive: {
                                  $eq: {
                                    a: { $ref: "page.store:activeNav" },
                                    b: "dashboard",
                                  },
                                },
                                onClick: {
                                  $action: [
                                    {
                                      type: "page.store.update",
                                      path: "activeNav",
                                      payload: "dashboard",
                                    },
                                    {
                                      type: "page.store.update",
                                      path: "activeHeading",
                                      payload: "Dashboard",
                                    },
                                  ],
                                },
                              },
                              children: [
                                { component: "LayoutGrid" },
                                "Dashboard",
                              ],
                            },
                          ],
                        },
                        {
                          component: "SidebarMenuItem",
                          children: [
                            {
                              component: "SidebarMenuButton",
                              props: {
                                isActive: {
                                  $eq: {
                                    a: { $ref: "page.store:activeNav" },
                                    b: "lifecycle",
                                  },
                                },
                                onClick: {
                                  $action: [
                                    {
                                      type: "page.store.update",
                                      path: "activeNav",
                                      payload: "lifecycle",
                                    },
                                    {
                                      type: "page.store.update",
                                      path: "activeHeading",
                                      payload: "Lifecycle",
                                    },
                                  ],
                                },
                              },
                              children: [{ component: "Layers" }, "Lifecycle"],
                            },
                          ],
                        },
                        {
                          component: "SidebarMenuItem",
                          children: [
                            {
                              component: "SidebarMenuButton",
                              props: {
                                isActive: {
                                  $eq: {
                                    a: { $ref: "page.store:activeNav" },
                                    b: "analytics",
                                  },
                                },
                                onClick: {
                                  $action: [
                                    {
                                      type: "page.store.update",
                                      path: "activeNav",
                                      payload: "analytics",
                                    },
                                    {
                                      type: "page.store.update",
                                      path: "activeHeading",
                                      payload: "Analytics",
                                    },
                                  ],
                                },
                              },
                              children: [
                                { component: "BarChart2" },
                                "Analytics",
                              ],
                            },
                          ],
                        },
                        {
                          component: "SidebarMenuItem",
                          children: [
                            {
                              component: "SidebarMenuButton",
                              props: {
                                isActive: {
                                  $eq: {
                                    a: { $ref: "page.store:activeNav" },
                                    b: "projects",
                                  },
                                },
                                onClick: {
                                  $action: [
                                    {
                                      type: "page.store.update",
                                      path: "activeNav",
                                      payload: "projects",
                                    },
                                    {
                                      type: "page.store.update",
                                      path: "activeHeading",
                                      payload: "Projects",
                                    },
                                  ],
                                },
                              },
                              children: [
                                { component: "FolderKanban" },
                                "Projects",
                              ],
                            },
                          ],
                        },
                        {
                          component: "SidebarMenuItem",
                          children: [
                            {
                              component: "SidebarMenuButton",
                              props: {
                                isActive: {
                                  $eq: {
                                    a: { $ref: "page.store:activeNav" },
                                    b: "team",
                                  },
                                },
                                onClick: {
                                  $action: [
                                    {
                                      type: "page.store.update",
                                      path: "activeNav",
                                      payload: "team",
                                    },
                                    {
                                      type: "page.store.update",
                                      path: "activeHeading",
                                      payload: "Team",
                                    },
                                  ],
                                },
                              },
                              children: [{ component: "Users" }, "Team"],
                            },
                          ],
                        },
                      ],
                    },
                  ],
                },
              ],
            },
            {
              component: "SidebarGroup",
              children: [
                {
                  component: "SidebarGroupLabel",
                  children: ["Documents"],
                },
                {
                  component: "SidebarGroupContent",
                  children: [
                    {
                      component: "SidebarMenu",
                      children: [
                        {
                          component: "SidebarMenuItem",
                          children: [
                            {
                              component: "SidebarMenuButton",
                              props: {
                                isActive: {
                                  $eq: {
                                    a: { $ref: "page.store:activeNav" },
                                    b: "data-library",
                                  },
                                },
                                onClick: {
                                  $action: [
                                    {
                                      type: "page.store.update",
                                      path: "activeNav",
                                      payload: "data-library",
                                    },
                                    {
                                      type: "page.store.update",
                                      path: "activeHeading",
                                      payload: "Documents",
                                    },
                                  ],
                                },
                              },
                              children: [
                                { component: "Bookmark" },
                                "Data Library",
                              ],
                            },
                          ],
                        },
                        {
                          component: "SidebarMenuItem",
                          children: [
                            {
                              component: "SidebarMenuButton",
                              props: {
                                isActive: {
                                  $eq: {
                                    a: { $ref: "page.store:activeNav" },
                                    b: "reports",
                                  },
                                },
                                onClick: {
                                  $action: [
                                    {
                                      type: "page.store.update",
                                      path: "activeNav",
                                      payload: "reports",
                                    },
                                    {
                                      type: "page.store.update",
                                      path: "activeHeading",
                                      payload: "Reports",
                                    },
                                  ],
                                },
                              },
                              children: [{ component: "BarChart2" }, "Reports"],
                            },
                          ],
                        },
                        {
                          component: "SidebarMenuItem",
                          children: [
                            {
                              component: "SidebarMenuButton",
                              props: {
                                isActive: {
                                  $eq: {
                                    a: { $ref: "page.store:activeNav" },
                                    b: "assistant",
                                  },
                                },
                                onClick: {
                                  $action: [
                                    {
                                      type: "page.store.update",
                                      path: "activeNav",
                                      payload: "assistant",
                                    },
                                    {
                                      type: "page.store.update",
                                      path: "activeHeading",
                                      payload: "Word Assistant",
                                    },
                                  ],
                                },
                              },
                              children: [
                                { component: "MessageSquareDashed" },
                                "Word Assistant",
                              ],
                            },
                          ],
                        },
                        {
                          component: "SidebarMenuItem",
                          children: [
                            {
                              component: "SidebarMenuButton",
                              props: {
                                isActive: {
                                  $eq: {
                                    a: { $ref: "page.store:activeNav" },
                                    b: "more",
                                  },
                                },
                                onClick: {
                                  $action: [
                                    {
                                      type: "page.store.update",
                                      path: "activeNav",
                                      payload: "more",
                                    },
                                    {
                                      type: "page.store.update",
                                      path: "activeHeading",
                                      payload: "More",
                                    },
                                  ],
                                },
                              },
                              children: [
                                { component: "MoreHorizontal" },
                                "More",
                              ],
                            },
                          ],
                        },
                      ],
                    },
                  ],
                },
              ],
            },
          ],
        },
        {
          component: "SidebarFooter",
          children: [
            {
              component: "SidebarMenu",
              children: [
                {
                  component: "SidebarMenuItem",
                  children: [
                    {
                      component: "SidebarMenuButton",
                      props: {
                        onClick: {
                          $action: {
                            type: "snackbar",
                            message: "Settings is not wired yet.",
                            variant: "info",
                          },
                        },
                      },
                      children: [{ component: "Sliders" }, "Settings"],
                    },
                  ],
                },
                {
                  component: "SidebarMenuItem",
                  children: [
                    {
                      component: "SidebarMenuButton",
                      props: {
                        onClick: {
                          $action: {
                            type: "snackbar",
                            message: "Help center is not wired yet.",
                            variant: "info",
                          },
                        },
                      },
                      children: [{ component: "InfoIcon" }, "Get Help"],
                    },
                  ],
                },
                {
                  component: "SidebarMenuItem",
                  children: [
                    {
                      component: "SidebarMenuButton",
                      props: {
                        onClick: {
                          $action: {
                            type: "snackbar",
                            message: "Global search is not wired yet.",
                            variant: "info",
                          },
                        },
                      },
                      children: [{ component: "SearchIcon" }, "Search"],
                    },
                  ],
                },
              ],
            },
            {
              component: "SidebarSeparator",
            },
            {
              component: "div",
              props: {
                className:
                  "flex items-center gap-3 rounded-lg px-2 py-2 text-sidebar-foreground",
              },
              children: [
                {
                  component: "Avatar",
                  children: [
                    {
                      component: "AvatarFallback",
                      children: ["SH"],
                    },
                  ],
                },
                {
                  component: "div",
                  props: { className: "min-w-0 flex-1" },
                  children: [
                    {
                      component: "P",
                      props: {
                        className: "mt-0 text-sm font-medium leading-none",
                      },
                      children: ["Shadcn"],
                    },
                    {
                      component: "Muted",
                      props: {
                        className: "mt-1 text-xs text-sidebar-foreground/70",
                      },
                      children: ["m@example.com"],
                    },
                  ],
                },
                {
                  component: "Button",
                  props: {
                    variant: "ghost",
                    size: "icon-sm",
                    onClick: {
                      $action: {
                        type: "snackbar",
                        message: "Account actions are not wired yet.",
                        variant: "info",
                      },
                    },
                  },
                  children: [{ component: "MoreHorizontal" }],
                },
              ],
            },
          ],
        },
      ],
    },
    {
      component: "SidebarInset",
      children: [
        {
          component: "div",
          props: { className: "flex min-h-svh flex-col" },
          children: [
            {
              component: "div",
              props: {
                className:
                  "sticky top-0 z-10 flex items-center justify-between border-b bg-background/95 px-6 py-3 backdrop-blur",
              },
              children: [
                {
                  component: "div",
                  props: { className: "flex items-center gap-3" },
                  children: [
                    { component: "SidebarTrigger" },
                    {
                      component: "Separator",
                      props: { orientation: "vertical", className: "h-6" },
                    },
                    {
                      component: "div",
                      children: [
                        {
                          component: "H4",
                          props: {
                            className: "scroll-m-0 text-base font-semibold",
                          },
                          children: [{ $ref: "page.store:activeHeading" }],
                        },
                        {
                          component: "Muted",
                          props: { className: "mt-1 text-xs" },
                          children: ["Operational overview and review queue"],
                        },
                      ],
                    },
                  ],
                },
                {
                  component: "div",
                  props: { className: "flex items-center gap-2" },
                  children: [
                    {
                      component: "Button",
                      props: {
                        variant: "outline",
                        onClick: {
                          $action: {
                            type: "snackbar",
                            message: "View in shadcn is a placeholder.",
                            variant: "info",
                          },
                        },
                      },
                      children: [
                        "View in shadcn",
                        {
                          component: "ArrowLeft",
                          props: { className: "rotate-180" },
                        },
                      ],
                    },
                    {
                      component: "Button",
                      props: {
                        onClick: {
                          $action: {
                            type: "snackbar",
                            message: "Export is not wired yet.",
                            variant: "info",
                          },
                        },
                      },
                      children: [{ component: "Send" }, "Export snapshot"],
                    },
                  ],
                },
              ],
            },
            {
              component: "div",
              props: { className: "flex-1 space-y-6 px-6 py-6" },
              children: [
                {
                  component: "div",
                  props: { className: "grid gap-4 xl:grid-cols-4" },
                  children: [
                    {
                      $map: {
                        over: { $ref: "page.store:metrics" },
                        as: "metric",
                        return: {
                          component: "Card",
                          children: [
                            {
                              component: "CardHeader",
                              props: { className: "space-y-4" },
                              children: [
                                {
                                  component: "div",
                                  props: {
                                    className:
                                      "flex items-start justify-between gap-3",
                                  },
                                  children: [
                                    {
                                      component: "div",
                                      children: [
                                        {
                                          component: "CardDescription",
                                          children: [
                                            { $ref: "var:metric.label" },
                                          ],
                                        },
                                        {
                                          component: "CardTitle",
                                          props: { className: "mt-2 text-3xl" },
                                          children: [
                                            { $ref: "var:metric.value" },
                                          ],
                                        },
                                      ],
                                    },
                                    {
                                      component: "Badge",
                                      props: {
                                        variant: {
                                          $if: {
                                            cond: {
                                              $eq: {
                                                a: { $ref: "var:metric.tone" },
                                                b: "down",
                                              },
                                            },
                                            then: "destructive",
                                            else: "secondary",
                                          },
                                        },
                                        className: "gap-1.5",
                                      },
                                      children: [
                                        {
                                          $if: {
                                            cond: {
                                              $eq: {
                                                a: { $ref: "var:metric.tone" },
                                                b: "down",
                                              },
                                            },
                                            then: { component: "MinusIcon" },
                                            else: { component: "Sparkles" },
                                          },
                                        },
                                        { $ref: "var:metric.delta" },
                                      ],
                                    },
                                  ],
                                },
                              ],
                            },
                            {
                              component: "CardContent",
                              props: { className: "space-y-1" },
                              children: [
                                {
                                  component: "P",
                                  props: {
                                    className: "mt-0 text-sm font-medium",
                                  },
                                  children: [{ $ref: "var:metric.summary" }],
                                },
                                {
                                  component: "Muted",
                                  props: { className: "text-sm" },
                                  children: [{ $ref: "var:metric.detail" }],
                                },
                              ],
                            },
                          ],
                        },
                      },
                    },
                  ],
                },
                {
                  component: "Card",
                  children: [
                    {
                      component: "CardHeader",
                      props: {
                        className:
                          "flex flex-col gap-4 border-b pb-4 md:flex-row md:items-start md:justify-between",
                      },
                      children: [
                        {
                          component: "div",
                          children: [
                            {
                              component: "CardTitle",
                              children: ["Total Visitors"],
                            },
                            {
                              component: "CardDescription",
                              props: { className: "mt-1" },
                              children: [
                                { $ref: "selectors:activeRange.subtitle" },
                              ],
                            },
                          ],
                        },
                        {
                          component: "Tabs",
                          props: {
                            value: { $ref: "page.store:chartRange" },
                            onValueChange: {
                              $action: {
                                type: "page.store.update",
                                path: "chartRange",
                                payload: { $arg: 0 },
                              },
                            },
                          },
                          children: [
                            {
                              component: "TabsList",
                              children: [
                                {
                                  component: "TabsTrigger",
                                  props: { value: "90d" },
                                  children: ["Last 3 months"],
                                },
                                {
                                  component: "TabsTrigger",
                                  props: { value: "30d" },
                                  children: ["Last 30 days"],
                                },
                                {
                                  component: "TabsTrigger",
                                  props: { value: "7d" },
                                  children: ["Last 7 days"],
                                },
                              ],
                            },
                          ],
                        },
                      ],
                    },
                    {
                      component: "CardContent",
                      props: { className: "space-y-6 pt-6" },
                      children: [
                        {
                          component: "div",
                          props: {
                            className:
                              "flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between",
                          },
                          children: [
                            {
                              component: "div",
                              children: [
                                {
                                  component: "H3",
                                  props: { className: "scroll-m-0 text-3xl" },
                                  children: [
                                    { $ref: "selectors:activeRange.total" },
                                  ],
                                },
                                {
                                  component: "Muted",
                                  props: { className: "mt-1 text-sm" },
                                  children: ["Desktop and mobile visits"],
                                },
                              ],
                            },
                            {
                              component: "div",
                              props: { className: "flex items-center gap-4" },
                              children: [
                                {
                                  component: "div",
                                  props: {
                                    className: "flex items-center gap-2",
                                  },
                                  children: [
                                    {
                                      component: "div",
                                      props: {
                                        className:
                                          "size-2.5 rounded-full bg-chart-1",
                                      },
                                    },
                                    {
                                      component: "Muted",
                                      props: { className: "text-xs" },
                                      children: ["Desktop"],
                                    },
                                  ],
                                },
                                {
                                  component: "div",
                                  props: {
                                    className: "flex items-center gap-2",
                                  },
                                  children: [
                                    {
                                      component: "div",
                                      props: {
                                        className:
                                          "size-2.5 rounded-full bg-chart-2",
                                      },
                                    },
                                    {
                                      component: "Muted",
                                      props: { className: "text-xs" },
                                      children: ["Mobile"],
                                    },
                                  ],
                                },
                              ],
                            },
                          ],
                        },
                        {
                          component: "div",
                          props: {
                            className:
                              "grid items-end gap-3 rounded-xl border bg-muted/20 p-4 md:grid-cols-12",
                          },
                          children: [
                            {
                              $map: {
                                over: { $ref: "selectors:activeRange.points" },
                                as: "point",
                                return: {
                                  component: "div",
                                  props: {
                                    className:
                                      "flex min-w-0 flex-col items-center gap-3",
                                  },
                                  children: [
                                    {
                                      component: "div",
                                      props: {
                                        className:
                                          "flex h-48 w-full items-end justify-center gap-1",
                                      },
                                      children: [
                                        {
                                          component: "div",
                                          props: {
                                            className:
                                              "w-3 rounded-t-md bg-chart-1 transition-all",
                                            style: {
                                              height: {
                                                $concat: [
                                                  {
                                                    $string: {
                                                      $ref: "var:point.desktopPct",
                                                    },
                                                  },
                                                  "%",
                                                ],
                                              },
                                            },
                                          },
                                        },
                                        {
                                          component: "div",
                                          props: {
                                            className:
                                              "w-3 rounded-t-md bg-chart-2 transition-all",
                                            style: {
                                              height: {
                                                $concat: [
                                                  {
                                                    $string: {
                                                      $ref: "var:point.mobilePct",
                                                    },
                                                  },
                                                  "%",
                                                ],
                                              },
                                            },
                                          },
                                        },
                                      ],
                                    },
                                    {
                                      component: "Muted",
                                      props: {
                                        className:
                                          "text-center text-[11px] leading-none md:text-xs",
                                      },
                                      children: [{ $ref: "var:point.label" }],
                                    },
                                  ],
                                },
                              },
                            },
                          ],
                        },
                      ],
                    },
                  ],
                },
                {
                  component: "Card",
                  children: [
                    {
                      component: "CardHeader",
                      props: {
                        className:
                          "flex flex-col gap-4 border-b pb-4 lg:flex-row lg:items-center lg:justify-between",
                      },
                      children: [
                        {
                          component: "div",
                          children: [
                            {
                              component: "CardTitle",
                              children: ["Review Queue"],
                            },
                            {
                              component: "CardDescription",
                              props: { className: "mt-1" },
                              children: [
                                "Searchable review table with selection, reviewer assignment, and pagination.",
                              ],
                            },
                          ],
                        },
                        {
                          component: "div",
                          props: {
                            className: "flex flex-col gap-2 sm:flex-row",
                          },
                          children: [
                            {
                              component: "div",
                              props: { className: "relative min-w-72" },
                              children: [
                                {
                                  component: "SearchIcon",
                                  props: {
                                    className:
                                      "pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground",
                                  },
                                },
                                {
                                  component: "Input",
                                  props: {
                                    value: { $ref: "page.store:tableQuery" },
                                    placeholder:
                                      "Search capabilities, type, or reviewer",
                                    className: "pl-9",
                                    onChange: {
                                      $action: [
                                        {
                                          type: "page.store.update",
                                          path: "tableQuery",
                                          payload: {
                                            $arg: 0,
                                            path: "currentTarget.value",
                                          },
                                        },
                                        {
                                          type: "page.store.update",
                                          path: "page",
                                          payload: 0,
                                        },
                                      ],
                                    },
                                  },
                                },
                              ],
                            },
                            {
                              component: "Button",
                              props: {
                                variant: "outline",
                                onClick: {
                                  $action: {
                                    type: "snackbar",
                                    message: "Filters are not wired yet.",
                                    variant: "info",
                                  },
                                },
                              },
                              children: [{ component: "Sliders" }, "Filters"],
                            },
                          ],
                        },
                      ],
                    },
                    {
                      component: "CardContent",
                      props: { className: "space-y-4 pt-6" },
                      children: [
                        {
                          component: "Table",
                          children: [
                            {
                              component: "TableHeader",
                              children: [
                                {
                                  component: "TableRow",
                                  children: [
                                    {
                                      component: "TableHead",
                                      props: { className: "w-10" },
                                      children: [""],
                                    },
                                    {
                                      component: "TableHead",
                                      props: { className: "w-10" },
                                      children: [""],
                                    },
                                    {
                                      component: "TableHead",
                                      children: ["Capability"],
                                    },
                                    {
                                      component: "TableHead",
                                      props: { className: "w-36" },
                                      children: ["Type"],
                                    },
                                    {
                                      component: "TableHead",
                                      props: { className: "w-36" },
                                      children: ["Status"],
                                    },
                                    {
                                      component: "TableHead",
                                      props: { className: "w-24" },
                                      children: ["Tasks"],
                                    },
                                    {
                                      component: "TableHead",
                                      props: { className: "w-24" },
                                      children: ["Score"],
                                    },
                                    {
                                      component: "TableHead",
                                      props: { className: "w-48" },
                                      children: ["Reviewer"],
                                    },
                                    {
                                      component: "TableHead",
                                      props: { className: "w-16 text-right" },
                                      children: [""],
                                    },
                                  ],
                                },
                              ],
                            },
                            {
                              component: "TableBody",
                              children: [
                                {
                                  $map: {
                                    over: {
                                      $ref: "selectors:paginatedReviews",
                                    },
                                    as: "row",
                                    return: {
                                      component: "TableRow",
                                      children: [
                                        {
                                          component: "TableCell",
                                          props: { className: "w-10" },
                                          children: [
                                            {
                                              component: "GripVerticalIcon",
                                              props: {
                                                className:
                                                  "text-muted-foreground",
                                              },
                                            },
                                          ],
                                        },
                                        {
                                          component: "TableCell",
                                          props: { className: "w-10" },
                                          children: [
                                            {
                                              component: "Checkbox",
                                              props: {
                                                checked: {
                                                  $some: {
                                                    over: {
                                                      $ref: "page.store:selectedIds",
                                                    },
                                                    as: "selectedId",
                                                    where: {
                                                      $eq: {
                                                        a: {
                                                          $ref: "var:selectedId",
                                                        },
                                                        b: {
                                                          $ref: "var:row.id",
                                                        },
                                                      },
                                                    },
                                                  },
                                                },
                                                onCheckedChange: {
                                                  $action: {
                                                    type: "page.store.update",
                                                    path: "selectedIds",
                                                    payload: {
                                                      $if: {
                                                        cond: { $arg: 0 },
                                                        then: {
                                                          $append: {
                                                            to: {
                                                              $ref: "page.store:selectedIds",
                                                            },
                                                            item: {
                                                              $ref: "var:row.id",
                                                            },
                                                          },
                                                        },
                                                        else: {
                                                          $filter: {
                                                            over: {
                                                              $ref: "page.store:selectedIds",
                                                            },
                                                            as: "selectedId",
                                                            where: {
                                                              $neq: {
                                                                a: {
                                                                  $ref: "var:selectedId",
                                                                },
                                                                b: {
                                                                  $ref: "var:row.id",
                                                                },
                                                              },
                                                            },
                                                          },
                                                        },
                                                      },
                                                    },
                                                  },
                                                },
                                              },
                                            },
                                          ],
                                        },
                                        {
                                          component: "TableCell",
                                          children: [{ $ref: "var:row.title" }],
                                        },
                                        {
                                          component: "TableCell",
                                          props: { className: "w-36" },
                                          children: [
                                            {
                                              component: "Badge",
                                              props: {
                                                variant: "outline",
                                              },
                                              children: [
                                                { $ref: "var:row.type" },
                                              ],
                                            },
                                          ],
                                        },
                                        {
                                          component: "TableCell",
                                          props: { className: "w-36" },
                                          children: [
                                            {
                                              component: "Badge",
                                              props: {
                                                variant: {
                                                  $if: {
                                                    cond: {
                                                      $eq: {
                                                        a: {
                                                          $ref: "var:row.status",
                                                        },
                                                        b: "done",
                                                      },
                                                    },
                                                    then: "secondary",
                                                    else: "outline",
                                                  },
                                                },
                                                className: "gap-1.5",
                                              },
                                              children: [
                                                {
                                                  $if: {
                                                    cond: {
                                                      $eq: {
                                                        a: {
                                                          $ref: "var:row.status",
                                                        },
                                                        b: "done",
                                                      },
                                                    },
                                                    then: {
                                                      component:
                                                        "CircleCheckIcon",
                                                    },
                                                    else: {
                                                      component: "Loader2Icon",
                                                      props: {
                                                        className:
                                                          "animate-spin",
                                                      },
                                                    },
                                                  },
                                                },
                                                {
                                                  $if: {
                                                    cond: {
                                                      $eq: {
                                                        a: {
                                                          $ref: "var:row.status",
                                                        },
                                                        b: "done",
                                                      },
                                                    },
                                                    then: "Done",
                                                    else: "In Process",
                                                  },
                                                },
                                              ],
                                            },
                                          ],
                                        },
                                        {
                                          component: "TableCell",
                                          props: { className: "w-24" },
                                          children: [{ $ref: "var:row.tasks" }],
                                        },
                                        {
                                          component: "TableCell",
                                          props: { className: "w-24" },
                                          children: [{ $ref: "var:row.score" }],
                                        },
                                        {
                                          component: "TableCell",
                                          props: { className: "w-48" },
                                          children: [
                                            {
                                              component: "Select",
                                              props: {
                                                value: {
                                                  $ref: "var:row.reviewer",
                                                },
                                                onValueChange: {
                                                  $action: {
                                                    type: "page.store.update",
                                                    path: "reviews",
                                                    payload: {
                                                      $map: {
                                                        over: {
                                                          $ref: "page.store:reviews",
                                                        },
                                                        as: "review",
                                                        return: {
                                                          id: {
                                                            $ref: "var:review.id",
                                                          },
                                                          title: {
                                                            $ref: "var:review.title",
                                                          },
                                                          type: {
                                                            $ref: "var:review.type",
                                                          },
                                                          status: {
                                                            $ref: "var:review.status",
                                                          },
                                                          tasks: {
                                                            $ref: "var:review.tasks",
                                                          },
                                                          score: {
                                                            $ref: "var:review.score",
                                                          },
                                                          reviewer: {
                                                            $if: {
                                                              cond: {
                                                                $eq: {
                                                                  a: {
                                                                    $ref: "var:review.id",
                                                                  },
                                                                  b: {
                                                                    $ref: "var:row.id",
                                                                  },
                                                                },
                                                              },
                                                              then: { $arg: 0 },
                                                              else: {
                                                                $ref: "var:review.reviewer",
                                                              },
                                                            },
                                                          },
                                                        },
                                                      },
                                                    },
                                                  },
                                                },
                                              },
                                              children: [
                                                {
                                                  component: "SelectTrigger",
                                                  props: { className: "w-40" },
                                                  children: [
                                                    {
                                                      component: "SelectValue",
                                                    },
                                                  ],
                                                },
                                                {
                                                  component: "SelectContent",
                                                  children: [
                                                    {
                                                      $map: {
                                                        over: {
                                                          $ref: "page.store:reviewers",
                                                        },
                                                        as: "reviewer",
                                                        return: {
                                                          component:
                                                            "SelectItem",
                                                          props: {
                                                            value: {
                                                              $ref: "var:reviewer",
                                                            },
                                                          },
                                                          children: [
                                                            {
                                                              $ref: "var:reviewer",
                                                            },
                                                          ],
                                                        },
                                                      },
                                                    },
                                                  ],
                                                },
                                              ],
                                            },
                                          ],
                                        },
                                        {
                                          component: "TableCell",
                                          props: {
                                            className: "w-16 text-right",
                                          },
                                          children: [
                                            {
                                              component: "Button",
                                              props: {
                                                variant: "ghost",
                                                size: "icon-sm",
                                                onClick: {
                                                  $action: {
                                                    type: "snackbar",
                                                    message:
                                                      "Row actions are not wired yet.",
                                                    variant: "info",
                                                  },
                                                },
                                              },
                                              children: [
                                                { component: "MoreHorizontal" },
                                              ],
                                            },
                                          ],
                                        },
                                      ],
                                    },
                                  },
                                },
                              ],
                            },
                          ],
                        },
                        {
                          component: "div",
                          props: {
                            className:
                              "flex flex-col gap-4 border-t pt-4 lg:flex-row lg:items-center lg:justify-between",
                          },
                          children: [
                            {
                              component: "Muted",
                              props: { className: "text-sm" },
                              children: [
                                { $ref: "selectors:selectedCount" },
                                " of ",
                                {
                                  $count: { $ref: "selectors:filteredReviews" },
                                },
                                " row(s) selected.",
                              ],
                            },
                            {
                              component: "div",
                              props: {
                                className: "flex flex-wrap items-center gap-4",
                              },
                              children: [
                                {
                                  component: "div",
                                  props: {
                                    className: "flex items-center gap-2",
                                  },
                                  children: [
                                    {
                                      component: "Muted",
                                      props: { className: "text-sm" },
                                      children: ["Rows per page"],
                                    },
                                    {
                                      component: "Select",
                                      props: {
                                        value: { $ref: "page.store:pageSize" },
                                        onValueChange: {
                                          $action: [
                                            {
                                              type: "page.store.update",
                                              path: "pageSize",
                                              payload: { $arg: 0 },
                                            },
                                            {
                                              type: "page.store.update",
                                              path: "page",
                                              payload: 0,
                                            },
                                          ],
                                        },
                                      },
                                      children: [
                                        {
                                          component: "SelectTrigger",
                                          props: { className: "w-20" },
                                          children: [
                                            { component: "SelectValue" },
                                          ],
                                        },
                                        {
                                          component: "SelectContent",
                                          children: [
                                            {
                                              component: "SelectItem",
                                              props: { value: "5" },
                                              children: ["5"],
                                            },
                                            {
                                              component: "SelectItem",
                                              props: { value: "10" },
                                              children: ["10"],
                                            },
                                            {
                                              component: "SelectItem",
                                              props: { value: "20" },
                                              children: ["20"],
                                            },
                                          ],
                                        },
                                      ],
                                    },
                                  ],
                                },
                                {
                                  component: "Muted",
                                  props: { className: "text-sm" },
                                  children: [
                                    { $ref: "selectors:pageStart" },
                                    "-",
                                    { $ref: "selectors:pageEnd" },
                                    " of ",
                                    {
                                      $count: {
                                        $ref: "selectors:filteredReviews",
                                      },
                                    },
                                  ],
                                },
                                {
                                  component: "div",
                                  props: {
                                    className: "flex items-center gap-2",
                                  },
                                  children: [
                                    {
                                      component: "Button",
                                      props: {
                                        variant: "outline",
                                        size: "icon-sm",
                                        disabled: {
                                          $ref: "selectors:prevDisabled",
                                        },
                                        onClick: {
                                          $action: {
                                            type: "page.store.update",
                                            path: "page",
                                            payload: {
                                              $sub: [
                                                { $ref: "page.store:page" },
                                                1,
                                              ],
                                            },
                                          },
                                        },
                                      },
                                      children: [
                                        { component: "ChevronsLeftIcon" },
                                      ],
                                    },
                                    {
                                      component: "Button",
                                      props: {
                                        variant: "outline",
                                        size: "icon-sm",
                                        disabled: {
                                          $ref: "selectors:prevDisabled",
                                        },
                                        onClick: {
                                          $action: {
                                            type: "page.store.update",
                                            path: "page",
                                            payload: {
                                              $sub: [
                                                { $ref: "page.store:page" },
                                                1,
                                              ],
                                            },
                                          },
                                        },
                                      },
                                      children: [
                                        { component: "ChevronLeftIcon" },
                                      ],
                                    },
                                    {
                                      component: "Muted",
                                      props: {
                                        className:
                                          "min-w-20 text-center text-sm",
                                      },
                                      children: [
                                        "Page ",
                                        {
                                          $add: [
                                            { $ref: "page.store:page" },
                                            1,
                                          ],
                                        },
                                        " of ",
                                        { $ref: "selectors:totalPages" },
                                      ],
                                    },
                                    {
                                      component: "Button",
                                      props: {
                                        variant: "outline",
                                        size: "icon-sm",
                                        disabled: {
                                          $ref: "selectors:nextDisabled",
                                        },
                                        onClick: {
                                          $action: {
                                            type: "page.store.update",
                                            path: "page",
                                            payload: {
                                              $add: [
                                                { $ref: "page.store:page" },
                                                1,
                                              ],
                                            },
                                          },
                                        },
                                      },
                                      children: [
                                        { component: "ChevronRightIcon" },
                                      ],
                                    },
                                    {
                                      component: "Button",
                                      props: {
                                        variant: "outline",
                                        size: "icon-sm",
                                        disabled: {
                                          $ref: "selectors:nextDisabled",
                                        },
                                        onClick: {
                                          $action: {
                                            type: "page.store.update",
                                            path: "page",
                                            payload: {
                                              $sub: [
                                                {
                                                  $ref: "selectors:totalPages",
                                                },
                                                1,
                                              ],
                                            },
                                          },
                                        },
                                      },
                                      children: [
                                        { component: "ChevronRightIcon" },
                                        {
                                          component: "ChevronRightIcon",
                                          props: { className: "-ml-2" },
                                        },
                                      ],
                                    },
                                  ],
                                },
                              ],
                            },
                          ],
                        },
                      ],
                    },
                  ],
                },
              ],
            },
          ],
        },
      ],
    },
  ],
};
