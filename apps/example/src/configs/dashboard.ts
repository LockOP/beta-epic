import type { ComponentNode, RefConfigs } from "@beta-epic/ui";

export const dashboardInitialState = {
  query: "",
  transactions: [
    { customer: "Alice Johnson", status: "paid", date: "Mar 03, 2026", amount: 1250 },
    { customer: "Bob Martinez", status: "pending", date: "Mar 02, 2026", amount: 890 },
    { customer: "Carol White", status: "paid", date: "Mar 01, 2026", amount: 3400 },
    { customer: "David Kim", status: "failed", date: "Feb 28, 2026", amount: 560 },
    { customer: "Eva Brown", status: "paid", date: "Feb 27, 2026", amount: 2100 },
  ],
} as const;

export const dashboardRefConfigs: RefConfigs = {
  statCard: {
    component: "Card",
    props: { size: "sm" },
    children: [
      {
        component: "CardHeader",
        props: { className: "gap-1" },
        children: [
          {
            component: "CardDescription",
            children: [{ $ref: "var:label" }],
          },
          {
            component: "CardTitle",
            props: { className: "text-3xl" },
            children: [{ $ref: "var:value" }],
          },
        ],
      },
      {
        component: "CardContent",
        children: [
          {
            component: "Muted",
            props: { className: "mt-0" },
            children: [{ $ref: "var:meta" }],
          },
        ],
      },
    ],
  },
};

