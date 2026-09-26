"use client";

import { useState, useMemo, useEffect, useRef } from "react";
import Link from "next/link";
import { useTheme } from "@/components/theme-provider";
import {
  Search,
  Plus,
  FileDown,
  ScanBarcode,
  LayoutList,
  Kanban,
  SlidersHorizontal,
  CheckCircle2,
  Printer,
  MoreHorizontal,
  ExternalLink,
  ChevronLeft,
  ChevronRight,
  TrendingUp,
  Truck,
  History,
  Bell,
  Sun,
  Moon,
  X,
  Factory,
  Check,
  Clock,
  FileText,
  Barcode,
  Menu,
} from "lucide-react";

export type ReceiptStatus = "Draft" | "Ready" | "Done";

export interface ReceiptItem {
  id: string;
  reference: string;
  poNumber: string;
  dockNote: string;
  vendor: string;
  vendorBadge: string;
  destination: string;
  moLink?: string;
  bayNote?: string;
  isQcHold?: boolean;
  isStowed?: boolean;
  contact: string;
  contactInitials: string;
  scheduledEta: string;
  scheduleNote: string;
  status: ReceiptStatus;
}

const INITIAL_RECEIPTS: ReceiptItem[] = [
  {
    id: "rec-1",
    reference: "WH/IN/0001",
    poNumber: "PO-94022",
    dockNote: "Dock 04 designated",
    vendor: "Azure Interior Inc.",
    vendorBadge: "Tier 1 Certified",
    destination: "WH/Stock1",
    moLink: "MO-4491",
    contact: "Azure Interior",
    contactInitials: "AI",
    scheduledEta: "24 Oct 2026, 10:30",
    scheduleNote: "On schedule • SLA priority",
    status: "Ready",
  },
  {
    id: "rec-2",
    reference: "WH/IN/0002",
    poNumber: "PO-94025",
    dockNote: "Dock 02 assigned",
    vendor: "Apex Industrial Supply",
    vendorBadge: "Standard Freight",
    destination: "WH/Stock2",
    bayNote: "Bay 12",
    contact: "Marcus Vance",
    contactInitials: "MV",
    scheduledEta: "24 Oct 2026, 13:15",
    scheduleNote: "Dock slot confirmed",
    status: "Ready",
  },
  {
    id: "rec-3",
    reference: "WH/IN/0003",
    poNumber: "PO-94031",
    dockNote: "Awaiting ASN sync",
    vendor: "Solis Precision Components",
    vendorBadge: "Air Freight Intl",
    destination: "WH/Stock1",
    isQcHold: true,
    contact: "Anita Oliver",
    contactInitials: "AO",
    scheduledEta: "25 Oct 2026, 09:00",
    scheduleNote: "Pending BOL signoff",
    status: "Draft",
  },
  {
    id: "rec-4",
    reference: "WH/IN/0004",
    poNumber: "PO-93998",
    dockNote: "Dock 01 • Stowed",
    vendor: "Nordic Sensor Dynamics",
    vendorBadge: "Pallet Lot #891-B",
    destination: "WH/Stock3/Bay-A",
    isStowed: true,
    contact: "Evan Lindqvist",
    contactInitials: "EL",
    scheduledEta: "23 Oct 2026, 16:45",
    scheduleNote: "Received in full",
    status: "Done",
  },
  {
    id: "rec-5",
    reference: "WH/IN/0005",
    poNumber: "PO-94038",
    dockNote: "Dock 07 reserved",
    vendor: "Vanguard Raw Materials",
    vendorBadge: "Contract #V-102",
    destination: "WH/Stock2",
    moLink: "MO-4502",
    contact: "David Kross",
    contactInitials: "DK",
    scheduledEta: "25 Oct 2026, 15:00",
    scheduleNote: "Bay cleared & staffed",
    status: "Ready",
  },
];

