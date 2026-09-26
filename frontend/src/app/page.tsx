"use client";

import { useState, useMemo, useEffect, useRef } from "react";
import { useTheme } from "@/components/theme-provider";
import { Sun, Moon, Menu, X as CloseIcon } from "lucide-react";

export interface StockItem {
  id: string;
  name: string;
  sku: string;
  category: "Desks" | "Tables" | "Chairs" | "Storage";
  description: string;
  initials: string;
  unitCost: number;
  onHand: number;
  reserved: number;
  safetyThreshold: number;
}

const INITIAL_STOCK: StockItem[] = [
  {
    id: "desk",
    name: "Desk",
    sku: "[DESK001]",
    category: "Desks",
    description: "Ergonomic Solid Pine Office Desk",
    initials: "DK",
    unitCost: 3000,
    onHand: 50,
    reserved: 5,
    safetyThreshold: 20,
  },
  {
    id: "table",
    name: "Table",
    sku: "[TBL002]",
    category: "Tables",
    description: "Industrial Solid Maple Conference Table",
    initials: "TB",
    unitCost: 3000,
    onHand: 50,
    reserved: 0,
    safetyThreshold: 15,
  },
  {
    id: "chair",
    name: "Office Chair",
    sku: "[CHR003]",
    category: "Chairs",
    description: "High-Back Breathable Mesh Task Chair",
    initials: "OC",
    unitCost: 1500,
    onHand: 80,
    reserved: 8,
    safetyThreshold: 30,
  },
  {
    id: "cabinet",
    name: "Storage Cabinet",
    sku: "[CAB004]",
    category: "Storage",
    description: "Heavy Duty 4-Tier Locking Steel Rack",
    initials: "SC",
    unitCost: 4500,
    onHand: 25,
    reserved: 5,
    safetyThreshold: 30,
  },
];

interface MovementLog {
  id: string;
  sku: string;
  productName: string;
  timestamp: string;
  type: "CYCLE_ADJUST" | "INBOUND_GRN" | "DISPATCH_PICK" | "SCRAP_WRITEOFF";
  qtyChange: number;
  reference: string;
  actor: string;
}

