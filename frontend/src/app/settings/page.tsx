"use client";

import { useState } from "react";
import Link from "next/link";
import { useTheme } from "@/components/theme-provider";
import {
  Sun,
  Moon,
  Menu,
  X as CloseIcon,
  Check,
  Plus,
  QrCode,
  Warehouse,
  MapPin,
  Pencil,
  Lock,
  Clock,
  CheckCircle2,
  Shield,
  Layers,
  LayoutGrid,
  Truck,
  Package,
  History,
  Settings,
  ChevronRight,
  GitBranch,
  User,
  SlidersHorizontal,
} from "lucide-react";

interface SectorItem {
  id: string;
  code: string;
  name: string;
  category: string;
  occupancy: number;
  occupancyStatus: "Critical" | "Nominal" | "Normal" | "Safe";
  barColor: string;
  status: "Online" | "Maintenance";
}

const INITIAL_SECTORS: SectorItem[] = [
  {
    id: "sec-1",
    code: "Stock1",
    name: "Main Storage Bay (Ground Floor)",
    category: "Internal Storage",
    occupancy: 92,
    occupancyStatus: "Critical",
    barColor: "bg-amber-600 dark:bg-amber-500",
    status: "Online",
  },
  {
    id: "sec-2",
    code: "Stock2",
    name: "Inflow Staging & Cross-dock",
    category: "Dock Buffer",
    occupancy: 45,
    occupancyStatus: "Nominal",
    barColor: "bg-blue-600",
    status: "Online",
  },
  {
    id: "sec-3",
    code: "Rack-A",
    name: "High-density Pallet Racks",
    category: "High Density Vertical",
    occupancy: 78,
    occupancyStatus: "Normal",
    barColor: "bg-blue-600",
    status: "Online",
  },
  {
    id: "sec-4",
    code: "ColdRoom",
    name: "Climate Controlled Chamber",
    category: "Cold Storage (4°C - 8°C)",
    occupancy: 34,
    occupancyStatus: "Safe",
    barColor: "bg-emerald-600 dark:bg-emerald-500",
    status: "Online",
  },
];

