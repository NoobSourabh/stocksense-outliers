"use client";

import { useEffect, useRef } from "react";
import {
  Boxes,
  ChevronDown,
  LogOut,
  Menu,
  UserRound,
} from "lucide-react";
import Link from "next/link";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { usePathname, useRouter } from "next/navigation";
import { stockApi } from "@/lib/stock-api";

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
  const pathname = usePathname();
  const isCurrent = (href: string) => pathname === href || pathname.startsWith(`${href}/`);
  return (
    <>
      {navigation.map((item) =>
        "items" in item && item.items ? (
          <details key={item.label} className={mobile ? "group" : "group relative"} open={item.items.some((child) => isCurrent(child.href))}>
            <summary
                className={`flex cursor-pointer list-none items-center gap-1 rounded-md px-2.5 ${mobile ? "py-2.5" : "py-1.5"} text-sm font-medium transition-colors marker:hidden [&::-webkit-details-marker]:hidden ${
                item.items.some((child) => isCurrent(child.href))
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
                  aria-current={isCurrent(child.href) ? "page" : undefined}
                  className={`block rounded-md px-3 ${mobile ? "py-2.5" : "py-2"} text-sm transition-colors hover:bg-accent hover:text-accent-foreground ${isCurrent(child.href) ? "bg-accent font-medium text-accent-foreground" : "text-muted-foreground"}`}
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
            aria-current={isCurrent(item.href) ? "page" : undefined}
            className={`flex items-center rounded-md px-2.5 ${mobile ? "py-2.5" : "py-1.5"} text-sm font-medium transition-colors hover:bg-muted hover:text-foreground ${isCurrent(item.href) ? "bg-accent text-accent-foreground" : "text-muted-foreground"}`}
          >
            {item.label}
          </Link>
        ),
      )}
    </>
  );
}

function ProfileMenu({ onLogout }: { onLogout: () => void }) {
  const detailsRef = useRef<HTMLDetailsElement>(null);
  const session = useQuery({ queryKey: ["auth", "me"], queryFn: stockApi.me, retry: false });
  const user = session.data?.user;

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (detailsRef.current && !detailsRef.current.contains(event.target as Node)) {
        detailsRef.current.removeAttribute("open");
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const initials = (user?.name ?? "User")
    .trim()
    .split(/\s+/)
    .map((part) => part[0])
    .filter(Boolean)
    .join("")
    .slice(0, 2)
    .toUpperCase() || "U";

  const roleLabel = user?.role
    ? user.role.charAt(0).toUpperCase() + user.role.slice(1).toLowerCase()
    : "Staff";

  return (
    <details ref={detailsRef} className="group relative hidden sm:block">
      <summary className="flex cursor-pointer list-none items-center gap-2.5 rounded-lg border border-transparent px-2 py-1 transition-all duration-150 hover:border-border/60 hover:bg-muted/70 active:scale-[0.99] select-none marker:hidden [&::-webkit-details-marker]:hidden focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
        <div className="relative flex size-8 shrink-0 items-center justify-center rounded-full bg-primary/10 font-sans font-semibold text-xs text-primary ring-1 ring-border/80 shadow-xs transition-transform group-hover:scale-105">
          {initials}
          <span className="absolute -bottom-0.5 -right-0.5 size-2 rounded-full bg-emerald-500 ring-2 ring-card" aria-hidden="true" />
        </div>
        <div className="hidden text-left lg:flex lg:flex-col lg:justify-center">
          <span className="max-w-[130px] truncate text-[13px] font-semibold leading-tight text-foreground transition-colors group-hover:text-primary">
            {user?.name ?? "StockSense user"}
          </span>
          <span className="mt-0.5 flex items-center gap-1.5 text-[11px] font-medium capitalize text-muted-foreground leading-none">
            <span className="size-1.5 rounded-full bg-primary/70" />
            {roleLabel}
          </span>
        </div>
        <ChevronDown className="size-3.5 text-muted-foreground/70 transition-transform duration-200 group-open:rotate-180 group-hover:text-foreground" />
      </summary>

      <div className="absolute right-0 top-full z-40 mt-1.5 w-60 rounded-xl border border-border/80 bg-popover p-1.5 text-popover-foreground shadow-xl backdrop-blur-md">
        <div className="flex items-center gap-2.5 rounded-lg bg-muted/50 p-2.5 mb-1 border border-border/40">
          <div className="relative flex size-9 shrink-0 items-center justify-center rounded-full bg-primary/10 font-semibold text-xs text-primary ring-1 ring-border/60 shadow-xs">
            {initials}
            <span className="absolute -bottom-0.5 -right-0.5 size-2 rounded-full bg-emerald-500 ring-2 ring-card" />
          </div>
          <div className="flex min-w-0 flex-1 flex-col">
            <span className="truncate text-xs font-semibold text-foreground leading-snug">
              {user?.name ?? "User"}
            </span>
            {user?.email && (
              <span className="truncate text-[11px] text-muted-foreground leading-none">
                {user.email}
              </span>
            )}
            <div className="mt-1.5 flex items-center gap-1.5">
              <span className="inline-flex items-center gap-1 rounded bg-primary/10 px-1.5 py-0.5 text-[10px] font-medium capitalize text-primary leading-none">
                <span className="size-1 rounded-full bg-primary" />
                {roleLabel}
              </span>
            </div>
          </div>
        </div>

        <div className="my-1 h-px bg-border/60" />

        <Link
          href="/profile"
          className="flex items-center gap-2.5 rounded-md px-2.5 py-2 text-xs font-medium text-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
        >
          <UserRound className="size-4 text-muted-foreground" />
          My Profile
        </Link>

        <div className="my-1 h-px bg-border/60" />

        <button
          type="button"
          onClick={onLogout}
          className="flex w-full items-center gap-2.5 rounded-md px-2.5 py-2 text-xs font-medium text-destructive transition-colors hover:bg-destructive/10"
        >
          <LogOut className="size-4" />
          Logout
        </button>
      </div>
    </details>
  );
}

function MobileNavMenu({ onLogout }: { onLogout: () => void }) {
  const detailsRef = useRef<HTMLDetailsElement>(null);
  const session = useQuery({ queryKey: ["auth", "me"], queryFn: stockApi.me, retry: false });
  const user = session.data?.user;

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (detailsRef.current && !detailsRef.current.contains(event.target as Node)) {
        detailsRef.current.removeAttribute("open");
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const initials = (user?.name ?? "User")
    .trim()
    .split(/\s+/)
    .map((part) => part[0])
    .filter(Boolean)
    .join("")
    .slice(0, 2)
    .toUpperCase() || "U";

  const roleLabel = user?.role
    ? user.role.charAt(0).toUpperCase() + user.role.slice(1).toLowerCase()
    : "Staff";

  return (
    <details ref={detailsRef} className="group relative xl:hidden">
      <summary className="grid size-11 cursor-pointer list-none place-items-center rounded-md transition-colors hover:bg-muted marker:hidden [&::-webkit-details-marker]:hidden" aria-label="Open navigation">
        <Menu className="size-4" />
      </summary>
      <nav
        className="absolute right-0 top-full z-40 mt-2 max-h-[75vh] w-72 overflow-y-auto rounded-xl border border-border/80 bg-popover p-2 text-popover-foreground shadow-xl"
        aria-label="Mobile navigation"
        onClick={(event) => {
          if (event.target instanceof Element && event.target.closest("a")) {
            detailsRef.current?.removeAttribute("open");
          }
        }}
      >
        <div className="flex items-center gap-2.5 rounded-lg bg-muted/50 p-2.5 mb-2 border border-border/40">
          <div className="relative flex size-8 shrink-0 items-center justify-center rounded-full bg-primary/10 font-semibold text-xs text-primary ring-1 ring-border/60">
            {initials}
            <span className="absolute -bottom-0.5 -right-0.5 size-2 rounded-full bg-emerald-500 ring-2 ring-card" />
          </div>
          <div className="flex min-w-0 flex-1 flex-col">
            <span className="truncate text-xs font-semibold text-foreground">
              {user?.name ?? "User"}
            </span>
            <span className="truncate text-[11px] text-muted-foreground capitalize">
              {roleLabel} {user?.email ? `• ${user.email}` : ""}
            </span>
          </div>
        </div>
        <NavigationItems mobile />
        <div className="my-2 border-t border-border/60" />
        <Link href="/profile" className="flex items-center gap-2.5 rounded-md px-2.5 py-2.5 text-xs font-medium text-foreground hover:bg-accent hover:text-accent-foreground">
          <UserRound className="size-4 text-muted-foreground" />
          My Profile
        </Link>
        <button type="button" onClick={onLogout} className="flex w-full items-center gap-2.5 rounded-md px-2.5 py-2.5 text-left text-xs font-medium text-destructive hover:bg-destructive/10">
          <LogOut className="size-4" />
          Logout
        </button>
      </nav>
    </details>
  );
}

export function WarehouseHeader() {
  const router = useRouter();
  const queryClient = useQueryClient();
  async function logout() {
    try { await stockApi.logout(); } catch { /* Still return to login if the API is unavailable. */ }
    queryClient.clear();
    router.replace("/login");
    router.refresh();
  }
  return (
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
          <ProfileMenu onLogout={() => void logout()} />
          <MobileNavMenu onLogout={() => void logout()} />
        </div>
      </div>
    </header>
  );
}
