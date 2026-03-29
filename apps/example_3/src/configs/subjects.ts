import type { ComponentNode } from "@beta-epic/ui";

export const subjectsInitialState = {
  subject: "fantasy",
  page: 1,
  pageSize: 8,
  loading: false,
  error: null as string | null,
  subjectResponse: null as null | {
    works?: unknown[];
    work_count?: number;
  },
  subjectOptions: [
    { value: "fantasy", label: "Fantasy" },
    { value: "science_fiction", label: "Science Fiction" },
    { value: "romance", label: "Romance" },
    { value: "history", label: "History" },
    { value: "mystery", label: "Mystery" },
  ],
};

export const subjectsConfig: ComponentNode = {
  component: "ItemGroup",
  props: { className: "mx-auto max-w-7xl gap-8 px-4 py-10" },
  effects: [
    {
      deps: [
        { $ref: "page.store:subject" },
        { $ref: "page.store:page" },
        { $ref: "page.store:pageSize" },
      ],
      run: [
        { type: "page.store.update", path: "error", payload: null },
        {
          type: "async.call",
          loading: "loading",
          call: {
            $http: {
              method: "GET",
              url: {
                $concat: [
                  "https://openlibrary.org/subjects/",
                  { $ref: "page.store:subject" },
                  ".json",
                ],
              },
              params: {
                limit: { $ref: "page.store:pageSize" },
                offset: {
                  $mul: [
                    { $sub: [{ $ref: "page.store:page" }, 1] },
                    { $ref: "page.store:pageSize" },
                  ],
                },
              },
            },
          },
          onSuccess: [
            { type: "page.store.update", path: "subjectResponse", payload: { $ref: "result" } },
          ],
          onError: [
            { type: "page.store.update", path: "error", payload: { $ref: "error.message" } },
            { type: "page.store.update", path: "subjectResponse", payload: null },
          ],
        },
      ],
    },
  ],
  selectors: {
    selectedSubjectOption: {
      $find: {
        over: { $ref: "page.store:subjectOptions" },
        as: "option",
        where: {
          $eq: {
            a: { $ref: "var:option.value" },
            b: { $ref: "page.store:subject" },
          },
        },
      },
    },
    subjectLabel: {
      $nullish: {
        value: { $ref: "selectors:selectedSubjectOption.label" },
        default: { $ref: "page.store:subject" },
      },
    },
    subjectWorks: {
      $nullish: {
        value: { $ref: "page.store:subjectResponse.works" },
        default: [],
      },
    },
    subjectTotal: {
      $nullish: {
        value: { $ref: "page.store:subjectResponse.work_count" },
        default: 0,
      },
    },
    subjectTotalPages: {
      $max: [
        1,
        {
          $ceil: {
            $div: [{ $ref: "selectors:subjectTotal" }, { $ref: "page.store:pageSize" }],
          },
        },
      ],
    },
    items: {
      $map: {
        over: { $ref: "selectors:subjectWorks" },
        as: "book",
        return: {
          workKey: { $ref: "var:book.key" },
          title: {
            $nullish: {
              value: { $ref: "var:book.title" },
              default: "Untitled work",
            },
          },
          author: {
            $nullish: {
              value: { $ref: "var:book.authors.0.name" },
              default: "Unknown author",
            },
          },
          year: {
            $if: {
              cond: { $isNil: { $ref: "var:book.first_publish_year" } },
              then: "Unknown year",
              else: { $string: { $ref: "var:book.first_publish_year" } },
            },
          },
          editionCount: {
            $nullish: {
              value: { $ref: "var:book.edition_count" },
              default: 0,
            },
          },
          hasFulltext: { $bool: { $ref: "var:book.has_fulltext" } },
          coverUrl: {
            $if: {
              cond: { $isNotNil: { $ref: "var:book.cover_id" } },
              then: {
                $concat: [
                  "https://covers.openlibrary.org/b/id/",
                  { $string: { $ref: "var:book.cover_id" } },
                  "-M.jpg",
                ],
              },
              else: null,
            },
          },
          openLibraryUrl: {
            $concat: ["https://openlibrary.org", { $ref: "var:book.key" }],
          },
        },
      },
    },
    hasItems: { $gt: { a: { $count: { $ref: "selectors:items" } }, b: 0 } },
    canPrev: { $gt: { a: { $ref: "page.store:page" }, b: 1 } },
    canNext: {
      $lt: {
        a: { $ref: "page.store:page" },
        b: { $ref: "selectors:subjectTotalPages" },
      },
    },
    pageSummary: {
      $concat: [
        "Page ",
        { $string: { $ref: "page.store:page" } },
        " of ",
        { $string: { $ref: "selectors:subjectTotalPages" } },
      ],
    },
  },
  children: [
    {
      component: "ItemGroup",
      props: { className: "gap-3" },
      children: [
        { component: "H1", children: ["Browse Subjects"] },
        {
          component: "Muted",
          props: { className: "max-w-4xl" },
          children: [
            "This route hits the Open Library subjects API directly and keeps the result window small with previous and next paging.",
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
            { component: "CardTitle", children: ["Choose a subject"] },
            {
              component: "CardDescription",
              children: [
                "Each subject button resets the page index and fetches a fresh collection from Open Library.",
              ],
            },
          ],
        },
        {
          component: "CardContent",
          props: { className: "space-y-4" },
          children: [
            {
              component: "ItemActions",
              props: { className: "flex-wrap gap-2" },
              children: [
                {
                  $map: {
                    over: { $ref: "page.store:subjectOptions" },
                    as: "option",
                    return: {
                      component: "Button",
                      props: {
                        variant: {
                          $if: {
                            cond: {
                              $eq: {
                                a: { $ref: "page.store:subject" },
                                b: { $ref: "var:option.value" },
                              },
                            },
                            then: "default",
                            else: "outline",
                          },
                        },
                        onClick: {
                          $action: [
                            {
                              type: "page.store.update",
                              path: "subject",
                              payload: { $ref: "var:option.value" },
                            },
                            { type: "page.store.update", path: "page", payload: 1 },
                          ],
                        },
                      },
                      children: [{ $ref: "var:option.label" }],
                    },
                  },
                },
              ],
            },
            {
              component: "ItemActions",
              props: { className: "flex-wrap gap-2" },
              children: [
                {
                  component: "Badge",
                  props: { variant: "secondary" },
                  children: [{ $ref: "selectors:subjectLabel" }],
                },
                {
                  component: "Badge",
                  props: {
                    variant: {
                      $if: {
                        cond: { $ref: "page.store:loading" },
                        then: "default",
                        else: "outline",
                      },
                    },
                  },
                  children: [
                    {
                      $if: {
                        cond: { $ref: "page.store:loading" },
                        then: "Loading...",
                        else: {
                          $concat: [
                            { $string: { $ref: "selectors:subjectTotal" } },
                            " works",
                          ],
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
    },
    {
      component: "Card",
      children: [
        {
          component: "CardHeader",
          children: [
            {
              component: "CardTitle",
              children: [
                { $ref: "selectors:subjectLabel" },
                " shelf",
              ],
            },
            {
              component: "CardDescription",
              children: [
                {
                  $if: {
                    cond: { $neq: { a: { $ref: "page.store:error" }, b: null } },
                    then: { $ref: "page.store:error" },
                    else: { $ref: "selectors:pageSummary" },
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
                cond: { $ref: "selectors:hasItems" },
                then: {
                  component: "ItemGroup",
                  props: { className: "grid gap-4 md:grid-cols-2 xl:grid-cols-4" },
                  children: [
                    {
                      $map: {
                        over: { $ref: "selectors:items" },
                        as: "book",
                        return: {
                          component: "Card",
                          props: { className: "h-full transition-colors hover:bg-accent/40" },
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
                                            then: "Previewable",
                                            else: "Reference",
                                          },
                                        },
                                      ],
                                    },
                                  ],
                                },
                                {
                                  component: "Button",
                                  props: {
                                    variant: "outline",
                                    onClick: {
                                      $action: [
                                        {
                                          type: "window.open",
                                          url: { $ref: "var:book.openLibraryUrl" },
                                          target: "_blank",
                                        },
                                      ],
                                    },
                                  },
                                  children: ["Open in Open Library"],
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
                          children: ["No books available"],
                        },
                        {
                          component: "EmptyDescription",
                          children: [
                            "Try another subject or move back to the first page.",
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
                          payload: { $sub: [{ $ref: "page.store:page" }, 1] },
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
                          payload: { $add: [{ $ref: "page.store:page" }, 1] },
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
  ],
};
