"use client";

import { useState } from "react";
import Link from "next/link";
import { useTheme } from "@/components/theme-provider";
import {
  Sun,
  Moon,
  Menu,
  X as CloseIcon,
  Save,
  Plus,
  QrCode,
  Warehouse,
  MapPin,
  Badge,
  Settings,
  ArrowDown,
  Info,
  CheckCircle2,
  Filter,
  MoreVertical,
  Layers,
  LayoutGrid,
  Truck,
  Package,
  History,
  Check,
} from "lucide-react";

interface LocationItem {
  id: string;
  name: string;
  description: string;
  subCode: string;
  category: string;
  occupancy: number;
  status: "Online" | "Maintenance" | "Offline";
  iconName: string;
}

const INITIAL_LOCATIONS: LocationItem[] = [
  {
    id: "loc-1",
    name: "Main Storage Bay (Ground Floor)",
    description: "General pallet racks & bulk cases",
    subCode: "Stock1",
    category: "Internal Storage",
    occupancy: 92,
    status: "Online",
    iconName: "shelves",
  },
  {
    id: "loc-2",
    name: "Inflow Staging & Cross-dock",
    description: "Direct carrier unloading lanes",
    subCode: "Stock2",
    category: "Dock Buffer",
    occupancy: 45,
    status: "Online",
    iconName: "move_to_inbox",
  },
  {
    id: "loc-3",
    name: "High-density Pallet Racks",
    description: "Aisle A01 to A14 motorized lifter zone",
    subCode: "Rack-A",
    category: "High Density Vertical",
    occupancy: 78,
    status: "Online",
    iconName: "grid_view",
  },
  {
    id: "loc-4",
    name: "Climate Controlled Chamber",
    description: "Constant temperature: 4°C - 8°C",
    subCode: "ColdRoom",
    category: "Cold Storage",
    occupancy: 34,
    status: "Online",
    iconName: "ac_unit",
  },
];

