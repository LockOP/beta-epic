import type { ComponentNode } from "@beta-epic/ui";

export const eg1RootConfig: ComponentNode = {
  component: "div",
  props: {
    className: "min-h-screen bg-background text-foreground",
  },
  selectors: {
    activeSectionLabel: {
      $nullish: {
        value: {
          $pipe: [
            { $ref: "page.store:navSections" },
            {
              $find: {
                over: "$$",
                as: "sec",
                where: {
                  $some: {
                    over: { $ref: "var:sec.items" },
                    as: "it",
                    where: {
                      $eq: {
                        a: { $ref: "var:it.key" },
                        b: { $ref: "page.store:activeNav" },
                      },
                    },
                  },
                },
              },
            },
            { $ref: "var:sec.label" },
          ],
        },
        default: "Documents",
      },
    },
    isDocuments: {
      $eq: { a: { $ref: "selectors:activeSectionLabel" }, b: "Documents" },
    },
    tableQueryNorm: {
      $pipe: [{ $ref: "page.store:tableQuery" }, { $trim: "$$" }, { $lower: "$$" }],
    },
    hasTableQuery: {
      $gt: { a: { $length: { $ref: "selectors:tableQueryNorm" } }, b: 0 },
    },
    filteredRows: {
      $filter: {
        over: { $ref: "page.store:tableRows" },
        as: "r",
        where: {
          $and: [
            {
              $or: [
                { $eq: { a: { $ref: "page.store:tableTab" }, b: "outline" } },
                {
                  $eq: {
                    a: { $ref: "var:r.bucket" },
                    b: { $ref: "page.store:tableTab" },
                  },
                },
              ],
            },
            {
              $if: {
                cond: { $ref: "selectors:hasTableQuery" },
                then: {
                  $or: [
                    {
                      $includes: {
                        value: { $lower: { $ref: "var:r.header" } },
                        search: { $ref: "selectors:tableQueryNorm" },
                      },
                    },
                    {
                      $includes: {
                        value: { $lower: { $ref: "var:r.sectionType" } },
                        search: { $ref: "selectors:tableQueryNorm" },
                      },
                    },
                    {
                      $includes: {
                        value: { $lower: { $ref: "var:r.reviewer" } },
                        search: { $ref: "selectors:tableQueryNorm" },
                      },
                    },
                  ],
                },
                else: true,
              },
            },
          ],
        },
      },
    },
  },
  children: [
    {
      component: "div",
      props: { className: "flex" },
      children: [
        {
          component: "div",
          props: { className: "w-64 shrink-0 border-r border-border" },
          children: [
            {
              component: "div",
              props: { className: "flex h-full min-h-screen flex-col" },
              children: [
                {
                  component: "div",
                  props: { className: "flex items-center gap-2 px-4 py-4" },
                  children: [
                    { component: "Layers", props: { className: "h-5 w-5" } },
                    { component: "Large", children: ["Acme Inc"] },
                  ],
                },
                {
                  component: "div",
                  props: { className: "flex flex-1 flex-col gap-5 px-2 pb-4" },
                  children: [
                    {
                      $map: {
                        over: { $ref: "page.store:navSections" },
                        as: "sec",
                        return: {
                          component: "div",
                          children: [
                            {
                              component: "Small",
                              props: { className: "px-3 py-2 text-muted-foreground" },
                              children: [{ $ref: "var:sec.label" }],
                            },
                            {
                              component: "div",
                              props: { className: "flex flex-col gap-1" },
                              children: [
                                {
                                  $map: {
                                    over: { $ref: "var:sec.items" },
                                    as: "it",
                                    return: {
                                      component: "Button",
                                      props: {
                                        variant: "ghost",
                                        className: {
                                          $concat: [
                                            "w-full justify-start gap-2",
                                            {
                                              $if: {
                                                cond: {
                                                  $eq: {
                                                    a: { $ref: "var:it.key" },
                                                    b: { $ref: "page.store:activeNav" },
                                                  },
                                                },
                                                then: " bg-accent text-accent-foreground",
                                                else: "",
                                              },
                                            },
                                          ],
                                        },
                                        onClick: {
                                          $action: [
                                            {
                                              type: "page.store.update",
                                              path: "activeNav",
                                              payload: { $ref: "var:it.key" },
                                            },
                                          ],
                                        },
                                      },
                                      children: [
                                        {
                                          $switch: {
                                            on: { $ref: "var:it.icon" },
                                            cases: {
                                              LayoutGrid: {
                                                component: "LayoutGrid",
                                                props: { className: "h-4 w-4" },
                                              },
                                              BarChart2: {
                                                component: "BarChart2",
                                                props: { className: "h-4 w-4" },
                                              },
                                              FolderKanban: {
                                                component: "FolderKanban",
                                                props: { className: "h-4 w-4" },
                                              },
                                              Users: {
                                                component: "Users",
                                                props: { className: "h-4 w-4" },
                                              },
                                              Layers: {
                                                component: "Layers",
                                                props: { className: "h-4 w-4" },
                                              },
                                              MessageSquare: {
                                                component: "MessageSquare",
                                                props: { className: "h-4 w-4" },
                                              },
                                              MoreHorizontalIcon: {
                                                component: "MoreHorizontalIcon",
                                                props: { className: "h-4 w-4" },
                                              },
                                            },
                                            default: {
                                              component: "Bookmark",
                                              props: { className: "h-4 w-4" },
                                            },
                                          },
                                        },
                                        {
                                          component: "span",
                                          props: { className: "truncate" },
                                          children: [{ $ref: "var:it.label" }],
                                        },
                                      ],
                                    },
                                  },
                                },
                              ],
                            },
                          ],
                        },
                      },
                    },
                    {
                      component: "div",
                      props: { className: "mt-auto" },
                      children: [
                        {
                          component: "div",
                          props: { className: "flex flex-col gap-1" },
                          children: [
                            {
                              $map: {
                                over: { $ref: "page.store:footerNav" },
                                as: "f",
                                return: {
                                  component: "Button",
                                  props: {
                                    variant: "ghost",
                                    className: {
                                      $concat: [
                                        "w-full justify-start gap-2",
                                        {
                                          $if: {
                                            cond: {
                                              $eq: {
                                                a: { $ref: "var:f.key" },
                                                b: { $ref: "page.store:activeNav" },
                                              },
                                            },
                                            then: " bg-accent text-accent-foreground",
                                            else: "",
                                          },
                                        },
                                      ],
                                    },
                                    onClick: {
                                      $action: [
                                        {
                                          type: "page.store.update",
                                          path: "activeNav",
                                          payload: { $ref: "var:f.key" },
                                        },
                                      ],
                                    },
                                  },
                                  children: [
                                    {
                                      $switch: {
                                        on: { $ref: "var:f.icon" },
                                        cases: {
                                          Sliders: {
                                            component: "Sliders",
                                            props: { className: "h-4 w-4" },
                                          },
                                          InfoIcon: {
                                            component: "InfoIcon",
                                            props: { className: "h-4 w-4" },
                                          },
                                          SearchIcon: {
                                            component: "SearchIcon",
                                            props: { className: "h-4 w-4" },
                                          },
                                        },
                                        default: {
                                          component: "Wrench",
                                          props: { className: "h-4 w-4" },
                                        },
                                      },
                                    },
                                    {
                                      component: "span",
                                      props: { className: "truncate" },
                                      children: [{ $ref: "var:f.label" }],
                                    },
                                  ],
                                },
                              },
                            },
                          ],
                        },
                        {
                          component: "div",
                          props: { className: "mt-4 border-t border-border px-3 pt-4" },
                          children: [
                            {
                              component: "div",
                              props: { className: "flex items-center gap-3" },
                              children: [
                                {
                                  component: "Avatar",
                                  children: [{ component: "AvatarFallback", children: ["S"] }],
                                },
                                {
                                  component: "div",
                                  props: { className: "min-w-0 flex-1" },
                                  children: [
                                    {
                                      component: "P",
                                      props: { className: "truncate" },
                                      children: [{ $ref: "page.store:user.name" }],
                                    },
                                    {
                                      component: "Muted",
                                      props: { className: "truncate" },
                                      children: [{ $ref: "page.store:user.email" }],
                                    },
                                  ],
                                },
                                {
                                  component: "Button",
                                  props: {
                                    variant: "ghost",
                                    className: "h-8 w-8 p-0",
                                    onClick: {
                                      $action: [
                                        {
                                          type: "snackbar",
                                          message: "Account menu not implemented yet",
                                          variant: "info",
                                        },
                                      ],
                                    },
                                  },
                                  children: [
                                    { component: "MoreHorizontalIcon", props: { className: "h-4 w-4" } },
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
        {
          component: "div",
          props: { className: "flex-1" },
          children: [
            {
              component: "div",
              props: {
                className: "flex items-center justify-between border-b border-border px-6 py-4",
              },
              children: [
                { component: "H3", children: [{ $ref: "selectors:activeSectionLabel" }] },
                {
                  component: "div",
                  props: { className: "flex items-center gap-2" },
                  children: [
                    {
                      component: "Button",
                      props: {
                        variant: "outline",
                        onClick: {
                          $action: [
                            { type: "snackbar", message: "Customize Columns (placeholder)", variant: "info" },
                          ],
                        },
                      },
                      children: [
                        "Customize Columns",
                        { component: "ChevronDownIcon", props: { className: "ml-2 h-4 w-4" } },
                      ],
                    },
                    {
                      component: "Button",
                      props: {
                        onClick: {
                          $action: [{ type: "snackbar", message: "Add columns (placeholder)", variant: "info" }],
                        },
                      },
                      children: ["Add columns", { component: "Plus", props: { className: "ml-2 h-4 w-4" } }],
                    },
                  ],
                },
              ],
            },
            {
              $if: {
                cond: { $ref: "selectors:isDocuments" },
                then: {
                  component: "div",
                  props: { className: "flex flex-col gap-6 p-6" },
                  children: [
                    {
                      component: "div",
                      props: { className: "grid gap-4 md:grid-cols-2 xl:grid-cols-4" },
                      children: [
                        {
                          $map: {
                            over: { $ref: "page.store:kpis" },
                            as: "k",
                            return: {
                              component: "Card",
                              children: [
                                {
                                  component: "CardHeader",
                                  props: {
                                    className: "flex flex-row items-start justify-between space-y-0 pb-2",
                                  },
                                  children: [
                                    {
                                      component: "Small",
                                      props: { className: "text-muted-foreground" },
                                      children: [{ $ref: "var:k.title" }],
                                    },
                                    {
                                      component: "div",
                                      props: { className: "flex items-center gap-1 text-xs text-muted-foreground" },
                                      children: [
                                        {
                                          $switch: {
                                            on: { $ref: "var:k.trend" },
                                            cases: {
                                              up: { component: "ChevronUpIcon", props: { className: "h-4 w-4" } },
                                              down: {
                                                component: "ChevronDownIcon",
                                                props: { className: "h-4 w-4" },
                                              },
                                            },
                                            default: { component: "ChevronUpIcon", props: { className: "h-4 w-4" } },
                                          },
                                        },
                                        { $ref: "var:k.delta" },
                                      ],
                                    },
                                  ],
                                },
                                {
                                  component: "CardContent",
                                  children: [
                                    { component: "H3", props: { className: "leading-none" }, children: [{ $ref: "var:k.value" }] },
                                    { component: "Muted", props: { className: "mt-2" }, children: [{ $ref: "var:k.note" }] },
                                  ],
                                },
                              ],
                            },
                          },
                        },
                      ],
                    },
                    {
                      component: "Tabs",
                      props: {
                        value: { $ref: "page.store:chartRange" },
                        onValueChange: {
                          $action: [{ type: "page.store.update", path: "chartRange", payload: { $arg: 0 } }],
                        },
                      },
                      children: [
                        {
                          component: "Card",
                          children: [
                            {
                              component: "CardHeader",
                              props: {
                                className:
                                  "flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between",
                              },
                              children: [
                                {
                                  component: "div",
                                  children: [
                                    { component: "CardTitle", children: ["Total Visitors"] },
                                    { component: "CardDescription", children: ["Total for the last 3 months"] },
                                  ],
                                },
                                {
                                  component: "TabsList",
                                  children: [
                                    { component: "TabsTrigger", props: { value: "3m" }, children: ["Last 3 months"] },
                                    { component: "TabsTrigger", props: { value: "30d" }, children: ["Last 30 days"] },
                                    { component: "TabsTrigger", props: { value: "7d" }, children: ["Last 7 days"] },
                                  ],
                                },
                              ],
                            },
                            {
                              component: "CardContent",
                              children: [
                                {
                                  component: "TabsContent",
                                  props: { value: "3m", className: "m-0" },
                                  children: [{ component: "Skeleton", props: { className: "h-64 w-full" } }],
                                },
                                {
                                  component: "TabsContent",
                                  props: { value: "30d", className: "m-0" },
                                  children: [{ component: "Skeleton", props: { className: "h-64 w-full" } }],
                                },
                                {
                                  component: "TabsContent",
                                  props: { value: "7d", className: "m-0" },
                                  children: [{ component: "Skeleton", props: { className: "h-64 w-full" } }],
                                },
                              ],
                            },
                          ],
                        },
                      ],
                    },
                    {
                      component: "Tabs",
                      props: {
                        value: { $ref: "page.store:tableTab" },
                        onValueChange: {
                          $action: [{ type: "page.store.update", path: "tableTab", payload: { $arg: 0 } }],
                        },
                      },
                      children: [
                        {
                          component: "div",
                          props: {
                            className:
                              "flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between",
                          },
                          children: [
                            {
                              component: "TabsList",
                              children: [
                                { component: "TabsTrigger", props: { value: "outline" }, children: ["Outline"] },
                                { component: "TabsTrigger", props: { value: "past" }, children: ["Past Performance"] },
                                { component: "TabsTrigger", props: { value: "personnel" }, children: ["Key Personnel"] },
                                { component: "TabsTrigger", props: { value: "focus" }, children: ["Focus Documents"] },
                              ],
                            },
                            {
                              component: "div",
                              props: { className: "flex items-center gap-2" },
                              children: [
                                {
                                  component: "Input",
                                  props: {
                                    value: { $ref: "page.store:tableQuery" },
                                    placeholder: "Search…",
                                    className: "w-full sm:w-64",
                                    onChange: {
                                      $action: [
                                        {
                                          type: "page.store.update",
                                          path: "tableQuery",
                                          payload: { $arg: 0, path: "currentTarget.value" },
                                        },
                                      ],
                                    },
                                  },
                                },
                                {
                                  component: "Button",
                                  props: {
                                    variant: "outline",
                                    onClick: {
                                      $action: [
                                        { type: "snackbar", message: "Customize Columns (placeholder)", variant: "info" },
                                      ],
                                    },
                                  },
                                  children: [
                                    "Customize",
                                    { component: "ChevronDownIcon", props: { className: "ml-2 h-4 w-4" } },
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
                              component: "CardContent",
                              props: { className: "p-0" },
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
                                            { component: "TableHead", props: { className: "w-10" }, children: [""] },
                                            { component: "TableHead", props: { className: "w-10" }, children: [""] },
                                            { component: "TableHead", children: ["Header"] },
                                            { component: "TableHead", props: { className: "w-44" }, children: ["Section Type"] },
                                            { component: "TableHead", props: { className: "w-36" }, children: ["Status"] },
                                            { component: "TableHead", props: { className: "w-20 text-right" }, children: ["Target"] },
                                            { component: "TableHead", props: { className: "w-20 text-right" }, children: ["Limit"] },
                                            { component: "TableHead", props: { className: "w-40" }, children: ["Reviewer"] },
                                            { component: "TableHead", props: { className: "w-12" }, children: [""] },
                                          ],
                                        },
                                      ],
                                    },
                                    {
                                      component: "TableBody",
                                      children: [
                                        {
                                          $map: {
                                            over: { $ref: "selectors:filteredRows" },
                                            as: "row",
                                            return: {
                                              component: "TableRow",
                                              props: {
                                                className: {
                                                  $if: {
                                                    cond: {
                                                      $eq: {
                                                        a: { $ref: "page.store:selectedRowId" },
                                                        b: { $ref: "var:row.id" },
                                                      },
                                                    },
                                                    then: "bg-muted/50",
                                                    else: "",
                                                  },
                                                },
                                              },
                                              children: [
                                                {
                                                  component: "TableCell",
                                                  props: { className: "w-10" },
                                                  children: [
                                                    { component: "MoreHorizontalIcon", props: { className: "h-4 w-4 text-muted-foreground" } },
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
                                                          $eq: {
                                                            a: { $ref: "page.store:selectedRowId" },
                                                            b: { $ref: "var:row.id" },
                                                          },
                                                        },
                                                        onCheckedChange: {
                                                          $action: [
                                                            {
                                                              $if: {
                                                                cond: { $arg: 0 },
                                                                then: [
                                                                  { type: "page.store.update", path: "selectedRowId", payload: { $ref: "var:row.id" } },
                                                                ],
                                                                else: [
                                                                  { type: "page.store.update", path: "selectedRowId", payload: null },
                                                                ],
                                                              },
                                                            },
                                                          ],
                                                        },
                                                      },
                                                    },
                                                  ],
                                                },
                                                { component: "TableCell", children: [{ $ref: "var:row.header" }] },
                                                {
                                                  component: "TableCell",
                                                  props: { className: "w-44" },
                                                  children: [
                                                    { component: "Badge", props: { variant: "secondary" }, children: [{ $ref: "var:row.sectionType" }] },
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
                                                            cond: { $eq: { a: { $ref: "var:row.status" }, b: "done" } },
                                                            then: "secondary",
                                                            else: "outline",
                                                          },
                                                        },
                                                      },
                                                      children: [
                                                        {
                                                          $if: {
                                                            cond: { $eq: { a: { $ref: "var:row.status" }, b: "done" } },
                                                            then: { component: "CircleCheckIcon", props: { className: "mr-2 h-3 w-3" } },
                                                            else: { component: "Loader2Icon", props: { className: "mr-2 h-3 w-3" } },
                                                          },
                                                        },
                                                        {
                                                          $if: {
                                                            cond: { $eq: { a: { $ref: "var:row.status" }, b: "done" } },
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
                                                  props: { className: "w-20 text-right" },
                                                  children: [{ $string: { $ref: "var:row.target" } }],
                                                },
                                                {
                                                  component: "TableCell",
                                                  props: { className: "w-20 text-right" },
                                                  children: [{ $string: { $ref: "var:row.limit" } }],
                                                },
                                                { component: "TableCell", props: { className: "w-40" }, children: [{ $ref: "var:row.reviewer" }] },
                                                {
                                                  component: "TableCell",
                                                  props: { className: "w-12" },
                                                  children: [
                                                    {
                                                      component: "Button",
                                                      props: {
                                                        variant: "ghost",
                                                        className: "h-8 w-8 p-0",
                                                        onClick: {
                                                          $action: [{ type: "snackbar", message: "Row actions not implemented yet", variant: "info" }],
                                                        },
                                                      },
                                                      children: [{ component: "MoreHorizontalIcon", props: { className: "h-4 w-4" } }],
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
                          ],
                        },
                      ],
                    },
                  ],
                },
                else: {
                  component: "div",
                  props: { className: "p-6" },
                  children: [
                    {
                      component: "Card",
                      children: [
                        {
                          component: "CardHeader",
                          children: [
                            { component: "CardTitle", children: ["Section not implemented"] },
                            {
                              component: "CardDescription",
                              children: ["This demo wires sidebar state; only the Documents section is implemented."],
                            },
                          ],
                        },
                        {
                          component: "CardFooter",
                          children: [
                            {
                              component: "Button",
                              props: {
                                onClick: {
                                  $action: [{ type: "page.store.update", path: "activeNav", payload: "reports" }],
                                },
                              },
                              children: ["Go to Documents"],
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
};
