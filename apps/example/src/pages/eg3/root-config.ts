import type { ComponentNode } from "@beta-epic/ui";

export const eg3RootConfig: ComponentNode = {
  component: "ItemGroup",
  props: {
    className:
      "flex min-h-[calc(100vh-4rem)] items-center justify-center px-6 py-10",
  },
  children: [
    {
      component: "Muted",
      children: ["eg3 empty page"],
    },
  ],
};
