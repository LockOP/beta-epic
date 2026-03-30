"use client"

import * as React from "react"
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
  Alert,
  AlertDescription,
  AlertTitle,
  Avatar,
  AvatarFallback,
  Badge,
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
  Button,
  ButtonGroup,
  ButtonGroupText,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  Checkbox,
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  DataTable,
  DatePicker,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  Field,
  FieldContent,
  FieldDescription,
  FieldGroup,
  FieldLabel,
  FieldLegend,
  FieldSet,
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
  Input,
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
  InputOTP,
  InputOTPGroup,
  InputOTPSeparator,
  InputOTPSlot,
  Kbd,
  Label,
  Menubar,
  MenubarContent,
  MenubarItem,
  MenubarMenu,
  MenubarTrigger,
  Muted,
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
  Popover,
  PopoverContent,
  PopoverTrigger,
  Progress,
  RadioGroup,
  RadioGroupItem,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Separator,
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarSeparator,
  SidebarTrigger,
  Skeleton,
  Slider,
  Spinner,
  Switch,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
  Textarea,
  ToastProvider,
  Toggle,
  ToggleGroup,
  ToggleGroupItem,
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
  toast,
} from "@beta-epic/ui"
import {
  Bell,
  BarChart2,
  Check,
  CreditCard,
  FolderKanban,
  Layers,
  LayoutGrid,
  MousePointer2,
  Search,
  Sliders,
  Sparkles,
  ToggleLeft,
  Users,
} from "lucide-react"
import { Bar, BarChart, XAxis } from "recharts"

// ─── static data ──────────────────────────────────────────────────────────────

const chartData = [
  { week: "W1", shipped: 14 },
  { week: "W2", shipped: 18 },
  { week: "W3", shipped: 12 },
  { week: "W4", shipped: 24 },
  { week: "W5", shipped: 20 },
]

const chartConfig = {
  shipped: { label: "Shipped", color: "hsl(var(--primary))" },
}

const ticketRows = [
  { id: "UI-104", customer: "Northwind", owner: "Ava", status: "Ready" },
  { id: "UI-108", customer: "Pine Labs", owner: "Mia", status: "In progress" },
  { id: "UI-113", customer: "Orbit", owner: "Liam", status: "In review" },
]

const tableColumns = [
  { key: "id", header: "Ticket" },
  { key: "customer", header: "Customer" },
  { key: "owner", header: "Owner" },
  {
    key: "status",
    header: "Status",
    cell: (row: (typeof ticketRows)[number]) => (
      <Badge
        variant={
          row.status === "Ready" ? "default" : row.status === "In progress" ? "secondary" : "outline"
        }
      >
        {row.status}
      </Badge>
    ),
  },
]

const navSections = [
  { id: "buttons", label: "Buttons", icon: MousePointer2 },
  { id: "inputs", label: "Inputs & Forms", icon: LayoutGrid },
  { id: "selection", label: "Selection", icon: ToggleLeft },
  { id: "overlays", label: "Overlays", icon: Layers },
  { id: "navigation", label: "Navigation", icon: Search },
  { id: "data", label: "Data", icon: BarChart2 },
  { id: "feedback", label: "Feedback", icon: Bell },
]

// ─── page ─────────────────────────────────────────────────────────────────────

