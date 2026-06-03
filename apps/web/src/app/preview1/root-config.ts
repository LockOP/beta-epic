import type { ComponentNode } from "@beta-epic/ui";

export const preview1RootConfig: ComponentNode = {
  component: "div",
  selectors: {
    filteredTasks: {
      "$filter": {
        over: { "$ref": "page.store:tasks" },
        as: "task",
        where: {
          "$and": [
            {
              "$if": {
                cond: {
                  "$neq": {
                    a: { "$ref": "page.store:statusFilter" },
                    b: "all",
                  },
                },
                then: {
                  "$eq": {
                    a: { "$ref": "var:task.status" },
                    b: { "$ref": "page.store:statusFilter" },
                  },
                },
                else: true,
              },
            },
            {
              "$if": {
                cond: {
                  "$neq": {
                    a: { "$ref": "page.store:priorityFilter" },
                    b: "all",
                  },
                },
                then: {
                  "$eq": {
                    a: { "$ref": "var:task.priority" },
                    b: { "$ref": "page.store:priorityFilter" },
                  },
                },
                else: true,
              },
            },
            {
              "$or": [
                {
                  "$contains": {
                    value: { "$ref": "var:task.id" },
                    search: { "$ref": "page.store:searchQuery" },
                  },
                },
                {
                  "$contains": {
                    value: { "$ref": "var:task.title" },
                    search: { "$ref": "page.store:searchQuery" },
                  },
                },
                {
                  "$contains": {
                    value: { "$ref": "var:task.type" },
                    search: { "$ref": "page.store:searchQuery" },
                  },
                },
              ],
            },
          ],
        },
      },
    },
    sortedTasks: {
      "$sort": {
        over: { "$ref": "selectors:filteredTasks" },
        by: {
          "$get": {
            from: { "$ref": "var:item" },
            key: { "$ref": "page.store:sortKey" },
          },
        },
        dir: { "$ref": "page.store:sortDir" },
      },
    },
    totalPages: {
      "$max": [
        1,
        {
          "$ceil": {
            "$div": [
              { "$count": { "$ref": "selectors:filteredTasks" } },
              { "$ref": "page.store:rowsPerPage" },
            ],
          },
        },
      ],
    },
    pageStart: {
      "$mul": [
        { "$sub": [{ "$ref": "page.store:currentPage" }, 1] },
        { "$ref": "page.store:rowsPerPage" },
      ],
    },
    paginatedTasks: {
      "$slice": {
        over: { "$ref": "selectors:sortedTasks" },
        start: { "$ref": "selectors:pageStart" },
        end: {
          "$add": [
            { "$ref": "selectors:pageStart" },
            { "$ref": "page.store:rowsPerPage" },
          ],
        },
      },
    },
    visibleTaskIds: {
      "$map": {
        over: { "$ref": "selectors:paginatedTasks" },
        as: "task",
        return: { "$ref": "var:task.id" },
      },
    },
    selectedVisibleCount: {
      "$count": {
        "$filter": {
          over: { "$ref": "page.store:selectedTaskIds" },
          as: "selectedId",
          where: {
            "$in": {
              value: { "$ref": "var:selectedId" },
              array: { "$ref": "selectors:visibleTaskIds" },
            },
          },
        },
      },
    },
    allVisibleSelected: {
      "$and": [
        { "$gt": { a: { "$count": { "$ref": "selectors:visibleTaskIds" } }, b: 0 } },
        {
          "$every": {
            over: { "$ref": "selectors:visibleTaskIds" },
            as: "visibleId",
            where: {
              "$in": {
                value: { "$ref": "var:visibleId" },
                array: { "$ref": "page.store:selectedTaskIds" },
              },
            },
          },
        },
      ],
    },
    selectionSummary: {
      "$concat": [
        { "$string": { "$ref": "selectors:selectedVisibleCount" } },
        " of ",
        { "$string": { "$count": { "$ref": "selectors:visibleTaskIds" } } },
        " row(s) selected.",
      ],
    },
    pageSummary: {
      "$concat": [
        "Page ",
        { "$string": { "$ref": "page.store:currentPage" } },
        " of ",
        { "$string": { "$ref": "selectors:totalPages" } },
      ],
    },
    canGoPrev: {
      "$gt": {
        a: { "$ref": "page.store:currentPage" },
        b: 1,
      },
    },
    canGoNext: {
      "$lt": {
        a: { "$ref": "page.store:currentPage" },
        b: { "$ref": "selectors:totalPages" },
      },
    },
  },
  effects: [
    {
      deps: [
        { "$ref": "page.store:searchQuery" },
        { "$ref": "page.store:statusFilter" },
        { "$ref": "page.store:priorityFilter" },
        { "$ref": "page.store:rowsPerPage" },
      ],
      run: [
        {
          type: "page.store.update",
          path: "currentPage",
          payload: 1,
        },
      ],
    },
    {
      deps: [
        { "$ref": "selectors:totalPages" },
        { "$ref": "page.store:currentPage" },
      ],
      run: [
        {
          "$if": {
            cond: {
              "$gt": {
                a: { "$ref": "page.store:currentPage" },
                b: { "$ref": "selectors:totalPages" },
              },
            },
            then: [
              {
                type: "page.store.update",
                path: "currentPage",
                payload: { "$ref": "selectors:totalPages" },
              },
            ],
            else: [],
          },
        },
      ],
    },
  ],
  props: { className: "min-h-screen w-full bg-background p-8 text-foreground" },
  children: [
    {
      component: "div",
      props: { className: "mx-auto flex max-w-[1220px] flex-col gap-8" },
      children: [
        {
          component: "div",
          props: { className: "flex items-start justify-between gap-4" },
          children: [
            {
              component: "div",
              props: { className: "flex flex-col gap-1" },
              children: [
                {
                  component: "H3",
                  props: { className: "scroll-m-0 text-3xl tracking-tight" },
                  children: ["Welcome back!"],
                },
                {
                  component: "P",
                  props: { className: "text-muted-foreground" },
                  children: ["Here’s a list of your tasks for this month."],
                },
              ],
            },
            {
              component: "Avatar",
              props: { size: "lg" },
              children: [
                {
                  component: "AvatarImage",
                  props: {
                    src: { "$ref": "page.store:userAvatarUrl" },
                    alt: "User avatar",
                  },
                },
                {
                  component: "AvatarFallback",
                  children: ["AM"],
                },
              ],
            },
          ],
        },
        {
          component: "div",
          props: { className: "flex flex-col gap-4" },
          children: [
            {
              component: "div",
              props: { className: "flex items-center justify-between gap-4" },
              children: [
                {
                  component: "div",
                  props: { className: "flex items-center gap-2" },
                  children: [
                    {
                      component: "div",
                      props: { className: "relative w-[250px]" },
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
                            value: { "$ref": "page.store:searchQuery" },
                            placeholder: "Filter tasks...",
                            className: "pl-8",
                            onChange: {
                              "$action": [
                                {
                                  type: "page.store.update",
                                  path: "searchQuery",
                                  payload: { "$arg": 0, path: "currentTarget.value" },
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
                        variant: {
                          "$if": {
                            cond: {
                              "$neq": {
                                a: { "$ref": "page.store:statusFilter" },
                                b: "all",
                              },
                            },
                            then: "secondary",
                            else: "outline",
                          },
                        },
                        size: "sm",
                        onClick: {
                          "$action": [
                            {
                              type: "page.store.update",
                              path: "statusFilter",
                              payload: {
                                "$switch": {
                                  on: { "$ref": "page.store:statusFilter" },
                                  cases: {
                                    all: "In Progress",
                                    "In Progress": "Todo",
                                    Todo: "Done",
                                    Done: "all",
                                  },
                                  default: "all",
                                },
                              },
                            },
                          ],
                        },
                      },
                      children: ["Status"],
                    },
                    {
                      component: "Button",
                      props: {
                        variant: {
                          "$if": {
                            cond: {
                              "$neq": {
                                a: { "$ref": "page.store:priorityFilter" },
                                b: "all",
                              },
                            },
                            then: "secondary",
                            else: "outline",
                          },
                        },
                        size: "sm",
                        onClick: {
                          "$action": [
                            {
                              type: "page.store.update",
                              path: "priorityFilter",
                              payload: {
                                "$switch": {
                                  on: { "$ref": "page.store:priorityFilter" },
                                  cases: {
                                    all: "High",
                                    High: "Medium",
                                    Medium: "Low",
                                    Low: "all",
                                  },
                                  default: "all",
                                },
                              },
                            },
                          ],
                        },
                      },
                      children: ["Priority"],
                    },
                    {
                      component: "Button",
                      props: {
                        variant: "ghost",
                        size: "sm",
                        onClick: {
                          "$action": [
                            { type: "page.store.update", path: "searchQuery", payload: "" },
                            { type: "page.store.update", path: "statusFilter", payload: "all" },
                            { type: "page.store.update", path: "priorityFilter", payload: "all" },
                            { type: "page.store.update", path: "sortKey", payload: "titleSort" },
                            { type: "page.store.update", path: "sortDir", payload: "asc" },
                            { type: "page.store.update", path: "selectedTaskIds", payload: [] },
                          ],
                        },
                      },
                      children: ["Reset"],
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
                        size: "sm",
                        onClick: {
                          "$action": [
                            {
                              type: "snackbar",
                              message: {
                                "$concat": [
                                  "Viewing ",
                                  {
                                    "$string": {
                                      "$count": { "$ref": "selectors:paginatedTasks" },
                                    },
                                  },
                                  " tasks",
                                ],
                              },
                              variant: "info",
                            },
                          ],
                        },
                      },
                      children: ["View"],
                    },
                    {
                      component: "Button",
                      props: {
                        size: "sm",
                        onClick: {
                          "$action": [
                            {
                              type: "page.store.update",
                              path: "tasks",
                              payload: {
                                "$prepend": {
                                  to: { "$ref": "page.store:tasks" },
                                  item: {
                                    id: {
                                      "$concat": [
                                        "TASK-",
                                        { "$string": { "$ref": "page.store:nextTaskNumber" } },
                                      ],
                                    },
                                    taskOrder: { "$ref": "page.store:nextTaskNumber" },
                                    type: "Feature",
                                    title: "New mock task created from preview interaction.",
                                    titleSort: "New mock task created from preview interaction.",
                                    status: "Todo",
                                    statusOrder: 1,
                                    priority: "Medium",
                                    priorityOrder: 2,
                                    priorityIcon: "right",
                                  },
                                },
                              },
                            },
                            {
                              type: "page.store.update",
                              path: "nextTaskNumber",
                              payload: {
                                "$add": [{ "$ref": "page.store:nextTaskNumber" }, 1],
                              },
                            },
                            {
                              type: "snackbar",
                              message: "Task added",
                              variant: "success",
                            },
                          ],
                        },
                      },
                      children: [{ component: "Plus" }, "Add Task"],
                    },
                  ],
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
                          props: { className: "h-9" },
                          children: [
                            {
                              component: "TableHead",
                              props: { className: "w-10" },
                              children: [
                                {
                                  component: "Checkbox",
                                  props: {
                                    checked: { "$ref": "selectors:allVisibleSelected" },
                                    onCheckedChange: {
                                      "$action": [
                                        {
                                          "$if": {
                                            cond: { "$ref": "selectors:allVisibleSelected" },
                                            then: [
                                              {
                                                type: "page.store.update",
                                                path: "selectedTaskIds",
                                                payload: {
                                                  "$filter": {
                                                    over: { "$ref": "page.store:selectedTaskIds" },
                                                    as: "selectedId",
                                                    where: {
                                                      "$not": {
                                                        "$in": {
                                                          value: { "$ref": "var:selectedId" },
                                                          array: { "$ref": "selectors:visibleTaskIds" },
                                                        },
                                                      },
                                                    },
                                                  },
                                                },
                                              },
                                            ],
                                            else: [
                                              {
                                                type: "page.store.update",
                                                path: "selectedTaskIds",
                                                payload: {
                                                  "$uniq": {
                                                    "$flat": [
                                                      { "$ref": "page.store:selectedTaskIds" },
                                                      { "$ref": "selectors:visibleTaskIds" },
                                                    ],
                                                  },
                                                },
                                              },
                                            ],
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
                              props: { className: "w-[120px]" },
                              children: ["Task"],
                            },
                            {
                              component: "TableHead",
                              children: [
                                {
                                  component: "Button",
                                  props: {
                                    variant: "ghost",
                                    size: "sm",
                                    className: "-ml-2 h-8 px-2",
                                    onClick: {
                                      "$action": [
                                        {
                                          "$if": {
                                            cond: {
                                              "$eq": {
                                                a: { "$ref": "page.store:sortKey" },
                                                b: "titleSort",
                                              },
                                            },
                                            then: [
                                              {
                                                type: "page.store.update",
                                                path: "sortDir",
                                                payload: {
                                                  "$if": {
                                                    cond: {
                                                      "$eq": {
                                                        a: { "$ref": "page.store:sortDir" },
                                                        b: "asc",
                                                      },
                                                    },
                                                    then: "desc",
                                                    else: "asc",
                                                  },
                                                },
                                              },
                                            ],
                                            else: [
                                              {
                                                type: "page.store.update",
                                                path: "sortKey",
                                                payload: "titleSort",
                                              },
                                              {
                                                type: "page.store.update",
                                                path: "sortDir",
                                                payload: "asc",
                                              },
                                            ],
                                          },
                                        },
                                      ],
                                    },
                                  },
                                  children: [
                                    "Title",
                                    { component: "ChevronUpIcon", props: { className: "size-3" } },
                                    {
                                      component: "ChevronDownIcon",
                                      props: { className: "-ml-1 size-3" },
                                    },
                                  ],
                                },
                              ],
                            },
                            {
                              component: "TableHead",
                              props: { className: "w-[180px]" },
                              children: [
                                {
                                  component: "Button",
                                  props: {
                                    variant: "ghost",
                                    size: "sm",
                                    className: "-ml-2 h-8 px-2",
                                    onClick: {
                                      "$action": [
                                        {
                                          "$if": {
                                            cond: {
                                              "$eq": {
                                                a: { "$ref": "page.store:sortKey" },
                                                b: "statusOrder",
                                              },
                                            },
                                            then: [
                                              {
                                                type: "page.store.update",
                                                path: "sortDir",
                                                payload: {
                                                  "$if": {
                                                    cond: {
                                                      "$eq": {
                                                        a: { "$ref": "page.store:sortDir" },
                                                        b: "asc",
                                                      },
                                                    },
                                                    then: "desc",
                                                    else: "asc",
                                                  },
                                                },
                                              },
                                            ],
                                            else: [
                                              {
                                                type: "page.store.update",
                                                path: "sortKey",
                                                payload: "statusOrder",
                                              },
                                              {
                                                type: "page.store.update",
                                                path: "sortDir",
                                                payload: "asc",
                                              },
                                            ],
                                          },
                                        },
                                      ],
                                    },
                                  },
                                  children: [
                                    "Status",
                                    { component: "ChevronUpIcon", props: { className: "size-3" } },
                                    {
                                      component: "ChevronDownIcon",
                                      props: { className: "-ml-1 size-3" },
                                    },
                                  ],
                                },
                              ],
                            },
                            {
                              component: "TableHead",
                              props: { className: "w-[180px] bg-muted/40" },
                              children: [
                                {
                                  component: "Button",
                                  props: {
                                    variant: "ghost",
                                    size: "sm",
                                    className: "-ml-2 h-8 px-2",
                                    onClick: {
                                      "$action": [
                                        {
                                          "$if": {
                                            cond: {
                                              "$eq": {
                                                a: { "$ref": "page.store:sortKey" },
                                                b: "priorityOrder",
                                              },
                                            },
                                            then: [
                                              {
                                                type: "page.store.update",
                                                path: "sortDir",
                                                payload: {
                                                  "$if": {
                                                    cond: {
                                                      "$eq": {
                                                        a: { "$ref": "page.store:sortDir" },
                                                        b: "asc",
                                                      },
                                                    },
                                                    then: "desc",
                                                    else: "asc",
                                                  },
                                                },
                                              },
                                            ],
                                            else: [
                                              {
                                                type: "page.store.update",
                                                path: "sortKey",
                                                payload: "priorityOrder",
                                              },
                                              {
                                                type: "page.store.update",
                                                path: "sortDir",
                                                payload: "desc",
                                              },
                                            ],
                                          },
                                        },
                                      ],
                                    },
                                  },
                                  children: [
                                    "Priority",
                                    { component: "ChevronUpIcon", props: { className: "size-3" } },
                                    {
                                      component: "ChevronDownIcon",
                                      props: { className: "-ml-1 size-3" },
                                    },
                                  ],
                                },
                              ],
                            },
                            {
                              component: "TableHead",
                              props: { className: "w-[72px]" },
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
                            over: { "$ref": "selectors:paginatedTasks" },
                            as: "task",
                            return: {
                              "$subConfig": "taskRow",
                              subConfigProps: {
                                task: { "$ref": "var:task" },
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
              props: {
                className:
                  "flex items-center justify-between gap-4 text-sm text-muted-foreground",
              },
              children: [
                {
                  component: "Muted",
                  props: { className: "text-sm" },
                  children: [{ "$ref": "selectors:selectionSummary" }],
                },
                {
                  component: "div",
                  props: { className: "flex items-center gap-6" },
                  children: [
                    {
                      component: "div",
                      props: { className: "flex items-center gap-2" },
                      children: [
                        {
                          component: "P",
                          props: { className: "text-sm text-foreground" },
                          children: ["Rows per page"],
                        },
                        {
                          component: "Select",
                          props: {
                            value: { "$string": { "$ref": "page.store:rowsPerPage" } },
                            onValueChange: {
                              "$action": [
                                {
                                  type: "page.store.update",
                                  path: "rowsPerPage",
                                  payload: { "$number": { "$arg": 0 } },
                                },
                              ],
                            },
                          },
                          children: [
                            {
                              component: "SelectTrigger",
                              props: { size: "sm", className: "w-[72px]" },
                              children: [{ component: "SelectValue" }],
                            },
                            {
                              component: "SelectContent",
                              children: [
                                { component: "SelectItem", props: { value: "5" }, children: ["5"] },
                                { component: "SelectItem", props: { value: "10" }, children: ["10"] },
                                { component: "SelectItem", props: { value: "20" }, children: ["20"] },
                              ],
                            },
                          ],
                        },
                      ],
                    },
                    {
                      component: "P",
                      props: { className: "text-sm text-foreground" },
                      children: [{ "$ref": "selectors:pageSummary" }],
                    },
                    {
                      component: "div",
                      props: { className: "flex items-center gap-2" },
                      children: [
                        {
                          component: "Button",
                          props: {
                            variant: "outline",
                            size: "icon-sm",
                            className: "gap-0",
                            disabled: { "$not": { "$ref": "selectors:canGoPrev" } },
                            onClick: {
                              "$action": [
                                {
                                  type: "page.store.update",
                                  path: "currentPage",
                                  payload: 1,
                                },
                              ],
                            },
                          },
                          children: [
                            { component: "ChevronLeftIcon", props: { className: "size-3" } },
                            { component: "ChevronLeftIcon", props: { className: "-ml-1 size-3" } },
                          ],
                        },
                        {
                          component: "Button",
                          props: {
                            variant: "outline",
                            size: "icon-sm",
                            disabled: { "$not": { "$ref": "selectors:canGoPrev" } },
                            onClick: {
                              "$action": [
                                {
                                  "$if": {
                                    cond: { "$ref": "selectors:canGoPrev" },
                                    then: [
                                      {
                                        type: "page.store.update",
                                        path: "currentPage",
                                        payload: {
                                          "$sub": [{ "$ref": "page.store:currentPage" }, 1],
                                        },
                                      },
                                    ],
                                    else: [],
                                  },
                                },
                              ],
                            },
                          },
                          children: [{ component: "ChevronLeftIcon" }],
                        },
                        {
                          component: "Button",
                          props: {
                            variant: "outline",
                            size: "icon-sm",
                            disabled: { "$not": { "$ref": "selectors:canGoNext" } },
                            onClick: {
                              "$action": [
                                {
                                  "$if": {
                                    cond: { "$ref": "selectors:canGoNext" },
                                    then: [
                                      {
                                        type: "page.store.update",
                                        path: "currentPage",
                                        payload: {
                                          "$add": [{ "$ref": "page.store:currentPage" }, 1],
                                        },
                                      },
                                    ],
                                    else: [],
                                  },
                                },
                              ],
                            },
                          },
                          children: [{ component: "ChevronRightIcon" }],
                        },
                        {
                          component: "Button",
                          props: {
                            variant: "outline",
                            size: "icon-sm",
                            className: "gap-0",
                            disabled: { "$not": { "$ref": "selectors:canGoNext" } },
                            onClick: {
                              "$action": [
                                {
                                  type: "page.store.update",
                                  path: "currentPage",
                                  payload: { "$ref": "selectors:totalPages" },
                                },
                              ],
                            },
                          },
                          children: [
                            { component: "ChevronRightIcon", props: { className: "size-3" } },
                            { component: "ChevronRightIcon", props: { className: "-ml-1 size-3" } },
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

