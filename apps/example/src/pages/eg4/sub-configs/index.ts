// @ts-nocheck
import type { ComponentNode } from "@beta-epic/ui";

const kpiCard: ComponentNode = {
  component: "Card",
  children: [
    {
      component: "CardContent",
      props: { className: "p-4" },
      children: [
        {
          component: "div",
          props: { className: "flex items-start justify-between mb-2" },
          children: [
            { component: "Muted", props: { className: "text-xs" }, children: [{ $ref: "var:label" }] },
            {
              component: "Badge",
              props: {
                variant: "outline",
                className: {
                  $fn: "cn",
                  args: [
                    "gap-0.5 text-xs",
                    {
                      $if: {
                        cond: { $ref: "var:positive" },
                        then: "text-emerald-600 border-emerald-200 bg-emerald-50 dark:bg-emerald-950/30",
                        else: "text-red-600 border-red-200 bg-red-50 dark:bg-red-950/30",
                      },
                    },
                  ],
                },
              },
              children: [
                {
                  $if: {
                    cond: { $ref: "var:positive" },
                    then: { component: "ChevronUpIcon", props: { className: "size-3" } },
                    else: { component: "ChevronDownIcon", props: { className: "size-3" } },
                  },
                },
                { $ref: "var:change" },
              ],
            },
          ],
        },
        {
          component: "Large",
          props: { className: "text-2xl font-bold tracking-tight leading-none mb-2" },
          children: [{ $ref: "var:value" }],
        },
        {
          component: "div",
          props: { className: "flex items-center gap-1 mb-0.5" },
          children: [
            {
              $if: {
                cond: { $ref: "var:positive" },
                then: { component: "ChevronUpIcon", props: { className: "size-3 text-muted-foreground" } },
                else: { component: "ChevronDownIcon", props: { className: "size-3 text-muted-foreground" } },
              },
            },
            { component: "Small", children: [{ $ref: "var:trend" }] },
          ],
        },
        { component: "Muted", props: { className: "text-xs" }, children: [{ $ref: "var:sub" }] },
      ],
    },
  ],
};

export const eg4RefConfigs = { kpiCard };
