export const eg1InitialState = {
  activeNav: "reports",
  chartRange: "3m",
  tableTab: "outline",
  tableQuery: "",
  selectedRowId: null,

  navSections: [
    {
      label: "Platform",
      items: [
        { key: "dashboard", label: "Dashboard", icon: "LayoutGrid" },
        { key: "lifecycle", label: "Lifecycle", icon: "LayoutGrid" },
        { key: "analytics", label: "Analytics", icon: "BarChart2" },
        { key: "projects", label: "Projects", icon: "FolderKanban" },
        { key: "team", label: "Team", icon: "Users" },
      ],
    },
    {
      label: "Documents",
      items: [
        { key: "data-library", label: "Data Library", icon: "Layers" },
        { key: "reports", label: "Reports", icon: "BarChart2" },
        { key: "word-assistant", label: "Word Assistant", icon: "MessageSquare" },
        { key: "more", label: "More", icon: "MoreHorizontalIcon" },
      ],
    },
  ],

  footerNav: [
    { key: "settings", label: "Settings", icon: "Sliders" },
    { key: "help", label: "Get Help", icon: "InfoIcon" },
    { key: "search", label: "Search", icon: "SearchIcon" },
  ],

  user: {
    name: "Shadcn",
    email: "m@example.com",
  },

  kpis: [
    {
      id: "revenue",
      title: "Total Revenue",
      delta: "+12.5%",
      trend: "up",
      value: "$1,250.00",
      note: "Visitors for the last 6 months",
    },
    {
      id: "customers",
      title: "New Customers",
      delta: "-20%",
      trend: "down",
      value: "1,234",
      note: "Acquisition needs attention",
    },
    {
      id: "accounts",
      title: "Active Accounts",
      delta: "+12.5%",
      trend: "up",
      value: "45,678",
      note: "Engagement exceed targets",
    },
    {
      id: "growth",
      title: "Growth Rate",
      delta: "+4.5%",
      trend: "up",
      value: "4.5%",
      note: "Meets growth projections",
    },
  ],

  tableRows: [
    {
      id: "row-1",
      bucket: "past",
      header: "Cover page",
      sectionType: "Cover page",
      status: "in_process",
      target: 18,
      limit: 5,
      reviewer: "Eddie Lake",
    },
    {
      id: "row-2",
      bucket: "outline",
      header: "Table of contents",
      sectionType: "Table of contents",
      status: "done",
      target: 29,
      limit: 24,
      reviewer: "Eddie Lake",
    },
    {
      id: "row-3",
      bucket: "outline",
      header: "Executive summary",
      sectionType: "Executive summary",
      status: "done",
      target: 10,
      limit: 12,
      reviewer: "Maria Hill",
    },
    {
      id: "row-4",
      bucket: "personnel",
      header: "Key personnel",
      sectionType: "Team overview",
      status: "in_process",
      target: 7,
      limit: 9,
      reviewer: "Jackson Lee",
    },
    {
      id: "row-5",
      bucket: "focus",
      header: "Focus documents",
      sectionType: "Highlights",
      status: "in_process",
      target: 5,
      limit: 6,
      reviewer: "Sofia Davis",
    },
  ],
};
