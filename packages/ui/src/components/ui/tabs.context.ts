export const TabsContext = {
  Tabs: `
  sub-components: TabsList, TabsTrigger, TabsContent
  TabsList: variant?: "default"* | "line"
  value?: string
  defaultValue?: string
  onValueChange?: (value: string) => void
  orientation?: "horizontal"* | "vertical"
  children: yes
  ---
  example config: { component: "Tabs", props: { value: "value", defaultValue: "value", orientation: "horizontal" }, children: [{ component: "TabsList", children: ["Content"] }] }
  `.trim(),
  TabsList: `
  TabsList: variant?: "default"* | "line"
  ---
  example config: { component: "TabsList", props: { variant: "default" } }
  `.trim(),
  TabsTrigger: `
  Sub-component of Tabs.
  ---
  example config: { component: "TabsTrigger", children: ["Open"] }
  `.trim(),
  TabsContent: `
  Sub-component of Tabs.
  ---
  example config: { component: "TabsContent", children: ["Content"] }
  `.trim(),
}

