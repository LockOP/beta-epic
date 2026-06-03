import type { ComponentNode } from "@beta-epic/ui";

export const preview5RootConfig: ComponentNode = {
  component: "div",
  props: { className: "h-full w-full p-6" },
  selectors: {
    subjectForApi: {
      "$if": {
        cond: { "$eq": { a: { "$ref": "page.store:subject" }, b: "all" } },
        then: "fantasy",
        else: { "$ref": "page.store:subject" },
      },
    },
    trimmedDraftQuery: { "$trim": { "$ref": "page.store:draftQuery" } },
    trimmedQuery: { "$trim": { "$ref": "page.store:query" } },
    searchQ: {
      "$if": {
        cond: {
          "$and": [
            {
              "$gt": {
                a: { "$length": { "$ref": "selectors:trimmedQuery" } },
                b: 0,
              },
            },
            { "$neq": { a: { "$ref": "page.store:subject" }, b: "all" } },
          ],
        },
        then: {
          "$concat": [
            { "$ref": "selectors:trimmedQuery" },
            " subject:",
            { "$ref": "page.store:subject" },
          ],
        },
        else: { "$ref": "selectors:trimmedQuery" },
      },
    },
    total: {
      "$nullish": { value: { "$ref": "page.store:api.total" }, default: 0 },
    },
    totalPages: {
      "$max": [
        1,
        {
          "$ceil": {
            "$div": [{ "$ref": "selectors:total" }, { "$ref": "page.store:pageSize" }],
          },
        },
      ],
    },
    canPrev: { "$gt": { a: { "$ref": "page.store:page" }, b: 1 } },
    canNext: { "$lt": { a: { "$ref": "page.store:page" }, b: { "$ref": "selectors:totalPages" } } },
    pageOffset: {
      "$mul": [{ "$sub": [{ "$ref": "page.store:page" }, 1] }, { "$ref": "page.store:pageSize" }],
    },
    fetchedCount: { "$count": { "$ref": "page.store:api.items" } },
    filtersActive: {
      "$or": [
        { "$ref": "page.store:filters.hasCover" },
        {
          "$and": [
            { "$eq": { a: { "$ref": "page.store:mode" }, b: "search" } },
            { "$neq": { a: { "$ref": "page.store:filters.language" }, b: "any" } },
          ],
        },
        { "$isNotNil": { "$ref": "page.store:filters.minYear" } },
        { "$isNotNil": { "$ref": "page.store:filters.maxYear" } },
      ],
    },
    displayItems: {
      "$filter": {
        over: { "$ref": "page.store:api.items" },
        as: "item",
        where: {
          "$and": [
            {
              "$if": {
                cond: { "$ref": "page.store:filters.hasCover" },
                then: {
                  "$gt": {
                    a: {
                      "$nullish": {
                        value: { "$ref": "var:item.cover_i" },
                        default: { "$ref": "var:item.cover_id" },
                      },
                    },
                    b: 0,
                  },
                },
                else: true,
              },
            },
            {
              "$if": {
                cond: { "$isNotNil": { "$ref": "page.store:filters.minYear" } },
                then: {
                  "$gte": {
                    a: { "$ref": "var:item.first_publish_year" },
                    b: { "$ref": "page.store:filters.minYear" },
                  },
                },
                else: true,
              },
            },
            {
              "$if": {
                cond: { "$isNotNil": { "$ref": "page.store:filters.maxYear" } },
                then: {
                  "$lte": {
                    a: { "$ref": "var:item.first_publish_year" },
                    b: { "$ref": "page.store:filters.maxYear" },
                  },
                },
                else: true,
              },
            },
            {
              "$if": {
                cond: {
                  "$and": [
                    { "$eq": { a: { "$ref": "page.store:mode" }, b: "search" } },
                    { "$neq": { a: { "$ref": "page.store:filters.language" }, b: "any" } },
                  ],
                },
                then: {
                  "$in": {
                    value: { "$ref": "page.store:filters.language" },
                    array: { "$ref": "var:item.language" },
                  },
                },
                else: true,
              },
            },
            {
              "$if": {
                cond: {
                  "$and": [
                    { "$eq": { a: { "$ref": "page.store:mode" }, b: "subject" } },
                    { "$gt": { a: { "$length": { "$ref": "selectors:trimmedDraftQuery" } }, b: 0 } },
                  ],
                },
                then: {
                  "$contains": {
                    value: { "$ref": "var:item.title" },
                    search: { "$ref": "selectors:trimmedDraftQuery" },
                  },
                },
                else: true,
              },
            },
          ],
        },
      },
    },
    displayCount: { "$count": { "$ref": "selectors:displayItems" } },
    resultsTitle: {
      "$if": {
        cond: { "$eq": { a: { "$ref": "page.store:mode" }, b: "search" } },
        then: {
          "$if": {
            cond: { "$gt": { a: { "$length": { "$ref": "selectors:trimmedQuery" } }, b: 0 } },
            then: { "$concat": ["Search: “", { "$ref": "selectors:trimmedQuery" }, "”"] },
            else: "Search results",
          },
        },
        else: {
          "$concat": [
            "Genre: ",
            {
              "$replace": {
                value: { "$ref": "selectors:subjectForApi" },
                from: "_",
                to: " ",
              },
            },
          ],
        },
      },
    },
    resultsMeta: {
      "$concat": [
        "Page ",
        { "$string": { "$ref": "page.store:page" } },
        " of ",
        { "$string": { "$ref": "selectors:totalPages" } },
        " · ",
        { "$string": { "$ref": "selectors:total" } },
        " total",
      ],
    },
  },
  effects: [
    {
      deps: [],
      run: [
        {
          type: "page.store.update",
          path: "subject",
          payload: {
            "$if": {
              cond: { "$gt": { a: { "$length": { "$trim": { "$ref": "url:query.subject" } } }, b: 0 } },
              then: { "$trim": { "$ref": "url:query.subject" } },
              else: { "$ref": "page.store:subject" },
            },
          },
        },
        {
          type: "page.store.update",
          path: "draftQuery",
          payload: {
            "$if": {
              cond: { "$gt": { a: { "$length": { "$trim": { "$ref": "url:query.q" } } }, b: 0 } },
              then: { "$trim": { "$ref": "url:query.q" } },
              else: { "$ref": "page.store:draftQuery" },
            },
          },
        },
        {
          type: "page.store.update",
          path: "query",
          payload: {
            "$if": {
              cond: { "$gt": { a: { "$length": { "$trim": { "$ref": "url:query.q" } } }, b: 0 } },
              then: { "$trim": { "$ref": "url:query.q" } },
              else: { "$ref": "page.store:query" },
            },
          },
        },
        {
          type: "page.store.update",
          path: "mode",
          payload: {
            "$if": {
              cond: { "$gt": { a: { "$length": { "$trim": { "$ref": "url:query.q" } } }, b: 0 } },
              then: "search",
              else: {
                "$if": {
                  cond: { "$gt": { a: { "$length": { "$trim": { "$ref": "url:query.mode" } } }, b: 0 } },
                  then: { "$trim": { "$ref": "url:query.mode" } },
                  else: { "$ref": "page.store:mode" },
                },
              },
            },
          },
        },
        { type: "page.store.update", path: "page", payload: 1 },
        { type: "page.store.update", path: "hydrated", payload: true },
      ],
    },
    {
      deps: [
        { "$ref": "page.store:hydrated" },
        { "$ref": "page.store:mode" },
        { "$ref": "page.store:subject" },
        { "$ref": "page.store:query" },
        { "$ref": "page.store:pageSize" },
      ],
      run: [
        {
          $if: {
            cond: { "$ref": "page.store:hydrated" },
            then: [{ type: "page.store.update", path: "page", payload: 1 }],
          },
        },
      ],
    },
    {
      deps: [
        { "$ref": "page.store:hydrated" },
        { "$ref": "page.store:mode" },
        { "$ref": "page.store:subject" },
        { "$ref": "page.store:query" },
        { "$ref": "page.store:page" },
        { "$ref": "page.store:pageSize" },
        { "$ref": "page.store:refreshKey" },
      ],
      run: [
        {
          $if: {
            cond: { "$ref": "page.store:hydrated" },
            then: [
              { type: "page.store.update", path: "error", payload: null },
              {
                $if: {
                  cond: { "$eq": { a: { "$ref": "page.store:mode" }, b: "search" } },
                  then: [
                    {
                      $if: {
                        cond: { "$gt": { a: { "$length": { "$ref": "selectors:trimmedQuery" } }, b: 0 } },
                        then: [
                          {
                            type: "async.call",
                            loading: "loading",
                            call: {
                              $http: {
                                method: "GET",
                                url: "https://openlibrary.org/search.json",
                                params: {
                                  q: { "$ref": "selectors:searchQ" },
                                  page: { "$ref": "page.store:page" },
                                  limit: { "$ref": "page.store:pageSize" },
                                },
                              },
                            },
                            onSuccess: [
                              {
                                type: "page.store.update",
                                path: "api",
                                payload: {
                                  source: "search",
                                  total: { "$ref": "result.numFound" },
                                  items: { "$ref": "result.docs" },
                                },
                              },
                            ],
                            onError: [
                              { type: "page.store.update", path: "error", payload: { "$ref": "error.message" } },
                              { type: "page.store.update", path: "api.items", payload: [] },
                              { type: "page.store.update", path: "api.total", payload: 0 },
                              { type: "page.store.update", path: "api.source", payload: "search" },
                            ],
                          },
                        ],
                        else: [
                          {
                            type: "page.store.update",
                            path: "api",
                            payload: { source: "search", total: 0, items: [] },
                          },
                        ],
                      },
                    },
                  ],
                  else: [
                    {
                      type: "async.call",
                      loading: "loading",
                      call: {
                        $http: {
                          method: "GET",
                          url: {
                            "$concat": [
                              "https://openlibrary.org/subjects/",
                              { "$ref": "selectors:subjectForApi" },
                              ".json",
                            ],
                          },
                          params: {
                            limit: { "$ref": "page.store:pageSize" },
                            offset: {
                              "$mul": [
                                { "$sub": [{ "$ref": "page.store:page" }, 1] },
                                { "$ref": "page.store:pageSize" },
                              ],
                            },
                          },
                        },
                      },
                      onSuccess: [
                        {
                          type: "page.store.update",
                          path: "api",
                          payload: {
                            source: "subject",
                            total: { "$ref": "result.work_count" },
                            items: { "$ref": "result.works" },
                          },
                        },
                      ],
                      onError: [
                        { type: "page.store.update", path: "error", payload: { "$ref": "error.message" } },
                        { type: "page.store.update", path: "api.items", payload: [] },
                        { type: "page.store.update", path: "api.total", payload: 0 },
                        { type: "page.store.update", path: "api.source", payload: "subject" },
                      ],
                    },
                  ],
                },
              },
            ],
          },
        },
      ],
    },
  ],
  children: [
    {
      component: "div",
      props: { className: "mx-auto flex h-full max-w-6xl flex-col gap-4" },
      children: [
        {
          component: "div",
          props: { className: "flex flex-wrap items-start justify-between gap-3" },
          children: [
            {
              component: "div",
              props: { className: "flex flex-col gap-0.5" },
              children: [
                { component: "div", props: { className: "text-base font-medium" }, children: ["Open Library Dashboard"] },
                {
                  component: "div",
                  props: { className: "text-sm text-muted-foreground" },
                  children: [
                    "Browse by subject (genre) or search across Open Library. Filters apply to the fetched page.",
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
                    onClick: { $action: [{ type: "window.open", url: "/preview6", target: "_self" }] },
                  },
                  children: ["Genres"],
                },
                {
                  component: "Button",
                  props: {
                    variant: "outline",
                    size: "sm",
                    onClick: {
                      $action: [
                        {
                          type: "page.store.update",
                          path: "refreshKey",
                          payload: { "$add": [{ "$ref": "page.store:refreshKey" }, 1] },
                        },
                      ],
                    },
                  },
                  children: ["Refresh"],
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
          ],
        },
        {
          component: "Card",
          props: { size: "sm" },
          children: [
            {
              component: "CardHeader",
              props: { className: "border-b" },
              children: [
                { component: "CardTitle", children: ["Search / Browse"] },
                {
                  component: "CardDescription",
                  children: [
                    "Tip: in subject mode, the search box filters by title within the current page; in search mode, click Search to query Open Library.",
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
                      props: { className: "grid gap-3 md:grid-cols-3" },
                      children: [
                        {
                          component: "div",
                          props: { className: "flex flex-col gap-1.5" },
                          children: [
                            { component: "Label", props: { className: "text-xs text-muted-foreground" }, children: ["Mode"] },
                            {
                              component: "Select",
                              props: {
                                value: { "$ref": "page.store:mode" },
                                onValueChange: {
                                  $action: [
                                    { type: "page.store.update", path: "mode", payload: { "$arg": 0 } },
                                  ],
                                },
                              },
                              children: [
                                {
                                  component: "SelectTrigger",
                                  props: { className: "w-full" },
                                  children: [{ component: "SelectValue", props: { placeholder: "Select mode" } }],
                                },
                                {
                                  component: "SelectContent",
                                  children: [
                                    {
                                      component: "SelectGroup",
                                      children: [
                                        { component: "SelectItem", props: { value: "subject" }, children: ["Browse genre (subject)"] },
                                        { component: "SelectItem", props: { value: "search" }, children: ["Search (works)"] },
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
                            { component: "Label", props: { className: "text-xs text-muted-foreground" }, children: ["Genre (subject)"] },
                            {
                              component: "Select",
                              props: {
                                value: { "$ref": "page.store:subject" },
                                onValueChange: {
                                  $action: [{ type: "page.store.update", path: "subject", payload: { "$arg": 0 } }],
                                },
                              },
                              children: [
                                {
                                  component: "SelectTrigger",
                                  props: { className: "w-full" },
                                  children: [{ component: "SelectValue", props: { placeholder: "Select a genre" } }],
                                },
                                {
                                  component: "SelectContent",
                                  children: [
                                    {
                                      component: "SelectGroup",
                                      children: [
                                        { component: "SelectLabel", children: ["Browse"] },
                                        { component: "SelectItem", props: { value: "fantasy" }, children: ["Fantasy"] },
                                        { component: "SelectItem", props: { value: "science_fiction" }, children: ["Science fiction"] },
                                        { component: "SelectItem", props: { value: "mystery" }, children: ["Mystery"] },
                                        { component: "SelectItem", props: { value: "romance" }, children: ["Romance"] },
                                        { component: "SelectItem", props: { value: "horror" }, children: ["Horror"] },
                                        { component: "SelectItem", props: { value: "history" }, children: ["History"] },
                                        { component: "SelectItem", props: { value: "biography" }, children: ["Biography"] },
                                        { component: "SelectItem", props: { value: "poetry" }, children: ["Poetry"] },
                                        { component: "SelectItem", props: { value: "children" }, children: ["Children"] },
                                        { component: "SelectSeparator" },
                                        { component: "SelectLabel", children: ["Search scope"] },
                                        { component: "SelectItem", props: { value: "all" }, children: ["All genres"] },
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
                            { component: "Label", props: { className: "text-xs text-muted-foreground" }, children: ["Rows per page"] },
                            {
                              component: "Select",
                              props: {
                                value: { "$string": { "$ref": "page.store:pageSize" } },
                                onValueChange: {
                                  $action: [
                                    {
                                      type: "page.store.update",
                                      path: "pageSize",
                                      payload: { "$number": { "$arg": 0 } },
                                    },
                                  ],
                                },
                              },
                              children: [
                                {
                                  component: "SelectTrigger",
                                  props: { className: "w-full" },
                                  children: [{ component: "SelectValue", props: { placeholder: "Page size" } }],
                                },
                                {
                                  component: "SelectContent",
                                  children: [
                                    {
                                      component: "SelectGroup",
                                      children: [
                                        { component: "SelectItem", props: { value: "10" }, children: ["10"] },
                                        { component: "SelectItem", props: { value: "20" }, children: ["20"] },
                                        { component: "SelectItem", props: { value: "50" }, children: ["50"] },
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
                    {
                      component: "div",
                      props: { className: "flex flex-wrap items-end gap-2" },
                      children: [
                        {
                          component: "div",
                          props: { className: "flex min-w-64 flex-1 flex-col gap-1.5" },
                          children: [
                            { component: "Label", props: { className: "text-xs text-muted-foreground" }, children: ["Search"] },
                            {
                              component: "Input",
                              props: {
                                placeholder: "Title, author, keyword…",
                                value: { "$ref": "page.store:draftQuery" },
                                onChange: {
                                  $action: [
                                    {
                                      type: "page.store.update",
                                      path: "draftQuery",
                                      payload: { "$arg": 0, path: "currentTarget.value" },
                                    },
                                  ],
                                },
                              },
                            },
                          ],
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
                                        a: { "$length": { "$ref": "selectors:trimmedDraftQuery" } },
                                        b: 0,
                                      },
                                    },
                                    then: [
                                      { type: "page.store.update", path: "mode", payload: "search" },
                                      { type: "page.store.update", path: "query", payload: { "$ref": "selectors:trimmedDraftQuery" } },
                                      { type: "page.store.update", path: "page", payload: 1 },
                                    ],
                                    else: [
                                      { type: "snackbar", message: "Enter a search query first.", variant: "warning" },
                                    ],
                                  },
                                },
                              ],
                            },
                          },
                          children: ["Search"],
                        },
                        {
                          component: "Button",
                          props: {
                            variant: "outline",
                            size: "sm",
                            onClick: {
                              $action: [
                                { type: "page.store.update", path: "mode", payload: "subject" },
                                { type: "page.store.update", path: "page", payload: 1 },
                              ],
                            },
                          },
                          children: ["Browse"],
                        },
                        {
                          component: "Button",
                          props: {
                            variant: "ghost",
                            size: "sm",
                            onClick: {
                              $action: [
                                { type: "page.store.update", path: "draftQuery", payload: "" },
                                { type: "page.store.update", path: "query", payload: "" },
                              ],
                            },
                          },
                          children: ["Clear search"],
                        },
                      ],
                    },
                    {
                      component: "Separator",
                    },
                    {
                      component: "div",
                      props: { className: "flex flex-wrap items-end gap-3" },
                      children: [
                        {
                          component: "div",
                          props: { className: "flex items-center gap-2" },
                          children: [
                            { component: "Label", props: { className: "text-xs text-muted-foreground" }, children: ["Has cover"] },
                            {
                              component: "Switch",
                              props: {
                                size: "sm",
                                checked: { "$ref": "page.store:filters.hasCover" },
                                onCheckedChange: {
                                  $action: [
                                    {
                                      type: "page.store.update",
                                      path: "filters.hasCover",
                                      payload: { "$arg": 0 },
                                    },
                                  ],
                                },
                              },
                            },
                          ],
                        },
                        {
                          component: "div",
                          props: { className: "flex min-w-44 flex-col gap-1.5" },
                          children: [
                            { component: "Label", props: { className: "text-xs text-muted-foreground" }, children: ["Language"] },
                            {
                              component: "Select",
                              props: {
                                disabled: { "$eq": { a: { "$ref": "page.store:mode" }, b: "subject" } },
                                value: {
                                  "$if": {
                                    cond: { "$eq": { a: { "$ref": "page.store:mode" }, b: "subject" } },
                                    then: "any",
                                    else: { "$ref": "page.store:filters.language" },
                                  },
                                },
                                onValueChange: {
                                  $action: [
                                    {
                                      type: "page.store.update",
                                      path: "filters.language",
                                      payload: { "$arg": 0 },
                                    },
                                  ],
                                },
                              },
                              children: [
                                {
                                  component: "SelectTrigger",
                                  props: { className: "w-full", size: "sm" },
                                  children: [{ component: "SelectValue", props: { placeholder: "Any language" } }],
                                },
                                {
                                  component: "SelectContent",
                                  children: [
                                    {
                                      component: "SelectGroup",
                                      children: [
                                        { component: "SelectItem", props: { value: "any" }, children: ["Any"] },
                                        { component: "SelectSeparator" },
                                        { component: "SelectItem", props: { value: "eng" }, children: ["English (eng)"] },
                                        { component: "SelectItem", props: { value: "spa" }, children: ["Spanish (spa)"] },
                                        { component: "SelectItem", props: { value: "fre" }, children: ["French (fre)"] },
                                        { component: "SelectItem", props: { value: "ger" }, children: ["German (ger)"] },
                                        { component: "SelectItem", props: { value: "ita" }, children: ["Italian (ita)"] },
                                      ],
                                    },
                                  ],
                                },
                              ],
                            },
                            {
                              $if: {
                                cond: { "$eq": { a: { "$ref": "page.store:mode" }, b: "subject" } },
                                then: {
                                  component: "div",
                                  props: { className: "text-xs text-muted-foreground" },
                                  children: ["Language filter is available in Search mode."],
                                },
                              },
                            },
                          ],
                        },
                        {
                          component: "div",
                          props: { className: "flex flex-col gap-1.5" },
                          children: [
                            { component: "Label", props: { className: "text-xs text-muted-foreground" }, children: ["Min year"] },
                            {
                              component: "Input",
                              props: {
                                type: "number",
                                placeholder: "e.g. 1950",
                                value: { "$ref": "page.store:filters.minYear" },
                                onChange: {
                                  $action: [
                                    {
                                      type: "page.store.update",
                                      path: "filters.minYear",
                                      payload: {
                                        "$if": {
                                          cond: {
                                            "$eq": {
                                              a: {
                                                "$length": {
                                                  "$trim": { "$arg": 0, path: "currentTarget.value" },
                                                },
                                              },
                                              b: 0,
                                            },
                                          },
                                          then: null,
                                          else: {
                                            "$number": { "$arg": 0, path: "currentTarget.value" },
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
                          component: "div",
                          props: { className: "flex flex-col gap-1.5" },
                          children: [
                            { component: "Label", props: { className: "text-xs text-muted-foreground" }, children: ["Max year"] },
                            {
                              component: "Input",
                              props: {
                                type: "number",
                                placeholder: "e.g. 2024",
                                value: { "$ref": "page.store:filters.maxYear" },
                                onChange: {
                                  $action: [
                                    {
                                      type: "page.store.update",
                                      path: "filters.maxYear",
                                      payload: {
                                        "$if": {
                                          cond: {
                                            "$eq": {
                                              a: {
                                                "$length": {
                                                  "$trim": { "$arg": 0, path: "currentTarget.value" },
                                                },
                                              },
                                              b: 0,
                                            },
                                          },
                                          then: null,
                                          else: {
                                            "$number": { "$arg": 0, path: "currentTarget.value" },
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
                          component: "Button",
                          props: {
                            variant: "outline",
                            size: "sm",
                            onClick: { $action: [{ type: "page.store.reset", path: "filters" }] },
                          },
                          children: ["Clear filters"],
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
          props: { shadow: true },
          children: [
            {
              component: "CardHeader",
              props: { className: "border-b" },
              children: [
                {
                  component: "div",
                  props: { className: "flex flex-wrap items-start justify-between gap-3" },
                  children: [
                    {
                      component: "div",
                      props: { className: "flex flex-col gap-1" },
                      children: [
                        { component: "CardTitle", children: [{ "$ref": "selectors:resultsTitle" }] },
                        {
                          component: "CardDescription",
                          children: [{ "$ref": "selectors:resultsMeta" }],
                        },
                      ],
                    },
                    {
                      component: "div",
                      props: { className: "flex flex-wrap items-center gap-2" },
                      children: [
                        {
                          $if: {
                            cond: { "$ref": "selectors:filtersActive" },
                            then: {
                              component: "Badge",
                              props: { variant: "secondary" },
                              children: [
                                "Filters",
                                {
                                  component: "span",
                                  props: { className: "ml-1 tabular-nums" },
                                  children: [{ "$string": { "$ref": "selectors:displayCount" } }],
                                },
                              ],
                            },
                          },
                        },
                        {
                          $if: {
                            cond: { "$ref": "page.store:loading" },
                            then: {
                              component: "div",
                              props: { className: "flex items-center gap-1 text-xs text-muted-foreground" },
                              children: [
                                { component: "Spinner" },
                                "Loading…",
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
            {
              component: "CardContent",
              children: [
                {
                  $if: {
                    cond: { "$isNotNil": { "$ref": "page.store:error" } },
                    then: {
                      component: "Alert",
                      props: { variant: "destructive", className: "mb-3" },
                      children: [
                        { component: "AlertTitle", children: ["Request failed"] },
                        {
                          component: "AlertDescription",
                          children: [{ "$ref": "page.store:error" }],
                        },
                        {
                          component: "AlertAction",
                          children: [
                            {
                              component: "Button",
                              props: {
                                variant: "outline",
                                size: "sm",
                                onClick: {
                                  $action: [
                                    {
                                      type: "page.store.update",
                                      path: "refreshKey",
                                      payload: { "$add": [{ "$ref": "page.store:refreshKey" }, 1] },
                                    },
                                  ],
                                },
                              },
                              children: ["Retry"],
                            },
                          ],
                        },
                      ],
                    },
                  },
                },
                {
                  component: "Table",
                  children: [
                    {
                      component: "TableHeader",
                      children: [
                        {
                          component: "TableRow",
                          children: [
                            { component: "TableHead", children: ["Cover"] },
                            { component: "TableHead", props: { className: "min-w-72" }, children: ["Title / Author"] },
                            { component: "TableHead", children: ["Year"] },
                            { component: "TableHead", children: ["Editions"] },
                            { component: "TableHead", props: { className: "min-w-72" }, children: ["Labels"] },
                            { component: "TableHead", children: ["Actions"] },
                          ],
                        },
                      ],
                    },
                    {
                      component: "TableBody",
                      children: [
                        {
                          $if: {
                            cond: { "$eq": { a: { "$count": { "$ref": "selectors:displayItems" } }, b: 0 } },
                            then: {
                              component: "TableRow",
                              children: [
                                {
                                  component: "TableCell",
                                  props: { colSpan: 6, className: "text-sm text-muted-foreground" },
                                  children: ["No books found for the current selection / filters."],
                                },
                              ],
                            },
                          },
                        },
                        {
                          $map: {
                            over: { "$ref": "selectors:displayItems" },
                            as: "item",
                            return: {
                              component: "TableRow",
                              children: [
                                {
                                  component: "TableCell",
                                  children: [
                                    {
                                      component: "Avatar",
                                      props: { className: "size-10 rounded-md bg-muted", size: "lg" },
                                      children: [
                                        {
                                          $if: {
                                            cond: {
                                              "$gt": {
                                                a: {
                                                  "$nullish": {
                                                    value: { "$ref": "var:item.cover_i" },
                                                    default: { "$ref": "var:item.cover_id" },
                                                  },
                                                },
                                                b: 0,
                                              },
                                            },
                                            then: {
                                              component: "AvatarImage",
                                              props: {
                                                src: {
                                                  "$concat": [
                                                    "https://covers.openlibrary.org/b/id/",
                                                    {
                                                      "$string": {
                                                        "$nullish": {
                                                          value: { "$ref": "var:item.cover_i" },
                                                          default: { "$ref": "var:item.cover_id" },
                                                        },
                                                      },
                                                    },
                                                    "-M.jpg",
                                                  ],
                                                },
                                                className: "rounded-md object-cover",
                                              },
                                            },
                                          },
                                        },
                                        {
                                          component: "AvatarFallback",
                                          props: { className: "rounded-md text-xs" },
                                          children: [
                                            {
                                              "$upper": {
                                                "$charAt": {
                                                  value: { "$nullish": { value: { "$ref": "var:item.title" }, default: "?" } },
                                                  index: 0,
                                                },
                                              },
                                            },
                                          ],
                                        },
                                      ],
                                    },
                                  ],
                                },
                                {
                                  component: "TableCell",
                                  props: { className: "whitespace-normal" },
                                  children: [
                                    {
                                      component: "div",
                                      props: { className: "flex flex-col gap-0.5" },
                                      children: [
                                        {
                                          component: "div",
                                          props: { className: "font-medium leading-snug" },
                                          children: [{ "$nullish": { value: { "$ref": "var:item.title" }, default: "Untitled" } }],
                                        },
                                        {
                                          component: "div",
                                          props: { className: "text-xs text-muted-foreground" },
                                          children: [
                                            {
                                              "$if": {
                                                cond: { "$isArray": { "$ref": "var:item.author_name" } },
                                                then: { "$join": { arr: { "$ref": "var:item.author_name" }, sep: ", " } },
                                                else: {
                                                  "$if": {
                                                    cond: { "$isArray": { "$ref": "var:item.authors" } },
                                                    then: {
                                                      "$join": {
                                                        arr: {
                                                          "$map": {
                                                            over: { "$ref": "var:item.authors" },
                                                            as: "a",
                                                            return: { "$ref": "var:a.name" },
                                                          },
                                                        },
                                                        sep: ", ",
                                                      },
                                                    },
                                                    else: "Unknown author",
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
                                {
                                  component: "TableCell",
                                  children: [
                                    {
                                      "$if": {
                                        cond: { "$isNotNil": { "$ref": "var:item.first_publish_year" } },
                                        then: { "$string": { "$ref": "var:item.first_publish_year" } },
                                        else: "—",
                                      },
                                    },
                                  ],
                                },
                                {
                                  component: "TableCell",
                                  children: [
                                    {
                                      "$if": {
                                        cond: { "$isNotNil": { "$ref": "var:item.edition_count" } },
                                        then: { "$string": { "$ref": "var:item.edition_count" } },
                                        else: "—",
                                      },
                                    },
                                  ],
                                },
                                {
                                  component: "TableCell",
                                  props: { className: "whitespace-normal" },
                                  children: [
                                    {
                                      component: "div",
                                      props: { className: "flex flex-wrap gap-1.5" },
                                      children: [
                                        {
                                          component: "Badge",
                                          props: { variant: "outline" },
                                          children: [
                                            {
                                              "$if": {
                                                cond: { "$eq": { a: { "$ref": "page.store:mode" }, b: "search" } },
                                                then: "Search",
                                                else: "Subject",
                                              },
                                            },
                                          ],
                                        },
                                        {
                                          $if: {
                                            cond: { "$isNotNil": { "$ref": "var:item.first_publish_year" } },
                                            then: {
                                              component: "Badge",
                                              props: { variant: "secondary" },
                                              children: [
                                                { "$string": { "$ref": "var:item.first_publish_year" } },
                                              ],
                                            },
                                          },
                                        },
                                        {
                                          $if: {
                                            cond: { "$isNotNil": { "$ref": "var:item.language" } },
                                            then: {
                                              $map: {
                                                over: {
                                                  "$slice": {
                                                    over: { "$ref": "var:item.language" },
                                                    start: 0,
                                                    end: 2,
                                                  },
                                                },
                                                as: "lang",
                                                return: {
                                                  component: "Badge",
                                                  props: { variant: "outline" },
                                                  children: [{ "$ref": "var:lang" }],
                                                },
                                              },
                                            },
                                          },
                                        },
                                        {
                                          $if: {
                                            cond: { "$isNotNil": { "$ref": "var:item.subject" } },
                                            then: {
                                              $map: {
                                                over: {
                                                  "$slice": {
                                                    over: { "$ref": "var:item.subject" },
                                                    start: 0,
                                                    end: 3,
                                                  },
                                                },
                                                as: "sub",
                                                return: {
                                                  component: "Badge",
                                                  props: { variant: "ghost" },
                                                  children: [{ "$ref": "var:sub" }],
                                                },
                                              },
                                            },
                                          },
                                        },
                                      ],
                                    },
                                  ],
                                },
                                {
                                  component: "TableCell",
                                  children: [
                                    {
                                      component: "div",
                                      props: { className: "flex items-center gap-2" },
                                      children: [
                                        {
                                          component: "Button",
                                          props: {
                                            variant: "outline",
                                            size: "xs",
                                            onClick: {
                                              $action: [
                                                {
                                                  type: "window.open",
                                                  url: {
                                                    "$concat": [
                                                      "https://openlibrary.org",
                                                      { "$nullish": { value: { "$ref": "var:item.key" }, default: "" } },
                                                    ],
                                                  },
                                                  target: "_blank",
                                                },
                                              ],
                                            },
                                          },
                                          children: ["Open"],
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
                  ],
                },
              ],
            },
            {
              component: "CardFooter",
              children: [
                {
                  component: "div",
                  props: { className: "flex w-full flex-wrap items-center justify-between gap-2" },
                  children: [
                    {
                      component: "div",
                      props: { className: "text-xs text-muted-foreground" },
                      children: [{ "$ref": "selectors:resultsMeta" }],
                    },
                    {
                      component: "div",
                      props: { className: "flex items-center gap-2" },
                      children: [
                        {
                          component: "Button",
                          props: {
                            variant: "outline",
                            size: "sm",
                            disabled: { "$not": { "$ref": "selectors:canPrev" } },
                            onClick: {
                              $action: [
                                {
                                  $if: {
                                    cond: { "$ref": "selectors:canPrev" },
                                    then: [
                                      {
                                        type: "page.store.update",
                                        path: "page",
                                        payload: { "$sub": [{ "$ref": "page.store:page" }, 1] },
                                      },
                                    ],
                                  },
                                },
                              ],
                            },
                          },
                          children: ["Prev"],
                        },
                        {
                          component: "Button",
                          props: {
                            variant: "outline",
                            size: "sm",
                            disabled: { "$not": { "$ref": "selectors:canNext" } },
                            onClick: {
                              $action: [
                                {
                                  $if: {
                                    cond: { "$ref": "selectors:canNext" },
                                    then: [
                                      {
                                        type: "page.store.update",
                                        path: "page",
                                        payload: { "$add": [{ "$ref": "page.store:page" }, 1] },
                                      },
                                    ],
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
          ],
        },
      ],
    },
  ],
};

