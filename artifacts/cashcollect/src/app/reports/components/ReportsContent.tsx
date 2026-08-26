"use client";
import React, { useMemo, useState, useEffect } from "react";
import {
  BarChart2,
  FileText,
  Download,
  Filter,
  X,
  RefreshCw,
} from "lucide-react";
import DetailedReport from "./DetailedReport";
import SummaryReport from "./SummaryReport";
//import { COLLECTORS, PARLORS_FILTER, getAgentSupervisor } from './reportsMockData';
import { useAuth } from "@/context/AuthContext";
import { toast } from "sonner";

import { API_BASE } from "@/lib/apiBase";

export interface ReportFilters {
  dateFrom: string;
  dateTo: string;
  agentCode: string;
  parlorCode: string;
  status: string;
}

export interface DBCollection {
  id: number;
  parlorCode: string;
  parlorName: string;
  parlorType: string;
  routeCode: string;
  agentCode: string;
  agentName: string;
  supervisorCode?: string;
  supervisorName?: string;
  collectionDate: string;
  cashAmount: string | number;
  couponAmount: string | number;
  ccAmount: string | number;
  notes: string;
  status: "entered" | "submitted" | "acknowledged";
  submittedAt: string | null;
  acknowledgedAt: string | null;
  acknowledgedBy: string | null;
}

interface UserLov {
  id: number;
  name: string;
  role: string;
  agentCode: string;
  status: string;
}

interface ParlorLov {
  id: number;
  parlorCode: string;
  parlorName: string;
  parlorType: string;
}

function todayStr() {
  return new Date().toISOString().split("T")[0];
}

function thirtyDaysAgoStr() {
  const d = new Date();
  d.setDate(d.getDate() - 30);
  return d.toISOString().split("T")[0];
}

function numVal(v: string | number | null): number {
  if (v === null || v === undefined) return 0;
  const n = typeof v === "string" ? parseFloat(v) : v;
  return Number.isNaN(n) ? 0 : n;
}

function csvEscape(value: string | number | null | undefined): string {
  const text = value === null || value === undefined ? "" : String(value);
  return `"${text.replace(/"/g, '""')}"`;
}

