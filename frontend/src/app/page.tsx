"use client";

import { useMemo, useState } from "react";
import {
  Moon,
  Sun,
  Layers,
  Table as TableIcon,
  CreditCard,
  TrendingUp,
  Users,
  ArrowUpRight,
  ShieldCheck,
  CheckCircle2,
  Sparkles,
} from "lucide-react";

import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { KpiCard } from "@/components/kpi-card";
import { DataTable, type DataTableColumn } from "@/components/data-table";
import { StatusBadge } from "@/components/status-badge";
import { useTheme } from "@/components/theme-provider";

interface SampleRecord {
  id: string;
  name: string;
  category: string;
  amount: string;
  status: string;
  date: string;
}

const SAMPLE_DATA: SampleRecord[] = [
  { id: "REC-1001", name: "Enterprise Cloud Subscription", category: "Software", amount: "$12,450.00", status: "Paid", date: "2026-09-15" },
  { id: "REC-1002", name: "High-Performance Workstations", category: "Hardware", amount: "$8,900.00", status: "Approved", date: "2026-09-18" },
  { id: "REC-1003", name: "Global CDN & Bandwidth", category: "Infrastructure", amount: "$3,240.50", status: "Received", date: "2026-09-20" },
  { id: "REC-1004", name: "Security Audit & Pen-Testing", category: "Services", amount: "$15,000.00", status: "Draft", date: "2026-09-21" },
  { id: "REC-1005", name: "Design System Architecture", category: "Consulting", amount: "$6,800.00", status: "Completed", date: "2026-09-22" },
  { id: "REC-1006", name: "Managed Database Cluster", category: "Database", amount: "$4,120.00", status: "Active", date: "2026-09-23" },
  { id: "REC-1007", name: "Dedicated Optical Line", category: "Networking", amount: "$2,850.00", status: "Partially Paid", date: "2026-09-24" },
  { id: "REC-1008", name: "Compliance Verification Service", category: "Legal", amount: "$5,300.00", status: "Submitted", date: "2026-09-25" },
];

