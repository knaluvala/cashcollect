'use client';
import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { Store, IndianRupee, FileText, Send, Save, CheckCircle, Clock, AlertCircle, Database } from 'lucide-react';
import { toast } from 'sonner';
import StatusBadge from '@/components/ui/StatusBadge';
import { ParlorEntry, ParlorType } from './types';

interface CollectionFormValues {
  cashAmount: string;
  couponAmount: string;
  ccAmount: string;
  notes: string;
}

interface ExternalSummary {
  cashAmount: number;
  couponAmount: number;
  ccAmount: number;
  source: string;
  fetchedAt: string;
}

interface Props {
  parlor: ParlorEntry;
  date: string;
  onSave: (id: string, data: { cashAmount: number; couponAmount: number; ccAmount: number; notes: string }) => void;
  onSubmit: (id: string) => void;
}

import { API_BASE } from "@/lib/apiBase";

const PARLOR_TYPE_COLORS: Record<ParlorType, string> = {
  Mall: 'bg-blue-100 text-blue-700',
  Standalone: 'bg-slate-100 text-slate-600',
  Event: 'bg-orange-100 text-orange-700',
  Kiosk: 'bg-purple-100 text-purple-700',
};

function fmtDBDate(s: string) {
  if (!s) return '';
  const d = new Date(s);
  return d.toLocaleString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

export default function CollectionEntryForm({ parlor, date, onSave, onSubmit }: Props) {
  const [isSaving, setIsSaving] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [dbId, setDbId] = useState<number | null>(null);
  const [externalData, setExternalData] = useState<ExternalSummary | null>(null);
  const [isLoadingExternal, setIsLoadingExternal] = useState(false);
  const [externalError, setExternalError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors, isDirty },
  } = useForm<CollectionFormValues>({
    defaultValues: {
      cashAmount: parlor.cashAmount?.toString() ?? '',
      couponAmount: parlor.couponAmount?.toString() ?? '',
      ccAmount: parlor.ccAmount?.toString() ?? '',
      notes: parlor.notes ?? '',
    },
  });

  // Reset form when parlor changes
  useEffect(() => {
    reset({
      cashAmount: parlor.cashAmount?.toString() ?? '',
      couponAmount: parlor.couponAmount?.toString() ?? '',
      ccAmount: parlor.ccAmount?.toString() ?? '',
      notes: parlor.notes ?? '',
    });
  }, [parlor.id, reset]);

  // Fetch existing DB record + external system data on mount/parlor/date change
  useEffect(() => {
    let cancelled = false;
    // Fetch existing DB record
    fetch(`${API_BASE}/collections?date=${date}&parlorCode=${parlor.parlorCode}`)
      .then((r) => r.json())
      .then((data) => {
        if (cancelled) return;
        const coll = data.collection;
        if (coll) {
          setDbId(coll.id);
          reset({
            cashAmount: coll.cashAmount ?? '',
            couponAmount: coll.couponAmount ?? '',
            ccAmount: coll.ccAmount ?? '',
            notes: coll.notes ?? '',
          });
        } else {
          setDbId(null);
        }
      })
      .catch(() => setDbId(null));

    // Fetch external system data
    setIsLoadingExternal(true);
    setExternalError(null);
    fetch(`${API_BASE}/external/parlor-summary/${parlor.parlorCode}/${date}`)
      .then(async (r) => {
        const data = await r.json();
        if (!r.ok) throw new Error(data.error || "External amount source is unavailable");
        return data;
      })
      .then((data: ExternalSummary) => {
        if (cancelled) return;
        setExternalData(data);
      })
      .catch((error: Error) => {
        if (!cancelled) {
          setExternalData(null);
          setExternalError(error.message);
        }
      })
      .finally(() => {
        if (!cancelled) setIsLoadingExternal(false);
      });

    return () => { cancelled = true; };
  }, [parlor.parlorCode, date, reset]);

  const cashVal = parseFloat(watch('cashAmount') || '0') || 0;
  const couponVal = parseFloat(watch('couponAmount') || '0') || 0;
  const ccVal = parseFloat(watch('ccAmount') || '0') || 0;
  const total = cashVal + couponVal + ccVal;

  const handleSave = async (data: CollectionFormValues) => {
    setIsSaving(true);
    const payload = {
      parlorCode: parlor.parlorCode,
      parlorName: parlor.parlorName,
      parlorType: parlor.parlorType,
      routeCode: parlor.routeCode,
      agentCode: parlor.agentCode,
      agentName: parlor.agentName,
      collectionDate: date,
      cashAmount: parseFloat(data.cashAmount) || 0,
      couponAmount: parseFloat(data.couponAmount) || 0,
      ccAmount: parseFloat(data.ccAmount) || 0,
      notes: data.notes,
      status: 'entered' as const,
    };

    try {
      let res;
      if (dbId) {
        res = await fetch(`${API_BASE}/collections/${dbId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
      } else {
        res = await fetch(`${API_BASE}/collections`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
      }
      const result = await res.json();
      if (!res.ok) {
        toast.error(result.error || 'Failed to save');
        setIsSaving(false);
        return;
      }
      setDbId(result.id);
      onSave(parlor.id, {
        cashAmount: parseFloat(data.cashAmount) || 0,
        couponAmount: parseFloat(data.couponAmount) || 0,
        ccAmount: parseFloat(data.ccAmount) || 0,
        notes: data.notes,
      });
      setIsSaving(false);
      toast.success(`Collection saved for ${parlor.parlorName}`);
    } catch {
      setIsSaving(false);
      toast.error('Network error while saving');
    }
  };

  const handleSubmitEntry = async () => {
    if (!dbId) {
      toast.error('Please save the draft first');
      return;
    }
    setIsSubmitting(true);
    try {
      const res = await fetch(`${API_BASE}/collections/${dbId}/submit`, { method: 'POST' });
      const result = await res.json();
      if (!res.ok) {
        toast.error(result.error || 'Failed to submit');
        setIsSubmitting(false);
        return;
      }
      onSubmit(parlor.id);
      setIsSubmitting(false);
      setShowConfirm(false);
      toast.success(`Submitted to supervisor for ${parlor.parlorName}`);
    } catch {
      setIsSubmitting(false);
      toast.error('Network error while submitting');
    }
  };

  const isReadOnly = parlor.status === 'submitted' || parlor.status === 'acknowledged';
  const canSubmit = parlor.status === 'entered';

  const fmt = (n: number) => '₹' + n.toLocaleString('en-IN', { minimumFractionDigits: 2 });

  const AmountField = ({
    id, label, helper, valueKey, externalValue, isLoading, source, externalError,
    error, registerOptions,
  }: {
    id: string; label: string; helper: string; valueKey: 'cashAmount' | 'couponAmount' | 'ccAmount';
    externalValue: number; isLoading: boolean; source?: string; externalError: string | null;
    error?: { message?: string };
    registerOptions: any;
  }) => (
    <div className="space-y-3">
      {/* External System Value */}
      <div className="rounded-lg border border-dashed border-slate-300 bg-slate-50 px-3 py-2">
        <div className="flex items-center justify-between mb-1">
          <span className="text-[11px] uppercase tracking-wider font-semibold text-slate-500">External System</span>
          <Database size={12} className="text-slate-400" />
        </div>
        {isLoading ? (
          <div className="h-6 bg-slate-200 rounded animate-pulse" />
        ) : externalError ? (
          <p className="text-xs text-amber-700 leading-snug">{externalError}</p>
        ) : (
          <div className="flex items-center justify-between">
            <span className="text-sm font-semibold text-slate-700">{fmt(externalValue)}</span>
            <span className="text-[10px] text-slate-400">{source ?? "External source"}</span>
          </div>
        )}
      </div>

      {/* Agent Input */}
      <div>
        <label htmlFor={id} className="block text-sm font-medium text-foreground mb-1">
          {label} (₹)
        </label>
        <p className="text-xs text-muted-foreground mb-1.5">{helper}</p>
        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">₹</span>
          <input
            id={id}
            type="number"
            step="0.01"
            min="0"
            disabled={isReadOnly}
            placeholder="0.00"
            className={`
              w-full h-10 pl-6 pr-3 rounded-md border text-sm tabular-nums bg-card
              focus:outline-none focus:ring-2 focus:ring-ring focus:border-ring
              disabled:bg-muted disabled:text-muted-foreground disabled:cursor-not-allowed
              transition-all duration-150
              ${error ? 'border-red-400' : 'border-input'}
            `}
            {...register(valueKey, registerOptions)}
          />
        </div>
        {error && <p className="mt-1 text-xs text-red-500">{error.message}</p>}
      </div>
    </div>
  );

  return (
    <div className="max-w-2xl mx-auto p-6">
      {/* Parlor Header */}
      <div className="bg-card rounded-xl border border-border p-5 mb-5">
        <div className="flex items-start justify-between gap-4 mb-3">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
              <Store size={20} className="text-primary" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-foreground">{parlor.parlorName}</h2>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-xs font-mono text-muted-foreground">{parlor.parlorCode}</span>
                <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${PARLOR_TYPE_COLORS[parlor.parlorType]}`}>
                  {parlor.parlorType}
                </span>
              </div>
            </div>
          </div>
          <StatusBadge status={parlor.status} />
        </div>

        {/* Timeline */}
        {(parlor.submittedAt || parlor.acknowledgedAt) && (
          <div className="flex items-center gap-4 pt-3 border-t border-border">
            {parlor.submittedAt && (
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <Send size={12} className="text-purple-500" />
                Submitted {parlor.submittedAt}
              </div>
            )}
            {parlor.acknowledgedAt && (
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <CheckCircle size={12} className="text-emerald-500" />
                Acknowledged {parlor.acknowledgedAt} by{' '}
                <span className="font-medium text-emerald-700">{parlor.acknowledgedBy}</span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Read-only state */}
      {isReadOnly && (
        <div className={`rounded-lg border px-4 py-3 mb-5 flex items-center gap-2 text-sm ${
          parlor.status === 'acknowledged' ? 'bg-emerald-50 border-emerald-200 text-emerald-700' : 'bg-purple-50 border-purple-200 text-purple-700'
        }`}>
          {parlor.status === 'acknowledged' ? <CheckCircle size={15} /> : <Clock size={15} />}
          {parlor.status === 'acknowledged'
            ? 'This collection has been acknowledged by the supervisor. No further edits allowed.'
            : 'This collection has been submitted and is awaiting supervisor acknowledgment.'}
        </div>
      )}

      {/* Collection Form */}
      <form onSubmit={handleSubmit(handleSave)} noValidate>
        <div className="bg-card rounded-xl border border-border p-5 mb-4">
          <h3 className="text-sm font-semibold text-foreground mb-4 flex items-center gap-2">
            <IndianRupee size={15} className="text-muted-foreground" />
            Collection Amounts
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
            <AmountField
              id={`cash-${parlor.id}`}
              label="Cash Amount"
              helper="Physical currency collected"
              valueKey="cashAmount"
              externalValue={externalData?.cashAmount ?? 0}
              isLoading={isLoadingExternal}
              source={externalData?.source}
              externalError={externalError}
              error={errors.cashAmount}
              registerOptions={{
                required: !isReadOnly ? 'Cash amount is required' : false,
                min: { value: 0, message: 'Amount cannot be negative' },
              }}
            />
            <AmountField
              id={`coupon-${parlor.id}`}
              label="Coupon Amount"
              helper="Physical coupons redeemed"
              valueKey="couponAmount"
              externalValue={externalData?.couponAmount ?? 0}
              isLoading={isLoadingExternal}
              source={externalData?.source}
              externalError={externalError}
              error={errors.couponAmount}
              registerOptions={{
                required: !isReadOnly ? 'Coupon amount is required' : false,
                min: { value: 0, message: 'Amount cannot be negative' },
              }}
            />
            <AmountField
              id={`cc-${parlor.id}`}
              label="Credit Card Total"
              helper="POS / card transaction total"
              valueKey="ccAmount"
              externalValue={externalData?.ccAmount ?? 0}
              isLoading={isLoadingExternal}
              source={externalData?.source}
              externalError={externalError}
              error={errors.ccAmount}
              registerOptions={{
                required: !isReadOnly ? 'Credit card amount is required' : false,
                min: { value: 0, message: 'Amount cannot be negative' },
              }}
            />
          </div>

          {/* Total */}
          {(cashVal > 0 || couponVal > 0 || ccVal > 0) && (
            <div className="mt-5 pt-4 border-t border-border flex items-center justify-between">
              <span className="text-sm font-medium text-muted-foreground">Total Collection</span>
              <span className="text-xl font-bold text-foreground tabular-nums">{fmt(total)}</span>
            </div>
          )}
        </div>

        {/* Notes */}
        <div className="bg-card rounded-xl border border-border p-5 mb-4">
          <label htmlFor={`notes-${parlor.id}`} className="block text-sm font-semibold text-foreground mb-1.5 flex items-center gap-2">
            <FileText size={14} className="text-muted-foreground" />
            Remarks / Notes
          </label>
          <p className="text-xs text-muted-foreground mb-2">POS issues, missing slips, discrepancies, or any other notes</p>
          <textarea
            id={`notes-${parlor.id}`}
            rows={3}
            disabled={isReadOnly}
            placeholder="e.g. POS terminal was down, manual slip attached..."
            className="w-full px-3 py-2 rounded-md border border-input text-sm bg-card focus:outline-none focus:ring-2 focus:ring-ring focus:border-ring disabled:bg-muted disabled:text-muted-foreground disabled:cursor-not-allowed resize-none transition-all duration-150"
            {...register('notes')}
          />
        </div>

        {/* Actions */}
        {!isReadOnly && (
          <div className="flex items-center gap-3">
            <button
              type="submit"
              disabled={isSaving || !isDirty}
              className="flex items-center gap-2 px-4 py-2 rounded-md border border-border bg-card text-sm font-medium text-foreground hover:bg-muted disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.98] transition-all duration-150"
            >
              {isSaving ? (
                <span className="w-4 h-4 border-2 border-border border-t-primary rounded-full animate-spin" />
              ) : (
                <Save size={15} />
              )}
              {isSaving ? 'Saving…' : 'Save Draft'}
            </button>

            {canSubmit && !showConfirm && (
              <button
                type="button"
                onClick={() => setShowConfirm(true)}
                className="flex items-center gap-2 px-4 py-2 rounded-md bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 active:scale-[0.98] transition-all duration-150"
              >
                <Send size={15} />
                Submit to Supervisor
              </button>
            )}
          </div>
        )}
      </form>

      {/* Submit Confirmation */}
      {showConfirm && (
        <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-4">
          <div className="flex items-start gap-3">
            <AlertCircle size={18} className="text-amber-600 shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm font-semibold text-amber-900 mb-1">Confirm Submission</p>
              <p className="text-sm text-amber-700 mb-3">
                You are submitting <span className="font-semibold">{parlor.parlorName}</span> with total collection of <span className="font-bold">{fmt(total)}</span>. This cannot be edited after submission.
              </p>
              <div className="flex items-center gap-2">
                <button
                  onClick={handleSubmitEntry}
                  disabled={isSubmitting}
                  className="flex items-center gap-2 px-4 py-2 rounded-md bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 disabled:opacity-60 active:scale-[0.98] transition-all duration-150"
                >
                  {isSubmitting ? (
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <Send size={14} />
                  )}
                  {isSubmitting ? 'Submitting…' : 'Confirm Submit'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowConfirm(false)}
                  className="px-4 py-2 rounded-md border border-border text-sm font-medium text-muted-foreground hover:bg-muted transition-all duration-150"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
