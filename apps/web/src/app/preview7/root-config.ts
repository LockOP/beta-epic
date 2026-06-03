import type { ComponentNode } from "@beta-epic/ui";

export const preview7RootConfig: ComponentNode = {
  component: "div",
  props: { className: "h-full w-full flex items-center justify-center p-8" },
  children: [
    {
      component: "Card",
      children: [
        {
          component: "CardContent",
          children: ["Studio preview route — empty config (preview7)"],
        },
      ],
    },
  ],
};

