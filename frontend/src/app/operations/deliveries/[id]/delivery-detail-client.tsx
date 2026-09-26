"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTheme } from "@/components/theme-provider";
import {
  Search,
  Plus,
  Check,
  Printer,
  X,
  RefreshCw,
  Copy,
  ArrowLeft,
  AlertTriangle,
  Package,
  Calendar,
  MapPin,
  User,
  Barcode,
  Truck,
  Sun,
  Moon,
  Bell,
  Edit3,
  Trash2,
  Info,
  CheckCircle2,
  AlertCircle,
  FileText,
  Warehouse,
  Menu,
  ChevronRight,
  Sparkles,
  Maximize2,
  ExternalLink,
} from "lucide-react";

export interface DeliveryProductLine {
  id: string;
  code: string;
  name: string;
  sku: string;
  zone: string;
  demand: number;
  reserved: number;
  unit: string;
  inStock: boolean;
  shortageUnits?: number;
  deficitNote?: string;
  badgeTag: string;
}

const INITIAL_LINES: DeliveryProductLine[] = [
  {
    id: "line-1",
    code: "DSK",
    name: "Solid Pine Ergonomic Desk",
    sku: "98402-DSK",
    zone: "Zone B2-R12",
    demand: 6,
    reserved: 6,
    unit: "Units",
    inStock: true,
    badgeTag: "[DESK001]",
  },
  {
    id: "line-2",
    code: "CHR",
    name: "Executive Mesh Ergonomic Chair",
    sku: "44018-CHR",
    zone: "Bin A4-Empty",
    demand: 4,
    reserved: 0,
    unit: "Units",
    inStock: false,
    shortageUnits: 4,
    deficitNote: "Shortage: 4 units deficit • Bin A4-Empty",
    badgeTag: "[CHAIR04]",
  },
];

const CATALOG_ITEMS = [
  { code: "DSK", name: "Solid Pine Ergonomic Desk", sku: "98402-DSK", zone: "Zone B2-R12", unit: "Units", badgeTag: "[DESK001]" },
  { code: "CHR", name: "Executive Mesh Ergonomic Chair", sku: "44018-CHR", zone: "Bin A4-Empty", unit: "Units", badgeTag: "[CHAIR04]" },
  { code: "PKG", name: "Heavy Duty Recycled Shipping Box (L)", sku: "44021-PKG", zone: "Zone C1-R04", unit: "Units", badgeTag: "[BOX003]" },
  { code: "ARM", name: "Dual Gas-Spring Monitor Arm", sku: "67104-ARM", zone: "Zone A1-R02", unit: "Units", badgeTag: "[MON008]" },
  { code: "CBL", name: "Under-Desk Steel Cable Spine", sku: "22091-CBL", zone: "Zone B3-R08", unit: "Units", badgeTag: "[CBL002]" },
];

