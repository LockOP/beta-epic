import type { RefConfigs } from "@beta-epic/ui";

export const preview4RefConfigs: RefConfigs = {
  // ── Metric KPI card ───────────────────────────────────────────────────────
  metricCard: {
    component: "Card",
    props: { className: "h-[198px] rounded-xl shadow-sm" },
    children: [
      {
        component: "CardContent",
        props: { className: "flex h-full flex-col gap-6 px-6 py-6" },
        children: [
          {
            component: "div",
            props: { className: "flex items-start justify-between gap-3" },
            children: [
              {
                component: "Muted",
                props: { className: "text-sm" },
                children: [{ "$ref": "var:item.label" }],
              },
              {
                component: "Badge",
                props: {
                  variant: "outline",
                  className: "gap-1 rounded-md px-2 py-0.5 text-xs font-semibold",
                },
                children: [
                  {
                    "$if": {
                      cond: { "$eq": { a: { "$ref": "var:item.trendDirection" }, b: "up" } },
                      then: { component: "ChevronUpIcon",   props: { className: "size-3" } },
                      else: { component: "ChevronDownIcon", props: { className: "size-3" } },
                    },
                  },
                  { "$ref": "var:item.trend" },
                ],
              },
            ],
          },
          {
            component: "H2",
            props: { className: "text-3xl font-semibold tracking-tight" },
            children: [{ "$ref": "var:item.value" }],
          },
          {
            component: "div",
            props: { className: "mt-auto flex flex-col gap-1.5" },
            children: [
              {
                component: "div",
                props: { className: "flex items-center justify-between gap-2" },
                children: [
                  {
                    component: "Large",
                    props: { className: "text-sm font-medium" },
                    children: [{ "$ref": "var:item.summary" }],
                  },
                  {
                    "$if": {
                      cond: { "$eq": { a: { "$ref": "var:item.trendDirection" }, b: "up" } },
                      then: { component: "ChevronUpIcon",   props: { className: "size-4" } },
                      else: { component: "ChevronDownIcon", props: { className: "size-4" } },
                    },
                  },
                ],
              },
              {
                component: "Muted",
                props: { className: "truncate text-sm" },
                children: [{ "$ref": "var:item.caption" }],
              },
            ],
          },
        ],
      },
    ],
  },

  // ── Table row ─────────────────────────────────────────────────────────────
  outlineRow: {
    component: "TableRow",
    props: { className: "h-[53px]" },
    children: [
      {
        component: "TableCell",
        props: { className: "w-11 text-center" },
        children: [
          { component: "MoreHorizontalIcon", props: { className: "size-3 text-muted-foreground" } },
        ],
      },
      {
        component: "TableCell",
        props: { className: "w-6" },
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
                            as: "sid",
                            where: { "$neq": { a: { "$ref": "var:sid" }, b: { "$ref": "var:row.id" } } },
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
        props: { className: "w-[317px] text-sm font-medium" },
        children: [{ "$ref": "var:row.title" }],
      },
      {
        component: "TableCell",
        props: { className: "w-[149px]" },
        children: [
          {
            component: "Badge",
            props: { variant: "outline", className: "rounded-md px-2 py-0.5 text-xs font-medium" },
            children: [{ "$ref": "var:row.sectionType" }],
          },
        ],
      },
      {
        component: "TableCell",
        props: { className: "w-[108px]" },
        children: [
          {
            component: "Badge",
            props: {
              variant: "outline",
              className: {
                "$if": {
                  cond: { "$eq": { a: { "$ref": "var:row.status" }, b: "Done" } },
                  then: "gap-1 rounded-md border-green-200 bg-green-50 px-2 py-0.5 text-xs font-medium text-green-700 dark:border-green-800 dark:bg-green-950/30 dark:text-green-400",
                  else: "gap-1 rounded-md px-2 py-0.5 text-xs font-medium",
                },
              },
            },
            children: [
              {
                "$if": {
                  cond: { "$eq": { a: { "$ref": "var:row.status" }, b: "Done" } },
                  then: { component: "CircleCheckIcon", props: { className: "size-3" } },
                  else: { component: "Loader2Icon",     props: { className: "size-3" } },
                },
              },
              { "$ref": "var:row.status" },
            ],
          },
        ],
      },
      {
        component: "TableCell",
        props: { className: "w-[83px]" },
        children: [{ "$string": { "$ref": "var:row.target" } }],
      },
      {
        component: "TableCell",
        props: { className: "w-[83px]" },
        children: [{ "$string": { "$ref": "var:row.limit" } }],
      },
      {
        component: "TableCell",
        props: { className: "w-[173px]" },
        children: [
          {
            "$if": {
              cond: { "$ref": "var:row.needsReviewer" },
              then: {
                component: "Button",
                props: {
                  variant: "outline",
                  className: "h-9 w-[140px] justify-between px-3 text-sm",
                  onClick: {
                    "$action": [
                      {
                        type: "snackbar",
                        message: { "$concat": ["Assign reviewer for: ", { "$ref": "var:row.title" }] },
                        variant: "info",
                      },
                    ],
                  },
                },
                children: [
                  { "$ref": "var:row.reviewer" },
                  { component: "ChevronDownIcon", props: { className: "size-4" } },
                ],
              },
              else: { "$ref": "var:row.reviewer" },
            },
          },
        ],
      },
      {
        component: "TableCell",
        props: { className: "w-[50px] text-right" },
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
                    message: { "$concat": ["Opened menu for: ", { "$ref": "var:row.title" }] },
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
