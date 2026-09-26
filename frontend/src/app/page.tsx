"use client";

import { useState, useMemo, useEffect, useRef } from "react";
import { useTheme } from "@/components/theme-provider";
import {
  Sun,
  Moon,
  Menu,
  X as CloseIcon,
  QrCode,
  SlidersHorizontal,
  CheckCircle2,
  Clock,
  AlertTriangle,
  ShoppingCart,
  RotateCcw,
  LayoutGrid,
  Truck,
  Package,
  History,
  Settings,
  Sparkles,
  MapPin,
  MoreVertical,
  Minus,
  Plus,
  Search,
  X,
} from "lucide-react";

export interface StockItem {
  id: string;
  name: string;
  sku: string;
  bay: string;
  category: "Furniture" | "Hardware" | "Desks" | "Tables" | "Chairs" | "Storage";
  description: string;
  initials: string;
  unitCost: number;
  onHand: number;
  reserved: number;
  safetyThreshold: number;
  targetStock: number;
  auditStatus: string;
  auditIcon: "check" | "time" | "alert";
  isCritical?: boolean;
}

const INITIAL_STOCK: StockItem[] = [
  {
    id: "desk",
    name: "Desk",
    sku: "DESK001",
    bay: "Bay A-03",
    category: "Furniture",
    description: "Ergonomic Solid Pine Office Desk",
    initials: "DK",
    unitCost: 3000,
    onHand: 50,
    reserved: 5,
    safetyThreshold: 20,
    targetStock: 60,
    auditStatus: "Matched ERP Count",
    auditIcon: "check",
  },
  {
    id: "table",
    name: "Table",
    sku: "TBL002",
    bay: "Bay B-11",
    category: "Furniture",
    description: "Industrial Solid Maple Conference Table",
    initials: "TB",
    unitCost: 3000,
    onHand: 50,
    reserved: 0,
    safetyThreshold: 15,
    targetStock: 50,
    auditStatus: "Verified today 09:30 AM",
    auditIcon: "check",
  },
  {
    id: "chair",
    name: "Office Chair",
    sku: "CHR003",
    bay: "Bay C-02",
    category: "Furniture",
    description: "High-Back Breathable Mesh Task Chair",
    initials: "OC",
    unitCost: 1500,
    onHand: 80,
    reserved: 8,
    safetyThreshold: 30,
    targetStock: 100,
    auditStatus: "Next cycle count in 4 days",
    auditIcon: "time",
  },
  {
    id: "cabinet",
    name: "Storage Cabinet",
    sku: "CAB004",
    bay: "Bay D-08",
    category: "Hardware",
    description: "Heavy Duty 4-Tier Locking Steel Rack",
    initials: "SC",
    unitCost: 4500,
    onHand: 25,
    reserved: 5,
    safetyThreshold: 30,
    targetStock: 50,
    auditStatus: "Reorder point breached",
    auditIcon: "alert",
    isCritical: true,
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
  const [activeCategoryFilter, setActiveCategoryFilter] = useState<string>("All Categories");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeNavTab, setActiveNavTab] = useState<"dashboard" | "operations" | "stock" | "history" | "settings">("stock");

  // Quick Adjustment Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<StockItem | null>(null);
  const [modalOnHand, setModalOnHand] = useState<number>(50);
  const [modalReason, setModalReason] = useState("physical_count");
  const [modalAuditRef, setModalAuditRef] = useState("");

  // Audit History Modal State
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [historyTarget, setHistoryTarget] = useState<StockItem | null>(null);

  // Barcode Scanner Modal State
  const [isScannerOpen, setIsScannerOpen] = useState(false);

  // Movement logs state
  const [movementLogs, setMovementLogs] = useState<MovementLog[]>([
    {
      id: "LOG-901",
      sku: "DESK001",
      productName: "Desk",
      timestamp: "Today, 09:30 AM",
      type: "CYCLE_ADJUST",
      qtyChange: 2,
      reference: "AUDIT-2024-Q2-CYCLE",
      actor: "Alex M. (Lead)",
    },
    {
      id: "LOG-900",
      sku: "DESK001",
      productName: "Desk",
      timestamp: "Yesterday, 04:15 PM",
      type: "DISPATCH_PICK",
      qtyChange: -5,
      reference: "WH/OUT/0012",
      actor: "Scanner-RF-04",
    },
    {
      id: "LOG-899",
      sku: "CAB004",
      productName: "Storage Cabinet",
      timestamp: "Sep 24, 02:00 PM",
      type: "DISPATCH_PICK",
      qtyChange: -5,
      reference: "WH/OUT/0009",
      actor: "Scanner-RF-02",
    },
    {
      id: "LOG-898",
      sku: "CHR003",
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
      const q = searchQuery.toLowerCase();
      const matchesSearch =
        !q ||
        item.name.toLowerCase().includes(q) ||
        item.sku.toLowerCase().includes(q) ||
        item.bay.toLowerCase().includes(q) ||
        item.description.toLowerCase().includes(q);

      let matchesCategory = true;
      if (activeCategoryFilter === "Furniture") {
        matchesCategory = item.category === "Furniture";
      } else if (activeCategoryFilter === "Hardware") {
        matchesCategory = item.category === "Hardware";
      } else if (activeCategoryFilter === "Low Stock") {
        matchesCategory = item.onHand <= item.safetyThreshold;
      }

      return matchesSearch && matchesCategory;
    });
  }, [stockList, searchQuery, activeCategoryFilter]);

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
          const isCrit = newOnHand <= item.safetyThreshold;
          triggerToast(
            `${item.name}: count updated to ${newOnHand} pcs`,
            "check_circle"
          );
          return { ...item, onHand: newOnHand, isCritical: isCrit };
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
        item.id === editingItem.id
          ? {
              ...item,
              onHand: modalOnHand,
              isCritical: modalOnHand <= item.safetyThreshold,
            }
          : item
      )
    );

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
      `${editingItem.name} floor count set to ${modalOnHand} pcs [${modalAuditRef || "General"}]`,
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
    const headers = "SKU,Product Name,Bay Location,Category,Unit Cost (INR),On Hand,Reserved,Free To Use,Safety Threshold\n";
    const rows = stockList
      .map(
        (i) =>
          `"${i.sku}","${i.name}","${i.bay}","${i.category}",${i.unitCost},${i.onHand},${i.reserved},${Math.max(0, i.onHand - i.reserved)},${i.safetyThreshold}`
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
    <div className="min-h-screen bg-[#f7f9fb] dark:bg-slate-950 text-slate-900 dark:text-slate-100 antialiased font-sans transition-colors duration-200 pb-20 md:pb-12">
      {/* ========================================================================= */}
      {/* 1. TOP HEADER                                                             */}
      {/* ========================================================================= */}
      <header className="sticky top-0 left-0 right-0 w-full z-40 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 transition-colors shadow-xs">
        <div className="w-full max-w-[1560px] mx-auto px-4 sm:px-6 lg:px-8 h-14 sm:h-16 flex items-center justify-between gap-3">
          {/* Brand Header */}
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-blue-600 text-white shadow-xs">
              <span className="material-symbols-outlined text-[20px]">
                precision_manufacturing
              </span>
            </div>
            <div className="flex flex-col">
              <div className="flex items-center gap-1.5">
                <span className="font-bold text-base sm:text-lg tracking-tight text-slate-900 dark:text-white">
                  NOVA
                </span>
                <span className="text-[11px] font-mono font-bold tracking-wider px-1 py-0.2 rounded bg-blue-50 text-blue-700 dark:bg-blue-950/70 dark:text-blue-300">
                  ALPHA
                </span>
              </div>
              <span className="text-[10px] font-mono text-slate-500 dark:text-slate-400 leading-none">
                WH-ALPHA-01
              </span>
            </div>

            {/* Desktop Navigation Links */}
            <nav className="hidden xl:flex items-center gap-1 ml-6">
              <a
                href="#"
                className="px-3 py-1.5 text-sm text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white rounded-lg transition-colors"
              >
                Dashboard
              </a>
              <a
                href="#"
                className="px-3 py-1.5 text-sm text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white rounded-lg transition-colors"
              >
                Operations
              </a>
              <a
                href="#"
                className="px-3 py-1.5 text-sm font-semibold bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300 rounded-lg"
              >
                Stock
              </a>
              <a
                href="#"
                className="px-3 py-1.5 text-sm text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white rounded-lg transition-colors"
              >
                Move History
              </a>
              <a
                href="#"
                className="px-3 py-1.5 text-sm text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white rounded-lg transition-colors"
              >
                Settings
              </a>
            </nav>
          </div>

          {/* Right Controls */}
          <div className="flex items-center gap-2">
            {/* Desktop SKU Search */}
            <div className="relative hidden md:flex items-center w-60 lg:w-72">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 pointer-events-none" />
              <input
                ref={searchInputRef}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search SKU / Reference..."
                type="text"
                className="w-full h-9 pl-9 pr-12 rounded-lg bg-slate-100 dark:bg-slate-800 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:bg-white dark:focus:bg-slate-900 focus:ring-2 focus:ring-blue-500 border border-slate-200 dark:border-slate-700 transition-all"
              />
              <kbd className="absolute right-2 px-1.5 py-0.5 text-[11px] font-mono text-slate-400 bg-slate-200 dark:bg-slate-700 rounded">
                ⌘K
              </kbd>
            </div>

            {/* Notification Bell */}
            <button
              type="button"
              onClick={() => triggerToast("2 notifications: Inbound batch scheduled for Rack B", "notifications")}
              className="relative p-2 rounded-lg text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              title="Notifications"
            >
              <span className="material-symbols-outlined text-[20px]">
                notifications
              </span>
              <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-blue-600 ring-2 ring-white dark:ring-slate-900"></span>
            </button>

            {/* Theme Toggle */}
            <button
              type="button"
              onClick={theme.toggleTheme}
              className="p-2 rounded-lg text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              title="Toggle theme"
            >
              {theme.darkMode ? (
                <Sun className="w-4 h-4 sm:w-5 sm:h-5 text-amber-400" />
              ) : (
                <Moon className="w-4 h-4 sm:w-5 sm:h-5" />
              )}
            </button>

            {/* User Avatar Circle */}
            <div className="w-8 h-8 rounded-full bg-blue-600 text-white font-mono text-sm font-semibold flex items-center justify-center shadow-xs">
              A
            </div>
          </div>
        </div>
      </header>

      {/* ========================================================================= */}
      {/* 2. MAIN CONTAINER                                                         */}
      {/* ========================================================================= */}
      <main className="w-full max-w-[1560px] mx-auto px-3.5 sm:px-6 lg:px-8 pt-3 sm:pt-6 space-y-3.5 sm:space-y-6">
        {/* Page Title & Realtime Badge */}
        <div className="flex items-start justify-between gap-2">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
              Stock Inventory
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
              Live valuation &amp; warehouse reconciliation
            </p>
          </div>
          <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-mono font-bold tracking-wider bg-emerald-100 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300 uppercase shrink-0">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mr-1.5 animate-pulse"></span>
            Realtime Sync
          </span>
        </div>

        {/* Direct Stock Editing Notice Box */}
        <div className="p-3 sm:p-4 rounded-xl bg-blue-50/70 dark:bg-blue-950/40 border border-blue-200/80 dark:border-blue-800/60 flex items-start gap-2.5 sm:gap-3">
          <span className="p-1 rounded bg-blue-100 dark:bg-blue-900/60 text-blue-700 dark:text-blue-300 shrink-0 mt-0.5">
            <Sparkles className="w-4 h-4" />
          </span>
          <div className="text-xs sm:text-sm">
            <div className="font-semibold text-blue-900 dark:text-blue-200">
              Direct Stock Editing &amp; Reconciliation Enabled
            </div>
            <div className="text-blue-700 dark:text-blue-400 text-xs mt-0.5">
              Touch steppers to update floor counts instantly
            </div>
          </div>
        </div>

        {/* 4-KPI Metric Cards Grid (Adaptive 2x2 or 4-col) */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-4">
          {/* Card 1: Stock On Hand */}
          <div className="p-3 sm:p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 font-medium">
                Stock On Hand
              </span>
              <span className="text-blue-600 dark:text-blue-400">
                <Package className="w-4 h-4" />
              </span>
            </div>
            <div className="mt-1 sm:mt-2">
              <div className="text-lg sm:text-2xl font-mono font-bold text-slate-900 dark:text-white">
                {totalStockOnHand.toLocaleString()}
                <span className="text-xs font-normal text-slate-500 ml-1">units</span>
              </div>
              <div className="mt-1 inline-flex items-center px-1.5 py-0.5 rounded text-[10px] sm:text-xs font-mono font-medium bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                +3.4% vs last mo
              </div>
            </div>
          </div>

          {/* Card 2: Total Valuation */}
          <div className="p-3 sm:p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 font-medium">
                Total Valuation
              </span>
              <span className="text-blue-600 dark:text-blue-400">
                <span className="material-symbols-outlined text-[18px]">payments</span>
              </span>
            </div>
            <div className="mt-1 sm:mt-2">
              <div className="text-lg sm:text-2xl font-mono font-bold text-slate-900 dark:text-white">
                ₹{(totalValuation * 200).toLocaleString("en-IN")}
              </div>
              <div className="mt-1 text-[10px] sm:text-xs font-mono text-slate-400 dark:text-slate-500">
                Landing cost base
              </div>
            </div>
          </div>

          {/* Card 3: Free to Allocate */}
          <div className="p-3 sm:p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 font-medium">
                Free to Allocate
              </span>
              <span className="text-emerald-600 dark:text-emerald-400">
                <CheckCircle2 className="w-4 h-4" />
              </span>
            </div>
            <div className="mt-1 sm:mt-2">
              <div className="text-lg sm:text-2xl font-mono font-bold text-slate-900 dark:text-white">
                {freeToAllocate.toLocaleString()}
                <span className="text-xs font-normal text-slate-500 ml-1">units</span>
              </div>
              <div className="mt-1 inline-flex items-center px-1.5 py-0.5 rounded text-[10px] sm:text-xs font-mono font-medium bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300">
                {totalReserved} reserved
              </div>
            </div>
          </div>

          {/* Card 4: Low Stock Alert */}
          <div className="p-3 sm:p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 font-medium">
                Low Stock Alert
              </span>
              <span className="text-red-600 dark:text-red-400">
                <AlertTriangle className="w-4 h-4" />
              </span>
            </div>
            <div className="mt-1 sm:mt-2">
              <div className="text-lg sm:text-2xl font-mono font-bold text-red-600 dark:text-red-400">
                {lowStockCount} SKUs
              </div>
              <div className="mt-1 inline-flex items-center px-1.5 py-0.5 rounded text-[10px] sm:text-xs font-mono font-medium bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300">
                Threshold &lt; 30
              </div>
            </div>
          </div>
        </div>

        {/* Search, Barcode & Action Bar */}
        <div className="flex items-center gap-2">
          {/* Search SKU input with clear button */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search SKU, barcode or item..."
              className="w-full h-10 pl-9 pr-9 bg-white dark:bg-slate-900 rounded-xl text-xs sm:text-sm text-slate-900 dark:text-white placeholder:text-slate-400 border border-slate-200 dark:border-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-xs"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Barcode Scanner Icon Button */}
          <button
            type="button"
            onClick={() => setIsScannerOpen(true)}
            className="w-10 h-10 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center justify-center text-blue-600 dark:text-blue-400 hover:bg-slate-50 dark:hover:bg-slate-800 shadow-xs transition-colors shrink-0"
            title="Scan Barcode / QR"
          >
            <QrCode className="w-5 h-5" />
          </button>

          {/* Reconcile Primary Button */}
          <button
            type="button"
            onClick={() => openEditModal()}
            className="h-10 px-3.5 sm:px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs sm:text-sm font-semibold flex items-center gap-1.5 shadow-sm transition-all shrink-0"
          >
            <SlidersHorizontal className="w-4 h-4" />
            <span>Reconcile</span>
          </button>
        </div>

        {/* Category Filter Pills Track */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
          {[
            { label: "All Categories (48)", key: "All Categories" },
            { label: "Furniture (24)", key: "Furniture" },
            { label: "Hardware (18)", key: "Hardware" },
            { label: "! Low Stock (2)", key: "Low Stock", isAlert: true },
          ].map((pill) => {
            const isActive = activeCategoryFilter === pill.key;
            return (
              <button
                key={pill.key}
                type="button"
                onClick={() => {
                  setActiveCategoryFilter(pill.key);
                  triggerToast(`Filter: ${pill.label}`, "filter_list");
                }}
                className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors border ${
                  isActive
                    ? "bg-blue-600 text-white border-blue-600 shadow-xs"
                    : pill.isAlert
                    ? "bg-red-50 text-red-700 border-red-200 dark:bg-red-950/70 dark:text-red-300 dark:border-red-900"
                    : "bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-800 hover:bg-slate-50"
                }`}
              >
                {pill.label}
              </button>
            );
          })}
        </div>

        {/* Product Cards List (Matching attached Mobile Screen) */}
        <div className="space-y-3">
          {filteredStock.map((item) => {
            const freeUnits = Math.max(0, item.onHand - item.reserved);
            const isLowStock = item.onHand <= item.safetyThreshold;
            const freePercent =
              item.onHand > 0
                ? Math.round((freeUnits / item.onHand) * 100)
                : 0;

            return (
              <div
                key={item.id}
                className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden transition-all hover:shadow-md"
              >
                {/* Critical Stock Warning Header Banner (if threshold breached) */}
                {isLowStock && (
                  <div className="px-3.5 py-1.5 bg-amber-50 dark:bg-amber-950/60 border-b border-amber-200 dark:border-amber-800/60 flex items-center justify-between text-xs font-mono">
                    <span className="flex items-center gap-1.5 text-amber-800 dark:text-amber-300 font-semibold">
                      <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                      Low Stock Threshold Breached
                    </span>
                    <span className="text-amber-700 dark:text-amber-400 font-medium">
                      Reorder Point: {item.safetyThreshold}
                    </span>
                  </div>
                )}

                <div className="p-3.5 sm:p-4 space-y-3">
                  {/* Card Header: Product Name + SKU + Bay + Price + Menu */}
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-base text-slate-900 dark:text-white">
                          {item.name}
                        </span>
                        <span className="font-mono text-xs px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 font-medium border border-slate-200 dark:border-slate-700">
                          {item.sku}
                        </span>
                        <span className="flex items-center gap-0.5 text-xs font-mono text-slate-500 dark:text-slate-400">
                          <MapPin className="w-3 h-3 text-slate-400" />
                          {item.bay}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                        {item.description}
                      </p>
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                      <span className="font-mono font-bold text-blue-600 dark:text-blue-400 text-sm">
                        ₹{item.unitCost.toLocaleString()}/u
                      </span>
                      <button
                        type="button"
                        onClick={() => openHistoryModal(item)}
                        className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded"
                        title="Options"
                      >
                        <MoreVertical className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Floor Count (On Hand) Stepper Container */}
                  <div className="p-2.5 sm:p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/70 dark:border-slate-800 flex items-center justify-between">
                    <div>
                      <span
                        className={`text-[10px] font-mono tracking-wider font-semibold block uppercase ${
                          isLowStock
                            ? "text-red-600 dark:text-red-400"
                            : "text-slate-500 dark:text-slate-400"
                        }`}
                      >
                        {isLowStock ? "Floor Count (Critical)" : "Floor Count (On Hand)"}
                      </span>
                      <div className="flex items-baseline gap-1 mt-0.5">
                        <span
                          className={`font-mono text-xl sm:text-2xl font-bold ${
                            isLowStock
                              ? "text-red-600 dark:text-red-400"
                              : "text-slate-900 dark:text-white"
                          }`}
                        >
                          {item.onHand}
                        </span>
                        <span className="text-xs text-slate-500 font-mono">pcs</span>
                      </div>
                    </div>

                    {/* Stepper: [ — ]  Count  [ + ] */}
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => handleQuickAdjust(item.id, -1)}
                        className="w-8 h-8 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 flex items-center justify-center text-slate-600 dark:text-slate-300 hover:bg-slate-100 shadow-xs active:scale-95 transition-all"
                        aria-label="Decrement count"
                      >
                        <Minus className="w-4 h-4" />
                      </button>
                      <span className="w-8 text-center font-mono font-bold text-sm text-slate-900 dark:text-white">
                        {item.onHand}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleQuickAdjust(item.id, 1)}
                        className="w-8 h-8 rounded-lg bg-blue-600 hover:bg-blue-700 text-white flex items-center justify-center shadow-xs active:scale-95 transition-all"
                        aria-label="Increment count"
                      >
                        <Plus className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Free Allocation & Safety Threshold Info */}
                  <div className="flex items-center justify-between text-xs font-mono">
                    <div className="flex items-center gap-1.5">
                      <span className="text-slate-600 dark:text-slate-400">
                        Free: <strong className="text-slate-900 dark:text-white">{freeUnits} pcs</strong>
                      </span>
                      {item.reserved > 0 ? (
                        <span
                          className={`px-1.5 py-0.2 rounded text-[11px] font-medium ${
                            isLowStock
                              ? "bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300"
                              : "bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300"
                          }`}
                        >
                          {item.reserved} Reserved
                        </span>
                      ) : (
                        <span className="px-1.5 py-0.2 rounded text-[11px] font-medium bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                          100% Available
                        </span>
                      )}
                    </div>
                    <span className="text-slate-500 dark:text-slate-400 text-[11px]">
                      {isLowStock ? `Target: ${item.targetStock} pcs` : `Safety: ${item.safetyThreshold} pcs`}
                    </span>
                  </div>

                  {/* Availability Progress Bar */}
                  <div className="w-full bg-slate-100 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-300 ${
                        isLowStock
                          ? "bg-gradient-to-r from-red-600 to-amber-500"
                          : "bg-emerald-500"
                      }`}
                      style={{ width: `${Math.min(100, isLowStock ? 35 : freePercent)}%` }}
                    ></div>
                  </div>

                  {/* Card Bottom: Verification Status & Reconcile / Action Button */}
                  {isLowStock ? (
                    <div className="flex items-center gap-2 pt-1">
                      <button
                        type="button"
                        onClick={() => triggerToast(`PO Reorder triggered: PO-2026-9941 dispatched for 50 units of ${item.sku}`, "shopping_cart")}
                        className="flex-1 py-2 px-3 rounded-lg bg-red-600 hover:bg-red-700 text-white font-medium text-xs flex items-center justify-center gap-1.5 shadow-sm active:scale-98 transition-all"
                      >
                        <ShoppingCart className="w-4 h-4" />
                        <span>Trigger PO Reorder</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => openEditModal(item)}
                        className="p-2 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-600 dark:text-slate-300"
                        title="Adjust Parameters"
                      >
                        <SlidersHorizontal className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between pt-1">
                      <div className="flex items-center gap-1 text-[11px] text-slate-500 dark:text-slate-400">
                        {item.auditIcon === "check" ? (
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                        ) : (
                          <Clock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        )}
                        <span>{item.auditStatus}</span>
                      </div>

                      <button
                        type="button"
                        onClick={() => openHistoryModal(item)}
                        className="px-2.5 py-1 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 text-[11px] font-mono flex items-center gap-1 transition-colors"
                      >
                        <RotateCcw className="w-3 h-3" />
                        <span>Reconcile Log</span>
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Mobile Pagination Info Bar */}
        <div className="flex items-center justify-between text-xs font-mono text-slate-500 dark:text-slate-400 py-2">
          <span>Showing 1-4 of 48 inventory items</span>
          <div className="flex items-center gap-1.5 font-bold text-slate-700 dark:text-slate-300">
            <button
              type="button"
              disabled
              className="px-1 text-slate-300 dark:text-slate-600 cursor-not-allowed"
            >
              &lt;
            </button>
            <span className="text-slate-900 dark:text-white">Page 1</span>
            <button
              type="button"
              onClick={() => triggerToast("Navigating to Page 2...", "arrow_forward")}
              className="px-1 text-slate-600 dark:text-slate-300 hover:text-blue-600"
            >
              &gt;
            </button>
          </div>
        </div>
      </main>

      {/* ========================================================================= */}
      {/* 3. MOBILE FIXED BOTTOM NAVIGATION BAR                                     */}
      {/* ========================================================================= */}
      <nav className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-t border-slate-200 dark:border-slate-800 py-1.5 px-4 flex items-center justify-around shadow-lg">
        <button
          type="button"
          onClick={() => {
            setActiveNavTab("dashboard");
            triggerToast("Navigating to Dashboard", "dashboard");
          }}
          className={`flex flex-col items-center gap-0.5 text-[10px] font-medium transition-colors ${
            activeNavTab === "dashboard"
              ? "text-blue-600 font-semibold"
              : "text-slate-500 dark:text-slate-400 hover:text-slate-900"
          }`}
        >
          <LayoutGrid className="w-5 h-5" />
          <span>Dashboard</span>
        </button>

        <button
          type="button"
          onClick={() => {
            setActiveNavTab("operations");
            triggerToast("Navigating to Operations Hub", "local_shipping");
          }}
          className={`flex flex-col items-center gap-0.5 text-[10px] font-medium transition-colors ${
            activeNavTab === "operations"
              ? "text-blue-600 font-semibold"
              : "text-slate-500 dark:text-slate-400 hover:text-slate-900"
          }`}
        >
          <Truck className="w-5 h-5" />
          <span>Operations</span>
        </button>

        <button
          type="button"
          onClick={() => {
            setActiveNavTab("stock");
            triggerToast("Viewing Stock Inventory", "inventory_2");
          }}
          className={`flex flex-col items-center gap-0.5 text-[10px] font-medium transition-colors ${
            activeNavTab === "stock"
              ? "text-blue-600 font-semibold"
              : "text-slate-500 dark:text-slate-400 hover:text-slate-900"
          }`}
        >
          <Package className="w-5 h-5" />
          <span>Stock</span>
        </button>

        <button
          type="button"
          onClick={() => {
            setActiveNavTab("history");
            triggerToast("Viewing Global Move History", "history");
          }}
          className={`flex flex-col items-center gap-0.5 text-[10px] font-medium transition-colors ${
            activeNavTab === "history"
              ? "text-blue-600 font-semibold"
              : "text-slate-500 dark:text-slate-400 hover:text-slate-900"
          }`}
        >
          <History className="w-5 h-5" />
          <span>History</span>
        </button>

        <button
          type="button"
          onClick={() => {
            setActiveNavTab("settings");
            triggerToast("Opening Warehouse Settings", "settings");
          }}
          className={`flex flex-col items-center gap-0.5 text-[10px] font-medium transition-colors ${
            activeNavTab === "settings"
              ? "text-blue-600 font-semibold"
              : "text-slate-500 dark:text-slate-400 hover:text-slate-900"
          }`}
        >
          <Settings className="w-5 h-5" />
          <span>Settings</span>
        </button>
      </nav>

      {/* ========================================================================= */}
      {/* 4. QUICK STOCK ADJUSTMENT MODAL                                           */}
      {/* ========================================================================= */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 animate-in fade-in duration-150">
          <div className="bg-white dark:bg-slate-900 w-full max-w-lg rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden animate-in zoom-in-95 duration-150">
            <div className="px-5 py-4 bg-slate-50 dark:bg-slate-800/60 flex items-center justify-between border-b border-slate-200 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <span className="p-1 rounded-lg bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300">
                  <SlidersHorizontal className="w-4 h-4" />
                </span>
                <h3 className="font-bold text-base sm:text-lg text-slate-900 dark:text-white">
                  Update Physical Stock
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 sm:p-5 space-y-4">
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 flex justify-between items-center border border-slate-200 dark:border-slate-700">
                <div>
                  <div className="font-bold text-slate-900 dark:text-white text-sm sm:text-base">
                    {editingItem?.name} [{editingItem?.sku}]
                  </div>
                  <div className="text-xs font-mono text-slate-500 mt-0.5">
                    Landing: <span className="font-semibold text-slate-900 dark:text-white">₹{editingItem?.unitCost}/u</span> • Location: {editingItem?.bay}
                  </div>
                </div>
                <span className="px-2 py-0.5 rounded bg-blue-100 text-blue-900 dark:bg-blue-950 dark:text-blue-300 font-mono text-xs font-bold">
                  WH-ALPHA-01
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    New Floor Count (pcs)
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={modalOnHand}
                    onChange={(e) => setModalOnHand(Math.max(0, parseInt(e.target.value) || 0))}
                    className="w-full h-10 px-3 bg-slate-50 dark:bg-slate-800 rounded-lg font-mono text-base font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 border border-slate-200 dark:border-slate-700"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Adjustment Reason
                  </label>
                  <select
                    value={modalReason}
                    onChange={(e) => setModalReason(e.target.value)}
                    className="w-full h-10 px-3 bg-slate-50 dark:bg-slate-800 rounded-lg text-xs sm:text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 border border-slate-200 dark:border-slate-700"
                  >
                    <option value="physical_count">Physical Cycle Count</option>
                    <option value="scrap">Damaged / Scrap Write-off</option>
                    <option value="inbound_correction">GRN Inbound Correction</option>
                    <option value="customer_return">Customer Restock</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Audit Reference / Internal Note
                </label>
                <input
                  type="text"
                  value={modalAuditRef}
                  onChange={(e) => setModalAuditRef(e.target.value)}
                  placeholder="e.g. AUDIT-2024-Q2-CYCLE"
                  className="w-full h-10 px-3 bg-slate-50 dark:bg-slate-800 rounded-lg text-xs sm:text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 border border-slate-200 dark:border-slate-700"
                />
              </div>

              <div className="flex items-center gap-2 p-2.5 bg-blue-50 dark:bg-blue-950/60 text-blue-900 dark:text-blue-300 rounded-xl text-xs font-mono border border-blue-200/50">
                <Sparkles className="w-4 h-4 text-blue-600 shrink-0" />
                <span>
                  Free-to-use allocation will automatically recalculate against {editingItem?.reserved || 0} reserved units.
                </span>
              </div>
            </div>

            <div className="p-4 bg-slate-50 dark:bg-slate-800/60 flex items-center justify-end gap-2 border-t border-slate-200 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="px-4 py-2 text-xs sm:text-sm text-slate-600 dark:text-slate-400 font-medium hover:text-slate-900"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveModalAdjustment}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium text-xs sm:text-sm rounded-lg shadow-xs"
              >
                Save &amp; Post Ledger
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 5. AUDIT MOVEMENT LEDGER MODAL                                            */}
      {/* ========================================================================= */}
      {isHistoryOpen && historyTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 animate-in fade-in duration-150">
          <div className="bg-white dark:bg-slate-900 w-full max-w-xl rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden animate-in zoom-in-95 duration-150">
            <div className="px-5 py-4 bg-slate-50 dark:bg-slate-800/60 flex items-center justify-between border-b border-slate-200 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <RotateCcw className="w-4 h-4 text-blue-600" />
                <h3 className="font-bold text-base text-slate-900 dark:text-white">
                  Reconcile Log: {historyTarget.name} [{historyTarget.sku}]
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsHistoryOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 sm:p-5 max-h-80 overflow-y-auto space-y-2.5">
              {movementLogs
                .filter((log) => log.sku === historyTarget.sku)
                .map((log) => (
                  <div
                    key={log.id}
                    className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 flex items-center justify-between"
                  >
                    <div>
                      <div className="flex items-center gap-2 font-mono text-xs">
                        <span className="font-bold text-slate-900 dark:text-white">
                          {log.reference}
                        </span>
                        <span className="text-slate-500">• {log.timestamp}</span>
                      </div>
                      <div className="text-[11px] text-slate-500 mt-0.5">
                        Actor: {log.actor}
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
                      <div className="text-[10px] font-mono text-slate-400 uppercase">
                        {log.type.replace("_", " ")}
                      </div>
                    </div>
                  </div>
                ))}
            </div>

            <div className="p-4 bg-slate-50 dark:bg-slate-800/60 flex justify-end border-t border-slate-200 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setIsHistoryOpen(false)}
                className="px-4 py-2 bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-200 rounded-lg text-xs font-semibold"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 6. BARCODE SCANNER MODAL                                                  */}
      {/* ========================================================================= */}
      {isScannerOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-150">
          <div className="bg-white dark:bg-slate-900 w-full max-w-sm rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden p-5 space-y-4 text-center">
            <div className="flex items-center justify-between pb-2 border-b border-slate-200 dark:border-slate-800">
              <div className="flex items-center gap-1.5 font-bold text-sm text-slate-900 dark:text-white">
                <QrCode className="w-4 h-4 text-blue-600" />
                <span>RF Barcode Scanner</span>
              </div>
              <button
                type="button"
                onClick={() => setIsScannerOpen(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Scanner Viewfinder Box */}
            <div className="relative w-full h-48 bg-slate-950 rounded-xl flex items-center justify-center overflow-hidden border-2 border-blue-500">
              <div className="w-40 h-28 border-2 border-dashed border-blue-400/80 rounded-lg flex items-center justify-center">
                <span className="text-[11px] font-mono text-blue-300 animate-pulse">
                  Align Barcode in Frame
                </span>
              </div>
              {/* Laser line animation */}
              <div className="absolute left-4 right-4 h-0.5 bg-red-500 shadow-[0_0_8px_#ef4444] animate-bounce"></div>
            </div>

            <p className="text-xs text-slate-500 font-mono">
              Simulate barcode scan for rapid floor reconciliation:
            </p>

            <div className="grid grid-cols-2 gap-2">
              {stockList.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => {
                    setIsScannerOpen(false);
                    openEditModal(item);
                    triggerToast(`Scanned ${item.sku}: ${item.name}`, "qr_code_scanner");
                  }}
                  className="p-2 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-blue-50 dark:hover:bg-blue-950/50 text-xs font-mono text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700 transition-colors"
                >
                  Scan {item.sku}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 7. NOTIFICATION TOAST                                                     */}
      {/* ========================================================================= */}
      <div
        className={`fixed bottom-16 sm:bottom-6 right-4 sm:right-6 z-50 bg-slate-900 text-white px-4 py-2.5 rounded-xl shadow-xl flex items-center gap-2.5 transform transition-all duration-300 border border-slate-700 ${
          toast.visible
            ? "translate-y-0 opacity-100 scale-100"
            : "translate-y-8 opacity-0 scale-95 pointer-events-none"
        }`}
      >
        <span className="material-symbols-outlined text-emerald-400 text-[20px]">
          {toast.icon}
        </span>
        <span className="text-xs sm:text-sm font-medium">{toast.message}</span>
      </div>
    </div>
  );
}