export function DeliveryDetailClient({ deliveryId }: { deliveryId: string }) {
  const router = useRouter();
  const { darkMode, toggleTheme } = useTheme();

  // Normalize reference
  const formattedRef = deliveryId
    ? deliveryId.includes("-") && !deliveryId.includes("/")
      ? deliveryId.replace(/-/g, "/")
      : deliveryId
    : "WH/OUT/0001";

  // State
  const [orderStatus, setOrderStatus] = useState<"Draft" | "Waiting" | "Ready" | "Done" | "Canceled">("Waiting");
  const [isOutOfStock, setIsOutOfStock] = useState<boolean>(true);
  const [lines, setLines] = useState<DeliveryProductLine[]>(INITIAL_LINES);
  const [activeTab, setActiveTab] = useState<"products" | "info" | "notes">("products");

  // Editable Form Fields
  const [deliveryAddress, setDeliveryAddress] = useState(
    "Azure Interior Inc. — 424 Logistics Blvd, Dock Bay 04, Chicago, IL 60601"
  );
  const [responsibleLead, setResponsibleLead] = useState("Alex Morgan [A] (Dispatch Lead - Bay 4)");
  const [scheduleDateTime, setScheduleDateTime] = useState("2026-10-26T14:30");
  const [operationType, setOperationType] = useState("WH/OUT (Delivery Orders) — Main Warehouse Dispatch");

  // Interaction feedback
  const [copiedRef, setCopiedRef] = useState(false);
  const [isCheckingAvailability, setIsCheckingAvailability] = useState(false);
  const [isSyncingStats, setIsSyncingStats] = useState(false);
  const [toastMessage, setToastMessage] = useState<{ text: string; type: "success" | "info" | "warning" } | null>(null);

  // Modals
  const [isNewOrderModalOpen, setIsNewOrderModalOpen] = useState(false);
  const [isAddLineModalOpen, setIsAddLineModalOpen] = useState(false);
  const [isEditLineModalOpen, setIsEditLineModalOpen] = useState(false);
  const [activeEditLine, setActiveEditLine] = useState<DeliveryProductLine | null>(null);
  const [isPoModalOpen, setIsPoModalOpen] = useState(false);
  const [isBarcodeModalOpen, setIsBarcodeModalOpen] = useState(false);
  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);
  const [isCancelModalOpen, setIsCancelModalOpen] = useState(false);
  const [isSearchModalOpen, setIsSearchModalOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [isMapModalOpen, setIsMapModalOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Add line form state
  const [selectedCatalogSku, setSelectedCatalogSku] = useState(CATALOG_ITEMS[2].sku);
  const [newLineDemand, setNewLineDemand] = useState("10");

  // Search input
  const [searchQuery, setSearchQuery] = useState("");
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Keyboard shortcut ⌘K
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setIsSearchModalOpen((prev) => !prev);
      }
      if (e.key === "Escape") {
        setIsSearchModalOpen(false);
        setIsNotificationsOpen(false);
        setIsPoModalOpen(false);
        setIsBarcodeModalOpen(false);
        setIsPrintModalOpen(false);
        setIsCancelModalOpen(false);
        setIsNewOrderModalOpen(false);
        setIsAddLineModalOpen(false);
        setIsEditLineModalOpen(false);
        setIsMapModalOpen(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const triggerToast = (text: string, type: "success" | "info" | "warning" = "success") => {
    setToastMessage({ text, type });
    setTimeout(() => {
      setToastMessage(null);
    }, 3600);
  };

  // Copy reference
  const handleCopyReference = () => {
    navigator.clipboard?.writeText(formattedRef);
    setCopiedRef(true);
    triggerToast(`Copied ${formattedRef} to clipboard!`, "info");
    setTimeout(() => setCopiedRef(false), 2000);
  };

  // Toggle Stock Simulation
  const handleToggleSimulation = () => {
    const nextState = !isOutOfStock;
    setIsOutOfStock(nextState);

    if (nextState) {
      // Out of stock mode
      setOrderStatus("Waiting");
      setLines((prev) =>
        prev.map((line) =>
          line.code === "CHR"
            ? {
                ...line,
                reserved: 0,
                inStock: false,
                shortageUnits: 4,
                deficitNote: "Shortage: 4 units deficit • Bin A4-Empty",
              }
            : line
        )
      );
      triggerToast("Simulated deficit: Product [CHAIR04] set to Out of Stock. Order moved to Waiting Availability.", "warning");
    } else {
      // In stock ready mode
      setOrderStatus("Ready");
      setLines((prev) =>
        prev.map((line) =>
          line.code === "CHR"
            ? {
                ...line,
                reserved: 4,
                inStock: true,
                shortageUnits: undefined,
                deficitNote: undefined,
              }
            : line
        )
      );
      triggerToast("Simulated replenishment: Product [CHAIR04] is now 100% reserved! Order moved to Ready for Dispatch.", "success");
    }
  };

  // Validate Action
  const handleValidate = () => {
    if (orderStatus === "Done") {
      triggerToast("Order has already been validated and dispatched.", "info");
      return;
    }

    if (isOutOfStock && orderStatus === "Waiting") {
      triggerToast("Cannot validate: 1 item has insufficient stock. Replenish or re-check availability first.", "warning");
      return;
    }

    if (orderStatus === "Waiting" && !isOutOfStock) {
      setOrderStatus("Ready");
      triggerToast("Stock cleared! Order is now Ready for Pick & Pack.", "success");
      return;
    }

    if (orderStatus === "Ready" || orderStatus === "Draft") {
      setOrderStatus("Done");
      triggerToast(`Order ${formattedRef} validated! Dispatched to dock. Waybill #9042 issued.`, "success");
    }
  };

  // Re-check Availability
  const handleRecheckAvailability = () => {
    setIsCheckingAvailability(true);
    setTimeout(() => {
      setIsCheckingAvailability(false);
      if (isOutOfStock) {
        triggerToast("Live bin scan completed: Bin A4 remains empty. Inbound PO #881 confirmed on schedule.", "info");
      } else {
        triggerToast("Live bin scan verified: All items available and reserved in primary racks.", "success");
      }
    }, 650);
  };

  // Add Product Line
  const handleAddProductLine = (e: React.FormEvent) => {
    e.preventDefault();
    const itemCatalog = CATALOG_ITEMS.find((i) => i.sku === selectedCatalogSku) || CATALOG_ITEMS[0];
    const qty = parseInt(newLineDemand, 10) || 1;

    const newLine: DeliveryProductLine = {
      id: `line-${Date.now()}`,
      code: itemCatalog.code,
      name: itemCatalog.name,
      sku: itemCatalog.sku,
      zone: itemCatalog.zone,
      demand: qty,
      reserved: qty,
      unit: itemCatalog.unit,
      inStock: true,
      badgeTag: itemCatalog.badgeTag,
    };

    setLines((prev) => [...prev, newLine]);
    setIsAddLineModalOpen(false);
    triggerToast(`Added ${qty} × ${itemCatalog.name} to order lines.`, "success");
  };

  // Edit Line Save
  const handleSaveEditedLine = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeEditLine) return;
    setLines((prev) => prev.map((l) => (l.id === activeEditLine.id ? activeEditLine : l)));
    setIsEditLineModalOpen(false);
    setActiveEditLine(null);
    triggerToast(`Updated ${activeEditLine.name} line demand.`, "info");
  };

  // Delete Line
  const handleDeleteLine = (id: string, name: string) => {
    setLines((prev) => prev.filter((l) => l.id !== id));
    triggerToast(`Removed ${name} from order lines.`, "info");
  };

  // Live Sync refresh
  const handleSyncPing = () => {
    setIsSyncingStats(true);
    setTimeout(() => {
      setIsSyncingStats(false);
      triggerToast("System state synchronized with US-EAST-04 central warehouse node.", "success");
    }, 450);
  };

  // Calculated totals
  const totalUnits = lines.reduce((acc, curr) => acc + curr.demand, 0);
  const totalReserved = lines.reduce((acc, curr) => acc + curr.reserved, 0);
  const totalWeightKg = (lines.length * 71).toFixed(1);
  const hasShortage = lines.some((l) => !l.inStock);

  return (
    <div className="min-h-screen flex flex-col font-sans text-slate-800 dark:text-slate-100 bg-[#f8fafc] dark:bg-slate-900 selection:bg-blue-100 dark:selection:bg-blue-900 selection:text-blue-900 dark:selection:text-blue-100 transition-colors">
      {/* Toast Notification Banner */}
      {toastMessage && (
        <div className="fixed bottom-5 right-5 z-50 flex items-center gap-3 px-4 py-3 rounded-xl shadow-lg border text-sm font-medium transition-all animate-in fade-in slide-in-from-bottom-5 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 border-slate-200 dark:border-slate-700">
          {toastMessage.type === "success" && <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />}
          {toastMessage.type === "warning" && <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />}
          {toastMessage.type === "info" && <Info className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0" />}
          <span>{toastMessage.text}</span>
          <button
            onClick={() => setToastMessage(null)}
            className="ml-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1"
            aria-label="Dismiss toast"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* BEGIN: Minimal Top Navigation Chrome */}
      <header className="sticky top-0 z-40 bg-white/95 dark:bg-slate-800/95 backdrop-blur-md border-b border-slate-200/80 dark:border-slate-700/80 transition-colors">
        <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-14">
            {/* Left: Logo & Crisp Main Navigation */}
            <div className="flex items-center gap-7">
              <Link href="/dashboard" className="flex items-center gap-2.5 group">
                <div className="w-7 h-7 rounded-md bg-blue-600 flex items-center justify-center text-white shadow-xs group-hover:bg-blue-700 transition">
                  <Package className="w-4 h-4" />
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-slate-900 dark:text-white tracking-tight text-[13.5px]">
                    Nova Precision
                  </span>
                  <span className="px-1.5 py-0.5 text-[9.5px] font-medium tracking-wide uppercase bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 rounded">
                    WMS
                  </span>
                </div>
              </Link>
              <nav aria-label="Main Navigation" className="hidden md:flex items-center space-x-0.5">
                <Link
                  className="px-3 py-1.5 text-xs font-medium text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 rounded-md transition-colors"
                  href="/dashboard"
                >
                  Dashboard
                </Link>
                <Link
                  aria-current="page"
                  className="px-3 py-1.5 text-xs font-semibold text-blue-600 dark:text-blue-400 bg-blue-50/70 dark:bg-blue-950/60 rounded-md transition-colors"
                  href="/operations/deliveries"
                >
                  Operations
                </Link>
                <Link
                  className="px-3 py-1.5 text-xs font-medium text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 rounded-md transition-colors"
                  href="/products"
                >
                  Products
                </Link>
                <Link
                  className="px-3 py-1.5 text-xs font-medium text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 rounded-md transition-colors"
                  href="/moves"
                >
                  Move History
                </Link>
                <Link
                  className="px-3 py-1.5 text-xs font-medium text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 rounded-md transition-colors"
                  href="/settings/warehouses"
                >
                  Settings
                </Link>
              </nav>
            </div>

            {/* Right: Search, Notifications, Theme & User Badge */}
            <div className="flex items-center gap-2 sm:gap-3">
              {/* Quick Search trigger */}
              <button
                onClick={() => setIsSearchModalOpen(true)}
                className="flex items-center gap-2 text-xs text-slate-400 bg-slate-50 dark:bg-slate-700/60 hover:bg-slate-100 dark:hover:bg-slate-700 hover:text-slate-600 dark:hover:text-slate-300 px-2.5 py-1.5 rounded-lg border border-slate-200/70 dark:border-slate-700 transition-colors"
                type="button"
                title="Search (⌘K)"
              >
                <Search className="w-3.5 h-3.5" />
                <span className="hidden sm:inline text-slate-500 dark:text-slate-400">Quick search...</span>
                <kbd className="font-mono text-[10px] bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-600 px-1 py-0.5 rounded text-slate-400 dark:text-slate-300">
                  ⌘K
                </kbd>
              </button>

              {/* Notifications */}
              <div className="relative">
                <button
                  onClick={() => setIsNotificationsOpen((prev) => !prev)}
                  className="relative p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition"
                  title="Notifications"
                  type="button"
                >
                  <Bell className="w-4 h-4" />
                  <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 bg-amber-500 rounded-full"></span>
                </button>

                {/* Notifications Dropdown */}
                {isNotificationsOpen && (
                  <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white dark:bg-slate-800 rounded-xl shadow-xl border border-slate-200 dark:border-slate-700 p-4 z-50">
                    <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-700">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-xs text-slate-900 dark:text-white">Active Alerts</span>
                        <span className="px-1.5 py-0.2 text-[10px] bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 rounded font-mono font-medium">
                          1 Critical
                        </span>
                      </div>
                      <button
                        onClick={() => setIsNotificationsOpen(false)}
                        className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                    <div className="mt-3 space-y-2.5">
                      <div className="p-2.5 rounded-lg bg-red-50/70 dark:bg-red-950/40 border border-red-100 dark:border-red-900/40 text-left">
                        <p className="text-xs font-semibold text-red-900 dark:text-red-300 flex items-center gap-1.5">
                          <AlertTriangle className="w-3.5 h-3.5 text-red-600 dark:text-red-400" />
                          Shortage: [CHAIR04]
                        </p>
                        <p className="text-[11px] text-red-700 dark:text-red-400 mt-1">
                          Delivery {formattedRef} requires 4 units. Replenishment scheduled on incoming PO #881.
                        </p>
                        <div className="mt-2 flex gap-2">
                          <button
                            onClick={() => {
                              setIsNotificationsOpen(false);
                              setIsPoModalOpen(true);
                            }}
                            className="text-[10px] font-medium text-blue-600 dark:text-blue-400 hover:underline"
                          >
                            View PO #881 →
                          </button>
                        </div>
                      </div>
                      <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-700/40 border border-slate-100 dark:border-slate-700 text-left">
                        <p className="text-xs font-medium text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                          Dock Gate 04 Staging Active
                        </p>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                          Carrier SwiftLog Express assigned to fleet dispatch slot.
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Theme Toggle Button */}
              <button
                onClick={toggleTheme}
                className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition"
                title={darkMode ? "Switch to light mode" : "Switch to dark mode"}
                type="button"
                aria-label="Toggle dark mode"
              >
                {darkMode ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-slate-600" />}
              </button>

              <div className="h-4 w-[1px] bg-slate-200 dark:bg-slate-700 mx-0.5 hidden sm:block"></div>

              {/* User avatar marked [ A ] */}
              <div className="flex items-center gap-2 group cursor-pointer pl-1">
                <div
                  className="w-7 h-7 rounded-full bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 flex items-center justify-center font-mono font-medium text-xs shadow-xs"
                  title="Alex Morgan (Warehouse Dispatch)"
                >
                  A
                </div>
                <div className="hidden lg:block text-left">
                  <p className="text-xs font-medium text-slate-800 dark:text-slate-200 leading-tight">Alex Morgan</p>
                  <p className="text-[10px] text-slate-400 dark:text-slate-400">Dispatch Lead</p>
                </div>
              </div>

              {/* Mobile Menu Hamburger Toggle */}
              <button
                onClick={() => setMobileMenuOpen((prev) => !prev)}
                className="md:hidden p-1.5 text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg"
                aria-label="Toggle navigation menu"
              >
                {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>
            </div>
          </div>

          {/* Mobile Navigation Drawer */}
          {mobileMenuOpen && (
            <div className="md:hidden py-3 border-t border-slate-200 dark:border-slate-700 space-y-1">
              <Link
                href="/dashboard"
                onClick={() => setMobileMenuOpen(false)}
                className="block px-3 py-2 text-xs font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-md"
              >
                Dashboard
              </Link>
              <Link
                href="/operations/deliveries"
                onClick={() => setMobileMenuOpen(false)}
                className="block px-3 py-2 text-xs font-semibold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/60 rounded-md"
              >
                Operations (Deliveries)
              </Link>
              <Link
                href="/products"
                onClick={() => setMobileMenuOpen(false)}
                className="block px-3 py-2 text-xs font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-md"
              >
                Products
              </Link>
              <Link
                href="/moves"
                onClick={() => setMobileMenuOpen(false)}
                className="block px-3 py-2 text-xs font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-md"
              >
                Move History
              </Link>
              <Link
                href="/settings/warehouses"
                onClick={() => setMobileMenuOpen(false)}
                className="block px-3 py-2 text-xs font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-md"
              >
                Settings
              </Link>
            </div>
          )}
        </div>
      </header>
      {/* END: MainHeader */}

      {/* BEGIN: Minimalist Breadcrumb Bar */}
      <section aria-label="Breadcrumb Bar" className="border-b border-slate-200/60 dark:border-slate-700/60 bg-white/50 dark:bg-slate-800/40">
        <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-2">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center text-[11px] text-slate-500 dark:text-slate-400 tracking-tight">
              <Link className="hover:text-slate-800 dark:hover:text-slate-200 transition" href="/operations/deliveries">
                Operations
              </Link>
              <ChevronRight className="w-3 h-3 mx-1 text-slate-300 dark:text-slate-600" />
              <Link className="hover:text-slate-800 dark:hover:text-slate-200 transition" href="/operations/deliveries">
                Deliveries
              </Link>
              <ChevronRight className="w-3 h-3 mx-1 text-slate-300 dark:text-slate-600" />
              <span className="font-mono font-medium text-slate-800 dark:text-slate-200">{formattedRef}</span>
            </div>

            <Link
              href="/operations/deliveries"
              className="inline-flex items-center gap-1 text-[11px] text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 transition"
            >
              <ArrowLeft className="w-3 h-3" />
              <span>Back to Manifest</span>
            </Link>
          </div>
        </div>
      </section>
      {/* END: BreadcrumbSubNav */}

      {/* MAIN VIEWPORT */}
      <main className="flex-1 max-w-[1600px] w-full mx-auto px-4 sm:px-6 lg:px-8 py-5 sm:py-7 space-y-5 sm:space-y-6">
        {/* TOP SECTION: Order Title, Sleek Minimal Stepper & Nordic Action Bar */}
        <section className="bg-white dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700/80 rounded-xl p-5 sm:p-6 shadow-sm transition-colors">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5">
            {/* Title and Live Status */}
            <div className="space-y-1">
              <div className="flex flex-wrap items-center gap-3">
                <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-white font-sans">
                  Delivery Order
                </h1>
                {orderStatus === "Waiting" && (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-50 dark:bg-amber-950/70 text-amber-800 dark:text-amber-300 border border-amber-200/70 dark:border-amber-800/60">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse"></span>
                    Waiting Availability
                  </span>
                )}
                {orderStatus === "Ready" && (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-50 dark:bg-blue-950/70 text-blue-700 dark:text-blue-300 border border-blue-200/70 dark:border-blue-800/60">
                    <span className="w-1.5 h-1.5 rounded-full bg-blue-600 animate-pulse"></span>
                    Ready for Dispatch
                  </span>
                )}
                {orderStatus === "Done" && (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-50 dark:bg-emerald-950/70 text-emerald-700 dark:text-emerald-300 border border-emerald-200/70 dark:border-emerald-800/60">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                    Done (Dispatched)
                  </span>
                )}
                {orderStatus === "Draft" && (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-600">
                    <span className="w-1.5 h-1.5 rounded-full bg-slate-400"></span>
                    Draft State
                  </span>
                )}
                {orderStatus === "Canceled" && (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-rose-50 dark:bg-rose-950/70 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800/60">
                    <span className="w-1.5 h-1.5 rounded-full bg-rose-500"></span>
                    Canceled Order
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-400 dark:text-slate-400">
                Outbound fulfillment transfer order from Bay 04 • SLA: Next-day priority
              </p>
            </div>

            {/* Nordic Pill Stepper (Draft > Waiting > Ready > Done) */}
            <div className="relative overflow-x-auto pb-1 sm:pb-0">
              <div className="inline-flex items-center gap-1 p-1 bg-slate-50 dark:bg-slate-700/50 border border-slate-200/80 dark:border-slate-700 rounded-full text-xs font-medium whitespace-nowrap">
                {/* Draft */}
                <div
                  className={`flex items-center gap-1.5 px-3 py-1 rounded-full transition ${
                    orderStatus === "Draft"
                      ? "bg-slate-800 dark:bg-white text-white dark:text-slate-900 font-medium shadow-xs"
                      : "text-slate-400 dark:text-slate-400"
                  }`}
                >
                  <span
                    className={`w-1.5 h-1.5 rounded-full ${
                      orderStatus === "Draft" ? "bg-white dark:bg-slate-900" : "bg-slate-300 dark:bg-slate-600"
                    }`}
                  ></span>
                  <span>Draft</span>
                </div>
                <ChevronRight className="w-3 h-3 text-slate-300 dark:text-slate-600 shrink-0" />

                {/* Waiting */}
                <div
                  className={`flex items-center gap-1.5 px-3 py-1 rounded-full transition ${
                    orderStatus === "Waiting"
                      ? "bg-amber-500 text-white font-medium shadow-xs"
                      : orderStatus === "Ready" || orderStatus === "Done"
                      ? "text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200/60 dark:border-emerald-800/40"
                      : "text-slate-400 dark:text-slate-400"
                  }`}
                >
                  {orderStatus === "Ready" || orderStatus === "Done" ? (
                    <Check className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                  ) : (
                    <span
                      className={`w-1.5 h-1.5 rounded-full ${
                        orderStatus === "Waiting" ? "bg-white animate-pulse" : "bg-slate-300 dark:bg-slate-600"
                      }`}
                    ></span>
                  )}
                  <span>Waiting</span>
                </div>
                <ChevronRight className="w-3 h-3 text-slate-300 dark:text-slate-600 shrink-0" />

                {/* Ready */}
                <div
                  className={`flex items-center gap-1.5 px-3 py-1 rounded-full transition ${
                    orderStatus === "Ready"
                      ? "bg-blue-600 text-white font-medium shadow-xs"
                      : orderStatus === "Done"
                      ? "text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200/60 dark:border-emerald-800/40"
                      : "text-slate-400 dark:text-slate-400"
                  }`}
                >
                  {orderStatus === "Done" ? (
                    <Check className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                  ) : (
                    <span
                      className={`w-1.5 h-1.5 rounded-full ${
                        orderStatus === "Ready" ? "bg-white animate-pulse" : "bg-slate-300 dark:bg-slate-600"
                      }`}
                    ></span>
                  )}
                  <span>Ready</span>
                </div>
                <ChevronRight className="w-3 h-3 text-slate-300 dark:text-slate-600 shrink-0" />

                {/* Done */}
                <div
                  className={`flex items-center gap-1.5 px-3 py-1 rounded-full transition ${
                    orderStatus === "Done"
                      ? "bg-emerald-600 text-white font-medium shadow-xs"
                      : "text-slate-400 dark:text-slate-400"
                  }`}
                >
                  <span
                    className={`w-1.5 h-1.5 rounded-full ${
                      orderStatus === "Done" ? "bg-white" : "bg-slate-300 dark:bg-slate-600"
                    }`}
                  ></span>
                  <span>Done</span>
                </div>
              </div>
            </div>
          </div>

          {/* Action Bar */}
          <div className="mt-5 pt-4 border-t border-slate-100 dark:border-slate-700 flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2">
              {/* '+ New' outline button */}
              <button
                onClick={() => setIsNewOrderModalOpen(true)}
                className="inline-flex items-center px-3 py-1.5 text-xs font-medium text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-600 hover:border-slate-300 dark:hover:border-slate-500 transition shadow-xs"
                type="button"
                id="btn-new-order"
              >
                <Plus className="w-3.5 h-3.5 mr-1.5 text-slate-400 dark:text-slate-300" />
                New
              </button>

              {/* 'Validate' Cobalt Primary */}
              <button
                onClick={handleValidate}
                disabled={orderStatus === "Done" || orderStatus === "Canceled"}
                className={`inline-flex items-center px-3.5 py-1.5 text-xs font-medium text-white rounded-lg transition shadow-xs ${
                  orderStatus === "Done" || orderStatus === "Canceled"
                    ? "bg-slate-300 dark:bg-slate-700 cursor-not-allowed opacity-60"
                    : "bg-blue-600 hover:bg-blue-700 shadow-blue-600/20 active:scale-[0.98]"
                }`}
                id="validate-btn"
                type="button"
              >
                <Check className="w-3.5 h-3.5 mr-1.5 text-white/90" />
                {orderStatus === "Done" ? "Validated" : "Validate"}
              </button>

              {/* 'Print Slip' Ghost/Outline */}
              <button
                onClick={() => setIsPrintModalOpen(true)}
                className="inline-flex items-center px-3 py-1.5 text-xs font-medium text-slate-600 dark:text-slate-300 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-600 transition shadow-xs"
                type="button"
                id="btn-print-slip"
              >
                <Printer className="w-3.5 h-3.5 mr-1.5 text-slate-400 dark:text-slate-300" />
                Print Slip
              </button>

              {/* 'Cancel' Muted Text Button */}
              {orderStatus !== "Canceled" ? (
                <button
                  onClick={() => setIsCancelModalOpen(true)}
                  className="inline-flex items-center px-2.5 py-1.5 text-xs font-medium text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 transition"
                  type="button"
                  id="btn-cancel-order"
                >
                  <X className="w-3.5 h-3.5 mr-1" />
                  Cancel
                </button>
              ) : (
                <button
                  onClick={() => {
                    setOrderStatus("Waiting");
                    triggerToast("Order restored from canceled state.", "info");
                  }}
                  className="inline-flex items-center px-2.5 py-1.5 text-xs font-medium text-blue-600 dark:text-blue-400 hover:underline"
                >
                  <RefreshCw className="w-3 h-3 mr-1" /> Re-open Order
                </button>
              )}
            </div>

            {/* Quick Stock Simulation Toggle */}
            <div>
              <button
                onClick={handleToggleSimulation}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-600 dark:text-slate-200 bg-slate-50 dark:bg-slate-700/60 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200/80 dark:border-slate-600 rounded-lg transition active:scale-[0.98]"
                id="toggle-stock-btn"
                title="Simulate stock replenishment or shortage"
                type="button"
              >
                <RefreshCw className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                <span>
                  Simulate:{" "}
                  <strong
                    className={`font-semibold ${
                      isOutOfStock ? "text-amber-700 dark:text-amber-400" : "text-emerald-700 dark:text-emerald-400"
                    }`}
                    id="simulation-state-label"
                  >
                    {isOutOfStock ? "Out-of-Stock" : "In-Stock / Ready"}
                  </strong>
                </span>
              </button>
            </div>
          </div>
        </section>

        {/* BEGIN: Sleek Alert Notification Banner (when Shortage / Out of Stock exists) */}
        {hasShortage && (
          <div
            className="bg-red-50/70 dark:bg-red-950/40 text-red-900 dark:text-red-200 border border-red-200/70 dark:border-red-900/50 rounded-xl p-4 shadow-xs transition-all"
            id="stock-alert-banner"
            role="alert"
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-start sm:items-center gap-3">
                <div className="w-7 h-7 rounded-lg bg-red-100 dark:bg-red-900/60 text-red-600 dark:text-red-300 flex items-center justify-center shrink-0 mt-0.5 sm:mt-0">
                  <AlertTriangle className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-semibold text-red-900 dark:text-red-200">
                    Inventory Notice: 1 Line Out of Stock
                  </h4>
                  <p className="text-[12px] text-red-700 dark:text-red-300 mt-0.5">
                    Product <span className="font-mono font-semibold">[CHAIR04]</span> has no reservable stock in Bin
                    A4. Replenishment PO #881 arriving tomorrow.
                  </p>
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-2 shrink-0">
                <button
                  onClick={() => setIsPoModalOpen(true)}
                  className="px-2.5 py-1 text-xs font-medium bg-white dark:bg-slate-800 text-red-700 dark:text-red-300 border border-red-200/80 dark:border-red-800 rounded-md hover:bg-red-50 dark:hover:bg-slate-700 transition"
                  type="button"
                >
                  View PO #881
                </button>
                <button
                  onClick={handleRecheckAvailability}
                  disabled={isCheckingAvailability}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium bg-red-600 text-white rounded-md hover:bg-red-700 transition disabled:opacity-75"
                  type="button"
                >
                  <RefreshCw className={`w-3 h-3 ${isCheckingAvailability ? "animate-spin" : ""}`} />
                  Re-check Availability
                </button>
              </div>
            </div>
          </div>
        )}
        {/* END: Alert Banner */}

        {/* BEGIN: Document Reference & Clean Metadata Form */}
        <section className="bg-white dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700/80 rounded-xl p-5 sm:p-6 shadow-sm space-y-6 transition-colors">
          {/* Prominent Document Reference Bar */}
          <div className="flex flex-wrap items-center justify-between gap-4 pb-5 border-b border-slate-100 dark:border-slate-700">
            <div className="flex items-center gap-3">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-400">
                Order Reference
              </span>
              <span className="text-xl sm:text-2xl font-bold font-mono text-slate-900 dark:text-white tracking-tight">
                {formattedRef}
              </span>
              <button
                onClick={handleCopyReference}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1 transition"
                title="Copy reference"
                type="button"
              >
                {copiedRef ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
              </button>
              {orderStatus === "Waiting" && (
                <span className="hidden sm:inline-block px-2.5 py-0.5 text-xs font-medium rounded-full bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border border-amber-200/60 dark:border-amber-800/50">
                  Waiting Availability
                </span>
              )}
              {orderStatus === "Ready" && (
                <span className="hidden sm:inline-block px-2.5 py-0.5 text-xs font-medium rounded-full bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border border-blue-200/60 dark:border-blue-800/50">
                  Ready for Dispatch
                </span>
              )}
              {orderStatus === "Done" && (
                <span className="hidden sm:inline-block px-2.5 py-0.5 text-xs font-medium rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200/60 dark:border-emerald-800/50">
                  Done (Dispatched)
                </span>
              )}
            </div>

            {/* Barcode Pill */}
            <button
              onClick={() => setIsBarcodeModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-slate-50 dark:bg-slate-700/60 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200/80 dark:border-slate-600 rounded-md font-mono text-xs text-slate-600 dark:text-slate-300 transition"
              title="Click to view large scannable barcode"
            >
              <Barcode className="w-3.5 h-3.5 text-slate-400 dark:text-slate-400" />
              <span>BARCODE: *WHO-0001*</span>
              <Maximize2 className="w-3 h-3 text-slate-400 ml-1 opacity-60" />
            </button>
          </div>

          {/* Floating Clean Nordic Inputs Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-5">
            {/* Left Column */}
            <div className="space-y-4">
              {/* Delivery Address */}
              <div>
                <label
                  className="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-1.5"
                  htmlFor="delivery-address"
                >
                  Delivery Address <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <input
                    className="block w-full rounded-lg border-slate-200 dark:border-slate-600 text-xs text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 py-2.5 px-3 pr-9 transition bg-slate-50/30 dark:bg-slate-700/30 hover:bg-white dark:hover:bg-slate-700/60"
                    id="delivery-address"
                    name="delivery-address"
                    type="text"
                    value={deliveryAddress}
                    onChange={(e) => {
                      setDeliveryAddress(e.target.value);
                    }}
                  />
                  <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3 text-slate-400 dark:text-slate-400">
                    <MapPin className="h-4 w-4" />
                  </div>
                </div>
                <p className="mt-1 text-[11px] text-slate-400 dark:text-slate-400">
                  Verified customer destination • Loading dock active
                </p>
              </div>

              {/* Responsible */}
              <div>
                <label
                  className="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-1.5"
                  htmlFor="responsible"
                >
                  Responsible Lead <span className="text-rose-500">*</span>
                </label>
                <div className="relative flex items-center">
                  <select
                    className="block w-full rounded-lg border-slate-200 dark:border-slate-600 text-xs text-slate-900 dark:text-slate-100 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 py-2.5 px-3 pr-10 transition bg-slate-50/30 dark:bg-slate-700/30 hover:bg-white dark:hover:bg-slate-700/60"
                    id="responsible"
                    name="responsible"
                    value={responsibleLead}
                    onChange={(e) => {
                      setResponsibleLead(e.target.value);
                      triggerToast(`Assigned lead updated to ${e.target.value}`, "info");
                    }}
                  >
                    <option value="Alex Morgan [A] (Dispatch Lead - Bay 4)">Alex Morgan [A] (Dispatch Lead - Bay 4)</option>
                    <option value="Elena Rostova (Senior Inventory Specialist)">Elena Rostova (Senior Inventory Specialist)</option>
                    <option value="Marcus Vance (Outbound Coordinator)">Marcus Vance (Outbound Coordinator)</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Right Column */}
            <div className="space-y-4">
              {/* Schedule Date */}
              <div>
                <label
                  className="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-1.5"
                  htmlFor="schedule-date"
                >
                  Schedule Date &amp; Time <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <input
                    className="block w-full rounded-lg border-slate-200 dark:border-slate-600 text-xs text-slate-900 dark:text-slate-100 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 py-2.5 px-3 transition bg-slate-50/30 dark:bg-slate-700/30 hover:bg-white dark:hover:bg-slate-700/60"
                    id="schedule-date"
                    name="schedule-date"
                    type="datetime-local"
                    value={scheduleDateTime}
                    onChange={(e) => {
                      setScheduleDateTime(e.target.value);
                      triggerToast("Schedule dispatch window updated.", "info");
                    }}
                  />
                </div>
                <p className="mt-1 text-[11px] text-slate-400 dark:text-slate-400">
                  Target SLA dispatch window: within 24h of stock clearance
                </p>
              </div>

              {/* Operation Type */}
              <div>
                <label
                  className="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-1.5"
                  htmlFor="operation-type"
                >
                  Operation Type <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <select
                    className="block w-full rounded-lg border-slate-200 dark:border-slate-600 text-xs text-slate-900 dark:text-slate-100 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 py-2.5 px-3 pr-10 transition bg-slate-50/30 dark:bg-slate-700/30 hover:bg-white dark:hover:bg-slate-700/60"
                    id="operation-type"
                    name="operation-type"
                    value={operationType}
                    onChange={(e) => {
                      setOperationType(e.target.value);
                      triggerToast(`Operation sequence set to ${e.target.value.split(" ")[0]}`, "info");
                    }}
                  >
                    <option value="WH/OUT (Delivery Orders) — Main Warehouse Dispatch">
                      WH/OUT (Delivery Orders) — Main Warehouse Dispatch
                    </option>
                    <option value="WH/INTERNAL (Internal Relocation)">WH/INTERNAL (Internal Relocation)</option>
                    <option value="WH/PICK (Pick to Staging Zone)">WH/PICK (Pick to Staging Zone)</option>
                  </select>
                </div>
              </div>
            </div>
          </div>
        </section>
        {/* END: Metadata Form */}

        {/* BEGIN: Airy Product Line Items Table Section */}
        <section className="bg-white dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700/80 rounded-xl shadow-sm overflow-hidden transition-colors">
          {/* Minimalist Tab Header */}
          <div className="border-b border-slate-200/70 dark:border-slate-700 px-5 sm:px-6 pt-3 flex flex-wrap items-center justify-between gap-3 bg-white dark:bg-slate-800">
            <div className="flex space-x-6">
              <button
                onClick={() => setActiveTab("products")}
                className={`pb-3 text-xs font-semibold flex items-center gap-2 border-b-2 transition ${
                  activeTab === "products"
                    ? "text-blue-600 dark:text-blue-400 border-blue-600 dark:border-blue-400"
                    : "text-slate-400 dark:text-slate-400 border-transparent hover:text-slate-700 dark:hover:text-slate-200"
                }`}
                type="button"
              >
                <span>Products</span>
                <span
                  className="px-2 py-0.5 text-[10px] font-semibold rounded-full bg-blue-50 dark:bg-blue-950 text-blue-700 dark:text-blue-300"
                  id="line-count-badge"
                >
                  {lines.length} Items
                </span>
              </button>

              <button
                onClick={() => setActiveTab("info")}
                className={`pb-3 text-xs font-medium border-b-2 transition ${
                  activeTab === "info"
                    ? "text-blue-600 dark:text-blue-400 border-blue-600 dark:border-blue-400 font-semibold"
                    : "text-slate-400 dark:text-slate-400 border-transparent hover:text-slate-700 dark:hover:text-slate-200"
                }`}
                type="button"
              >
                Additional Info
              </button>

              <button
                onClick={() => setActiveTab("notes")}
                className={`pb-3 text-xs font-medium border-b-2 transition ${
                  activeTab === "notes"
                    ? "text-blue-600 dark:text-blue-400 border-blue-600 dark:border-blue-400 font-semibold"
                    : "text-slate-400 dark:text-slate-400 border-transparent hover:text-slate-700 dark:hover:text-slate-200"
                }`}
                type="button"
              >
                Notes &amp; Instructions
              </button>
            </div>

            <div className="pb-2 hidden sm:flex items-center gap-1.5 text-xs text-slate-400 dark:text-slate-400">
              <span>Staging Bay:</span>
              <span className="font-medium text-slate-700 dark:text-slate-200">Dock Bay #4</span>
            </div>
          </div>

          {/* TAB 1: Products Table */}
          {activeTab === "products" && (
            <div>
              {/* Desktop Table (> 768px) */}
              <div className="hidden md:block overflow-x-auto">
                <table className="min-w-full divide-y divide-slate-100 dark:divide-slate-700 text-left text-xs" id="delivery-items-table">
                  <thead className="bg-slate-50/70 dark:bg-slate-700/40 text-slate-500 dark:text-slate-400 font-medium tracking-tight">
                    <tr>
                      <th className="py-3.5 pl-6 pr-3" scope="col">
                        Product Details
                      </th>
                      <th className="px-3 py-3.5 text-right" scope="col">
                        Demand
                      </th>
                      <th className="px-3 py-3.5 text-right" scope="col">
                        Reserved / Available
                      </th>
                      <th className="px-3 py-3.5" scope="col">
                        Unit
                      </th>
                      <th className="px-3 py-3.5 text-center" scope="col">
                        Stock Status
                      </th>
                      <th className="relative py-3.5 pl-3 pr-6 text-right" scope="col">
                        <span className="sr-only">Actions</span>
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-700/60 bg-white dark:bg-slate-800" id="table-body">
                    {lines.map((line) => {
                      const isShortage = !line.inStock;
                      return (
                        <tr
                          key={line.id}
                          className={`transition-colors ${
                            isShortage
                              ? "bg-rose-50/50 dark:bg-rose-950/30 text-red-950 dark:text-red-200 border-l-4 border-l-red-500"
                              : "hover:bg-slate-50/60 dark:hover:bg-slate-700/30"
                          }`}
                        >
                          <td className="py-4 pl-6 pr-3">
                            <div className="flex items-center gap-3">
                              <div
                                className={`w-8 h-8 rounded-lg flex items-center justify-center font-mono text-[10px] ${
                                  isShortage
                                    ? "bg-red-100/80 dark:bg-red-900/40 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300"
                                    : "bg-slate-100 dark:bg-slate-700 border border-slate-200/80 dark:border-slate-600 text-slate-600 dark:text-slate-300"
                                }`}
                              >
                                {line.code}
                              </div>
                              <div>
                                <div className="flex items-center gap-1.5">
                                  <span
                                    className={`font-mono font-medium ${
                                      isShortage
                                        ? "text-red-700 dark:text-red-400"
                                        : "text-blue-700 dark:text-blue-400"
                                    }`}
                                  >
                                    {line.badgeTag}
                                  </span>
                                  <span className="font-medium text-slate-900 dark:text-slate-100">{line.name}</span>
                                </div>
                                <div
                                  className={`text-[11px] ${
                                    isShortage
                                      ? "text-red-600 dark:text-red-400 font-medium"
                                      : "text-slate-400 dark:text-slate-400"
                                  }`}
                                >
                                  {isShortage ? line.deficitNote : `${line.zone} • SKU: ${line.sku}`}
                                </div>
                              </div>
                            </div>
                          </td>
                          <td
                            className={`px-3 py-4 text-right font-mono font-medium text-sm ${
                              isShortage ? "text-red-950 dark:text-red-200 font-semibold" : "text-slate-900 dark:text-slate-100"
                            }`}
                          >
                            {line.demand}
                          </td>
                          <td
                            className={`px-3 py-4 text-right font-mono font-medium ${
                              isShortage ? "text-red-700 dark:text-red-400" : "text-emerald-600 dark:text-emerald-400"
                            }`}
                          >
                            {line.reserved} / {line.demand} Reserved
                          </td>
                          <td className={`px-3 py-4 ${isShortage ? "text-red-600 dark:text-red-400" : "text-slate-400 dark:text-slate-400"}`}>
                            {line.unit}
                          </td>
                          <td className="px-3 py-4 text-center">
                            {isShortage ? (
                              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-red-100 dark:bg-red-950/70 text-red-800 dark:text-red-300 border border-red-200 dark:border-red-800">
                                <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse"></span>
                                Out of Stock
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-emerald-50 dark:bg-emerald-950/70 text-emerald-700 dark:text-emerald-300 border border-emerald-200/60 dark:border-emerald-800/50">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                                In Stock Ready
                              </span>
                            )}
                          </td>
                          <td className="py-4 pl-3 pr-6 text-right space-x-2">
                            {isShortage && (
                              <button
                                onClick={() => setIsPoModalOpen(true)}
                                className="text-red-400 hover:text-red-700 dark:hover:text-red-300 p-1 transition"
                                title="Shortage PO Details"
                                type="button"
                              >
                                <Info className="w-4 h-4" />
                              </button>
                            )}
                            <button
                              onClick={() => {
                                setActiveEditLine(line);
                                setIsEditLineModalOpen(true);
                              }}
                              className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1 transition"
                              title="Edit line"
                              type="button"
                            >
                              <Edit3 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDeleteLine(line.id, line.name)}
                              className="text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 p-1 transition"
                              title="Delete row"
                              type="button"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Mobile Cards View (<= 768px) */}
              <div className="md:hidden divide-y divide-slate-100 dark:divide-slate-700 p-4 space-y-3">
                {lines.map((line) => {
                  const isShortage = !line.inStock;
                  return (
                    <div
                      key={line.id}
                      className={`p-3.5 rounded-xl border transition ${
                        isShortage
                          ? "bg-rose-50/60 dark:bg-rose-950/30 border-red-200 dark:border-red-900"
                          : "bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-xs font-semibold text-blue-600 dark:text-blue-400">
                            {line.badgeTag}
                          </span>
                          <span className="font-medium text-xs text-slate-900 dark:text-slate-100 line-clamp-1">
                            {line.name}
                          </span>
                        </div>
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => {
                              setActiveEditLine(line);
                              setIsEditLineModalOpen(true);
                            }}
                            className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                            title="Edit"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDeleteLine(line.id, line.name)}
                            className="p-1 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400"
                            title="Delete"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      <div className="mt-2 text-[11px] text-slate-500 dark:text-slate-400">
                        {isShortage ? (
                          <span className="text-red-600 dark:text-red-400 font-medium">{line.deficitNote}</span>
                        ) : (
                          <span>{line.zone} • SKU: {line.sku}</span>
                        )}
                      </div>

                      <div className="mt-3 pt-2.5 border-t border-slate-100 dark:border-slate-700 flex items-center justify-between text-xs">
                        <div>
                          <span className="text-slate-400">Demand: </span>
                          <span className="font-mono font-semibold">{line.demand} {line.unit}</span>
                        </div>
                        <div>
                          {isShortage ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-red-100 dark:bg-red-950 text-red-800 dark:text-red-300">
                              0/{line.demand} (Shortage)
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300">
                              <Check className="w-3 h-3" /> {line.reserved}/{line.demand} Reserved
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Clean '+ Add product line' Button */}
              <div className="p-4 bg-slate-50/50 dark:bg-slate-700/30 border-t border-slate-100 dark:border-slate-700 flex flex-wrap items-center justify-between gap-3">
                <button
                  onClick={() => setIsAddLineModalOpen(true)}
                  className="inline-flex items-center text-xs font-medium text-blue-600 dark:text-blue-400 hover:text-blue-700 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg px-3.5 py-2 transition shadow-xs hover:border-slate-300 active:scale-[0.98]"
                  id="add-line-btn"
                  type="button"
                >
                  <Plus className="w-3.5 h-3.5 mr-1.5" />
                  Add product line
                </button>
                <div className="flex items-center gap-2 text-[11px] text-slate-400 dark:text-slate-400 font-mono">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                  Barcode scanner listener active
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: Additional Info */}
          {activeTab === "info" && (
            <div className="p-6 space-y-5 text-xs text-slate-600 dark:text-slate-300">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-700/40 border border-slate-200/80 dark:border-slate-700 space-y-2">
                  <h4 className="font-semibold text-slate-900 dark:text-white uppercase tracking-wider text-[11px]">
                    Shipping &amp; Pallet Specs
                  </h4>
                  <p><span className="text-slate-400">Packaging Type:</span> Euro-Pallet Stacking (EPAL 1)</p>
                  <p><span className="text-slate-400">Total Pallets:</span> 2 Pallets (Shrink-wrapped)</p>
                  <p><span className="text-slate-400">Gross Weight:</span> {totalWeightKg} kg</p>
                  <p><span className="text-slate-400">Estimated Cargo Volume:</span> 1.82 m³</p>
                </div>

                <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-700/40 border border-slate-200/80 dark:border-slate-700 space-y-2">
                  <h4 className="font-semibold text-slate-900 dark:text-white uppercase tracking-wider text-[11px]">
                    Carrier &amp; Logistics Window
                  </h4>
                  <p><span className="text-slate-400">Assigned Fleet:</span> SwiftLog Express (TRK-99201)</p>
                  <p><span className="text-slate-400">Dock Loading Gate:</span> Gate 04 (Main Outbound)</p>
                  <p><span className="text-slate-400">Carrier Cutoff:</span> 17:00 CST</p>
                  <p><span className="text-slate-400">Dispatch Priority:</span> Priority Ground Transfer</p>
                </div>

                <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-700/40 border border-slate-200/80 dark:border-slate-700 space-y-2">
                  <h4 className="font-semibold text-slate-900 dark:text-white uppercase tracking-wider text-[11px]">
                    Customer Access Requirements
                  </h4>
                  <p><span className="text-slate-400">Delivery Contact:</span> Anita Vance (Receiving Desk)</p>
                  <p><span className="text-slate-400">Contact Direct:</span> +1 (312) 555-0194</p>
                  <p><span className="text-slate-400">Unloading Protocol:</span> Forklift ramp available</p>
                  <p><span className="text-slate-400">Signature Required:</span> Yes (Electronic Waybill)</p>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: Notes & Instructions */}
          {activeTab === "notes" && (
            <div className="p-6 space-y-4 text-xs text-slate-600 dark:text-slate-300">
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-700/40 border border-slate-200/80 dark:border-slate-700 space-y-3">
                <h4 className="font-semibold text-slate-900 dark:text-white uppercase tracking-wider text-[11px]">
                  Warehouse Picking &amp; Dock Safety Instructions
                </h4>
                <ul className="list-disc pl-5 space-y-1.5 text-slate-600 dark:text-slate-300">
                  <li>Fragile veneer surface on Solid Pine Desks. Ensure dual corner-guard protectors prior to strapping.</li>
                  <li>Scan individual serial bar codes on all chair cartons as they leave Bay 04 buffer.</li>
                  <li>Customer requires delivery confirmation email sent automatically upon carrier dock departure.</li>
                  <li>In the event of weather delay, hold pallet at Staging Buffer 4B under climate control.</li>
                </ul>
              </div>
            </div>
          )}
        </section>
        {/* END: Table */}

        {/* BEGIN: Minimalist 3-Column Stats Rail */}
        <section className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Weight & Volume Card */}
          <div className="bg-white dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700/80 rounded-xl p-4 shadow-sm transition-colors">
            <span className="text-[11px] font-semibold text-slate-400 dark:text-slate-400 uppercase tracking-wider">
              Weight &amp; Volume
            </span>
            <div className="mt-2 flex items-baseline justify-between">
              <div>
                <p className="text-xl font-bold font-mono text-slate-900 dark:text-white">
                  {totalWeightKg} <span className="text-xs font-normal text-slate-400">kg</span>
                </p>
                <p className="text-xs text-slate-400 mt-0.5 font-mono">1.82 m³ total cargo</p>
              </div>
              <span className="px-2 py-0.5 text-[10px] font-medium bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 rounded">
                Standard Freight
              </span>
            </div>
          </div>

          {/* Carrier Card */}
          <div className="bg-white dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700/80 rounded-xl p-4 shadow-sm transition-colors">
            <span className="text-[11px] font-semibold text-slate-400 dark:text-slate-400 uppercase tracking-wider">
              Carrier Assignment
            </span>
            <div className="mt-2 flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-slate-900 dark:text-white">SwiftLog Express</p>
                <p className="text-xs text-slate-400 mt-0.5 font-mono">TRK-99201-IL • Fleet #12</p>
              </div>
              <span className="w-2 h-2 rounded-full bg-emerald-500" title="Assigned and verified"></span>
            </div>
          </div>

          {/* Live Sync Status Card */}
          <div className="bg-white dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700/80 rounded-xl p-4 shadow-sm transition-colors">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold text-slate-400 dark:text-slate-400 uppercase tracking-wider">
                System State
              </span>
              <button
                onClick={handleSyncPing}
                disabled={isSyncingStats}
                className="text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 p-0.5 transition"
                title="Refresh system state"
              >
                <RefreshCw className={`w-3 h-3 ${isSyncingStats ? "animate-spin text-blue-600" : ""}`} />
              </button>
            </div>
            <div className="mt-2 space-y-1">
              <div className="flex justify-between text-xs">
                <span className="text-slate-400">Order Author:</span>
                <span className="font-medium text-slate-700 dark:text-slate-300">Alex Morgan</span>
              </div>
              <div className="flex justify-between text-xs items-center">
                <span className="text-slate-400">Live Sync:</span>
                <span className="font-mono text-emerald-600 dark:text-emerald-400 font-medium flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span> 14ms (Optimal)
                </span>
              </div>
            </div>
          </div>
        </section>
        {/* END: Stats Rail */}
      </main>

      {/* BEGIN: Minimal Footer */}
      <footer className="mt-auto bg-white dark:bg-slate-800 border-t border-slate-200/70 dark:border-slate-700 py-3.5 text-xs text-slate-400 dark:text-slate-400 transition-colors">
        <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400 text-center sm:text-left">
            <span className="font-medium text-slate-700 dark:text-slate-300">Nova Precision WMS</span>
            <span>•</span>
            <span>Nordic Core v4.12</span>
            <span>•</span>
            <span className="text-slate-400">Node US-EAST-04</span>
          </div>
          <div className="flex items-center gap-4 text-xs font-medium text-slate-500 dark:text-slate-400">
            <button
              onClick={() => setIsMapModalOpen(true)}
              className="hover:text-blue-600 dark:hover:text-blue-400 transition"
            >
              Warehouse Map
            </button>
            <button
              onClick={() => triggerToast("Discrepancy log synced: 0 active unhandled variances.", "info")}
              className="hover:text-blue-600 dark:hover:text-blue-400 transition"
            >
              Discrepancy Log
            </button>
            <button
              onClick={() => triggerToast("REST API v4 docs accessible at /api/docs/endpoints", "info")}
              className="hover:text-blue-600 dark:hover:text-blue-400 transition"
            >
              API Docs
            </button>
          </div>
        </div>
      </footer>

      {/* ========================================================================= */}
      {/* MODALS & OVERLAYS FOR RESPONSIVE INTERACTIONS                             */}
      {/* ========================================================================= */}

      {/* 1. NEW DELIVERY ORDER MODAL */}
      {isNewOrderModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 w-full max-w-lg overflow-hidden">
            <div className="flex items-center justify-between p-5 border-b border-slate-100 dark:border-slate-700">
              <div className="flex items-center gap-2">
                <Plus className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                <h3 className="text-base font-bold text-slate-900 dark:text-white">Create New Delivery Order</h3>
              </div>
              <button
                onClick={() => setIsNewOrderModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                setIsNewOrderModalOpen(false);
                triggerToast("Created new draft delivery order WH/OUT/0009.", "success");
                router.push("/operations/deliveries");
              }}
              className="p-5 space-y-4"
            >
              <div>
                <label className="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-1">
                  Destination Customer
                </label>
                <input
                  required
                  placeholder="e.g. Nordic Design Hub"
                  defaultValue="Apex Industrial Ltd."
                  className="w-full text-xs rounded-lg border-slate-200 dark:border-slate-600 dark:bg-slate-700 p-2.5"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-1">
                    Source Staging Bay
                  </label>
                  <select className="w-full text-xs rounded-lg border-slate-200 dark:border-slate-600 dark:bg-slate-700 p-2.5">
                    <option>Dock Bay 04 (Main)</option>
                    <option>Dock Bay 02 (Bulk)</option>
                    <option>Dock Bay 06 (Cold Storage)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-1">
                    Carrier Partner
                  </label>
                  <select className="w-full text-xs rounded-lg border-slate-200 dark:border-slate-600 dark:bg-slate-700 p-2.5">
                    <option>SwiftLog Express</option>
                    <option>FedEx Freight Direct</option>
                    <option>DHL Global Forwarding</option>
                  </select>
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-700">
                <button
                  type="button"
                  onClick={() => setIsNewOrderModalOpen(false)}
                  className="px-4 py-2 text-xs font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-xs"
                >
                  Create Order
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 2. ADD PRODUCT LINE MODAL */}
      {isAddLineModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 w-full max-w-md overflow-hidden">
            <div className="flex items-center justify-between p-5 border-b border-slate-100 dark:border-slate-700">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">Add Product Line Item</h3>
              <button
                onClick={() => setIsAddLineModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={handleAddProductLine} className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-1">
                  Select Inventory Product
                </label>
                <select
                  value={selectedCatalogSku}
                  onChange={(e) => setSelectedCatalogSku(e.target.value)}
                  className="w-full text-xs rounded-lg border-slate-200 dark:border-slate-600 dark:bg-slate-700 p-2.5"
                >
                  {CATALOG_ITEMS.map((item) => (
                    <option key={item.sku} value={item.sku}>
                      {item.badgeTag} {item.name} ({item.zone})
                    </option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-1">
                    Demand Quantity
                  </label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={newLineDemand}
                    onChange={(e) => setNewLineDemand(e.target.value)}
                    className="w-full text-xs rounded-lg border-slate-200 dark:border-slate-600 dark:bg-slate-700 p-2.5 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-1">
                    Unit of Measure
                  </label>
                  <input
                    disabled
                    value="Units"
                    className="w-full text-xs rounded-lg border-slate-200 dark:border-slate-600 dark:bg-slate-700 p-2.5 text-slate-400"
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-700">
                <button
                  type="button"
                  onClick={() => setIsAddLineModalOpen(false)}
                  className="px-4 py-2 text-xs font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-xs"
                >
                  Add to Order
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 3. EDIT LINE MODAL */}
      {isEditLineModalOpen && activeEditLine && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 w-full max-w-md overflow-hidden">
            <div className="flex items-center justify-between p-5 border-b border-slate-100 dark:border-slate-700">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">Edit Line Demand</h3>
              <button
                onClick={() => setIsEditLineModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={handleSaveEditedLine} className="p-5 space-y-4">
              <div>
                <p className="text-xs font-medium text-slate-400">Product</p>
                <p className="text-sm font-semibold text-slate-900 dark:text-white mt-0.5">
                  {activeEditLine.badgeTag} {activeEditLine.name}
                </p>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-1">
                  Demand Quantity ({activeEditLine.unit})
                </label>
                <input
                  type="number"
                  min="1"
                  required
                  value={activeEditLine.demand}
                  onChange={(e) => {
                    const val = parseInt(e.target.value, 10) || 1;
                    setActiveEditLine({
                      ...activeEditLine,
                      demand: val,
                      reserved: activeEditLine.inStock ? val : 0,
                    });
                  }}
                  className="w-full text-xs rounded-lg border-slate-200 dark:border-slate-600 dark:bg-slate-700 p-2.5 font-mono"
                />
              </div>
              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-700">
                <button
                  type="button"
                  onClick={() => setIsEditLineModalOpen(false)}
                  className="px-4 py-2 text-xs font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-xs"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 4. PO #881 REPLENISHMENT MODAL */}
      {isPoModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 w-full max-w-lg overflow-hidden">
            <div className="flex items-center justify-between p-5 border-b border-slate-100 dark:border-slate-700 bg-red-50/50 dark:bg-red-950/20">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-red-600 dark:text-red-400" />
                <h3 className="text-sm font-bold text-red-950 dark:text-red-200">Replenishment Manifest PO #881</h3>
              </div>
              <button
                onClick={() => setIsPoModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-5 space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-4 p-3 bg-slate-50 dark:bg-slate-700/40 rounded-xl border border-slate-200/80 dark:border-slate-700">
                <div>
                  <span className="text-slate-400 block text-[11px]">Supplier</span>
                  <span className="font-semibold text-slate-900 dark:text-white">Ergoflex Nordic AB</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[11px]">Expected ETA</span>
                  <span className="font-semibold text-emerald-600 dark:text-emerald-400 font-mono">Tomorrow 08:30 AM</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[11px]">Inbound Carrier</span>
                  <span className="font-medium text-slate-800 dark:text-slate-200">DHL Freight #FR-88192</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[11px]">Assigned Receiving Dock</span>
                  <span className="font-medium text-slate-800 dark:text-slate-200">Gate 01 (Inbound)</span>
                </div>
              </div>

              <div>
                <h4 className="font-semibold text-slate-900 dark:text-white mb-2">Inbound Line Items</h4>
                <div className="border border-slate-200 dark:border-slate-700 rounded-lg overflow-hidden">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-100 dark:bg-slate-700/60 text-slate-600 dark:text-slate-300">
                      <tr>
                        <th className="p-2.5">SKU / Item</th>
                        <th className="p-2.5 text-right">Inbound Qty</th>
                        <th className="p-2.5 text-right">Allocated</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                      <tr>
                        <td className="p-2.5 font-medium">[CHAIR04] Executive Mesh Ergonomic Chair</td>
                        <td className="p-2.5 text-right font-mono font-semibold text-emerald-600">20 Units</td>
                        <td className="p-2.5 text-right font-mono text-blue-600">4 Units (Auto-reserved for {formattedRef})</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-700">
                <button
                  type="button"
                  onClick={() => setIsPoModalOpen(false)}
                  className="px-4 py-2 text-xs font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg"
                >
                  Close
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setIsPoModalOpen(false);
                    handleToggleSimulation();
                  }}
                  className="px-4 py-2 text-xs font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-xs"
                >
                  Simulate Inbound Receipt
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 5. LARGE SCANNABLE BARCODE MODAL */}
      {isBarcodeModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 w-full max-w-md overflow-hidden text-center p-6 space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                Scannable Manifest Barcode
              </span>
              <button
                onClick={() => setIsBarcodeModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Stylized Barcode SVG Visual */}
            <div className="p-6 bg-white rounded-xl border border-slate-200 flex flex-col items-center justify-center">
              <div className="flex items-center gap-[3px] h-20 w-full justify-center">
                {[4, 2, 6, 2, 4, 1, 5, 2, 8, 3, 2, 5, 3, 7, 2, 4, 6, 2, 4, 3, 8, 2, 5, 3, 6, 2, 4].map(
                  (width, index) => (
                    <div
                      key={index}
                      className="bg-slate-900 h-full"
                      style={{ width: `${width * 1.5}px` }}
                    />
                  )
                )}
              </div>
              <p className="font-mono text-sm tracking-widest text-slate-900 font-bold mt-3">*WHO-0001*</p>
              <p className="text-[10px] text-slate-400 font-mono mt-0.5">Code-128 • Nova WMS Dispatch Token</p>
            </div>

            <div className="flex justify-center gap-3">
              <button
                onClick={() => {
                  window.print();
                  setIsBarcodeModalOpen(false);
                }}
                className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-medium text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 rounded-lg"
              >
                <Printer className="w-3.5 h-3.5" />
                Print Label
              </button>
              <button
                onClick={() => setIsBarcodeModalOpen(false)}
                className="px-4 py-2 text-xs font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-xs"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 6. PRINT PACKING SLIP PREVIEW MODAL */}
      {isPrintModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden">
            <div className="flex items-center justify-between p-4 border-b border-slate-100 dark:border-slate-700">
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-blue-600" />
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  Outbound Waybill &amp; Packing Slip Preview
                </h3>
              </div>
              <button
                onClick={() => setIsPrintModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Slip Body */}
            <div className="p-6 overflow-y-auto space-y-5 text-xs text-slate-800 dark:text-slate-200">
              <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-slate-700">
                <div>
                  <h2 className="text-lg font-bold font-mono text-slate-900 dark:text-white">NOVA PRECISION WMS</h2>
                  <p className="text-[11px] text-slate-400">Warehouse Central Bay 04 • Node US-EAST-04</p>
                </div>
                <div className="text-right">
                  <span className="font-mono font-bold text-sm text-slate-900 dark:text-white">{formattedRef}</span>
                  <p className="text-[11px] text-slate-400">Date: {scheduleDateTime.replace("T", " ")}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 p-3 bg-slate-50 dark:bg-slate-700/40 rounded-lg">
                <div>
                  <p className="font-semibold text-slate-900 dark:text-white mb-0.5">Ship To:</p>
                  <p className="text-slate-600 dark:text-slate-300">{deliveryAddress}</p>
                </div>
                <div>
                  <p className="font-semibold text-slate-900 dark:text-white mb-0.5">Logistics &amp; Carrier:</p>
                  <p className="text-slate-600 dark:text-slate-300">SwiftLog Express • Gate 04</p>
                  <p className="text-slate-400 mt-1">Responsible: {responsibleLead}</p>
                </div>
              </div>

              <div>
                <table className="w-full text-left border border-slate-200 dark:border-slate-700 rounded-lg overflow-hidden">
                  <thead className="bg-slate-100 dark:bg-slate-700/60 font-semibold text-slate-700 dark:text-slate-300">
                    <tr>
                      <th className="p-2.5">Line</th>
                      <th className="p-2.5">Item Description</th>
                      <th className="p-2.5 text-right">Demand</th>
                      <th className="p-2.5 text-right">Reserved</th>
                      <th className="p-2.5 text-center">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                    {lines.map((line, idx) => (
                      <tr key={line.id}>
                        <td className="p-2.5 font-mono">{idx + 1}</td>
                        <td className="p-2.5">
                          <span className="font-mono text-blue-600 dark:text-blue-400">{line.badgeTag}</span> {line.name}
                        </td>
                        <td className="p-2.5 text-right font-mono">{line.demand}</td>
                        <td className="p-2.5 text-right font-mono">{line.reserved}</td>
                        <td className="p-2.5 text-center">
                          {line.inStock ? "Ready" : "Deficit (Awaiting PO)"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="pt-4 border-t border-slate-100 dark:border-slate-700 flex items-center justify-between text-slate-400 text-[11px]">
                <span>Driver Signature: _________________________</span>
                <span>Receiver Verification: _________________________</span>
              </div>
            </div>

            <div className="p-4 bg-slate-50 dark:bg-slate-700/40 border-t border-slate-100 dark:border-slate-700 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setIsPrintModalOpen(false)}
                className="px-4 py-2 text-xs font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg"
              >
                Close
              </button>
              <button
                type="button"
                onClick={() => window.print()}
                className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-xs"
              >
                <Printer className="w-3.5 h-3.5" />
                Print Packing Slip
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 7. CANCEL ORDER CONFIRMATION MODAL */}
      {isCancelModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 w-full max-w-sm overflow-hidden p-5 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-rose-100 dark:bg-rose-900/40 text-rose-600 dark:text-rose-400 flex items-center justify-center shrink-0">
                <AlertCircle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">Cancel Delivery Order?</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Are you sure you want to cancel order {formattedRef}?
                </p>
              </div>
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-300 bg-slate-50 dark:bg-slate-700/40 p-3 rounded-lg border border-slate-200/80 dark:border-slate-700">
              Canceling will release all <strong>{totalReserved} reserved units</strong> back into free-to-use warehouse
              inventory stock.
            </p>
            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setIsCancelModalOpen(false)}
                className="px-3.5 py-1.5 text-xs font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg"
              >
                Never mind
              </button>
              <button
                type="button"
                onClick={() => {
                  setOrderStatus("Canceled");
                  setIsCancelModalOpen(false);
                  triggerToast(`Order ${formattedRef} canceled. Reserved stock released.`, "warning");
                }}
                className="px-3.5 py-1.5 text-xs font-medium text-white bg-rose-600 hover:bg-rose-700 rounded-lg shadow-xs"
              >
                Yes, Cancel Order
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 8. QUICK SEARCH MODAL (⌘K) */}
      {isSearchModalOpen && (
        <div className="fixed inset-0 z-50 flex items-start justify-center p-4 pt-20 bg-slate-900/50 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 w-full max-w-lg overflow-hidden">
            <div className="flex items-center px-4 border-b border-slate-200 dark:border-slate-700">
              <Search className="w-4 h-4 text-slate-400 mr-2" />
              <input
                ref={searchInputRef}
                autoFocus
                type="text"
                placeholder="Search products, orders, SKUs, or locations..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full py-3.5 text-xs bg-transparent border-0 focus:ring-0 text-slate-900 dark:text-white placeholder-slate-400"
              />
              <kbd className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-700 text-slate-400">
                ESC
              </kbd>
            </div>
            <div className="p-3 max-h-72 overflow-y-auto space-y-1 text-xs">
              <div className="px-2 py-1 text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                Matching Lines in this Order
              </div>
              {lines
                .filter(
                  (l) =>
                    !searchQuery ||
                    l.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                    l.sku.toLowerCase().includes(searchQuery.toLowerCase()) ||
                    l.badgeTag.toLowerCase().includes(searchQuery.toLowerCase())
                )
                .map((l) => (
                  <button
                    key={l.id}
                    onClick={() => {
                      setIsSearchModalOpen(false);
                      triggerToast(`Focused on line ${l.badgeTag}`, "info");
                    }}
                    className="w-full text-left px-3 py-2 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700/60 flex items-center justify-between group transition"
                  >
                    <div>
                      <span className="font-mono text-blue-600 dark:text-blue-400 font-medium">{l.badgeTag}</span>{" "}
                      <span className="font-medium text-slate-800 dark:text-slate-200">{l.name}</span>
                      <span className="block text-[11px] text-slate-400">{l.zone} • {l.sku}</span>
                    </div>
                    <span className="text-[11px] text-slate-400 font-mono">{l.demand} {l.unit}</span>
                  </button>
                ))}
              <div className="px-2 pt-3 pb-1 text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                Navigation Shortcuts
              </div>
              <Link
                href="/operations/deliveries"
                onClick={() => setIsSearchModalOpen(false)}
                className="block px-3 py-2 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700/60 text-slate-700 dark:text-slate-300"
              >
                Go to All Deliveries Manifest →
              </Link>
              <Link
                href="/products"
                onClick={() => setIsSearchModalOpen(false)}
                className="block px-3 py-2 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700/60 text-slate-700 dark:text-slate-300"
              >
                Go to Products Catalog →
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* 9. WAREHOUSE MAP MODAL */}
      {isMapModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 w-full max-w-xl overflow-hidden p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Warehouse className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  Warehouse Central Map — Bay 04 Staging
                </h3>
              </div>
              <button
                onClick={() => setIsMapModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Visual Floor Map Grid */}
            <div className="p-4 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 text-xs">
              <div className="grid grid-cols-4 gap-2 text-center font-mono">
                <div className="p-3 bg-blue-100 dark:bg-blue-950/70 border-2 border-blue-600 text-blue-900 dark:text-blue-200 rounded-lg">
                  <p className="font-bold text-xs">BAY 04</p>
                  <p className="text-[10px] text-blue-600 dark:text-blue-400">Current Order WH/OUT/0001</p>
                </div>
                <div className="p-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-600 dark:text-slate-400">
                  <p className="font-bold text-xs">BAY 03</p>
                  <p className="text-[10px]">Staged</p>
                </div>
                <div className="p-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-600 dark:text-slate-400">
                  <p className="font-bold text-xs">BAY 02</p>
                  <p className="text-[10px]">Active Loading</p>
                </div>
                <div className="p-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-600 dark:text-slate-400">
                  <p className="font-bold text-xs">BAY 01</p>
                  <p className="text-[10px]">Inbound PO #881</p>
                </div>
              </div>
              <p className="mt-3 text-slate-500 text-[11px] text-center">
                Forklift Lane 2 clear. Automated Guided Vehicle (AGV) path nominal.
              </p>
            </div>

            <div className="flex justify-end">
              <button
                type="button"
                onClick={() => setIsMapModalOpen(false)}
                className="px-4 py-2 text-xs font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-xs"
              >
                Close Map
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
