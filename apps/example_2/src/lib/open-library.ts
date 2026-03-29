const OPEN_LIBRARY_BASE = "https://openlibrary.org";

export interface LibraryBook {
  workKey: string;
  title: string;
  subtitle: string | null;
  author: string;
  year: string;
  editionCount: number;
  hasFulltext: boolean;
  coverUrl: string | null;
  openLibraryUrl: string;
}

export interface SearchPayload {
  query: string;
  page: number;
  pageSize: number;
  items: LibraryBook[];
  total: number;
  totalPages: number;
}

export interface SubjectPayload {
  subject: string;
  subjectLabel: string;
  page: number;
  pageSize: number;
  items: LibraryBook[];
  total: number;
  totalPages: number;
}

export interface WorkDetailsPayload {
  workKey: string;
  title: string;
  description: string;
  firstPublished: string | null;
  subjects: string[];
  openLibraryUrl: string;
}

interface SearchDoc {
  key?: string;
  title?: string;
  subtitle?: string;
  cover_i?: number;
  author_name?: string[];
  first_publish_year?: number;
  edition_count?: number;
  has_fulltext?: boolean;
}

interface SubjectWork {
  key?: string;
  title?: string;
  cover_id?: number;
  authors?: Array<{ name?: string }>;
  first_publish_year?: number;
  edition_count?: number;
  has_fulltext?: boolean;
}

type WorkDescription =
  | string
  | {
      value?: string;
    };

const clampPage = (page: number, totalPages: number) =>
  Math.max(1, Math.min(page, Math.max(1, totalPages)));

const toCoverUrl = (coverId?: number | null) =>
  typeof coverId === "number" ? `https://covers.openlibrary.org/b/id/${coverId}-M.jpg` : null;

const toSubjectLabel = (subject: string) =>
  subject
    .split(/[-_]/g)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");

const toBook = (entry: SearchDoc | SubjectWork): LibraryBook => {
  const workKey = typeof entry.key === "string" ? entry.key : "";
  const author = Array.isArray((entry as SearchDoc).author_name)
    ? ((entry as SearchDoc).author_name?.[0] ?? "Unknown author")
    : ((entry as SubjectWork).authors?.[0]?.name ?? "Unknown author");
  const coverId =
    "cover_i" in entry ? entry.cover_i ?? null : ("cover_id" in entry ? entry.cover_id ?? null : null);

  return {
    workKey,
    title: entry.title ?? "Untitled work",
    subtitle: "subtitle" in entry ? entry.subtitle ?? null : null,
    author,
    year:
      typeof entry.first_publish_year === "number"
        ? String(entry.first_publish_year)
        : "Unknown year",
    editionCount: entry.edition_count ?? 0,
    hasFulltext: Boolean(entry.has_fulltext),
    coverUrl: toCoverUrl(coverId),
    openLibraryUrl: `${OPEN_LIBRARY_BASE}${workKey}`,
  };
};

const parseDescription = (description: WorkDescription | undefined) => {
  if (typeof description === "string") {
    return description;
  }
  if (description && typeof description.value === "string") {
    return description.value;
  }
  return "No summary is available for this work yet.";
};

const fetchJson = async <T,>(url: string): Promise<T> => {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Open Library request failed with HTTP ${response.status}.`);
  }
  return response.json() as Promise<T>;
};

export const searchOpenLibraryBooks = async (
  rawQuery: unknown,
  rawPage: unknown,
  rawPageSize: unknown,
): Promise<SearchPayload> => {
  const query = String(rawQuery ?? "").trim() || "classic literature";
  const pageSize = Math.max(1, Number(rawPageSize ?? 8) || 8);
  const requestedPage = Math.max(1, Number(rawPage ?? 1) || 1);

  const url = new URL(`${OPEN_LIBRARY_BASE}/search.json`);
  url.searchParams.set("q", query);
  url.searchParams.set("page", String(requestedPage));
  url.searchParams.set("limit", String(pageSize));

  const data = await fetchJson<{ docs?: SearchDoc[]; numFound?: number }>(url.toString());
  const total = Number(data.numFound ?? 0);
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const page = clampPage(requestedPage, totalPages);
  const items = (data.docs ?? []).slice(0, pageSize).map(toBook);

  return {
    query,
    page,
    pageSize,
    items,
    total,
    totalPages,
  };
};

export const fetchOpenLibraryWork = async (rawWorkKey: unknown): Promise<WorkDetailsPayload> => {
  const workKey = String(rawWorkKey ?? "").trim();
  if (!workKey) {
    throw new Error("A work key is required to load work details.");
  }

  const data = await fetchJson<{
    title?: string;
    description?: WorkDescription;
    first_publish_date?: string;
    first_publish_year?: number;
    subjects?: string[];
    key?: string;
  }>(`${OPEN_LIBRARY_BASE}${workKey}.json`);

  return {
    workKey,
    title: data.title ?? "Untitled work",
    description: parseDescription(data.description),
    firstPublished:
      typeof data.first_publish_year === "number"
        ? String(data.first_publish_year)
        : (data.first_publish_date ?? null),
    subjects: (data.subjects ?? []).slice(0, 8),
    openLibraryUrl: `${OPEN_LIBRARY_BASE}${data.key ?? workKey}`,
  };
};

export const browseOpenLibrarySubject = async (
  rawSubject: unknown,
  rawPage: unknown,
  rawPageSize: unknown,
): Promise<SubjectPayload> => {
  const subject = String(rawSubject ?? "").trim() || "fantasy";
  const pageSize = Math.max(1, Number(rawPageSize ?? 8) || 8);
  const requestedPage = Math.max(1, Number(rawPage ?? 1) || 1);
  const offset = (requestedPage - 1) * pageSize;

  const url = new URL(`${OPEN_LIBRARY_BASE}/subjects/${encodeURIComponent(subject)}.json`);
  url.searchParams.set("limit", String(pageSize));
  url.searchParams.set("offset", String(offset));

  const data = await fetchJson<{ works?: SubjectWork[]; work_count?: number }>(url.toString());
  const total = Number(data.work_count ?? 0);
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const page = clampPage(requestedPage, totalPages);

  return {
    subject,
    subjectLabel: toSubjectLabel(subject),
    page,
    pageSize,
    items: (data.works ?? []).slice(0, pageSize).map(toBook),
    total,
    totalPages,
  };
};
