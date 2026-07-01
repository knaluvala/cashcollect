"use client";
import React from "react";
import { MapPin, Store } from "lucide-react";
import StatusBadge from "@/components/ui/StatusBadge";
import { ParlorEntry, ParlorType } from "./types";

interface ParlorListProps {
  parlors: ParlorEntry[];
  selectedId: string;
  onSelect: (id: string) => void;
}

const PARLOR_TYPE_COLORS: Record<ParlorType, string> = {
  Mall: "bg-blue-100 text-blue-700",
  Standalone: "bg-slate-100 text-slate-600",
  Event: "bg-orange-100 text-orange-700",
  Kiosk: "bg-purple-100 text-purple-700",
};

export default function ParlorList({
  parlors,
  selectedId,
  onSelect,
}: ParlorListProps) {
  const totalCash = parlors.reduce((s, p) => s + (p.cashAmount ?? 0), 0);
  const totalCoupon = parlors.reduce((s, p) => s + (p.couponAmount ?? 0), 0);
  const totalCC = parlors.reduce((s, p) => s + (p.ccAmount ?? 0), 0);

  const fmt = (n: number) =>
    "₹" +
    n.toLocaleString("en-IN", {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    });

  return (
    <aside className="w-72 xl:w-80 shrink-0 border-r border-border flex flex-col bg-card overflow-hidden">
      {/* Summary */}
      <div className="px-4 py-3 border-b border-border bg-muted/30">
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">
          Today's Totals
        </p>
        <div className="grid grid-cols-3 gap-2">
          {[
            { label: "Cash", value: fmt(totalCash), color: "text-emerald-700" },
            {
              label: "Coupons",
              value: fmt(totalCoupon),
              color: "text-blue-700",
            },
            { label: "Card", value: fmt(totalCC), color: "text-purple-700" },
          ].map((item) => (
            <div key={`summary-${item.label}`} className="text-center">
              <p className={`text-sm font-bold tabular-nums ${item.color}`}>
                {item.value}
              </p>
              <p className="text-[10px] text-muted-foreground">{item.label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* List */}
      <ul className="flex-1 overflow-y-auto scrollbar-thin divide-y divide-border">
        {parlors.map((parlor) => {
          const isSelected = parlor.id === selectedId;
          const hasData =
            parlor.cashAmount !== null ||
            parlor.couponAmount !== null ||
            parlor.ccAmount !== null;

          return (
            <li key={parlor.id}>
              <button
                onClick={() => onSelect(parlor.id)}
                className={`
                  w-full text-left px-4 py-3 transition-all duration-150
                  ${
                    isSelected
                      ? "bg-primary/5 border-l-2 border-primary"
                      : "hover:bg-muted/60 border-l-2 border-transparent"
                  }
                `}
              >
                <div className="flex items-start justify-between gap-2 mb-1">
                  <div className="flex items-center gap-1.5 min-w-0">
                    <Store
                      size={13}
                      className={`shrink-0 mt-0.5 ${
                        isSelected ? "text-primary" : "text-muted-foreground"
                      }`}
                    />
                    <span
                      className={`text-sm font-medium truncate ${
                        isSelected ? "text-primary" : "text-foreground"
                      }`}
                    >
                      {parlor.parlorName}
                    </span>
                  </div>
                  <StatusBadge status={parlor.status} size="sm" />
                </div>

                <div className="flex items-center gap-2 ml-5">
                  <span className="text-[11px] text-muted-foreground font-mono">
                    {parlor.parlorCode}
                  </span>
                  <span
                    className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${
                      PARLOR_TYPE_COLORS[parlor.parlorType]
                    }`}
                  >
                    {parlor.parlorType}
                  </span>
                </div>

                {hasData && (
                  <div className="flex items-center gap-2 mt-1.5 ml-5">
                    <span className="text-[11px] text-emerald-700 font-semibold tabular-nums">
                      ₹{(parlor.cashAmount ?? 0).toLocaleString("en-IN")}
                    </span>
                    <span className="text-[10px] text-muted-foreground">+</span>
                    <span className="text-[11px] text-blue-700 font-semibold tabular-nums">
                      ₹{(parlor.couponAmount ?? 0).toLocaleString("en-IN")}
                    </span>
                    <span className="text-[10px] text-muted-foreground">+</span>
                    <span className="text-[11px] text-purple-700 font-semibold tabular-nums">
                      ₹{(parlor.ccAmount ?? 0).toLocaleString("en-IN")}
                    </span>
                  </div>
                )}

                {parlor.acknowledgedBy && (
                  <div className="flex items-center gap-1 mt-1 ml-5">
                    <MapPin size={10} className="text-emerald-500" />
                    <span className="text-[10px] text-emerald-600">
                      Ack by {parlor.acknowledgedBy}
                    </span>
                  </div>
                )}
              </button>
            </li>
          );
        })}
      </ul>
    </aside>
  );
}