export default function ComponentsPage() {
  const [name, setName] = React.useState("Ava Patel")
  const [email, setEmail] = React.useState("")
  const [notes, setNotes] = React.useState("Component preview for onboarding and delivery handoff.")
  const [plan, setPlan] = React.useState("pro")
  const [launchDate, setLaunchDate] = React.useState<Date | undefined>(new Date())
  const [searchQuery, setSearchQuery] = React.useState("")
  const [sliderValue, setSliderValue] = React.useState([65])

  const [notifications, setNotifications] = React.useState(true)
  const [previews, setPreviews] = React.useState(true)
  const [marketing, setMarketing] = React.useState(false)
  const [acceptTerms, setAcceptTerms] = React.useState(false)
  const [frequency, setFrequency] = React.useState("weekly")
  const [density, setDensity] = React.useState("comfortable")
  const [activeSection, setActiveSection] = React.useState("buttons")

  return (
    <TooltipProvider>
      <ToastProvider />
      <SidebarProvider>
        <AppSidebar activeSection={activeSection} onSectionChange={setActiveSection} />

        <SidebarInset>
          {/* sticky header */}
          <header className="sticky top-0 z-10 flex h-12 shrink-0 items-center gap-3 border-b bg-background/95 px-4 backdrop-blur">
            <SidebarTrigger />
            <Separator orientation="vertical" className="h-4" />
            <Breadcrumb>
              <BreadcrumbList>
                <BreadcrumbItem>
                  <BreadcrumbLink href="/">Beta Epic</BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator />
                <BreadcrumbItem>
                  <BreadcrumbPage>Components</BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
            <div className="ml-auto flex items-center gap-2">
              <Badge variant="secondary" className="gap-1 hidden sm:flex">
                <Sparkles className="size-3" />
                @beta-epic/ui
              </Badge>
              <Button
                size="sm"
                variant="outline"
                onClick={() =>
                  toast("Release note published", {
                    description: "Toast triggered from the shared library.",
                  })
                }
              >
                Trigger toast
              </Button>
            </div>
          </header>

          <main className="flex flex-col gap-8 p-6 max-w-5xl mx-auto w-full">
            {/* hero */}
            <div className="space-y-1 pt-2">
              <h1 className="text-2xl font-semibold tracking-tight">Component showcase</h1>
              <p className="text-sm text-muted-foreground">
                Every component comes from{" "}
                <code className="rounded bg-muted px-1 py-0.5 font-mono text-xs">@beta-epic/ui</code>.
                All inputs are live and interactive.
              </p>
            </div>

            {/* ── Buttons ───────────────────────────────────────────────── */}
            <Section id="buttons" title="Buttons" description="Variants, sizes, groups, and dropdown actions">
              <div className="space-y-5">
                <Row label="Variants">
                  <Button>Default</Button>
                  <Button variant="secondary">Secondary</Button>
                  <Button variant="outline">Outline</Button>
                  <Button variant="ghost">Ghost</Button>
                  <Button variant="destructive">Destructive</Button>
                  <Button variant="link">Link</Button>
                </Row>

                <Row label="Sizes">
                  <Button size="xs">Extra small</Button>
                  <Button size="sm">Small</Button>
                  <Button>Default</Button>
                  <Button size="lg">Large</Button>
                  <Button size="icon">
                    <Search />
                  </Button>
                  <Button size="icon-sm">
                    <Bell />
                  </Button>
                  <Button disabled>Disabled</Button>
                </Row>

                <Row label="Groups & actions">
                  <ButtonGroup>
                    <Button variant="outline">Overview</Button>
                    <Button variant="outline">Analytics</Button>
                    <Button variant="outline">Settings</Button>
                  </ButtonGroup>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="outline">Actions ↓</Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="start">
                      <DropdownMenuLabel>Workspace</DropdownMenuLabel>
                      <DropdownMenuItem>Rename project</DropdownMenuItem>
                      <DropdownMenuItem>Duplicate preview</DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem className="text-destructive">Delete</DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </Row>
              </div>
            </Section>

            {/* ── Inputs ────────────────────────────────────────────────── */}
            <Section id="inputs" title="Inputs & Forms" description="Controlled fields — type and see live state update below">
              <div className="grid gap-6 md:grid-cols-2">
                <div className="space-y-4">
                  <FieldSet>
                    <FieldLegend>Contact info</FieldLegend>
                    <FieldGroup>
                      <Field>
                        <FieldLabel>Full name</FieldLabel>
                        <FieldContent>
                          <Input
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="Ava Patel"
                          />
                          <FieldDescription>Your public display name.</FieldDescription>
                        </FieldContent>
                      </Field>
                      <Field>
                        <FieldLabel>Email</FieldLabel>
                        <FieldContent>
                          <Input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="ava@beta-epic.dev"
                          />
                        </FieldContent>
                      </Field>
                    </FieldGroup>
                  </FieldSet>

                  <Field>
                    <FieldLabel>Notes</FieldLabel>
                    <FieldContent>
                      <Textarea
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        rows={3}
                        className="resize-none"
                      />
                      <FieldDescription>{notes.length} / 280</FieldDescription>
                    </FieldContent>
                  </Field>
                </div>

                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label>Workspace URL</Label>
                    <InputGroup>
                      <InputGroupAddon>
                        <ButtonGroupText>https://</ButtonGroupText>
                      </InputGroupAddon>
                      <InputGroupInput defaultValue="studio.beta-epic.dev" />
                    </InputGroup>
                  </div>

                  <div className="space-y-2">
                    <Label>Plan</Label>
                    <Select value={plan} onValueChange={setPlan}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="starter">Starter — Free</SelectItem>
                        <SelectItem value="pro">Pro — $19/mo</SelectItem>
                        <SelectItem value="scale">Scale — $79/mo</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Launch date</Label>
                    <DatePicker value={launchDate} onChange={setLaunchDate} />
                  </div>

                  <div className="space-y-2">
                    <Label>Verification code</Label>
                    <InputOTP maxLength={6}>
                      <InputOTPGroup>
                        <InputOTPSlot index={0} />
                        <InputOTPSlot index={1} />
                        <InputOTPSlot index={2} />
                      </InputOTPGroup>
                      <InputOTPSeparator />
                      <InputOTPGroup>
                        <InputOTPSlot index={3} />
                        <InputOTPSlot index={4} />
                        <InputOTPSlot index={5} />
                      </InputOTPGroup>
                    </InputOTP>
                  </div>
                </div>
              </div>

              {/* live preview card */}
              <div className="mt-2 rounded-lg border bg-muted/30 p-4">
                <p className="text-xs font-medium text-muted-foreground mb-2">Live preview</p>
                <div className="flex items-center gap-3">
                  <Avatar>
                    <AvatarFallback>
                      {name
                        .split(" ")
                        .map((n) => n[0])
                        .join("")
                        .slice(0, 2)
                        .toUpperCase() || "?"}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="text-sm font-medium">{name || "—"}</p>
                    <p className="text-xs text-muted-foreground">{email || "No email entered"}</p>
                  </div>
                  <Badge variant="secondary" className="ml-auto capitalize">
                    {plan}
                  </Badge>
                </div>
              </div>
            </Section>

            {/* ── Selection ─────────────────────────────────────────────── */}
            <Section id="selection" title="Selection Controls" description="Switch, checkbox, radio, toggle group, and slider — all stateful">
              <div className="grid gap-8 md:grid-cols-2">
                <div className="space-y-5">
                  <div className="space-y-2">
                    <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Switches</p>
                    {[
                      {
                        id: "sw-notifications",
                        label: "Team notifications",
                        desc: "Alerts for new activity",
                        value: notifications,
                        set: setNotifications,
                      },
                      {
                        id: "sw-previews",
                        label: "Auto-publish previews",
                        desc: "Publish on every push",
                        value: previews,
                        set: setPreviews,
                      },
                      {
                        id: "sw-marketing",
                        label: "Marketing emails",
                        desc: "Weekly digest",
                        value: marketing,
                        set: setMarketing,
                      },
                    ].map(({ id, label, desc, value, set }) => (
                      <div key={id} className="flex items-center justify-between gap-4 rounded-lg border p-3">
                        <div className="space-y-0.5 min-w-0">
                          <Label htmlFor={id} className="cursor-pointer text-sm">
                            {label}
                          </Label>
                          <p className="text-xs text-muted-foreground">{desc}</p>
                        </div>
                        <Switch id={id} checked={value} onCheckedChange={set} />
                      </div>
                    ))}
                  </div>

                  <div className="space-y-2">
                    <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Checkboxes</p>
                    <div className="flex items-start gap-3 rounded-lg border p-3">
                      <Checkbox
                        id="cb-terms"
                        checked={acceptTerms}
                        onCheckedChange={(v) => setAcceptTerms(!!v)}
                        className="mt-0.5"
                      />
                      <div>
                        <Label htmlFor="cb-terms" className="cursor-pointer text-sm leading-none">
                          Accept terms of service
                        </Label>
                        <p className="mt-1 text-xs text-muted-foreground">
                          You agree to our terms and privacy policy.
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 rounded-lg border p-3 opacity-50">
                      <Checkbox id="cb-disabled" disabled checked />
                      <Label htmlFor="cb-disabled" className="cursor-not-allowed text-sm">
                        Indeterminate (disabled)
                      </Label>
                    </div>
                  </div>
                </div>

                <div className="space-y-5">
                  <div className="space-y-2">
                    <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Radio group</p>
                    <RadioGroup value={frequency} onValueChange={setFrequency} className="space-y-2">
                      {[
                        { value: "daily", label: "Daily", desc: "Every 24 hours" },
                        { value: "weekly", label: "Weekly", desc: "Every Monday" },
                        { value: "monthly", label: "Monthly", desc: "1st of the month" },
                      ].map(({ value, label, desc }) => (
                        <div
                          key={value}
                          className="flex cursor-pointer items-center gap-3 rounded-lg border p-3"
                          onClick={() => setFrequency(value)}
                        >
                          <RadioGroupItem value={value} id={`freq-${value}`} />
                          <div>
                            <Label htmlFor={`freq-${value}`} className="cursor-pointer text-sm">
                              {label}
                            </Label>
                            <p className="text-xs text-muted-foreground">{desc}</p>
                          </div>
                        </div>
                      ))}
                    </RadioGroup>
                  </div>

                  <div className="space-y-3">
                    <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Toggle group</p>
                    <ToggleGroup
                      type="single"
                      value={density}
                      onValueChange={(v) => v && setDensity(v)}
                    >
                      <ToggleGroupItem value="compact">Compact</ToggleGroupItem>
                      <ToggleGroupItem value="comfortable">Comfortable</ToggleGroupItem>
                      <ToggleGroupItem value="spacious">Spacious</ToggleGroupItem>
                    </ToggleGroup>
                  </div>

                  <div className="space-y-3">
                    <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                      Slider — {sliderValue[0]}%
                    </p>
                    <Slider
                      value={sliderValue}
                      onValueChange={setSliderValue}
                      min={0}
                      max={100}
                      step={1}
                    />
                  </div>
                </div>
              </div>
            </Section>

            {/* ── Overlays ──────────────────────────────────────────────── */}
            <Section id="overlays" title="Overlays" description="Dialog, sheet, drawer, popover, tooltip, and hover card">
              <div className="flex flex-wrap gap-3">
                <Dialog>
                  <DialogTrigger asChild>
                    <Button>Open dialog</Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Invite a teammate</DialogTitle>
                      <DialogDescription>
                        They&apos;ll receive an email to join your workspace.
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-3 py-2">
                      <Input placeholder="name@company.com" />
                      <Select defaultValue="member">
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="admin">Admin</SelectItem>
                          <SelectItem value="member">Member</SelectItem>
                          <SelectItem value="viewer">Viewer</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <DialogFooter>
                      <Button variant="secondary">Cancel</Button>
                      <Button onClick={() => toast("Invite sent!")}>Send invite</Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>

                <Sheet>
                  <SheetTrigger asChild>
                    <Button variant="outline">Open sheet</Button>
                  </SheetTrigger>
                  <SheetContent>
                    <SheetHeader>
                      <SheetTitle>Workspace settings</SheetTitle>
                      <SheetDescription>Adjust preferences for this workspace.</SheetDescription>
                    </SheetHeader>
                    <div className="px-4 space-y-3">
                      {["Enable previews", "Send updates", "Auto-publish"].map((label, i) => (
                        <div key={label} className="flex items-center justify-between rounded-lg border p-3">
                          <Label className="text-sm">{label}</Label>
                          <Switch defaultChecked={i === 0} />
                        </div>
                      ))}
                    </div>
                    <SheetFooter>
                      <Button onClick={() => toast("Settings saved")}>Save changes</Button>
                    </SheetFooter>
                  </SheetContent>
                </Sheet>

                <Drawer>
                  <DrawerTrigger asChild>
                    <Button variant="secondary">Open drawer</Button>
                  </DrawerTrigger>
                  <DrawerContent>
                    <DrawerHeader className="pb-0">
                      <div className="flex items-center justify-between">
                        <div>
                          <DrawerTitle>Notifications</DrawerTitle>
                          <DrawerDescription>You have 3 unread messages.</DrawerDescription>
                        </div>
                        <Badge variant="default" className="rounded-full px-2 text-xs">3 new</Badge>
                      </div>
                    </DrawerHeader>
                    <div className="px-4 pt-3 pb-1">
                      <Tabs defaultValue="all">
                        <TabsList variant="line" className="mb-3">
                          <TabsTrigger value="all">All</TabsTrigger>
                          <TabsTrigger value="mentions">Mentions</TabsTrigger>
                          <TabsTrigger value="updates">Updates</TabsTrigger>
                        </TabsList>
                        <TabsContent value="all">
                          <div className="space-y-2">
                            {[
                              { initials: "SR", name: "Sofia R.", action: "approved your PR", detail: "feat/dark-mode → main", time: "2 min ago", unread: true, color: "bg-violet-500" },
                              { initials: "TK", name: "Tom K.", action: "left a comment", detail: "\"Looks good, minor nit on line 42\"", time: "18 min ago", unread: true, color: "bg-sky-500" },
                              { initials: "AM", name: "Ava M.", action: "assigned you to", detail: "Fix navigation overflow #318", time: "1 hr ago", unread: true, color: "bg-emerald-500" },
                              { initials: "CI", name: "CI Pipeline", action: "build succeeded", detail: "main · 47 checks passed", time: "2 hr ago", unread: false, color: "bg-muted" },
                            ].map(({ initials, name, action, detail, time, unread, color }) => (
                              <div key={name} className={`flex items-start gap-3 rounded-lg p-3 transition-colors hover:bg-muted/50 ${unread ? "bg-muted/30" : ""}`}>
                                <div className={`flex size-8 shrink-0 items-center justify-center rounded-full text-xs font-semibold text-white ${color}`}>
                                  {initials}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <p className="text-sm leading-snug">
                                    <span className="font-medium">{name}</span>
                                    <span className="text-muted-foreground"> {action}</span>
                                  </p>
                                  <p className="mt-0.5 truncate text-xs text-muted-foreground">{detail}</p>
                                </div>
                                <div className="flex shrink-0 items-center gap-1.5">
                                  <span className="text-xs text-muted-foreground whitespace-nowrap">{time}</span>
                                  {unread && <span className="size-1.5 rounded-full bg-primary" />}
                                </div>
                              </div>
                            ))}
                          </div>
                        </TabsContent>
                        <TabsContent value="mentions">
                          <div className="py-8 text-center text-sm text-muted-foreground">No new mentions</div>
                        </TabsContent>
                        <TabsContent value="updates">
                          <div className="py-8 text-center text-sm text-muted-foreground">All caught up</div>
                        </TabsContent>
                      </Tabs>
                    </div>
                    <DrawerFooter className="pt-2">
                      <div className="flex gap-2">
                        <Button variant="outline" className="flex-1" onClick={() => toast("Marked all as read")}>Mark all as read</Button>
                        <Button className="flex-1" onClick={() => toast("Opening inbox…")}>View all</Button>
                      </div>
                    </DrawerFooter>
                  </DrawerContent>
                </Drawer>

                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="ghost">Popover</Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-60 space-y-2">
                    <p className="text-sm font-medium">Preview details</p>
                    <Muted>Popover content from the shared library.</Muted>
                    <Button size="sm" variant="outline" className="w-full">
                      View details
                    </Button>
                  </PopoverContent>
                </Popover>

                <HoverCard>
                  <HoverCardTrigger asChild>
                    <Button variant="link">Hover card</Button>
                  </HoverCardTrigger>
                  <HoverCardContent className="w-64 space-y-3">
                    <div className="flex items-center gap-3">
                      <Avatar>
                        <AvatarFallback>AV</AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="text-sm font-medium">Ava Patel</p>
                        <Muted>Product design lead</Muted>
                      </div>
                    </div>
                  </HoverCardContent>
                </HoverCard>

                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button variant="outline" size="icon">
                      <Bell />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Notifications</TooltipContent>
                </Tooltip>
              </div>
            </Section>

            {/* ── Navigation ────────────────────────────────────────────── */}
            <Section id="navigation" title="Navigation" description="Tabs, command palette, menubar, pagination, and accordion">
              <div className="space-y-6">
                <Tabs defaultValue="overview">
                  <TabsList>
                    <TabsTrigger value="overview">Overview</TabsTrigger>
                    <TabsTrigger value="activity">Activity</TabsTrigger>
                    <TabsTrigger value="settings">Settings</TabsTrigger>
                  </TabsList>
                  <TabsContent value="overview" className="mt-4">
                    <div className="grid gap-3 sm:grid-cols-3">
                      {[
                        { label: "Components", value: "60+" },
                        { label: "Exports", value: "120+" },
                        { label: "Coverage", value: `${sliderValue[0]}%` },
                      ].map(({ label, value }) => (
                        <div key={label} className="rounded-lg border p-4">
                          <p className="text-2xl font-semibold">{value}</p>
                          <p className="text-sm text-muted-foreground">{label}</p>
                        </div>
                      ))}
                    </div>
                  </TabsContent>
                  <TabsContent value="activity" className="mt-4">
                    <Muted>Recent activity feed would appear here.</Muted>
                  </TabsContent>
                  <TabsContent value="settings" className="mt-4">
                    <Muted>Workspace settings panel.</Muted>
                  </TabsContent>
                </Tabs>

                <div className="space-y-2">
                  <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                    Command palette
                  </p>
                  <Command className="max-w-md rounded-xl border">
                    <CommandInput
                      placeholder="Search projects, people…"
                      value={searchQuery}
                      onValueChange={setSearchQuery}
                    />
                    <CommandList>
                      <CommandEmpty>No results for &quot;{searchQuery}&quot;</CommandEmpty>
                      <CommandGroup heading="Projects">
                        {["Studio workspace", "Mortgage flow", "Design sync"].map((item) => (
                          <CommandItem key={item}>{item}</CommandItem>
                        ))}
                      </CommandGroup>
                      <CommandGroup heading="People">
                        {["Ava Patel", "Liam Chen", "Mia Wong"].map((person) => (
                          <CommandItem key={person}>{person}</CommandItem>
                        ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </div>

                <div className="flex flex-wrap items-center gap-4">
                  <Menubar>
                    <MenubarMenu>
                      <MenubarTrigger>File</MenubarTrigger>
                      <MenubarContent>
                        <MenubarItem>New canvas</MenubarItem>
                        <MenubarItem>Export</MenubarItem>
                      </MenubarContent>
                    </MenubarMenu>
                    <MenubarMenu>
                      <MenubarTrigger>Edit</MenubarTrigger>
                      <MenubarContent>
                        <MenubarItem>Duplicate</MenubarItem>
                        <MenubarItem>Archive</MenubarItem>
                      </MenubarContent>
                    </MenubarMenu>
                    <MenubarMenu>
                      <MenubarTrigger>View</MenubarTrigger>
                      <MenubarContent>
                        <MenubarItem>Board</MenubarItem>
                        <MenubarItem>Timeline</MenubarItem>
                      </MenubarContent>
                    </MenubarMenu>
                  </Menubar>

                  <Pagination>
                    <PaginationContent>
                      <PaginationItem>
                        <PaginationPrevious href="#" />
                      </PaginationItem>
                      {[1, 2, 3].map((p) => (
                        <PaginationItem key={p}>
                          <PaginationLink href="#" isActive={p === 1}>
                            {p}
                          </PaginationLink>
                        </PaginationItem>
                      ))}
                      <PaginationItem>
                        <PaginationNext href="#" />
                      </PaginationItem>
                    </PaginationContent>
                  </Pagination>
                </div>

                <Accordion type="single" collapsible className="w-full rounded-xl border px-4">
                  <AccordionItem value="q1">
                    <AccordionTrigger>What changed in this showcase?</AccordionTrigger>
                    <AccordionContent>
                      The sidebar now wraps the entire page so collapsing actually works. All inputs
                      are controlled with live state, and spacing follows the same scale across every
                      section.
                    </AccordionContent>
                  </AccordionItem>
                  <AccordionItem value="q2">
                    <AccordionTrigger>Where do the components come from?</AccordionTrigger>
                    <AccordionContent>
                      Everything is imported from{" "}
                      <code className="rounded bg-muted px-1 font-mono text-xs">@beta-epic/ui</code>,
                      the shared package in <code className="rounded bg-muted px-1 font-mono text-xs">packages/ui</code>.
                      Nothing is defined locally in the web app.
                    </AccordionContent>
                  </AccordionItem>
                </Accordion>
              </div>
            </Section>

            {/* ── Data ──────────────────────────────────────────────────── */}
            <Section id="data" title="Data & Analytics" description="Chart, data table, and keyboard shortcuts">
              <div className="space-y-5">
                <ChartContainer config={chartConfig} className="h-48 w-full">
                  <BarChart data={chartData}>
                    <XAxis dataKey="week" tickLine={false} axisLine={false} className="text-xs" />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Bar dataKey="shipped" fill="var(--color-shipped)" radius={4} />
                  </BarChart>
                </ChartContainer>

                <DataTable columns={tableColumns} data={ticketRows} />

                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <span>Quick search</span>
                  <Kbd>⌘</Kbd>
                  <Kbd>K</Kbd>
                  <span className="mx-2">·</span>
                  <span>Toggle sidebar</span>
                  <Kbd>⌘</Kbd>
                  <Kbd>B</Kbd>
                </div>
              </div>
            </Section>

            {/* ── Feedback ──────────────────────────────────────────────── */}
            <Section id="feedback" title="Feedback & Status" description="Alerts, badges, avatars, spinner, and skeletons">
              <div className="grid gap-6 md:grid-cols-2">
                <div className="space-y-3">
                  <Alert>
                    <Check className="size-4" />
                    <AlertTitle>Deployment successful</AlertTitle>
                    <AlertDescription>
                      Preview is live at studio.beta-epic.dev
                    </AlertDescription>
                  </Alert>
                  <Alert variant="destructive">
                    <AlertTitle>Build failed</AlertTitle>
                    <AlertDescription>
                      3 type errors in packages/ui. Check the logs.
                    </AlertDescription>
                  </Alert>
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between text-sm">
                      <span>Library coverage</span>
                      <span className="text-muted-foreground">{sliderValue[0]}%</span>
                    </div>
                    <Progress value={sliderValue[0]} />
                    <p className="text-xs text-muted-foreground">
                      Drag the slider in Selection to update
                    </p>
                  </div>
                </div>

                <div className="space-y-5">
                  <div>
                    <p className="mb-3 text-xs font-medium uppercase tracking-wider text-muted-foreground">
                      Badges
                    </p>
                    <div className="flex flex-wrap gap-2">
                      <Badge>Default</Badge>
                      <Badge variant="secondary">Secondary</Badge>
                      <Badge variant="outline">Outline</Badge>
                      <Badge variant="destructive">Destructive</Badge>
                    </div>
                  </div>

                  <div>
                    <p className="mb-3 text-xs font-medium uppercase tracking-wider text-muted-foreground">
                      Avatars & loading
                    </p>
                    <div className="flex items-center gap-3 mb-3">
                      {["AV", "LM", "MI"].map((initials) => (
                        <Avatar key={initials}>
                          <AvatarFallback>{initials}</AvatarFallback>
                        </Avatar>
                      ))}
                      <Spinner />
                    </div>
                    <div className="space-y-2">
                      <Skeleton className="h-4 w-2/3" />
                      <Skeleton className="h-4 w-1/2" />
                      <Skeleton className="h-4 w-3/4" />
                    </div>
                  </div>
                </div>
              </div>
            </Section>
          </main>
        </SidebarInset>
      </SidebarProvider>
    </TooltipProvider>
  )
}

// ─── AppSidebar ───────────────────────────────────────────────────────────────

function AppSidebar({
  activeSection,
  onSectionChange,
}: {
  activeSection: string
  onSectionChange: (id: string) => void
}) {
  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="border-b px-3 py-3">
        <div className="flex items-center gap-2 overflow-hidden">
          <div className="flex size-7 shrink-0 items-center justify-center rounded-md bg-primary font-bold text-primary-foreground text-xs">
            β
          </div>
          <span className="truncate font-semibold text-sm group-data-[collapsible=icon]:hidden">
            Beta Epic
          </span>
        </div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Components</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {navSections.map(({ id, label, icon: Icon }) => (
                <SidebarMenuItem key={id}>
                  <SidebarMenuButton asChild isActive={activeSection === id}>
                    <a
                      href={`#${id}`}
                      onClick={() => onSectionChange(id)}
                    >
                      <Icon className="size-4" />
                      <span>{label}</span>
                    </a>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="border-t p-3">
        <div className="flex items-center gap-2 overflow-hidden group-data-[collapsible=icon]:justify-center">
          <Avatar className="size-7 shrink-0">
            <AvatarFallback className="text-xs">AV</AvatarFallback>
          </Avatar>
          <div className="min-w-0 group-data-[collapsible=icon]:hidden">
            <p className="truncate text-xs font-medium">Ava Patel</p>
            <p className="truncate text-xs text-muted-foreground">ava@beta-epic.dev</p>
          </div>
        </div>
      </SidebarFooter>
    </Sidebar>
  )
}

// ─── Section wrapper ──────────────────────────────────────────────────────────

function Section({
  id,
  title,
  description,
  children,
}: {
  id: string
  title: string
  description?: string
  children: React.ReactNode
}) {
  return (
    <section id={id} className="scroll-mt-16">
      <Card>
        <CardHeader className="border-b bg-muted/20 pb-4">
          <CardTitle className="text-base">{title}</CardTitle>
          {description && <CardDescription>{description}</CardDescription>}
        </CardHeader>
        <CardContent className="p-5 md:p-6">{children}</CardContent>
      </Card>
    </section>
  )
}

// ─── Row helper ───────────────────────────────────────────────────────────────

function Row({
  label,
  children,
}: {
  label: string
  children: React.ReactNode
}) {
  return (
    <div>
      <p className="mb-2.5 text-xs font-medium uppercase tracking-wider text-muted-foreground">
        {label}
      </p>
      <div className="flex flex-wrap items-center gap-2">{children}</div>
    </div>
  )
}