export const dashboardConfig: ComponentNode = {
  component: "ItemGroup",
  props: { className: "mx-auto max-w-6xl gap-8 px-4 py-10" },
  selectors: {
    filteredTransactions: {
      $filter: {
        over: { $ref: "page.store:transactions" },
        as: "tx",
        where: {
          $contains: {
            value: { $ref: "var:tx.customer" },
            search: { $ref: "page.store:query" },
          },
        },
      },
    },
    visibleCount: { $count: { $ref: "selectors:filteredTransactions" } },
    paidCount: {
      $count: {
        $filter: {
          over: { $ref: "page.store:transactions" },
          as: "tx",
          where: { $eq: { a: { $ref: "var:tx.status" }, b: "paid" } },
        },
      },
    },
    pendingCount: {
      $count: {
        $filter: {
          over: { $ref: "page.store:transactions" },
          as: "tx",
          where: { $eq: { a: { $ref: "var:tx.status" }, b: "pending" } },
        },
      },
    },
    summaryLabel: {
      $pipe: [
        { $ref: "selectors:visibleCount" },
        { $string: { $ref: "var:$$" } },
        { $concat: [{ $ref: "var:$$" }, " transactions visible"] },
      ],
    },
  },
  children: [
    {
      component: "ItemGroup",
      props: { className: "gap-3" },
      children: [
        {
          component: "Badge",
          props: {
            variant: "outline",
          },
          children: [
            {
              $if: {
                cond: { $ref: "refs:isMobile" },
                then: "Mobile viewport",
                else: "Desktop viewport",
              },
            },
          ],
        },
        { component: "H1", children: ["Dashboard Demo"] },
        {
          component: "Muted",
          props: { className: "max-w-3xl" },
          children: [
            "This route stays in pure config: selectors, the built-in ",
            { component: "InlineCode", children: ["isMobile"] },
            " hook ref, page-store updates, navigation, and ",
            { component: "InlineCode", children: ["$subConfig"] },
            " reuse.",
          ],
        },
      ],
    },
    {
      component: "ItemGroup",
      props: { className: "grid gap-4 sm:grid-cols-2 xl:grid-cols-4" },
      children: [
        {
          $subConfig: "statCard",
          subConfigProps: {
            label: "Visible transactions",
            value: { $ref: "selectors:visibleCount" },
            meta: { $ref: "selectors:summaryLabel" },
          },
        },
        {
          $subConfig: "statCard",
          subConfigProps: {
            label: "Paid",
            value: { $ref: "selectors:paidCount" },
            meta: "Transactions with successful payment",
          },
        },
        {
          $subConfig: "statCard",
          subConfigProps: {
            label: "Pending",
            value: { $ref: "selectors:pendingCount" },
            meta: "Still waiting for settlement",
          },
        },
        {
          $subConfig: "statCard",
          subConfigProps: {
            label: "Viewport",
            value: {
              $if: {
                cond: { $ref: "refs:isMobile" },
                then: "Mobile",
                else: "Desktop",
              },
            },
            meta: "Pulled directly from the built-in hook registry",
          },
        },
      ],
    },
    {
      component: "Card",
      children: [
        {
          component: "CardHeader",
          children: [
            { component: "CardTitle", children: ["Filter transactions"] },
            {
              component: "CardDescription",
              children: [
                "The input writes straight into page-local state using ",
                { component: "InlineCode", children: ["$arg"] },
                ".",
              ],
            },
          ],
        },
        {
          component: "CardContent",
          props: { className: "space-y-3" },
          children: [
            {
              component: "Input",
              props: {
                value: { $ref: "page.store:query" },
                placeholder: "Search by customer name",
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
            {
              component: "Muted",
              props: { className: "mt-0" },
              children: [{ $ref: "selectors:summaryLabel" }],
            },
          ],
        },
      ],
    },
    {
      component: "Card",
      children: [
        {
          component: "CardHeader",
          children: [
            { component: "CardTitle", children: ["Recent transactions"] },
            {
              component: "CardDescription",
              children: [
                "Rendered with built-in table primitives only.",
              ],
            },
          ],
        },
        {
          component: "CardContent",
          children: [
            {
              $if: {
                cond: { $gt: { a: { $ref: "selectors:visibleCount" }, b: 0 } },
                then: {
                  component: "Table",
                  children: [
                    {
                      component: "TableHeader",
                      children: [
                        {
                          component: "TableRow",
                          children: [
                            { component: "TableHead", children: ["Customer"] },
                            { component: "TableHead", children: ["Status"] },
                            { component: "TableHead", children: ["Date"] },
                            {
                              component: "TableHead",
                              props: { className: "text-right" },
                              children: ["Amount"],
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
                            over: { $ref: "selectors:filteredTransactions" },
                            as: "tx",
                            return: {
                              component: "TableRow",
                              children: [
                                {
                                  component: "TableCell",
                                  children: [{ $ref: "var:tx.customer" }],
                                },
                                {
                                  component: "TableCell",
                                  children: [
                                    {
                                      component: "Badge",
                                      props: {
                                        variant: {
                                          $switch: {
                                            value: { $ref: "var:tx.status" },
                                            cases: {
                                              paid: "default",
                                              pending: "secondary",
                                              failed: "destructive",
                                            },
                                            default: "outline",
                                          },
                                        },
                                      },
                                      children: [{ $ref: "var:tx.status" }],
                                    },
                                  ],
                                },
                                {
                                  component: "TableCell",
                                  children: [{ $ref: "var:tx.date" }],
                                },
                                {
                                  component: "TableCell",
                                  props: { className: "text-right font-medium" },
                                  children: [
                                    {
                                      $concat: [
                                        "$",
                                        { $string: { $ref: "var:tx.amount" } },
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
                else: {
                  component: "Empty",
                  props: { className: "border-muted-foreground/20" },
                  children: [
                    {
                      component: "EmptyHeader",
                      children: [
                        {
                          component: "EmptyTitle",
                          children: ["No matching transactions"],
                        },
                        {
                          component: "EmptyDescription",
                          children: [
                            "Adjust the query above to show the seeded records again.",
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
    {
      component: "ItemFooter",
      props: { className: "justify-end" },
      children: [
        {
          component: "Button",
          props: {
            variant: "outline",
            onClick: {
              $action: [{ type: "navigate", to: "/form" }],
            },
          },
          children: ["Open form demo"],
        },
      ],
    },
  ],
};
