"use client";

import {
  Bell,
  Boxes,
  ChevronDown,
  LogOut,
  Menu,
  Plus,
  Save,
  Search,
  SlidersHorizontal,
  UserRound,
} from "lucide-react";
import Link from "next/link";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { stockApi } from "@/lib/stock-api";
import { Button } from "@/components/ui/button";

interface WarehouseHeaderProps {
  onSave?: () => void;
}

const navigation = [
  { label: "Dashboard", href: "/dashboard" },
  {
    label: "Operations",
    items: [
      { label: "Receipt", href: "/operations/receipts" },
      { label: "Delivery", href: "/operations/deliveries" },
      { label: "Adjustment", href: "/operations/adjustments" },
    ],
  },
  { label: "Products", href: "/products" },
  { label: "Stock", href: "/stock" },
  { label: "Move History", href: "/moves" },
  {
    label: "Settings",
    items: [
      { label: "Warehouse", href: "/settings/warehouses" },
      { label: "Locations", href: "/settings/locations" },
    ],
  },
];

function NavigationItems({ mobile = false }: { mobile?: boolean }) {
  return (
    <>
      {navigation.map((item) =>
        "items" in item && item.items ? (
          <details key={item.label} className={mobile ? "group" : "group relative"}>
            <summary
              className={`flex cursor-pointer list-none items-center gap-1 rounded-md px-2.5 py-1.5 text-sm font-medium transition-colors marker:hidden [&::-webkit-details-marker]:hidden ${
                item.label === "Settings"
                  ? "bg-accent text-accent-foreground"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              }`}
            >
              {item.label}
              <ChevronDown className="size-3.5 transition-transform group-open:rotate-180" />
            </summary>
            <div
              className={`z-30 mt-1 min-w-44 rounded-lg border border-border bg-popover p-1 text-popover-foreground shadow-m3-2 ${
                mobile ? "ml-3" : "absolute left-0 top-full"
              }`}
            >
              {item.items.map((child) => (
                <Link
                  key={child.href}
                  href={child.href}
                  className="block rounded-md px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
                >
                  {child.label}
                </Link>
              ))}
            </div>
          </details>
        ) : (
          <Link
            key={item.label}
            href={item.href}
            className="flex items-center rounded-md px-2.5 py-1.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            {item.label}
          </Link>
        ),
      )}
    </>
  );
}

function ProfileMenu({ onLogout }: { onLogout: () => void }) {
  const session = useQuery({ queryKey: ["auth", "me"], queryFn: stockApi.me, retry: false });
  const user = session.data?.user;
  return (
    <details className="group relative hidden sm:block">
      <summary className="flex cursor-pointer list-none items-center gap-2 rounded-md p-1 transition-colors hover:bg-muted marker:hidden [&::-webkit-details-marker]:hidden">
        <span className="grid size-7 place-items-center rounded-full bg-secondary font-mono text-[11px] font-semibold">
          {(user?.name ?? "User").split(/\s+/).map((part) => part[0]).join("").slice(0, 2).toUpperCase()}
        </span>
        <span className="hidden text-left lg:block">
          <span className="block text-xs font-medium leading-none">{user?.name ?? "StockSense user"}</span>
          <span className="mt-1 block font-mono text-[10px] text-muted-foreground">{user?.role ?? "—"}</span>
        </span>
        <ChevronDown className="size-3.5 text-muted-foreground" />
      </summary>
      <div className="absolute right-0 top-full z-30 mt-2 w-44 rounded-lg border border-border bg-popover p-1 text-popover-foreground shadow-m3-2">
        <Link
          href="/profile"
          className="flex items-center gap-2 rounded-md px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
        >
          <UserRound className="size-4" /> My Profile
        </Link>
        <button type="button" onClick={onLogout} className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground">
          <LogOut className="size-4" /> Logout
        </button>
      </div>
    </details>
  );
}