export default function StockInventoryPage() {
  const theme = useTheme();
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Core Data State
  const [stockList, setStockList] = useState<StockItem[]>(INITIAL_STOCK);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterMode, setFilterMode] = useState<"all" | "low" | "reserved">("all");
  const [selectedCategory, setSelectedCategory] = useState<string>("All");
  const [showCategoryMenu, setShowCategoryMenu] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Quick Adjustment Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<StockItem | null>(null);
  const [modalOnHand, setModalOnHand] = useState<number>(50);
  const [modalReason, setModalReason] = useState("physical_count");
  const [modalAuditRef, setModalAuditRef] = useState("");

  // Audit History Modal State
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [historyTarget, setHistoryTarget] = useState<StockItem | null>(null);
  const [movementLogs, setMovementLogs] = useState<MovementLog[]>([
    {
      id: "LOG-901",
      sku: "[DESK001]",
      productName: "Desk",
      timestamp: "Today, 09:30 AM",
      type: "CYCLE_ADJUST",
      qtyChange: 2,
      reference: "AUDIT-2024-Q2-CYCLE",
      actor: "Alex M. (Lead)",
    },
    {
      id: "LOG-900",
      sku: "[DESK001]",
      productName: "Desk",
      timestamp: "Yesterday, 04:15 PM",
      type: "DISPATCH_PICK",
      qtyChange: -5,
      reference: "WH/OUT/0012",
      actor: "Scanner-RF-04",
    },
    {
      id: "LOG-899",
      sku: "[CAB004]",
      productName: "Storage Cabinet",
      timestamp: "Sep 24, 02:00 PM",
      type: "DISPATCH_PICK",
      qtyChange: -5,
      reference: "WH/OUT/0009",
      actor: "Scanner-RF-02",
    },
    {
      id: "LOG-898",
      sku: "[CHR003]",
      productName: "Office Chair",
      timestamp: "Sep 23, 11:20 AM",
      type: "INBOUND_GRN",
      qtyChange: 20,
      reference: "GRN-2024-8841",
      actor: "Dock-Receiver-A",
    },
  ]);

  // Toast Notification State
  const [toast, setToast] = useState<{
    visible: boolean;
    message: string;
    icon: string;
  }>({
    visible: false,
    message: "",
    icon: "check_circle",
  });

  const triggerToast = (message: string, icon = "check_circle") => {
    setToast({ visible: true, message, icon });
    setTimeout(() => {
      setToast((prev) => ({ ...prev, visible: false }));
    }, 3200);
  };

  // Keyboard shortcut ⌘K to focus search
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

  // Filtered stock list
  const filteredStock = useMemo(() => {
    return stockList.filter((item) => {
      const matchesSearch =
        item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.sku.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.description.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesCategory =
        selectedCategory === "All" || item.category === selectedCategory;

      let matchesFilter = true;
      if (filterMode === "low") {
        matchesFilter = item.onHand <= item.safetyThreshold;
      } else if (filterMode === "reserved") {
        matchesFilter = item.reserved > 0;
      }

      return matchesSearch && matchesCategory && matchesFilter;
    });
  }, [stockList, searchQuery, selectedCategory, filterMode]);

  // Summary Metrics calculations
  const totalStockOnHand = useMemo(
    () => stockList.reduce((acc, item) => acc + item.onHand, 0),
    [stockList]
  );

  const totalValuation = useMemo(
    () => stockList.reduce((acc, item) => acc + item.onHand * item.unitCost, 0),
    [stockList]
  );

  const freeToAllocate = useMemo(
    () =>
      stockList.reduce(
        (acc, item) => acc + Math.max(0, item.onHand - item.reserved),
        0
      ),
    [stockList]
  );

  const totalReserved = useMemo(
    () => stockList.reduce((acc, item) => acc + item.reserved, 0),
    [stockList]
  );

  const lowStockCount = useMemo(
    () => stockList.filter((item) => item.onHand <= item.safetyThreshold).length,
    [stockList]
  );

  // Stepper adjustments
  const handleQuickAdjust = (itemId: string, delta: number) => {
    setStockList((prev) =>
      prev.map((item) => {
        if (item.id === itemId) {
          const newOnHand = Math.max(0, item.onHand + delta);
          triggerToast(
            `${item.name}: count adjusted to ${newOnHand} pcs`,
            "check_circle"
          );
          return { ...item, onHand: newOnHand };
        }
        return item;
      })
    );
  };

  // Open adjustment modal prefilled
  const openEditModal = (item?: StockItem) => {
    const target = item || stockList[0];
    setEditingItem(target);
    setModalOnHand(target.onHand);
    setModalReason("physical_count");
    setModalAuditRef(`CYCLE-${new Date().toISOString().slice(0, 10)}`);
    setIsModalOpen(true);
  };

  // Save Modal Adjustment
  const handleSaveModalAdjustment = () => {
    if (!editingItem) return;
    const diff = modalOnHand - editingItem.onHand;

    setStockList((prev) =>
      prev.map((item) =>
        item.id === editingItem.id ? { ...item, onHand: modalOnHand } : item
      )
    );

    // Append to movement logs
    const newLog: MovementLog = {
      id: `LOG-${Date.now().toString().slice(-4)}`,
      sku: editingItem.sku,
      productName: editingItem.name,
      timestamp: "Just now",
      type: "CYCLE_ADJUST",
      qtyChange: diff,
      reference: modalAuditRef || "MANUAL-LEDGER-POST",
      actor: "Alex M. (Lead)",
    };
    setMovementLogs((prev) => [newLog, ...prev]);

    setIsModalOpen(false);
    triggerToast(
      `${editingItem.name} stock updated to ${modalOnHand} pcs [${modalAuditRef || "General"}]`,
      "sync"
    );
  };

  // Open History modal
  const openHistoryModal = (item: StockItem) => {
    setHistoryTarget(item);
    setIsHistoryOpen(true);
  };

  // Export CSV
  const handleExportCSV = () => {
    const headers = "SKU,Product Name,Category,Unit Cost (INR),On Hand,Reserved,Free To Use,Safety Threshold\n";
    const rows = stockList
      .map(
        (i) =>
          `"${i.sku}","${i.name}","${i.category}",${i.unitCost},${i.onHand},${i.reserved},${Math.max(0, i.onHand - i.reserved)},${i.safetyThreshold}`
      )
      .join("\n");
    const blob = new Blob([headers + rows], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `Nova_Stock_Inventory_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    triggerToast("Inventory report exported as CSV format.", "download_done");
  };

  return (
    <div className="min-h-screen bg-surface-container-low text-on-surface antialiased transition-colors duration-200">
      {/* ========================================================================= */}
      {/* 1. TOP HEADER / APP BAR                                                    */}
      {/* ========================================================================= */}
      <header className="fixed top-0 left-0 right-0 w-full z-40 bg-surface-container-lowest/95 backdrop-blur-md shadow-[0_1px_8px_rgba(0,0,0,0.04)] border-b border-surface-container-high transition-colors">
        <div className="h-16 w-full max-w-[1560px] mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between gap-4">
          {/* Left Brand & Navigation */}
          <div className="flex items-center gap-6 xl:gap-8">
            <div className="flex items-center gap-2.5">
              <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-primary-600 text-white shadow-sm">
                <span className="material-symbols-outlined text-[20px]">
                  precision_manufacturing
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="font-semibold text-lg sm:text-xl text-foreground tracking-tight">
                  Nova Precision
                </span>
                <span className="px-1.5 py-0.5 rounded text-xs font-mono font-medium bg-primary-50 text-primary-700 dark:bg-primary-950/70 dark:text-primary-300 tracking-wide border border-primary-200/50 dark:border-primary-800/40">
                  Warehouse Ops
                </span>
              </div>
            </div>

            {/* Desktop Navigation Links */}
            <nav className="hidden xl:flex items-center gap-1.5">
              <a
                href="#"
                className="px-3 py-1.5 text-sm text-muted-foreground hover:text-foreground hover:bg-surface-container-low rounded-lg transition-colors"
              >
                Dashboard
              </a>
              <div className="relative group">
                <button
                  type="button"
                  className="px-3 py-1.5 text-sm text-muted-foreground hover:text-foreground hover:bg-surface-container-low rounded-lg transition-colors flex items-center gap-1"
                >
                  Operations
                  <span className="material-symbols-outlined text-[16px]">
                    expand_more
                  </span>
                </button>
              </div>
              <a
                href="#"
                aria-current="page"
                className="px-3 py-1.5 text-sm font-medium transition-colors bg-primary-50 text-primary-700 dark:bg-primary-950/70 dark:text-primary-300 rounded-lg"
              >
                Stock
              </a>
              <a
                href="#"
                className="px-3 py-1.5 text-sm text-muted-foreground hover:text-foreground hover:bg-surface-container-low rounded-lg transition-colors"
              >
                Move History
              </a>
              <div className="relative group">
                <button
                  type="button"
                  className="px-3 py-1.5 text-sm text-muted-foreground hover:text-foreground hover:bg-surface-container-low rounded-lg transition-colors flex items-center gap-1"
                >
                  Settings
                  <span className="material-symbols-outlined text-[16px]">
                    expand_more
                  </span>
                </button>
              </div>
            </nav>
          </div>

          {/* Right Controls: Search, Notifications, Theme, User */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Search SKU Bar */}
            <div className="relative hidden md:flex items-center w-60 lg:w-72">
              <span className="material-symbols-outlined absolute left-2.5 text-[18px] text-muted-foreground pointer-events-none">
                search
              </span>
              <input
                ref={searchInputRef}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search SKU / Reference..."
                type="text"
                className="w-full h-9 pl-9 pr-12 rounded-lg bg-surface-container text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:bg-surface-container-lowest focus:ring-2 focus:ring-primary-500 border border-surface-container-high transition-all"
              />
              <kbd className="absolute right-2 px-1.5 py-0.5 text-[11px] font-mono text-muted-foreground bg-surface-container-high rounded shadow-xs">
                ⌘K
              </kbd>
            </div>

            {/* Notification Bell */}
            <button
              type="button"
              onClick={() => triggerToast("2 new inbound deliveries scheduled for Rack Sector B", "notifications")}
              className="relative p-2 rounded-lg text-muted-foreground hover:bg-surface-container-low hover:text-foreground transition-colors"
              title="Notifications"
            >
              <span className="material-symbols-outlined text-[20px]">
                notifications
              </span>
              <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-primary-600 ring-2 ring-surface-container-lowest"></span>
            </button>

            {/* Dark / Light Mode Toggle */}
            <button
              type="button"
              onClick={theme.toggleTheme}
              className="p-2 rounded-lg text-muted-foreground hover:bg-surface-container-low hover:text-foreground transition-colors"
              title="Toggle theme"
            >
              {theme.darkMode ? (
                <Sun className="w-5 h-5 text-amber-400" />
              ) : (
                <Moon className="w-5 h-5" />
              )}
            </button>

            {/* User Profile */}
            <div className="flex items-center gap-2 pl-1 border-l border-surface-container-high">
              <div className="w-8 h-8 rounded-full bg-primary-600 flex items-center justify-center text-white font-mono text-sm font-semibold shadow-xs">
                A
              </div>
              <div className="hidden sm:flex flex-col text-left">
                <span className="text-sm font-medium text-foreground leading-none">
                  Alex M.
                </span>
                <span className="text-xs font-mono text-muted-foreground leading-none mt-1">
                  Warehouse Lead
                </span>
              </div>
            </div>

            {/* Mobile Menu Hamburger */}
            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="xl:hidden p-2 rounded-lg text-muted-foreground hover:bg-surface-container-low hover:text-foreground transition-colors"
              aria-label="Toggle Navigation Menu"
            >
              {mobileMenuOpen ? <CloseIcon className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation Dropdown */}
        {mobileMenuOpen && (
          <div className="xl:hidden px-4 pt-2 pb-4 border-t border-surface-container-high bg-surface-container-lowest animate-in slide-in-from-top-2 duration-150">
            <div className="relative flex items-center w-full mb-3">
              <span className="material-symbols-outlined absolute left-2.5 text-[18px] text-muted-foreground">
                search
              </span>
              <input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search SKU / Reference..."
                type="text"
                className="w-full h-9 pl-9 pr-4 rounded-lg bg-surface-container text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary-500 border border-surface-container-high"
              />
            </div>
            <div className="flex flex-col gap-1">
              <a
                href="#"
                className="px-3 py-2 text-sm text-muted-foreground hover:bg-surface-container-low rounded-lg"
              >
                Dashboard
              </a>
              <a
                href="#"
                className="px-3 py-2 text-sm font-medium bg-primary-50 text-primary-700 dark:bg-primary-950/70 dark:text-primary-300 rounded-lg"
              >
                Stock Inventory
              </a>
              <a
                href="#"
                className="px-3 py-2 text-sm text-muted-foreground hover:bg-surface-container-low rounded-lg"
              >
                Move History
              </a>
              <a
                href="#"
                className="px-3 py-2 text-sm text-muted-foreground hover:bg-surface-container-low rounded-lg"
              >
                Operations & Reorder
              </a>
              <a
                href="#"
                className="px-3 py-2 text-sm text-muted-foreground hover:bg-surface-container-low rounded-lg"
              >
                Warehouse Settings
              </a>
            </div>
          </div>
        )}
      </header>

      {/* ========================================================================= */}
      {/* 2. MAIN DASHBOARD CONTENT                                                 */}
      {/* ========================================================================= */}
      <main className="w-full pt-20 pb-16 min-h-[calc(100vh-4rem)]">
        <div className="w-full max-w-[1560px] mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
          {/* --------------------------------------------------------------------- */}
          {/* Top Breadcrumb & Live Context Banner                                  */}
          {/* --------------------------------------------------------------------- */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-surface-container-lowest p-4 sm:p-5 rounded-xl shadow-sm border border-surface-container-high border-l-4 border-l-primary-600 transition-colors">
            <div className="flex items-start sm:items-center gap-3">
              <span className="p-2 rounded-lg bg-primary-50 text-primary-600 dark:bg-primary-950 dark:text-primary-400 shrink-0">
                <span className="material-symbols-outlined text-[24px]">
                  inventory_2
                </span>
              </span>
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h1 className="text-xl sm:text-2xl font-bold text-foreground tracking-tight">
                    Stock Inventory
                  </h1>
                  <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-mono font-medium bg-emerald-100 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mr-1.5 animate-pulse"></span>
                    Realtime Sync
                  </span>
                </div>
                <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
                  Node{" "}
                  <span className="font-mono font-semibold text-foreground">
                    WH-ALPHA-01
                  </span>{" "}
                  • Section Rack Sector B • Live physical &amp; unallocated counts
                </p>
              </div>
            </div>

            {/* User Requirement Callout Badge */}
            <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-amber-50 dark:bg-amber-950/60 border border-amber-200 dark:border-amber-800/60 rounded-lg text-xs font-mono font-medium text-amber-800 dark:text-amber-300 shrink-0 self-start sm:self-auto">
              <span className="material-symbols-outlined text-[18px] text-amber-600">
                verified
              </span>
              <span>Direct Stock Editing &amp; Reconciliation Enabled</span>
            </div>
          </div>

          {/* --------------------------------------------------------------------- */}
          {/* KPI Metric Cards Grid (4 Cards)                                       */}
          {/* --------------------------------------------------------------------- */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Total Stock On Hand */}
            <div className="bg-surface-container-lowest rounded-xl p-4 sm:p-5 shadow-sm border border-surface-container-high hover:shadow-md transition-all">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-muted-foreground">
                  Total Stock On Hand
                </span>
                <span className="p-1.5 rounded-lg bg-surface-container text-muted-foreground">
                  <span className="material-symbols-outlined text-[20px]">
                    warehouse
                  </span>
                </span>
              </div>
              <div className="mt-2 flex items-baseline gap-2">
                <span className="text-2xl sm:text-3xl font-mono font-bold text-foreground">
                  {totalStockOnHand.toLocaleString()}
                </span>
                <span className="text-sm text-muted-foreground">units</span>
              </div>
              <div className="mt-3 flex items-center gap-1.5 text-xs font-mono">
                <span className="inline-flex items-center px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800 dark:bg-emerald-950/70 dark:text-emerald-300 font-medium">
                  <span className="material-symbols-outlined text-[14px] mr-0.5">
                    arrow_upward
                  </span>
                  +3.4%
                </span>
                <span className="text-muted-foreground">vs. last month</span>
              </div>
            </div>

            {/* Total Valuation */}
            <div className="bg-surface-container-lowest rounded-xl p-4 sm:p-5 shadow-sm border border-surface-container-high hover:shadow-md transition-all">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-muted-foreground">
                  Total Valuation
                </span>
                <span className="p-1.5 rounded-lg bg-surface-container text-muted-foreground">
                  <span className="material-symbols-outlined text-[20px]">
                    payments
                  </span>
                </span>
              </div>
              <div className="mt-2 flex items-baseline gap-2">
                <span className="text-2xl sm:text-3xl font-mono font-bold text-foreground">
                  ₹{(totalValuation * 200).toLocaleString("en-IN")}
                </span>
              </div>
              <div className="mt-3 flex items-center gap-1.5 text-xs font-mono text-muted-foreground">
                <span>Based on current unit landing costs</span>
              </div>
            </div>

            {/* Free to Allocate */}
            <div className="bg-surface-container-lowest rounded-xl p-4 sm:p-5 shadow-sm border border-surface-container-high hover:shadow-md transition-all">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-muted-foreground">
                  Free to Use / Allocate
                </span>
                <span className="p-1.5 rounded-lg bg-primary-50 text-primary-600 dark:bg-primary-950 dark:text-primary-400">
                  <span className="material-symbols-outlined text-[20px]">
                    check_circle
                  </span>
                </span>
              </div>
              <div className="mt-2 flex items-baseline gap-2">
                <span className="text-2xl sm:text-3xl font-mono font-bold text-primary-600 dark:text-primary-400">
                  {freeToAllocate.toLocaleString()}
                </span>
                <span className="text-sm text-muted-foreground">units</span>
              </div>
              <div className="mt-3 flex items-center gap-1.5 text-xs font-mono text-muted-foreground">
                <span>{totalReserved} units reserved for orders</span>
              </div>
            </div>

            {/* Items Low on Stock */}
            <div className="bg-surface-container-lowest rounded-xl p-4 sm:p-5 shadow-sm border border-surface-container-high hover:shadow-md transition-all">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-muted-foreground">
                  Items Low on Stock
                </span>
                <span className="p-1.5 rounded-lg bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-400">
                  <span className="material-symbols-outlined text-[20px]">
                    warning
                  </span>
                </span>
              </div>
              <div className="mt-2 flex items-baseline gap-2">
                <span className="text-2xl sm:text-3xl font-mono font-bold text-red-600 dark:text-red-400">
                  {lowStockCount}
                </span>
                <span className="text-sm text-muted-foreground">
                  SKUs require reorder
                </span>
              </div>
              <div className="mt-3 flex items-center gap-1.5 text-xs font-mono">
                <span className="inline-flex items-center px-1.5 py-0.5 rounded bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 font-medium">
                  Attention needed
                </span>
                <span className="text-muted-foreground">Reorder threshold &lt; 30</span>
              </div>
            </div>
          </div>

          {/* --------------------------------------------------------------------- */}
          {/* Action Bar & Interactive Controls                                     */}
          {/* --------------------------------------------------------------------- */}
          <div className="bg-surface-container-lowest rounded-xl p-4 shadow-sm border border-surface-container-high flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4">
            {/* Left: Search and Filters */}
            <div className="flex flex-1 flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
              <div className="relative flex-1 max-w-md">
                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-[20px]">
                  search
                </span>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search product name, SKU, or batch..."
                  className="w-full h-10 pl-10 pr-4 bg-surface-container rounded-lg text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:bg-surface-container-lowest focus:ring-2 focus:ring-primary-500 border border-surface-container-high transition-all"
                />
              </div>

              {/* Filter by Status Pill */}
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    const nextMode =
                      filterMode === "all" ? "low" : filterMode === "low" ? "reserved" : "all";
                    setFilterMode(nextMode);
                    triggerToast(`Filter: ${nextMode.toUpperCase()}`, "filter_list");
                  }}
                  className={`h-10 px-3 rounded-lg text-sm font-medium flex items-center gap-1.5 transition-colors border ${
                    filterMode !== "all"
                      ? "bg-primary-50 text-primary-700 border-primary-300 dark:bg-primary-950 dark:text-primary-300"
                      : "bg-surface-container hover:bg-surface-container-high text-foreground border-surface-container-high"
                  }`}
                >
                  <span className="material-symbols-outlined text-[18px]">
                    filter_list
                  </span>
                  <span>
                    Filter: {filterMode === "all" ? "All" : filterMode === "low" ? "Low Stock" : "Reserved"}
                  </span>
                </button>

                {/* Category Dropdown */}
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setShowCategoryMenu(!showCategoryMenu)}
                    className="h-10 px-3 bg-surface-container hover:bg-surface-container-high text-foreground border border-surface-container-high rounded-lg text-sm font-medium flex items-center gap-1.5 transition-colors"
                  >
                    <span className="material-symbols-outlined text-[18px]">
                      category
                    </span>
                    <span>Category: {selectedCategory}</span>
                  </button>

                  {showCategoryMenu && (
                    <div className="absolute left-0 mt-1 w-44 bg-surface-container-lowest border border-surface-container-high rounded-xl shadow-lg z-30 py-1 text-sm animate-in fade-in zoom-in-95 duration-100">
                      {["All", "Desks", "Tables", "Chairs", "Storage"].map((cat) => (
                        <button
                          key={cat}
                          type="button"
                          onClick={() => {
                            setSelectedCategory(cat);
                            setShowCategoryMenu(false);
                            triggerToast(`Category set to ${cat}`, "category");
                          }}
                          className={`w-full text-left px-3.5 py-2 hover:bg-surface-container-low transition-colors ${
                            selectedCategory === cat
                              ? "font-semibold text-primary-600 bg-primary-50 dark:bg-primary-950/50"
                              : "text-foreground"
                          }`}
                        >
                          {cat}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Right: Main Actions */}
            <div className="flex items-center gap-2.5 self-end lg:self-auto">
              <button
                type="button"
                onClick={handleExportCSV}
                className="h-10 px-3.5 bg-surface-container hover:bg-surface-container-high text-foreground border border-surface-container-high rounded-lg text-sm font-medium flex items-center gap-1.5 transition-colors shadow-xs"
              >
                <span className="material-symbols-outlined text-[18px]">
                  file_download
                </span>
                <span>Export CSV</span>
              </button>

              <button
                type="button"
                onClick={() => openEditModal()}
                className="h-10 px-4 bg-primary-600 hover:bg-primary-700 text-white rounded-lg text-sm font-medium flex items-center gap-2 shadow-sm transition-all hover:shadow"
              >
                <span className="material-symbols-outlined text-[20px]">
                  add_circle
                </span>
                <span>+ Update Stock / Adjustment</span>
              </button>
            </div>
          </div>

          {/* --------------------------------------------------------------------- */}
          {/* Inventory Data Table Container                                        */}
          {/* --------------------------------------------------------------------- */}
          <div className="bg-surface-container-lowest rounded-xl shadow-sm border border-surface-container-high overflow-hidden">
            {/* Visual status bar */}
            <div className="px-4 sm:px-5 py-3 bg-surface-container flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-surface-container-high">
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold text-foreground">
                  Available Stock List
                </span>
                <span className="px-2 py-0.5 rounded text-xs font-mono font-medium bg-primary-100 text-primary-900 dark:bg-primary-950 dark:text-primary-300">
                  {filteredStock.length} Active Lines
                </span>
              </div>
              <div className="flex flex-wrap items-center gap-3 sm:gap-4 text-xs font-mono text-muted-foreground">
                <span className="flex items-center gap-1">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
                  Balanced
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span>
                  Allocations Pending
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-2.5 h-2.5 rounded-full bg-red-500"></span>
                  Reorder Target Hit
                </span>
              </div>
            </div>

            {/* Desktop Table View (Hidden below 768px) */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-surface-container text-muted-foreground font-mono text-xs uppercase tracking-wider h-11 border-b border-surface-container-high">
                    <th className="py-2.5 px-5 font-medium" scope="col">
                      Product / SKU
                    </th>
                    <th className="py-2.5 px-4 font-medium" scope="col">
                      Per Unit Cost
                    </th>
                    <th className="py-2.5 px-4 font-medium" scope="col">
                      On Hand
                    </th>
                    <th className="py-2.5 px-4 font-medium" scope="col">
                      Free To Use
                    </th>
                    <th className="py-2.5 px-4 font-medium" scope="col">
                      Availability Bar
                    </th>
                    <th className="py-2.5 px-5 font-medium text-right" scope="col">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-surface-container-high text-sm text-foreground">
                  {filteredStock.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-12 text-center text-muted-foreground">
                        <span className="material-symbols-outlined text-4xl mb-2 text-muted-foreground/60">
                          inventory
                        </span>
                        <p className="text-base font-medium">No matching inventory lines found</p>
                        <p className="text-xs mt-1">Try adjusting your search query or filters.</p>
                      </td>
                    </tr>
                  ) : (
                    filteredStock.map((item) => {
                      const freeUnits = Math.max(0, item.onHand - item.reserved);
                      const isLowStock = item.onHand <= item.safetyThreshold;
                      const freePercent =
                        item.onHand > 0
                          ? Math.round((freeUnits / item.onHand) * 100)
                          : 0;

                      return (
                        <tr
                          key={item.id}
                          className="hover:bg-surface-container-low transition-colors group"
                        >
                          {/* Product / SKU */}
                          <td className="py-4 px-5">
                            <div className="flex items-center gap-3">
                              <div className="w-9 h-9 rounded-lg bg-surface-container flex items-center justify-center text-primary-700 dark:text-primary-300 font-mono font-bold text-sm shrink-0 border border-surface-container-high">
                                {item.initials}
                              </div>
                              <div>
                                <div className="font-semibold text-foreground flex items-center gap-2">
                                  <span>{item.name}</span>
                                  <span className="font-mono text-xs px-1.5 py-0.5 rounded bg-surface-container text-muted-foreground border border-surface-container-high">
                                    {item.sku}
                                  </span>
                                </div>
                                <div className="text-xs text-muted-foreground mt-0.5">
                                  {item.description}
                                </div>
                              </div>
                            </div>
                          </td>

                          {/* Unit Cost */}
                          <td className="py-4 px-4 font-mono font-medium text-foreground">
                            {item.unitCost} Rs
                          </td>

                          {/* On Hand (with Interactive Stepper) */}
                          <td className="py-4 px-4">
                            <div className="flex items-center gap-2">
                              <div className="inline-flex items-center bg-surface-container rounded-lg p-0.5 border border-surface-container-high">
                                <button
                                  type="button"
                                  onClick={() => handleQuickAdjust(item.id, -1)}
                                  className="w-6 h-6 flex items-center justify-center rounded text-muted-foreground hover:bg-surface-container-lowest hover:text-foreground transition-all"
                                  title="Decrement 1 unit"
                                >
                                  <span className="material-symbols-outlined text-[16px]">
                                    remove
                                  </span>
                                </button>
                                <span className="w-10 text-center font-mono font-semibold text-foreground">
                                  {item.onHand}
                                </span>
                                <button
                                  type="button"
                                  onClick={() => handleQuickAdjust(item.id, 1)}
                                  className="w-6 h-6 flex items-center justify-center rounded text-muted-foreground hover:bg-surface-container-lowest hover:text-foreground transition-all"
                                  title="Increment 1 unit"
                                >
                                  <span className="material-symbols-outlined text-[16px]">
                                    add
                                  </span>
                                </button>
                              </div>
                              <span className="font-mono text-xs text-muted-foreground">
                                pcs
                              </span>
                            </div>
                          </td>

                          {/* Free To Use & Reserved Badge */}
                          <td className="py-4 px-4">
                            <div className="flex items-center gap-2">
                              <span
                                className={`font-mono font-semibold ${
                                  isLowStock
                                    ? "text-red-600 dark:text-red-400"
                                    : freeUnits === item.onHand
                                    ? "text-emerald-600 dark:text-emerald-400"
                                    : "text-primary-600 dark:text-primary-400"
                                }`}
                              >
                                {freeUnits}
                              </span>
                              <span className="font-mono text-xs text-muted-foreground">
                                pcs
                              </span>

                              {item.reserved > 0 ? (
                                <span
                                  className={`inline-flex items-center px-1.5 py-0.5 rounded text-xs font-mono font-medium ${
                                    isLowStock
                                      ? "bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300"
                                      : "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300"
                                  }`}
                                  title={`${item.reserved} units reserved for pending outbound dispatches`}
                                >
                                  {item.reserved} Reserved {isLowStock ? "(Low)" : ""}
                                </span>
                              ) : (
                                <span className="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-mono font-medium bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                                  100% Available
                                </span>
                              )}
                            </div>
                          </td>

                          {/* Availability Bar */}
                          <td className="py-4 px-4 w-44">
                            <div className="space-y-1">
                              <div className="w-full bg-surface-container h-2 rounded-full overflow-hidden border border-surface-container-high">
                                <div
                                  className={`h-full rounded-full transition-all duration-300 ${
                                    isLowStock
                                      ? "bg-red-600"
                                      : freePercent === 100
                                      ? "bg-emerald-500"
                                      : "bg-primary-600"
                                  }`}
                                  style={{ width: `${Math.min(100, freePercent)}%` }}
                                ></div>
                              </div>
                              <div className="flex justify-between font-mono text-xs text-muted-foreground">
                                {isLowStock ? (
                                  <span className="text-red-600 dark:text-red-400 font-medium">
                                    Reorder Alert
                                  </span>
                                ) : (
                                  <span>{freePercent}% Free</span>
                                )}
                                <span>Safety: {item.safetyThreshold}</span>
                              </div>
                            </div>
                          </td>

                          {/* Action Buttons */}
                          <td className="py-4 px-5 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              <button
                                type="button"
                                onClick={() => openEditModal(item)}
                                className="px-2.5 py-1 text-xs font-mono font-medium bg-primary-50 text-primary-700 dark:bg-primary-950 dark:text-primary-300 hover:bg-primary-100 dark:hover:bg-primary-900 rounded-lg transition-colors flex items-center gap-1 border border-primary-200/50 dark:border-primary-800/40"
                              >
                                <span className="material-symbols-outlined text-[16px]">
                                  tune
                                </span>
                                Quick Adjust
                              </button>
                              <button
                                type="button"
                                onClick={() => openHistoryModal(item)}
                                className="p-1.5 text-muted-foreground hover:text-foreground hover:bg-surface-container rounded-lg transition-colors"
                                title="View Movement Audit Logs"
                              >
                                <span className="material-symbols-outlined text-[18px]">
                                  history
                                </span>
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {/* Mobile Cards View (< 768px) */}
            <div className="block md:hidden divide-y divide-surface-container-high">
              {filteredStock.map((item) => {
                const freeUnits = Math.max(0, item.onHand - item.reserved);
                const isLowStock = item.onHand <= item.safetyThreshold;
                const freePercent =
                  item.onHand > 0
                    ? Math.round((freeUnits / item.onHand) * 100)
                    : 0;

                return (
                  <div key={item.id} className="p-4 space-y-3 bg-surface-container-lowest">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-2.5">
                        <div className="w-10 h-10 rounded-lg bg-surface-container flex items-center justify-center text-primary-700 dark:text-primary-300 font-mono font-bold text-sm shrink-0 border border-surface-container-high">
                          {item.initials}
                        </div>
                        <div>
                          <div className="font-semibold text-foreground text-base">
                            {item.name}
                          </div>
                          <span className="font-mono text-xs px-1.5 py-0.2 rounded bg-surface-container text-muted-foreground border border-surface-container-high">
                            {item.sku}
                          </span>
                        </div>
                      </div>
                      <span className="font-mono font-bold text-foreground text-base">
                        {item.unitCost} Rs
                      </span>
                    </div>

                    <p className="text-xs text-muted-foreground">
                      {item.description}
                    </p>

                    {/* Stock Counts & Stepper */}
                    <div className="grid grid-cols-2 gap-2 pt-1 border-t border-surface-container-high">
                      <div>
                        <span className="text-[11px] font-mono text-muted-foreground uppercase block mb-1">
                          On Hand
                        </span>
                        <div className="inline-flex items-center bg-surface-container rounded-lg p-0.5 border border-surface-container-high">
                          <button
                            type="button"
                            onClick={() => handleQuickAdjust(item.id, -1)}
                            className="w-7 h-7 flex items-center justify-center rounded text-muted-foreground hover:bg-surface-container-lowest hover:text-foreground"
                          >
                            <span className="material-symbols-outlined text-[16px]">remove</span>
                          </button>
                          <span className="w-10 text-center font-mono font-semibold text-foreground">
                            {item.onHand}
                          </span>
                          <button
                            type="button"
                            onClick={() => handleQuickAdjust(item.id, 1)}
                            className="w-7 h-7 flex items-center justify-center rounded text-muted-foreground hover:bg-surface-container-lowest hover:text-foreground"
                          >
                            <span className="material-symbols-outlined text-[16px]">add</span>
                          </button>
                        </div>
                      </div>

                      <div>
                        <span className="text-[11px] font-mono text-muted-foreground uppercase block mb-1">
                          Free To Use
                        </span>
                        <div className="flex items-center gap-1.5 mt-1">
                          <span
                            className={`font-mono font-bold text-base ${
                              isLowStock
                                ? "text-red-600 dark:text-red-400"
                                : "text-primary-600 dark:text-primary-400"
                            }`}
                          >
                            {freeUnits} pcs
                          </span>
                          {item.reserved > 0 && (
                            <span className="px-1.5 py-0.5 rounded text-[11px] font-mono bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300">
                              {item.reserved} Res
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Availability Bar */}
                    <div className="space-y-1 pt-1">
                      <div className="w-full bg-surface-container h-2 rounded-full overflow-hidden border border-surface-container-high">
                        <div
                          className={`h-full rounded-full ${
                            isLowStock
                              ? "bg-red-600"
                              : freePercent === 100
                              ? "bg-emerald-500"
                              : "bg-primary-600"
                          }`}
                          style={{ width: `${Math.min(100, freePercent)}%` }}
                        ></div>
                      </div>
                      <div className="flex justify-between font-mono text-[11px] text-muted-foreground">
                        {isLowStock ? (
                          <span className="text-red-600 dark:text-red-400 font-medium">Reorder Alert</span>
                        ) : (
                          <span>{freePercent}% Free</span>
                        )}
                        <span>Safety: {item.safetyThreshold}</span>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2 pt-2">
                      <button
                        type="button"
                        onClick={() => openEditModal(item)}
                        className="flex-1 py-1.5 text-xs font-mono font-medium bg-primary-50 text-primary-700 dark:bg-primary-950 dark:text-primary-300 rounded-lg flex items-center justify-center gap-1.5 border border-primary-200/50"
                      >
                        <span className="material-symbols-outlined text-[16px]">tune</span>
                        Quick Adjust
                      </button>
                      <button
                        type="button"
                        onClick={() => openHistoryModal(item)}
                        className="p-1.5 text-muted-foreground hover:bg-surface-container rounded-lg border border-surface-container-high"
                        title="Audit Logs"
                      >
                        <span className="material-symbols-outlined text-[18px]">history</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Pagination Footer */}
            <div className="p-4 bg-surface-container flex flex-col sm:flex-row items-center justify-between gap-3 text-xs sm:text-sm text-muted-foreground border-t border-surface-container-high font-mono">
              <div>
                Showing <span className="font-semibold text-foreground">1 to {filteredStock.length}</span> of{" "}
                <span className="font-semibold text-foreground">48</span> inventory items
              </div>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  disabled
                  className="px-2.5 py-1 rounded-lg bg-surface-container-lowest text-muted-foreground text-xs font-medium border border-surface-container-high opacity-50 cursor-not-allowed"
                >
                  Previous
                </button>
                <button
                  type="button"
                  className="w-7 h-7 rounded-lg bg-primary-600 text-white text-xs font-semibold flex items-center justify-center shadow-xs"
                >
                  1
                </button>
                <button
                  type="button"
                  onClick={() => triggerToast("Navigated to page 2", "swap_horiz")}
                  className="w-7 h-7 rounded-lg bg-surface-container-lowest hover:bg-surface-container text-foreground text-xs font-medium flex items-center justify-center border border-surface-container-high transition-colors"
                >
                  2
                </button>
                <button
                  type="button"
                  onClick={() => triggerToast("Navigated to page 3", "swap_horiz")}
                  className="w-7 h-7 rounded-lg bg-surface-container-lowest hover:bg-surface-container text-foreground text-xs font-medium flex items-center justify-center border border-surface-container-high transition-colors"
                >
                  3
                </button>
                <button
                  type="button"
                  onClick={() => triggerToast("Navigated to next page", "arrow_forward")}
                  className="px-2.5 py-1 rounded-lg bg-surface-container-lowest text-foreground text-xs font-medium border border-surface-container-high hover:bg-surface-container transition-colors"
                >
                  Next
                </button>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* ========================================================================= */}
      {/* 3. STOCK ADJUSTMENT MODAL DIALOG                                          */}
      {/* ========================================================================= */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 animate-in fade-in duration-150">
          <div className="bg-surface-container-lowest w-full max-w-lg rounded-2xl shadow-2xl border border-surface-container-high overflow-hidden animate-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="px-5 py-4 bg-surface-container flex items-center justify-between border-b border-surface-container-high">
              <div className="flex items-center gap-2.5">
                <span className="p-1 rounded-lg bg-primary-100 text-primary-700 dark:bg-primary-950 dark:text-primary-300">
                  <span className="material-symbols-outlined text-[20px]">
                    inventory
                  </span>
                </span>
                <h3 className="font-semibold text-lg text-foreground">
                  Update Physical Stock
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="text-muted-foreground hover:text-foreground p-1 rounded-lg hover:bg-surface-container-high transition-colors"
              >
                <span className="material-symbols-outlined text-[20px]">
                  close
                </span>
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-5 space-y-4">
              {/* Product Badge Pill */}
              <div className="p-3 rounded-xl bg-surface-container flex justify-between items-center border border-surface-container-high">
                <div>
                  <div className="font-semibold text-foreground text-base">
                    {editingItem?.name} {editingItem?.sku}
                  </div>
                  <div className="text-xs font-mono text-muted-foreground mt-0.5">
                    Unit Cost:{" "}
                    <span className="font-medium text-foreground">
                      {editingItem?.unitCost} Rs
                    </span>
                  </div>
                </div>
                <span className="px-2 py-0.5 rounded bg-primary-100 text-primary-900 dark:bg-primary-950 dark:text-primary-300 font-mono text-xs font-semibold">
                  WH-ALPHA-01
                </span>
              </div>

              {/* Form Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-foreground mb-1.5">
                    New On-Hand Count (pcs)
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={modalOnHand}
                    onChange={(e) => setModalOnHand(Math.max(0, parseInt(e.target.value) || 0))}
                    className="w-full h-10 px-3 bg-surface-container rounded-lg font-mono text-base font-semibold text-foreground focus:outline-none focus:ring-2 focus:ring-primary-500 border border-surface-container-high"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-foreground mb-1.5">
                    Adjustment Reason
                  </label>
                  <select
                    value={modalReason}
                    onChange={(e) => setModalReason(e.target.value)}
                    className="w-full h-10 px-3 bg-surface-container rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary-500 border border-surface-container-high"
                  >
                    <option value="physical_count">Physical Cycle Count</option>
                    <option value="scrap">Damaged / Scrap Write-off</option>
                    <option value="inbound_correction">GRN Inbound Correction</option>
                    <option value="customer_return">Customer Restock</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-foreground mb-1.5">
                  Audit Reference / Internal Note
                </label>
                <input
                  type="text"
                  value={modalAuditRef}
                  onChange={(e) => setModalAuditRef(e.target.value)}
                  placeholder="e.g. AUDIT-2024-Q2-CYCLE"
                  className="w-full h-10 px-3 bg-surface-container rounded-lg text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary-500 border border-surface-container-high"
                />
              </div>

              <div className="flex items-center gap-2 p-3 bg-primary-50 dark:bg-primary-950/60 text-primary-900 dark:text-primary-300 rounded-xl text-xs font-mono border border-primary-200/50 dark:border-primary-800/40">
                <span className="material-symbols-outlined text-[18px] text-primary-600 shrink-0">
                  info
                </span>
                <span>
                  Free-to-use allocation will automatically recalculate against {editingItem?.reserved || 0} reserved units.
                </span>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="p-4 bg-surface-container flex items-center justify-end gap-2.5 border-t border-surface-container-high">
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="px-4 py-2 text-sm text-muted-foreground hover:text-foreground font-medium rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveModalAdjustment}
                className="px-5 py-2 bg-primary-600 hover:bg-primary-700 text-white font-medium text-sm rounded-lg shadow-sm transition-all"
              >
                Save &amp; Post Ledger
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 4. AUDIT MOVEMENT LEDGER MODAL                                            */}
      {/* ========================================================================= */}
      {isHistoryOpen && historyTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 animate-in fade-in duration-150">
          <div className="bg-surface-container-lowest w-full max-w-xl rounded-2xl shadow-2xl border border-surface-container-high overflow-hidden animate-in zoom-in-95 duration-150">
            <div className="px-5 py-4 bg-surface-container flex items-center justify-between border-b border-surface-container-high">
              <div className="flex items-center gap-2.5">
                <span className="p-1 rounded-lg bg-primary-100 text-primary-700 dark:bg-primary-950 dark:text-primary-300">
                  <span className="material-symbols-outlined text-[20px]">
                    history
                  </span>
                </span>
                <h3 className="font-semibold text-lg text-foreground">
                  Audit Movements: {historyTarget.name} {historyTarget.sku}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsHistoryOpen(false)}
                className="text-muted-foreground hover:text-foreground p-1 rounded-lg hover:bg-surface-container-high transition-colors"
              >
                <span className="material-symbols-outlined text-[20px]">
                  close
                </span>
              </button>
            </div>

            <div className="p-5 max-h-96 overflow-y-auto space-y-3">
              {movementLogs
                .filter((log) => log.sku === historyTarget.sku)
                .map((log) => (
                  <div
                    key={log.id}
                    className="p-3 rounded-xl bg-surface-container border border-surface-container-high flex items-center justify-between"
                  >
                    <div>
                      <div className="flex items-center gap-2 font-mono text-xs">
                        <span className="font-semibold text-foreground">
                          {log.reference}
                        </span>
                        <span className="text-muted-foreground">• {log.timestamp}</span>
                      </div>
                      <div className="text-xs text-muted-foreground mt-0.5">
                        Initiated by: {log.actor}
                      </div>
                    </div>
                    <div className="text-right">
                      <span
                        className={`font-mono font-bold text-sm ${
                          log.qtyChange > 0
                            ? "text-emerald-600 dark:text-emerald-400"
                            : "text-red-600 dark:text-red-400"
                        }`}
                      >
                        {log.qtyChange > 0 ? `+${log.qtyChange}` : log.qtyChange} pcs
                      </span>
                      <div className="text-[10px] font-mono text-muted-foreground uppercase">
                        {log.type.replace("_", " ")}
                      </div>
                    </div>
                  </div>
                ))}
            </div>

            <div className="p-4 bg-surface-container flex justify-end border-t border-surface-container-high">
              <button
                type="button"
                onClick={() => setIsHistoryOpen(false)}
                className="px-4 py-2 bg-surface-container-high hover:bg-surface-container text-foreground rounded-lg text-sm font-medium transition-colors"
              >
                Close Ledger
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 5. INTERACTIVE NOTIFICATION TOAST                                         */}
      {/* ========================================================================= */}
      <div
        className={`fixed bottom-6 right-6 z-50 bg-foreground text-background px-4 py-3 rounded-xl shadow-xl flex items-center gap-3 transform transition-all duration-300 border border-surface-container-high ${
          toast.visible
            ? "translate-y-0 opacity-100 scale-100"
            : "translate-y-12 opacity-0 scale-95 pointer-events-none"
        }`}
      >
        <span className="material-symbols-outlined text-emerald-500 text-[22px]">
          {toast.icon}
        </span>
        <span className="text-sm font-medium">{toast.message}</span>
      </div>

      {/* ========================================================================= */}
      {/* 6. BOTTOM SYSTEM FOOTER                                                   */}
      {/* ========================================================================= */}
      <footer className="fixed bottom-0 left-0 right-0 w-full bg-surface-container-lowest/90 backdrop-blur-xs border-t border-surface-container-high py-2 z-30 transition-colors">
        <div className="w-full max-w-[1560px] mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-1 text-xs font-mono text-muted-foreground">
          <div>
            Nova Precision ERP Suite • Node ID:{" "}
            <span className="text-foreground font-semibold">WH-ALPHA-01</span>
          </div>
          <div className="flex flex-wrap items-center gap-3 sm:gap-4">
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              RF Scanners Online
            </span>
            <span>
              Sync Latency:{" "}
              <span className="text-foreground font-semibold">14ms</span>
            </span>
            <span>
              Active Zone:{" "}
              <span className="text-foreground font-semibold">
                Rack Sector B
              </span>
            </span>
          </div>
        </div>
      </footer>
    </div>
  );
}
