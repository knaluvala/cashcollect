"use client";
import React, { useMemo, useState } from "react";
import {
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  TrendingUp,
  Users,
  Store,
} from "lucide-react";
import { DBCollection } from "./ReportsContent";
// import { getAgentSupervisor } from './reportsMockData';
import SummaryBarChart from "./SummaryBarChart";

interface Props {
  data: DBCollection[];
  isLoading: boolean;
}

interface SummaryRow {
  id: string;
  agentCode: string;
  agentName: string;
  routeCode: string;
  supervisorCode: string;
  supervisorName: string;
  parlorCount: number;
  totalCash: number;
  totalCoupon: number;
  totalCC: number;
  grandTotal: number;
  acknowledgedCount: number;
  pendingCount: number;
}

function numVal(v: string | number | null): number {
  if (v === null || v === undefined) return 0;
  const n = typeof v === "string" ? parseFloat(v) : v;
  return Number.isNaN(n) ? 0 : n;
}

export default function SummaryReport({ data, isLoading }: Props) {
  const [sortKey, setSortKey] = useState<keyof SummaryRow>("grandTotal");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");

  const handleSort = (key: keyof SummaryRow) => {
    if (sortKey === key) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir("desc");
    }
  };

  const rows: SummaryRow[] = useMemo(() => {
    const groups = new Map<string, SummaryRow>();
    for (const c of data ?? []) {
      const existing = groups.get(c.agentCode);
      if (existing) {
        existing.parlorCount += 1;
        existing.totalCash += numVal(c.cashAmount);
        existing.totalCoupon += numVal(c.couponAmount);
        existing.totalCC += numVal(c.ccAmount);
        existing.grandTotal +=
          numVal(c.cashAmount) + numVal(c.couponAmount) + numVal(c.ccAmount);
        if (c.status === "acknowledged") existing.acknowledgedCount += 1;
        if (c.status === "entered") existing.pendingCount += 1;
      } else {
        groups.set(c.agentCode, {
          id: c.agentCode,
          agentCode: c.agentCode,
          agentName: c.agentName,
          routeCode: c.routeCode,
          supervisorCode: c.supervisorCode ?? "",
          supervisorName: c.supervisorName ?? "",
          parlorCount: 1,
          totalCash: numVal(c.cashAmount),
          totalCoupon: numVal(c.couponAmount),
          totalCC: numVal(c.ccAmount),
          grandTotal:
            numVal(c.cashAmount) + numVal(c.couponAmount) + numVal(c.ccAmount),
          acknowledgedCount: c.status === "acknowledged" ? 1 : 0,
          pendingCount: c.status === "entered" ? 1 : 0,
        });
      }
    }
    return Array.from(groups.values());
  }, [data]);

  const sorted = useMemo(() => {
    return [...rows].sort((a, b) => {
      const av = a[sortKey];
      const bv = b[sortKey];
      if (typeof av === "number" && typeof bv === "number") {
        return sortDir === "asc" ? av - bv : bv - av;
      }
      return sortDir === "asc"
        ? String(av).localeCompare(String(bv))
        : String(bv).localeCompare(String(av));
    });
  }, [rows, sortKey, sortDir]);

  const grandTotals = {
    cash: sorted.reduce((s, r) => s + r.totalCash, 0),
    coupon: sorted.reduce((s, r) => s + r.totalCoupon, 0),
    cc: sorted.reduce((s, r) => s + r.totalCC, 0),
    total: sorted.reduce((s, r) => s + r.grandTotal, 0),
    parlors: sorted.reduce((s, r) => s + r.parlorCount, 0),
    acknowledged: sorted.reduce((s, r) => s + r.acknowledgedCount, 0),
    pending: sorted.reduce((s, r) => s + r.pendingCount, 0),
  };

  const fmt = (n: number) =>
    "₹" + n.toLocaleString("en-IN", { minimumFractionDigits: 0 });

  const SortIcon = ({ col }: { col: keyof SummaryRow }) => {
    if (sortKey !== col)
      return <ArrowUpDown size={12} className="text-muted-foreground/50" />;
    return sortDir === "asc" ? (
      <ArrowUp size={12} className="text-primary" />
    ) : (
      <ArrowDown size={12} className="text-primary" />
    );
  };

  const ColHeader = ({
    col,
    label,
    align = "left",
  }: {
    col: keyof SummaryRow;
    label: string;
    align?: "left" | "right" | "center";
  }) => (
    <th
      className={`px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide cursor-pointer hover:text-foreground whitespace-nowrap ${
        align === "right"
          ? "text-right"
          : align === "center"
            ? "text-center"
            : "text-left"
      }`}
      onClick={() => handleSort(col)}
    >
      <span
        className={`flex items-center gap-1 ${align === "right" ? "justify-end" : align === "center" ? "justify-center" : ""}`}
      >
        {label}
        <SortIcon col={col} />
      </span>
    </th>
  );

  return (
    <div className="flex flex-col min-h-full md:h-full md:overflow-hidden">
      {/* KPI Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 border-b border-border bg-card shrink-0">
        {[
          {
            key: "kpi-collectors",
            label: "Active Collectors",
            value: sorted.length.toString(),
            icon: Users,
            color: "text-primary",
            bg: "bg-primary/5",
          },
          {
            key: "kpi-parlors",
            label: "Total Parlors",
            value: grandTotals.parlors.toString(),
            icon: Store,
            color: "text-accent",
            bg: "bg-accent/5",
          },
          {
            key: "kpi-cash",
            label: "Total Cash",
            value: fmt(grandTotals.cash),
            icon: null,
            color: "text-emerald-700",
            bg: "bg-emerald-50",
          },
          {
            key: "kpi-coupon",
            label: "Total Coupons",
            value: fmt(grandTotals.coupon),
            icon: null,
            color: "text-blue-700",
            bg: "bg-blue-50",
          },
          {
            key: "kpi-cc",
            label: "Total Card",
            value: fmt(grandTotals.cc),
            icon: null,
            color: "text-purple-700",
            bg: "bg-purple-50",
          },
          {
            key: "kpi-grand",
            label: "Grand Total",
            value: fmt(grandTotals.total),
            icon: TrendingUp,
            color: "text-foreground",
            bg: "bg-muted/60",
          },
        ].map((kpi) => {
          const Icon = kpi.icon;
          return (
            <div
              key={kpi.key}
              className={`p-3 sm:px-5 sm:py-4 border-r border-b lg:border-b-0 border-border ${kpi.bg}`}
            >
              <div className="flex items-center gap-1.5 mb-1">
                {Icon && <Icon size={13} className={kpi.color} />}
                <p className="text-[10px] sm:text-[11px] font-medium text-muted-foreground uppercase tracking-wide">
                  {kpi.label}
                </p>
              </div>
              <p className="text-base sm:text-xl font-bold tabular-nums">
                {kpi.value}
              </p>
            </div>
          );
        })}
      </div>

      {/* Chart + Table Section */}
      <div className="flex flex-col flex-1 md:overflow-hidden">
        <div className="h-44 sm:h-52 border-b border-border shrink-0 px-3 sm:px-4 py-3 bg-card">
          <p className="text-[10px] sm:text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">
            Collector-wise Collection Breakdown
          </p>
          <SummaryBarChart data={sorted} />
        </div>

        <div className="flex-1 overflow-x-auto md:overflow-y-auto scrollbar-thin">
          {isLoading ? (
            <div className="flex items-center justify-center py-16">
              <span className="w-6 h-6 border-2 border-border border-t-primary rounded-full animate-spin" />
            </div>
          ) : (
            <table className="w-full text-xs sm:text-sm border-collapse min-w-[850px]">
              {/* Table contents unchanged */}
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