export function WarehouseHeader({ onSave }: WarehouseHeaderProps) {
  const router = useRouter();
  const queryClient = useQueryClient();
  async function logout() {
    try { await stockApi.logout(); } catch { /* Still return to login if the API is unavailable. */ }
    queryClient.clear();
    router.replace("/login");
    router.refresh();
  }
  return (
    <>
      <header className="border-b border-border bg-card/95 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-[1520px] items-center justify-between gap-3 px-4 sm:px-6">
          <div className="flex min-w-0 items-center gap-3 lg:gap-5">
            <Link
              href="/dashboard"
              className="grid size-8 shrink-0 place-items-center rounded-lg bg-primary text-primary-foreground shadow-sm"
              aria-label="StockSense home"
            >
              <Boxes className="size-4" />
            </Link>
            <div className="hidden items-center gap-2 sm:flex">
              <span className="whitespace-nowrap text-lg font-semibold tracking-tight">StockSense</span>
              <span className="rounded-md border border-border px-1.5 py-0.5 font-mono text-xs text-muted-foreground">
                Warehouse
              </span>
            </div>
            <nav className="hidden items-center gap-0.5 xl:flex" aria-label="Main navigation">
              <NavigationItems />
            </nav>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            <label className="relative hidden w-56 lg:block">
              <Search className="absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <input
                className="h-8 w-full rounded-md bg-muted pl-8 pr-10 text-xs outline-none ring-primary-500/40 transition focus:bg-card focus:ring-2"
                placeholder="Search SKU, Bin..."
                aria-label="Search SKU or bin"
              />
              <kbd className="absolute right-2 top-1/2 -translate-y-1/2 rounded border border-border bg-card px-1 font-mono text-[10px] text-muted-foreground">
                ⌘K
              </kbd>
            </label>
            <button
              type="button"
              className="relative grid size-8 place-items-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground"
              aria-label="Notifications"
            >
              <Bell className="size-4" />
              <span className="absolute right-1.5 top-1.5 size-1.5 rounded-full bg-primary" />
            </button>
            <div className="hidden h-5 w-px bg-border sm:block" />
            <ProfileMenu onLogout={() => void logout()} />
            <details className="group relative xl:hidden">
              <summary className="grid size-8 cursor-pointer list-none place-items-center rounded-md transition-colors hover:bg-muted marker:hidden [&::-webkit-details-marker]:hidden" aria-label="Open navigation">
                <Menu className="size-4" />
              </summary>
              <nav
                className="absolute right-0 top-full z-30 mt-2 max-h-[75vh] w-64 overflow-y-auto rounded-lg border border-border bg-popover p-2 text-popover-foreground shadow-m3-2"
                aria-label="Mobile navigation"
              >
                <NavigationItems mobile />
                <div className="my-2 border-t border-border" />
                <Link href="/profile" className="block rounded-md px-2.5 py-1.5 text-sm text-muted-foreground hover:bg-accent hover:text-accent-foreground">My Profile</Link>
                <button type="button" onClick={() => void logout()} className="block w-full rounded-md px-2.5 py-1.5 text-left text-sm text-muted-foreground hover:bg-accent hover:text-accent-foreground">Logout</button>
              </nav>
            </details>
          </div>
        </div>
      </header>

      {onSave && <div className="border-b border-border bg-card">
        <div className="mx-auto flex min-h-14 max-w-[1520px] flex-wrap items-center justify-between gap-3 px-4 py-2 sm:px-6">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <SlidersHorizontal className="size-3.5" />
            <span className="hidden sm:inline">Settings</span>
            <span className="hidden text-border sm:inline">/</span>
            <span>Locations &amp; Bins</span>
            <span className="text-border">/</span>
            <span className="rounded bg-secondary px-2 py-1 font-mono text-foreground">WH/Stock1</span>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" className="text-muted-foreground">Discard</Button>
            <Button variant="outline" size="sm" className="hidden sm:inline-flex"><Plus /> New Location</Button>
            <Button size="sm" onClick={onSave}><Save /> Save Location</Button>
          </div>
        </div>
      </div>}
    </>
  );
}
