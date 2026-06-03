import type { ComponentNode } from "@beta-epic/ui";

export const preview2RootConfig: ComponentNode = {
  component: "SidebarProvider",
  selectors: {
    filteredRows: {
      "$filter": {
        over: { "$ref": "page.store:rows" },
        as: "row",
        where: {
          "$and": [
            {
              "$if": {
                cond: {
                  "$eq": {
                    a: { "$ref": "page.store:tab" },
                    b: "favorited",
                  },
                },
                then: { "$ref": "var:row.isFavorited" },
                else: true,
              },
            },
            {
              "$or": [
                {
                  "$contains": {
                    value: { "$ref": "var:row.name" },
                    search: { "$ref": "page.store:tableSearchQuery" },
                  },
                },
                {
                  "$contains": {
                    value: { "$ref": "var:row.detailOne" },
                    search: { "$ref": "page.store:tableSearchQuery" },
                  },
                },
                {
                  "$contains": {
                    value: { "$ref": "var:row.detailTwo" },
                    search: { "$ref": "page.store:tableSearchQuery" },
                  },
                },
              ],
            },
          ],
        },
      },
    },
    totalPages: {
      "$ceil": {
        "$div": [
          { "$count": { "$ref": "selectors:filteredRows" } },
          { "$ref": "page.store:pageSize" },
        ],
      },
    },
    paginatedRows: {
      "$slice": {
        over: { "$ref": "selectors:filteredRows" },
        start: {
          "$mul": [
            { "$sub": [{ "$ref": "page.store:currentPage" }, 1] },
            { "$ref": "page.store:pageSize" },
          ],
        },
        end: {
          "$mul": [
            { "$ref": "page.store:currentPage" },
            { "$ref": "page.store:pageSize" },
          ],
        },
      },
    },
    visibleRowIds: {
      "$map": {
        over: { "$ref": "selectors:paginatedRows" },
        as: "row",
        return: { "$ref": "var:row.id" },
      },
    },
    allVisibleSelected: {
      "$and": [
        { "$gt": { a: { "$count": { "$ref": "selectors:visibleRowIds" } }, b: 0 } },
        {
          "$every": {
            over: { "$ref": "selectors:visibleRowIds" },
            as: "visibleId",
            where: {
              "$in": {
                value: { "$ref": "var:visibleId" },
                array: { "$ref": "page.store:selectedRowIds" },
              },
            },
          },
        },
      ],
    },
    startLabel: {
      "$add": [
        {
          "$mul": [
            { "$sub": [{ "$ref": "page.store:currentPage" }, 1] },
            { "$ref": "page.store:pageSize" },
          ],
        },
        1,
      ],
    },
    endLabel: {
      "$if": {
        cond: {
          "$lt": {
            a: { "$count": { "$ref": "selectors:filteredRows" } },
            b: {
              "$mul": [
                { "$ref": "page.store:currentPage" },
                { "$ref": "page.store:pageSize" },
              ],
            },
          },
        },
        then: { "$count": { "$ref": "selectors:filteredRows" } },
        else: {
          "$mul": [
            { "$ref": "page.store:currentPage" },
            { "$ref": "page.store:pageSize" },
          ],
        },
      },
    },
    footerSummary: {
      "$if": {
        cond: {
          "$gt": {
            a: { "$count": { "$ref": "selectors:filteredRows" } },
            b: 0,
          },
        },
        then: {
          "$concat": [
            "Showing ",
            { "$string": { "$ref": "selectors:startLabel" } },
            "-",
            { "$string": { "$ref": "selectors:endLabel" } },
            " of ",
            { "$string": { "$count": { "$ref": "selectors:filteredRows" } } },
            " products",
          ],
        },
        else: "Showing 0 of 0 products",
      },
    },
  },
  effects: [
    {
      deps: [
        { "$ref": "page.store:tableSearchQuery" },
        { "$ref": "page.store:tab" },
      ],
      run: [
        {
          type: "page.store.update",
          path: "currentPage",
          payload: 1,
        },
      ],
    },
  ],
  props: { defaultOpen: true },
  children: [
    {
      component: "div",
      props: { className: "flex h-screen w-full overflow-hidden bg-background text-foreground" },
      children: [
        {
          component: "Sidebar",
          props: {
            collapsible: "none",
            className: "h-screen overflow-hidden border-r bg-sidebar",
          },
          children: [
            {
              component: "SidebarHeader",
              props: { className: "shrink-0 px-4 pt-3 pb-0" },
              children: [
                {
                  component: "Button",
                  props: {
                    variant: "outline",
                    className: "h-[52px] w-full justify-between rounded-lg px-3 py-2 shadow-xs",
                    onClick: {
                      "$action": [
                        { type: "snackbar", message: "Workspace switcher", variant: "info" },
                      ],
                    },
                  },
                  children: [
                    {
                      component: "div",
                      props: { className: "flex items-center gap-2" },
                      children: [
                        {
                          component: "Avatar",
                          props: { size: "sm" },
                          children: [
                            { component: "AvatarFallback", children: ["T"] },
                          ],
                        },
                        {
                          component: "div",
                          props: { className: "flex flex-col items-start" },
                          children: [
                            {
                              component: "Muted",
                              props: { className: "text-xs font-semibold text-muted-foreground" },
                              children: ["Text"],
                            },
                            {
                              component: "P",
                              props: { className: "text-sm text-foreground" },
                              children: ["Select an item"],
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
              component: "SidebarContent",
              props: { className: "min-h-0 overflow-hidden px-2 pt-2" },
              children: [
                {
                  component: "div",
                  props: { className: "flex flex-col gap-4" },
                  children: [
                    {
                      component: "SidebarGroup",
                      props: { className: "p-0" },
                      children: [
                        {
                          component: "SidebarGroupLabel",
                          children: ["Sidebar label"],
                        },
                        {
                          component: "SidebarGroupContent",
                          children: [
                            {
                              component: "SidebarMenu",
                              props: { className: "gap-0" },
                              children: [
                                {
                                  "$map": {
                                    over: { "$ref": "page.store:mainNav" },
                                    as: "item",
                                    return: {
                                      component: "SidebarMenuItem",
                                      children: [
                                        {
                                          component: "SidebarMenuButton",
                                          props: {
                                            isActive: { "$ref": "var:item.active" },
                                            className: "h-8 px-3 text-sm",
                                            onClick: {
                                              "$action": [
                                                {
                                                  type: "snackbar",
                                                  message: { "$concat": ["Open ", { "$ref": "var:item.label" }] },
                                                  variant: "info",
                                                },
                                              ],
                                            },
                                          },
                                          children: [
                                            {
                                              "$if": {
                                                cond: {
                                                  "$eq": {
                                                    a: { "$ref": "var:item.id" },
                                                    b: "home",
                                                  },
                                                },
                                                then: { component: "LayoutGrid" },
                                                else: { component: "LayoutGrid" },
                                              },
                                            },
                                            { "$ref": "var:item.label" },
                                          ],
                                        },
                                        {
                                          "$if": {
                                            cond: {
                                              "$gt": {
                                                a: { "$count": { "$ref": "var:item.children" } },
                                                b: 0,
                                              },
                                            },
                                            then: {
                                              component: "SidebarMenuSub",
                                              children: [
                                                {
                                                  "$map": {
                                                    over: { "$ref": "var:item.children" },
                                                    as: "child",
                                                    return: {
                                                      component: "SidebarMenuSubItem",
                                                      children: [
                                                        {
                                                          component: "SidebarMenuSubButton",
                                                          props: {
                                                            isActive: { "$ref": "var:child.active" },
                                                            className: "h-8 text-sm",
                                                            onClick: {
                                                              "$action": [
                                                                {
                                                                  type: "snackbar",
                                                                  message: {
                                                                    "$concat": [
                                                                      "Open ",
                                                                      { "$ref": "var:child.label" },
                                                                    ],
                                                                  },
                                                                  variant: "info",
                                                                },
                                                              ],
                                                            },
                                                          },
                                                          children: [{ "$ref": "var:child.label" }],
                                                        },
                                                      ],
                                                    },
                                                  },
                                                },
                                              ],
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
                      ],
                    },
                  ],
                },
              ],
            },
            {
              component: "SidebarFooter",
              props: { className: "shrink-0 px-2 pb-3 pt-0" },
              children: [
                {
                  component: "SidebarGroup",
                  props: { className: "p-0" },
                  children: [
                    {
                      component: "SidebarGroupLabel",
                      children: ["Sidebar label"],
                    },
                    {
                      component: "SidebarGroupContent",
                      children: [
                        {
                          component: "SidebarMenu",
                          props: { className: "gap-0" },
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
                                      props: {
                                        className: "h-8 px-3 text-sm",
                                        onClick: {
                                          "$action": [
                                            {
                                              type: "snackbar",
                                              message: {
                                                "$concat": ["Open ", { "$ref": "var:item.label" }],
                                              },
                                              variant: "info",
                                            },
                                          ],
                                        },
                                      },
                                      children: [
                                        {
                                          "$if": {
                                            cond: {
                                              "$eq": {
                                                a: { "$ref": "var:item.icon" },
                                                b: "Wrench",
                                              },
                                            },
                                            then: { component: "Wrench" },
                                            else: {
                                              "$if": {
                                                cond: {
                                                  "$eq": {
                                                    a: { "$ref": "var:item.icon" },
                                                    b: "User",
                                                  },
                                                },
                                                then: { component: "User" },
                                                else: { component: "LayoutGrid" },
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
          component: "div",
          props: { className: "flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden" },
          children: [
            {
              component: "div",
              props: { className: "shrink-0 flex items-center gap-2 border-b px-4 py-3" },
              children: [
                {
                  component: "div",
                  props: { className: "flex flex-1 items-center" },
                  children: [
                    {
                      component: "Breadcrumb",
                      children: [
                        {
                          component: "BreadcrumbList",
                          children: [
                            {
                              component: "BreadcrumbItem",
                              children: [{ component: "BreadcrumbLink", children: ["Level 1"] }],
                            },
                            { component: "BreadcrumbSeparator" },
                            {
                              component: "BreadcrumbItem",
                              children: [{ component: "BreadcrumbPage", children: ["Level 2"] }],
                            },
                          ],
                        },
                      ],
                    },
                  ],
                },
                {
                  component: "div",
                  props: { className: "relative w-[209px]" },
                  children: [
                    {
                      component: "SearchIcon",
                      props: {
                        className:
                          "pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground",
                      },
                    },
                    {
                      component: "Input",
                      props: {
                        value: { "$ref": "page.store:topSearchQuery" },
                        placeholder: "Search for something...",
                        className: "pl-8",
                        onChange: {
                          "$action": [
                            {
                              type: "page.store.update",
                              path: "topSearchQuery",
                              payload: { "$arg": 0, path: "target.value" },
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
              props: { className: "shrink-0 border-b px-4 py-3" },
              children: [
                {
                  component: "div",
                  props: { className: "flex items-center gap-2" },
                  children: [
                    {
                      component: "Button",
                      props: {
                        variant: "outline",
                        onClick: {
                          "$action": [
                            {
                              type: "snackbar",
                              message: "Customize columns",
                              variant: "info",
                            },
                          ],
                        },
                      },
                      children: ["Customize Columns"],
                    },
                    {
                      component: "Button",
                      props: {
                        variant: "outline",
                        onClick: {
                          "$action": [
                            { type: "snackbar", message: "Add section", variant: "success" },
                          ],
                        },
                      },
                      children: ["Add Section"],
                    },
                  ],
                },
              ],
            },
            {
              component: "div",
              props: { className: "min-h-0 flex-1 overflow-hidden p-4" },
              children: [
                {
                  component: "Card",
                  props: { className: "h-[640px] max-h-full rounded-xl shadow-sm" },
                  children: [
                    {
                      component: "CardContent",
                      props: { className: "flex h-full flex-col gap-2 p-4" },
                      children: [
                        {
                          component: "div",
                          props: { className: "flex items-center justify-between gap-4 pb-2" },
                          children: [
                            {
                              component: "div",
                              props: { className: "flex items-center gap-[26px]" },
                              children: [
                                {
                                  component: "div",
                                  props: { className: "relative w-[320px]" },
                                  children: [
                                    {
                                      component: "SearchIcon",
                                      props: {
                                        className:
                                          "pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground",
                                      },
                                    },
                                    {
                                      component: "Input",
                                      props: {
                                        value: { "$ref": "page.store:tableSearchQuery" },
                                        placeholder: "Search by name or email",
                                        className: "h-9 pl-8 shadow-xs",
                                        onChange: {
                                          "$action": [
                                            {
                                              type: "page.store.update",
                                              path: "tableSearchQuery",
                                              payload: { "$arg": 0, path: "target.value" },
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
                                    value: { "$ref": "page.store:tab" },
                                    onValueChange: {
                                      "$action": [
                                        {
                                          type: "page.store.update",
                                          path: "tab",
                                          payload: { "$arg": 0 },
                                        },
                                      ],
                                    },
                                  },
                                  children: [
                                    {
                                      component: "TabsList",
                                      props: { className: "h-[35px] rounded-[10px] bg-muted p-[3px]" },
                                      children: [
                                        {
                                          component: "TabsTrigger",
                                          props: {
                                            value: "favorited",
                                            className:
                                              "h-[29px] rounded-[10px] px-2 shadow-none data-[state=active]:bg-background data-[state=active]:shadow-sm",
                                          },
                                          children: ["Favorited"],
                                        },
                                        {
                                          component: "TabsTrigger",
                                          props: {
                                            value: "all",
                                            className:
                                              "h-[29px] rounded-[10px] px-2 shadow-none data-[state=active]:bg-background data-[state=active]:shadow-sm",
                                          },
                                          children: ["All"],
                                        },
                                      ],
                                    },
                                  ],
                                },
                                {
                                  component: "Button",
                                  props: {
                                    variant: "outline",
                                    className: "h-9 px-4 shadow-xs",
                                    onClick: {
                                      "$action": [
                                        {
                                          type: "snackbar",
                                          message: "Filters panel",
                                          variant: "info",
                                        },
                                      ],
                                    },
                                  },
                                  children: [{ component: "Sliders" }, "Filters"],
                                },
                              ],
                            },
                            {
                              component: "Button",
                              props: {
                                variant: "outline",
                                className: "h-9 px-4 shadow-xs",
                                onClick: {
                                  "$action": [
                                    {
                                      type: "snackbar",
                                      message: "Download CSV",
                                      variant: "success",
                                    },
                                  ],
                                },
                              },
                              children: [{ component: "Copy" }, "Download CSV"],
                            },
                          ],
                        },
                        {
                          component: "div",
                          props: { className: "overflow-hidden rounded-lg border border-border" },
                          children: [
                            {
                              component: "Table",
                              children: [
                                {
                                  component: "TableHeader",
                                  children: [
                                    {
                                      component: "TableRow",
                                      props: { className: "h-9 bg-muted/20" },
                                      children: [
                                        {
                                          component: "TableHead",
                                          props: { className: "w-8" },
                                          children: [
                                            {
                                              component: "Checkbox",
                                              props: {
                                                checked: { "$ref": "selectors:allVisibleSelected" },
                                                onCheckedChange: {
                                                  "$action": [
                                                    {
                                                      type: "page.store.update",
                                                      path: "selectedRowIds",
                                                      payload: {
                                                        "$if": {
                                                          cond: { "$arg": 0 },
                                                          then: {
                                                            "$uniq": {
                                                              "$flat": [
                                                                { "$ref": "page.store:selectedRowIds" },
                                                                { "$ref": "selectors:visibleRowIds" },
                                                              ],
                                                            },
                                                          },
                                                          else: {
                                                            "$filter": {
                                                              over: { "$ref": "page.store:selectedRowIds" },
                                                              as: "selectedId",
                                                              where: {
                                                                "$not": {
                                                                  "$in": {
                                                                    value: { "$ref": "var:selectedId" },
                                                                    array: { "$ref": "selectors:visibleRowIds" },
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
                                              },
                                            },
                                          ],
                                        },
                                        {
                                          component: "TableHead",
                                          props: { className: "w-[206px]" },
                                          children: ["Table heading"],
                                        },
                                        {
                                          component: "TableHead",
                                          props: { className: "w-[206px]" },
                                          children: [
                                            {
                                              component: "div",
                                              props: { className: "flex items-center gap-2" },
                                              children: [
                                                "Table heading",
                                                { component: "ChevronUpIcon", props: { className: "size-3 text-muted-foreground" } },
                                                { component: "ChevronDownIcon", props: { className: "-ml-1 size-3 text-muted-foreground" } },
                                              ],
                                            },
                                          ],
                                        },
                                        {
                                          component: "TableHead",
                                          props: { className: "w-[206px]" },
                                          children: ["Table heading"],
                                        },
                                        {
                                          component: "TableHead",
                                          props: { className: "w-[206px]" },
                                          children: ["Table heading"],
                                        },
                                        {
                                          component: "TableHead",
                                          props: { className: "w-[84px]" },
                                          children: [" "],
                                        },
                                        {
                                          component: "TableHead",
                                          props: { className: "w-[56px]" },
                                          children: [" "],
                                        },
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
                                          "$subConfig": "preview2Row",
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
                          ],
                        },
                        {
                          component: "div",
                          props: { className: "mt-auto flex items-center justify-between gap-4 pt-2" },
                          children: [
                            {
                              component: "Muted",
                              props: { className: "text-sm" },
                              children: [{ "$ref": "selectors:footerSummary" }],
                            },
                            {
                              component: "div",
                              props: { className: "flex items-center gap-1 text-sm" },
                              children: [
                                {
                                  component: "Button",
                                  props: {
                                    variant: "ghost",
                                    size: "sm",
                                    className: "h-9 px-4",
                                    disabled: {
                                      "$eq": {
                                        a: { "$ref": "page.store:currentPage" },
                                        b: 1,
                                      },
                                    },
                                    onClick: {
                                      "$action": [
                                        {
                                          type: "page.store.update",
                                          path: "currentPage",
                                          payload: {
                                            "$if": {
                                              cond: {
                                                "$gt": {
                                                  a: { "$ref": "page.store:currentPage" },
                                                  b: 1,
                                                },
                                              },
                                              then: {
                                                "$sub": [{ "$ref": "page.store:currentPage" }, 1],
                                              },
                                              else: { "$ref": "page.store:currentPage" },
                                            },
                                          },
                                        },
                                      ],
                                    },
                                  },
                                  children: ["Previous"],
                                },
                                {
                                  "$map": {
                                    over: { "$ref": "page.store:pageNumbers" },
                                    as: "pageNumber",
                                    return: {
                                      component: "Button",
                                      props: {
                                        variant: {
                                          "$if": {
                                            cond: {
                                              "$eq": {
                                                a: { "$ref": "var:pageNumber" },
                                                b: { "$ref": "page.store:currentPage" },
                                              },
                                            },
                                            then: "outline",
                                            else: "ghost",
                                          },
                                        },
                                        size: "icon-sm",
                                        className: "h-9 w-9",
                                        onClick: {
                                          "$action": [
                                            {
                                              type: "page.store.update",
                                              path: "currentPage",
                                              payload: { "$ref": "var:pageNumber" },
                                            },
                                          ],
                                        },
                                      },
                                      children: [{ "$string": { "$ref": "var:pageNumber" } }],
                                    },
                                  },
                                },
                                {
                                  component: "Button",
                                  props: { variant: "ghost", size: "icon-sm", className: "h-9 w-9", disabled: true },
                                  children: ["..."],
                                },
                                {
                                  component: "Button",
                                  props: {
                                    variant: {
                                      "$if": {
                                        cond: {
                                          "$eq": {
                                            a: 10,
                                            b: { "$ref": "page.store:currentPage" },
                                          },
                                        },
                                        then: "outline",
                                        else: "ghost",
                                      },
                                    },
                                    size: "icon-sm",
                                    className: "h-9 w-9",
                                    onClick: {
                                      "$action": [
                                        {
                                          type: "page.store.update",
                                          path: "currentPage",
                                          payload: 10,
                                        },
                                      ],
                                    },
                                  },
                                  children: ["10"],
                                },
                                {
                                  component: "Button",
                                  props: {
                                    variant: "ghost",
                                    size: "sm",
                                    className: "h-9 px-4",
                                    disabled: {
                                      "$eq": {
                                        a: { "$ref": "page.store:currentPage" },
                                        b: 10,
                                      },
                                    },
                                    onClick: {
                                      "$action": [
                                        {
                                          type: "page.store.update",
                                          path: "currentPage",
                                          payload: {
                                            "$if": {
                                              cond: {
                                                "$lt": {
                                                  a: { "$ref": "page.store:currentPage" },
                                                  b: 10,
                                                },
                                              },
                                              then: {
                                                "$add": [{ "$ref": "page.store:currentPage" }, 1],
                                              },
                                              else: { "$ref": "page.store:currentPage" },
                                            },
                                          },
                                        },
                                      ],
                                    },
                                  },
                                  children: ["Next"],
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

