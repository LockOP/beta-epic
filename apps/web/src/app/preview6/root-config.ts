import type { ComponentNode } from "@beta-epic/ui";

export const preview6RootConfig: ComponentNode = {
  component: "div",
  props: { className: "h-full w-full p-6" },
  children: [
    {
      component: "div",
      props: { className: "mx-auto flex h-full max-w-3xl flex-col justify-center" },
      children: [
        {
          component: "Card",
          props: { shadow: true },
          children: [
            {
              component: "CardHeader",
              children: [
                { component: "CardTitle", children: ["Open Library Explorer"] },
                {
                  component: "CardDescription",
                  children: [
                    "Pick a genre (subject) to browse, or search across Open Library.",
                  ],
                },
              ],
            },
            {
              component: "CardContent",
              children: [
                {
                  component: "div",
                  props: { className: "flex flex-col gap-4" },
                  children: [
                    {
                      component: "div",
                      props: { className: "grid gap-3 sm:grid-cols-2" },
                      children: [
                        {
                          component: "div",
                          props: { className: "flex flex-col gap-1.5" },
                          children: [
                            {
                              component: "Label",
                              props: { className: "text-xs text-muted-foreground" },
                              children: ["Genre (subject)"],
                            },
                            {
                              component: "Select",
                              props: {
                                value: { "$ref": "page.store:subject" },
                                onValueChange: {
                                  $action: [
                                    {
                                      type: "page.store.update",
                                      path: "subject",
                                      payload: { "$arg": 0 },
                                    },
                                  ],
                                },
                              },
                              children: [
                                {
                                  component: "SelectTrigger",
                                  props: { className: "w-full", size: "default" },
                                  children: [
                                    { component: "SelectValue", props: { placeholder: "Select a genre" } },
                                  ],
                                },
                                {
                                  component: "SelectContent",
                                  children: [
                                    {
                                      component: "SelectGroup",
                                      children: [
                                        { component: "SelectLabel", children: ["Popular genres"] },
                                        { component: "SelectItem", props: { value: "fantasy" }, children: ["Fantasy"] },
                                        { component: "SelectItem", props: { value: "science_fiction" }, children: ["Science fiction"] },
                                        { component: "SelectItem", props: { value: "mystery" }, children: ["Mystery"] },
                                        { component: "SelectItem", props: { value: "romance" }, children: ["Romance"] },
                                        { component: "SelectItem", props: { value: "horror" }, children: ["Horror"] },
                                        { component: "SelectItem", props: { value: "history" }, children: ["History"] },
                                        { component: "SelectItem", props: { value: "biography" }, children: ["Biography"] },
                                        { component: "SelectItem", props: { value: "poetry" }, children: ["Poetry"] },
                                        { component: "SelectItem", props: { value: "children" }, children: ["Children"] },
                                      ],
                                    },
                                  ],
                                },
                              ],
                            },
                          ],
                        },
                        {
                          component: "div",
                          props: { className: "flex flex-col gap-1.5" },
                          children: [
                            {
                              component: "Label",
                              props: { className: "text-xs text-muted-foreground" },
                              children: ["Search"],
                            },
                            {
                              component: "Input",
                              props: {
                                placeholder: "Title, author, keyword…",
                                value: { "$ref": "page.store:query" },
                                onChange: {
                                  $action: [
                                    {
                                      type: "page.store.update",
                                      path: "query",
                                      payload: { "$arg": 0, path: "currentTarget.value" },
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
                      component: "div",
                      props: { className: "flex flex-wrap items-center gap-2" },
                      children: [
                        {
                          component: "Button",
                          props: {
                            variant: "outline",
                            size: "sm",
                            onClick: {
                              $action: [
                                {
                                  type: "window.open",
                                  url: {
                                    "$concat": [
                                      "/preview5?mode=subject&subject=",
                                      { "$ref": "page.store:subject" },
                                    ],
                                  },
                                  target: "_self",
                                },
                              ],
                            },
                          },
                          children: ["Browse genre"],
                        },
                        {
                          component: "Button",
                          props: {
                            size: "sm",
                            onClick: {
                              $action: [
                                {
                                  $if: {
                                    cond: {
                                      "$gt": {
                                        a: { "$length": { "$trim": { "$ref": "page.store:query" } } },
                                        b: 0,
                                      },
                                    },
                                    then: [
                                      {
                                        type: "window.open",
                                        url: {
                                          "$concat": [
                                            "/preview5?mode=search&subject=",
                                            { "$ref": "page.store:subject" },
                                            "&q=",
                                            {
                                              "$replace": {
                                                value: { "$trim": { "$ref": "page.store:query" } },
                                                from: " ",
                                                to: "%20",
                                              },
                                            },
                                          ],
                                        },
                                        target: "_self",
                                      },
                                    ],
                                    else: [
                                      {
                                        type: "snackbar",
                                        message: "Enter a search query first.",
                                        variant: "warning",
                                      },
                                    ],
                                  },
                                },
                              ],
                            },
                          },
                          children: ["Search books"],
                        },
                        {
                          component: "Button",
                          props: {
                            variant: "ghost",
                            size: "sm",
                            onClick: {
                              $action: [
                                {
                                  type: "window.open",
                                  url: "https://openlibrary.org/swagger/docs",
                                  target: "_blank",
                                },
                              ],
                            },
                          },
                          children: ["API docs"],
                        },
                      ],
                    },
                    {
                      component: "Separator",
                    },
                    {
                      component: "div",
                      props: { className: "flex flex-col gap-2" },
                      children: [
                        {
                          component: "div",
                          props: { className: "text-xs font-medium text-muted-foreground" },
                          children: ["Quick genres"],
                        },
                        {
                          component: "div",
                          props: { className: "flex flex-wrap gap-2" },
                          children: [
                            {
                              component: "Button",
                              props: {
                                variant: "secondary",
                                size: "xs",
                                onClick: { $action: [{ type: "window.open", url: "/preview5?mode=subject&subject=fantasy", target: "_self" }] },
                              },
                              children: ["Fantasy"],
                            },
                            {
                              component: "Button",
                              props: {
                                variant: "secondary",
                                size: "xs",
                                onClick: { $action: [{ type: "window.open", url: "/preview5?mode=subject&subject=science_fiction", target: "_self" }] },
                              },
                              children: ["Science fiction"],
                            },
                            {
                              component: "Button",
                              props: {
                                variant: "secondary",
                                size: "xs",
                                onClick: { $action: [{ type: "window.open", url: "/preview5?mode=subject&subject=mystery", target: "_self" }] },
                              },
                              children: ["Mystery"],
                            },
                            {
                              component: "Button",
                              props: {
                                variant: "secondary",
                                size: "xs",
                                onClick: { $action: [{ type: "window.open", url: "/preview5?mode=subject&subject=romance", target: "_self" }] },
                              },
                              children: ["Romance"],
                            },
                            {
                              component: "Button",
                              props: {
                                variant: "secondary",
                                size: "xs",
                                onClick: { $action: [{ type: "window.open", url: "/preview5?mode=subject&subject=history", target: "_self" }] },
                              },
                              children: ["History"],
                            },
                            {
                              component: "Button",
                              props: {
                                variant: "secondary",
                                size: "xs",
                                onClick: { $action: [{ type: "window.open", url: "/preview5?mode=subject&subject=biography", target: "_self" }] },
                              },
                              children: ["Biography"],
                            },
                            {
                              component: "Button",
                              props: {
                                variant: "secondary",
                                size: "xs",
                                onClick: { $action: [{ type: "window.open", url: "/preview5?mode=subject&subject=poetry", target: "_self" }] },
                              },
                              children: ["Poetry"],
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
    },
  ],
};