export default function WarehouseDetailsMobilePage() {
  const theme = useTheme();

  // Core Parameters State
  const [facilityName, setFacilityName] = useState("Main Central Logistics Hub");
  const [prefixCode, setPrefixCode] = useState("WH");
  const [facilityAddress, setFacilityAddress] = useState(
    "Industrial Area Phase 2, Bay 4 & 5, Logistics Corridor, Sector 62, 560066"
  );
  const [operationalHead, setOperationalHead] = useState("Alex Morgan (Lead)");
  const [dutyMatrix, setDutyMatrix] = useState("24/7 Continuous Inflow");
  const [enforceLotScanning, setEnforceLotScanning] = useState(true);
  const [autoCrossDock, setAutoCrossDock] = useState(true);

  // Sector list state
  const [sectors, setSectors] = useState<SectorItem[]>(INITIAL_SECTORS);

  // Modals & Feedback
  const [isSaving, setIsSaving] = useState(false);
  const [isAddZoneOpen, setIsAddZoneOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Add Zone Form
  const [newZoneName, setNewZoneName] = useState("");
  const [newZoneCode, setNewZoneCode] = useState("");
  const [newZoneCategory, setNewZoneCategory] = useState("Internal Storage");
  const [newZoneOccupancy, setNewZoneOccupancy] = useState(50);

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

  // Actions
  const handleSave = () => {
    setIsSaving(true);
    setTimeout(() => {
      setIsSaving(false);
      triggerToast(
        "Configuration Saved",
        `Prefix '${prefixCode}' synchronized across ${sectors.length} sectors.`
      );
    }, 500);
  };

  const handleDiscard = () => {
    setFacilityName("Main Central Logistics Hub");
    setPrefixCode("WH");
    setFacilityAddress(
      "Industrial Area Phase 2, Bay 4 & 5, Logistics Corridor, Sector 62, 560066"
    );
    setOperationalHead("Alex Morgan (Lead)");
    setDutyMatrix("24/7 Continuous Inflow");
    setEnforceLotScanning(true);
    setAutoCrossDock(true);
    triggerToast("Discarded", "Reverted changes to stored database state.");
  };

  const handleAddZone = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newZoneName || !newZoneCode) {
      triggerToast("Missing Info", "Please provide zone name and code.");
      return;
    }

    const newSec: SectorItem = {
      id: `sec-${Date.now()}`,
      code: newZoneCode.replace(/[^a-zA-Z0-9_-]/g, ""),
      name: newZoneName,
      category: newZoneCategory,
      occupancy: Number(newZoneOccupancy) || 0,
      occupancyStatus: newZoneOccupancy >= 80 ? "Critical" : newZoneOccupancy >= 50 ? "Nominal" : "Safe",
      barColor: newZoneOccupancy >= 80 ? "bg-amber-600" : "bg-blue-600",
      status: "Online",
    };

    setSectors((prev) => [...prev, newSec]);
    setIsAddZoneOpen(false);
    setNewZoneName("");
    setNewZoneCode("");
    triggerToast("Zone Added", `Created ${prefixCode}/${newSec.code} zone.`);
  };

  return (
    <div className="min-h-screen bg-[#f7f9fb] dark:bg-slate-950 text-slate-900 dark:text-slate-100 antialiased font-sans transition-colors duration-200 pb-20 md:pb-12">
      {/* ========================================================================= */}
      {/* 1. TOP APP BAR                                                            */}
      {/* ========================================================================= */}
      <header className="sticky top-0 left-0 right-0 w-full z-40 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 transition-colors shadow-xs">
        <div className="w-full max-w-[1560px] mx-auto px-4 sm:px-6 lg:px-8 h-14 sm:h-16 flex items-center justify-between gap-3">
          {/* Brand Logo & Context */}
          <div className="flex items-center gap-2.5">
            <Link href="/" className="flex items-center gap-2.5">
              <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-blue-600 text-white shadow-xs">
                <span className="material-symbols-outlined text-[20px]">
                  precision_manufacturing
                </span>
              </div>
              <div className="flex flex-col">
                <div className="flex items-center gap-1.5">
                  <span className="font-bold text-base tracking-tight text-slate-900 dark:text-white">
                    NOVA
                  </span>
                  <span className="text-[10px] font-mono font-bold tracking-wider px-1 py-0.2 rounded bg-blue-50 text-blue-700 dark:bg-blue-950/70 dark:text-blue-300">
                    ALPHA
                  </span>
                </div>
                <span className="text-[10px] font-mono text-slate-500 dark:text-slate-400 leading-none">
                  WH-ALPHA-01
                </span>
              </div>
            </Link>

            {/* Desktop Navigation Links */}
            <nav className="hidden xl:flex items-center gap-1 ml-6">
              <Link
                href="/"
                className="px-3 py-1.5 text-sm text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white rounded-lg transition-colors"
              >
                Dashboard
              </Link>
              <Link
                href="/"
                className="px-3 py-1.5 text-sm text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white rounded-lg transition-colors"
              >
                Operations
              </Link>
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
                className="px-3 py-1.5 text-sm font-semibold bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300 rounded-lg flex items-center gap-1"
              >
                Settings
              </Link>
            </nav>
          </div>

          {/* Right Header Controls */}
          <div className="flex items-center gap-2">
            {/* Notification Bell */}
            <button
              type="button"
              onClick={() => triggerToast("System Alert", "Node WH-ALPHA-01 operating with 100% sync.")}
              className="relative p-2 rounded-lg text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              <span className="material-symbols-outlined text-[20px]">
                notifications
              </span>
              <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-blue-600 ring-2 ring-white dark:ring-slate-900"></span>
            </button>

            {/* Dark/Light Toggle */}
            <button
              type="button"
              onClick={theme.toggleTheme}
              className="p-2 rounded-lg text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              title="Toggle Theme"
            >
              {theme.darkMode ? (
                <Sun className="w-4 h-4 text-amber-400" />
              ) : (
                <Moon className="w-4 h-4" />
              )}
            </button>

            {/* User Avatar Circle */}
            <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-blue-600 text-white font-mono text-xs sm:text-sm font-semibold flex items-center justify-center shadow-xs">
              A
            </div>
          </div>
        </div>
      </header>

      {/* ========================================================================= */}
      {/* 2. MAIN CONTAINER                                                         */}
      {/* ========================================================================= */}
      <main className="w-full max-w-[1560px] mx-auto px-3.5 sm:px-6 lg:px-8 pt-3 sm:pt-6 space-y-3.5 sm:space-y-6">
        {/* Breadcrumb & Status */}
        <div className="flex items-center justify-between text-xs font-mono">
          <div className="flex items-center gap-1 text-slate-500 dark:text-slate-400">
            <Link href="/settings" className="hover:text-blue-600">Settings</Link>
            <span>/</span>
            <span>Warehouses</span>
            <span>/</span>
            <span className="font-bold text-blue-600 dark:text-blue-400">{prefixCode}</span>
          </div>
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
            Operational
          </span>
        </div>

        {/* Title & Action Buttons Header */}
        <div className="flex items-center justify-between gap-2">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
              Nova Central Hub
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Configuration &amp; Topology Core
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleDiscard}
              className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 text-xs font-semibold hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
            >
              Discard
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={isSaving}
              className="px-3.5 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold flex items-center gap-1 shadow-xs transition-colors"
            >
              <Check className="w-3.5 h-3.5" />
              <span>{isSaving ? "Saving..." : "Save"}</span>
            </button>
          </div>
        </div>

        {/* --------------------------------------------------------------------- */}
        {/* Vital Metrics Strip (2x2 Grid on Mobile, 4-col on Desktop)           */}
        {/* --------------------------------------------------------------------- */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-4">
          {/* Short Code */}
          <div className="p-3 sm:p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col justify-between">
            <div className="flex items-center justify-between text-slate-500">
              <span className="text-xs font-medium">Short Code</span>
              <QrCode className="w-4 h-4 text-blue-600" />
            </div>
            <div className="mt-1">
              <div className="text-xl sm:text-2xl font-mono font-bold text-slate-900 dark:text-white">
                {prefixCode}
              </div>
              <div className="mt-0.5 text-[11px] font-mono text-blue-600 dark:text-blue-400 font-semibold">
                Root Prefix (Active)
              </div>
            </div>
          </div>

          {/* Utilization */}
          <div className="p-3 sm:p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col justify-between">
            <div className="flex items-center justify-between text-slate-500">
              <span className="text-xs font-medium">Utilization</span>
              <span className="material-symbols-outlined text-amber-500 text-[18px]">
                progress_activity
              </span>
            </div>
            <div className="mt-1">
              <div className="text-xl sm:text-2xl font-mono font-bold text-slate-900 dark:text-white flex items-baseline gap-1">
                84.2% <span className="text-xs font-normal text-slate-500">cap</span>
              </div>
              <div className="w-full h-1 rounded-full bg-slate-100 dark:bg-slate-800 mt-1.5 overflow-hidden">
                <div className="h-full bg-amber-500 rounded-full" style={{ width: "84.2%" }}></div>
              </div>
              <div className="mt-1 text-[10px] font-mono text-slate-400">
                2,520 / 3,000 Pallets
              </div>
            </div>
          </div>

          {/* Locations */}
          <div className="p-3 sm:p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col justify-between">
            <div className="flex items-center justify-between text-slate-500">
              <span className="text-xs font-medium">Locations</span>
              <GitBranch className="w-4 h-4 text-emerald-600" />
            </div>
            <div className="mt-1">
              <div className="text-xl sm:text-2xl font-mono font-bold text-slate-900 dark:text-white flex items-baseline gap-1">
                18 <span className="text-xs font-normal text-slate-500">Zones</span>
              </div>
              <div className="mt-1 inline-flex items-center gap-1 px-1.5 py-0.2 rounded text-[10px] font-mono bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                <Check className="w-3 h-3" />
                100% Synced
              </div>
            </div>
          </div>

          {/* Lead Custodian */}
          <div className="p-3 sm:p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col justify-between">
            <div className="flex items-center justify-between text-slate-500">
              <span className="text-xs font-medium">Lead Custodian</span>
              <User className="w-4 h-4 text-blue-600" />
            </div>
            <div className="mt-1">
              <div className="text-sm sm:text-base font-bold text-slate-900 dark:text-white truncate">
                Alex Morgan
              </div>
              <div className="text-[10px] font-mono text-slate-500 truncate">
                Zone Master Access
              </div>
              <div className="mt-0.5 flex items-center gap-1 text-[10px] font-mono text-emerald-600 dark:text-emerald-400">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                Shift Lead (On Duty)
              </div>
            </div>
          </div>
        </div>

        {/* --------------------------------------------------------------------- */}
        {/* Facility Parameters Card                                              */}
        {/* --------------------------------------------------------------------- */}
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden">
          <div className="p-3.5 sm:p-4 flex items-center justify-between border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-2">
              <span className="p-1 rounded bg-blue-50 dark:bg-blue-950 text-blue-600">
                <Package className="w-4 h-4" />
              </span>
              <span className="font-bold text-sm sm:text-base text-slate-900 dark:text-white">
                Facility Parameters
              </span>
            </div>
            <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 font-semibold border border-slate-200 dark:border-slate-700">
              Primary Hub
            </span>
          </div>

          <div className="p-3.5 sm:p-4 space-y-3">
            {/* Facility Name */}
            <div>
              <span className="text-[10px] font-mono tracking-wider text-slate-500 uppercase block mb-1">
                Facility Name
              </span>
              <div className="relative">
                <input
                  type="text"
                  value={facilityName}
                  onChange={(e) => setFacilityName(e.target.value)}
                  className="w-full h-9 pl-3 pr-8 bg-slate-50 dark:bg-slate-800/80 rounded-lg text-xs sm:text-sm font-semibold text-slate-900 dark:text-white border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
                <Pencil className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>
            </div>

            {/* Prefix Identifier */}
            <div>
              <span className="text-[10px] font-mono tracking-wider text-slate-500 uppercase block mb-1">
                Prefix Identifier (Root)
              </span>
              <div className="relative">
                <input
                  type="text"
                  maxLength={5}
                  value={prefixCode}
                  onChange={(e) => setPrefixCode(e.target.value.toUpperCase())}
                  className="w-full h-9 pl-3 pr-8 bg-slate-50 dark:bg-slate-800/80 rounded-lg font-mono text-sm font-bold text-slate-900 dark:text-white border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-1 focus:ring-blue-500 uppercase tracking-wider"
                />
                <Lock className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>
              <p className="text-[11px] font-mono text-blue-600 dark:text-blue-400 mt-1 flex items-center gap-1">
                <span className="material-symbols-outlined text-[13px]">info</span>
                Propagates to child keys: <strong className="font-bold">{prefixCode}/STOCK1/BIN-04</strong>
              </p>
            </div>

            {/* Facility Address */}
            <div>
              <span className="text-[10px] font-mono tracking-wider text-slate-500 uppercase block mb-1">
                Facility Address
              </span>
              <div className="relative">
                <MapPin className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="text"
                  value={facilityAddress}
                  onChange={(e) => setFacilityAddress(e.target.value)}
                  className="w-full h-9 pl-8 pr-3 bg-slate-50 dark:bg-slate-800/80 rounded-lg text-xs sm:text-sm text-slate-900 dark:text-white border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>
            </div>

            {/* 2-column Operational Head & Duty Inflow Matrix */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
              <div>
                <span className="text-[10px] font-mono tracking-wider text-slate-500 uppercase block mb-1">
                  Operational Head
                </span>
                <select
                  value={operationalHead}
                  onChange={(e) => setOperationalHead(e.target.value)}
                  className="w-full h-9 px-2.5 bg-slate-50 dark:bg-slate-800/80 rounded-lg text-xs text-slate-900 dark:text-white border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-1 focus:ring-blue-500"
                >
                  <option>Alex Morgan (Lead)</option>
                  <option>Sara Jenkins (Supervisor)</option>
                  <option>David Chen (Controller)</option>
                </select>
              </div>

              <div>
                <span className="text-[10px] font-mono tracking-wider text-slate-500 uppercase block mb-1">
                  Duty Inflow Matrix
                </span>
                <div className="relative">
                  <select
                    value={dutyMatrix}
                    onChange={(e) => setDutyMatrix(e.target.value)}
                    className="w-full h-9 pl-2.5 pr-8 bg-slate-50 dark:bg-slate-800/80 rounded-lg text-xs text-slate-900 dark:text-white border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  >
                    <option>24/7 Continuous Inflow</option>
                    <option>Double Shift (06:00 - 22:00)</option>
                    <option>Single Shift (08:00 - 17:00)</option>
                  </select>
                  <Clock className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                </div>
              </div>
            </div>

            {/* Operational Toggles */}
            <div className="pt-2 space-y-2 border-t border-slate-100 dark:border-slate-800">
              <label className="flex items-center justify-between p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800/40 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer transition-colors">
                <div className="flex flex-col pr-2">
                  <span className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                    Enforce Lot / Serial Scanning
                  </span>
                  <span className="text-[10px] font-mono text-slate-500">
                    Mandate 2D barcode check at inbound dock intake
                  </span>
                </div>
                <input
                  type="checkbox"
                  checked={enforceLotScanning}
                  onChange={(e) => setEnforceLotScanning(e.target.checked)}
                  className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 cursor-pointer shrink-0"
                />
              </label>

              <label className="flex items-center justify-between p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800/40 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer transition-colors">
                <div className="flex flex-col pr-2">
                  <span className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                    Automated Cross-Dock Routing
                  </span>
                  <span className="text-[10px] font-mono text-slate-500">
                    Bypass buffer storage for prioritized back-to-back manifests
                  </span>
                </div>
                <input
                  type="checkbox"
                  checked={autoCrossDock}
                  onChange={(e) => setAutoCrossDock(e.target.checked)}
                  className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 cursor-pointer shrink-0"
                />
              </label>
            </div>
          </div>
        </div>

        {/* --------------------------------------------------------------------- */}
        {/* Topology & Geo Anchor Card                                            */}
        {/* --------------------------------------------------------------------- */}
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden">
          <div className="p-3.5 sm:p-4 flex items-center justify-between border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-2">
              <span className="p-1 rounded bg-blue-50 dark:bg-blue-950 text-blue-600">
                <span className="material-symbols-outlined text-[18px]">account_tree</span>
              </span>
              <span className="font-bold text-sm sm:text-base text-slate-900 dark:text-white">
                Topology &amp; Geo Anchor
              </span>
            </div>
            <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-blue-50 dark:bg-blue-950 text-blue-700 dark:text-blue-300 font-semibold border border-blue-200/50">
              Level 0 Root
            </span>
          </div>

          <div className="p-3.5 sm:p-4 space-y-3">
            {/* Relational Chips */}
            <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200/70 dark:border-slate-700 space-y-2">
              <div className="flex items-center gap-1.5 text-xs font-mono font-medium text-slate-800 dark:text-slate-200">
                <span className="w-2 h-2 rounded-full bg-blue-600"></span>
                <span>Nova Central Hub ({prefixCode}) → Inherits root storage keys</span>
              </div>
              <div className="flex flex-wrap items-center gap-1.5 pt-1">
                {sectors.slice(0, 3).map((sec) => (
                  <span
                    key={sec.id}
                    className="px-2 py-0.5 rounded bg-white dark:bg-slate-900 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800 text-[11px] font-mono font-semibold"
                  >
                    {prefixCode} / {sec.code}
                  </span>
                ))}
                <span className="px-2 py-0.5 rounded bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400 text-[11px] font-mono">
                  +15 sub-bins
                </span>
              </div>
            </div>

            {/* Panoramic Map View */}
            <div
              className="w-full h-36 sm:h-44 rounded-xl bg-cover bg-center relative flex items-end p-2 sm:p-3 overflow-hidden border border-slate-200 dark:border-slate-700 shadow-inner"
              style={{
                backgroundImage:
                  "url('https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?auto=format&fit=crop&w=800&q=80')",
              }}
            >
              <div className="w-full p-2 rounded-lg bg-slate-900/85 backdrop-blur-md flex items-center justify-between text-white text-xs font-mono">
                <div className="flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-blue-400" />
                  <span>12.9716° N, 77.5946° E</span>
                </div>
                <span className="flex items-center gap-1 text-[11px] text-emerald-400 font-semibold">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                  Gate 4-B Active
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* --------------------------------------------------------------------- */}
        {/* Configured Sectors (Mobile Cards List)                                */}
        {/* --------------------------------------------------------------------- */}
        <div className="space-y-2.5">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-bold text-sm sm:text-base text-slate-900 dark:text-white">
                Configured Sectors
              </h2>
              <p className="text-[11px] font-mono text-slate-500">
                {sectors.length} Active Primary Sectors
              </p>
            </div>

            <button
              type="button"
              onClick={() => setIsAddZoneOpen(true)}
              className="px-2.5 py-1 rounded-lg bg-blue-50 dark:bg-blue-950 text-blue-700 dark:text-blue-300 hover:bg-blue-100 text-xs font-mono font-bold flex items-center gap-1 border border-blue-200/50"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>+ Zone</span>
            </button>
          </div>

          <div className="space-y-2.5">
            {sectors.map((sec) => (
              <div
                key={sec.id}
                className="p-3 sm:p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-2.5 hover:border-blue-300 transition-colors"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="px-1.5 py-0.5 rounded bg-blue-50 dark:bg-blue-950 text-blue-700 dark:text-blue-300 font-mono text-xs font-bold border border-blue-200/60 dark:border-blue-800/40">
                      {prefixCode}/{sec.code}
                    </span>
                    <span className="text-xs font-mono text-slate-500 truncate">
                      {sec.category}
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={() => triggerToast("Sector Details", `Viewing telemetry for ${prefixCode}/${sec.code}`)}
                    className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-mono font-semibold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 shrink-0"
                  >
                    <span>{sec.status}</span>
                    <ChevronRight className="w-3 h-3" />
                  </button>
                </div>

                <div>
                  <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                    {sec.name}
                  </h3>
                </div>

                <div className="space-y-1">
                  <div className="flex items-center justify-between text-[11px] font-mono">
                    <span className="text-slate-500">Occupancy Level</span>
                    <span
                      className={`font-bold ${
                        sec.occupancyStatus === "Critical"
                          ? "text-amber-600 dark:text-amber-400"
                          : sec.occupancyStatus === "Safe"
                          ? "text-emerald-600 dark:text-emerald-400"
                          : "text-slate-900 dark:text-white"
                      }`}
                    >
                      {sec.occupancy}% ({sec.occupancyStatus})
                    </span>
                  </div>
                  <div className="w-full bg-slate-100 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-300 ${sec.barColor}`}
                      style={{ width: `${sec.occupancy}%` }}
                    ></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Wireframe Protocol Callout Note */}
        <div className="p-3 rounded-xl bg-slate-100/70 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-start gap-2 text-xs font-mono text-slate-500 dark:text-slate-400">
          <Shield className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
          <span>
            Wireframe Protocol: Changes to warehouse prefix{" "}
            <strong className="text-slate-900 dark:text-white font-bold">{prefixCode}</strong>{" "}
            cascade automatically to child bins, pallet routing rules, and EDI document schemas.
          </span>
        </div>
      </main>

      {/* ========================================================================= */}
      {/* 3. ADD ZONE MODAL                                                         */}
      {/* ========================================================================= */}
      {isAddZoneOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 animate-in fade-in duration-150">
          <div className="bg-white dark:bg-slate-900 w-full max-w-sm rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden animate-in zoom-in-95 duration-150 p-4 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-200 dark:border-slate-800">
              <div className="flex items-center gap-1.5 font-bold text-sm text-slate-900 dark:text-white">
                <Plus className="w-4 h-4 text-blue-600" />
                <span>Add Storage Sector to {prefixCode}</span>
              </div>
              <button
                type="button"
                onClick={() => setIsAddZoneOpen(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <CloseIcon className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAddZone} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Sector Name
                </label>
                <input
                  type="text"
                  required
                  value={newZoneName}
                  onChange={(e) => setNewZoneName(e.target.value)}
                  placeholder="e.g. Mezzanine Aisle 4"
                  className="w-full h-9 px-3 bg-slate-50 dark:bg-slate-800 rounded-lg text-xs text-slate-900 dark:text-white border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Sub-Code Key
                </label>
                <div className="flex items-center">
                  <span className="h-9 px-2.5 flex items-center font-mono font-bold text-xs bg-slate-100 dark:bg-slate-800 text-slate-500 border border-r-0 border-slate-200 dark:border-slate-700 rounded-l-lg">
                    {prefixCode}/
                  </span>
                  <input
                    type="text"
                    required
                    value={newZoneCode}
                    onChange={(e) => setNewZoneCode(e.target.value)}
                    placeholder="Rack-B"
                    className="flex-1 h-9 px-2.5 bg-slate-50 dark:bg-slate-800 rounded-r-lg font-mono text-xs font-bold text-slate-900 dark:text-white border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Category
                  </label>
                  <select
                    value={newZoneCategory}
                    onChange={(e) => setNewZoneCategory(e.target.value)}
                    className="w-full h-9 px-2 bg-slate-50 dark:bg-slate-800 rounded-lg text-xs text-slate-900 dark:text-white border border-slate-200 dark:border-slate-700"
                  >
                    <option>Internal Storage</option>
                    <option>Dock Buffer</option>
                    <option>Cold Storage</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Occupancy (%)
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={newZoneOccupancy}
                    onChange={(e) => setNewZoneOccupancy(Number(e.target.value))}
                    className="w-full h-9 px-2 bg-slate-50 dark:bg-slate-800 rounded-lg text-xs font-mono text-slate-900 dark:text-white border border-slate-200 dark:border-slate-700"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsAddZoneOpen(false)}
                  className="px-3 py-1.5 text-xs font-medium text-slate-600"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold"
                >
                  Save Sector
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 4. NOTIFICATION TOAST                                                     */}
      {/* ========================================================================= */}
      <div
        className={`fixed bottom-16 sm:bottom-6 right-4 sm:right-6 z-50 bg-slate-900 text-white px-4 py-2.5 rounded-xl shadow-xl flex items-center gap-2.5 transform transition-all duration-300 border border-slate-700 ${
          toast.visible
            ? "translate-y-0 opacity-100 scale-100"
            : "translate-y-8 opacity-0 scale-95 pointer-events-none"
        }`}
      >
        <span className="material-symbols-outlined text-emerald-400 text-[20px]">
          check_circle
        </span>
        <div className="flex flex-col">
          <span className="text-xs font-bold">{toast.title}</span>
          <span className="text-[11px] font-mono text-slate-300">{toast.message}</span>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 5. MOBILE FIXED BOTTOM NAVIGATION BAR                                     */}
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
    </div>
  );
}
