const iconContext = (name: string) => `
  Lucide icon component.
  size?: string | number
  color?: string
  strokeWidth?: string | number
  absoluteStrokeWidth?: boolean
  + all native <svg> props
  ---
  example config: { component: "${name}", props: { className: "size-4" } }
`.trim();

export const IconComponentContext = {
  ArrowLeft: iconContext("ArrowLeft"),
  BarChart2: iconContext("BarChart2"),
  Bell: iconContext("Bell"),
  Bookmark: iconContext("Bookmark"),
  Bot: iconContext("Bot"),
  CalendarIcon: iconContext("CalendarIcon"),
  Check: iconContext("Check"),
  CheckIcon: iconContext("CheckIcon"),
  ChevronDownIcon: iconContext("ChevronDownIcon"),
  ChevronLeftIcon: iconContext("ChevronLeftIcon"),
  ChevronRightIcon: iconContext("ChevronRightIcon"),
  ChevronUpIcon: iconContext("ChevronUpIcon"),
  CircleCheckIcon: iconContext("CircleCheckIcon"),
  Copy: iconContext("Copy"),
  CreditCard: iconContext("CreditCard"),
  FolderKanban: iconContext("FolderKanban"),
  InfoIcon: iconContext("InfoIcon"),
  Layers: iconContext("Layers"),
  LayoutGrid: iconContext("LayoutGrid"),
  Loader2Icon: iconContext("Loader2Icon"),
  MessageSquare: iconContext("MessageSquare"),
  MessageSquareDashed: iconContext("MessageSquareDashed"),
  MinusIcon: iconContext("MinusIcon"),
  MoreHorizontal: iconContext("MoreHorizontal"),
  MoreHorizontalIcon: iconContext("MoreHorizontalIcon"),
  MousePointer2: iconContext("MousePointer2"),
  OctagonXIcon: iconContext("OctagonXIcon"),
  PanelLeftIcon: iconContext("PanelLeftIcon"),
  Pencil: iconContext("Pencil"),
  Plus: iconContext("Plus"),
  Search: iconContext("Search"),
  SearchIcon: iconContext("SearchIcon"),
  Send: iconContext("Send"),
  Sliders: iconContext("Sliders"),
  Sparkles: iconContext("Sparkles"),
  ToggleLeft: iconContext("ToggleLeft"),
  Trash2: iconContext("Trash2"),
  TriangleAlertIcon: iconContext("TriangleAlertIcon"),
  User: iconContext("User"),
  Users: iconContext("Users"),
  Wrench: iconContext("Wrench"),
  XIcon: iconContext("XIcon"),
} as const;
