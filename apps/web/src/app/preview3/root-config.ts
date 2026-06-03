import type { ComponentNode } from "@beta-epic/ui";

export const preview3RootConfig: ComponentNode = {
  component: "SidebarProvider",
  selectors: {
    filteredRows: {
      "$filter": {
        over: { "$ref": "page.store:outlineRows" },
        as: "row",
        where: {
          "$eq": {
            a: { "$ref": "var:row.tab" },
            b: { "$ref": "page.store:activeDocumentTab" },
          },
        },
      },
    },
    paginatedRows: {
      "$slice": {
        over: { "$ref": "selectors:filteredRows" },
        start: {
          "$mul": [
            { "$sub": [{ "$ref": "page.store:currentPage" }, 1] },
            { "$number": { "$ref": "page.store:rowsPerPage" } },
          ],
        },
        end: {
          "$mul": [
            { "$ref": "page.store:currentPage" },
            { "$number": { "$ref": "page.store:rowsPerPage" } },
          ],
        },
      },
    },
    selectedCountLabel: {
      "$concat": [
        { "$string": { "$count": { "$ref": "page.store:selectedRowIds" } } },
        " of ",
        { "$string": { "$ref": "page.store:totalRows" } },
        " row(s) selected.",
      ],
    },
    activeChartData: {
      "$get": {
        from: { "$ref": "page.store:chartSeriesByRange" },
        key: { "$ref": "page.store:activeChartRange" },
      },
    },
  },
  children: [
    {
      component: "div",
      props: {
        className: "flex h-screen flex-col overflow-hidden bg-background",
      },
      children: [
        {
          component: "div",
          props: {
            className: "flex items-center justify-between px-14 pt-8 pb-6",
          },
          children: [
            {
              component: "H1",
              props: { className: "text-5xl font-semibold tracking-tight" },
              children: [{ "$ref": "page.store:headerTitle" }],
            },
            {
              component: "Button",
              props: { variant: "outline", className: "h-8 px-3" },
              children: [{ "$ref": "page.store:headerActionLabel" }],
            },
          ],
        },
        {
          component: "div",
          props: {
            className:
              "mx-14 mb-8 flex min-h-0 flex-1 overflow-hidden rounded-[28px] border border-border bg-card shadow-sm",
          },
          children: [
            {
              component: "Sidebar",
              props: {
                collapsible: "none",
                className: "h-full w-[255px] shrink-0 overflow-hidden border-r bg-sidebar",
              },
              children: [
                {
                  component: "SidebarHeader",
                  props: { className: "shrink-0 border-b px-2 py-2" },
                  children: [
                    {
                      component: "SidebarMenuButton",
                      props: { className: "h-8 rounded-md px-3 text-sm font-semibold" },
                      children: [{ component: "CircleCheckIcon", props: { className: "size-4" } }, "Acme Inc"],
                    },
                  ],
                },
                {
                  component: "SidebarContent",
                  props: { className: "min-h-0 overflow-hidden px-2 py-2" },
                  children: [
                    {
                      component: "div",
                      props: { className: "flex min-h-0 flex-1 flex-col gap-2" },
                      children: [
                        {
                          component: "SidebarGroup",
                          props: { className: "p-0" },
                          children: [
                            { component: "SidebarGroupLabel", children: ["Platform"] },
                            {
                              component: "SidebarGroupContent",
                              children: [
                                {
                                  component: "SidebarMenu",
                                  props: { className: "gap-1" },
                                  children: [
                                    {
                                      "$map": {
                                        over: { "$ref": "page.store:topNav" },
                                        as: "item",
                                        return: {
                                          component: "SidebarMenuItem",
                                          children: [
                                            {
                                              component: "SidebarMenuButton",
                                              props: { className: "h-8 px-2 text-sm" },
                                              children: [
                                                {
                                                  "$if": {
                                                    cond: { "$eq": { a: { "$ref": "var:item.icon" }, b: "LayoutGrid" } },
                                                    then: { component: "LayoutGrid" },
                                                    else: {
                                                      "$if": {
                                                        cond: { "$eq": { a: { "$ref": "var:item.icon" }, b: "Layers" } },
                                                        then: { component: "Layers" },
                                                        else: {
                                                          "$if": {
                                                            cond: { "$eq": { a: { "$ref": "var:item.icon" }, b: "BarChart2" } },
                                                            then: { component: "BarChart2" },
                                                            else: {
                                                              "$if": {
                                                                cond: { "$eq": { a: { "$ref": "var:item.icon" }, b: "FolderKanban" } },
                                                                then: { component: "FolderKanban" },
                                                                else: { component: "Users" },
                                                              },
                                                            },
                                                          },
                                                        },
                                                      },
                                                    },
                                                  },
                                                },
                                                { "$ref": "var:item.label" },
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
                        {
                          component: "SidebarGroup",
                          props: { className: "p-0" },
                          children: [
                            { component: "SidebarGroupLabel", children: ["Documents"] },
                            {
                              component: "SidebarGroupContent",
                              children: [
                                {
                                  component: "SidebarMenu",
                                  props: { className: "gap-1" },
                                  children: [
                                    {
                                      "$map": {
                                        over: { "$ref": "page.store:documentNav" },
                                        as: "item",
                                        return: {
                                          component: "SidebarMenuItem",
                                          children: [
                                            {
                                              component: "SidebarMenuButton",
                                              props: {
                                                className: {
                                                  "$if": {
                                                    cond: { "$eq": { a: { "$ref": "var:item.id" }, b: "more" } },
                                                    then: "h-8 px-2 text-sm opacity-70",
                                                    else: "h-8 px-2 text-sm",
                                                  },
                                                },
                                              },
                                              children: [
                                                {
                                                  "$if": {
                                                    cond: { "$eq": { a: { "$ref": "var:item.icon" }, b: "CreditCard" } },
                                                    then: { component: "CreditCard" },
                                                    else: {
                                                      "$if": {
                                                        cond: { "$eq": { a: { "$ref": "var:item.icon" }, b: "MessageSquare" } },
                                                        then: { component: "MessageSquare" },
                                                        else: {
                                                          "$if": {
                                                            cond: { "$eq": { a: { "$ref": "var:item.icon" }, b: "MoreHorizontalIcon" } },
                                                            then: { component: "MoreHorizontalIcon" },
                                                            else: { component: "BarChart2" },
                                                          },
                                                        },
                                                      },
                                                    },
                                                  },
                                                },
                                                { "$ref": "var:item.label" },
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
                {
                  component: "SidebarFooter",
                  props: { className: "shrink-0 px-2 py-2" },
                  children: [
                    {
                      component: "SidebarMenu",
                      props: { className: "gap-1" },
                      children: [
                        {
                          "$map": {
                            over: { "$ref": "page.store:footerNav" },
                            as: "item",
                            return: {
                              component: "SidebarMenuItem",
                              children: [
                                {
                                  component: "SidebarMenuButton",
                                  props: { className: "h-8 px-2 text-sm" },
                                  children: [
                                    {
                                      "$if": {
                                        cond: { "$eq": { a: { "$ref": "var:item.icon" }, b: "Wrench" } },
                                        then: { component: "Wrench" },
                                        else: {
                                          "$if": {
                                            cond: { "$eq": { a: { "$ref": "var:item.icon" }, b: "InfoIcon" } },
                                            then: { component: "InfoIcon" },
                                            else: { component: "SearchIcon" },
                                          },
                                        },
                                      },
                                    },
                                    { "$ref": "var:item.label" },
                                  ],
                                },
                              ],
                            },
                          },
                        },
                      ],
                    },
                    {
                      component: "div",
                      props: { className: "mt-2 rounded-lg border bg-card p-2" },
                      children: [
                        {
                          component: "div",
                          props: { className: "flex items-center gap-2" },
                          children: [
                            {
                              component: "Avatar",
                              props: { size: "default" },
                              children: [{ component: "AvatarFallback", children: ["S"] }],
                            },
                            {
                              component: "div",
                              props: { className: "min-w-0 flex-1" },
                              children: [
                                { component: "P", props: { className: "truncate text-sm font-semibold" }, children: ["Shadcn"] },
                                { component: "Muted", props: { className: "truncate text-xs" }, children: ["m@example.com"] },
                              ],
                            },
                            { component: "MoreHorizontalIcon", props: { className: "size-4 text-muted-foreground" } },
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
              props: {
                className: "flex min-h-0 min-w-0 flex-1 flex-col",
              },
              children: [
                {
                  component: "div",
                  props: {
                    className: "flex h-[49px] shrink-0 items-center justify-between border-b px-6",
                  },
                  children: [
                    {
                      component: "Large",
                      props: { className: "text-base font-semibold" },
                      children: [{ "$ref": "page.store:sectionTitle" }],
                    },
                    {
                      component: "Button",
                      props: {
                        className: "h-8 rounded-lg px-3",
                      },
                      children: [{ component: "Plus" }, "Quick Create"],
                    },
                  ],
                },
                {
                  component: "div",
                  props: {
                    className: "min-h-0 flex-1 overflow-y-auto",
                  },
                  children: [
                    {
                      component: "div",
                      props: { className: "flex flex-col gap-6 px-0 py-6" },
                      children: [
                        {
                          component: "div",
                          props: { className: "px-6" },
                          children: [
                            {
                              component: "div",
                              props: { className: "grid grid-cols-4 gap-4" },
                              children: [
                                {
                                  "$map": {
                                    over: { "$ref": "page.store:metrics" },
                                    as: "item",
                                    return: {
                                      "$subConfig": "metricCard",
                                      subConfigProps: {
                                        item: { "$ref": "var:item" },
                                      },
                                    },
                                  },
                                },
                              ],
                            },
                          ],
                        },
                        {
                          component: "div",
                          props: { className: "px-6" },
                          children: [
                            {
                              component: "Card",
                              props: { className: "rounded-xl shadow-sm" },
                              children: [
                                {
                                  component: "CardContent",
                                  props: { className: "flex flex-col gap-6 px-6 py-6" },
                                  children: [
                                    {
                                      component: "div",
                                      props: { className: "flex items-start justify-between gap-4" },
                                      children: [
                                        {
                                          component: "div",
                                          props: { className: "flex flex-col gap-1.5" },
                                          children: [
                                            {
                                              component: "Large",
                                              props: { className: "text-base font-semibold" },
                                              children: ["Total Visitors"],
                                            },
                                            {
                                              component: "Muted",
                                              props: { className: "text-sm" },
                                              children: ["Total for the last 3 months"],
                                            },
                                          ],
                                        },
                                        {
                                          component: "Tabs",
                                          props: {
                                            value: { "$ref": "page.store:activeChartRange" },
                                            onValueChange: {
                                              "$action": [
                                                {
                                                  type: "page.store.update",
                                                  path: "activeChartRange",
                                                  payload: { "$arg": 0 },
                                                },
                                              ],
                                            },
                                          },
                                          children: [
                                            {
                                              component: "TabsList",
                                              props: { className: "h-9 gap-0 rounded-md bg-transparent p-0" },
                                              children: [
                                                {
                                                  "$map": {
                                                    over: { "$ref": "page.store:chartRanges" },
                                                    as: "range",
                                                    return: {
                                                      component: "TabsTrigger",
                                                      props: {
                                                        value: { "$ref": "var:range.id" },
                                                        className:
                                                          "h-9 rounded-none border border-border px-4 first:rounded-l-md last:rounded-r-md data-[state=active]:bg-accent",
                                                      },
                                                      children: [{ "$ref": "var:range.label" }],
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
                                      component: "ChartContainer",
                                      props: {
                                        className: "aspect-auto h-[250px] w-full",
                                        config: {
                                          visitors: { label: "Visitors", color: "#a3a3a3" },
                                          baseline: { label: "Baseline", color: "#404040" },
                                        },
                                      },
                                      children: [
                                        {
                                          component: "AreaChart",
                                          props: {
                                            data: { "$ref": "selectors:activeChartData" },
                                            margin: { left: 6, right: 6, top: 8, bottom: 0 },
                                          },
                                          children: [
                                            {
                                              component: "CartesianGrid",
                                              props: {
                                                vertical: false,
                                                strokeDasharray: "0",
                                                stroke: "hsl(var(--border) / 0.6)",
                                              },
                                            },
                                            {
                                              component: "XAxis",
                                              props: {
                                                dataKey: "label",
                                                tickLine: false,
                                                axisLine: false,
                                                tickMargin: 14,
                                                minTickGap: 18,
                                                className: "text-xs",
                                              },
                                            },
                                            {
                                              component: "YAxis",
                                              props: {
                                                hide: true,
                                                domain: [0, 100],
                                              },
                                            },
                                            {
                                              component: "Area",
                                              props: {
                                                type: "monotone",
                                                dataKey: "visitors",
                                                fill: "var(--color-visitors)",
                                                stroke: "var(--color-visitors)",
                                                fillOpacity: 0.85,
                                                strokeWidth: 1.2,
                                              },
                                            },
                                            {
                                              component: "Area",
                                              props: {
                                                type: "monotone",
                                                dataKey: "baseline",
                                                fill: "hsl(var(--background))",
                                                stroke: "var(--color-baseline)",
                                                fillOpacity: 0.55,
                                                strokeWidth: 1.2,
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
                        {
                          component: "div",
                          props: { className: "px-6 pb-6" },
                          children: [
                            {
                              component: "Card",
                              props: { className: "rounded-xl shadow-sm" },
                              children: [
                                {
                                  component: "CardContent",
                                  props: { className: "flex flex-col gap-6 px-6 py-6" },
                                  children: [
                                    {
                                      component: "div",
                                      props: { className: "flex items-center justify-between gap-4" },
                                      children: [
                                        {
                                          component: "Tabs",
                                          props: {
                                            value: { "$ref": "page.store:activeDocumentTab" },
                                            onValueChange: {
                                              "$action": [
                                                {
                                                  type: "page.store.update",
                                                  path: "activeDocumentTab",
                                                  payload: { "$arg": 0 },
                                                },
                                              ],
                                            },
                                          },
                                          children: [
                                            {
                                              component: "TabsList",
                                              props: { className: "h-[34px] gap-0 rounded-md bg-muted/60 p-[3px]" },
                                              children: [
                                                {
                                                  "$map": {
                                                    over: { "$ref": "page.store:documentTabs" },
                                                    as: "tab",
                                                    return: {
                                                      component: "TabsTrigger",
                                                      props: {
                                                        value: { "$ref": "var:tab.id" },
                                                        className:
                                                          "h-7 gap-2 rounded-md px-3 data-[state=active]:bg-background data-[state=active]:shadow-xs",
                                                      },
                                                      children: [
                                                        { "$ref": "var:tab.label" },
                                                        {
                                                          "$if": {
                                                            cond: { "$neq": { a: { "$ref": "var:tab.count" }, b: null } },
                                                            then: {
                                                              component: "Badge",
                                                              props: { variant: "secondary", className: "h-5 rounded-sm px-1.5 text-xs" },
                                                              children: [{ "$string": { "$ref": "var:tab.count" } }],
                                                            },
                                                            else: null,
                                                          },
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
                                          props: { className: "flex items-center gap-2" },
                                          children: [
                                            {
                                              component: "Button",
                                              props: { variant: "outline", className: "h-8 px-3" },
                                              children: [{ component: "LayoutGrid" }, "Customize Columns", { component: "ChevronDownIcon", props: { className: "size-4" } }],
                                            },
                                            {
                                              component: "Button",
                                              props: { variant: "outline", className: "h-8 px-3" },
                                              children: [{ component: "Plus" }, "Add columns"],
                                            },
                                          ],
                                        },
                                      ],
                                    },
                                    {
                                      component: "Table",
                                      children: [
                                        {
                                          component: "TableHeader",
                                          children: [
                                            {
                                              component: "TableRow",
                                              props: { className: "h-10 bg-muted/40" },
                                              children: [
                                                { component: "TableHead", props: { className: "w-11" }, children: [" "] },
                                                {
                                                  component: "TableHead",
                                                  props: { className: "w-6" },
                                                  children: [{ component: "Checkbox" }],
                                                },
                                                { component: "TableHead", props: { className: "w-[317px]" }, children: ["Header"] },
                                                { component: "TableHead", props: { className: "w-[149px]" }, children: ["Section Type"] },
                                                { component: "TableHead", props: { className: "w-[108px]" }, children: ["Status"] },
                                                { component: "TableHead", props: { className: "w-[83px]" }, children: ["Target"] },
                                                { component: "TableHead", props: { className: "w-[83px]" }, children: ["Limit"] },
                                                { component: "TableHead", props: { className: "w-[173px]" }, children: ["Reviewer"] },
                                                { component: "TableHead", props: { className: "w-[50px]" }, children: [" "] },
                                              ],
                                            },
                                          ],
                                        },
                                        {
                                          component: "TableBody",
                                          children: [
                                            {
                                              "$map": {
                                                over: { "$ref": "selectors:paginatedRows" },
                                                as: "row",
                                                return: {
                                                  "$subConfig": "outlineRow",
                                                  subConfigProps: {
                                                    row: { "$ref": "var:row" },
                                                  },
                                                },
                                              },
                                            },
                                          ],
                                        },
                                      ],
                                    },
                                    {
                                      component: "div",
                                      props: { className: "flex items-center justify-between gap-4" },
                                      children: [
                                        {
                                          component: "Muted",
                                          props: { className: "text-sm" },
                                          children: [{ "$ref": "selectors:selectedCountLabel" }],
                                        },
                                        {
                                          component: "div",
                                          props: { className: "flex items-center gap-6" },
                                          children: [
                                            {
                                              component: "div",
                                              props: { className: "flex items-center gap-2" },
                                              children: [
                                                { component: "Muted", props: { className: "text-sm font-medium text-foreground" }, children: ["Rows per page"] },
                                                {
                                                  component: "Select",
                                                  props: {
                                                    value: { "$ref": "page.store:rowsPerPage" },
                                                    onValueChange: {
                                                      "$action": [
                                                        { type: "page.store.update", path: "rowsPerPage", payload: { "$arg": 0 } },
                                                      ],
                                                    },
                                                  },
                                                  children: [
                                                    { component: "SelectTrigger", props: { className: "h-9 w-[72px]" }, children: [{ component: "SelectValue" }] },
                                                    {
                                                      component: "SelectContent",
                                                      children: [
                                                        { component: "SelectItem", props: { value: "10" }, children: ["10"] },
                                                        { component: "SelectItem", props: { value: "20" }, children: ["20"] },
                                                        { component: "SelectItem", props: { value: "30" }, children: ["30"] },
                                                      ],
                                                    },
                                                  ],
                                                },
                                              ],
                                            },
                                            {
                                              component: "div",
                                              props: { className: "flex items-center gap-2" },
                                              children: [
                                                { component: "Large", props: { className: "text-sm font-medium" }, children: ["Page 1 of 7"] },
                                                { component: "Button", props: { variant: "outline", size: "icon-sm", disabled: true }, children: [{ component: "ChevronLeftIcon" }] },
                                                { component: "Button", props: { variant: "outline", size: "icon-sm", disabled: true }, children: [{ component: "ChevronLeftIcon" }, { component: "ChevronLeftIcon" }] },
                                                { component: "Button", props: { variant: "outline", size: "icon-sm" }, children: [{ component: "ChevronRightIcon" }] },
                                                { component: "Button", props: { variant: "outline", size: "icon-sm" }, children: [{ component: "ChevronRightIcon" }, { component: "ChevronRightIcon" }] },
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
        },
      ],
    },
  ],
};

