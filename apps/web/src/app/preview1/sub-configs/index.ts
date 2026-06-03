import type { RefConfigs } from "@beta-epic/ui";

export const preview1RefConfigs: RefConfigs = {
  taskRow: {
    component: "TableRow",
    props: {
      className: "h-10",
    },
    children: [
      {
        component: "TableCell",
        props: { className: "w-10" },
        children: [
          {
            component: "Checkbox",
            props: {
              checked: {
                "$in": {
                  value: { "$ref": "var:task.id" },
                  array: { "$ref": "page.store:selectedTaskIds" },
                },
              },
              onCheckedChange: {
                "$action": [
                  {
                    "$if": {
                      cond: { "$arg": 0 },
                      then: [
                        {
                          type: "page.store.update",
                          path: "selectedTaskIds",
                          payload: {
                            "$uniq": {
                              "$append": {
                                to: { "$ref": "page.store:selectedTaskIds" },
                                item: { "$ref": "var:task.id" },
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
                            "$filter": {
                              over: { "$ref": "page.store:selectedTaskIds" },
                              as: "selectedId",
                              where: {
                                "$neq": {
                                  a: { "$ref": "var:selectedId" },
                                  b: { "$ref": "var:task.id" },
                                },
                              },
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
        component: "TableCell",
        props: { className: "w-[120px]" },
        children: [{ "$ref": "var:task.id" }],
      },
      {
        component: "TableCell",
        props: { className: "min-w-0 w-full" },
        children: [
          {
            component: "div",
            props: { className: "flex min-w-0 items-center gap-2" },
            children: [
              {
                component: "Badge",
                props: {
                  variant: "outline",
                  className: "rounded-full",
                },
                children: [{ "$ref": "var:task.type" }],
              },
              {
                component: "div",
                props: {
                  className: "min-w-0 truncate text-sm font-medium text-foreground",
                },
                children: [{ "$ref": "var:task.title" }],
              },
            ],
          },
        ],
      },
      {
        component: "TableCell",
        props: { className: "w-[180px]" },
        children: [
          {
            component: "div",
            props: { className: "flex items-center gap-2 text-sm" },
            children: [
              {
                component: "div",
                props: {
                  className: "flex size-4 items-center justify-center rounded-full border border-muted-foreground/40",
                },
                children: [
                  {
                    component: "MinusIcon",
                    props: { className: "size-3 text-muted-foreground" },
                  },
                ],
              },
              { "$ref": "var:task.status" },
            ],
          },
        ],
      },
      {
        component: "TableCell",
        props: { className: "w-[180px]" },
        children: [
          {
            component: "div",
            props: { className: "flex items-center gap-2 text-sm" },
            children: [
              {
                component: "div",
                props: { className: "text-muted-foreground" },
                children: [
                  {
                    "$if": {
                      cond: {
                        "$eq": {
                          a: { "$ref": "var:task.priorityIcon" },
                          b: "up",
                        },
                      },
                      then: {
                        component: "ChevronUpIcon",
                        props: { className: "size-4" },
                      },
                      else: {
                        "$if": {
                          cond: {
                            "$eq": {
                              a: { "$ref": "var:task.priorityIcon" },
                              b: "down",
                            },
                          },
                          then: {
                            component: "ChevronDownIcon",
                            props: { className: "size-4" },
                          },
                          else: {
                            component: "ChevronRightIcon",
                            props: { className: "size-4" },
                          },
                        },
                      },
                    },
                  },
                ],
              },
              { "$ref": "var:task.priority" },
            ],
          },
        ],
      },
      {
        component: "TableCell",
        props: { className: "w-[72px] text-right" },
        children: [
          {
            component: "Button",
            props: {
              variant: "ghost",
              size: "icon-sm",
              onClick: {
                "$action": [
                  {
                    type: "snackbar",
                    message: {
                      "$concat": ["Task actions for ", { "$ref": "var:task.id" }],
                    },
                    variant: "info",
                  },
                ],
              },
            },
            children: [
              {
                component: "MoreHorizontalIcon",
              },
            ],
          },
        ],
      },
    ],
  },
};

