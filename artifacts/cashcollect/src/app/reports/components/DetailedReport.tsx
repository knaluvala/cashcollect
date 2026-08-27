"use client";
import React, { useMemo, useState } from "react";
import { ArrowUpDown, ArrowUp, ArrowDown } from "lucide-react";
import StatusBadge from "@/components/ui/StatusBadge";
import { DBCollection } from "./ReportsContent";
// import { getAgentSupervisor } from './reportsMockData';

interface Props {
  data: DBCollection[];
  isLoading: boolean;
}

interface Row {
  id: string;
  date: string;
  parlorCode: string;
  parlorName: string;
  parlorType: string;
  routeCode: string;
  agentCode: string;
  agentName: string;
  supervisorCode: string;
  supervisorName: string;
  cashAmount: number;
  couponAmount: number;
  ccAmount: number;
  total: number;
  status: "entered" | "submitted" | "acknowledged";
}

type SortKey = keyof Row;

const PARLOR_TYPE_COLORS: Record<string, string> = {
  Mall: "bg-blue-100 text-blue-700",
  Standalone: "bg-slate-100 text-slate-600",
  Event: "bg-orange-100 text-orange-700",
  Kiosk: "bg-purple-100 text-purple-700",
};

function numVal(v: string | number | null): number {
  if (v === null || v === undefined) return 0;
  const n = typeof v === "string" ? parseFloat(v) : v;
  return Number.isNaN(n) ? 0 : n;
}