function downloadCsv(filename: string, rows: (string | number)[][]) {
  const csv = rows.map((row) => row.map(csvEscape).join(",")).join("\n");
  const blob = new Blob(["\uFEFF" + csv], {
    type: "text/csv;charset=utf-8;",
  });

  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export default function ReportsContent() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<"detailed" | "summary">(
    "detailed",
  );
  const [filters, setFilters] = useState<ReportFilters>({
    dateFrom: thirtyDaysAgoStr(),
    dateTo: todayStr(),
    agentCode: "",
    parlorCode: "",
    status: "",
  });
  const [showFilters, setShowFilters] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [data, setData] = useState<DBCollection[]>([]);
  const [collectors, setCollectors] = useState<UserLov[]>([]);
  const [parlors, setParlors] = useState<ParlorLov[]>([]);

  /*  const scopeAgentCodes = useMemo<string[] | null>(() => {
    if (!user || user.role === "superadmin") return null;
    if (user.role === "agent" && user.agentCode) return [user.agentCode];
    if (user.role === "supervisor" && user.supervisorCode) {
      const sup = user.supervisorCode;
      return COLLECTORS.filter(
        (c) => getAgentSupervisor(c.code).code === sup,
      ).map((c) => c.code);
    }
    return null;
  }, [user]);

  // const scopedCollectors = useMemo(() => {
  //   if (!scopeAgentCodes) return COLLECTORS;
  //   return COLLECTORS.filter((c) => scopeAgentCodes.includes(c.code));
  // }, [scopeAgentCodes]); 
  */

  const scopedCollectors = useMemo(() => {
    if (!user || user.role === "superadmin") return collectors;
    if (user.role === "agent" && user.agentCode) {
      return collectors.filter((c) => c.agentCode === user.agentCode);
    }
    return collectors;
  }, [user, collectors]);

  const headerSubtitle = useMemo(() => {
    if (!user || user.role === "superadmin")
      return "Collection data across all routes and parlors";
    if (user.role === "agent") return "Your personal collection history";
    if (user.role === "supervisor")
      return "Collections from agents assigned to you";
    return "Collection data across all routes and parlors";
  }, [user]);

  const handleFilterChange = (key: keyof ReportFilters, value: string) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  const clearFilters = () => {
    setFilters({
      dateFrom: thirtyDaysAgoStr(),
      dateTo: todayStr(),
      agentCode: "",
      parlorCode: "",
      status: "",
    });
  };

  const activeFilterCount = [
    filters.agentCode,
    filters.parlorCode,
    filters.status,
  ].filter(Boolean).length;

  const fetchLovData = async () => {
    try {
      const [usersRes, parlorsRes] = await Promise.all([
        fetch(`${API_BASE}/users`),
        fetch(`${API_BASE}/parlors`),
      ]);

      const usersData = await usersRes.json();
      const parlorsData = await parlorsRes.json();

      setCollectors(
        (usersData.users || []).filter(
          (u: UserLov) => u.role === "agent" && u.status === "active",
        ),
      );

      setParlors(parlorsData.parlors || []);
    } catch {
      toast.error("Failed to load report filters");
    }
  };

  const handleExportCsv = () => {
    if (!data.length) {
      toast.error("No report data to export");
      return;
    }

    if (activeTab === "detailed") {
      const rows: (string | number)[][] = [
        [
          "Date",
          "Parlor Code",
          "Parlor Name",
          "Parlor Type",
          "Route Code",
          "Agent Code",
          "Agent Name",
          "Cash Amount",
          "Coupon Amount",
          "Card Amount",
          "Total Amount",
          "Status",
          "Submitted At",
          "Acknowledged At",
          "Acknowledged By",
          "Notes",
        ],
        ...data.map((c) => {
          const cash = numVal(c.cashAmount);
          const coupon = numVal(c.couponAmount);
          const card = numVal(c.ccAmount);

          return [
            c.collectionDate,
            c.parlorCode,
            c.parlorName,
            c.parlorType,
            c.routeCode,
            c.agentCode,
            c.agentName,
            cash,
            coupon,
            card,
            cash + coupon + card,
            c.status,
            c.submittedAt ?? "",
            c.acknowledgedAt ?? "",
            c.acknowledgedBy ?? "",
            c.notes ?? "",
          ];
        }),
      ];

      downloadCsv(
        `cashcollect-detailed-report-${filters.dateFrom}-to-${filters.dateTo}.csv`,
        rows,
      );

      toast.success("Detailed report CSV exported");
      return;
    }

    const groups = new Map<
      string,
      {
        agentCode: string;
        agentName: string;
        routeCode: string;
        parlorCount: number;
        totalCash: number;
        totalCoupon: number;
        totalCard: number;
        grandTotal: number;
        acknowledgedCount: number;
        pendingCount: number;
      }
    >();

    for (const c of data) {
      const cash = numVal(c.cashAmount);
      const coupon = numVal(c.couponAmount);
      const card = numVal(c.ccAmount);
      const total = cash + coupon + card;

      const existing = groups.get(c.agentCode);

      if (existing) {
        existing.parlorCount += 1;
        existing.totalCash += cash;
        existing.totalCoupon += coupon;
        existing.totalCard += card;
        existing.grandTotal += total;
        if (c.status === "acknowledged") existing.acknowledgedCount += 1;
        if (c.status === "entered") existing.pendingCount += 1;
      } else {
        groups.set(c.agentCode, {
          agentCode: c.agentCode,
          agentName: c.agentName,
          routeCode: c.routeCode,
          parlorCount: 1,
          totalCash: cash,
          totalCoupon: coupon,
          totalCard: card,
          grandTotal: total,
          acknowledgedCount: c.status === "acknowledged" ? 1 : 0,
          pendingCount: c.status === "entered" ? 1 : 0,
        });
      }
    }

    const rows: (string | number)[][] = [
      [
        "Agent Code",
        "Agent Name",
        "Route Code",
        "Parlor Count",
        "Total Cash",
        "Total Coupon",
        "Total Card",
        "Grand Total",
        "Acknowledged Count",
        "Pending Count",
      ],
      ...Array.from(groups.values()).map((r) => [
        r.agentCode,
        r.agentName,
        r.routeCode,
        r.parlorCount,
        r.totalCash,
        r.totalCoupon,
        r.totalCard,
        r.grandTotal,
        r.acknowledgedCount,
        r.pendingCount,
      ]),
    ];

    downloadCsv(
      `cashcollect-summary-report-${filters.dateFrom}-to-${filters.dateTo}.csv`,
      rows,
    );

    toast.success("Summary report CSV exported");
  };

  const fetchData = async () => {
    setIsRefreshing(true);
    try {
      const params = new URLSearchParams();
      params.set("dateFrom", filters.dateFrom);
      params.set("dateTo", filters.dateTo);
      if (filters.agentCode) params.set("agentCode", filters.agentCode);
      if (filters.parlorCode) params.set("parlorCode", filters.parlorCode);
      if (filters.status) params.set("status", filters.status);
      const res = await fetch(
        `${API_BASE}/collections/reports?${params.toString()}`,
      );
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const result = await res.json();
      const collections: DBCollection[] = result.collections ?? [];
      setData(collections);
    } catch (e) {
      console.error(e);
      toast.error("Failed to load reports");
    } finally {
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchLovData();
  }, []);

  // Fetch on filter change and initial load
  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters]);

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-border bg-card shrink-0">
        <div>
          <h1 className="text-xl font-semibold text-foreground">Reports</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {headerSubtitle}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowFilters((v) => !v)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md border text-sm font-medium transition-all duration-150 ${
              showFilters
                ? "bg-primary/10 text-primary border-primary/30"
                : "bg-card text-muted-foreground border-border hover:bg-muted hover:text-foreground"
            }`}
          >
            <Filter size={14} />
            Filters
            {activeFilterCount > 0 && (
              <span className="bg-accent text-accent-foreground text-[10px] font-bold rounded-full w-4 h-4 flex items-center justify-center">
                {activeFilterCount}
              </span>
            )}
          </button>
          <button
            onClick={fetchData}
            disabled={isRefreshing}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-md border border-border bg-card text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground transition-all duration-150 disabled:opacity-50"
          >
            <RefreshCw
              size={14}
              className={isRefreshing ? "animate-spin" : ""}
            />
            Refresh
          </button>
          <button
            onClick={handleExportCsv}
            disabled={isRefreshing || data.length === 0}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-md border border-border bg-card text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground transition-all duration-150 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Download size={14} />
            Export CSV
          </button>
        </div>
      </div>

      {/* Filters Panel */}
      {showFilters && (
        <div className="px-6 py-4 border-b border-border bg-muted/30 shrink-0">
          <div className="flex flex-wrap items-end gap-4">
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1">
                Date From
              </label>
              <input
                type="date"
                value={filters.dateFrom}
                onChange={(e) => handleFilterChange("dateFrom", e.target.value)}
                className="h-8 px-2 rounded-md border border-input bg-card text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1">
                Date To
              </label>
              <input
                type="date"
                value={filters.dateTo}
                onChange={(e) => handleFilterChange("dateTo", e.target.value)}
                className="h-8 px-2 rounded-md border border-input bg-card text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
            {user?.role !== "agent" && (
              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1">
                  Collector
                </label>
                <select
                  value={filters.agentCode}
                  onChange={(e) =>
                    handleFilterChange("agentCode", e.target.value)
                  }
                  className="h-8 px-2 rounded-md border border-input bg-card text-sm focus:outline-none focus:ring-2 focus:ring-ring min-w-[160px]"
                >
                  <option value="">
                    {user?.role === "supervisor"
                      ? "All My Agents"
                      : "All Collectors"}
                  </option>
                  {scopedCollectors.map((c) => (
                    <option
                      key={`filter-collector-${c.agentCode}`}
                      value={c.agentCode}
                    >
                      {c.name} ({c.agentCode})
                    </option>
                  ))}
                </select>
              </div>
            )}
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1">
                Parlor
              </label>
              <select
                value={filters.parlorCode}
                onChange={(e) =>
                  handleFilterChange("parlorCode", e.target.value)
                }
                className="h-8 px-2 rounded-md border border-input bg-card text-sm focus:outline-none focus:ring-2 focus:ring-ring min-w-[180px]"
              >
                <option value="">All Parlors</option>
                {parlors.map((p) => (
                  <option
                    key={`filter-parlor-${p.parlorCode}`}
                    value={p.parlorCode}
                  >
                    {p.parlorName} ({p.parlorCode})
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1">
                Status
              </label>
              <select
                value={filters.status}
                onChange={(e) => handleFilterChange("status", e.target.value)}
                className="h-8 px-2 rounded-md border border-input bg-card text-sm focus:outline-none focus:ring-2 focus:ring-ring min-w-[140px]"
              >
                <option value="">All Statuses</option>
                <option value="entered">Entered</option>
                <option value="submitted">Submitted</option>
                <option value="acknowledged">Acknowledged</option>
              </select>
            </div>
            {activeFilterCount > 0 && (
              <button
                onClick={clearFilters}
                className="flex items-center gap-1 h-8 px-3 rounded-md text-xs font-medium text-muted-foreground hover:text-red-600 border border-border hover:border-red-300 hover:bg-red-50 transition-all duration-150"
              >
                <X size={12} />
                Clear filters
              </button>
            )}
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="flex items-center gap-1 px-6 pt-4 border-b border-border bg-card shrink-0">
        {[
          {
            key: "detailed" as const,
            label: "Detailed Report",
            icon: FileText,
          },
          { key: "summary" as const, label: "Summary Report", icon: BarChart2 },
        ].map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={`report-tab-${tab.key}`}
              onClick={() => setActiveTab(tab.key)}
              className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition-all duration-150 ${
                activeTab === tab.key
                  ? "border-primary text-primary"
                  : "border-transparent text-muted-foreground hover:text-foreground hover:border-border"
              }`}
            >
              <Icon size={14} />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Report Content */}
      <div className="flex-1 overflow-hidden">
        {activeTab === "detailed" ? (
          <DetailedReport data={data} isLoading={isRefreshing} />
        ) : (
          <SummaryReport data={data} isLoading={isRefreshing} />
        )}
      </div>
    </div>
  );
}
