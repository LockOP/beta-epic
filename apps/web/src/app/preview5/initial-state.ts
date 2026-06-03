export const preview5InitialState = {
  hydrated: false,
  mode: "subject" as "subject" | "search",

  // Genre / subject browsing
  subject: "fantasy",

  // Search (draftQuery is what the user is typing; query is the applied one)
  draftQuery: "",
  query: "",

  // Pagination (1-based page index)
  page: 1,
  pageSize: 20,

  // Client-side filters (applied to the fetched page)
  filters: {
    hasCover: false,
    language: "any", // "any" | "eng" | "spa" | "fre" | ...
    minYear: null as number | null,
    maxYear: null as number | null,
  },

  // API results (normalized between /search.json and /subjects/{subject}.json)
  api: {
    source: "subject" as "subject" | "search",
    total: 0,
    items: [] as unknown[],
  },

  loading: false,
  error: null as string | null,

  // Manual “Refresh” trigger
  refreshKey: 0,
};

