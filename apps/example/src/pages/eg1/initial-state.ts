const buildUser = (
  index: number,
  name: string,
  email: string,
  role: string,
  team: string,
  favorite: boolean,
  filterBucket: "managed" | "standard"
) => ({
  id: "user-" + (index + 1),
  initials: name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase(),
  label: name,
  sublabel: email,
  metaOne: role,
  metaTwo: team,
  favorite,
  filterBucket,
});

const buildGroup = (
  index: number,
  name: string,
  contact: string,
  members: string,
  access: string,
  favorite: boolean,
  filterBucket: "managed" | "standard"
) => ({
  id: "group-" + (index + 1),
  initials: name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase(),
  label: name,
  sublabel: contact,
  metaOne: members,
  metaTwo: access,
  favorite,
  filterBucket,
});

export const eg1InitialState = {
  brandName: "Brand name",
  adminSection: "users",
  entityView: "users",
  tableTab: "favorited",
  headerQuery: "",
  query: "",
  sortBy: "sublabel",
  sortDir: "asc",
  showManagedOnly: false,
  selectedRecordIds: [] as string[],
  nextUserNumber: 9,
  nextGroupNumber: 7,
  navItems: [
    { id: "dashboard", label: "Dashboard" },
    { id: "users", label: "Users" },
    { id: "roles", label: "Roles" },
    { id: "activity", label: "Activity" },
    { id: "settings", label: "Settings" },
  ],
  users: [
    buildUser(0, "Carmen Navarro", "carmen@brand.co", "Admin", "Platform", true, "managed"),
    buildUser(1, "Noah Lee", "noah@brand.co", "Editor", "Growth", false, "standard"),
    buildUser(2, "Priya Patel", "priya@brand.co", "Admin", "Operations", true, "managed"),
    buildUser(3, "Elena Meyer", "elena@brand.co", "Viewer", "Support", false, "standard"),
    buildUser(4, "Marcus Bennett", "marcus@brand.co", "Editor", "Product", true, "managed"),
    buildUser(5, "Avery Brooks", "avery@brand.co", "Admin", "Design", true, "managed"),
    buildUser(6, "Sofia Lopez", "sofia@brand.co", "Viewer", "People", false, "standard"),
    buildUser(7, "Theo Walker", "theo@brand.co", "Editor", "Sales", true, "managed"),
  ],
  groups: [
    buildGroup(0, "Design Ops", "design@brand.co", "12 members", "Private", true, "managed"),
    buildGroup(1, "Growth Team", "growth@brand.co", "18 members", "Private", false, "managed"),
    buildGroup(2, "Support Crew", "support@brand.co", "24 members", "Public", false, "standard"),
    buildGroup(3, "People Partners", "people@brand.co", "8 members", "Private", true, "managed"),
    buildGroup(4, "Field Sales", "sales@brand.co", "15 members", "Public", false, "standard"),
    buildGroup(5, "Leadership", "leadership@brand.co", "6 members", "Private", true, "managed"),
  ],
};