export default function ReceiptsPage() {
  const { darkMode, toggleTheme } = useTheme();

  // State
  const [receipts, setReceipts] = useState<ReceiptItem[]>(INITIAL_RECEIPTS);
  const [activeTab, setActiveTab] = useState<"All" | "Ready" | "Draft" | "Done">("All");
  const [viewMode, setViewMode] = useState<"list" | "kanban">("list");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(25);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Modals & Panels
  const [isNewReceiptOpen, setIsNewReceiptOpen] = useState(false);
  const [isFastScanOpen, setIsFastScanOpen] = useState(false);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [scanInput, setScanInput] = useState("");
  const [auditItem, setAuditItem] = useState<ReceiptItem | null>(null);

  // New receipt form state
  const [newVendor, setNewVendor] = useState("");
  const [newPo, setNewPo] = useState("");
  const [newDest, setNewDest] = useState("WH/Stock1");
  const [newContact, setNewContact] = useState("");
  const [newEta, setNewEta] = useState("");

  // Toast
  const [toast, setToast] = useState<{ visible: boolean; message: string; icon?: string }>({
    visible: false,
    message: "",
  });

  const searchInputRef = useRef<HTMLInputElement>(null);

  const showToast = (message: string, icon = "check_circle") => {
    setToast({ visible: true, message, icon });
    setTimeout(() => {
      setToast((prev) => ({ ...prev, visible: false }));
    }, 3200);
  };

  // Keyboard shortcut ⌘K
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Filtered receipts
  const filteredReceipts = useMemo(() => {
    return receipts.filter((r) => {
      const q = searchQuery.toLowerCase();
      const matchesSearch =
        !q ||
        r.reference.toLowerCase().includes(q) ||
        r.vendor.toLowerCase().includes(q) ||
        r.destination.toLowerCase().includes(q) ||
        r.contact.toLowerCase().includes(q) ||
        r.poNumber.toLowerCase().includes(q);

      const matchesTab = activeTab === "All" || r.status === activeTab;

      return matchesSearch && matchesTab;
    });
  }, [receipts, searchQuery, activeTab]);

  // Counts
  const counts = useMemo(() => {
    return {
      all: receipts.length,
      ready: receipts.filter((r) => r.status === "Ready").length,
      draft: receipts.filter((r) => r.status === "Draft").length,
      done: receipts.filter((r) => r.status === "Done").length,
    };
  }, [receipts]);

  // Pagination calculation
  const totalPages = Math.max(1, Math.ceil(filteredReceipts.length / rowsPerPage));
  const paginatedReceipts = useMemo(() => {
    const start = (currentPage - 1) * rowsPerPage;
    return filteredReceipts.slice(start, start + rowsPerPage);
  }, [filteredReceipts, currentPage, rowsPerPage]);

  // Bulk selection toggles
  const isAllSelected =
    filteredReceipts.length > 0 && filteredReceipts.every((r) => selectedIds.has(r.id));

  const toggleSelectAll = () => {
    if (isAllSelected) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredReceipts.map((r) => r.id)));
    }
  };

  const toggleSelectOne = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  // Quick Validate
  const handleQuickValidate = (id: string) => {
    setReceipts((prev) =>
      prev.map((r) => (r.id === id ? { ...r, status: "Done" as const, scheduleNote: "Validated to Stock" } : r))
    );
    showToast(`Receipt marked as Done and validated into stock.`, "check_circle");
  };

  // Export CSV
  const handleExportCSV = () => {
    const headers = "Reference,PO Number,Vendor,Destination,Contact,Scheduled ETA,Status\n";
    const rows = receipts
      .map(
        (r) =>
          `"${r.reference}","${r.poNumber}","${r.vendor}","${r.destination}","${r.contact}","${r.scheduledEta}","${r.status}"`
      )
      .join("\n");
    const blob = new Blob([headers + rows], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `Inbound_Receipts_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast("Receipts manifest exported as CSV.", "download_done");
  };

  // Add Receipt
  const handleCreateReceipt = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newVendor.trim()) {
      showToast("Please enter a vendor name", "error");
      return;
    }
    const nextNum = receipts.length + 1;
    const refCode = `WH/IN/${String(nextNum).padStart(4, "0")}`;
    const newRecord: ReceiptItem = {
      id: `rec-${Date.now()}`,
      reference: refCode,
      poNumber: newPo.trim() || `PO-${94000 + nextNum}`,
      dockNote: "Dock auto-assigned",
      vendor: newVendor.trim(),
      vendorBadge: "Standard Supplier",
      destination: newDest,
      contact: newContact.trim() || newVendor.trim().split(" ")[0],
      contactInitials: (newContact.trim() || newVendor.trim()).slice(0, 2).toUpperCase(),
      scheduledEta: newEta || `${new Date().toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}, 12:00`,
      scheduleNote: "On schedule • New Arrival",
      status: "Ready",
    };

    setReceipts([newRecord, ...receipts]);
    setIsNewReceiptOpen(false);
    setNewVendor("");
    setNewPo("");
    setNewContact("");
    setNewEta("");
    showToast(`Created inbound receipt ${refCode} successfully!`, "check_circle");
  };

  // Fast Scan Match
  const handleFastScanSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!scanInput.trim()) return;
    const found = receipts.find(
      (r) =>
        r.reference.toLowerCase() === scanInput.trim().toLowerCase() ||
        r.poNumber.toLowerCase() === scanInput.trim().toLowerCase()
    );
    if (found) {
      showToast(`Matched ${found.reference} (${found.vendor}) - Dock slot active!`, "barcode");
      setSearchQuery(found.reference);
      setIsFastScanOpen(false);
      setScanInput("");
    } else {
      showToast(`No manifest found matching "${scanInput.trim()}".`, "error");
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50/70 dark:bg-slate-950 text-slate-900 dark:text-slate-100 font-sans selection:bg-blue-100 dark:selection:bg-blue-900 selection:text-blue-900 dark:selection:text-blue-100">
      {/* ========================================================================= */}
      {/* 1. SCANDINAVIAN MINIMAL TOP NAVIGATION                                    */}
      {/* ========================================================================= */}
      <header className="sticky top-0 z-40 w-full bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border-b border-slate-200/80 dark:border-slate-800 transition-colors">
        <div className="max-w-[1520px] mx-auto px-4 sm:px-6 lg:px-10 h-16 flex items-center justify-between">
          {/* Brand & Primary Nav */}
          <div className="flex items-center gap-6 lg:gap-10">
            <Link href="/" className="flex items-center gap-2.5 group">
              <div className="w-7 h-7 rounded-md bg-slate-900 dark:bg-blue-600 text-white flex items-center justify-center font-mono font-medium text-xs tracking-tighter shadow-2xs group-hover:scale-105 transition-transform">
                NP
              </div>
              <div className="flex flex-col">
                <span className="text-sm font-semibold tracking-tight text-slate-900 dark:text-white leading-tight">
                  Nova Precision
                </span>
                <span className="text-[10px] font-mono uppercase tracking-widest text-slate-400 dark:text-slate-400 -mt-0.5">
                  Zenith Core
                </span>
              </div>
            </Link>

            <nav className="hidden md:flex items-center gap-1 text-sm font-medium text-slate-500 dark:text-slate-400">
              <Link
                href="/dashboard"
                className="px-3 py-1.5 rounded-md hover:text-slate-900 dark:hover:text-white hover:bg-slate-100/70 dark:hover:bg-slate-800/70 transition-colors"
              >
                Dashboard
              </Link>
              <Link
                href="/operations/receipts"
                className="relative px-3 py-1.5 rounded-md text-slate-950 dark:text-white font-semibold bg-slate-100/80 dark:bg-slate-800 transition-colors"
              >
                Operations
                <span className="absolute bottom-0.5 left-1/2 -translate-x-1/2 w-4 h-[2px] bg-blue-600 rounded-full" />
              </Link>
              <Link
                href="/"
                className="px-3 py-1.5 rounded-md hover:text-slate-900 dark:hover:text-white hover:bg-slate-100/70 dark:hover:bg-slate-800/70 transition-colors"
              >
                Stock
              </Link>
              <Link
                href="/moves"
                className="px-3 py-1.5 rounded-md hover:text-slate-900 dark:hover:text-white hover:bg-slate-100/70 dark:hover:bg-slate-800/70 transition-colors"
              >
                Move History
              </Link>
              <Link
                href="/settings"
                className="px-3 py-1.5 rounded-md hover:text-slate-900 dark:hover:text-white hover:bg-slate-100/70 dark:hover:bg-slate-800/70 transition-colors"
              >
                Settings
              </Link>
            </nav>
          </div>

          {/* Quick Search, Theme & Profile */}
          <div className="flex items-center gap-2 sm:gap-4">
            <div className="hidden lg:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-100/80 dark:bg-slate-800/80 text-slate-400 text-xs w-64 border border-transparent focus-within:border-slate-300 dark:focus-within:border-slate-700 focus-within:bg-white dark:focus-within:bg-slate-900 transition-all">
              <Search className="w-4 h-4 text-slate-400 shrink-0" />
              <input
                ref={searchInputRef}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="bg-transparent border-0 p-0 text-xs text-slate-800 dark:text-slate-200 placeholder-slate-400 focus:ring-0 w-full font-sans focus:outline-none"
                placeholder="Search manifest, SKU, PO..."
                type="text"
              />
              <kbd className="font-mono text-[10px] px-1.5 py-0.5 rounded bg-white dark:bg-slate-800 text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-700 shadow-2xs">
                ⌘K
              </kbd>
            </div>

            <div className="h-4 w-[1px] bg-slate-200 dark:bg-slate-800 hidden sm:block" />

            {/* Dark Mode Toggle */}
            <button
              onClick={toggleTheme}
              className="p-2 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              title="Toggle color theme"
              aria-label="Toggle theme"
            >
              {darkMode ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-slate-600" />}
            </button>

            {/* Notifications */}
            <button
              onClick={() => showToast("No new warehouse notifications at this moment.", "notifications")}
              aria-label="Notifications"
              className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors relative"
            >
              <Bell className="w-5 h-5" />
              <span className="absolute top-1 right-1 w-1.5 h-1.5 rounded-full bg-blue-600 ring-2 ring-white dark:ring-slate-900" />
            </button>

            {/* User Profile */}
            <div className="flex items-center gap-2 pl-1 cursor-pointer group">
              <div className="w-7 h-7 rounded-full bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 flex items-center justify-center font-mono text-xs font-medium border border-slate-300 dark:border-slate-600">
                AM
              </div>
              <div className="hidden sm:flex flex-col text-left">
                <span className="text-xs font-medium text-slate-900 dark:text-white group-hover:text-blue-600 transition-colors leading-tight">
                  Alex Morgan
                </span>
                <span className="text-[10px] font-mono text-slate-400 leading-tight">
                  Lead Inbound
                </span>
              </div>
            </div>

            {/* Mobile Hamburger Menu Toggle */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
              aria-label="Open mobile navigation"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation Dropdown */}
        {mobileMenuOpen && (
          <div className="md:hidden px-4 py-3 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 flex flex-col gap-2">
            <Link
              href="/dashboard"
              className="px-3 py-2 text-sm rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300"
            >
              Dashboard
            </Link>
            <Link
              href="/operations/receipts"
              className="px-3 py-2 text-sm font-semibold rounded-lg bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300"
            >
              Operations (Receipts)
            </Link>
            <Link
              href="/"
              className="px-3 py-2 text-sm rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300"
            >
              Stock Inventory
            </Link>
            <Link
              href="/moves"
              className="px-3 py-2 text-sm rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300"
            >
              Move History
            </Link>
            <Link
              href="/settings"
              className="px-3 py-2 text-sm rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300"
            >
              Warehouse Settings
            </Link>
          </div>
        )}
      </header>

      {/* ========================================================================= */}
      {/* 2. MAIN WORKSPACE CONTAINER                                               */}
      {/* ========================================================================= */}
      <main className="flex-1 max-w-[1520px] w-full mx-auto px-4 sm:px-6 lg:px-10 py-6 sm:py-8 space-y-6 sm:space-y-7">
        {/* Subheader: Breadcrumb & Title Cluster */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-2 border-b border-slate-200/80 dark:border-slate-800">
          <div>
            <div className="flex items-center gap-2 text-xs font-mono text-slate-400 dark:text-slate-400 mb-1">
              <span>Nova Precision</span>
              <span className="text-slate-300 dark:text-slate-600">/</span>
              <span className="text-slate-600 dark:text-slate-300">Operations</span>
              <span className="text-slate-300 dark:text-slate-600">/</span>
              <span className="text-blue-600 dark:text-blue-400 font-medium">Receipts</span>
            </div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl lg:text-3xl font-semibold tracking-tight text-slate-950 dark:text-white">
                Inbound Receipts
              </h1>
              <span className="text-xs font-mono px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                WH/IN/*
              </span>
            </div>
            <p className="text-xs lg:text-sm text-slate-500 dark:text-slate-400 mt-1 font-normal max-w-xl">
              Live ledger of inbound shipments, automated dock verification, and high-precision routing to assembly buffers.
            </p>
          </div>

          {/* Action Buttons Cluster */}
          <div className="flex items-center gap-2.5 flex-wrap">
            <button
              onClick={handleExportCSV}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 text-slate-700 dark:text-slate-200 text-xs font-medium shadow-2xs hover:bg-slate-50 dark:hover:bg-slate-800 transition-all cursor-pointer"
            >
              <FileDown className="w-4 h-4 text-slate-500 dark:text-slate-400" />
              <span>Export</span>
            </button>
            <button
              onClick={() => setIsFastScanOpen(true)}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 text-slate-700 dark:text-slate-200 text-xs font-medium shadow-2xs hover:bg-slate-50 dark:hover:bg-slate-800 transition-all cursor-pointer"
            >
              <ScanBarcode className="w-4 h-4 text-slate-500 dark:text-slate-400" />
              <span>Fast Scan</span>
            </button>
            <button
              onClick={() => setIsNewReceiptOpen(true)}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-slate-900 dark:bg-blue-600 hover:bg-slate-800 dark:hover:bg-blue-700 text-white text-xs font-medium shadow-xs transition-all tracking-tight active:scale-[0.98] cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>New Receipt</span>
            </button>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* 3. MINIMAL NORDIC KPI STRIP                                               */}
        {/* ========================================================================= */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5 sm:gap-4 lg:gap-6">
          {/* Metric 1 */}
          <div className="bg-white dark:bg-slate-900 rounded-xl p-4 sm:p-5 border border-slate-200/80 dark:border-slate-800 shadow-2xs flex flex-col justify-between transition-all hover:border-slate-300 dark:hover:border-slate-700">
            <div className="flex items-center justify-between text-xs font-medium text-slate-500 dark:text-slate-400">
              <span>Inbound Throughput</span>
              <span className="font-mono text-[11px] text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-1.5 py-0.5 rounded flex items-center gap-0.5">
                <TrendingUp className="w-3 h-3" /> +14.2%
              </span>
            </div>
            <div className="mt-3 flex items-baseline gap-2">
              <span className="text-2xl sm:text-3xl font-semibold tracking-tight text-slate-950 dark:text-white font-mono">
                {counts.all}
              </span>
              <span className="text-xs text-slate-400 font-normal">manifests scheduled</span>
            </div>
            <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400">
              <span>Weekly velocity</span>
              <span className="font-mono text-slate-700 dark:text-slate-300 font-medium">94.8% on-time</span>
            </div>
          </div>

          {/* Metric 2 */}
          <div className="bg-white dark:bg-slate-900 rounded-xl p-4 sm:p-5 border border-slate-200/80 dark:border-slate-800 shadow-2xs flex flex-col justify-between transition-all hover:border-slate-300 dark:hover:border-slate-700">
            <div className="flex items-center justify-between text-xs font-medium text-slate-500 dark:text-slate-400">
              <span>Ready for Dock-In</span>
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            </div>
            <div className="mt-3 flex items-baseline gap-2">
              <span className="text-2xl sm:text-3xl font-semibold tracking-tight text-slate-950 dark:text-white font-mono">
                {counts.ready}
              </span>
              <span className="text-xs text-slate-400 font-normal">bays designated</span>
            </div>
            <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400">
              <span>Active staging</span>
              <span className="font-mono text-blue-600 dark:text-blue-400 font-medium">Docks 02, 04, 07</span>
            </div>
          </div>

          {/* Metric 3 */}
          <div className="bg-white dark:bg-slate-900 rounded-xl p-4 sm:p-5 border border-slate-200/80 dark:border-slate-800 shadow-2xs flex flex-col justify-between transition-all hover:border-slate-300 dark:hover:border-slate-700">
            <div className="flex items-center justify-between text-xs font-medium text-slate-500 dark:text-slate-400">
              <span>MO Direct Feeder</span>
              <span className="font-mono text-[11px] text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/60 px-1.5 py-0.5 rounded">
                Linked
              </span>
            </div>
            <div className="mt-3 flex items-baseline gap-2">
              <span className="text-2xl sm:text-3xl font-semibold tracking-tight text-slate-950 dark:text-white font-mono">
                14
              </span>
              <span className="text-xs text-slate-400 font-normal">work orders matched</span>
            </div>
            <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400">
              <span>Buffer allocation</span>
              <span className="font-mono text-slate-700 dark:text-slate-300 font-medium">Zero-touch routing</span>
            </div>
          </div>

          {/* Metric 4 */}
          <div className="bg-white dark:bg-slate-900 rounded-xl p-4 sm:p-5 border border-slate-200/80 dark:border-slate-800 shadow-2xs flex flex-col justify-between transition-all hover:border-slate-300 dark:hover:border-slate-700">
            <div className="flex items-center justify-between text-xs font-medium text-slate-500 dark:text-slate-400">
              <span>Cleared Today</span>
              <span className="font-mono text-[11px] text-slate-600 dark:text-slate-300">78% goal</span>
            </div>
            <div className="mt-3 flex items-baseline gap-2">
              <span className="text-2xl sm:text-3xl font-semibold tracking-tight text-slate-950 dark:text-white font-mono">
                {counts.done}
              </span>
              <span className="text-xs text-slate-400 font-normal">received to stock</span>
            </div>
            <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-800">
              <div className="w-full bg-slate-100 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden">
                <div
                  className="bg-slate-900 dark:bg-blue-500 h-full rounded-full transition-all duration-500"
                  style={{ width: "78%" }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* 4. FILTERING & CONTROL RIBBON                                             */}
        {/* ========================================================================= */}
        <div className="bg-white dark:bg-slate-900 rounded-xl p-3 border border-slate-200/80 dark:border-slate-800 shadow-2xs flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
          {/* Pill Tabs */}
          <div className="flex items-center gap-1 overflow-x-auto pb-1 lg:pb-0 scrollbar-none">
            <button
              onClick={() => setActiveTab("All")}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-mono font-medium transition-all cursor-pointer whitespace-nowrap ${
                activeTab === "All"
                  ? "bg-slate-900 dark:bg-blue-600 text-white shadow-2xs"
                  : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800"
              }`}
            >
              All <span className="ml-1 opacity-70">{counts.all}</span>
            </button>
            <button
              onClick={() => setActiveTab("Ready")}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-mono font-medium transition-all cursor-pointer whitespace-nowrap ${
                activeTab === "Ready"
                  ? "bg-slate-900 dark:bg-blue-600 text-white shadow-2xs"
                  : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800"
              }`}
            >
              Ready <span className="ml-1 text-slate-400">{counts.ready}</span>
            </button>
            <button
              onClick={() => setActiveTab("Draft")}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-mono font-medium transition-all cursor-pointer whitespace-nowrap ${
                activeTab === "Draft"
                  ? "bg-slate-900 dark:bg-blue-600 text-white shadow-2xs"
                  : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800"
              }`}
            >
              Draft <span className="ml-1 text-slate-400">{counts.draft}</span>
            </button>
            <button
              onClick={() => setActiveTab("Done")}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-mono font-medium transition-all cursor-pointer whitespace-nowrap ${
                activeTab === "Done"
                  ? "bg-slate-900 dark:bg-blue-600 text-white shadow-2xs"
                  : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800"
              }`}
            >
              Done <span className="ml-1 text-slate-400">{counts.done}</span>
            </button>
          </div>

          {/* Search, Filter Drawer, and View Switcher */}
          <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
            <div className="relative flex-1 sm:w-80">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
              <input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-12 py-1.5 bg-slate-50/90 dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700 rounded-lg text-xs text-slate-800 dark:text-slate-200 placeholder-slate-400 focus:bg-white dark:focus:bg-slate-900 focus:border-slate-300 dark:focus:border-slate-600 focus:ring-1 focus:ring-slate-300 transition-all font-sans focus:outline-none"
                placeholder="Filter by reference, vendor, location..."
                type="text"
              />
              <kbd className="font-mono text-[10px] px-1.5 py-0.5 rounded bg-white dark:bg-slate-700 text-slate-400 border border-slate-200 dark:border-slate-600 absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none">
                ⌘K
              </kbd>
            </div>

            <button
              onClick={() => setIsFilterOpen(!isFilterOpen)}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-medium transition-colors cursor-pointer ${
                isFilterOpen
                  ? "bg-slate-100 dark:bg-slate-800 border-slate-300 dark:border-slate-600 text-slate-900 dark:text-white"
                  : "border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800"
              }`}
            >
              <SlidersHorizontal className="w-4 h-4 text-slate-500" />
              <span className="hidden sm:inline">Filters</span>
              <span className="font-mono text-[10px] w-4 h-4 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 flex items-center justify-center">
                2
              </span>
            </button>

            <div className="h-4 w-[1px] bg-slate-200 dark:bg-slate-800 mx-0.5" />

            {/* View Mode Switcher (List vs Kanban) */}
            <div className="inline-flex p-0.5 bg-slate-100 dark:bg-slate-800 rounded-lg border border-slate-200/60 dark:border-slate-700">
              <button
                onClick={() => setViewMode("list")}
                className={`p-1.5 rounded-md transition-all cursor-pointer ${
                  viewMode === "list"
                    ? "bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-2xs"
                    : "text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
                }`}
                title="List View"
                aria-label="List View"
              >
                <LayoutList className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode("kanban")}
                className={`p-1.5 rounded-md transition-all cursor-pointer ${
                  viewMode === "kanban"
                    ? "bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-2xs"
                    : "text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
                }`}
                title="Kanban View"
                aria-label="Kanban View"
              >
                <Kanban className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Quick Filter Drawer */}
        {isFilterOpen && (
          <div className="bg-slate-50 dark:bg-slate-850 p-4 rounded-xl border border-slate-200 dark:border-slate-700 flex flex-wrap gap-4 items-center text-xs animate-in fade-in duration-150">
            <span className="font-semibold text-slate-700 dark:text-slate-300">Quick Filters:</span>
            <button
              onClick={() => setSearchQuery("WH/Stock1")}
              className="px-2.5 py-1 rounded-md bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:border-blue-500 font-mono text-slate-700 dark:text-slate-300"
            >
              Location: WH/Stock1
            </button>
            <button
              onClick={() => setSearchQuery("Dock 04")}
              className="px-2.5 py-1 rounded-md bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:border-blue-500 font-mono text-slate-700 dark:text-slate-300"
            >
              Dock 04
            </button>
            <button
              onClick={() => setSearchQuery("Tier 1")}
              className="px-2.5 py-1 rounded-md bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:border-blue-500 text-slate-700 dark:text-slate-300"
            >
              Tier 1 Suppliers
            </button>
            <button
              onClick={() => {
                setSearchQuery("");
                setActiveTab("All");
              }}
              className="text-xs text-blue-600 dark:text-blue-400 hover:underline ml-auto"
            >
              Reset Filters
            </button>
          </div>
        )}

        {/* ========================================================================= */}
        {/* 5. VIEW MODES: LIST VIEW (TABLE) OR KANBAN BOARD                          */}
        {/* ========================================================================= */}
        {viewMode === "list" ? (
          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200/80 dark:border-slate-800 shadow-2xs overflow-hidden">
            {/* Desktop Table View */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50/80 dark:bg-slate-800/60 border-b border-slate-200/80 dark:border-slate-800 text-[11px] font-mono uppercase tracking-wider text-slate-500 dark:text-slate-400 select-none">
                    <th className="w-12 px-5 py-3.5 text-center">
                      <input
                        type="checkbox"
                        checked={isAllSelected}
                        onChange={toggleSelectAll}
                        className="w-3.5 h-3.5 rounded border-slate-300 dark:border-slate-600 text-slate-900 dark:text-blue-600 focus:ring-0 cursor-pointer"
                      />
                    </th>
                    <th className="px-4 py-3.5 font-medium text-slate-700 dark:text-slate-300">Reference</th>
                    <th className="px-4 py-3.5 font-medium text-slate-700 dark:text-slate-300">Vendor / Source</th>
                    <th className="px-4 py-3.5 font-medium text-slate-700 dark:text-slate-300">Destination Bay</th>
                    <th className="px-4 py-3.5 font-medium text-slate-700 dark:text-slate-300">Contact</th>
                    <th className="px-4 py-3.5 font-medium text-slate-700 dark:text-slate-300">Scheduled ETA</th>
                    <th className="px-4 py-3.5 font-medium text-slate-700 dark:text-slate-300">Status</th>
                    <th className="px-5 py-3.5 text-right font-medium text-slate-700 dark:text-slate-300">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-xs text-slate-800 dark:text-slate-200">
                  {paginatedReceipts.map((row) => {
                    const isSelected = selectedIds.has(row.id);
                    return (
                      <tr
                        key={row.id}
                        className={`hover:bg-slate-50/70 dark:hover:bg-slate-800/50 transition-colors group ${
                          isSelected ? "bg-blue-50/40 dark:bg-blue-950/20" : ""
                        }`}
                      >
                        <td className="px-5 py-4 text-center">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => toggleSelectOne(row.id)}
                            className="w-3.5 h-3.5 rounded border-slate-300 dark:border-slate-600 text-slate-900 dark:text-blue-600 focus:ring-0 cursor-pointer"
                          />
                        </td>

                        {/* Reference Column */}
                        <td className="px-4 py-4 whitespace-nowrap">
                          <div className="flex items-center gap-2">
                            <Link
                              href={`/operations/receipts/${row.reference.replace(/\//g, "-")}`}
                              className="font-mono text-xs font-semibold text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 hover:underline flex items-center gap-1"
                            >
                              {row.reference}
                              <ExternalLink className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                            </Link>
                            <span className="text-[11px] font-mono text-slate-400">{row.poNumber}</span>
                          </div>
                          <div className="text-[11px] text-slate-400 dark:text-slate-500 mt-0.5 flex items-center gap-1">
                            <span>{row.dockNote}</span>
                          </div>
                        </td>

                        {/* Vendor / Source */}
                        <td className="px-4 py-4">
                          <div className="font-medium text-slate-900 dark:text-white">{row.vendor}</div>
                          <div className="flex items-center gap-1.5 mt-0.5">
                            <span className="inline-flex items-center text-[10px] font-mono px-1.5 py-0.2 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                              {row.vendorBadge}
                            </span>
                          </div>
                        </td>

                        {/* Destination Bay */}
                        <td className="px-4 py-4">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="font-mono text-slate-700 dark:text-slate-300 font-medium flex items-center gap-1">
                              <span
                                className={`w-1.5 h-1.5 rounded-full ${
                                  row.destination.includes("Stock1")
                                    ? "bg-blue-500"
                                    : row.destination.includes("Stock2")
                                    ? "bg-slate-400"
                                    : "bg-emerald-500"
                                }`}
                              />
                              {row.destination}
                            </span>
                            {row.moLink && (
                              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border border-blue-100 dark:border-blue-900 flex items-center gap-0.5">
                                <Factory className="w-2.5 h-2.5" />
                                {row.moLink}
                              </span>
                            )}
                            {row.bayNote && (
                              <span className="text-[10px] font-mono text-slate-400">{row.bayNote}</span>
                            )}
                            {row.isQcHold && (
                              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border border-amber-200/60 dark:border-amber-900">
                                QC Hold
                              </span>
                            )}
                            {row.isStowed && (
                              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-100 dark:border-emerald-900">
                                Stowed
                              </span>
                            )}
                          </div>
                        </td>

                        {/* Contact */}
                        <td className="px-4 py-4 whitespace-nowrap">
                          <div className="flex items-center gap-2">
                            <div className="w-6 h-6 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 flex items-center justify-center font-mono text-[10px] font-medium border border-slate-200 dark:border-slate-700">
                              {row.contactInitials}
                            </div>
                            <span className="text-slate-700 dark:text-slate-300 font-medium">
                              {row.contact}
                            </span>
                          </div>
                        </td>

                        {/* Scheduled ETA */}
                        <td className="px-4 py-4 whitespace-nowrap">
                          <div className="font-mono text-slate-800 dark:text-slate-200">{row.scheduledEta}</div>
                          <div
                            className={`text-[11px] flex items-center gap-1 mt-0.5 ${
                              row.status === "Draft"
                                ? "text-amber-600 dark:text-amber-400"
                                : row.status === "Done"
                                ? "text-slate-400 dark:text-slate-500"
                                : "text-emerald-600 dark:text-emerald-400"
                            }`}
                          >
                            <span
                              className={`w-1 h-1 rounded-full ${
                                row.status === "Draft"
                                  ? "bg-amber-500"
                                  : row.status === "Done"
                                  ? "bg-slate-400"
                                  : "bg-emerald-500"
                              }`}
                            />
                            <span>{row.scheduleNote}</span>
                          </div>
                        </td>

                        {/* Status Badge */}
                        <td className="px-4 py-4 whitespace-nowrap">
                          {row.status === "Ready" && (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-mono font-medium bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200/60 dark:border-emerald-800">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                              Ready
                            </span>
                          )}
                          {row.status === "Draft" && (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-mono font-medium bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                              <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
                              Draft
                            </span>
                          )}
                          {row.status === "Done" && (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-mono font-medium bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                              <span className="w-1.5 h-1.5 rounded-full bg-slate-500" />
                              Done
                            </span>
                          )}
                        </td>

                        {/* Row Actions */}
                        <td className="px-5 py-4 text-right whitespace-nowrap">
                          <div className="flex items-center justify-end gap-1 opacity-70 group-hover:opacity-100 transition-opacity">
                            {row.status === "Ready" && (
                              <button
                                onClick={() => handleQuickValidate(row.id)}
                                className="p-1 rounded text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                                title="Quick Validate into Stock"
                              >
                                <CheckCircle2 className="w-4 h-4" />
                              </button>
                            )}
                            {row.status === "Draft" && (
                              <button
                                onClick={() => {
                                  showToast(`Editing draft ${row.reference}`, "edit");
                                }}
                                className="p-1 rounded text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                                title="Edit Draft"
                              >
                                <FileText className="w-4 h-4" />
                              </button>
                            )}
                            {row.status === "Done" && (
                              <button
                                onClick={() => setAuditItem(row)}
                                className="p-1 rounded text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                                title="Audit Trail"
                              >
                                <History className="w-4 h-4" />
                              </button>
                            )}
                            <button
                              onClick={() => showToast(`Printing put-away slip for ${row.reference}...`, "print")}
                              className="p-1 rounded text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                              title="Print Put-away Slip"
                            >
                              <Printer className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => showToast(`Actions drawer for ${row.reference}`, "more")}
                              className="p-1 rounded text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                              title="More Options"
                            >
                              <MoreHorizontal className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Mobile Responsive Cards View */}
            <div className="md:hidden divide-y divide-slate-100 dark:divide-slate-800">
              {paginatedReceipts.map((row) => (
                <div key={row.id} className="p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Link
                        href={`/operations/receipts/${row.reference.replace(/\//g, "-")}`}
                        className="font-mono text-sm font-semibold text-blue-600 dark:text-blue-400"
                      >
                        {row.reference}
                      </Link>
                      <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-500">
                        {row.poNumber}
                      </span>
                    </div>
                    {row.status === "Ready" && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-mono font-medium bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                        Ready
                      </span>
                    )}
                    {row.status === "Draft" && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-mono font-medium bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                        <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
                        Draft
                      </span>
                    )}
                    {row.status === "Done" && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-mono font-medium bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                        <span className="w-1.5 h-1.5 rounded-full bg-slate-500" />
                        Done
                      </span>
                    )}
                  </div>

                  <div>
                    <div className="text-xs font-semibold text-slate-900 dark:text-white">{row.vendor}</div>
                    <div className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-2 mt-0.5">
                      <span>Dest: <strong className="font-mono text-slate-700 dark:text-slate-300">{row.destination}</strong></span>
                      <span>•</span>
                      <span>{row.dockNote}</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 pt-2 border-t border-slate-100 dark:border-slate-800">
                    <span className="font-mono">{row.scheduledEta}</span>
                    <div className="flex items-center gap-2">
                      {row.status === "Ready" && (
                        <button
                          onClick={() => handleQuickValidate(row.id)}
                          className="px-2.5 py-1 rounded bg-emerald-600 text-white font-medium text-xs flex items-center gap-1 cursor-pointer"
                        >
                          <Check className="w-3 h-3" /> Validate
                        </button>
                      )}
                      <button
                        onClick={() => showToast(`Printing put-away slip for ${row.reference}`, "print")}
                        className="p-1 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300"
                        title="Print"
                      >
                        <Printer className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Clean Nordic Pagination Footer */}
            <div className="px-4 sm:px-6 py-3.5 bg-slate-50/70 dark:bg-slate-800/40 border-t border-slate-200/80 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500 dark:text-slate-400">
              <div className="flex items-center gap-3">
                <span>
                  Showing <strong className="font-mono text-slate-800 dark:text-slate-200 font-semibold">
                    {filteredReceipts.length === 0 ? 0 : (currentPage - 1) * rowsPerPage + 1}-{Math.min(currentPage * rowsPerPage, filteredReceipts.length)}
                  </strong> of{" "}
                  <strong className="font-mono text-slate-800 dark:text-slate-200 font-semibold">{filteredReceipts.length}</strong> receipts
                </span>
                <span className="inline-flex items-center gap-1.5 font-mono text-[11px] text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 rounded-full border border-emerald-100 dark:border-emerald-900">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  Sync live
                </span>
              </div>

              <div className="flex items-center gap-4">
                <div className="flex items-center gap-1.5">
                  <span className="text-slate-400">Rows per page</span>
                  <select
                    value={rowsPerPage}
                    onChange={(e) => {
                      setRowsPerPage(Number(e.target.value));
                      setCurrentPage(1);
                    }}
                    className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-xs font-mono rounded px-2 py-1 focus:ring-0 focus:outline-none"
                  >
                    <option value={10}>10</option>
                    <option value={25}>25</option>
                    <option value={50}>50</option>
                  </select>
                </div>

                <div className="flex items-center gap-1">
                  <button
                    disabled={currentPage === 1}
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    className="p-1 rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-400 hover:text-slate-700 dark:hover:text-white disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => (
                    <button
                      key={pageNum}
                      onClick={() => setCurrentPage(pageNum)}
                      className={`w-7 h-7 rounded border font-mono text-xs flex items-center justify-center font-medium transition-colors cursor-pointer ${
                        currentPage === pageNum
                          ? "border-slate-900 dark:border-blue-600 bg-slate-900 dark:bg-blue-600 text-white font-semibold"
                          : "border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700"
                      }`}
                    >
                      {pageNum}
                    </button>
                  ))}
                  <button
                    disabled={currentPage >= totalPages}
                    onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                    className="p-1 rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        ) : (
          /* Kanban Board View */
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {(["Draft", "Ready", "Done"] as ReceiptStatus[]).map((colStatus) => {
              const items = receipts.filter((r) => r.status === colStatus);
              return (
                <div
                  key={colStatus}
                  className="bg-slate-100/70 dark:bg-slate-900/60 rounded-xl p-4 border border-slate-200/80 dark:border-slate-800 flex flex-col gap-3 min-h-[420px]"
                >
                  <div className="flex items-center justify-between pb-2 border-b border-slate-200 dark:border-slate-800">
                    <div className="flex items-center gap-2">
                      <span
                        className={`w-2 h-2 rounded-full ${
                          colStatus === "Ready"
                            ? "bg-emerald-500"
                            : colStatus === "Draft"
                            ? "bg-slate-400"
                            : "bg-blue-600"
                        }`}
                      />
                      <span className="text-sm font-semibold text-slate-900 dark:text-white">
                        {colStatus}
                      </span>
                    </div>
                    <span className="font-mono text-xs px-2 py-0.5 rounded-full bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 font-medium">
                      {items.length}
                    </span>
                  </div>

                  <div className="flex flex-col gap-3 overflow-y-auto">
                    {items.map((card) => (
                      <div
                        key={card.id}
                        className="bg-white dark:bg-slate-850 p-4 rounded-xl border border-slate-200 dark:border-slate-700 shadow-2xs hover:shadow-xs transition-shadow space-y-2.5"
                      >
                        <div className="flex items-center justify-between">
                          <Link
                            href={`/operations/receipts/${card.reference.replace(/\//g, "-")}`}
                            className="font-mono text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline"
                          >
                            {card.reference}
                          </Link>
                          <span className="font-mono text-[10px] text-slate-400">{card.poNumber}</span>
                        </div>

                        <div>
                          <p className="text-xs font-medium text-slate-900 dark:text-white">{card.vendor}</p>
                          <p className="text-[11px] font-mono text-slate-500 dark:text-slate-400 mt-0.5">
                            Dest: {card.destination}
                          </p>
                        </div>

                        <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[10px] text-slate-400">
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3 text-slate-400" />
                            {card.scheduledEta.split(",")[0]}
                          </span>
                          {card.status === "Ready" && (
                            <button
                              onClick={() => handleQuickValidate(card.id)}
                              className="px-2 py-0.5 rounded bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 hover:bg-emerald-100 text-[10px] font-mono cursor-pointer"
                            >
                              Validate
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                    {items.length === 0 && (
                      <div className="p-6 text-center text-xs text-slate-400 border border-dashed border-slate-200 dark:border-slate-800 rounded-lg">
                        No receipts in {colStatus}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* ========================================================================= */}
        {/* 6. BOTTOM OPERATIONAL DOCK STATUS RIBBON                                  */}
        {/* ========================================================================= */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-5">
          {/* Dock Allocation Card */}
          <div className="bg-white dark:bg-slate-900 rounded-xl p-5 border border-slate-200/80 dark:border-slate-800 shadow-2xs flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between text-xs font-semibold text-slate-900 dark:text-white mb-2">
                <span className="flex items-center gap-2">
                  <Truck className="w-4 h-4 text-slate-400" />
                  Inbound Dock Allocation
                </span>
                <span className="font-mono text-slate-500 dark:text-slate-400 font-normal">3 / 8 Active</span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                Real-time bay telemetry across Gates 1 through 8.
              </p>
            </div>
            <div className="mt-4 space-y-2.5">
              <div>
                <div className="flex justify-between text-[11px] mb-1 font-mono">
                  <span className="text-slate-600 dark:text-slate-400">Dock 04 (Azure Interior)</span>
                  <span className="text-blue-600 dark:text-blue-400 font-medium">65% unladen</span>
                </div>
                <div className="w-full bg-slate-100 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden">
                  <div className="bg-blue-600 h-full rounded-full transition-all" style={{ width: "65%" }} />
                </div>
              </div>
              <div>
                <div className="flex justify-between text-[11px] mb-1 font-mono">
                  <span className="text-slate-600 dark:text-slate-400">Dock 01 (Nordic Sensor)</span>
                  <span className="text-emerald-600 dark:text-emerald-400 font-medium">Completed</span>
                </div>
                <div className="w-full bg-slate-100 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden">
                  <div className="bg-emerald-500 h-full rounded-full transition-all" style={{ width: "100%" }} />
                </div>
              </div>
            </div>
          </div>

          {/* Rapid Lookup Scanner Card */}
          <div className="bg-white dark:bg-slate-900 rounded-xl p-5 border border-slate-200/80 dark:border-slate-800 shadow-2xs flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between text-xs font-semibold text-slate-900 dark:text-white mb-2">
                <span className="flex items-center gap-2">
                  <Barcode className="w-4 h-4 text-slate-400" />
                  Instant Manifest Match
                </span>
                <span className="font-mono text-[10px] px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                  HID Mode
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                Scan arrival bill of lading or type supplier tracking to immediately open record.
              </p>
            </div>
            <form onSubmit={handleFastScanSubmit} className="mt-4 flex gap-2">
              <div className="relative flex-1">
                <input
                  value={scanInput}
                  onChange={(e) => setScanInput(e.target.value)}
                  className="w-full h-8 pl-3 pr-8 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-mono text-slate-900 dark:text-white placeholder-slate-400 focus:bg-white dark:focus:bg-slate-900 focus:border-slate-300 dark:focus:border-slate-600 focus:ring-0 focus:outline-none"
                  placeholder="Scan barcode or PO-#"
                  type="text"
                />
                <ScanBarcode className="w-4 h-4 text-slate-400 absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>
              <button
                type="submit"
                className="h-8 px-3 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-medium transition-colors cursor-pointer"
              >
                Match
              </button>
            </form>
          </div>

          {/* MO Automated Assignment Feed Card */}
          <div className="bg-white dark:bg-slate-900 rounded-xl p-5 border border-slate-200/80 dark:border-slate-800 shadow-2xs flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between text-xs font-semibold text-slate-900 dark:text-white mb-2">
                <span className="flex items-center gap-2">
                  <Factory className="w-4 h-4 text-slate-400" />
                  Manufacturing Order Sync
                </span>
                <span className="font-mono text-[10px] text-emerald-600 dark:text-emerald-400 font-medium">
                  Active
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                Lots cleared to <code className="font-mono text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 px-1 py-0.5 rounded text-[11px]">WH/Stock1</code> are automatically allocated to pending bill-of-materials runs.
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
              <span className="text-slate-500 dark:text-slate-400">Live work order queues</span>
              <span className="font-mono font-semibold text-slate-900 dark:text-white">14 Orders Linked</span>
            </div>
          </div>
        </div>
      </main>

      {/* ========================================================================= */}
      {/* 7. UNDERSTATED NORDIC FOOTER                                              */}
      {/* ========================================================================= */}
      <footer className="w-full border-t border-slate-200/80 dark:border-slate-800 bg-white/70 dark:bg-slate-900/70 py-6 mt-12 text-xs text-slate-400">
        <div className="max-w-[1520px] mx-auto px-4 sm:px-6 lg:px-10 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="font-semibold text-slate-700 dark:text-slate-300">Nova Precision</span>
            <span className="text-slate-300 dark:text-slate-600">•</span>
            <span className="font-mono text-[11px] text-slate-400">Zenith Nordic Suite v3.4.2</span>
          </div>
          <div className="flex items-center gap-6 flex-wrap justify-center">
            <a href="#" className="hover:text-slate-700 dark:hover:text-slate-200 transition-colors">
              Terminal Map
            </a>
            <a href="#" className="hover:text-slate-700 dark:hover:text-slate-200 transition-colors">
              Barcode Protocol
            </a>
            <a href="#" className="hover:text-slate-700 dark:hover:text-slate-200 transition-colors">
              Hardware Diagnostics
            </a>
            <a href="#" className="hover:text-slate-700 dark:hover:text-slate-200 transition-colors">
              Security
            </a>
          </div>
          <div>© 2026 Nova Precision Logistics Inc.</div>
        </div>
      </footer>

      {/* ========================================================================= */}
      {/* 8. INTERACTIVE MODAL: CREATE NEW INBOUND RECEIPT                          */}
      {/* ========================================================================= */}
      {isNewReceiptOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/50 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-950/60 text-blue-600 flex items-center justify-center">
                  <Plus className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-semibold text-slate-900 dark:text-white">New Inbound Receipt</h3>
                  <p className="text-xs text-slate-400">Auto-increment structured format: WH/IN/*</p>
                </div>
              </div>
              <button
                onClick={() => setIsNewReceiptOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateReceipt} className="space-y-4 text-xs">
              <div>
                <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Vendor / Supplier Name *
                </label>
                <input
                  required
                  value={newVendor}
                  onChange={(e) => setNewVendor(e.target.value)}
                  placeholder="e.g. Apex Industrial Supply"
                  className="w-full h-9 px-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">
                    PO Number
                  </label>
                  <input
                    value={newPo}
                    onChange={(e) => setNewPo(e.target.value)}
                    placeholder="PO-94050"
                    className="w-full h-9 px-3 font-mono bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Destination Location
                  </label>
                  <select
                    value={newDest}
                    onChange={(e) => setNewDest(e.target.value)}
                    className="w-full h-9 px-2 font-mono bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                  >
                    <option value="WH/Stock1">WH/Stock1 (Primary)</option>
                    <option value="WH/Stock2">WH/Stock2 (Auxiliary)</option>
                    <option value="WH/Stock3/Bay-A">WH/Stock3/Bay-A</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Contact Person
                  </label>
                  <input
                    value={newContact}
                    onChange={(e) => setNewContact(e.target.value)}
                    placeholder="e.g. Marcus Vance"
                    className="w-full h-9 px-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Scheduled ETA
                  </label>
                  <input
                    value={newEta}
                    onChange={(e) => setNewEta(e.target.value)}
                    placeholder="26 Oct 2026, 14:00"
                    className="w-full h-9 px-3 font-mono bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsNewReceiptOpen(false)}
                  className="px-4 py-2 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 font-medium cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-medium shadow-xs cursor-pointer"
                >
                  Create Receipt
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 9. FAST SCAN MODAL                                                        */}
      {/* ========================================================================= */}
      {isFastScanOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/50 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <ScanBarcode className="w-5 h-5 text-blue-600" />
                <h3 className="text-base font-semibold text-slate-900 dark:text-white">Fast Barcode Scan</h3>
              </div>
              <button
                onClick={() => setIsFastScanOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-slate-500 dark:text-slate-400">
              Point your handheld scanner or enter the BOL barcode / PO number below:
            </p>

            <form onSubmit={handleFastScanSubmit} className="space-y-4">
              <div className="relative">
                <input
                  autoFocus
                  value={scanInput}
                  onChange={(e) => setScanInput(e.target.value)}
                  placeholder="WH/IN/0001 or PO-94022"
                  className="w-full h-11 pl-3 pr-10 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-mono text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <Barcode className="w-5 h-5 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>

              <div className="flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsFastScanOpen(false)}
                  className="px-4 py-2 rounded-lg text-xs text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 font-medium cursor-pointer"
                >
                  Close
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg text-xs bg-slate-900 dark:bg-blue-600 hover:bg-slate-800 dark:hover:bg-blue-700 text-white font-medium shadow-xs cursor-pointer"
                >
                  Lookup Manifest
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 10. AUDIT TRAIL MODAL                                                     */}
      {/* ========================================================================= */}
      {auditItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/50 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <History className="w-5 h-5 text-blue-600" />
                <h3 className="text-base font-semibold text-slate-900 dark:text-white">
                  Audit Trail • {auditItem.reference}
                </h3>
              </div>
              <button
                onClick={() => setAuditItem(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="flex items-start gap-3">
                <div className="w-2 h-2 rounded-full bg-emerald-500 mt-1.5" />
                <div>
                  <div className="font-semibold text-slate-900 dark:text-white">Stowed to Stock</div>
                  <div className="text-slate-400 text-[11px]">23 Oct 2026, 16:45 by Evan Lindqvist</div>
                  <div className="text-slate-600 dark:text-slate-300 mt-0.5">
                    Pallet lot verified and placed in WH/Stock3/Bay-A.
                  </div>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-2 h-2 rounded-full bg-blue-500 mt-1.5" />
                <div>
                  <div className="font-semibold text-slate-900 dark:text-white">Dock Inbound Scan</div>
                  <div className="text-slate-400 text-[11px]">23 Oct 2026, 16:10 at Gate 1</div>
                  <div className="text-slate-600 dark:text-slate-300 mt-0.5">
                    Carrier delivered Bill of Lading with zero damaged packages.
                  </div>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-2 h-2 rounded-full bg-slate-400 mt-1.5" />
                <div>
                  <div className="font-semibold text-slate-900 dark:text-white">PO Generated</div>
                  <div className="text-slate-400 text-[11px]">21 Oct 2026, 09:30 by System</div>
                  <div className="text-slate-600 dark:text-slate-300 mt-0.5">
                    Automatic replenishment order matching Nordic Sensor Dynamics.
                  </div>
                </div>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex justify-end">
              <button
                onClick={() => setAuditItem(null)}
                className="px-4 py-2 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-medium cursor-pointer"
              >
                Close Audit
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 11. TOAST NOTIFICATION BANNER                                             */}
      {/* ========================================================================= */}
      {toast.visible && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-3 px-4 py-3 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-xl border border-slate-800 dark:border-slate-200 text-xs animate-in slide-in-from-bottom-5 duration-200">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 dark:text-emerald-600 shrink-0" />
          <span className="font-medium">{toast.message}</span>
          <button
            onClick={() => setToast((prev) => ({ ...prev, visible: false }))}
            className="p-1 rounded text-slate-400 hover:text-white dark:hover:text-slate-900"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}
    </div>
  );
}