function fmtDate(s: string) {
  if (!s) return "";
  const d = new Date(s);
  return d.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

export default function DetailedReport({ data, isLoading }: Props) {
  const [sortKey, setSortKey] = useState<SortKey>("date");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(10);

  const rows: Row[] = useMemo(() => {
    return (data ?? []).map((c) => {
      // Retrieve supervisor dynamic data or from c if provided by the backend API
      const supervisorCode = c.supervisorCode ?? "";
      const supervisorName = c.supervisorName ?? "";

      return {
        id: String(c.id),
        date: fmtDate(c.collectionDate),
        parlorCode: c.parlorCode,
        parlorName: c.parlorName,
        parlorType: c.parlorType,
        routeCode: c.routeCode,
        agentCode: c.agentCode,
        agentName: c.agentName,
        supervisorCode,
        supervisorName,
        cashAmount: numVal(c.cashAmount),
        couponAmount: numVal(c.couponAmount),
        ccAmount: numVal(c.ccAmount),
        total:
          numVal(c.cashAmount) + numVal(c.couponAmount) + numVal(c.ccAmount),
        status: c.status,
      };
    });
  }, [data]);

  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir("asc");
    }
    setPage(1);
  };

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

  const totalPages = Math.ceil(sorted.length / perPage);
  const paginated = sorted.slice((page - 1) * perPage, page * perPage);

  const totals = {
    cash: sorted.reduce((s, r) => s + r.cashAmount, 0),
    coupon: sorted.reduce((s, r) => s + r.couponAmount, 0),
    cc: sorted.reduce((s, r) => s + r.ccAmount, 0),
    total: sorted.reduce((s, r) => s + r.total, 0),
  };

  const fmt = (n: number) =>
    "₹" + n.toLocaleString("en-IN", { minimumFractionDigits: 0 });

  const SortIcon = ({ col }: { col: SortKey }) => {
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
    col: SortKey;
    label: string;
    align?: "left" | "right";
  }) => (
    <th
      className={`px-3 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide cursor-pointer hover:text-foreground whitespace-nowrap ${align === "right" ? "text-right" : "text-left"}`}
      onClick={() => handleSort(col)}
    >
      <span
        className={`flex items-center gap-1 ${align === "right" ? "justify-end" : ""}`}
      >
        {label}
        <SortIcon col={col} />
      </span>
    </th>
  );

  return (
    <div className="flex flex-col min-h-full md:h-full md:overflow-hidden">
      {/* Count + totals bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between px-4 sm:px-6 py-3 border-b border-border bg-muted/20 shrink-0 gap-2">
        <p className="text-xs sm:text-sm text-muted-foreground">
          Showing{" "}
          <span className="font-semibold text-foreground">{sorted.length}</span>{" "}
          collection records
        </p>
        <div className="flex flex-wrap items-center gap-2 sm:gap-4 text-xs sm:text-sm">
          <span className="text-muted-foreground">
            Cash:{" "}
            <span className="font-semibold text-emerald-700 tabular-nums">
              {fmt(totals.cash)}
            </span>
          </span>
          <span className="text-muted-foreground">
            Coupons:{" "}
            <span className="font-semibold text-blue-700 tabular-nums">
              {fmt(totals.coupon)}
            </span>
          </span>
          <span className="text-muted-foreground">
            Card:{" "}
            <span className="font-semibold text-purple-700 tabular-nums">
              {fmt(totals.cc)}
            </span>
          </span>
          <span className="hidden sm:inline-block w-px h-4 bg-border" />
          <span className="text-muted-foreground">
            Grand Total:{" "}
            <span className="font-bold text-foreground tabular-nums">
              {fmt(totals.total)}
            </span>
          </span>
        </div>
      </div>

      {/* Table Container */}
      <div className="flex-1 overflow-x-auto scrollbar-thin">
        {isLoading ? (
          <div className="flex items-center justify-center py-16">
            <span className="w-6 h-6 border-2 border-border border-t-primary rounded-full animate-spin" />
          </div>
        ) : (
          <table className="w-full text-xs sm:text-sm border-collapse min-w-[1100px] table-fixed">
            <thead className="bg-muted/50 sticky top-0 z-10 text-muted-foreground uppercase text-[10px] font-semibold">
              <tr>
                <th className="p-2 sm:p-3 text-left w-24">Date</th>
                <th className="p-2 sm:p-3 text-left w-28">Parlor Code</th>
                <th className="p-2 sm:p-3 text-left w-36">Parlor Name</th>
                <th className="p-2 sm:p-3 text-left w-24">Route</th>
                <th className="p-2 sm:p-3 text-left w-28">Agent Code</th>
                <th className="p-2 sm:p-3 text-left w-32">Agent Name</th>
                <th className="p-2 sm:p-3 text-right w-24">Cash</th>
                <th className="p-2 sm:p-3 text-right w-24">Coupon</th>
                <th className="p-2 sm:p-3 text-right w-24">Card</th>
                <th className="p-2 sm:p-3 text-right w-28">Total</th>
                <th className="p-2 sm:p-3 text-center w-28">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border bg-card">
              {paginated.map((row) => (
                <tr
                  key={row.id}
                  className="hover:bg-muted/30 transition-colors"
                >
                  <td className="p-2 sm:p-3 whitespace-nowrap text-foreground">
                    {row.date}
                  </td>
                  <td className="p-2 sm:p-3 whitespace-nowrap font-medium text-foreground">
                    {row.parlorCode}
                  </td>
                  <td className="p-2 sm:p-3 whitespace-nowrap text-foreground truncate">
                    {row.parlorName}
                  </td>
                  <td className="p-2 sm:p-3 whitespace-nowrap text-muted-foreground">
                    {row.routeCode}
                  </td>
                  <td className="p-2 sm:p-3 whitespace-nowrap text-muted-foreground">
                    {row.agentCode}
                  </td>
                  <td className="p-2 sm:p-3 whitespace-nowrap text-foreground truncate">
                    {row.agentName}
                  </td>
                  <td className="p-2 sm:p-3 text-right font-medium text-emerald-600 dark:text-emerald-400 tabular-nums">
                    {fmt(row.cashAmount)}
                  </td>
                  <td className="p-2 sm:p-3 text-right font-medium text-blue-600 dark:text-blue-400 tabular-nums">
                    {fmt(row.couponAmount)}
                  </td>
                  <td className="p-2 sm:p-3 text-right font-medium text-purple-600 dark:text-purple-400 tabular-nums">
                    {fmt(row.ccAmount)}
                  </td>
                  <td className="p-2 sm:p-3 text-right font-bold text-foreground tabular-nums">
                    {fmt(row.total)}
                  </td>
                  <td className="p-2 sm:p-3 text-center">
                    <span
                      className={`inline-block px-2 py-0.5 text-[10px] font-semibold rounded-full uppercase ${
                        row.status === "acknowledged"
                          ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300"
                          : "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300"
                      }`}
                    >
                      {row.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Pagination */}
      {sorted.length > 0 && (
        <div className="flex flex-col sm:flex-row items-center justify-between px-4 sm:px-6 py-3 border-t border-border bg-card shrink-0 gap-3">
          {/* Pagination controls */}
        </div>
      )}
    </div>
  );
}

function FileTextIcon({
  size,
  className,
}: {
  size: number;
  className?: string;
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <polyline points="14 2 14 8 20 8" />
      <line x1="16" y1="13" x2="8" y2="13" />
      <line x1="16" y1="17" x2="8" y2="17" />
      <polyline points="10 9 9 9 8 9" />
    </svg>
  );
}
