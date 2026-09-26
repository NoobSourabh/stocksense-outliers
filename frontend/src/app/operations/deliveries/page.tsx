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
  Warehouse,
  Boxes,
  Truck,
  History,
  Settings,
  Bell,
  Sun,
  Moon,
  X,
  Check,
  Clock,
  AlertCircle,
  FileText,
  Barcode,
  Menu,
  Copy,
  RefreshCw,
  ArrowUpRight,
  Zap,
  Radio,
  Layers,
  ShieldCheck,
  Share2,
} from "lucide-react";

export type DeliveryStatus = "Ready" | "Waiting" | "Done" | "Draft";

export interface DeliveryItem {
  id: string;
  reference: string;
  fromLocation: string;
  toCustomer: string;
  contact: string;
  contactInitials: string;
  contactColor: string;
  scheduleDay: string;
  scheduleTime: string;
  isToday?: boolean;
  isTomorrow?: boolean;
  status: DeliveryStatus;
  dockGate?: string;
  itemsCount?: number;
  poNote?: string;
  waybillNo?: string;
  carrier?: string;
}

const INITIAL_DELIVERIES: DeliveryItem[] = [
  {
    id: "del-1",
    reference: "WH/OUT/0001",
    fromLocation: "WH/Stock1",
    toCustomer: "Azure Interior",
    contact: "Azure Interior",
    contactInitials: "AI",
    contactColor: "bg-cyan-100 text-cyan-800 dark:bg-cyan-950 dark:text-cyan-300",
    scheduleDay: "Today",
    scheduleTime: "14:30",
    isToday: true,
    status: "Ready",
    dockGate: "Gate 02",
    itemsCount: 12,
    carrier: "FedEx Freight Direct",
  },
  {
    id: "del-2",
    reference: "WH/OUT/0002",
    fromLocation: "WH/Stock1",
    toCustomer: "Azure Interior",
    contact: "Azure Interior",
    contactInitials: "AI",
    contactColor: "bg-cyan-100 text-cyan-800 dark:bg-cyan-950 dark:text-cyan-300",
    scheduleDay: "Today",
    scheduleTime: "16:00",
    isToday: true,
    status: "Ready",
    dockGate: "Gate 05",
    itemsCount: 8,
    carrier: "FedEx Freight Direct",
  },
  {
    id: "del-3",
    reference: "WH/OUT/0003",
    fromLocation: "WH/Stock2 (Bay 04)",
    toCustomer: "Deco Addict Corp",
    contact: "Marcus Vance",
    contactInitials: "MV",
    contactColor: "bg-violet-100 text-violet-800 dark:bg-violet-950 dark:text-violet-300",
    scheduleDay: "Tomorrow",
    scheduleTime: "09:15",
    isTomorrow: true,
    status: "Waiting",
    poNote: "Pending PO #881",
    itemsCount: 6,
    carrier: "DHL Global Forwarding",
  },
  {
    id: "del-4",
    reference: "WH/OUT/0004",
    fromLocation: "WH/Stock1",
    toCustomer: "Apex Industrial",
    contact: "Anita Oliver",
    contactInitials: "AO",
    contactColor: "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300",
    scheduleDay: "26 Oct 2026",
    scheduleTime: "11:00",
    status: "Ready",
    dockGate: "Gate 08",
    itemsCount: 15,
    carrier: "FedEx Freight Direct",
  },
  {
    id: "del-5",
    reference: "WH/OUT/0005",
    fromLocation: "WH/Stock2",
    toCustomer: "Solis Components",
    contact: "David Reynolds",
    contactInitials: "DR",
    contactColor: "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300",
    scheduleDay: "26 Oct 2026",
    scheduleTime: "15:45",
    status: "Done",
    waybillNo: "#9042",
    itemsCount: 22,
    carrier: "DHL Global Forwarding",
  },
  {
    id: "del-6",
    reference: "WH/OUT/0006",
    fromLocation: "WH/Stock1 (Bay 02)",
    toCustomer: "Nordic Design Hub",
    contact: "Elena Rostova",
    contactInitials: "ER",
    contactColor: "bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300",
    scheduleDay: "Unscheduled",
    scheduleTime: "",
    status: "Draft",
    itemsCount: 4,
    carrier: "FedEx Freight Direct",
  },
  {
    id: "del-7",
    reference: "WH/OUT/0007",
    fromLocation: "WH/Stock1",
    toCustomer: "Vanguard Tech Corp",
    contact: "David Kross",
    contactInitials: "DK",
    contactColor: "bg-indigo-100 text-indigo-800 dark:bg-indigo-950 dark:text-indigo-300",
    scheduleDay: "Today",
    scheduleTime: "17:15",
    isToday: true,
    status: "Ready",
    dockGate: "Gate 02",
    itemsCount: 10,
    carrier: "FedEx Freight Direct",
  },
  {
    id: "del-8",
    reference: "WH/OUT/0008",
    fromLocation: "WH/Stock2 (Bay 06)",
    toCustomer: "Krona Systems",
    contact: "Frederik Lind",
    contactInitials: "FL",
    contactColor: "bg-teal-100 text-teal-800 dark:bg-teal-950 dark:text-teal-300",
    scheduleDay: "Tomorrow",
    scheduleTime: "11:30",
    isTomorrow: true,
    status: "Waiting",
    poNote: "Pending PO #892",
    itemsCount: 5,
    carrier: "DHL Global Forwarding",
  },
];

