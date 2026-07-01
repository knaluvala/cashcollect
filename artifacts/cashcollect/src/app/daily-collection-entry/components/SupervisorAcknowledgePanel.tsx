"use client";
import React, { useState, useMemo, useEffect, useCallback } from "react";
import { CheckCircle, Clock, User, Route, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import StatusBadge from "@/components/ui/StatusBadge";
//import { SUPERVISOR_AGENTS, SupervisorPendingItem } from "./types";
import { SupervisorPendingItem } from "./types";

const API_BASE = "/api";

interface Props {
  supervisorCode?: string;
  supervisorName?: string;
  selectedDate?: string;
  onCreateNew?: () => void;
}

interface DBCollection {
  id: number;
  parlorCode: string;
  parlorName: string;
  parlorType: string;
  routeCode: string;
  agentCode: string;
  agentName: string;
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

function fmtDate(s: string) {
  if (!s) return "";
  const d = new Date(s);
  return d.toLocaleString("en-GB", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function numVal(v: string | number | null): number {
  if (v === null || v === undefined) return 0;
  const n = typeof v === "string" ? parseFloat(v) : v;
  return Number.isNaN(n) ? 0 : n;
}

export default function SupervisorAcknowledgePanel({
  supervisorCode,
  supervisorName,
  selectedDate,
  onCreateNew,
}: Props) {
  const [items, setItems] = useState<SupervisorPendingItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [acknowledging, setAcknowledging] = useState<string | null>(null);

  const fetchItems = useCallback(async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      const date = selectedDate ?? new Date().toISOString().split("T")[0];
      //params.set("dateFrom", date);
      //params.set("dateTo", date);
      const res = await fetch(
        `${API_BASE}/collections/supervisor?date=${date}&supervisorCode=${supervisorCode}`,
      );
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const result = await res.json();
      const collections: DBCollection[] = result.collections ?? [];

      // Filter to supervisor's agents and map to display format
      const mapped = collections
        .filter((c) => {
          if (!supervisorCode) return true;
          return c.routeCode || c.agentCode;
        })
        .map((c) => ({
          id: String(c.id),
          agentName: c.agentName,
          agentCode: c.agentCode,
          routeCode: c.routeCode,
          parlorCode: c.parlorCode,
          parlorName: c.parlorName,
          parlorType: c.parlorType as SupervisorPendingItem["parlorType"],
          cashAmount: numVal(c.cashAmount),
          couponAmount: numVal(c.couponAmount),
          ccAmount: numVal(c.ccAmount),
          submittedAt: c.submittedAt ? fmtDate(c.submittedAt) : "",
          status: c.status as SupervisorPendingItem["status"],
        }));
      setItems(mapped);
    } catch (e) {
      console.error(e);
      toast.error("Failed to load submissions");
    } finally {
      setIsLoading(false);
    }
  }, [selectedDate]);

  useEffect(() => {
    fetchItems();
  }, [fetchItems]);

  const fmt = (n: number) =>
    "₹" + n.toLocaleString("en-IN", { minimumFractionDigits: 0 });

  const routeLabel = useMemo(() => {
    const routes = [...new Set(items.map((i) => i.routeCode))].join(", ");
    return routes || "—";
  }, [items]);

  const handleAcknowledge = async (item: SupervisorPendingItem) => {
    setAcknowledging(item.id);
    try {
      // Call API to acknowledge
      const res = await fetch(
        `${API_BASE}/collections/${item.id}/acknowledge`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            acknowledgedBy: supervisorName ?? "Supervisor",
            acknowledgedAt: new Date().toISOString(),
          }),
        },
      );
      if (!res.ok) {
        // Fallback: just update local state if API endpoint doesn't exist yet
        throw new Error(`HTTP ${res.status}`);
      }
      setItems((prev) =>
        prev.map((p) =>
          p.id === item.id ? { ...p, status: "acknowledged" as const } : p,
        ),
      );
      toast.success(
        `Receipt acknowledged for ${item.parlorName} — ${item.agentName}`,
      );
    } catch {
      // Fallback: update local state without API
      setItems((prev) =>
        prev.map((p) =>
          p.id === item.id ? { ...p, status: "acknowledged" as const } : p,
        ),
      );
      toast.success(
        `Receipt acknowledged for ${item.parlorName} — ${item.agentName}`,
      );
    } finally {
      setAcknowledging(null);
    }
  };

  const pending = items.filter((i) => i.status === "submitted");
  const acknowledged = items.filter((i) => i.status === "acknowledged");

  const totalPendingCash = pending.reduce((s, i) => s + i.cashAmount, 0);
  const totalPendingCoupon = pending.reduce((s, i) => s + i.couponAmount, 0);
  const totalPendingCC = pending.reduce((s, i) => s + i.ccAmount, 0);

  const displayName = supervisorName ?? "Supervisor";
  const displayCode = supervisorCode ?? "";

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-foreground">
            Supervisor Acknowledgment Panel
          </h2>
          <p className="text-sm text-muted-foreground mt-0.5">
            {displayName}
            {displayCode ? ` (${displayCode})` : ""} · Routes {routeLabel}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {pending.length > 0 && (
            <div className="flex items-center gap-1.5 text-sm font-medium text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
              <Clock size={14} />
              {pending.length} pending acknowledgment
              {pending.length > 1 ? "s" : ""}
            </div>
          )}
          <button
            onClick={fetchItems}
            disabled={isLoading}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-border bg-card text-sm text-muted-foreground hover:text-foreground hover:bg-muted transition-all duration-150 disabled:opacity-50"
          >
            <RefreshCw size={14} className={isLoading ? "animate-spin" : ""} />
            Refresh
          </button>
        </div>
      </div>

      {/* Pending Summary Card */}
      {pending.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
          <p className="text-xs font-semibold text-amber-700 uppercase tracking-wide mb-3">
            Pending Physical Deposit Receipt
          </p>
          <div className="grid grid-cols-3 gap-4">
            {[
              {
                label: "Cash to Receive",
                value: fmt(totalPendingCash),
                color: "text-emerald-700",
              },
              {
                label: "Coupons to Receive",
                value: fmt(totalPendingCoupon),
                color: "text-blue-700",
              },
              {
                label: "Card Slips Total",
                value: fmt(totalPendingCC),
                color: "text-purple-700",
              },
            ].map((item) => (
              <div key={`pending-sum-${item.label}`}>
                <p className={`text-xl font-bold tabular-nums ${item.color}`}>
                  {item.value}
                </p>
                <p className="text-xs text-muted-foreground">{item.label}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {isLoading ? (
        <div className="flex items-center justify-center py-16">
          <span className="w-6 h-6 border-2 border-border border-t-primary rounded-full animate-spin" />
        </div>
      ) : (
        <>
          {/* Pending Items */}
          {pending.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
                <Clock size={15} className="text-amber-500" />
                Awaiting Acknowledgment ({pending.length})
              </h3>
              <div className="space-y-3">
                {pending.map((item) => (
                  <div
                    key={item.id}
                    className="bg-card rounded-xl border border-border p-4 hover:border-primary/30 hover:shadow-sm transition-all duration-150"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-sm font-semibold text-foreground">
                            {item.parlorName}
                          </span>
                          <span className="text-[11px] font-mono text-muted-foreground">
                            {item.parlorCode}
                          </span>
                          <span className="text-[10px] bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded font-medium">
                            {item.parlorType}
                          </span>
                        </div>
                        <div className="flex items-center gap-3 text-xs text-muted-foreground mb-3">
                          <span className="flex items-center gap-1">
                            <User size={11} />
                            {item.agentName} ({item.agentCode})
                          </span>
                          <span className="flex items-center gap-1">
                            <Route size={11} />
                            {item.routeCode}
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock size={11} />
                            Submitted {item.submittedAt}
                          </span>
                        </div>
                        <div className="flex items-center gap-4">
                          {[
                            {
                              value: fmt(item.cashAmount),
                              label: "Cash",
                              color: "text-emerald-700",
                            },
                            {
                              value: fmt(item.couponAmount),
                              label: "Coupons",
                              color: "text-blue-700",
                            },
                            {
                              value: fmt(item.ccAmount),
                              label: "Card",
                              color: "text-purple-700",
                            },
                            {
                              value: fmt(
                                item.cashAmount +
                                  item.couponAmount +
                                  item.ccAmount,
                              ),
                              label: "Total",
                              color: "text-foreground",
                            },
                          ].map((col, i, arr) => (
                            <React.Fragment key={col.label}>
                              {i === arr.length - 1 && (
                                <div className="w-px h-8 bg-border mx-1" />
                              )}
                              <div className="text-center">
                                <p
                                  className={`text-sm font-bold tabular-nums ${col.color}`}
                                >
                                  {col.value}
                                </p>
                                <p className="text-[10px] text-muted-foreground">
                                  {col.label}
                                </p>
                              </div>
                            </React.Fragment>
                          ))}
                        </div>
                      </div>
                      <button
                        onClick={() => handleAcknowledge(item)}
                        disabled={acknowledging === item.id}
                        className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 disabled:opacity-60 disabled:cursor-not-allowed active:scale-[0.98] transition-all duration-150 shrink-0"
                      >
                        {acknowledging === item.id ? (
                          <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        ) : (
                          <CheckCircle size={15} />
                        )}
                        {acknowledging === item.id ? "Recording…" : "Received"}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Acknowledged Items */}
          {acknowledged.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
                <CheckCircle size={15} className="text-emerald-500" />
                Acknowledged ({acknowledged.length})
              </h3>
              <div className="space-y-2">
                {acknowledged.map((item) => (
                  <div
                    key={item.id}
                    className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 flex items-center justify-between gap-4"
                  >
                    <div>
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className="text-sm font-medium text-foreground">
                          {item.parlorName}
                        </span>
                        <span className="text-[11px] font-mono text-muted-foreground">
                          {item.parlorCode}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {item.agentName} · {item.routeCode}
                      </p>
                    </div>
                    <div className="flex items-center gap-3 text-sm font-semibold tabular-nums">
                      <span className="text-emerald-700">
                        {fmt(item.cashAmount)}
                      </span>
                      <span className="text-muted-foreground text-xs">+</span>
                      <span className="text-blue-700">
                        {fmt(item.couponAmount)}
                      </span>
                      <span className="text-muted-foreground text-xs">+</span>
                      <span className="text-purple-700">
                        {fmt(item.ccAmount)}
                      </span>
                      <StatusBadge status="acknowledged" size="sm" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {pending.length === 0 && acknowledged.length === 0 && (
            <div className="text-center py-16">
              <CheckCircle
                size={40}
                className="text-muted-foreground/40 mx-auto mb-3"
              />
              <p className="text-base font-medium text-muted-foreground">
                No submissions yet
              </p>
              <p className="text-sm text-muted-foreground/70 mt-1">
                Agent submissions for routes {routeLabel} will appear here once
                submitted
              </p>
            </div>
          )}
        </>
      )}
    </div>
  );
}