export default function HomePage() {
  const theme = useTheme();
  const [selectedRecord, setSelectedRecord] = useState<SampleRecord | null>(null);

  const columns: DataTableColumn<SampleRecord>[] = useMemo(
    () => [
      {
        key: "id",
        label: "Record ID",
        sortable: true,
        primaryMobile: true,
        render: (row) => <span className="font-mono text-xs font-semibold text-primary-600 dark:text-primary-400">{row.id}</span>,
      },
      {
        key: "name",
        label: "Item Name",
        sortable: true,
        render: (row) => <span className="font-medium text-foreground">{row.name}</span>,
      },
      {
        key: "category",
        label: "Category",
        sortable: true,
        hideOnMobile: true,
        render: (row) => <Badge variant="secondary">{row.category}</Badge>,
      },
      {
        key: "amount",
        label: "Amount",
        sortable: true,
        render: (row) => <span className="font-mono font-semibold">{row.amount}</span>,
      },
      {
        key: "status",
        label: "Status",
        sortable: true,
        render: (row) => <StatusBadge status={row.status} />,
      },
      {
        key: "date",
        label: "Date",
        sortable: true,
        hideOnMobile: true,
        render: (row) => <span className="text-muted-foreground">{row.date}</span>,
      },
    ],
    []
  );

  return (
    <main className="min-h-screen bg-background text-foreground transition-colors duration-200">
      {/* Top Header */}
      <header className="sticky top-0 z-40 border-b border-border bg-card/80 backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-primary-foreground shadow-sm">
              <Layers className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-lg font-bold tracking-tight">Design System UI Starter</h1>
              <p className="text-xs text-muted-foreground">Tokens, Typography, Cards, and Data Tables</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => theme?.toggleTheme()}
              className="flex items-center gap-2"
            >
              {theme?.darkMode ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
              <span>{theme?.darkMode ? "Light Mode" : "Dark Mode"}</span>
            </Button>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <div className="mx-auto max-w-7xl space-y-8 px-4 py-8 sm:px-6">
        {/* Hero Section */}
        <section className="rounded-2xl border border-border bg-gradient-to-br from-card via-card to-primary-50/30 p-6 shadow-sm dark:to-primary-950/20 sm:p-8">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="space-y-2">
              <div className="inline-flex items-center gap-2 rounded-full border border-primary-200 bg-primary-50 px-3 py-1 text-xs font-semibold text-primary-700 dark:border-primary-800 dark:bg-primary-900/40 dark:text-primary-300">
                <Sparkles className="h-3.5 w-3.5" />
                Tailwind CSS v4 &bull; Shadcn Base Nova &bull; Design Tokens
              </div>
              <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
                Predefined Component & Token Showcase
              </h2>
              <p className="max-w-2xl text-base text-muted-foreground">
                Configured with clean design tokens, custom typography scales, elevation shadows,
                and production-ready Card & Data Table primitives.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <Button variant="default">Primary Action</Button>
              <Button variant="outline">Documentation</Button>
            </div>
          </div>
        </section>

        {/* KPI Metrics Grid */}
        <section className="space-y-3">
          <h3 className="text-sm font-semibold tracking-wider text-muted-foreground uppercase">
            Metrics & KPI Cards
          </h3>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <KpiCard
              title="Total Processed"
              value="$48,460.50"
              subtitle="+14.2% from previous month"
              icon={TrendingUp}
            />
            <KpiCard
              title="Active Accounts"
              value="1,248"
              subtitle="99.4% retention rate"
              icon={Users}
            />
            <KpiCard
              title="Verified Records"
              value="8,920"
              subtitle="All systems synchronized"
              icon={ShieldCheck}
            />
            <KpiCard
              title="Completion Rate"
              value="98.7%"
              subtitle="Automated ledger reconciliation"
              icon={CheckCircle2}
            />
          </div>
        </section>

        {/* Card Component Variations */}
        <section className="space-y-3">
          <div className="flex items-center gap-2">
            <CreditCard className="h-5 w-5 text-primary" />
            <h3 className="text-sm font-semibold tracking-wider text-muted-foreground uppercase">
              Predefined Card Primitives
            </h3>
          </div>

          <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
            <Card>
              <CardHeader>
                <CardTitle>Standard Card</CardTitle>
                <CardDescription>Default size with clean border ring and header.</CardDescription>
                <CardAction>
                  <Badge variant="outline">Default</Badge>
                </CardAction>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Cards use semantic tokens (`bg-card`, `text-card-foreground`, `ring-1 ring-foreground/10`)
                  with consistent internal spacing.
                </p>
              </CardContent>
              <CardFooter className="justify-between">
                <span className="text-xs text-muted-foreground">Updated just now</span>
                <Button size="sm" variant="outline">
                  Action
                </Button>
              </CardFooter>
            </Card>

            <Card size="sm">
              <CardHeader>
                <CardTitle>Compact Card (sm)</CardTitle>
                <CardDescription>Dense layout using `--spacing(3)`.</CardDescription>
                <CardAction>
                  <Badge variant="secondary">Compact</Badge>
                </CardAction>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Perfect for toolbars, sidebars, and dense metric displays where vertical real estate is limited.
                </p>
              </CardContent>
              <CardFooter className="justify-end gap-2">
                <Button size="sm" variant="ghost">Cancel</Button>
                <Button size="sm">Save</Button>
              </CardFooter>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Interactive Action Card</CardTitle>
                <CardDescription>With primary focus and footer controls.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="rounded-lg border border-border bg-surface-container p-3">
                  <p className="font-mono text-xs font-semibold text-primary">Surface Container</p>
                  <p className="text-xs text-muted-foreground">Uses M3 tiered surface tokens for elevation hierarchy.</p>
                </div>
              </CardContent>
              <CardFooter className="justify-between">
                <span className="inline-flex items-center gap-1 text-xs text-primary font-medium">
                  Active Token <ArrowUpRight className="h-3 w-3" />
                </span>
                <Button size="sm" variant="default">
                  Explore
                </Button>
              </CardFooter>
            </Card>
          </div>
        </section>

        {/* Data Table Section */}
        <section className="space-y-3">
          <div className="flex items-center gap-2">
            <TableIcon className="h-5 w-5 text-primary" />
            <h3 className="text-sm font-semibold tracking-wider text-muted-foreground uppercase">
              Predefined Reusable Data Table
            </h3>
          </div>

          <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
            <div className="mb-4">
              <h4 className="text-lg font-semibold">Interactive Data Grid</h4>
              <p className="text-sm text-muted-foreground">
                Features live client-side search, sortable headers, status badge mapping, pagination, and mobile card view.
              </p>
            </div>

            <DataTable
              columns={columns}
              data={SAMPLE_DATA}
              searchPlaceholder="Search records by name, ID, or amount..."
              pageSize={5}
              onRowClick={(row) => setSelectedRecord(row)}
            />

            {selectedRecord && (
              <div className="mt-4 rounded-lg border border-primary-200 bg-primary-50/50 p-4 dark:border-primary-900/50 dark:bg-primary-950/20">
                <p className="text-xs font-semibold text-primary-700 dark:text-primary-300">
                  Clicked Row Event:
                </p>
                <p className="mt-1 font-mono text-sm">
                  {selectedRecord.id} &bull; {selectedRecord.name} &bull; {selectedRecord.amount} ({selectedRecord.status})
                </p>
              </div>
            )}
          </div>
        </section>

        {/* Design System Token Overview */}
        <section className="space-y-4">
          <h3 className="text-sm font-semibold tracking-wider text-muted-foreground uppercase">
            Color Palette & Surface Tiers
          </h3>

          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4 lg:grid-cols-6">
            <div className="rounded-xl border border-border p-3">
              <div className="h-10 rounded-lg bg-primary-600 mb-2"></div>
              <p className="text-xs font-semibold">Primary Core</p>
              <p className="font-mono text-xs text-muted-foreground">#2563eb (600)</p>
            </div>
            <div className="rounded-xl border border-border p-3">
              <div className="h-10 rounded-lg bg-primary-50 border border-primary-200 mb-2"></div>
              <p className="text-xs font-semibold">Primary 50</p>
              <p className="font-mono text-xs text-muted-foreground">#eff6ff</p>
            </div>
            <div className="rounded-xl border border-border p-3">
              <div className="h-10 rounded-lg bg-emerald-500 mb-2"></div>
              <p className="text-xs font-semibold">Success</p>
              <p className="font-mono text-xs text-muted-foreground">#059669</p>
            </div>
            <div className="rounded-xl border border-border p-3">
              <div className="h-10 rounded-lg bg-amber-500 mb-2"></div>
              <p className="text-xs font-semibold">Warning</p>
              <p className="font-mono text-xs text-muted-foreground">#d97706</p>
            </div>
            <div className="rounded-xl border border-border p-3">
              <div className="h-10 rounded-lg bg-destructive mb-2"></div>
              <p className="text-xs font-semibold">Destructive</p>
              <p className="font-mono text-xs text-muted-foreground">#dc2626</p>
            </div>
            <div className="rounded-xl border border-border p-3">
              <div className="h-10 rounded-lg bg-muted border border-border mb-2"></div>
              <p className="text-xs font-semibold">Surface Muted</p>
              <p className="font-mono text-xs text-muted-foreground">#f8fafc / #1e293b</p>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
