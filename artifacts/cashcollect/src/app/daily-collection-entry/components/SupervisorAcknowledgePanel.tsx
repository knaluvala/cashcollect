'use client';
import React, { useState } from 'react';
import { CheckCircle, Clock, User, Route, Plus } from 'lucide-react';
import { toast } from 'sonner';
import StatusBadge from '@/components/ui/StatusBadge';
import { SUPERVISOR_PENDING, SupervisorPendingItem } from './mockData';

interface Props {
  onCreateNew?: () => void;
}

export default function SupervisorAcknowledgePanel({ onCreateNew }: Props) {
  const [items, setItems] = useState<SupervisorPendingItem[]>(SUPERVISOR_PENDING);
  const [acknowledging, setAcknowledging] = useState<string | null>(null);

  const fmt = (n: number) =>
    '₹' + n.toLocaleString('en-IN', { minimumFractionDigits: 0 });

  const handleAcknowledge = async (item: SupervisorPendingItem) => {
    setAcknowledging(item.id);

    // BACKEND INTEGRATION POINT: POST /api/collections/acknowledge
    // Endpoint URL called with parameters: { collectionId: item.id, supervisorCode: 'SUP-012', acknowledgedAt: new Date().toISOString(), agentCode: item.agentCode, parlorCode: item.parlorCode, cashAmount: item.cashAmount, couponAmount: item.couponAmount, ccAmount: item.ccAmount }
    await new Promise((r) => setTimeout(r, 1100));

    setItems((prev) =>
      prev.map((p) =>
        p.id === item.id ? { ...p, status: 'acknowledged' as const } : p
      )
    );
    setAcknowledging(null);
    toast.success(
      `Receipt acknowledged for ${item.parlorName} — ${item.agentName}`
    );
  };

  const pending = items.filter((i) => i.status === 'submitted');
  const acknowledged = items.filter((i) => i.status === 'acknowledged');

  const totalPendingCash = pending.reduce((s, i) => s + i.cashAmount, 0);
  const totalPendingCoupon = pending.reduce((s, i) => s + i.couponAmount, 0);
  const totalPendingCC = pending.reduce((s, i) => s + i.ccAmount, 0);

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-foreground">
            Supervisor Acknowledgment Panel
          </h2>
          <p className="text-sm text-muted-foreground mt-0.5">
            Meena Sharma (SUP-012) · Route RT-04 & RT-05 · 08 May 2026
          </p>
        </div>
        <div className="flex items-center gap-2">
          {pending.length > 0 && (
            <div className="flex items-center gap-1.5 text-sm font-medium text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
              <Clock size={14} />
              {pending.length} pending acknowledgment{pending.length > 1 ? 's' : ''}
            </div>
          )}
          <button
            onClick={onCreateNew}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 active:scale-[0.98] transition-all duration-150"
          >
            <Plus size={14} />
            Create New Entry
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
              { label: 'Cash to Receive', value: fmt(totalPendingCash), color: 'text-emerald-700' },
              { label: 'Coupons to Receive', value: fmt(totalPendingCoupon), color: 'text-blue-700' },
              { label: 'Card Slips Total', value: fmt(totalPendingCC), color: 'text-purple-700' },
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
                      <div className="text-center">
                        <p className="text-sm font-bold text-emerald-700 tabular-nums">
                          {fmt(item.cashAmount)}
                        </p>
                        <p className="text-[10px] text-muted-foreground">Cash</p>
                      </div>
                      <div className="text-xs text-muted-foreground">+</div>
                      <div className="text-center">
                        <p className="text-sm font-bold text-blue-700 tabular-nums">
                          {fmt(item.couponAmount)}
                        </p>
                        <p className="text-[10px] text-muted-foreground">Coupons</p>
                      </div>
                      <div className="text-xs text-muted-foreground">+</div>
                      <div className="text-center">
                        <p className="text-sm font-bold text-purple-700 tabular-nums">
                          {fmt(item.ccAmount)}
                        </p>
                        <p className="text-[10px] text-muted-foreground">Card</p>
                      </div>
                      <div className="w-px h-8 bg-border mx-1" />
                      <div className="text-center">
                        <p className="text-sm font-bold text-foreground tabular-nums">
                          {fmt(item.cashAmount + item.couponAmount + item.ccAmount)}
                        </p>
                        <p className="text-[10px] text-muted-foreground">Total</p>
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => handleAcknowledge(item)}
                    disabled={acknowledging === item.id}
                    className="
                      flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground
                      text-sm font-semibold hover:bg-primary/90
                      disabled:opacity-60 disabled:cursor-not-allowed
                      active:scale-[0.98] transition-all duration-150 shrink-0
                    "
                  >
                    {acknowledging === item.id ? (
                      <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : (
                      <CheckCircle size={15} />
                    )}
                    {acknowledging === item.id ? 'Recording…' : 'Received'}
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
            Acknowledged Today ({acknowledged.length})
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
                  <span className="text-emerald-700">{fmt(item.cashAmount)}</span>
                  <span className="text-muted-foreground text-xs">+</span>
                  <span className="text-blue-700">{fmt(item.couponAmount)}</span>
                  <span className="text-muted-foreground text-xs">+</span>
                  <span className="text-purple-700">{fmt(item.ccAmount)}</span>
                  <StatusBadge status="acknowledged" size="sm" />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {pending.length === 0 && acknowledged.length === 0 && (
        <div className="text-center py-16">
          <CheckCircle size={40} className="text-muted-foreground/40 mx-auto mb-3" />
          <p className="text-base font-medium text-muted-foreground">
            No submissions yet today
          </p>
          <p className="text-sm text-muted-foreground/70 mt-1">
            Agent submissions for Route RT-04 will appear here once submitted
          </p>
        </div>
      )}
    </div>
  );
}