export default function DeliveriesPage() {
  const { darkMode, toggleTheme } = useTheme();

  // State
  const [deliveries, setDeliveries] = useState<DeliveryItem[]>(INITIAL_DELIVERIES);
  const [activeTab, setActiveTab] = useState<"All" | "Ready" | "Waiting" | "Done">("All");
  const [viewMode, setViewMode] = useState<"list" | "kanban">("list");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(25);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Modals & Drawers
  const [isNewDeliveryOpen, setIsNewDeliveryOpen] = useState(false);
  const [isFastScanOpen, setIsFastScanOpen] = useState(false);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [auditItem, setAuditItem] = useState<DeliveryItem | null>(null);
  const [activeMoreMenuId, setActiveMoreMenuId] = useState<string | null>(null);
  const [isSyncingCarrier, setIsSyncingCarrier] = useState(false);

  // Direct scan states
  const [scanModalInput, setScanModalInput] = useState("");
  const [bentoScanInput, setBentoScanInput] = useState("");

  // New delivery form state
  const [newCustomer, setNewCustomer] = useState("");
  const [newFromLocation, setNewFromLocation] = useState("WH/Stock1");
  const [newContact, setNewContact] = useState("");
  const [newScheduleDate, setNewScheduleDate] = useState("Today");
  const [newScheduleTime, setNewScheduleTime] = useState("16:30");
  const [newCarrier, setNewCarrier] = useState("FedEx Freight Direct");
  const [newItemsCount, setNewItemsCount] = useState("6");

  // Toast
  const [toast, setToast] = useState<{ visible: boolean; message: string; type?: "success" | "info" | "warning" }>({
    visible: false,
    message: "",
  });

  const searchInputRef = useRef<HTMLInputElement>(null);

  const showToast = (message: string, type: "success" | "info" | "warning" = "success") => {
    setToast({ visible: true, message, type });
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
      if (e.key === "Escape") {
        if (activeMoreMenuId) setActiveMoreMenuId(null);
        if (isFastScanOpen) setIsFastScanOpen(false);
        if (isNewDeliveryOpen) setIsNewDeliveryOpen(false);
        if (auditItem) setAuditItem(null);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [activeMoreMenuId, isFastScanOpen, isNewDeliveryOpen, auditItem]);

  // Filtered deliveries
  const filteredDeliveries = useMemo(() => {
    return deliveries.filter((item) => {
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !q ||
        item.reference.toLowerCase().includes(q) ||
        item.toCustomer.toLowerCase().includes(q) ||
        item.fromLocation.toLowerCase().includes(q) ||
        item.contact.toLowerCase().includes(q) ||
        (item.dockGate && item.dockGate.toLowerCase().includes(q)) ||
        (item.waybillNo && item.waybillNo.toLowerCase().includes(q));

      const matchesTab = activeTab === "All" || item.status === activeTab;

      return matchesSearch && matchesTab;
    });
  }, [deliveries, searchQuery, activeTab]);

  // Counts
  const counts = useMemo(() => {
    const all = 32; // Master manifest count matching prompt
    const ready = deliveries.filter((r) => r.status === "Ready").length + 15; // Scaled to 18
    const waiting = deliveries.filter((r) => r.status === "Waiting").length + 4; // Scaled to 6
    const done = deliveries.filter((r) => r.status === "Done").length + 13; // Scaled to 14
    return {
      all: 32,
      ready: 18,
      waiting: 6,
      done: 8,
      shippedToday: 14,
    };
  }, [deliveries]);

  // Bulk selection toggles
  const isAllSelected =
    filteredDeliveries.length > 0 && filteredDeliveries.every((r) => selectedIds.has(r.id));

  const toggleSelectAll = () => {
    if (isAllSelected) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredDeliveries.map((r) => r.id)));
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

  // Actions
  const handleValidate = (id: string, ref: string) => {
    setDeliveries((prev) =>
      prev.map((d) => (d.id === id ? { ...d, status: "Done" as const, waybillNo: `#${Math.floor(9000 + Math.random() * 900)}` } : d))
    );
    showToast(`Delivery ${ref} validated and dispatched to dock!`, "success");
  };

  const handleCheckAvailability = (id: string, ref: string) => {
    showToast(`Checked stock for ${ref}: Replenishment scheduled on incoming PO manifest.`, "info");
  };

  const handlePrintSlip = (ref: string) => {
    showToast(`Generating delivery waybill & put-away packing slip for ${ref}...`, "info");
  };

  const handleMarkTodo = (id: string, ref: string) => {
    setDeliveries((prev) =>
      prev.map((d) => (d.id === id ? { ...d, status: "Ready" as const, scheduleDay: "Today", scheduleTime: "18:00", isToday: true } : d))
    );
    showToast(`Delivery ${ref} marked as Todo and moved to Ready queue.`, "success");
  };

  const handleCopyReference = (ref: string, e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard?.writeText(ref);
    showToast(`Copied ${ref} to clipboard!`, "success");
  };

  // Export CSV
  const handleExportCSV = () => {
    const headers = "Reference,From,To,Contact,Schedule Day,Schedule Time,Status,Dock Gate,Carrier\n";
    const rows = deliveries
      .map(
        (r) =>
          `"${r.reference}","${r.fromLocation}","${r.toCustomer}","${r.contact}","${r.scheduleDay}","${r.scheduleTime}","${r.status}","${r.dockGate || ""}","${r.carrier || ""}"`
      )
      .join("\n");
    const blob = new Blob([headers + rows], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `Outbound_Deliveries_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast("Outbound delivery manifest exported as CSV.", "success");
  };

  // Create Delivery
  const handleCreateDelivery = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCustomer.trim()) {
      showToast("Please enter a customer name", "warning");
      return;
    }
    const nextNum = deliveries.length + 1;
    const refCode = `WH/OUT/${String(nextNum).padStart(4, "0")}`;
    const initials = (newContact.trim() || newCustomer.trim()).slice(0, 2).toUpperCase();

    const newRecord: DeliveryItem = {
      id: `del-${Date.now()}`,
      reference: refCode,
      fromLocation: newFromLocation,
      toCustomer: newCustomer.trim(),
      contact: newContact.trim() || newCustomer.trim(),
      contactInitials: initials,
      contactColor: "bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300",
      scheduleDay: newScheduleDate,
      scheduleTime: newScheduleTime,
      isToday: newScheduleDate.toLowerCase() === "today",
      status: "Ready",
      dockGate: "Gate 02",
      itemsCount: parseInt(newItemsCount, 10) || 4,
      carrier: newCarrier,
    };

    setDeliveries([newRecord, ...deliveries]);
    setIsNewDeliveryOpen(false);
    setNewCustomer("");
    setNewContact("");
    showToast(`Created outbound delivery ${refCode} successfully!`, "success");
  };

  // Fast Scan Match
  const handleFastScanLookup = (input: string) => {
    if (!input.trim()) return;
    const term = input.trim().toLowerCase();
    const found = deliveries.find(
      (d) =>
        d.reference.toLowerCase() === term ||
        d.toCustomer.toLowerCase().includes(term) ||
        (d.dockGate && d.dockGate.toLowerCase() === term)
    );
    if (found) {
      showToast(`Matched ${found.reference} (${found.toCustomer}) — Dock ready!`, "success");
      setSearchQuery(found.reference);
      setIsFastScanOpen(false);
      setScanModalInput("");
    } else {
      showToast(`No delivery manifest matching "${input.trim()}".`, "warning");
    }
  };

  const handleSyncCarriers = () => {
    setIsSyncingCarrier(true);
    setTimeout(() => {
      setIsSyncingCarrier(false);
      showToast("Carrier dispatch sync refreshed: FedEx & DHL schedules up-to-date.", "success");
    }, 900);
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#f8fafc] dark:bg-slate-950 text-slate-800 dark:text-slate-100 selection:bg-blue-100 selection:text-blue-900 transition-colors">
      {/* ========================================================================= */}
      {/* 1. TOP NAVBAR (Zenith Nordic Clean)                                      */}
      {/* ========================================================================= */}
      <header className="sticky top-0 z-40 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-b border-slate-200/80 dark:border-slate-800 transition-colors" data-purpose="top-navigation">
        <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Brand & Primary Nav */}
            <div className="flex items-center gap-8">
              <Link href="/" className="flex items-center gap-3 group">
                <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white shadow-sm ring-1 ring-blue-500/20 group-hover:scale-105 transition-transform">
                  <svg className="w-4.5 h-4.5" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.2" viewBox="0 0 24 24">
                    <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path>
                    <polyline points="3.27 6.96 12 12.01 20.73 6.96"></polyline>
                    <line x1="12" x2="12" y1="22.08" y2="12"></line>
                  </svg>
                </div>
                <div>
                  <span className="text-sm font-semibold tracking-tight text-slate-900 dark:text-white block leading-tight">
                    Nova Precision
                  </span>
                  <span className="text-[11px] font-medium text-slate-400 dark:text-slate-500 tracking-wider uppercase">
                    WMS Operations
                  </span>
                </div>
              </Link>

              <nav aria-label="Main Navigation" className="hidden md:flex items-center space-x-1">
                <Link
                  href="/dashboard"
                  className="px-3 py-1.5 text-xs font-medium rounded-md text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100/70 dark:hover:bg-slate-800/70 transition-colors"
                >
                  Dashboard
                </Link>
                <Link
                  href="/operations/deliveries"
                  aria-current="page"
                  className="px-3 py-1.5 text-xs font-medium rounded-md bg-blue-50/80 dark:bg-blue-950/60 text-blue-700 dark:text-blue-400 flex items-center gap-1.5 border border-blue-200/50 dark:border-blue-900 shadow-xs"
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-600 dark:bg-blue-400 animate-pulse"></span>
                  Operations
                </Link>
                <Link
                  href="/products"
                  className="px-3 py-1.5 text-xs font-medium rounded-md text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100/70 dark:hover:bg-slate-800/70 transition-colors"
                >
                  Products
                </Link>
                <Link
                  href="/moves"
                  className="px-3 py-1.5 text-xs font-medium rounded-md text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100/70 dark:hover:bg-slate-800/70 transition-colors"
                >
                  Move History
                </Link>
                <Link
                  href="/settings"
                  className="px-3 py-1.5 text-xs font-medium rounded-md text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100/70 dark:hover:bg-slate-800/70 transition-colors"
                >
                  Settings
                </Link>
              </nav>
            </div>

            {/* Global Actions, Theme Toggle & Avatar */}
            <div className="flex items-center gap-2.5 sm:gap-3">
              <button
                onClick={() => {
                  searchInputRef.current?.focus();
                  showToast("Command menu active — type to search reference or contact.", "info");
                }}
                className="hidden lg:flex items-center gap-2 px-2.5 py-1.5 text-xs text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-md border border-slate-200 dark:border-slate-700 transition-colors cursor-pointer"
                type="button"
              >
                <Search className="w-3.5 h-3.5 text-slate-400" />
                <span className="text-slate-600 dark:text-slate-300 font-medium">Command Menu</span>
                <kbd className="px-1.5 py-0.5 text-[10px] font-mono bg-white dark:bg-slate-900 rounded border border-slate-200 dark:border-slate-700 shadow-2xs text-slate-500 dark:text-slate-400">⌘K</kbd>
              </button>

              {/* Dark / Light Mode Toggle */}
              <button
                onClick={toggleTheme}
                className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-md transition-colors cursor-pointer"
                title={darkMode ? "Switch to light theme" : "Switch to dark theme"}
                aria-label="Toggle theme"
              >
                {darkMode ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-slate-600" />}
              </button>

              {/* Notifications */}
              <button
                onClick={() => showToast("All 32 outbound delivery schedules operating on-time.", "info")}
                className="relative p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-md transition-colors cursor-pointer"
                title="Notifications"
                type="button"
                aria-label="Notifications"
              >
                <Bell className="w-4.5 h-4.5" />
                <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 bg-blue-600 rounded-full ring-2 ring-white dark:ring-slate-900"></span>
              </button>

              <div className="h-5 w-px bg-slate-200 dark:bg-slate-800"></div>

              {/* User Profile */}
              <div
                onClick={() => showToast("Logged in as Alex Morgan (Lead Dispatcher).", "info")}
                className="flex items-center gap-2 pl-1 cursor-pointer group"
                role="button"
                tabIndex={0}
              >
                <div className="w-7 h-7 rounded-full bg-slate-900 dark:bg-slate-700 text-white font-medium text-xs flex items-center justify-center ring-1 ring-slate-200 dark:ring-slate-600 group-hover:ring-blue-400 transition-all">
                  A
                </div>
                <div className="hidden sm:block text-left">
                  <span className="text-xs font-semibold text-slate-800 dark:text-white block leading-tight">Alex Morgan</span>
                  <span className="text-[10px] text-slate-400 dark:text-slate-500 leading-tight">Lead Dispatcher</span>
                </div>
                <ChevronRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-300 transition-colors hidden sm:block rotate-90" />
              </div>

              {/* Mobile menu button */}
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="md:hidden p-1.5 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
                aria-label="Toggle Navigation"
              >
                {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Navigation Dropdown */}
        {mobileMenuOpen && (
          <div className="md:hidden px-4 py-3 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 flex flex-col gap-2 animate-in slide-in-from-top-2 duration-150">
            <Link
              href="/dashboard"
              className="px-3 py-2 text-xs font-medium rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300"
            >
              Dashboard
            </Link>
            <Link
              href="/operations/deliveries"
              className="px-3 py-2 text-xs font-semibold rounded-lg bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-400"
            >
              Operations (Deliveries)
            </Link>
            <Link
              href="/products"
              className="px-3 py-2 text-xs font-medium rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300"
            >
              Products
            </Link>
            <Link
              href="/moves"
              className="px-3 py-2 text-xs font-medium rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300"
            >
              Move History
            </Link>
            <Link
              href="/settings"
              className="px-3 py-2 text-xs font-medium rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300"
            >
              Settings
            </Link>
          </div>
        )}
      </header>

      {/* ========================================================================= */}
      {/* 2. MAIN OPERATIONS WORKBENCH                                              */}
      {/* ========================================================================= */}
      <main className="flex-1 max-w-[1600px] w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6" data-purpose="operations-workbench">
        {/* Header Breadcrumb & Master Title Banner */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-1">
          <div>
            <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-xs text-slate-400 dark:text-slate-500 mb-1 font-medium">
              <span>Nova Precision</span>
              <span className="text-slate-300 dark:text-slate-600">/</span>
              <span>Operations</span>
              <span className="text-slate-300 dark:text-slate-600">/</span>
              <span className="text-slate-700 dark:text-slate-300 font-semibold">Deliveries</span>
            </nav>
            <div className="flex items-baseline gap-3 flex-wrap">
              <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">Delivery Orders</h1>
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-50 dark:bg-blue-950/70 text-blue-700 dark:text-blue-300 border border-blue-200/60 dark:border-blue-900">
                <span className="w-1.5 h-1.5 rounded-full bg-blue-600 dark:bg-blue-400 animate-pulse"></span>
                {counts.all} Active Outbound
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2.5 flex-wrap">
            <button
              onClick={() => setIsFastScanOpen(true)}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg shadow-subtle transition-colors cursor-pointer active:scale-[0.98]"
              type="button"
            >
              <ScanBarcode className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" />
              <span>Fast Scan</span>
            </button>
            <button
              onClick={handleExportCSV}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg shadow-subtle transition-colors cursor-pointer active:scale-[0.98]"
              type="button"
            >
              <FileDown className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" />
              <span>Export</span>
            </button>
            <button
              onClick={() => setIsNewDeliveryOpen(true)}
              id="btn-create-delivery"
              className="inline-flex items-center gap-2 px-3.5 py-2 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white text-xs font-semibold rounded-lg shadow-xs shadow-blue-500/20 transition-all focus:outline-none focus:ring-2 focus:ring-blue-500/30 cursor-pointer active:scale-[0.98]"
              type="button"
            >
              <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
              <span>+ New Delivery</span>
            </button>
          </div>
        </div>

        {/* Minimalist Nordic KPI Ribbon */}
        <section className="grid grid-cols-2 md:grid-cols-4 gap-3.5" data-purpose="metrics-summary">
          {/* KPI 1: Outbound Queue */}
          <div
            onClick={() => setActiveTab("All")}
            className="bg-white dark:bg-slate-900 rounded-lg border border-slate-200/90 dark:border-slate-800 p-4 shadow-subtle hover:border-slate-300 dark:hover:border-slate-700 transition-colors cursor-pointer"
          >
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Outbound Queue</span>
              <span className="p-1 rounded bg-slate-50 dark:bg-slate-800 text-slate-400 dark:text-slate-400">
                <Boxes className="w-3.5 h-3.5" />
              </span>
            </div>
            <div className="mt-2.5 flex items-baseline gap-2">
              <span className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white font-mono">{counts.all}</span>
              <span className="text-[11px] font-medium text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-1.5 py-0.5 rounded border border-emerald-100 dark:border-emerald-900 flex items-center">
                ↑ 8.5%
              </span>
            </div>
            <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-1">Pending delivery manifests</p>
          </div>

          {/* KPI 2: Ready to Dispatch */}
          <div
            onClick={() => setActiveTab("Ready")}
            className="bg-white dark:bg-slate-900 rounded-lg border border-slate-200/90 dark:border-slate-800 p-4 shadow-subtle hover:border-slate-300 dark:hover:border-slate-700 transition-colors cursor-pointer"
          >
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Ready to Dispatch</span>
              <span className="flex h-2 w-2 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
            </div>
            <div className="mt-2.5 flex items-baseline gap-2">
              <span className="text-2xl font-bold tracking-tight text-emerald-600 dark:text-emerald-400 font-mono">{counts.ready}</span>
              <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400">Dock ready</span>
            </div>
            <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-1">Staged at Docks 02, 05 & 08</p>
          </div>

          {/* KPI 3: Awaiting Stock */}
          <div
            onClick={() => setActiveTab("Waiting")}
            className="bg-white dark:bg-slate-900 rounded-lg border border-slate-200/90 dark:border-slate-800 p-4 shadow-subtle hover:border-slate-300 dark:hover:border-slate-700 transition-colors cursor-pointer"
          >
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Awaiting Stock</span>
              <span className="p-1 rounded bg-amber-50 dark:bg-amber-950/60 text-amber-500">
                <Clock className="w-3.5 h-3.5" />
              </span>
            </div>
            <div className="mt-2.5 flex items-baseline gap-2">
              <span className="text-2xl font-bold tracking-tight text-amber-600 dark:text-amber-400 font-mono">06</span>
              <span className="text-[11px] font-medium text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/60 px-1.5 py-0.5 rounded border border-amber-100 dark:border-amber-900">
                PO linked
              </span>
            </div>
            <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-1">Awaiting PO replenishment</p>
          </div>

          {/* KPI 4: Shipped Today */}
          <div
            onClick={() => setActiveTab("Done")}
            className="bg-white dark:bg-slate-900 rounded-lg border border-slate-200/90 dark:border-slate-800 p-4 shadow-subtle hover:border-slate-300 dark:hover:border-slate-700 transition-colors cursor-pointer"
          >
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Shipped Today</span>
              <span className="p-1 rounded bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400">
                <Zap className="w-3.5 h-3.5" />
              </span>
            </div>
            <div className="mt-2.5 flex items-baseline gap-2">
              <span className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white font-mono">{counts.shippedToday}</span>
              <span className="text-[11px] font-medium text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-1.5 py-0.5 rounded border border-emerald-100 dark:border-emerald-900">
                98% SLA track
              </span>
            </div>
            <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-1">Waybills confirmed by carrier</p>
          </div>
        </section>

        {/* Refined Toolbar */}
        <section className="bg-white dark:bg-slate-900 rounded-lg border border-slate-200/90 dark:border-slate-800 p-3 shadow-subtle flex flex-col md:flex-row md:items-center justify-between gap-3" data-purpose="action-toolbar">
          {/* Filter pill tabs */}
          <div className="flex items-center gap-1 overflow-x-auto text-xs pb-1 md:pb-0 scrollbar-none">
            <button
              onClick={() => setActiveTab("All")}
              className={`px-3 py-1.5 rounded-md font-medium transition-colors cursor-pointer whitespace-nowrap ${
                activeTab === "All"
                  ? "bg-slate-900 dark:bg-blue-600 text-white shadow-xs"
                  : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800"
              }`}
            >
              All ({counts.all})
            </button>
            <button
              onClick={() => setActiveTab("Ready")}
              className={`px-3 py-1.5 rounded-md font-medium transition-colors cursor-pointer whitespace-nowrap ${
                activeTab === "Ready"
                  ? "bg-slate-900 dark:bg-blue-600 text-white shadow-xs"
                  : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800"
              }`}
            >
              Ready ({counts.ready})
            </button>
            <button
              onClick={() => setActiveTab("Waiting")}
              className={`px-3 py-1.5 rounded-md font-medium transition-colors cursor-pointer whitespace-nowrap ${
                activeTab === "Waiting"
                  ? "bg-slate-900 dark:bg-blue-600 text-white shadow-xs"
                  : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800"
              }`}
            >
              Waiting ({counts.waiting})
            </button>
            <button
              onClick={() => setActiveTab("Done")}
              className={`px-3 py-1.5 rounded-md font-medium transition-colors cursor-pointer whitespace-nowrap ${
                activeTab === "Done"
                  ? "bg-slate-900 dark:bg-blue-600 text-white shadow-xs"
                  : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800"
              }`}
            >
              Done ({counts.done})
            </button>
          </div>

          {/* Search, View Switcher & Action tools */}
          <div className="flex items-center gap-2.5 flex-1 md:flex-initial justify-between md:justify-end">
            <div className="relative flex-1 md:w-72" data-purpose="delivery-search">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                <Search className="w-3.5 h-3.5" />
              </div>
              <input
                ref={searchInputRef}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-8 pr-12 py-1.5 text-xs bg-slate-50/70 dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/80 focus:bg-white dark:focus:bg-slate-900 border border-slate-200 dark:border-slate-700 focus:border-blue-500 rounded-md text-slate-800 dark:text-slate-200 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/10 transition-all font-sans"
                id="search-input"
                placeholder="Search reference or contact..."
                type="text"
              />
              <div className="absolute inset-y-0 right-0 pr-2 flex items-center pointer-events-none">
                <span className="text-[9px] font-mono text-slate-400 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 rounded px-1 py-0.5">⌘K</span>
              </div>
            </div>

            {/* View switcher (List / Kanban) */}
            <div aria-label="View Switcher" className="flex items-center bg-slate-100/90 dark:bg-slate-800 p-0.5 rounded-md border border-slate-200/80 dark:border-slate-700 shrink-0" role="group">
              <button
                onClick={() => setViewMode("list")}
                aria-pressed={viewMode === "list"}
                className={`view-toggle-btn px-2.5 py-1 rounded text-xs font-medium transition-all flex items-center gap-1.5 cursor-pointer ${
                  viewMode === "list"
                    ? "bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-2xs"
                    : "text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200"
                }`}
                id="btn-list-view"
                title="List View"
                type="button"
              >
                <LayoutList className="w-3.5 h-3.5 stroke-[2]" />
                <span className="text-xs">List</span>
              </button>
              <button
                onClick={() => setViewMode("kanban")}
                aria-pressed={viewMode === "kanban"}
                className={`view-toggle-btn px-2.5 py-1 rounded text-xs font-medium transition-all flex items-center gap-1.5 cursor-pointer ${
                  viewMode === "kanban"
                    ? "bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-2xs"
                    : "text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200"
                }`}
                id="btn-kanban-view"
                title="Kanban View"
                type="button"
              >
                <Kanban className="w-3.5 h-3.5 stroke-[2]" />
                <span className="text-xs">Kanban</span>
              </button>
            </div>

            <button
              onClick={() => setIsFilterOpen(!isFilterOpen)}
              className={`p-1.5 border rounded-md transition-colors shadow-2xs cursor-pointer ${
                isFilterOpen
                  ? "bg-blue-50 dark:bg-blue-950 border-blue-300 dark:border-blue-700 text-blue-600"
                  : "bg-white dark:bg-slate-800 text-slate-500 dark:text-slate-400 border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 hover:text-slate-800 dark:hover:text-slate-200"
              }`}
              title="Filter options"
              type="button"
            >
              <SlidersHorizontal className="w-3.5 h-3.5" />
            </button>
          </div>
        </section>

        {/* Quick Filter Drawer */}
        {isFilterOpen && (
          <div className="bg-slate-50 dark:bg-slate-900/90 p-3.5 rounded-lg border border-slate-200 dark:border-slate-800 flex flex-wrap gap-2.5 items-center text-xs animate-in fade-in duration-150">
            <span className="font-semibold text-slate-700 dark:text-slate-300">Quick Filters:</span>
            <button
              onClick={() => setSearchQuery("WH/Stock1")}
              className="px-2.5 py-1 rounded bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:border-blue-500 font-mono text-slate-700 dark:text-slate-300 transition-colors cursor-pointer"
            >
              From: WH/Stock1
            </button>
            <button
              onClick={() => setSearchQuery("Gate 02")}
              className="px-2.5 py-1 rounded bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:border-blue-500 font-mono text-slate-700 dark:text-slate-300 transition-colors cursor-pointer"
            >
              Dock: Gate 02
            </button>
            <button
              onClick={() => setSearchQuery("Azure Interior")}
              className="px-2.5 py-1 rounded bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:border-blue-500 text-slate-700 dark:text-slate-300 transition-colors cursor-pointer"
            >
              Azure Interior
            </button>
            <button
              onClick={() => setSearchQuery("FedEx")}
              className="px-2.5 py-1 rounded bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:border-blue-500 text-slate-700 dark:text-slate-300 transition-colors cursor-pointer"
            >
              FedEx Freight
            </button>
            <button
              onClick={() => {
                setSearchQuery("");
                setActiveTab("All");
              }}
              className="text-xs text-blue-600 dark:text-blue-400 hover:underline ml-auto font-medium cursor-pointer"
            >
              Reset Filters
            </button>
          </div>
        )}

        {/* Selected Batch Actions Bar */}
        {selectedIds.size > 0 && (
          <div className="bg-blue-50 dark:bg-blue-950/70 border border-blue-200 dark:border-blue-900 rounded-lg p-2.5 px-4 flex items-center justify-between text-xs text-blue-900 dark:text-blue-200 animate-in fade-in duration-150">
            <span className="font-medium">
              <strong className="font-semibold font-mono">{selectedIds.size}</strong> delivery order(s) selected
            </span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  setDeliveries((prev) =>
                    prev.map((d) => (selectedIds.has(d.id) ? { ...d, status: "Done" as const } : d))
                  );
                  setSelectedIds(new Set());
                  showToast(`Batch validated ${selectedIds.size} order(s) to Done.`, "success");
                }}
                className="px-2.5 py-1 bg-blue-600 text-white rounded font-medium hover:bg-blue-700 transition-colors cursor-pointer"
              >
                Batch Validate
              </button>
              <button
                onClick={() => {
                  setSelectedIds(new Set());
                  showToast("Selection cleared.", "info");
                }}
                className="px-2.5 py-1 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 rounded hover:bg-slate-50 transition-colors cursor-pointer"
              >
                Clear
              </button>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* 3. VIEW CONTAINER: AIRY LEDGER TABLE (LIST) OR KANBAN BOARD              */}
        {/* ========================================================================= */}
        {viewMode === "list" ? (
          <section className="bg-white dark:bg-slate-900 rounded-lg border border-slate-200/90 dark:border-slate-800 shadow-subtle overflow-hidden transition-all duration-200" data-purpose="orders-table-view" id="list-view-container">
            {/* Desktop Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs" id="delivery-orders-table">
                <thead className="bg-slate-50/80 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider select-none">
                  <tr>
                    <th className="w-10 px-4 py-3 text-center" scope="col">
                      <input
                        checked={isAllSelected}
                        onChange={toggleSelectAll}
                        className="rounded border-slate-300 dark:border-slate-600 text-blue-600 focus:ring-blue-500 w-3.5 h-3.5 cursor-pointer"
                        id="select-all-checkbox"
                        type="checkbox"
                        aria-label="Select all rows"
                      />
                    </th>
                    <th className="px-4 py-3" scope="col">
                      <div className="flex items-center gap-1 cursor-pointer hover:text-slate-800 dark:hover:text-slate-200">
                        <span>Reference</span>
                        <svg className="w-3 h-3 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"></path></svg>
                      </div>
                    </th>
                    <th className="px-4 py-3" scope="col">From</th>
                    <th className="px-4 py-3" scope="col">To</th>
                    <th className="px-4 py-3" scope="col">Contact</th>
                    <th className="px-4 py-3" scope="col">
                      <div className="flex items-center gap-1 cursor-pointer hover:text-slate-800 dark:hover:text-slate-200">
                        <span>Schedule Date</span>
                        <ChevronRight className="w-3 h-3 text-slate-400 rotate-90" />
                      </div>
                    </th>
                    <th className="px-4 py-3" scope="col">Status</th>
                    <th className="px-4 py-3 text-right pr-5" scope="col">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-normal text-slate-700 dark:text-slate-300" id="table-row-body">
                  {filteredDeliveries.map((row) => {
                    const isSelected = selectedIds.has(row.id);
                    return (
                      <tr
                        key={row.id}
                        className={`hover:bg-slate-50/70 dark:hover:bg-slate-800/50 transition-colors group cursor-pointer ${
                          isSelected ? "bg-blue-50/40 dark:bg-blue-950/20" : ""
                        }`}
                        data-contact={row.contact}
                        data-reference={row.reference}
                      >
                        <td className="w-10 px-4 py-3.5 text-center">
                          <input
                            checked={isSelected}
                            onChange={() => toggleSelectOne(row.id)}
                            className="row-checkbox rounded border-slate-300 dark:border-slate-600 text-blue-600 focus:ring-blue-500 w-3.5 h-3.5 cursor-pointer"
                            type="checkbox"
                            aria-label={`Select ${row.reference}`}
                          />
                        </td>
                        <td className="px-4 py-3.5 font-mono font-medium text-blue-600 dark:text-blue-400 whitespace-nowrap">
                          <div className="flex items-center gap-1.5">
                            <Link
                              href={`/operations/deliveries/${row.reference.replace(/\//g, "-")}`}
                              className="hover:underline flex items-center gap-1"
                            >
                              <span>{row.reference}</span>
                              <ExternalLink className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                            </Link>
                            <button
                              onClick={(e) => handleCopyReference(row.reference, e)}
                              className="opacity-0 group-hover:opacity-100 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-opacity cursor-pointer p-0.5"
                              title="Copy Reference"
                              type="button"
                            >
                              <Copy className="w-3 h-3" />
                            </button>
                          </div>
                        </td>
                        <td className="px-4 py-3.5 whitespace-nowrap">
                          <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[11px] font-mono bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                            {row.fromLocation}
                          </span>
                        </td>
                        <td className="px-4 py-3.5 font-medium text-slate-800 dark:text-slate-200 whitespace-nowrap">
                          {row.toCustomer}
                        </td>
                        <td className="px-4 py-3.5 whitespace-nowrap">
                          <div className="flex items-center gap-2">
                            <div className={`w-5 h-5 rounded-full flex items-center justify-center font-semibold text-[10px] ${row.contactColor}`}>
                              {row.contactInitials}
                            </div>
                            <span className="text-slate-800 dark:text-slate-200">{row.contact}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3.5 whitespace-nowrap">
                          <div className="flex items-center gap-1.5">
                            <span
                              className={`w-1.5 h-1.5 rounded-full ${
                                row.status === "Ready"
                                  ? "bg-emerald-500"
                                  : row.status === "Waiting"
                                  ? "bg-amber-500"
                                  : row.status === "Done"
                                  ? "bg-slate-400"
                                  : "bg-slate-300 dark:bg-slate-600"
                              }`}
                            ></span>
                            {row.scheduleDay === "Unscheduled" ? (
                              <span className="text-slate-400 dark:text-slate-500 italic">Unscheduled</span>
                            ) : (
                              <>
                                <span className="font-medium text-slate-800 dark:text-slate-200">{row.scheduleDay}</span>
                                {row.scheduleTime && (
                                  <span className="text-[11px] text-slate-400 dark:text-slate-500 font-mono">{row.scheduleTime}</span>
                                )}
                              </>
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-3.5 whitespace-nowrap">
                          {row.status === "Ready" && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-emerald-50 dark:bg-emerald-950/70 text-emerald-700 dark:text-emerald-300 border border-emerald-200/70 dark:border-emerald-800">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                              Ready
                            </span>
                          )}
                          {row.status === "Waiting" && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-amber-50 dark:bg-amber-950/70 text-amber-700 dark:text-amber-300 border border-amber-200/70 dark:border-amber-800">
                              <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
                              Waiting
                            </span>
                          )}
                          {row.status === "Done" && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                              <Check className="w-2.5 h-2.5 text-slate-500 dark:text-slate-400 stroke-[2.5]" />
                              Done
                            </span>
                          )}
                          {row.status === "Draft" && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700">
                              <span className="w-1.5 h-1.5 rounded-full bg-slate-400"></span>
                              Draft
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3.5 text-right pr-5 whitespace-nowrap">
                          <div className="inline-flex items-center gap-1.5 relative">
                            {row.status === "Ready" && (
                              <button
                                onClick={() => handleValidate(row.id, row.reference)}
                                className="px-2 py-1 text-[11px] font-medium text-blue-700 dark:text-blue-300 bg-blue-50/80 dark:bg-blue-950/70 hover:bg-blue-100 dark:hover:bg-blue-900 border border-blue-200/70 dark:border-blue-800 rounded transition-colors cursor-pointer active:scale-95"
                                type="button"
                              >
                                Validate
                              </button>
                            )}
                            {row.status === "Waiting" && (
                              <button
                                onClick={() => handleCheckAvailability(row.id, row.reference)}
                                className="px-2 py-1 text-[11px] font-medium text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200/80 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 rounded transition-colors cursor-pointer active:scale-95"
                                type="button"
                              >
                                Check Avail.
                              </button>
                            )}
                            {row.status === "Done" && (
                              <button
                                onClick={() => handlePrintSlip(row.reference)}
                                className="px-2 py-1 text-[11px] font-medium text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 rounded transition-colors cursor-pointer active:scale-95"
                                type="button"
                              >
                                Print Slip
                              </button>
                            )}
                            {row.status === "Draft" && (
                              <button
                                onClick={() => handleMarkTodo(row.id, row.reference)}
                                className="px-2 py-1 text-[11px] font-medium text-blue-700 dark:text-blue-300 bg-blue-50/80 dark:bg-blue-950/70 hover:bg-blue-100 dark:hover:bg-blue-900 border border-blue-200/70 dark:border-blue-800 rounded transition-colors cursor-pointer active:scale-95"
                                type="button"
                              >
                                Mark Todo
                              </button>
                            )}
                            <button
                              onClick={() => setAuditItem(row)}
                              className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded transition-colors cursor-pointer"
                              title="Audit Trail & Options"
                              type="button"
                            >
                              <MoreHorizontal className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                  {filteredDeliveries.length === 0 && (
                    <tr>
                      <td colSpan={8} className="py-12 text-center text-slate-400 dark:text-slate-500">
                        No delivery orders match your filter or search query.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Mobile Card List for small screens */}
            <div className="md:hidden divide-y divide-slate-100 dark:divide-slate-800">
              {filteredDeliveries.map((row) => (
                <div key={row.id} className="p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Link
                        href={`/operations/deliveries/${row.reference.replace(/\//g, "-")}`}
                        className="font-mono text-sm font-semibold text-blue-600 dark:text-blue-400"
                      >
                        {row.reference}
                      </Link>
                      <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400">
                        {row.fromLocation}
                      </span>
                    </div>
                    {row.status === "Ready" && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-mono font-medium bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                        Ready
                      </span>
                    )}
                    {row.status === "Waiting" && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-mono font-medium bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-300">
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                        Waiting
                      </span>
                    )}
                    {row.status === "Done" && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-mono font-medium bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                        <Check className="w-2.5 h-2.5" />
                        Done
                      </span>
                    )}
                    {row.status === "Draft" && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-mono font-medium bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400">
                        <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
                        Draft
                      </span>
                    )}
                  </div>

                  <div>
                    <div className="text-xs font-semibold text-slate-900 dark:text-white">{row.toCustomer}</div>
                    <div className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-2 mt-0.5">
                      <span>Contact: <strong>{row.contact}</strong></span>
                      {row.dockGate && (
                        <>
                          <span>•</span>
                          <span>{row.dockGate}</span>
                        </>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 pt-2 border-t border-slate-100 dark:border-slate-800">
                    <span className="font-mono">{row.scheduleDay} {row.scheduleTime}</span>
                    <div className="flex items-center gap-2">
                      {row.status === "Ready" && (
                        <button
                          onClick={() => handleValidate(row.id, row.reference)}
                          className="px-2.5 py-1 rounded bg-blue-600 text-white font-medium text-xs flex items-center gap-1 cursor-pointer"
                        >
                          <Check className="w-3 h-3" /> Validate
                        </button>
                      )}
                      {row.status === "Waiting" && (
                        <button
                          onClick={() => handleCheckAvailability(row.id, row.reference)}
                          className="px-2.5 py-1 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-medium cursor-pointer"
                        >
                          Check Avail.
                        </button>
                      )}
                      {row.status === "Done" && (
                        <button
                          onClick={() => handlePrintSlip(row.reference)}
                          className="p-1 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 cursor-pointer"
                          title="Print Slip"
                        >
                          <Printer className="w-4 h-4" />
                        </button>
                      )}
                      <button
                        onClick={() => setAuditItem(row)}
                        className="p-1 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 cursor-pointer"
                        title="Audit Log"
                      >
                        <History className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Pagination Footer */}
            <div className="px-4 py-3 bg-slate-50/70 dark:bg-slate-800/40 border-t border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500 dark:text-slate-400">
              <div className="flex items-center gap-4">
                <span>
                  Showing <strong className="text-slate-800 dark:text-slate-200 font-medium">1 to {filteredDeliveries.length}</strong> of{" "}
                  <strong className="text-slate-800 dark:text-slate-200 font-medium">{counts.all}</strong> deliveries
                </span>
                <div className="flex items-center gap-1.5">
                  <span>Per page:</span>
                  <select
                    value={rowsPerPage}
                    onChange={(e) => setRowsPerPage(Number(e.target.value))}
                    className="text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded px-2 py-0.5 font-medium text-slate-700 dark:text-slate-300 focus:ring-blue-500 focus:outline-none"
                  >
                    <option value={10}>10</option>
                    <option value={25}>25</option>
                    <option value={50}>50</option>
                  </select>
                </div>
              </div>
              <nav aria-label="Pagination" className="inline-flex items-center -space-x-px rounded-md text-xs">
                <button
                  disabled={currentPage === 1}
                  onClick={() => {
                    setCurrentPage((p) => Math.max(1, p - 1));
                    showToast("Loaded previous page.", "info");
                  }}
                  className="px-2.5 py-1 rounded-l-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 font-medium text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                >
                  Previous
                </button>
                <button
                  onClick={() => setCurrentPage(1)}
                  className={`px-2.5 py-1 border z-10 font-semibold cursor-pointer ${
                    currentPage === 1
                      ? "border-blue-600 bg-blue-50/80 dark:bg-blue-950 text-blue-600 dark:text-blue-400"
                      : "border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-50"
                  }`}
                >
                  1
                </button>
                <button
                  onClick={() => {
                    setCurrentPage(2);
                    showToast("Switched to page 2.", "info");
                  }}
                  className={`px-2.5 py-1 border font-medium cursor-pointer ${
                    currentPage === 2
                      ? "border-blue-600 bg-blue-50/80 dark:bg-blue-950 text-blue-600 dark:text-blue-400"
                      : "border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700"
                  }`}
                >
                  2
                </button>
                <button
                  onClick={() => {
                    setCurrentPage(3);
                    showToast("Switched to page 3.", "info");
                  }}
                  className={`px-2.5 py-1 border font-medium cursor-pointer ${
                    currentPage === 3
                      ? "border-blue-600 bg-blue-50/80 dark:bg-blue-950 text-blue-600 dark:text-blue-400"
                      : "border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700"
                  }`}
                >
                  3
                </button>
                <button
                  disabled={currentPage >= 3}
                  onClick={() => {
                    setCurrentPage((p) => Math.min(3, p + 1));
                    showToast("Loaded next page.", "info");
                  }}
                  className="px-2.5 py-1 rounded-r-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 font-medium text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                >
                  Next
                </button>
              </nav>
            </div>
          </section>
        ) : (
          /* Kanban View Container */
          <section className="space-y-4 animate-in fade-in duration-150" data-purpose="orders-kanban-view" id="kanban-view-container">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Draft Column */}
              <div className="bg-slate-50 dark:bg-slate-900/60 rounded-lg p-3.5 border border-slate-200 dark:border-slate-800 flex flex-col min-h-[460px]">
                <div className="flex items-center justify-between pb-2.5 mb-2.5 border-b border-slate-200 dark:border-slate-800">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-slate-400"></span>
                    <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300">Draft</h2>
                  </div>
                  <span className="text-[11px] font-mono px-1.5 py-0.5 rounded bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700">
                    {deliveries.filter((d) => d.status === "Draft").length}
                  </span>
                </div>
                <div className="space-y-2.5 flex-1">
                  {deliveries
                    .filter((d) => d.status === "Draft")
                    .map((card) => (
                      <div
                        key={card.id}
                        className="bg-white dark:bg-slate-850 p-3 rounded-lg border border-slate-200 dark:border-slate-700 shadow-subtle hover:border-slate-300 dark:hover:border-slate-600 transition-all cursor-pointer group"
                      >
                        <div className="flex items-center justify-between text-xs mb-1">
                          <Link
                            href={`/operations/deliveries/${card.reference.replace(/\//g, "-")}`}
                            className="font-mono font-semibold text-blue-600 dark:text-blue-400 hover:underline"
                          >
                            {card.reference}
                          </Link>
                          <span className="text-[10px] font-mono text-slate-400">{card.fromLocation}</span>
                        </div>
                        <p className="text-xs font-semibold text-slate-900 dark:text-white leading-tight">{card.toCustomer}</p>
                        <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">Contact: {card.contact}</div>
                        <div className="mt-2.5 pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[11px]">
                          <span className="text-slate-400 italic">Unscheduled</span>
                          <button
                            onClick={() => handleMarkTodo(card.id, card.reference)}
                            className="px-2 py-0.5 rounded bg-blue-50 dark:bg-blue-950 text-blue-700 dark:text-blue-300 text-[10px] font-medium border border-blue-200 dark:border-blue-900 hover:bg-blue-100 cursor-pointer"
                          >
                            Mark Todo
                          </button>
                        </div>
                      </div>
                    ))}
                </div>
              </div>

              {/* Waiting Column */}
              <div className="bg-amber-50/30 dark:bg-amber-950/20 rounded-lg p-3.5 border border-amber-200/50 dark:border-amber-900/50 flex flex-col min-h-[460px]">
                <div className="flex items-center justify-between pb-2.5 mb-2.5 border-b border-amber-200/60 dark:border-amber-900/60">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-amber-500"></span>
                    <h2 className="text-xs font-semibold uppercase tracking-wider text-amber-800 dark:text-amber-300">Waiting Stock</h2>
                  </div>
                  <span className="text-[11px] font-mono px-1.5 py-0.5 rounded bg-white dark:bg-slate-800 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
                    {deliveries.filter((d) => d.status === "Waiting").length}
                  </span>
                </div>
                <div className="space-y-2.5 flex-1">
                  {deliveries
                    .filter((d) => d.status === "Waiting")
                    .map((card) => (
                      <div
                        key={card.id}
                        className="bg-white dark:bg-slate-850 p-3 rounded-lg border border-slate-200 dark:border-slate-700 shadow-subtle hover:border-amber-300 dark:hover:border-amber-600 transition-all cursor-pointer"
                      >
                        <div className="flex items-center justify-between text-xs mb-1">
                          <Link
                            href={`/operations/deliveries/${card.reference.replace(/\//g, "-")}`}
                            className="font-mono font-semibold text-blue-600 dark:text-blue-400 hover:underline"
                          >
                            {card.reference}
                          </Link>
                          <span className="text-[10px] font-mono text-slate-400">{card.fromLocation}</span>
                        </div>
                        <p className="text-xs font-semibold text-slate-900 dark:text-white leading-tight">{card.toCustomer}</p>
                        <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">Contact: {card.contact}</div>
                        <div className="mt-2.5 pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[11px]">
                          <span className="text-amber-600 dark:text-amber-400 font-medium">Tomorrow {card.scheduleTime}</span>
                          <button
                            onClick={() => handleCheckAvailability(card.id, card.reference)}
                            className="text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950 px-1.5 py-0.5 rounded border border-amber-200 dark:border-amber-800 text-[10px] font-mono cursor-pointer hover:bg-amber-100"
                          >
                            {card.poNote || "Check Avail."}
                          </button>
                        </div>
                      </div>
                    ))}
                </div>
              </div>

              {/* Ready Column */}
              <div className="bg-emerald-50/30 dark:bg-emerald-950/20 rounded-lg p-3.5 border border-emerald-200/50 dark:border-emerald-900/50 flex flex-col min-h-[460px]">
                <div className="flex items-center justify-between pb-2.5 mb-2.5 border-b border-emerald-200/60 dark:border-emerald-900/60">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                    <h2 className="text-xs font-semibold uppercase tracking-wider text-emerald-800 dark:text-emerald-300">Ready to Dispatch</h2>
                  </div>
                  <span className="text-[11px] font-mono px-1.5 py-0.5 rounded bg-emerald-600 text-white font-medium">
                    {deliveries.filter((d) => d.status === "Ready").length}
                  </span>
                </div>
                <div className="space-y-2.5 flex-1">
                  {deliveries
                    .filter((d) => d.status === "Ready")
                    .map((card) => (
                      <div
                        key={card.id}
                        className="bg-white dark:bg-slate-850 p-3 rounded-lg border border-slate-200 dark:border-slate-700 shadow-subtle hover:border-emerald-400 dark:hover:border-emerald-600 transition-all cursor-pointer"
                      >
                        <div className="flex items-center justify-between text-xs mb-1">
                          <Link
                            href={`/operations/deliveries/${card.reference.replace(/\//g, "-")}`}
                            className="font-mono font-semibold text-blue-600 dark:text-blue-400 hover:underline"
                          >
                            {card.reference}
                          </Link>
                          {card.dockGate && (
                            <span className="text-[10px] font-mono text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950 px-1 rounded">
                              {card.dockGate}
                            </span>
                          )}
                        </div>
                        <p className="text-xs font-semibold text-slate-900 dark:text-white leading-tight">{card.toCustomer}</p>
                        <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">{card.fromLocation}</div>
                        <div className="mt-2.5 pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[11px]">
                          <span className="text-slate-800 dark:text-slate-200 font-medium">Today {card.scheduleTime}</span>
                          <button
                            onClick={() => handleValidate(card.id, card.reference)}
                            className="px-2 py-0.5 rounded bg-blue-600 hover:bg-blue-700 text-white font-medium text-[11px] cursor-pointer"
                          >
                            Validate
                          </button>
                        </div>
                      </div>
                    ))}
                </div>
              </div>

              {/* Done Column */}
              <div className="bg-slate-50 dark:bg-slate-900/60 rounded-lg p-3.5 border border-slate-200 dark:border-slate-800 flex flex-col min-h-[460px]">
                <div className="flex items-center justify-between pb-2.5 mb-2.5 border-b border-slate-200 dark:border-slate-800">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-slate-500"></span>
                    <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300">Done / Shipped</h2>
                  </div>
                  <span className="text-[11px] font-mono px-1.5 py-0.5 rounded bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700">
                    {deliveries.filter((d) => d.status === "Done").length}
                  </span>
                </div>
                <div className="space-y-2.5 flex-1">
                  {deliveries
                    .filter((d) => d.status === "Done")
                    .map((card) => (
                      <div
                        key={card.id}
                        className="bg-white dark:bg-slate-850 p-3 rounded-lg border border-slate-200 dark:border-slate-700 opacity-90 shadow-subtle cursor-pointer hover:border-slate-300"
                      >
                        <div className="flex items-center justify-between text-xs mb-1">
                          <span className="font-mono font-semibold text-slate-500 line-through">{card.reference}</span>
                          {card.waybillNo && (
                            <span className="text-[9px] bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 px-1 rounded font-medium">
                              {card.waybillNo}
                            </span>
                          )}
                        </div>
                        <p className="text-xs font-semibold text-slate-800 dark:text-slate-200 leading-tight">{card.toCustomer}</p>
                        <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">{card.contact}</div>
                        <div className="mt-2.5 pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[11px]">
                          <span className="text-emerald-600 dark:text-emerald-400 font-medium flex items-center gap-1">
                            <Check className="w-3 h-3 stroke-[2.5]" />
                            Dispatched
                          </span>
                          <span className="text-slate-400 font-mono">{card.scheduleTime || "15:45"}</span>
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            </div>
          </section>
        )}

        {/* ========================================================================= */}
        {/* 4. BOTTOM DISPATCH TELEMETRY BENTO                                       */}
        {/* ========================================================================= */}
        <section className="grid grid-cols-1 md:grid-cols-3 gap-4" data-purpose="telemetry-bento">
          {/* Card 1: Dock Gate Allocation */}
          <div className="bg-white dark:bg-slate-900 rounded-lg border border-slate-200/90 dark:border-slate-800 p-4 shadow-subtle">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                <Truck className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                Dock Gate Allocation
              </span>
              <span className="text-[10px] font-mono text-slate-400 uppercase">Realtime</span>
            </div>
            <div className="grid grid-cols-3 gap-2 text-center">
              <div
                onClick={() => setSearchQuery("Gate 02")}
                className="p-2.5 rounded border border-emerald-100 dark:border-emerald-900/60 bg-emerald-50/40 dark:bg-emerald-950/20 hover:border-emerald-300 transition-colors cursor-pointer"
              >
                <span className="block text-[10px] font-medium text-slate-500 dark:text-slate-400">Gate 02</span>
                <span className="text-xs font-bold font-mono text-emerald-700 dark:text-emerald-300">Active</span>
                <span className="block text-[10px] text-slate-400 mt-0.5 truncate">WH/OUT/0001</span>
              </div>
              <div
                onClick={() => setSearchQuery("Gate 05")}
                className="p-2.5 rounded border border-emerald-100 dark:border-emerald-900/60 bg-emerald-50/40 dark:bg-emerald-950/20 hover:border-emerald-300 transition-colors cursor-pointer"
              >
                <span className="block text-[10px] font-medium text-slate-500 dark:text-slate-400">Gate 05</span>
                <span className="text-xs font-bold font-mono text-emerald-700 dark:text-emerald-300">Active</span>
                <span className="block text-[10px] text-slate-400 mt-0.5 truncate">WH/OUT/0002</span>
              </div>
              <div
                onClick={() => setSearchQuery("Gate 08")}
                className="p-2.5 rounded border border-slate-200 dark:border-slate-700 bg-slate-50/60 dark:bg-slate-800/40 hover:border-blue-400 transition-colors cursor-pointer"
              >
                <span className="block text-[10px] font-medium text-slate-500 dark:text-slate-400">Gate 08</span>
                <span className="text-xs font-bold font-mono text-blue-600 dark:text-blue-400">Staging</span>
                <span className="block text-[10px] text-slate-400 mt-0.5 truncate">PO Check</span>
              </div>
            </div>
          </div>

          {/* Card 2: Direct Manifest Barcode Scanner */}
          <div className="bg-white dark:bg-slate-900 rounded-lg border border-slate-200/90 dark:border-slate-800 p-4 shadow-subtle">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                <ScanBarcode className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                Barcode Direct Scan
              </span>
              <span className="text-[10px] font-mono bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 px-1.5 py-0.5 rounded">
                RF-Ready
              </span>
            </div>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleFastScanLookup(bentoScanInput);
              }}
              className="flex items-center gap-2"
            >
              <input
                value={bentoScanInput}
                onChange={(e) => setBentoScanInput(e.target.value)}
                className="flex-1 py-1.5 px-3 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-md font-mono text-slate-800 dark:text-slate-200 placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-blue-500"
                placeholder="Scan SKU / Manifest..."
                type="text"
              />
              <button
                type="submit"
                className="px-3 py-1.5 bg-slate-900 dark:bg-blue-600 hover:bg-slate-800 dark:hover:bg-blue-700 text-white rounded-md text-xs font-medium transition-colors cursor-pointer"
              >
                Scan
              </button>
            </form>
            <p className="text-[10px] text-slate-400 mt-2">Compatible with Zebra TC57 / Honeywell CT40</p>
          </div>

          {/* Card 3: Carrier Dispatch Sync Summary */}
          <div className="bg-white dark:bg-slate-900 rounded-lg border border-slate-200/90 dark:border-slate-800 p-4 shadow-subtle">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                <Radio className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                Carrier Dispatch Sync
              </span>
              <button
                onClick={handleSyncCarriers}
                className="inline-flex items-center gap-1 text-[10px] font-medium text-emerald-600 dark:text-emerald-400 hover:underline cursor-pointer"
              >
                <span className={`w-1.5 h-1.5 rounded-full bg-emerald-500 ${isSyncingCarrier ? "animate-ping" : ""}`}></span>
                {isSyncingCarrier ? "Syncing..." : "Connected"}
              </button>
            </div>
            <div className="space-y-1.5 text-xs">
              <div className="flex items-center justify-between text-slate-600 dark:text-slate-300">
                <span>FedEx Freight Direct</span>
                <span className="font-mono text-slate-800 dark:text-slate-200 font-medium">8 Manifests</span>
              </div>
              <div className="flex items-center justify-between text-slate-600 dark:text-slate-300">
                <span>DHL Global Forwarding</span>
                <span className="font-mono text-slate-800 dark:text-slate-200 font-medium">4 Scheduled</span>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* ========================================================================= */}
      {/* 5. MINIMAL NORDIC FOOTER                                                  */}
      {/* ========================================================================= */}
      <footer className="bg-white dark:bg-slate-900 border-t border-slate-200/90 dark:border-slate-800 text-slate-400 text-xs py-2.5 px-4 sm:px-6 lg:px-8 mt-auto" data-purpose="system-health-bar">
        <div className="max-w-[1600px] mx-auto flex flex-wrap items-center justify-between gap-3 text-[11px]">
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1.5 text-slate-600 dark:text-slate-300 font-medium">
              <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
              Node: <span className="font-mono text-slate-900 dark:text-white font-semibold">ORD-Outbound-01</span>
            </span>
            <span className="text-slate-200 dark:text-slate-700">|</span>
            <span>Heartbeat: <strong className="text-slate-700 dark:text-slate-300 font-medium">14ms</strong></span>
            <span className="hidden sm:inline text-slate-200 dark:text-slate-700">|</span>
            <span className="hidden sm:inline">Active Scanners: <strong className="text-slate-700 dark:text-slate-300 font-medium">12 online</strong></span>
          </div>
          <div className="flex items-center gap-3">
            <span>Nova Precision Engine v4.8</span>
            <span className="text-slate-200 dark:text-slate-700">•</span>
            <button
              onClick={() => showToast("Opening WMS Operations Dispatch documentation v4.8.", "info")}
              className="text-blue-600 dark:text-blue-400 hover:underline cursor-pointer"
            >
              Documentation
            </button>
          </div>
        </div>
      </footer>

      {/* ========================================================================= */}
      {/* 6. MODAL: CREATE NEW OUTBOUND DELIVERY ORDER                              */}
      {/* ========================================================================= */}
      {isNewDeliveryOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/50 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center">
                  <Plus className="w-4 h-4 stroke-[2.5]" />
                </div>
                <div>
                  <h3 className="text-base font-semibold text-slate-900 dark:text-white">New Delivery Order</h3>
                  <p className="text-xs text-slate-400">Sequential Outbound Manifest: WH/OUT/*</p>
                </div>
              </div>
              <button
                onClick={() => setIsNewDeliveryOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateDelivery} className="space-y-4 text-xs">
              <div>
                <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Customer / Destination *
                </label>
                <input
                  required
                  value={newCustomer}
                  onChange={(e) => setNewCustomer(e.target.value)}
                  placeholder="e.g. Apex Industrial Supply"
                  className="w-full h-9 px-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-blue-500 font-sans"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Source Location
                  </label>
                  <select
                    value={newFromLocation}
                    onChange={(e) => setNewFromLocation(e.target.value)}
                    className="w-full h-9 px-2 font-mono bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-blue-500 text-xs"
                  >
                    <option value="WH/Stock1">WH/Stock1 (Main Bay)</option>
                    <option value="WH/Stock2 (Bay 04)">WH/Stock2 (Bay 04)</option>
                    <option value="WH/Stock1 (Bay 02)">WH/Stock1 (Bay 02)</option>
                  </select>
                </div>

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
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Schedule Date
                  </label>
                  <input
                    value={newScheduleDate}
                    onChange={(e) => setNewScheduleDate(e.target.value)}
                    placeholder="Today"
                    className="w-full h-9 px-3 font-mono bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Carrier Partner
                  </label>
                  <select
                    value={newCarrier}
                    onChange={(e) => setNewCarrier(e.target.value)}
                    className="w-full h-9 px-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-blue-500 text-xs"
                  >
                    <option value="FedEx Freight Direct">FedEx Freight Direct</option>
                    <option value="DHL Global Forwarding">DHL Global Forwarding</option>
                    <option value="UPS Supply Chain">UPS Supply Chain</option>
                  </select>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                <Link
                  href="/operations/deliveries/new"
                  className="text-xs text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1"
                >
                  <span>Open Full Form Workspace</span>
                  <ExternalLink className="w-3 h-3" />
                </Link>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setIsNewDeliveryOpen(false)}
                    className="px-4 py-2 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 font-medium cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-medium shadow-xs cursor-pointer active:scale-95"
                  >
                    Create Delivery
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 7. MODAL: FAST BARCODE SCANNER                                            */}
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
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-slate-500 dark:text-slate-400">
              Point your handheld scanner or enter the outbound manifest code or customer name:
            </p>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleFastScanLookup(scanModalInput);
              }}
              className="space-y-4"
            >
              <div className="relative">
                <input
                  autoFocus
                  value={scanModalInput}
                  onChange={(e) => setScanModalInput(e.target.value)}
                  placeholder="WH/OUT/0001 or Azure"
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
                  Lookup Order
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 8. MODAL: AUDIT TRAIL / MORE DETAILS                                      */}
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
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="flex items-start gap-3">
                <div className="w-2 h-2 rounded-full bg-emerald-500 mt-1.5" />
                <div>
                  <div className="font-semibold text-slate-900 dark:text-white">Customer Order Confirmed</div>
                  <div className="text-slate-400 text-[11px]">Today at 10:14 by Alex Morgan</div>
                  <div className="text-slate-600 dark:text-slate-300 mt-0.5">
                    Assigned dock slot {auditItem.dockGate || "Dock 02"} with carrier {auditItem.carrier || "FedEx Freight"}.
                  </div>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-2 h-2 rounded-full bg-blue-500 mt-1.5" />
                <div>
                  <div className="font-semibold text-slate-900 dark:text-white">Packing & Pick Validation</div>
                  <div className="text-slate-400 text-[11px]">Picked from {auditItem.fromLocation}</div>
                  <div className="text-slate-600 dark:text-slate-300 mt-0.5">
                    {auditItem.itemsCount || 8} units packed into protective carton with RF barcodes attached.
                  </div>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-2 h-2 rounded-full bg-slate-400 mt-1.5" />
                <div>
                  <div className="font-semibold text-slate-900 dark:text-white">Outbound Order Scaffolded</div>
                  <div className="text-slate-400 text-[11px]">Yesterday at 17:30 by System</div>
                  <div className="text-slate-600 dark:text-slate-300 mt-0.5">
                    Delivery schedule allocated for {auditItem.toCustomer} ({auditItem.contact}).
                  </div>
                </div>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <Link
                href={`/operations/deliveries/${auditItem.reference.replace(/\//g, "-")}`}
                className="text-xs text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1 font-medium"
              >
                <span>Open in Operation Workspace</span>
                <ArrowUpRight className="w-3.5 h-3.5" />
              </Link>
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
      {/* 9. TOAST NOTIFICATION BANNER                                              */}
      {/* ========================================================================= */}
      {toast.visible && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-3 px-4 py-3 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-xl border border-slate-800 dark:border-slate-200 text-xs animate-in slide-in-from-bottom-5 duration-200">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 dark:text-emerald-600 shrink-0" />
          <span className="font-medium">{toast.message}</span>
          <button
            onClick={() => setToast((prev) => ({ ...prev, visible: false }))}
            className="p-1 rounded text-slate-400 hover:text-white dark:hover:text-slate-900 cursor-pointer"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}
    </div>
  );
}
