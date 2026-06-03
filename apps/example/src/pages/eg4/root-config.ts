// @ts-nocheck
import type { ComponentNode } from "@beta-epic/ui";

// ── Helpers ───────────────────────────────────────────────────────────────────

function navBtn(label: string, icon: string): ComponentNode {
  return {
    component: "Button",
    props: {
      variant: "ghost",
      className: {
        $fn: "cn",
        args: [
          "w-full justify-start gap-2 h-8 px-2 text-sm font-normal",
          {
            $if: {
              cond: { $eq: { a: { $ref: "page.store:activeNav" }, b: label } },
              then: "bg-accent text-accent-foreground font-medium",
              else: "text-muted-foreground hover:text-foreground",
            },
          },
        ],
      },
      onClick: {
        $action: [{ type: "page.store.update", path: "activeNav", payload: label }],
      },
    },
    children: [
      { component: icon, props: { className: "size-4 shrink-0" } },
      label,
    ],
  };
}

function timeBtn(value: string, label: string): ComponentNode {
  return {
    component: "Button",
    props: {
      variant: {
        $if: {
          cond: { $eq: { a: { $ref: "page.store:timeRange" }, b: value } },
          then: "secondary",
          else: "ghost",
        },
      },
      size: "sm",
      className: "h-7 text-xs",
      onClick: {
        $action: [{ type: "page.store.update", path: "timeRange", payload: value }],
      },
    },
    children: [label],
  };
}

// ── Root config ───────────────────────────────────────────────────────────────

