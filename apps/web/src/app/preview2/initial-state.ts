const names = [
  { initials: "CN", name: "Cameron Neal" },
  { initials: "AR", name: "Ari Ramos" },
  { initials: "LT", name: "Lena Tran" },
  { initials: "MK", name: "Mason Kim" },
  { initials: "SJ", name: "Sofia James" },
  { initials: "OL", name: "Owen Lee" },
  { initials: "AV", name: "Ava Patel" },
  { initials: "LM", name: "Liam Chen" },
  { initials: "MW", name: "Mia Wong" },
  { initials: "ZR", name: "Zoe Rivera" },
];

const detailOne = [
  "Table cell",
  "Marketing site",
  "Operations team",
  "Product growth",
  "Customer sync",
];

const detailTwo = [
  "Table cell",
  "North America",
  "Enterprise",
  "Internal tools",
  "Weekly report",
];

const detailThree = [
  "Table cell",
  "Draft",
  "Published",
  "Archived",
  "Needs review",
];

const buildRow = (index: number) => {
  return {
    id: `ROW-${index + 1}`,
    initials: names[index % names.length].initials,
    name: "Name",
    detailOne: "Table cell",
    detailTwo: "Table cell",
    detailThree: "Table cell",
    isFavorited: true,
    sortName: `Name ${index + 1}`,
  };
};

export const preview2InitialState = {
  workspace: "text",
  topSearchQuery: "",
  tableSearchQuery: "",
  tab: "favorited",
  currentPage: 1,
  selectedRowIds: ["ROW-10"] as string[],
  pageSize: 10,
  totalCount: 100,
  pageNumbers: [1, 2, 3, 4],
  rows: Array.from({ length: 100 }, (_, index) => buildRow(index)),
  mainNav: [
    {
      id: "home",
      label: "Home",
      active: false,
      children: [
        { id: "level-1", label: "Label", active: false },
        { id: "level-2", label: "Label", active: false },
        { id: "level-3", label: "Label", active: false },
      ],
    },
    {
      id: "label-group-1",
      label: "Label",
      active: false,
      children: [
        { id: "label-1", label: "Label", active: false },
        { id: "label-2", label: "Label", active: false },
        { id: "label-3", label: "Label", active: true },
      ],
    },
    {
      id: "label-group-2",
      label: "Label",
      active: false,
      children: [],
    },
    {
      id: "label-group-3",
      label: "Label",
      active: false,
      children: [],
    },
  ],
  footerNav: [
    { id: "footer-home", label: "Home", icon: "LayoutGrid" },
    { id: "footer-settings", label: "Settings", icon: "Wrench" },
    { id: "footer-profile", label: "Your Profile", icon: "User" },
  ],
};

