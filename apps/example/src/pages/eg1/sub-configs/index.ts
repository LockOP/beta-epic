import type { RefConfigs } from "@beta-epic/ui";

export const eg1RefConfigs: RefConfigs = {
  topNavItem: {
    component: "Button",
    props: {
      variant: {
        $if: {
          cond: {
            $eq: {
              a: { $ref: "page.store:adminSection" },
              b: { $ref: "var:item.id" },
            },
          },
          then: "secondary",
          else: "ghost",
        },
      },
      className: {
        $if: {
          cond: {
            $eq: {
              a: { $ref: "page.store:adminSection" },
              b: { $ref: "var:item.id" },
            },
          },
          then: "h-9 px-3 shadow-none",
          else: "h-9 border-0 px-3 text-muted-foreground shadow-none",
        },
      },
      onClick: {
        $action: [
          {
            type: "page.store.update",
            path: "adminSection",
            payload: { $ref: "var:item.id" },
          },
        ],
      },
    },
    children: [{ $ref: "var:item.label" }],
  },
  recordRow: {
    component: "TableRow",
    props: {
      className: {
        $if: {
          cond: {
            $in: {
              value: { $ref: "var:record.id" },
              array: { $ref: "page.store:selectedRecordIds" },
            },
          },
          then: "bg-muted/40",
          else: "",
        },
      },
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
                $in: {
                  value: { $ref: "var:record.id" },
                  array: { $ref: "page.store:selectedRecordIds" },
                },
              },
              "aria-label": { $concat: ["Select ", { $ref: "var:record.label" }] },
              onCheckedChange: {
                $action: [
                  {
                    type: "page.store.update",
                    path: "selectedRecordIds",
                    payload: {
                      $if: {
                        cond: {
                          $in: {
                            value: { $ref: "var:record.id" },
                            array: { $ref: "page.store:selectedRecordIds" },
                          },
                        },
                        then: {
                          $filter: {
                            over: { $ref: "page.store:selectedRecordIds" },
                            as: "selectedId",
                            where: {
                              $neq: {
                                a: { $ref: "var:selectedId" },
                                b: { $ref: "var:record.id" },
                              },
                            },
                          },
                        },
                        else: {
                          $append: {
                            to: { $ref: "page.store:selectedRecordIds" },
                            item: { $ref: "var:record.id" },
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
        props: { className: "w-[220px]" },
        children: [
          {
            component: "div",
            props: { className: "flex items-center gap-3" },
            children: [
              {
                component: "Avatar",
                props: { size: "sm" },
                children: [{ component: "AvatarFallback", children: [{ $ref: "var:record.initials" }] }],
              },
              {
                component: "span",
                props: { className: "font-medium text-foreground" },
                children: [{ $ref: "var:record.label" }],
              },
            ],
          },
        ],
      },
      {
        component: "TableCell",
        props: { className: "min-w-[320px]" },
        children: [{ $ref: "var:record.sublabel" }],
      },
      {
        component: "TableCell",
        props: { className: "w-[180px] text-right" },
        children: [{ $ref: "var:record.metaOne" }],
      },
      {
        component: "TableCell",
        props: { className: "w-[180px] text-right" },
        children: [{ $ref: "var:record.metaTwo" }],
      },
      {
        component: "TableCell",
        props: { className: "w-[96px]" },
        children: [
          {
            component: "Button",
            props: {
              variant: "ghost",
              size: "sm",
              className: "h-8 border-0 px-2 font-semibold shadow-none",
              onClick: {
                $action: [
                  {
                    type: "snackbar",
                    message: { $concat: ["Editing ", { $ref: "var:record.label" }] },
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
              className: "ml-auto border-0 shadow-none",
              "aria-label": { $concat: ["More actions for ", { $ref: "var:record.label" }] },
              onClick: {
                $action: [
                  {
                    type: "snackbar",
                    message: { $concat: ["More actions for ", { $ref: "var:record.label" }] },
                    variant: "info",
                  },
                ],
              },
            },
            children: [{ component: "ChevronDownIcon" }],
          },
        ],
      },
    ],
  },
};