export default function WarehouseSettingsPage() {
  const theme = useTheme();

  // Form State
  const [warehouseName, setWarehouseName] = useState("Main Central Logistics Hub");
  const [shortCode, setShortCode] = useState("WH");
  const [facilityAddress, setFacilityAddress] = useState(
    "Industrial Area Phase 2, Bay 4 & 5, Logistics Corridor, Sector 62, 560066"
  );
  const [manager, setManager] = useState("Alex Morgan (Lead Operator)");
  const [operatingSchedule, setOperatingSchedule] = useState("24/7 Continuous Inflow");
  const [enforceLotScanning, setEnforceLotScanning] = useState(true);
  const [autoCrossDock, setAutoCrossDock] = useState(true);

  // Locations state
  const [locations, setLocations] = useState<LocationItem[]>(INITIAL_LOCATIONS);
  const [filterMode, setFilterMode] = useState<"all" | "high_occupancy">("all");

  // Modals & Feedback
  const [isSaving, setIsSaving] = useState(false);
  const [isAddLocationOpen, setIsAddLocationOpen] = useState(false);
  const [isAddWarehouseOpen, setIsAddWarehouseOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // New location form state
  const [newLocName, setNewLocName] = useState("");
  const [newLocSubCode, setNewLocSubCode] = useState("");
  const [newLocCategory, setNewLocCategory] = useState("Internal Storage");
  const [newLocOccupancy, setNewLocOccupancy] = useState(25);

  // Toast State
  const [toast, setToast] = useState<{
    visible: boolean;
    title: string;
    message: string;
  }>({
    visible: false,
    title: "",
    message: "",
  });

  const triggerToast = (title: string, message: string) => {
    setToast({ visible: true, title, message });
    setTimeout(() => {
      setToast((prev) => ({ ...prev, visible: false }));
    }, 3200);
  };

  // Handle Save
  const handleSave = () => {
    setIsSaving(true);
    setTimeout(() => {
      setIsSaving(false);
      triggerToast(
        "Warehouse Config Updated",
        `Prefix '${shortCode.toUpperCase()}' validated & synchronized across ${locations.length} child zones.`
      );
    }, 600);
  };

  // Handle Discard
  const handleDiscard = () => {
    setWarehouseName("Main Central Logistics Hub");
    setShortCode("WH");
    setFacilityAddress(
      "Industrial Area Phase 2, Bay 4 & 5, Logistics Corridor, Sector 62, 560066"
    );
    setManager("Alex Morgan (Lead Operator)");
    setOperatingSchedule("24/7 Continuous Inflow");
    setEnforceLotScanning(true);
    setAutoCrossDock(true);
    triggerToast("Form Reset", "Configuration reverted to saved state.");
  };

  // Handle Add Location
  const handleAddLocationSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newLocName || !newLocSubCode) {
      triggerToast("Missing Fields", "Please enter location name and code.");
      return;
    }

    const newLoc: LocationItem = {
      id: `loc-${Date.now()}`,
      name: newLocName,
      description: "User configured storage sector",
      subCode: newLocSubCode.replace(/[^a-zA-Z0-9_-]/g, ""),
      category: newLocCategory,
      occupancy: Number(newLocOccupancy) || 0,
      status: "Online",
      iconName: "shelves",
    };

    setLocations((prev) => [...prev, newLoc]);
    setIsAddLocationOpen(false);
    setNewLocName("");
    setNewLocSubCode("");
    triggerToast(
      "Location Created",
      `Added ${shortCode}/${newLoc.subCode} to warehouse topology.`
    );
  };

  const filteredLocations = locations.filter((loc) => {
    if (filterMode === "high_occupancy") {
      return loc.occupancy >= 70;
    }
    return true;
  });

  return (
    <div className="min-h-screen bg-[#f7f9fb] dark:bg-slate-950 text-slate-900 dark:text-slate-100 antialiased font-sans transition-colors duration-200 pb-20 md:pb-12">
      {/* ========================================================================= */}
      {/* 1. TOP HEADER / APP BAR                                                    */}
      {/* ========================================================================= */}
      <header className="sticky top-0 left-0 right-0 w-full z-40 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 transition-colors shadow-xs">
        <div className="w-full max-w-[1560px] mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
          {/* Brand Logo & Links */}
          <div className="flex items-center gap-6 xl:gap-8">
            <Link href="/" className="flex items-center gap-2.5">
              <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-blue-600 text-white shadow-xs">
                <span className="material-symbols-outlined text-[20px]">
                  precision_manufacturing
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-lg text-slate-900 dark:text-white tracking-tight">
                  Nova Precision
                </span>
                <span className="px-1.5 py-0.5 rounded text-xs font-mono font-medium bg-blue-50 text-blue-700 dark:bg-blue-950/70 dark:text-blue-300 tracking-wide border border-blue-200/50 dark:border-blue-800/40">
                  Warehouse Ops
                </span>
              </div>
            </Link>

            {/* Desktop Navigation Links */}
            <nav className="hidden xl:flex items-center gap-1.5">
              <Link
                href="/"
                className="px-3 py-1.5 text-sm text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white rounded-lg transition-colors"
              >
                Dashboard
              </Link>
              <div className="relative group">
                <button
                  type="button"
                  className="px-3 py-1.5 text-sm text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white rounded-lg transition-colors flex items-center gap-1"
                >
                  Operations
                  <span className="material-symbols-outlined text-[16px]">
                    expand_more
                  </span>
                </button>
              </div>
              <Link
                href="/"
                className="px-3 py-1.5 text-sm text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white rounded-lg transition-colors"
              >
                Stock
              </Link>
              <Link
                href="/"
                className="px-3 py-1.5 text-sm text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white rounded-lg transition-colors"
              >
                Move History
              </Link>
              <Link
                href="/settings"
                aria-current="page"
                className="px-3 py-1.5 text-sm font-semibold transition-colors bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300 rounded-lg flex items-center gap-1"
              >
                Settings
                <span className="material-symbols-outlined text-[16px]">
                  expand_more
                </span>
              </Link>
            </nav>
          </div>

          {/* Right Header Controls */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Search SKU Bar */}
            <div className="relative hidden md:flex items-center w-60 lg:w-72">
              <span className="material-symbols-outlined absolute left-2.5 text-[18px] text-slate-400 pointer-events-none">
                search
              </span>
              <input
                placeholder="Search SKU / Reference..."
                type="text"
                className="w-full h-9 pl-9 pr-12 rounded-lg bg-slate-100 dark:bg-slate-800 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:bg-white dark:focus:bg-slate-900 focus:ring-2 focus:ring-blue-500 border border-slate-200 dark:border-slate-700 transition-all"
              />
              <kbd className="absolute right-2 px-1.5 py-0.5 text-[11px] font-mono text-slate-400 bg-slate-200 dark:bg-slate-700 rounded shadow-xs">
                ⌘K
              </kbd>
            </div>

            {/* Notification Bell */}
            <button
              type="button"
              onClick={() => triggerToast("Notifications", "All 18 zones running nominal.")}
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
                <Sun className="w-5 h-5 text-amber-400" />
              ) : (
                <Moon className="w-5 h-5" />
              )}
            </button>

            {/* User Profile */}
            <div className="flex items-center gap-2 pl-1 border-l border-slate-200 dark:border-slate-800">
              <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white font-mono text-sm font-semibold shadow-xs">
                A
              </div>
              <div className="hidden sm:flex flex-col text-left">
                <span className="text-sm font-semibold text-slate-900 dark:text-white leading-none">
                  Alex M.
                </span>
                <span className="text-xs font-mono text-slate-500 dark:text-slate-400 leading-none mt-1">
                  Warehouse Lead
                </span>
              </div>
            </div>

            {/* Mobile Menu Hamburger */}
            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="xl:hidden p-2 rounded-lg text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              {mobileMenuOpen ? <CloseIcon className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile Dropdown Nav */}
        {mobileMenuOpen && (
          <div className="xl:hidden px-4 pt-2 pb-4 border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 animate-in slide-in-from-top-2 duration-150">
            <div className="flex flex-col gap-1">
              <Link href="/" className="px-3 py-2 text-sm text-slate-600 hover:bg-slate-100 rounded-lg">
                Dashboard
              </Link>
              <Link href="/" className="px-3 py-2 text-sm text-slate-600 hover:bg-slate-100 rounded-lg">
                Stock Inventory
              </Link>
              <Link
                href="/settings"
                className="px-3 py-2 text-sm font-semibold bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300 rounded-lg"
              >
                Warehouse Configuration (Settings)
              </Link>
              <Link href="/" className="px-3 py-2 text-sm text-slate-600 hover:bg-slate-100 rounded-lg">
                Move History
              </Link>
            </div>
          </div>
        )}
      </header>

      {/* ========================================================================= */}
      {/* 2. MAIN PAGE CONTENT                                                      */}
      {/* ========================================================================= */}
      <main className="w-full max-w-[1560px] mx-auto px-4 sm:px-6 lg:px-8 pt-5 sm:pt-8 space-y-6">
        {/* --------------------------------------------------------------------- */}
        {/* Top Context & Action Bar                                              */}
        {/* --------------------------------------------------------------------- */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex flex-col space-y-1">
            {/* Breadcrumb */}
            <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-xs font-mono text-slate-500 dark:text-slate-400">
              <Link href="/settings" className="hover:text-blue-600 transition-colors">
                Settings
              </Link>
              <span>/</span>
              <span className="hover:text-blue-600 transition-colors cursor-pointer">
                Warehouses
              </span>
              <span>/</span>
              <span className="text-slate-900 dark:text-white font-semibold">
                Nova Central Hub ({shortCode})
              </span>
            </nav>

            {/* Title & Status Badge */}
            <div className="flex flex-wrap items-center gap-2.5">
              <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
                Warehouse Configuration
              </h1>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded text-xs font-mono font-semibold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                Active / Operational
              </span>
            </div>

            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
              Manage warehouse facility specifications, routing prefixes, and linked operational storage zones.
            </p>
          </div>

          {/* Action Buttons (Fully Responsive) */}
          <div className="flex flex-wrap items-center gap-2 sm:gap-2.5 self-start md:self-auto">
            <button
              type="button"
              onClick={handleDiscard}
              className="h-10 px-4 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs sm:text-sm font-semibold transition-colors"
            >
              Discard
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={isSaving}
              className="h-10 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white text-xs sm:text-sm font-semibold shadow-sm transition-all flex items-center gap-1.5 disabled:opacity-75"
            >
              <Save className="w-4 h-4" />
              <span>{isSaving ? "Saving..." : "Save Changes"}</span>
            </button>
            <button
              type="button"
              onClick={() => setIsAddWarehouseOpen(true)}
              className="h-10 px-3.5 rounded-xl bg-blue-50 dark:bg-blue-950 text-blue-700 dark:text-blue-300 hover:bg-blue-100 dark:hover:bg-blue-900 text-xs sm:text-sm font-semibold transition-colors flex items-center gap-1 border border-blue-200/50 dark:border-blue-800/40"
            >
              <Plus className="w-4 h-4" />
              <span className="hidden sm:inline">Add Warehouse</span>
            </button>
          </div>
        </div>

        {/* --------------------------------------------------------------------- */}
        {/* Quick Vital Metrics Strip (4 Cards)                                   */}
        {/* --------------------------------------------------------------------- */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 sm:gap-4">
          {/* Global Short Code */}
          <div className="bg-white dark:bg-slate-900 rounded-xl p-4 sm:p-5 shadow-xs border border-slate-200 dark:border-slate-800 flex flex-col justify-between">
            <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
              <span className="text-xs sm:text-sm font-medium">Global Short Code</span>
              <QrCode className="w-5 h-5 text-blue-600" />
            </div>
            <div className="mt-2 font-mono text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
              {shortCode.toUpperCase()}
            </div>
            <div className="mt-2 flex items-center gap-1.5 text-xs font-mono text-slate-500 dark:text-slate-400">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-600"></span>
              <span>Primary document prefix</span>
            </div>
          </div>

          {/* Storage Utilization */}
          <div className="bg-white dark:bg-slate-900 rounded-xl p-4 sm:p-5 shadow-xs border border-slate-200 dark:border-slate-800 flex flex-col justify-between">
            <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
              <span className="text-xs sm:text-sm font-medium">Storage Utilization</span>
              <Warehouse className="w-5 h-5 text-amber-600" />
            </div>
            <div className="mt-2 font-mono text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
              84.2%
            </div>
            <div className="mt-2 space-y-1.5">
              <div className="w-full h-1.5 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                <div className="h-full bg-blue-600 rounded-full" style={{ width: "84.2%" }}></div>
              </div>
              <span className="text-[11px] font-mono text-slate-500 dark:text-slate-400">
                2,520 / 3,000 Pallets
              </span>
            </div>
          </div>

          {/* Configured Locations */}
          <div className="bg-white dark:bg-slate-900 rounded-xl p-4 sm:p-5 shadow-xs border border-slate-200 dark:border-slate-800 flex flex-col justify-between">
            <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
              <span className="text-xs sm:text-sm font-medium">Configured Locations</span>
              <MapPin className="w-5 h-5 text-emerald-600" />
            </div>
            <div className="mt-2 font-mono text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
              {locations.length} Zones
            </div>
            <div className="mt-2 inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-mono font-medium bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 w-fit">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>100% Synced</span>
            </div>
          </div>

          {/* Assigned Lead */}
          <div className="bg-white dark:bg-slate-900 rounded-xl p-4 sm:p-5 shadow-xs border border-slate-200 dark:border-slate-800 flex flex-col justify-between">
            <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
              <span className="text-xs sm:text-sm font-medium">Assigned Lead</span>
              <Badge className="w-5 h-5 text-slate-500" />
            </div>
            <div className="mt-2 font-semibold text-lg sm:text-xl text-slate-900 dark:text-white truncate">
              {manager.split(" ")[0]} {manager.split(" ")[1]}
            </div>
            <div className="mt-2 text-xs font-mono text-slate-500 dark:text-slate-400 truncate">
              Shift Lead • Zone Master Access
            </div>
          </div>
        </div>

        {/* --------------------------------------------------------------------- */}
        {/* Main Content Layout: Form & Architectural Hierarchy Diagram           */}
        {/* --------------------------------------------------------------------- */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 sm:gap-6 items-start">
          {/* Primary Warehouse Form (Left Col - 7 cols) */}
          <div className="lg:col-span-7 bg-white dark:bg-slate-900 rounded-xl p-5 sm:p-6 shadow-xs border border-slate-200 dark:border-slate-800 space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <span className="p-1.5 rounded-lg bg-blue-50 dark:bg-blue-950 text-blue-600">
                  <span className="material-symbols-outlined text-[20px]">
                    settings_suggest
                  </span>
                </span>
                <h2 className="font-bold text-lg text-slate-900 dark:text-white">
                  Facility Attributes
                </h2>
              </div>
              <span className="text-xs font-mono text-slate-500 dark:text-slate-400">
                Node Ref: WH-ALPHA-01
              </span>
            </div>

            <form className="space-y-4" onSubmit={(e) => e.preventDefault()}>
              {/* Warehouse Name */}
              <div className="space-y-1">
                <label className="block text-xs sm:text-sm font-semibold text-slate-800 dark:text-slate-200" htmlFor="wh-name">
                  Warehouse Name <span className="text-red-500">*</span>
                </label>
                <input
                  id="wh-name"
                  type="text"
                  value={warehouseName}
                  onChange={(e) => setWarehouseName(e.target.value)}
                  placeholder="Enter warehouse name"
                  className="w-full h-10 px-3.5 rounded-lg bg-white dark:bg-slate-800 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 border border-slate-200 dark:border-slate-700 shadow-xs"
                />
                <p className="text-xs text-slate-500 font-mono mt-0.5">
                  Publicly visible title for reports, purchase receipts, and delivery slips.
                </p>
              </div>

              {/* Short Code Field with Highlight Annotation */}
              <div className="p-4 rounded-xl bg-blue-50/70 dark:bg-blue-950/40 border border-blue-200/80 dark:border-blue-800/60 space-y-2">
                <div className="flex items-center justify-between">
                  <label className="block text-xs sm:text-sm font-bold text-blue-900 dark:text-blue-200" htmlFor="wh-code">
                    Short Code (Prefix Identifier) <span className="text-red-500">*</span>
                  </label>
                  <span className="inline-flex items-center gap-1 text-xs font-mono text-blue-700 dark:text-blue-300 font-medium">
                    <span className="material-symbols-outlined text-[16px]">link</span>
                    Propagates to Child Locations
                  </span>
                </div>
                <div className="relative max-w-xs">
                  <input
                    id="wh-code"
                    type="text"
                    maxLength={5}
                    value={shortCode}
                    onChange={(e) => setShortCode(e.target.value.toUpperCase())}
                    className="w-full h-10 px-3.5 rounded-lg bg-white dark:bg-slate-800 uppercase font-mono text-base font-bold text-slate-900 dark:text-white tracking-wider focus:outline-none focus:ring-2 focus:ring-blue-500 border border-blue-200 dark:border-blue-800 shadow-xs"
                  />
                </div>
                <p className="text-xs text-blue-800 dark:text-blue-300 font-mono">
                  Unique 2–5 letter code used system-wide in stock moves, pick-lists, and hierarchical barcode strings (e.g.{" "}
                  <strong className="text-blue-950 dark:text-blue-100 font-bold">{shortCode}/STOCK1/BIN-04</strong>).
                </p>
              </div>

              {/* Physical Facility Address */}
              <div className="space-y-1">
                <label className="block text-xs sm:text-sm font-semibold text-slate-800 dark:text-slate-200" htmlFor="wh-address">
                  Physical Facility Address <span className="text-red-500">*</span>
                </label>
                <textarea
                  id="wh-address"
                  rows={3}
                  value={facilityAddress}
                  onChange={(e) => setFacilityAddress(e.target.value)}
                  className="w-full p-3 rounded-lg bg-white dark:bg-slate-800 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 border border-slate-200 dark:border-slate-700 shadow-xs resize-none"
                />
                <p className="text-xs text-slate-500 font-mono">
                  Used for carrier dispatch documentation and automated tax zone jurisdiction.
                </p>
              </div>

              {/* Structured Secondary Meta Fields */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
                <div className="space-y-1">
                  <label className="block text-xs sm:text-sm font-semibold text-slate-800 dark:text-slate-200">
                    Facility Operations Manager
                  </label>
                  <select
                    value={manager}
                    onChange={(e) => setManager(e.target.value)}
                    className="w-full h-10 px-3 rounded-lg bg-white dark:bg-slate-800 text-xs sm:text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 border border-slate-200 dark:border-slate-700 shadow-xs"
                  >
                    <option>Alex Morgan (Lead Operator)</option>
                    <option>Sara Jenkins (Shift Supervisor)</option>
                    <option>David Chen (Inventory Controller)</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="block text-xs sm:text-sm font-semibold text-slate-800 dark:text-slate-200">
                    Operating Schedule
                  </label>
                  <select
                    value={operatingSchedule}
                    onChange={(e) => setOperatingSchedule(e.target.value)}
                    className="w-full h-10 px-3 rounded-lg bg-white dark:bg-slate-800 text-xs sm:text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 border border-slate-200 dark:border-slate-700 shadow-xs"
                  >
                    <option>24/7 Continuous Inflow</option>
                    <option>Double Shift (06:00 - 22:00)</option>
                    <option>Single Shift (08:00 - 17:00)</option>
                  </select>
                </div>
              </div>

              {/* Operational Switches */}
              <div className="pt-2 space-y-2.5">
                <label className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/70 dark:border-slate-800 hover:bg-slate-100 transition-colors cursor-pointer">
                  <div className="flex flex-col pr-3">
                    <span className="text-xs sm:text-sm font-semibold text-slate-800 dark:text-slate-200">
                      Enforce Lot / Serial Scanning at Intake
                    </span>
                    <span className="text-[11px] font-mono text-slate-500">
                      Scanners will block receipt validation if batches are unassigned
                    </span>
                  </div>
                  <input
                    type="checkbox"
                    checked={enforceLotScanning}
                    onChange={(e) => setEnforceLotScanning(e.target.checked)}
                    className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 cursor-pointer"
                  />
                </label>

                <label className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/70 dark:border-slate-800 hover:bg-slate-100 transition-colors cursor-pointer">
                  <div className="flex flex-col pr-3">
                    <span className="text-xs sm:text-sm font-semibold text-slate-800 dark:text-slate-200">
                      Automated Cross-Dock Routing
                    </span>
                    <span className="text-[11px] font-mono text-slate-500">
                      Bypass putaway directly to outbound staging for backorders
                    </span>
                  </div>
                  <input
                    type="checkbox"
                    checked={autoCrossDock}
                    onChange={(e) => setAutoCrossDock(e.target.checked)}
                    className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 cursor-pointer"
                  />
                </label>
              </div>
            </form>
          </div>

          {/* Right Column: Visual Hierarchy & Location Mapping (5 cols) */}
          <div className="lg:col-span-5 space-y-5">
            {/* Architecture Linking Card: Warehouse Code to Locations */}
            <div className="bg-white dark:bg-slate-900 rounded-xl p-5 sm:p-6 shadow-xs border border-slate-200 dark:border-slate-800 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-[20px] text-blue-600">
                    account_tree
                  </span>
                  <h3 className="font-bold text-base sm:text-lg text-slate-900 dark:text-white">
                    Hierarchy Topology
                  </h3>
                </div>
                <span className="text-xs font-mono px-2 py-0.5 rounded bg-blue-100 dark:bg-blue-950 text-blue-800 dark:text-blue-300 font-semibold">
                  Relational Scheme
                </span>
              </div>
              <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
                The configured short code{" "}
                <span className="font-mono font-bold text-blue-600 dark:text-blue-400">
                  {shortCode}
                </span>{" "}
                serves as the root parent key for all internal zones, bays, and racks.
              </p>

              {/* Dotted Linking Diagram */}
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-4 relative overflow-hidden">
                {/* Root Bubble */}
                <div className="flex items-center justify-between p-3 rounded-lg bg-white dark:bg-slate-900 shadow-xs border border-slate-200 dark:border-slate-700">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-blue-600 text-white flex items-center justify-center font-mono font-bold text-xs">
                      {shortCode}
                    </div>
                    <div className="flex flex-col">
                      <span className="text-sm font-bold text-slate-900 dark:text-white">
                        {warehouseName || "Nova Central Hub"}
                      </span>
                      <span className="text-[11px] font-mono text-slate-500">
                        Root Warehouse Node
                      </span>
                    </div>
                  </div>
                  <span className="material-symbols-outlined text-blue-600 text-[20px]">
                    hub
                  </span>
                </div>

                {/* Flow Vector */}
                <div className="flex justify-center -my-2 relative z-10">
                  <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 dark:bg-blue-950/80 text-blue-700 dark:text-blue-300 text-xs font-mono font-semibold shadow-xs border border-blue-200 dark:border-blue-800">
                    <span className="material-symbols-outlined text-[16px] animate-bounce">
                      arrow_downward
                    </span>
                    <span>Inherits prefix for storage keys</span>
                  </div>
                </div>

                {/* Target Location Entity Display */}
                <div className="p-3 rounded-lg bg-white dark:bg-slate-900 shadow-xs border border-slate-200 dark:border-slate-700 space-y-2">
                  <div className="flex items-center justify-between text-xs font-mono text-slate-500">
                    <span>Location Schema Preview</span>
                    <span className="text-blue-600 font-semibold">Auto-derived</span>
                  </div>
                  <div className="space-y-1.5 font-mono text-xs">
                    <div className="flex items-center justify-between p-2 rounded bg-slate-50 dark:bg-slate-800">
                      <span className="text-slate-900 dark:text-white font-bold">
                        {shortCode} / Stock1
                      </span>
                      <span className="text-slate-500">Main Ground Bay</span>
                    </div>
                    <div className="flex items-center justify-between p-2 rounded bg-slate-50 dark:bg-slate-800">
                      <span className="text-slate-900 dark:text-white font-bold">
                        {shortCode} / Stock2
                      </span>
                      <span className="text-slate-500">Cross-dock Inflow</span>
                    </div>
                    <div className="flex items-center justify-between p-2 rounded bg-slate-50 dark:bg-slate-800">
                      <span className="text-slate-900 dark:text-white font-bold">
                        {shortCode} / ColdRoom
                      </span>
                      <span className="text-slate-500">Climate Storage</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Facility Geo / Map Spec Card */}
            <div className="bg-white dark:bg-slate-900 rounded-xl p-4 sm:p-5 shadow-xs border border-slate-200 dark:border-slate-800 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs sm:text-sm font-semibold text-slate-900 dark:text-white flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-[18px] text-amber-600">
                    map
                  </span>
                  Facility Satellite Pin
                </span>
                <span className="text-xs font-mono text-slate-500">Sector 62 Node</span>
              </div>
              <div
                className="w-full h-44 rounded-xl bg-cover bg-center shadow-inner relative flex items-end p-3 overflow-hidden border border-slate-200 dark:border-slate-700"
                style={{
                  backgroundImage:
                    "url('https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?auto=format&fit=crop&w=800&q=80')",
                }}
              >
                <div className="w-full p-2.5 rounded-lg bg-white/90 dark:bg-slate-900/90 backdrop-blur-md flex items-center justify-between shadow-xs">
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-blue-600 text-[18px]">
                      share_location
                    </span>
                    <span className="font-mono text-xs text-slate-900 dark:text-white font-medium">
                      12.9716° N, 77.5946° E
                    </span>
                  </div>
                  <span className="px-2 py-0.5 rounded text-[11px] font-mono bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300 font-semibold">
                    Gate 4-B Active
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* --------------------------------------------------------------------- */}
        {/* Connected Locations & Zones Panel (Bottom Panel)                      */}
        {/* --------------------------------------------------------------------- */}
        <div className="w-full bg-white dark:bg-slate-900 rounded-xl p-5 sm:p-6 shadow-xs border border-slate-200 dark:border-slate-800 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-200 dark:border-slate-800">
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-bold text-lg text-slate-900 dark:text-white">
                  Configured Locations &amp; Zones for {shortCode}
                </h2>
                <span className="px-2 py-0.5 rounded bg-blue-50 dark:bg-blue-950 text-blue-700 dark:text-blue-300 font-mono text-xs font-semibold">
                  {locations.length} Primary Sectors
                </span>
              </div>
              <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
                Internal physical and virtual locations routing through the{" "}
                <span className="font-mono font-bold text-slate-900 dark:text-white">
                  {shortCode}
                </span>{" "}
                root identifier.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  const next = filterMode === "all" ? "high_occupancy" : "all";
                  setFilterMode(next);
                  triggerToast(
                    "Filter Changed",
                    next === "high_occupancy" ? "Showing occupancy ≥ 70%" : "Showing all zones"
                  );
                }}
                className={`h-9 px-3 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-colors border ${
                  filterMode !== "all"
                    ? "bg-blue-50 text-blue-700 border-blue-300 dark:bg-blue-950 dark:text-blue-300"
                    : "bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 border-slate-200 dark:border-slate-700"
                }`}
              >
                <Filter className="w-4 h-4" />
                <span>{filterMode === "all" ? "Filter" : "Occupancy ≥ 70%"}</span>
              </button>

              <button
                type="button"
                onClick={() => setIsAddLocationOpen(true)}
                className="h-9 px-3.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold flex items-center gap-1 shadow-xs transition-colors"
              >
                <span className="material-symbols-outlined text-[18px]">
                  add_location_alt
                </span>
                <span>+ Add Location to {shortCode}</span>
              </button>
            </div>
          </div>

          {/* Desktop Table */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 font-mono text-xs uppercase tracking-wider h-11 border-b border-slate-200 dark:border-slate-700">
                  <th className="py-2.5 px-4 font-semibold">Location Name</th>
                  <th className="py-2.5 px-4 font-semibold">Short Code</th>
                  <th className="py-2.5 px-4 font-semibold">Parent Warehouse</th>
                  <th className="py-2.5 px-4 font-semibold">Category Type</th>
                  <th className="py-2.5 px-4 font-semibold">Current Occupancy</th>
                  <th className="py-2.5 px-4 font-semibold">Status</th>
                  <th className="py-2.5 px-4 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-800 text-sm">
                {filteredLocations.map((loc) => (
                  <tr key={loc.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors">
                    <td className="py-3.5 px-4 font-medium text-slate-900 dark:text-white">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-950 text-blue-600 flex items-center justify-center shrink-0">
                          <span className="material-symbols-outlined text-[18px]">
                            {loc.iconName}
                          </span>
                        </div>
                        <div>
                          <div className="font-bold text-slate-900 dark:text-white">
                            {loc.name}
                          </div>
                          <div className="text-xs font-mono text-slate-500">
                            {loc.description}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white border border-slate-200 dark:border-slate-700">
                        {shortCode}/{loc.subCode}
                      </span>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="inline-flex items-center gap-1 text-blue-600 font-mono text-xs font-semibold">
                        <Warehouse className="w-4 h-4" />
                        {shortCode}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-xs font-mono text-slate-500">
                      {loc.category}
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-semibold text-xs text-slate-900 dark:text-white w-8">
                          {loc.occupancy}%
                        </span>
                        <div className="w-16 h-1.5 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                          <div
                            className={`h-full rounded-full ${
                              loc.occupancy >= 80 ? "bg-red-500" : "bg-blue-600"
                            }`}
                            style={{ width: `${loc.occupancy}%` }}
                          ></div>
                        </div>
                      </div>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-mono font-semibold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                        {loc.status}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <button
                        type="button"
                        onClick={() => triggerToast("Location Options", `Managing ${shortCode}/${loc.subCode}`)}
                        className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600"
                      >
                        <MoreVertical className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile Card List (< 768px) */}
          <div className="block md:hidden divide-y divide-slate-200 dark:divide-slate-800">
            {filteredLocations.map((loc) => (
              <div key={loc.id} className="py-3.5 space-y-2">
                <div className="flex items-start justify-between">
                  <div>
                    <span className="font-bold text-sm text-slate-900 dark:text-white block">
                      {loc.name}
                    </span>
                    <span className="font-mono text-xs text-slate-500 block">
                      {loc.description}
                    </span>
                  </div>
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-mono font-semibold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                    {loc.status}
                  </span>
                </div>

                <div className="flex items-center justify-between text-xs font-mono pt-1">
                  <span className="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white font-bold border border-slate-200 dark:border-slate-700">
                    {shortCode}/{loc.subCode}
                  </span>
                  <span className="text-slate-500">{loc.category}</span>
                </div>

                <div className="flex items-center gap-2 pt-1">
                  <span className="font-mono text-xs font-bold text-slate-900 dark:text-white">
                    Occupancy: {loc.occupancy}%
                  </span>
                  <div className="flex-1 h-1.5 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                    <div
                      className={`h-full rounded-full ${
                        loc.occupancy >= 80 ? "bg-red-500" : "bg-blue-600"
                      }`}
                      style={{ width: `${loc.occupancy}%` }}
                    ></div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Helper Note Banner */}
          <div className="flex items-center gap-2 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 text-xs font-mono text-slate-600 dark:text-slate-400 border border-slate-200/70 dark:border-slate-700">
            <Info className="w-4 h-4 text-blue-600 shrink-0" />
            <span>
              Wireframe Hierarchy Protocol: Changes to warehouse prefix{" "}
              <strong className="text-slate-900 dark:text-white font-bold">{shortCode}</strong>{" "}
              will cascade updates to child room codes and document reference rules.
            </span>
          </div>
        </div>
      </main>

      {/* ========================================================================= */}
      {/* 3. ADD LOCATION MODAL                                                     */}
      {/* ========================================================================= */}
      {isAddLocationOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 animate-in fade-in duration-150">
          <div className="bg-white dark:bg-slate-900 w-full max-w-md rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden animate-in zoom-in-95 duration-150">
            <div className="px-5 py-4 bg-slate-50 dark:bg-slate-800/60 flex items-center justify-between border-b border-slate-200 dark:border-slate-800">
              <div className="flex items-center gap-2 font-bold text-base text-slate-900 dark:text-white">
                <span className="material-symbols-outlined text-blue-600 text-[20px]">
                  add_location_alt
                </span>
                <span>Add Storage Zone to {shortCode}</span>
              </div>
              <button
                type="button"
                onClick={() => setIsAddLocationOpen(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <CloseIcon className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddLocationSubmit} className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Location Zone Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={newLocName}
                  onChange={(e) => setNewLocName(e.target.value)}
                  placeholder="e.g. Rack Sector C Mezzanine"
                  className="w-full h-10 px-3 bg-slate-50 dark:bg-slate-800 rounded-lg text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 border border-slate-200 dark:border-slate-700"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Sub-Code Identifier (Suffix) <span className="text-red-500">*</span>
                </label>
                <div className="flex items-center">
                  <span className="h-10 px-3 flex items-center justify-center font-mono font-bold text-xs bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-r-0 border-slate-200 dark:border-slate-700 rounded-l-lg">
                    {shortCode}/
                  </span>
                  <input
                    type="text"
                    required
                    value={newLocSubCode}
                    onChange={(e) => setNewLocSubCode(e.target.value)}
                    placeholder="Rack-C"
                    className="flex-1 h-10 px-3 bg-slate-50 dark:bg-slate-800 rounded-r-lg font-mono text-sm font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 border border-slate-200 dark:border-slate-700"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Category Type
                  </label>
                  <select
                    value={newLocCategory}
                    onChange={(e) => setNewLocCategory(e.target.value)}
                    className="w-full h-10 px-3 bg-slate-50 dark:bg-slate-800 rounded-lg text-xs font-medium text-slate-900 dark:text-white border border-slate-200 dark:border-slate-700"
                  >
                    <option>Internal Storage</option>
                    <option>Dock Buffer</option>
                    <option>High Density Vertical</option>
                    <option>Cold Storage</option>
                    <option>Quarantine Inspection</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Initial Occupancy (%)
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={newLocOccupancy}
                    onChange={(e) => setNewLocOccupancy(Number(e.target.value))}
                    className="w-full h-10 px-3 bg-slate-50 dark:bg-slate-800 rounded-lg text-sm font-mono text-slate-900 dark:text-white border border-slate-200 dark:border-slate-700"
                  />
                </div>
              </div>

              <div className="p-3 bg-blue-50 dark:bg-blue-950/60 rounded-xl text-xs font-mono text-blue-900 dark:text-blue-200">
                Derived key: <strong className="font-bold">{shortCode}/{newLocSubCode || "..."}</strong>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsAddLocationOpen(false)}
                  className="px-4 py-2 text-xs font-medium text-slate-600 hover:text-slate-900"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold shadow-xs"
                >
                  Create Location
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 4. ADD WAREHOUSE MODAL                                                     */}
      {/* ========================================================================= */}
      {isAddWarehouseOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 animate-in fade-in duration-150">
          <div className="bg-white dark:bg-slate-900 w-full max-w-md rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden animate-in zoom-in-95 duration-150 p-5 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-200 dark:border-slate-800">
              <div className="flex items-center gap-2 font-bold text-base text-slate-900 dark:text-white">
                <Warehouse className="w-5 h-5 text-blue-600" />
                <span>Create New Warehouse Node</span>
              </div>
              <button
                type="button"
                onClick={() => setIsAddWarehouseOpen(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <CloseIcon className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Warehouse Facility Name
                </label>
                <input
                  type="text"
                  placeholder="e.g. West Coast Fulfillment Center"
                  className="w-full h-10 px-3 bg-slate-50 dark:bg-slate-800 rounded-lg text-sm text-slate-900 dark:text-white border border-slate-200 dark:border-slate-700"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Global Prefix (2-5 letters)
                </label>
                <input
                  type="text"
                  maxLength={5}
                  placeholder="e.g. WC"
                  className="w-full h-10 px-3 bg-slate-50 dark:bg-slate-800 rounded-lg font-mono text-sm uppercase text-slate-900 dark:text-white border border-slate-200 dark:border-slate-700"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-200 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setIsAddWarehouseOpen(false)}
                className="px-4 py-2 text-xs font-medium text-slate-600"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  setIsAddWarehouseOpen(false);
                  triggerToast("Warehouse Registered", "New facility node provisioned.");
                }}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold"
              >
                Save Warehouse
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 5. FLOATING NOTIFICATION TOAST                                            */}
      {/* ========================================================================= */}
      <div
        className={`fixed bottom-16 sm:bottom-6 right-4 sm:right-6 z-50 bg-slate-900 text-white px-4 py-3 rounded-xl shadow-2xl flex items-center gap-3 transform transition-all duration-300 border border-slate-700 ${
          toast.visible
            ? "translate-y-0 opacity-100 scale-100"
            : "translate-y-8 opacity-0 scale-95 pointer-events-none"
        }`}
      >
        <span className="material-symbols-outlined text-emerald-400 text-[22px]">
          check_circle
        </span>
        <div className="flex flex-col">
          <span className="text-xs sm:text-sm font-semibold">{toast.title}</span>
          <span className="text-[11px] font-mono text-slate-300">{toast.message}</span>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 6. MOBILE FIXED BOTTOM NAVIGATION BAR                                     */}
      {/* ========================================================================= */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-t border-slate-200 dark:border-slate-800 py-1.5 px-4 flex items-center justify-around shadow-lg">
        <Link
          href="/"
          className="flex flex-col items-center gap-0.5 text-[10px] font-medium text-slate-500 hover:text-slate-900 transition-colors"
        >
          <LayoutGrid className="w-5 h-5" />
          <span>Dashboard</span>
        </Link>

        <Link
          href="/"
          className="flex flex-col items-center gap-0.5 text-[10px] font-medium text-slate-500 hover:text-slate-900 transition-colors"
        >
          <Truck className="w-5 h-5" />
          <span>Operations</span>
        </Link>

        <Link
          href="/"
          className="flex flex-col items-center gap-0.5 text-[10px] font-medium text-slate-500 hover:text-slate-900 transition-colors"
        >
          <Package className="w-5 h-5" />
          <span>Stock</span>
        </Link>

        <Link
          href="/"
          className="flex flex-col items-center gap-0.5 text-[10px] font-medium text-slate-500 hover:text-slate-900 transition-colors"
        >
          <History className="w-5 h-5" />
          <span>History</span>
        </Link>

        <Link
          href="/settings"
          className="flex flex-col items-center gap-0.5 text-[10px] font-semibold text-blue-600 transition-colors"
        >
          <Settings className="w-5 h-5" />
          <span>Settings</span>
        </Link>
      </nav>

      {/* ========================================================================= */}
      {/* 7. DESKTOP SYSTEM FOOTER                                                  */}
      {/* ========================================================================= */}
      <footer className="hidden md:block fixed bottom-0 left-0 right-0 w-full bg-white/90 dark:bg-slate-900/90 backdrop-blur-xs border-t border-slate-200 dark:border-slate-800 py-2 z-30 transition-colors">
        <div className="w-full max-w-[1560px] mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between text-xs font-mono text-slate-500">
          <div>
            Nova Precision ERP Suite • Node ID:{" "}
            <span className="text-slate-900 dark:text-white font-semibold">WH-ALPHA-01</span>
          </div>
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              RF Scanners Online
            </span>
            <span>
              Sync Latency: <span className="text-slate-900 dark:text-white font-semibold">14ms</span>
            </span>
            <span>
              Active Zone:{" "}
              <span className="text-slate-900 dark:text-white font-semibold">
                Rack Sector B
              </span>
            </span>
          </div>
        </div>
      </footer>
    </div>
  );
}
