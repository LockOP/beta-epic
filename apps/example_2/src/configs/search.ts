import type { ComponentNode } from "@beta-epic/ui";

export const searchInitialState = {
  query: "tolkien",
  page: 1,
  pageSize: 8,
  loading: false,
  error: null as string | null,
  results: [] as Array<{
    workKey: string;
    title: string;
    subtitle: string | null;
    author: string;
    year: string;
    editionCount: number;
    hasFulltext: boolean;
    coverUrl: string | null;
    openLibraryUrl: string;
  }>,
  searchMeta: {
    total: 0,
    totalPages: 1,
  },
  selectedWorkKey: null as string | null,
  detailLoading: false,
  detailError: null as string | null,
  selectedWork: null as null | {
    workKey: string;
    title: string;
    description: string;
    firstPublished: string | null;
    subjects: string[];
    openLibraryUrl: string;
  },
};

export const searchConfig: ComponentNode = {
  component: "ItemGroup",
  props: { className: "mx-auto max-w-7xl gap-8 px-4 py-10" },
  effects: [
    {
      deps: [
        { $ref: "page.store:query" },
        { $ref: "page.store:page" },
        { $ref: "page.store:pageSize" },
      ],
      debounce: 350,
      run: [
        { type: "page.store.update", path: "error", payload: null },
        {
          type: "async.call",
          loading: "loading",
          call: {
            $fn: "searchOpenLibraryBooks",
            args: [
              { $ref: "page.store:query" },
              { $ref: "page.store:page" },
              { $ref: "page.store:pageSize" },
            ],
          },
          onSuccess: [
            { type: "page.store.update", path: "results", payload: { $ref: "result.items" } },
            { type: "page.store.update", path: "page", payload: { $ref: "result.page" } },
            { type: "page.store.update", path: "searchMeta.total", payload: { $ref: "result.total" } },
            { type: "page.store.update", path: "searchMeta.totalPages", payload: { $ref: "result.totalPages" } },
            {
              type: "page.store.update",
              path: "selectedWorkKey",
              payload: {
                $nullish: {
                  value: { $ref: "result.items.0.workKey" },
                  default: null,
                },
              },
            },
          ],
          onError: [
            { type: "page.store.update", path: "error", payload: { $ref: "error.message" } },
            { type: "page.store.update", path: "results", payload: [] },
            { type: "page.store.update", path: "searchMeta.total", payload: 0 },
            { type: "page.store.update", path: "searchMeta.totalPages", payload: 1 },
            { type: "page.store.update", path: "selectedWorkKey", payload: null },
          ],
        },
      ],
    },
    {
      deps: [{ $ref: "page.store:selectedWorkKey" }],
      run: [
        {
          $if: {
            cond: { $neq: { a: { $ref: "page.store:selectedWorkKey" }, b: null } },
            then: [
              { type: "page.store.update", path: "detailError", payload: null },
              {
                type: "async.call",
                loading: "detailLoading",
                call: {
                  $fn: "fetchOpenLibraryWork",
                  args: [{ $ref: "page.store:selectedWorkKey" }],
                },
                onSuccess: [
                  { type: "page.store.update", path: "selectedWork", payload: { $ref: "result" } },
                ],
                onError: [
                  { type: "page.store.update", path: "detailError", payload: { $ref: "error.message" } },
                  { type: "page.store.update", path: "selectedWork", payload: null },
                ],
              },
            ],
            else: [
              { type: "page.store.update", path: "selectedWork", payload: null },
              { type: "page.store.update", path: "detailError", payload: null },
            ],
          },
        },
      ],
    },
  ],
  selectors: {
    hasResults: { $gt: { a: { $count: { $ref: "page.store:results" } }, b: 0 } },
    canPrev: { $gt: { a: { $ref: "page.store:page" }, b: 1 } },
    canNext: {
      $lt: {
        a: { $ref: "page.store:page" },
        b: { $ref: "page.store:searchMeta.totalPages" },
      },
    },
    pageSummary: {
      $concat: [
        "Page ",
        { $string: { $ref: "page.store:page" } },
        " of ",
        { $string: { $ref: "page.store:searchMeta.totalPages" } },
      ],
    },
    totalSummary: {
      $concat: [
        { $string: { $ref: "page.store:searchMeta.total" } },
        " results for ",
        "\"",
        { $ref: "page.store:query" },
        "\"",
      ],
    },
    selectedResult: {
      $find: {
        over: { $ref: "page.store:results" },
        as: "book",
        where: {
          $eq: {
            a: { $ref: "var:book.workKey" },
            b: { $ref: "page.store:selectedWorkKey" },
          },
        },
      },
    },
  },
  children: [
    {
      component: "ItemGroup",
      props: { className: "gap-3" },
      children: [
        { component: "H1", children: ["Open Library Search"] },
        {
          component: "Muted",
          props: { className: "max-w-4xl" },
          children: [
            "Live data from the Open Library search and works APIs. This page demonstrates config-only effects, async loading, selection state, and compact pagination.",
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
            { component: "CardTitle", children: ["Search books"] },
            {
              component: "CardDescription",
              children: [
                "Typing updates page-local state; an effect debounces and fetches the next result page.",
              ],
            },
          ],
        },
        {
          component: "CardContent",
          props: { className: "grid gap-4 md:grid-cols-[1fr_auto]" },
          children: [
            {
              component: "Input",
              props: {
                value: { $ref: "page.store:query" },
                placeholder: "Try Tolkien, Austen, mystery, or data science",
                onChange: {
                  $action: [
                    {
                      type: "page.store.update",
                      path: "query",
                      payload: { $arg: 0, path: "currentTarget.value" },
                    },
                    { type: "page.store.update", path: "page", payload: 1 },
                  ],
                },
              },
            },
            {
              component: "ItemActions",
              props: { className: "justify-start md:justify-end" },
              children: [
                {
                  component: "Badge",
                  props: {
                    variant: {
                      $if: {
                        cond: { $ref: "page.store:loading" },
                        then: "default",
                        else: "secondary",
                      },
                    },
                  },
                  children: [
                    {
                      $if: {
                        cond: { $ref: "page.store:loading" },
                        then: "Loading...",
                        else: { $ref: "selectors:pageSummary" },
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
    {
      component: "ItemGroup",
      props: { className: "grid gap-6 xl:grid-cols-[minmax(0,1.35fr)_minmax(320px,0.9fr)]" },
      children: [
        {
          component: "Card",
          children: [
            {
              component: "CardHeader",
              children: [
                { component: "CardTitle", children: ["Results"] },
                {
                  component: "CardDescription",
                  children: [
                    {
                      $if: {
                        cond: { $neq: { a: { $ref: "page.store:error" }, b: null } },
                        then: { $ref: "page.store:error" },
                        else: { $ref: "selectors:totalSummary" },
                      },
                    },
                  ],
                },
              ],
            },
            {
              component: "CardContent",
              children: [
                {
                  $if: {
                    cond: { $ref: "selectors:hasResults" },
                    then: {
                      component: "ItemGroup",
                      props: { className: "grid gap-4 md:grid-cols-2" },
                      children: [
                        {
                          $map: {
                            over: { $ref: "page.store:results" },
                            as: "book",
                            return: {
                              component: "Card",
                              props: {
                                className: {
                                  $if: {
                                    cond: {
                                      $eq: {
                                        a: { $ref: "page.store:selectedWorkKey" },
                                        b: { $ref: "var:book.workKey" },
                                      },
                                    },
                                    then: "h-full cursor-pointer border-primary ring-2 ring-primary/15 transition-colors",
                                    else: "h-full cursor-pointer transition-colors hover:bg-accent/40",
                                  },
                                },
                                onClick: {
                                  $action: [
                                    {
                                      type: "page.store.update",
                                      path: "selectedWorkKey",
                                      payload: { $ref: "var:book.workKey" },
                                    },
                                  ],
                                },
                              },
                              children: [
                                {
                                  component: "CardHeader",
                                  props: { className: "flex-row items-start gap-4 space-y-0" },
                                  children: [
                                    {
                                      component: "Avatar",
                                      props: {
                                        className: "h-24 w-16 rounded-md ring-1 ring-border after:rounded-md",
                                      },
                                      children: [
                                        {
                                          component: "AvatarImage",
                                          props: {
                                            src: { $ref: "var:book.coverUrl" },
                                            alt: { $ref: "var:book.title" },
                                            className: "rounded-md object-cover",
                                          },
                                        },
                                      ],
                                    },
                                    {
                                      component: "ItemGroup",
                                      props: { className: "min-w-0 gap-2" },
                                      children: [
                                        {
                                          component: "CardTitle",
                                          props: { className: "line-clamp-2 text-lg" },
                                          children: [{ $ref: "var:book.title" }],
                                        },
                                        {
                                          component: "CardDescription",
                                          children: [
                                            { $ref: "var:book.author" },
                                            " ",
                                            {
                                              $if: {
                                                cond: { $ref: "var:book.year" },
                                                then: "•",
                                                else: "",
                                              },
                                            },
                                            " ",
                                            { $ref: "var:book.year" },
                                          ],
                                        },
                                      ],
                                    },
                                  ],
                                },
                                {
                                  component: "CardContent",
                                  props: { className: "space-y-3" },
                                  children: [
                                    {
                                      $if: {
                                        cond: { $neq: { a: { $ref: "var:book.subtitle" }, b: null } },
                                        then: {
                                          component: "Muted",
                                          props: { className: "mt-0 line-clamp-2" },
                                          children: [{ $ref: "var:book.subtitle" }],
                                        },
                                        else: {
                                          component: "Muted",
                                          props: { className: "mt-0 line-clamp-2" },
                                          children: [
                                            "Open Library work ",
                                            {
                                              component: "InlineCode",
                                              children: [{ $ref: "var:book.workKey" }],
                                            },
                                          ],
                                        },
                                      },
                                    },
                                    {
                                      component: "ItemActions",
                                      props: { className: "flex-wrap gap-2" },
                                      children: [
                                        {
                                          component: "Badge",
                                          props: { variant: "secondary" },
                                          children: [
                                            { $string: { $ref: "var:book.editionCount" } },
                                            " editions",
                                          ],
                                        },
                                        {
                                          component: "Badge",
                                          props: {
                                            variant: {
                                              $if: {
                                                cond: { $ref: "var:book.hasFulltext" },
                                                then: "default",
                                                else: "outline",
                                              },
                                            },
                                          },
                                          children: [
                                            {
                                              $if: {
                                                cond: { $ref: "var:book.hasFulltext" },
                                                then: "Has full text",
                                                else: "Metadata only",
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
                          },
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
                              children: ["No results yet"],
                            },
                            {
                              component: "EmptyDescription",
                              children: [
                                "Try a broader keyword or wait for the current request to finish.",
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
            {
              component: "CardFooter",
              props: { className: "justify-between gap-3" },
              children: [
                {
                  component: "Muted",
                  props: { className: "mt-0" },
                  children: [{ $ref: "selectors:pageSummary" }],
                },
                {
                  component: "ItemActions",
                  children: [
                    {
                      component: "Button",
                      props: {
                        variant: "outline",
                        disabled: { $not: { $ref: "selectors:canPrev" } },
                        onClick: {
                          $action: [
                            {
                              type: "page.store.update",
                              path: "page",
                              payload: {
                                $sub: [{ $ref: "page.store:page" }, 1],
                              },
                            },
                          ],
                        },
                      },
                      children: ["Previous"],
                    },
                    {
                      component: "Button",
                      props: {
                        variant: "outline",
                        disabled: { $not: { $ref: "selectors:canNext" } },
                        onClick: {
                          $action: [
                            {
                              type: "page.store.update",
                              path: "page",
                              payload: {
                                $add: [{ $ref: "page.store:page" }, 1],
                              },
                            },
                          ],
                        },
                      },
                      children: ["Next"],
                    },
                  ],
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
                { component: "CardTitle", children: ["Selected work"] },
                {
                  component: "CardDescription",
                  children: [
                    "Selecting a result triggers a second live request to the work details endpoint.",
                  ],
                },
              ],
            },
            {
              component: "CardContent",
              props: { className: "space-y-4" },
              children: [
                {
                  $if: {
                    cond: { $ref: "page.store:detailLoading" },
                    then: {
                      component: "Muted",
                      props: { className: "mt-0" },
                      children: ["Loading work details..."],
                    },
                    else: {
                      $if: {
                        cond: { $neq: { a: { $ref: "page.store:detailError" }, b: null } },
                        then: {
                          component: "P",
                          props: { className: "mt-0 text-sm text-destructive" },
                          children: [{ $ref: "page.store:detailError" }],
                        },
                        else: {
                          $if: {
                            cond: { $neq: { a: { $ref: "page.store:selectedWork" }, b: null } },
                            then: {
                              component: "ItemGroup",
                              props: { className: "gap-4" },
                              children: [
                                {
                                  component: "ItemGroup",
                                  props: { className: "gap-4 md:flex md:flex-row md:items-start" },
                                  children: [
                                    {
                                      component: "Avatar",
                                      props: {
                                        className: "h-40 w-28 rounded-md ring-1 ring-border after:rounded-md",
                                      },
                                      children: [
                                        {
                                          component: "AvatarImage",
                                          props: {
                                            src: { $ref: "selectors:selectedResult.coverUrl" },
                                            alt: { $ref: "page.store:selectedWork.title" },
                                            className: "rounded-md object-cover",
                                          },
                                        },
                                        {
                                          component: "AvatarFallback",
                                          props: { className: "rounded-md text-xs font-semibold" },
                                          children: ["OL"],
                                        },
                                      ],
                                    },
                                    {
                                      component: "ItemGroup",
                                      props: { className: "min-w-0 gap-2" },
                                      children: [
                                        {
                                          component: "H3",
                                          props: { className: "text-2xl" },
                                          children: [{ $ref: "page.store:selectedWork.title" }],
                                        },
                                        {
                                          component: "Muted",
                                          props: { className: "mt-0" },
                                          children: [
                                            "First published: ",
                                            {
                                              $nullish: {
                                                value: { $ref: "page.store:selectedWork.firstPublished" },
                                                default: "Unknown",
                                              },
                                            },
                                          ],
                                        },
                                      ],
                                    },
                                  ],
                                },
                                {
                                  component: "P",
                                  props: { className: "mt-0 text-sm leading-6" },
                                  children: [{ $ref: "page.store:selectedWork.description" }],
                                },
                                {
                                  $if: {
                                    cond: {
                                      $gt: {
                                        a: { $count: { $ref: "page.store:selectedWork.subjects" } },
                                        b: 0,
                                      },
                                    },
                                    then: {
                                      component: "ItemActions",
                                      props: { className: "flex-wrap gap-2" },
                                      children: [
                                        {
                                          $map: {
                                            over: { $ref: "page.store:selectedWork.subjects" },
                                            as: "subject",
                                            return: {
                                              component: "Badge",
                                              props: { variant: "secondary" },
                                              children: [{ $ref: "var:subject" }],
                                            },
                                          },
                                        },
                                      ],
                                    },
                                    else: null,
                                  },
                                },
                                {
                                  component: "Button",
                                  props: {
                                    onClick: {
                                      $action: [
                                        {
                                          type: "window.open",
                                          url: { $ref: "page.store:selectedWork.openLibraryUrl" },
                                          target: "_blank",
                                        },
                                      ],
                                    },
                                  },
                                  children: ["Open work in Open Library"],
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
                                    { component: "EmptyTitle", children: ["Pick a result"] },
                                    {
                                      component: "EmptyDescription",
                                      children: [
                                        "Choose any result from the left column to load extra metadata.",
                                      ],
                                    },
                                  ],
                                },
                              ],
                            },
                          },
                        },
                      },
                    },
                  },
                },
              ],
            },
          ],
        },
      ],
    },
  ],
};
