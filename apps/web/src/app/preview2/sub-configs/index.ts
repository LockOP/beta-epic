import type { RefConfigs } from "@beta-epic/ui";

export const preview2RefConfigs: RefConfigs = {
  preview2Row: {
    component: "TableRow",
    props: {
      className: "h-11 data-[state=selected]:bg-muted/70",
      "data-state": {
        "$if": {
          cond: {
            "$in": {
              value: { "$ref": "var:row.id" },
              array: { "$ref": "page.store:selectedRowIds" },
            },
          },
          then: "selected",
          else: null,
        },
      },
    },
    children: [
      {
        component: "TableCell",
        props: { className: "w-8" },
        children: [
          {
            component: "Checkbox",
            props: {
              checked: {
                "$in": {
                  value: { "$ref": "var:row.id" },
                  array: { "$ref": "page.store:selectedRowIds" },
                },
              },
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
                            "$append": {
                              to: { "$ref": "page.store:selectedRowIds" },
                              item: { "$ref": "var:row.id" },
                            },
                          },
                        },
                        else: {
                          "$filter": {
                            over: { "$ref": "page.store:selectedRowIds" },
                            as: "selectedId",
                            where: {
                              "$neq": {
                                a: { "$ref": "var:selectedId" },
                                b: { "$ref": "var:row.id" },
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
        component: "TableCell",
        props: { className: "w-[206px]" },
        children: [
          {
            component: "div",
            props: { className: "flex items-center gap-2" },
            children: [
              {
                component: "Avatar",
                props: { size: "sm" },
                children: [
                  {
                    component: "AvatarFallback",
                    children: [{ "$ref": "var:row.initials" }],
                  },
                ],
              },
              {
                component: "P",
                props: { className: "text-sm text-foreground" },
                children: [{ "$ref": "var:row.name" }],
              },
            ],
          },
        ],
      },
      {
        component: "TableCell",
        props: { className: "w-[206px]" },
        children: [{ "$ref": "var:row.detailOne" }],
      },
      {
        component: "TableCell",
        props: { className: "w-[206px]" },
        children: [{ "$ref": "var:row.detailTwo" }],
      },
      {
        component: "TableCell",
        props: { className: "w-[206px]" },
        children: [{ "$ref": "var:row.detailThree" }],
      },
      {
        component: "TableCell",
        props: { className: "w-[84px]" },
        children: [
          {
            component: "Button",
            props: {
              variant: "ghost",
              size: "sm",
              className: "h-8 px-3 font-medium",
              onClick: {
                "$action": [
                  {
                    type: "snackbar",
                    message: {
                      "$concat": ["Edit ", { "$ref": "var:row.name" }],
                    },
                    variant: "info",
                  },
                ],
              },
            },
            children: ["Edit"],
          },
        ],
      },
      {
        component: "TableCell",
        props: { className: "w-[56px] text-right" },
        children: [
          {
            component: "Button",
            props: {
              variant: "ghost",
              size: "icon-sm",
              className: "h-8 w-8",
              onClick: {
                "$action": [
                  {
                    type: "snackbar",
                    message: {
                      "$concat": ["More actions for ", { "$ref": "var:row.name" }],
                    },
                    variant: "info",
                  },
                ],
              },
            },
            children: [{ component: "MoreHorizontalIcon" }],
          },
        ],
      },
    ],
  },
};

