import type { ComponentNode } from "@beta-epic/ui";

export const eg1RootConfig: ComponentNode = {
  component: "div",
  selectors: {
    sourceRecords: {
      $if: {
        cond: { $eq: { a: { $ref: "page.store:entityView" }, b: "users" } },
        then: { $ref: "page.store:users" },
        else: { $ref: "page.store:groups" },
      },
    },
    pageHeading: {
      $if: {
        cond: { $eq: { a: { $ref: "page.store:entityView" }, b: "users" } },
        then: "Users",
        else: "Groups",
      },
    },
    addButtonLabel: {
      $if: {
        cond: { $eq: { a: { $ref: "page.store:entityView" }, b: "users" } },
        then: "Add users",
        else: "Add groups",
      },
    },
    searchPlaceholder: {
      $if: {
        cond: { $eq: { a: { $ref: "page.store:entityView" }, b: "users" } },
        then: "Search by name or email",
        else: "Search by group or email",
      },
    },
    columnOneLabel: "Name",
    columnTwoLabel: {
      $if: {
        cond: { $eq: { a: { $ref: "page.store:entityView" }, b: "users" } },
        then: "Email",
        else: "Contact",
      },
    },
    columnThreeLabel: {
      $if: {
        cond: { $eq: { a: { $ref: "page.store:entityView" }, b: "users" } },
        then: "Role",
        else: "Members",
      },
    },
    columnFourLabel: {
      $if: {
        cond: { $eq: { a: { $ref: "page.store:entityView" }, b: "users" } },
        then: "Team",
        else: "Access",
      },
    },
    filteredRecords: {
      $filter: {
        over: { $ref: "selectors:sourceRecords" },
        as: "record",
        where: {
          $and: [
            {
              $if: {
                cond: { $eq: { a: { $ref: "page.store:tableTab" }, b: "favorited" } },
                then: { $ref: "var:record.favorite" },
                else: true,
              },
            },
            {
              $if: {
                cond: { $ref: "page.store:showManagedOnly" },
                then: {
                  $eq: {
                    a: { $ref: "var:record.filterBucket" },
                    b: "managed",
                  },
                },
                else: true,
              },
            },
            {
              $or: [
                {
                  $contains: {
                    value: { $ref: "var:record.label" },
                    search: { $ref: "page.store:query" },
                  },
                },
                {
                  $contains: {
                    value: { $ref: "var:record.sublabel" },
                    search: { $ref: "page.store:query" },
                  },
                },
              ],
            },
          ],
        },
      },
    },
    sortedRecords: {
      $sort: {
        over: { $ref: "selectors:filteredRecords" },
        by: {
          $get: {
            from: { $ref: "var:item" },
            key: { $ref: "page.store:sortBy" },
          },
        },
        dir: { $ref: "page.store:sortDir" },
      },
    },
    visibleCount: { $count: { $ref: "selectors:sortedRecords" } },
    selectedVisibleCount: {
      $count: {
        $filter: {
          over: { $ref: "selectors:sortedRecords" },
          as: "record",
          where: {
            $in: {
              value: { $ref: "var:record.id" },
              array: { $ref: "page.store:selectedRecordIds" },
            },
          },
        },
      },
    },
    allVisibleSelected: {
      $and: [
        { $gt: { a: { $ref: "selectors:visibleCount" }, b: 0 } },
        {
          $every: {
            over: { $ref: "selectors:sortedRecords" },
            as: "record",
            where: {
              $in: {
                value: { $ref: "var:record.id" },
                array: { $ref: "page.store:selectedRecordIds" },
              },
            },
          },
        },
      ],
    },
    someVisibleSelected: {
      $gt: { a: { $ref: "selectors:selectedVisibleCount" }, b: 0 },
    },
  },
  effects: [
    {
      deps: [{ $ref: "page.store:entityView" }],
      run: [
        { type: "page.store.update", path: "selectedRecordIds", payload: [] },
        { type: "page.store.update", path: "query", payload: "" },
      ],
    },
  ],
  props: {
    className: "min-h-screen bg-background text-foreground",
  },
  children: [
    {
      component: "section",
      props: {
        className: "flex items-center justify-between border-b border-border px-4 py-3",
      },
      children: [
        {
          component: "div",
          props: { className: "flex items-center gap-4" },
          children: [
            {
              component: "Avatar",
              props: { size: "default" },
              children: [{ component: "AvatarFallback", children: ["BN"] }],
            },
            {
              component: "span",
              props: { className: "text-xl font-semibold tracking-tight" },
              children: [{ $ref: "page.store:brandName" }],
            },
          ],
        },
        {
          component: "div",
          props: { className: "flex items-center gap-1" },
          children: [
            {
              component: "Button",
              props: {
                variant: "ghost",
                className: "border-0 px-3 text-muted-foreground shadow-none",
                onClick: {
                  $action: [
                    {
                      type: "snackbar",
                      message: "Settings opened.",
                      variant: "info",
                    },
                  ],
                },
              },
              children: ["Settings"],
            },
            {
              component: "Button",
              props: {
                variant: "ghost",
                size: "icon-sm",
                className: "border-0 shadow-none",
                "aria-label": "Bookmark placeholder",
              },
              children: [
                {
                  component: "span",
                  props: { className: "text-[10px] font-semibold uppercase tracking-wide" },
                  children: ["BM"],
                },
              ],
            },
            {
              component: "Button",
              props: {
                variant: "ghost",
                size: "icon-sm",
                className: "border-0 shadow-none",
                "aria-label": "Info",
              },
              children: [{ component: "InfoIcon" }],
            },
            {
              component: "Avatar",
              props: { size: "default" },
              children: [{ component: "AvatarFallback", children: ["CN"] }],
            },
          ],
        },
      ],
    },
    {
      component: "section",
      props: {
        className: "flex items-center gap-4 border-b border-border px-4 py-3",
      },
      children: [
        {
          component: "span",
          props: { className: "text-base font-semibold" },
          children: ["Admin"],
        },
        {
          component: "div",
          props: { className: "flex items-center gap-1" },
          children: [
            {
              $map: {
                over: { $ref: "page.store:navItems" },
                as: "item",
                return: {
                  $subConfig: "topNavItem",
                  subConfigProps: {
                    item: { $ref: "var:item" },
                  },
                },
              },
            },
          ],
        },
      ],
    },
    {
      component: "section",
      props: { className: "flex items-center justify-between px-4 py-4" },
      children: [
        {
          component: "div",
          props: { className: "text-4xl font-semibold tracking-tight" },
          children: [{ $ref: "selectors:pageHeading" }],
        },
        {
          component: "Button",
          props: {
            size: "default",
            onClick: {
              $action: [
                {
                  $if: {
                    cond: { $eq: { a: { $ref: "page.store:entityView" }, b: "users" } },
                    then: [
                      {
                        type: "page.store.update",
                        path: "users",
                        payload: {
                          $append: {
                            to: { $ref: "page.store:users" },
                            item: {
                              id: {
                                $concat: [
                                  "user-",
                                  { $string: { $ref: "page.store:nextUserNumber" } },
                                ],
                              },
                              initials: "NU",
                              label: {
                                $concat: [
                                  "New User ",
                                  { $string: { $ref: "page.store:nextUserNumber" } },
                                ],
                              },
                              sublabel: "new.user@brand.co",
                              metaOne: "Editor",
                              metaTwo: "Operations",
                              favorite: true,
                              filterBucket: "managed",
                            },
                          },
                        },
                      },
                      {
                        type: "page.store.update",
                        path: "nextUserNumber",
                        payload: {
                          $add: [{ $ref: "page.store:nextUserNumber" }, 1],
                        },
                      },
                    ],
                    else: [
                      {
                        type: "page.store.update",
                        path: "groups",
                        payload: {
                          $append: {
                            to: { $ref: "page.store:groups" },
                            item: {
                              id: {
                                $concat: [
                                  "group-",
                                  { $string: { $ref: "page.store:nextGroupNumber" } },
                                ],
                              },
                              initials: "NG",
                              label: {
                                $concat: [
                                  "New Group ",
                                  { $string: { $ref: "page.store:nextGroupNumber" } },
                                ],
                              },
                              sublabel: "group@brand.co",
                              metaOne: "10 members",
                              metaTwo: "Private",
                              favorite: true,
                              filterBucket: "managed",
                            },
                          },
                        },
                      },
                      {
                        type: "page.store.update",
                        path: "nextGroupNumber",
                        payload: {
                          $add: [{ $ref: "page.store:nextGroupNumber" }, 1],
                        },
                      },
                    ],
                  },
                },
              ],
            },
          },
          children: [{ component: "Plus" }, { $ref: "selectors:addButtonLabel" }],
        },
      ],
    },
    {
      component: "section",
      props: { className: "px-4 pb-3" },
      children: [
        {
          component: "Tabs",
          props: {
            value: { $ref: "page.store:entityView" },
            onValueChange: {
              $action: [
                {
                  type: "page.store.update",
                  path: "entityView",
                  payload: { $arg: 0 },
                },
              ],
            },
          },
          children: [
            {
              component: "TabsList",
              props: { className: "h-9 rounded-lg bg-muted p-[3px]" },
              children: [
                {
                  component: "TabsTrigger",
                  props: {
                    value: "users",
                    className: "border-0 px-3 shadow-none data-[state=active]:shadow-sm",
                  },
                  children: ["Users"],
                },
                {
                  component: "TabsTrigger",
                  props: {
                    value: "groups",
                    className: "border-0 px-3 shadow-none data-[state=active]:shadow-sm",
                  },
                  children: ["Groups"],
                },
              ],
            },
          ],
        },
      ],
    },
    {
      component: "section",
      props: { className: "px-4 pb-4" },
      children: [
        {
          component: "div",
          props: {
            className:
              "flex w-full flex-col gap-4 rounded-[9px] border border-border bg-background p-4 shadow-sm",
          },
          children: [
            {
              component: "div",
              props: {
                className:
                  "flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between",
              },
              children: [
                {
                  component: "div",
                  props: { className: "flex flex-col gap-3 md:flex-row md:items-center" },
                  children: [
                    {
                      component: "div",
                      props: { className: "relative w-full md:w-[320px]" },
                      children: [
                        {
                          component: "SearchIcon",
                          props: {
                            className:
                              "pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground",
                          },
                        },
                        {
                          component: "Input",
                          props: {
                            value: { $ref: "page.store:query" },
                            placeholder: { $ref: "selectors:searchPlaceholder" },
                            className: "h-9 pl-9 shadow-sm",
                            onChange: {
                              $action: [
                                {
                                  type: "page.store.update",
                                  path: "query",
                                  payload: { $arg: 0, path: "currentTarget.value" },
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
                        {
                          component: "TabsList",
                          props: { className: "h-9 rounded-lg bg-muted p-[3px]" },
                          children: [
                            {
                              component: "TabsTrigger",
                              props: {
                                value: "favorited",
                                className: "border-0 px-3 shadow-none data-[state=active]:shadow-sm",
                              },
                              children: ["Favorited"],
                            },
                            {
                              component: "TabsTrigger",
                              props: {
                                value: "all",
                                className: "border-0 px-3 shadow-none data-[state=active]:shadow-sm",
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
                        className: {
                          $if: {
                            cond: { $ref: "page.store:showManagedOnly" },
                            then: "border-border bg-muted shadow-sm",
                            else: "border-border bg-background shadow-sm",
                          },
                        },
                        onClick: {
                          $action: [
                            {
                              type: "page.store.update",
                              path: "showManagedOnly",
                              payload: { $not: { $ref: "page.store:showManagedOnly" } },
                            },
                          ],
                        },
                      },
                      children: ["Filters"],
                    },
                  ],
                },
                {
                  component: "Button",
                  props: {
                    variant: "outline",
                    className: "border-border bg-background shadow-sm",
                    onClick: {
                      $action: [
                        {
                          type: "snackbar",
                          message: "Downloaded CSV export.",
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
              props: { className: "w-full overflow-hidden rounded-lg" },
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
                              children: [
                                {
                                  component: "Checkbox",
                                  props: {
                                    checked: {
                                      $if: {
                                        cond: { $ref: "selectors:allVisibleSelected" },
                                        then: true,
                                        else: {
                                          $if: {
                                            cond: { $ref: "selectors:someVisibleSelected" },
                                            then: "indeterminate",
                                            else: false,
                                          },
                                        },
                                      },
                                    },
                                    "aria-label": "Select visible records",
                                    onCheckedChange: {
                                      $action: [
                                        {
                                          type: "page.store.update",
                                          path: "selectedRecordIds",
                                          payload: {
                                            $if: {
                                              cond: { $ref: "selectors:allVisibleSelected" },
                                              then: [],
                                              else: {
                                                $map: {
                                                  over: { $ref: "selectors:sortedRecords" },
                                                  as: "record",
                                                  return: { $ref: "var:record.id" },
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
                              props: { className: "w-[220px]" },
                              children: [
                                {
                                  component: "Button",
                                  props: {
                                    variant: "ghost",
                                    size: "sm",
                                    className: "-ml-2 h-8 border-0 px-2 shadow-none",
                                    onClick: {
                                      $action: [
                                        {
                                          type: "page.store.update",
                                          path: "sortDir",
                                          payload: {
                                            $if: {
                                              cond: {
                                                $eq: {
                                                  a: { $ref: "page.store:sortBy" },
                                                  b: "label",
                                                },
                                              },
                                              then: {
                                                $if: {
                                                  cond: {
                                                    $eq: {
                                                      a: { $ref: "page.store:sortDir" },
                                                      b: "asc",
                                                    },
                                                  },
                                                  then: "desc",
                                                  else: "asc",
                                                },
                                              },
                                              else: "asc",
                                            },
                                          },
                                        },
                                        {
                                          type: "page.store.update",
                                          path: "sortBy",
                                          payload: "label",
                                        },
                                      ],
                                    },
                                  },
                                  children: [{ $ref: "selectors:columnOneLabel" }, { component: "ChevronDownIcon", props: { className: "size-4 opacity-50" } }],
                                },
                              ],
                            },
                            {
                              component: "TableHead",
                              props: { className: "min-w-[320px]" },
                              children: [
                                {
                                  component: "Button",
                                  props: {
                                    variant: "ghost",
                                    size: "sm",
                                    className: "-ml-2 h-8 border-0 px-2 shadow-none",
                                    onClick: {
                                      $action: [
                                        {
                                          type: "page.store.update",
                                          path: "sortDir",
                                          payload: {
                                            $if: {
                                              cond: {
                                                $eq: {
                                                  a: { $ref: "page.store:sortBy" },
                                                  b: "sublabel",
                                                },
                                              },
                                              then: {
                                                $if: {
                                                  cond: {
                                                    $eq: {
                                                      a: { $ref: "page.store:sortDir" },
                                                      b: "asc",
                                                    },
                                                  },
                                                  then: "desc",
                                                  else: "asc",
                                                },
                                              },
                                              else: "asc",
                                            },
                                          },
                                        },
                                        {
                                          type: "page.store.update",
                                          path: "sortBy",
                                          payload: "sublabel",
                                        },
                                      ],
                                    },
                                  },
                                  children: [{ $ref: "selectors:columnTwoLabel" }, { component: "ChevronDownIcon", props: { className: "size-4 opacity-50" } }],
                                },
                              ],
                            },
                            {
                              component: "TableHead",
                              props: { className: "w-[180px] text-right" },
                              children: [{ $ref: "selectors:columnThreeLabel" }],
                            },
                            {
                              component: "TableHead",
                              props: { className: "w-[180px] text-right" },
                              children: [{ $ref: "selectors:columnFourLabel" }],
                            },
                            {
                              component: "TableHead",
                              props: { className: "w-[96px]" },
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
                          $map: {
                            over: { $ref: "selectors:sortedRecords" },
                            as: "record",
                            return: {
                              $subConfig: "recordRow",
                              subConfigProps: {
                                record: { $ref: "var:record" },
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
          ],
        },
      ],
    },
  ],
};