export const eg4RootConfig: ComponentNode = {
  component: "div",
  props: { className: "flex h-screen overflow-hidden bg-background" },
  selectors: {
    totalPages: {
      $ceil: { $div: [{ $ref: "page.store:totalRows" }, { $ref: "page.store:pageSize" }] },
    },
    pageLabel: {
      $concat: [
        "Page ",
        { $string: { $add: [{ $ref: "page.store:page" }, 1] } },
        " of ",
        {
          $string: {
            $ceil: { $div: [{ $ref: "page.store:totalRows" }, { $ref: "page.store:pageSize" }] },
          },
        },
      ],
    },
    isPrevDisabled: { $eq: { a: { $ref: "page.store:page" }, b: 0 } },
    isNextDisabled: {
      $gte: {
        a: { $add: [{ $ref: "page.store:page" }, 1] },
        b: {
          $ceil: { $div: [{ $ref: "page.store:totalRows" }, { $ref: "page.store:pageSize" }] },
        },
      },
    },
    selectionLabel: {
      $concat: ["0 of ", { $string: { $ref: "page.store:totalRows" } }, " row(s) selected."],
    },
  },
  children: [
    // ── Sidebar ──────────────────────────────────────────────────────────────
    {
      component: "div",
      props: { className: "w-60 shrink-0 border-r flex flex-col bg-background" },
      children: [
        // Logo / company header
        {
          component: "div",
          props: { className: "h-12 flex items-center px-3 border-b shrink-0" },
          children: [
            {
              component: "Button",
              props: { variant: "ghost", className: "gap-2 px-2 h-auto font-semibold text-sm" },
              children: [
                { component: "Layers", props: { className: "size-4" } },
                "Acme Inc",
              ],
            },
          ],
        },
        // Scrollable nav
        {
          component: "ScrollArea",
          props: { className: "flex-1 py-2" },
          children: [
            {
              component: "div",
              props: { className: "px-3 space-y-4" },
              children: [
                // Platform section
                {
                  component: "div",
                  children: [
                    {
                      component: "Muted",
                      props: { className: "text-xs font-medium uppercase tracking-wider px-2 mb-1 block" },
                      children: ["Platform"],
                    },
                    {
                      component: "div",
                      props: { className: "space-y-0.5" },
                      children: [
                        navBtn("Dashboard", "LayoutGrid"),
                        navBtn("Lifecycle", "Layers"),
                        navBtn("Analytics", "BarChart2"),
                        navBtn("Projects", "FolderKanban"),
                        navBtn("Team", "Users"),
                      ],
                    },
                  ],
                },
                // Documents section
                {
                  component: "div",
                  children: [
                    {
                      component: "Muted",
                      props: { className: "text-xs font-medium uppercase tracking-wider px-2 mb-1 block" },
                      children: ["Documents"],
                    },
                    {
                      component: "div",
                      props: { className: "space-y-0.5" },
                      children: [
                        navBtn("Data Library", "Sliders"),
                        navBtn("Reports", "BarChart2"),
                        navBtn("Word Assistant", "MessageSquare"),
                        {
                          component: "Button",
                          props: {
                            variant: "ghost",
                            className: "w-full justify-start gap-2 h-8 px-2 text-sm font-normal text-muted-foreground",
                          },
                          children: [
                            { component: "MoreHorizontal", props: { className: "size-4 shrink-0" } },
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
        // Bottom nav
        { component: "Separator" },
        {
          component: "div",
          props: { className: "px-3 py-2 space-y-0.5" },
          children: [
            navBtn("Settings", "Sliders"),
            navBtn("Get Help", "InfoIcon"),
            navBtn("Search", "Search"),
          ],
        },
        // User footer
        { component: "Separator" },
        {
          component: "div",
          props: { className: "px-3 py-3" },
          children: [
            {
              component: "div",
              props: { className: "flex items-center gap-2 px-1" },
              children: [
                {
                  component: "Avatar",
                  props: { size: "sm" },
                  children: [{ component: "AvatarFallback", children: ["S"] }],
                },
                {
                  component: "div",
                  props: { className: "flex flex-col min-w-0 flex-1" },
                  children: [
                    {
                      component: "Small",
                      props: { className: "font-medium truncate leading-tight" },
                      children: ["Shadcn"],
                    },
                    {
                      component: "Muted",
                      props: { className: "text-xs truncate" },
                      children: ["m@example.com"],
                    },
                  ],
                },
                {
                  component: "Button",
                  props: { variant: "ghost", size: "icon", className: "size-6 shrink-0" },
                  children: [{ component: "MoreHorizontal", props: { className: "size-3" } }],
                },
              ],
            },
          ],
        },
      ],
    },

    // ── Main content ──────────────────────────────────────────────────────────
    {
      component: "div",
      props: { className: "flex-1 flex flex-col overflow-hidden" },
      children: [
        // Top bar
        {
          component: "div",
          props: { className: "h-12 flex items-center justify-between px-6 border-b shrink-0" },
          children: [
            { component: "H4", props: { className: "font-semibold" }, children: ["Documents"] },
            {
              component: "Button",
              props: { size: "sm", className: "gap-1.5" },
              children: [
                { component: "Sparkles", props: { className: "size-3.5" } },
                "Quick Create",
              ],
            },
          ],
        },
        // Scrollable body
        {
          component: "ScrollArea",
          props: { className: "flex-1" },
          children: [
            {
              component: "div",
              props: { className: "p-6 space-y-4" },
              children: [
                // ── KPI cards ────────────────────────────────────────────────
                {
                  component: "div",
                  props: { className: "grid grid-cols-4 gap-4" },
                  children: [
                    {
                      $subConfig: "kpiCard",
                      subConfigProps: {
                        label: "Total Revenue",
                        value: "$1,250.00",
                        change: "+12.5%",
                        positive: true,
                        trend: "Trending up this month",
                        sub: "Visitors for the last 6 months",
                      },
                    },
                    {
                      $subConfig: "kpiCard",
                      subConfigProps: {
                        label: "New Customers",
                        value: "1,234",
                        change: "-20%",
                        positive: false,
                        trend: "Down 20% this period",
                        sub: "Acquisition needs attention",
                      },
                    },
                    {
                      $subConfig: "kpiCard",
                      subConfigProps: {
                        label: "Active Accounts",
                        value: "45,678",
                        change: "+12.5%",
                        positive: true,
                        trend: "Strong user retention",
                        sub: "Engagement exceed targets",
                      },
                    },
                    {
                      $subConfig: "kpiCard",
                      subConfigProps: {
                        label: "Growth Rate",
                        value: "4.5%",
                        change: "+4.5%",
                        positive: true,
                        trend: "Steady performance...",
                        sub: "Meets growth projections",
                      },
                    },
                  ],
                },

                // ── Chart card ───────────────────────────────────────────────
                {
                  component: "Card",
                  children: [
                    {
                      component: "CardHeader",
                      props: { className: "pb-3" },
                      children: [
                        {
                          component: "div",
                          props: { className: "flex items-start justify-between gap-4" },
                          children: [
                            {
                              component: "div",
                              children: [
                                {
                                  component: "CardTitle",
                                  props: { className: "text-base font-semibold" },
                                  children: ["Total Visitors"],
                                },
                                {
                                  component: "CardDescription",
                                  children: ["Total for the last 3 months"],
                                },
                              ],
                            },
                            {
                              component: "div",
                              props: { className: "flex gap-1 shrink-0" },
                              children: [
                                timeBtn("3months", "Last 3 months"),
                                timeBtn("30days", "Last 30 days"),
                                timeBtn("7days", "Last 7 days"),
                              ],
                            },
                          ],
                        },
                      ],
                    },
                    {
                      component: "CardContent",
                      children: [
                        {
                          component: "div",
                          props: {
                            className:
                              "h-44 bg-muted/20 rounded-lg flex items-center justify-center border border-dashed",
                          },
                          children: [
                            {
                              component: "Muted",
                              props: { className: "text-xs text-center px-4" },
                              children: [
                                "Chart placeholder — register an AreaChart component to visualize visitor data",
                              ],
                            },
                          ],
                        },
                      ],
                    },
                  ],
                },

                // ── Document table card ───────────────────────────────────────
                {
                  component: "Card",
                  props: { className: "overflow-hidden" },
                  children: [
                    {
                      component: "CardContent",
                      props: { className: "p-0" },
                      children: [
                        // Tabs bar + toolbar row
                        {
                          component: "Tabs",
                          props: {
                            value: { $ref: "page.store:tableTab" },
                            onValueChange: {
                              $action: [
                                {
                                  type: "page.store.update",
                                  path: "tableTab",
                                  payload: { $arg: 0 },
                                },
                              ],
                            },
                          },
                          children: [
                            // Tab bar + toolbar in same row
                            {
                              component: "div",
                              props: {
                                className: "flex items-center justify-between px-4 border-b",
                              },
                              children: [
                                {
                                  component: "TabsList",
                                  props: { variant: "line" },
                                  children: [
                                    {
                                      component: "TabsTrigger",
                                      props: { value: "outline" },
                                      children: ["Outline"],
                                    },
                                    {
                                      component: "TabsTrigger",
                                      props: { value: "past-performance", className: "gap-1.5" },
                                      children: [
                                        "Past Performance",
                                        {
                                          component: "Badge",
                                          props: {
                                            variant: "secondary",
                                            className: "text-xs px-1.5 h-4 min-w-4",
                                          },
                                          children: ["3"],
                                        },
                                      ],
                                    },
                                    {
                                      component: "TabsTrigger",
                                      props: { value: "key-personnel", className: "gap-1.5" },
                                      children: [
                                        "Key Personnel",
                                        {
                                          component: "Badge",
                                          props: {
                                            variant: "secondary",
                                            className: "text-xs px-1.5 h-4 min-w-4",
                                          },
                                          children: ["2"],
                                        },
                                      ],
                                    },
                                    {
                                      component: "TabsTrigger",
                                      props: { value: "focus-documents" },
                                      children: ["Focus Documents"],
                                    },
                                  ],
                                },
                                // Toolbar buttons
                                {
                                  component: "div",
                                  props: { className: "flex items-center gap-2" },
                                  children: [
                                    {
                                      component: "Button",
                                      props: {
                                        variant: "outline",
                                        size: "sm",
                                        className: "h-7 text-xs gap-1.5",
                                        onClick: {
                                          $action: [
                                            {
                                              type: "snackbar",
                                              message: "Customize columns",
                                              variant: "default",
                                            },
                                          ],
                                        },
                                      },
                                      children: [
                                        { component: "Sliders", props: { className: "size-3" } },
                                        "Customize Columns",
                                      ],
                                    },
                                    {
                                      component: "Button",
                                      props: {
                                        variant: "outline",
                                        size: "sm",
                                        className: "h-7 text-xs gap-1",
                                        onClick: {
                                          $action: [
                                            {
                                              type: "snackbar",
                                              message: "Add column",
                                              variant: "default",
                                            },
                                          ],
                                        },
                                      },
                                      children: [
                                        { component: "Plus", props: { className: "size-3" } },
                                        "Add columns",
                                      ],
                                    },
                                  ],
                                },
                              ],
                            },

                            // Outline tab — table
                            {
                              component: "TabsContent",
                              props: { value: "outline", className: "mt-0" },
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
                                              props: { className: "w-10 pl-4" },
                                              children: [
                                                { component: "Checkbox", props: { disabled: true } },
                                              ],
                                            },
                                            { component: "TableHead", children: ["Header"] },
                                            {
                                              component: "TableHead",
                                              props: { className: "w-36" },
                                              children: ["Section Type"],
                                            },
                                            {
                                              component: "TableHead",
                                              props: { className: "w-28" },
                                              children: ["Status"],
                                            },
                                            {
                                              component: "TableHead",
                                              props: { className: "w-16 text-right" },
                                              children: ["Target"],
                                            },
                                            {
                                              component: "TableHead",
                                              props: { className: "w-16 text-right" },
                                              children: ["Limit"],
                                            },
                                            {
                                              component: "TableHead",
                                              props: { className: "w-40" },
                                              children: ["Reviewer"],
                                            },
                                            {
                                              component: "TableHead",
                                              props: { className: "w-10" },
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
                                            over: { $ref: "page.store:rows" },
                                            as: "row",
                                            return: {
                                              component: "TableRow",
                                              children: [
                                                // Checkbox
                                                {
                                                  component: "TableCell",
                                                  props: { className: "pl-4" },
                                                  children: [
                                                    {
                                                      component: "Checkbox",
                                                      props: {
                                                        onCheckedChange: {
                                                          $action: [
                                                            {
                                                              type: "snackbar",
                                                              message: "Row toggled",
                                                              variant: "default",
                                                            },
                                                          ],
                                                        },
                                                      },
                                                    },
                                                  ],
                                                },
                                                // Header
                                                {
                                                  component: "TableCell",
                                                  props: { className: "font-medium text-sm" },
                                                  children: [{ $ref: "var:row.header" }],
                                                },
                                                // Section Type
                                                {
                                                  component: "TableCell",
                                                  props: { className: "text-muted-foreground text-sm" },
                                                  children: [{ $ref: "var:row.sectionType" }],
                                                },
                                                // Status
                                                {
                                                  component: "TableCell",
                                                  children: [
                                                    {
                                                      component: "Badge",
                                                      props: {
                                                        variant: {
                                                          $if: {
                                                            cond: {
                                                              $eq: {
                                                                a: { $ref: "var:row.status" },
                                                                b: "Done",
                                                              },
                                                            },
                                                            then: "outline",
                                                            else: "secondary",
                                                          },
                                                        },
                                                        className: "gap-1 text-xs font-normal",
                                                      },
                                                      children: [
                                                        {
                                                          $if: {
                                                            cond: {
                                                              $eq: {
                                                                a: { $ref: "var:row.status" },
                                                                b: "Done",
                                                              },
                                                            },
                                                            then: {
                                                              component: "CircleCheckIcon",
                                                              props: { className: "size-3 text-emerald-600" },
                                                            },
                                                            else: {
                                                              component: "Loader2Icon",
                                                              props: { className: "size-3 text-orange-500" },
                                                            },
                                                          },
                                                        },
                                                        { $ref: "var:row.status" },
                                                      ],
                                                    },
                                                  ],
                                                },
                                                // Target
                                                {
                                                  component: "TableCell",
                                                  props: { className: "text-right text-sm tabular-nums" },
                                                  children: [{ $string: { $ref: "var:row.target" } }],
                                                },
                                                // Limit
                                                {
                                                  component: "TableCell",
                                                  props: { className: "text-right text-sm tabular-nums" },
                                                  children: [{ $string: { $ref: "var:row.limit" } }],
                                                },
                                                // Reviewer
                                                {
                                                  component: "TableCell",
                                                  props: { className: "text-sm" },
                                                  children: [
                                                    {
                                                      $if: {
                                                        cond: {
                                                          $eq: {
                                                            a: { $ref: "var:row.reviewer" },
                                                            b: "",
                                                          },
                                                        },
                                                        then: {
                                                          component: "Button",
                                                          props: {
                                                            variant: "ghost",
                                                            size: "sm",
                                                            className:
                                                              "h-6 text-xs px-2 text-muted-foreground gap-0.5",
                                                            onClick: {
                                                              $action: [
                                                                {
                                                                  type: "snackbar",
                                                                  message: "Assign reviewer",
                                                                  variant: "default",
                                                                },
                                                              ],
                                                            },
                                                          },
                                                          children: [
                                                            "Assign reviewer",
                                                            {
                                                              component: "ChevronDownIcon",
                                                              props: { className: "size-3" },
                                                            },
                                                          ],
                                                        },
                                                        else: { $ref: "var:row.reviewer" },
                                                      },
                                                    },
                                                  ],
                                                },
                                                // Row actions
                                                {
                                                  component: "TableCell",
                                                  children: [
                                                    {
                                                      component: "Button",
                                                      props: {
                                                        variant: "ghost",
                                                        size: "icon",
                                                        className: "size-7",
                                                        onClick: {
                                                          $action: [
                                                            {
                                                              type: "snackbar",
                                                              message: "Row actions",
                                                              variant: "default",
                                                            },
                                                          ],
                                                        },
                                                      },
                                                      children: [
                                                        {
                                                          component: "MoreHorizontal",
                                                          props: { className: "size-3" },
                                                        },
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
                              ],
                            },

                            // Placeholder tab contents
                            {
                              component: "TabsContent",
                              props: {
                                value: "past-performance",
                                className: "mt-0 p-10 flex items-center justify-center",
                              },
                              children: [{ component: "Muted", children: ["Past Performance data"] }],
                            },
                            {
                              component: "TabsContent",
                              props: {
                                value: "key-personnel",
                                className: "mt-0 p-10 flex items-center justify-center",
                              },
                              children: [{ component: "Muted", children: ["Key Personnel data"] }],
                            },
                            {
                              component: "TabsContent",
                              props: {
                                value: "focus-documents",
                                className: "mt-0 p-10 flex items-center justify-center",
                              },
                              children: [{ component: "Muted", children: ["Focus Documents data"] }],
                            },
                          ],
                        },

                        // Pagination footer (always visible, outside Tabs)
                        {
                          component: "div",
                          props: { className: "flex items-center justify-between px-4 py-3 border-t" },
                          children: [
                            {
                              component: "Muted",
                              props: { className: "text-xs" },
                              children: [{ $ref: "selectors:selectionLabel" }],
                            },
                            {
                              component: "div",
                              props: { className: "flex items-center gap-4" },
                              children: [
                                // Rows per page
                                {
                                  component: "div",
                                  props: { className: "flex items-center gap-2" },
                                  children: [
                                    {
                                      component: "Muted",
                                      props: { className: "text-xs whitespace-nowrap" },
                                      children: ["Rows per page"],
                                    },
                                    {
                                      component: "Select",
                                      props: {
                                        value: "10",
                                        onValueChange: {
                                          $action: [
                                            {
                                              type: "snackbar",
                                              message: "Page size changed",
                                              variant: "default",
                                            },
                                          ],
                                        },
                                      },
                                      children: [
                                        {
                                          component: "SelectTrigger",
                                          props: { className: "h-7 w-14 text-xs" },
                                          children: [{ component: "SelectValue" }],
                                        },
                                        {
                                          component: "SelectContent",
                                          children: [
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
                                            {
                                              component: "SelectItem",
                                              props: { value: "50" },
                                              children: ["50"],
                                            },
                                          ],
                                        },
                                      ],
                                    },
                                  ],
                                },
                                // Page label
                                {
                                  component: "Muted",
                                  props: { className: "text-xs whitespace-nowrap" },
                                  children: [{ $ref: "selectors:pageLabel" }],
                                },
                                // Pagination buttons
                                {
                                  component: "div",
                                  props: { className: "flex items-center gap-1" },
                                  children: [
                                    {
                                      component: "Button",
                                      props: {
                                        variant: "outline",
                                        size: "icon",
                                        className: "size-7",
                                        disabled: { $ref: "selectors:isPrevDisabled" },
                                        onClick: {
                                          $action: [
                                            {
                                              type: "page.store.update",
                                              path: "page",
                                              payload: 0,
                                            },
                                          ],
                                        },
                                      },
                                      children: [
                                        { component: "ArrowLeft", props: { className: "size-3" } },
                                      ],
                                    },
                                    {
                                      component: "Button",
                                      props: {
                                        variant: "outline",
                                        size: "icon",
                                        className: "size-7",
                                        disabled: { $ref: "selectors:isPrevDisabled" },
                                        onClick: {
                                          $action: [
                                            {
                                              type: "page.store.update",
                                              path: "page",
                                              payload: {
                                                $sub: [{ $ref: "page.store:page" }, 1],
                                              },
                                            },
                                          ],
                                        },
                                      },
                                      children: [
                                        {
                                          component: "ChevronLeftIcon",
                                          props: { className: "size-3" },
                                        },
                                      ],
                                    },
                                    {
                                      component: "Button",
                                      props: {
                                        variant: "outline",
                                        size: "icon",
                                        className: "size-7",
                                        disabled: { $ref: "selectors:isNextDisabled" },
                                        onClick: {
                                          $action: [
                                            {
                                              type: "page.store.update",
                                              path: "page",
                                              payload: {
                                                $add: [{ $ref: "page.store:page" }, 1],
                                              },
                                            },
                                          ],
                                        },
                                      },
                                      children: [
                                        {
                                          component: "ChevronRightIcon",
                                          props: { className: "size-3" },
                                        },
                                      ],
                                    },
                                    {
                                      component: "Button",
                                      props: {
                                        variant: "outline",
                                        size: "icon",
                                        className: "size-7",
                                        disabled: { $ref: "selectors:isNextDisabled" },
                                        onClick: {
                                          $action: [
                                            {
                                              type: "page.store.update",
                                              path: "page",
                                              payload: {
                                                $sub: [
                                                  {
                                                    $ceil: {
                                                      $div: [
                                                        { $ref: "page.store:totalRows" },
                                                        { $ref: "page.store:pageSize" },
                                                      ],
                                                    },
                                                  },
                                                  1,
                                                ],
                                              },
                                            },
                                          ],
                                        },
                                      },
                                      children: [
                                        {
                                          component: "ChevronRightIcon",
                                          props: { className: "size-3" },
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
