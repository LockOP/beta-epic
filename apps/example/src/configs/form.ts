import type { ComponentNode } from "@beta-epic/ui";

export const formInitialState = {
  profile: {
    name: "Ava Johnson",
    email: "ava@example.com",
    bio: "I work on onboarding flows and dashboard UX.",
  },
  notifications: {
    productUpdates: true,
    weeklyDigest: false,
  },
  saving: false,
  saved: false,
  savedAt: null as string | null,
  error: null as string | null,
};

export const formConfig: ComponentNode = {
  component: "ItemGroup",
  props: { className: "mx-auto max-w-3xl gap-8 px-4 py-10" },
  children: [
    {
      component: "ItemGroup",
      props: { className: "gap-3" },
      children: [
        { component: "H1", children: ["Account Settings Demo"] },
        {
          component: "Muted",
          children: [
            "This route keeps everything inside the DSL: validation selectors, direct ",
            { component: "InlineCode", children: ["$arg"] },
            " reads from native inputs, async persistence, and built-in navigation and toast actions.",
          ],
        },
        {
          component: "Card",
          selectors: {
            nameValid: {
              $gt: {
                a: { $length: { $trim: { $ref: "page.store:profile.name" } } },
                b: 1,
              },
            },
            emailValid: {
              $and: [
                { $contains: { value: { $ref: "page.store:profile.email" }, search: "@" } },
                { $contains: { value: { $ref: "page.store:profile.email" }, search: "." } },
              ],
            },
            bioValid: {
              $gt: {
                a: { $length: { $trim: { $ref: "page.store:profile.bio" } } },
                b: 15,
              },
            },
            canSave: {
              $and: [
                { $ref: "selectors:nameValid" },
                { $ref: "selectors:emailValid" },
                { $ref: "selectors:bioValid" },
                { $not: { $ref: "page.store:saving" } },
              ],
            },
            saveMessage: {
              $if: {
                cond: { $ref: "page.store:saved" },
                then: {
                  $concat: [
                    "Saved at ",
                    {
                      $nullish: {
                        value: { $ref: "page.store:savedAt" },
                        default: "just now",
                      },
                    },
                  ],
                },
                else: "Update a field and save to trigger async.call.",
              },
            },
          },
          children: [
            {
              component: "CardHeader",
              children: [
                { component: "CardTitle", children: ["Profile"] },
                {
                  component: "CardDescription",
                  children: [
                    "These fields are powered by page-local state with only default registered UI components.",
                  ],
                },
              ],
            },
            {
              component: "CardContent",
              props: { className: "space-y-6" },
              children: [
                {
                  component: "Field",
                  props: { "data-invalid": { $not: { $ref: "selectors:nameValid" } } },
                  children: [
                    { component: "FieldLabel", children: ["Full name"] },
                    {
                      component: "Input",
                      props: {
                        value: { $ref: "page.store:profile.name" },
                        onChange: {
                          $action: [
                            {
                              type: "page.store.update",
                              path: "profile.name",
                              payload: { $arg: 0, path: "currentTarget.value" },
                            },
                            { type: "page.store.update", path: "saved", payload: false },
                          ],
                        },
                      },
                    },
                    {
                      $if: {
                        cond: { $not: { $ref: "selectors:nameValid" } },
                        then: {
                          component: "FieldError",
                          children: ["Please enter at least 2 characters."],
                        },
                        else: null,
                      },
                    },
                  ],
                },
                {
                  component: "Field",
                  props: { "data-invalid": { $not: { $ref: "selectors:emailValid" } } },
                  children: [
                    { component: "FieldLabel", children: ["Email"] },
                    {
                      component: "Input",
                      props: {
                        type: "email",
                        value: { $ref: "page.store:profile.email" },
                        onChange: {
                          $action: [
                            {
                              type: "page.store.update",
                              path: "profile.email",
                              payload: { $arg: 0, path: "currentTarget.value" },
                            },
                            { type: "page.store.update", path: "saved", payload: false },
                          ],
                        },
                      },
                    },
                    {
                      $if: {
                        cond: { $not: { $ref: "selectors:emailValid" } },
                        then: {
                          component: "FieldError",
                          children: ["Use a valid email address."],
                        },
                        else: null,
                      },
                    },
                  ],
                },
                {
                  component: "Field",
                  props: { "data-invalid": { $not: { $ref: "selectors:bioValid" } } },
                  children: [
                    { component: "FieldLabel", children: ["Bio"] },
                    {
                      component: "FieldDescription",
                      children: [
                        "Keep it descriptive so the validation selector has enough content.",
                      ],
                    },
                    {
                      component: "Textarea",
                      props: {
                        rows: 4,
                        value: { $ref: "page.store:profile.bio" },
                        onChange: {
                          $action: [
                            {
                              type: "page.store.update",
                              path: "profile.bio",
                              payload: { $arg: 0, path: "currentTarget.value" },
                            },
                            { type: "page.store.update", path: "saved", payload: false },
                          ],
                        },
                      },
                    },
                    {
                      $if: {
                        cond: { $not: { $ref: "selectors:bioValid" } },
                        then: {
                          component: "FieldError",
                          children: ["Please enter at least 16 characters."],
                        },
                        else: null,
                      },
                    },
                  ],
                },
                {
                  component: "FieldSeparator",
                  children: ["Notifications"],
                },
                {
                  component: "Field",
                  props: { orientation: "horizontal" },
                  children: [
                    {
                      component: "FieldContent",
                      children: [
                        { component: "FieldTitle", children: ["Product updates"] },
                        {
                          component: "FieldDescription",
                          children: [
                            "Receive feature release notes and roadmap announcements.",
                          ],
                        },
                      ],
                    },
                    {
                      component: "Switch",
                      props: {
                        checked: { $ref: "page.store:notifications.productUpdates" },
                        onCheckedChange: {
                          $action: [
                            {
                              type: "page.store.update",
                              path: "notifications.productUpdates",
                              payload: { $arg: 0 },
                            },
                            { type: "page.store.update", path: "saved", payload: false },
                          ],
                        },
                      },
                    },
                  ],
                },
                {
                  component: "Field",
                  props: { orientation: "horizontal" },
                  children: [
                    {
                      component: "FieldContent",
                      children: [
                        { component: "FieldTitle", children: ["Weekly digest"] },
                        {
                          component: "FieldDescription",
                          children: ["Receive one summary email every Friday."],
                        },
                      ],
                    },
                    {
                      component: "Switch",
                      props: {
                        checked: { $ref: "page.store:notifications.weeklyDigest" },
                        onCheckedChange: {
                          $action: [
                            {
                              type: "page.store.update",
                              path: "notifications.weeklyDigest",
                              payload: { $arg: 0 },
                            },
                            { type: "page.store.update", path: "saved", payload: false },
                          ],
                        },
                      },
                    },
                  ],
                },
              ],
            },
            {
              component: "CardFooter",
              props: { className: "justify-between gap-3" },
              children: [
                {
                  component: "P",
                  props: {
                    className: {
                      $if: {
                        cond: { $neq: { a: { $ref: "page.store:error" }, b: null } },
                        then: "mt-0 text-sm text-destructive",
                        else: "mt-0 text-sm text-muted-foreground",
                      },
                    },
                  },
                  children: [
                    {
                      $if: {
                        cond: { $neq: { a: { $ref: "page.store:error" }, b: null } },
                        then: { $ref: "page.store:error" },
                        else: { $ref: "selectors:saveMessage" },
                      },
                    },
                  ],
                },
                {
                  component: "ItemActions",
                  children: [
                    {
                      component: "Button",
                      props: {
                        variant: "outline",
                        onClick: {
                          $action: [{ type: "navigate", to: "/" }],
                        },
                      },
                      children: ["Back to dashboard"],
                    },
                    {
                      component: "Button",
                      props: {
                        disabled: { $not: { $ref: "selectors:canSave" } },
                        onClick: {
                          $action: [
                            { type: "page.store.update", path: "error", payload: null },
                            {
                              type: "async.call",
                              loading: "saving",
                              call: {
                                $fn: "saveExampleProfile",
                                args: [
                                  { $ref: "page.store:profile" },
                                  { $ref: "page.store:notifications" },
                                ],
                              },
                              onSuccess: [
                                { type: "page.store.update", path: "saved", payload: true },
                                { type: "page.store.update", path: "savedAt", payload: { $ref: "result.savedAt" } },
                                { type: "snackbar", message: "Settings saved", variant: "success" },
                              ],
                              onError: [
                                { type: "page.store.update", path: "error", payload: { $ref: "error.message" } },
                                { type: "snackbar", message: { $ref: "error.message" }, variant: "error" },
                              ],
                            },
                          ],
                        },
                      },
                      children: [
                        {
                          $if: {
                            cond: { $ref: "page.store:saving" },
                            then: "Saving...",
                            else: "Save settings",
                          },
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
