'use client';
import React, { useState, useRef, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import {
  X,
  Search,
  Store,
  IndianRupee,
  FileText,
  Send,
  Save,
  ChevronDown,
  CheckCircle,
  CalendarDays,
  Loader2,
} from 'lucide-react';
import { toast } from 'sonner';
import { ParlorEntry, ParlorType } from './mockData';

interface NewEntryFormValues {
  cashAmount: string;
  couponAmount: string;
  ccAmount: string;
  notes: string;
}

interface CollectionRecord {
  id: number;
  parlorCode: string;
  parlorName: string;
  parlorType: string;
  routeCode: string;
  agentCode: string;
  agentName: string;
  collectionDate: string;
  cashAmount: string;
  couponAmount: string;
  ccAmount: string;
  notes: string;
  status: 'entered' | 'submitted' | 'acknowledged';
  submittedAt: string | null;
  acknowledgedAt: string | null;
  acknowledgedBy: string | null;
}

interface Props {
  onClose: () => void;
  onSaved: () => void;
  parlors: ParlorEntry[];
  defaultDate: string;
}

const API_BASE = '/api';

const PARLOR_TYPE_COLORS: Record<ParlorType, string> = {
  Mall: 'bg-blue-100 text-blue-700',
  Standalone: 'bg-slate-100 text-slate-600',
  Event: 'bg-orange-100 text-orange-700',
  Kiosk: 'bg-purple-100 text-purple-700',
};

const STATUS_COLORS = {
  pending: 'bg-amber-100 text-amber-700',
  entered: 'bg-blue-100 text-blue-700',
  submitted: 'bg-purple-100 text-purple-700',
  acknowledged: 'bg-emerald-100 text-emerald-700',
};

export default function NewEntryModal({ onClose, onSaved, parlors, defaultDate }: Props) {
  const [search, setSearch] = useState('');
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [selectedParlor, setSelectedParlor] = useState<ParlorEntry | null>(null);
  const [selectedDate, setSelectedDate] = useState(defaultDate);
  const [existingCollection, setExistingCollection] = useState<CollectionRecord | null>(null);
  const [checking, setChecking] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [saved, setSaved] = useState(false);
  const [dbId, setDbId] = useState<number | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);

  const {
    register,
    handleSubmit,
    watch,
    reset,
    formState: { errors },
  } = useForm<NewEntryFormValues>({
    defaultValues: { cashAmount: '', couponAmount: '', ccAmount: '', notes: '' },
  });

  const cashVal = parseFloat(watch('cashAmount') || '0') || 0;
  const couponVal = parseFloat(watch('couponAmount') || '0') || 0;
  const ccVal = parseFloat(watch('ccAmount') || '0') || 0;
  const total = cashVal + couponVal + ccVal;

  const fmt = (n: number) => '₹' + n.toLocaleString('en-IN', { minimumFractionDigits: 2 });

  const filtered = parlors.filter((p) => {
    const q = search.toLowerCase();
    return (
      p.parlorName.toLowerCase().includes(q) ||
      p.parlorCode.toLowerCase().includes(q) ||
      p.parlorType.toLowerCase().includes(q)
    );
  });

  // close dropdown on outside click
  useEffect(() => {
    function handler(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // focus search when dropdown opens
  useEffect(() => {
    if (dropdownOpen) {
      setTimeout(() => searchRef.current?.focus(), 50);
    }
  }, [dropdownOpen]);

  // Check for existing collection when date or parlor changes
  useEffect(() => {
    if (!selectedParlor) return;
    setChecking(true);
    fetch(`${API_BASE}/collections?date=${selectedDate}&parlorCode=${selectedParlor.parlorCode}`)
      .then((r) => r.json())
      .then((data) => {
        const coll = data.collection as CollectionRecord | null;
        setExistingCollection(coll);
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
          reset({ cashAmount: '', couponAmount: '', ccAmount: '', notes: '' });
        }
        setSaved(false);
      })
      .catch(() => {
        setExistingCollection(null);
        setDbId(null);
      })
      .finally(() => setChecking(false));
  }, [selectedParlor, selectedDate, reset]);

  function selectParlor(parlor: ParlorEntry) {
    setSelectedParlor(parlor);
    setDropdownOpen(false);
    setSearch('');
    setSaved(false);
  }

  const handleSave = async (data: NewEntryFormValues) => {
    if (!selectedParlor) return;
    setIsSaving(true);
    const payload = {
      parlorCode: selectedParlor.parlorCode,
      parlorName: selectedParlor.parlorName,
      parlorType: selectedParlor.parlorType,
      routeCode: selectedParlor.routeCode,
      agentCode: selectedParlor.agentCode,
      agentName: selectedParlor.agentName,
      collectionDate: selectedDate,
      cashAmount: parseFloat(data.cashAmount) || 0,
      couponAmount: parseFloat(data.couponAmount) || 0,
      ccAmount: parseFloat(data.ccAmount) || 0,
      notes: data.notes,
      status: 'entered',
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
      setExistingCollection(result);
      setIsSaving(false);
      setSaved(true);
      onSaved();
      toast.success(`Saved draft for ${selectedParlor.parlorName} on ${selectedDate}`);
    } catch {
      setIsSaving(false);
      toast.error('Network error while saving');
    }
  };

  const handleSubmitEntry = async () => {
    if (!selectedParlor || !dbId) return;
    setIsSubmitting(true);
    try {
      const res = await fetch(`${API_BASE}/collections/${dbId}/submit`, {
        method: 'POST',
      });
      const result = await res.json();
      if (!res.ok) {
        toast.error(result.error || 'Failed to submit');
        setIsSubmitting(false);
        return;
      }
      setExistingCollection(result);
      setIsSubmitting(false);
      toast.success(`Submitted to supervisor: ${selectedParlor.parlorName} for ${selectedDate}`);
      onSaved();
      onClose();
    } catch {
      setIsSubmitting(false);
      toast.error('Network error while submitting');
    }
  };

  const isReadOnly =
    existingCollection?.status === 'submitted' || existingCollection?.status === 'acknowledged';
  const canSubmit = saved || existingCollection?.status === 'entered';

  return (
    // Backdrop
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-foreground/40 backdrop-blur-sm">
      <div
        className="w-full max-w-xl bg-card rounded-2xl border border-border shadow-2xl flex flex-col max-h-[90vh] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-border shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
              <Store size={16} className="text-primary" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-foreground">New Collection Entry</h2>
              <p className="text-xs text-muted-foreground">Select a parlor and record amounts</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-7 h-7 rounded-md flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        {/* Scrollable body */}
        <div className="overflow-y-auto scrollbar-thin flex-1 p-5 space-y-4">

          {/* Date Picker */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-1.5">
              Collection Date <span className="text-red-500">*</span>
            </label>
            <div className="flex items-center gap-2 border border-border rounded-md px-3 py-1.5 bg-card text-sm w-full">
              <CalendarDays size={14} className="text-muted-foreground" />
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="bg-transparent text-sm text-foreground focus:outline-none w-full"
              />
            </div>
          </div>

          {/* Parlor Selector */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-1.5">
              Select Parlor <span className="text-red-500">*</span>
            </label>
            <div className="relative" ref={dropdownRef}>
              <button
                type="button"
                onClick={() => setDropdownOpen((v) => !v)}
                className={`
                  w-full flex items-center justify-between gap-2 h-10 px-3 rounded-md border text-sm
                  transition-all duration-150 text-left
                  ${selectedParlor ? 'border-input bg-card text-foreground' : 'border-input bg-card text-muted-foreground'}
                  ${dropdownOpen ? 'ring-2 ring-ring border-ring' : 'hover:border-ring/50'}
                `}
              >
                {selectedParlor ? (
                  <span className="flex items-center gap-2 min-w-0">
                    <Store size={13} className="text-primary shrink-0" />
                    <span className="truncate font-medium">{selectedParlor.parlorName}</span>
                    <span className="text-muted-foreground font-mono text-xs shrink-0">
                      {selectedParlor.parlorCode}
                    </span>
                  </span>
                ) : (
                  <span>Search and select a parlor...</span>
                )}
                <ChevronDown
                  size={14}
                  className={`text-muted-foreground shrink-0 transition-transform duration-150 ${dropdownOpen ? 'rotate-180' : ''}`}
                />
              </button>

              {dropdownOpen && (
                <div className="absolute z-50 w-full mt-1 bg-card border border-border rounded-lg shadow-lg overflow-hidden">
                  {/* Search box */}
                  <div className="p-2 border-b border-border">
                    <div className="flex items-center gap-2 px-2.5 py-1.5 rounded-md bg-muted">
                      <Search size={13} className="text-muted-foreground shrink-0" />
                      <input
                        ref={searchRef}
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder="Search by name, code, type..."
                        className="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground focus:outline-none"
                      />
                      {search && (
                        <button onClick={() => setSearch('')} className="text-muted-foreground hover:text-foreground">
                          <X size={12} />
                        </button>
                      )}
                    </div>
                  </div>
                  {/* Options */}
                  <ul className="max-h-48 overflow-y-auto scrollbar-thin divide-y divide-border">
                    {filtered.length === 0 ? (
                      <li className="px-4 py-3 text-sm text-muted-foreground text-center">No parlors match your search</li>
                    ) : (
                      filtered.map((p) => (
                        <li key={p.id}>
                          <button
                            type="button"
                            onClick={() => selectParlor(p)}
                            className={`
                              w-full text-left px-3 py-2.5 flex items-center gap-2 hover:bg-muted transition-colors
                              ${selectedParlor?.id === p.id ? 'bg-primary/5' : ''}
                            `}
                          >
                            <Store size={13} className={selectedParlor?.id === p.id ? 'text-primary' : 'text-muted-foreground'} />
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <span className="text-sm font-medium text-foreground truncate">{p.parlorName}</span>
                                <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium shrink-0 ${STATUS_COLORS[p.status]}`}>
                                  {p.status}
                                </span>
                              </div>
                              <div className="flex items-center gap-1.5 mt-0.5">
                                <span className="text-[11px] text-muted-foreground font-mono">{p.parlorCode}</span>
                                <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${PARLOR_TYPE_COLORS[p.parlorType]}`}>
                                  {p.parlorType}
                                </span>
                              </div>
                            </div>
                            {selectedParlor?.id === p.id && (
                              <CheckCircle size={14} className="text-primary shrink-0" />
                            )}
                          </button>
                        </li>
                      ))
                    )}
                  </ul>
                </div>
              )}
            </div>
          </div>

          {/* Loading state */}
          {selectedParlor && checking && (
            <div className="rounded-xl border border-border bg-muted/30 px-6 py-6 flex flex-col items-center gap-2 text-center">
              <Loader2 size={20} className="text-muted-foreground animate-spin" />
              <p className="text-sm text-muted-foreground">Checking for existing collection...</p>
            </div>
          )}

          {/* Entry form — shown once a parlor is selected and checked */}
          {selectedParlor && !checking && (
            <>
              {/* Read-only banner for existing submitted data */}
              {isReadOnly && (
                <div className={`rounded-lg border px-4 py-3 flex items-center gap-2 text-sm ${
                  existingCollection?.status === 'acknowledged'
                    ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
                    : 'bg-purple-50 border-purple-200 text-purple-700'
                }`}>
                  <CheckCircle size={14} className="shrink-0" />
                  {existingCollection?.status === 'acknowledged'
                    ? 'This collection has been acknowledged. No edits allowed.'
                    : 'This collection is submitted and awaiting supervisor acknowledgment.'}
                </div>
              )}

              {/* Collection amounts */}
              <form onSubmit={handleSubmit(handleSave)} noValidate>
                <div className="bg-background rounded-xl border border-border p-4">
                  <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3 flex items-center gap-1.5">
                    <IndianRupee size={12} />
                    Collection Amounts
                  </h3>
                  <div className="grid grid-cols-3 gap-3">
                    {/* Cash */}
                    <div>
                      <label className="block text-xs font-medium text-foreground mb-1">
                        Cash (₹)
                      </label>
                      <div className="relative">
                        <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground text-xs">₹</span>
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          disabled={isReadOnly}
                          placeholder="0.00"
                          className={`
                            w-full h-9 pl-5 pr-2 rounded-md border text-sm tabular-nums bg-card
                            focus:outline-none focus:ring-2 focus:ring-ring focus:border-ring
                            disabled:bg-muted disabled:text-muted-foreground disabled:cursor-not-allowed
                            ${errors.cashAmount ? 'border-red-400' : 'border-input'}
                          `}
                          {...register('cashAmount', { required: !isReadOnly ? 'Required' : false, min: { value: 0, message: 'Must be ≥ 0' } })}
                        />
                      </div>
                      {errors.cashAmount && <p className="mt-0.5 text-[11px] text-red-500">{errors.cashAmount.message}</p>}
                    </div>

                    {/* Coupons */}
                    <div>
                      <label className="block text-xs font-medium text-foreground mb-1">
                        Coupons (₹)
                      </label>
                      <div className="relative">
                        <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground text-xs">₹</span>
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          disabled={isReadOnly}
                          placeholder="0.00"
                          className={`
                            w-full h-9 pl-5 pr-2 rounded-md border text-sm tabular-nums bg-card
                            focus:outline-none focus:ring-2 focus:ring-ring focus:border-ring
                            disabled:bg-muted disabled:text-muted-foreground disabled:cursor-not-allowed
                            ${errors.couponAmount ? 'border-red-400' : 'border-input'}
                          `}
                          {...register('couponAmount', { required: !isReadOnly ? 'Required' : false, min: { value: 0, message: 'Must be ≥ 0' } })}
                        />
                      </div>
                      {errors.couponAmount && <p className="mt-0.5 text-[11px] text-red-500">{errors.couponAmount.message}</p>}
                    </div>

                    {/* Credit Card */}
                    <div>
                      <label className="block text-xs font-medium text-foreground mb-1">
                        Credit Card (₹)
                      </label>
                      <div className="relative">
                        <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground text-xs">₹</span>
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          disabled={isReadOnly}
                          placeholder="0.00"
                          className={`
                            w-full h-9 pl-5 pr-2 rounded-md border text-sm tabular-nums bg-card
                            focus:outline-none focus:ring-2 focus:ring-ring focus:border-ring
                            disabled:bg-muted disabled:text-muted-foreground disabled:cursor-not-allowed
                            ${errors.ccAmount ? 'border-red-400' : 'border-input'}
                          `}
                          {...register('ccAmount', { required: !isReadOnly ? 'Required' : false, min: { value: 0, message: 'Must be ≥ 0' } })}
                        />
                      </div>
                      {errors.ccAmount && <p className="mt-0.5 text-[11px] text-red-500">{errors.ccAmount.message}</p>}
                    </div>
                  </div>

                  {/* Live total */}
                  {(cashVal > 0 || couponVal > 0 || ccVal > 0) && (
                    <div className="mt-3 pt-3 border-t border-border flex items-center justify-between">
                      <span className="text-xs text-muted-foreground font-medium">Total Collection</span>
                      <span className="text-lg font-bold text-foreground tabular-nums">{fmt(total)}</span>
                    </div>
                  )}
                </div>

                {/* Notes */}
                <div className="mt-3">
                  <label className="block text-xs font-medium text-foreground mb-1 flex items-center gap-1.5">
                    <FileText size={11} className="text-muted-foreground" />
                    Remarks / Notes
                  </label>
                  <textarea
                    rows={2}
                    disabled={isReadOnly}
                    placeholder="POS issues, missing slips, discrepancies..."
                    className="
                      w-full px-3 py-2 rounded-md border border-input text-sm bg-card
                      focus:outline-none focus:ring-2 focus:ring-ring focus:border-ring
                      disabled:bg-muted disabled:text-muted-foreground disabled:cursor-not-allowed
                      resize-none transition-all duration-150
                    "
                    {...register('notes')}
                  />
                </div>

                {/* Action buttons */}
                {!isReadOnly && (
                  <div className="flex items-center gap-2 mt-3">
                    <button
                      type="submit"
                      disabled={isSaving}
                      className="
                        flex items-center gap-1.5 px-3.5 py-2 rounded-md border border-border bg-card
                        text-sm font-medium text-foreground hover:bg-muted
                        disabled:opacity-50 disabled:cursor-not-allowed
                        active:scale-[0.98] transition-all duration-150
                      "
                    >
                      {isSaving
                        ? <span className="w-3.5 h-3.5 border-2 border-border border-t-primary rounded-full animate-spin" />
                        : <Save size={14} />}
                      {isSaving ? 'Saving…' : 'Save Draft'}
                    </button>

                    {canSubmit && (
                      <button
                        type="button"
                        onClick={handleSubmitEntry}
                        disabled={isSubmitting}
                        className="
                          flex items-center gap-1.5 px-4 py-2 rounded-md bg-primary text-primary-foreground
                          text-sm font-semibold hover:bg-primary/90
                          disabled:opacity-60 active:scale-[0.98] transition-all duration-150
                        "
                      >
                        {isSubmitting
                          ? <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                          : <Send size={14} />}
                        {isSubmitting ? 'Submitting…' : 'Submit to Supervisor'}
                      </button>
                    )}
                  </div>
                )}
              </form>
            </>
          )}

          {/* Prompt when no parlor selected */}
          {!selectedParlor && (
            <div className="rounded-xl border-2 border-dashed border-border bg-muted/30 px-6 py-8 flex flex-col items-center gap-2 text-center">
              <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
                <Store size={18} className="text-muted-foreground" />
              </div>
              <p className="text-sm font-medium text-muted-foreground">Select a parlor above to begin entry</p>
              <p className="text-xs text-muted-foreground/70">You can search by name, code, or type</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
