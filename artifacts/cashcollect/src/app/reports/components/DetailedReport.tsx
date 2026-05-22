'use client';
import React, { useMemo, useState } from 'react';
import { ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react';
import StatusBadge from '@/components/ui/StatusBadge';
import { DETAILED_REPORT_DATA, DetailedReportRow } from './reportsMockData';
import { ReportFilters } from './ReportsContent';

interface Props {
  filters: ReportFilters;
  scopeAgentCodes: string[] | null;
}

type SortKey = keyof DetailedReportRow;
type SortDir = 'asc' | 'desc';

const PARLOR_TYPE_COLORS: Record<string, string> = {
  Mall: 'bg-blue-100 text-blue-700',
  Standalone: 'bg-slate-100 text-slate-600',
  Event: 'bg-orange-100 text-orange-700',
  Kiosk: 'bg-purple-100 text-purple-700',
};

export default function DetailedReport({ filters, scopeAgentCodes }: Props) {
  const [sortKey, setSortKey] = useState<SortKey>('date');
  const [sortDir, setSortDir] = useState<SortDir>('desc');
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(10);

  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortKey(key);
      setSortDir('asc');
    }
    setPage(1);
  };

  const filtered = useMemo(() => {
    // BACKEND INTEGRATION POINT: GET /api/reports/detailed with filter params
    return DETAILED_REPORT_DATA.filter((row) => {
      if (scopeAgentCodes && !scopeAgentCodes.includes(row.agentCode)) return false;
      if (filters.agentCode && row.agentCode !== filters.agentCode) return false;
      if (filters.parlorCode && row.parlorCode !== filters.parlorCode) return false;
      if (filters.status && row.status !== filters.status) return false;
      return true;
    });
  }, [filters, scopeAgentCodes]);

  const sorted = useMemo(() => {
    return [...filtered].sort((a, b) => {
      const av = a[sortKey];
      const bv = b[sortKey];
      if (typeof av === 'number' && typeof bv === 'number') {
        return sortDir === 'asc' ? av - bv : bv - av;
      }
      return sortDir === 'asc'
        ? String(av).localeCompare(String(bv))
        : String(bv).localeCompare(String(av));
    });
  }, [filtered, sortKey, sortDir]);

  const totalPages = Math.ceil(sorted.length / perPage);
  const paginated = sorted.slice((page - 1) * perPage, page * perPage);

  const totals = {
    cash: filtered.reduce((s, r) => s + r.cashAmount, 0),
    coupon: filtered.reduce((s, r) => s + r.couponAmount, 0),
    cc: filtered.reduce((s, r) => s + r.ccAmount, 0),
    total: filtered.reduce((s, r) => s + r.total, 0),
  };

  const fmt = (n: number) =>
    '₹' + n.toLocaleString('en-IN', { minimumFractionDigits: 0 });

  const SortIcon = ({ col }: { col: SortKey }) => {
    if (sortKey !== col) return <ArrowUpDown size={12} className="text-muted-foreground/50" />;
    return sortDir === 'asc' ? (
      <ArrowUp size={12} className="text-primary" />
    ) : (
      <ArrowDown size={12} className="text-primary" />
    );
  };

  const ColHeader = ({
    col,
    label,
    align = 'left',
  }: {
    col: SortKey;
    label: string;
    align?: 'left' | 'right';
  }) => (
    <th
      className={`px-3 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide cursor-pointer hover:text-foreground whitespace-nowrap ${
        align === 'right' ? 'text-right' : 'text-left'
      }`}
      onClick={() => handleSort(col)}
    >
      <span className={`flex items-center gap-1 ${align === 'right' ? 'justify-end' : ''}`}>
        {label}
        <SortIcon col={col} />
      </span>
    </th>
  );

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Count + totals bar */}
      <div className="flex items-center justify-between px-6 py-3 border-b border-border bg-muted/20 shrink-0">
        <p className="text-sm text-muted-foreground">
          Showing{' '}
          <span className="font-semibold text-foreground">{filtered.length}</span>{' '}
          collection records
        </p>
        <div className="flex items-center gap-4 text-sm">
          <span className="text-muted-foreground">
            Cash:{' '}
            <span className="font-semibold text-emerald-700 tabular-nums">
              {fmt(totals.cash)}
            </span>
          </span>
          <span className="text-muted-foreground">
            Coupons:{' '}
            <span className="font-semibold text-blue-700 tabular-nums">
              {fmt(totals.coupon)}
            </span>
          </span>
          <span className="text-muted-foreground">
            Card:{' '}
            <span className="font-semibold text-purple-700 tabular-nums">
              {fmt(totals.cc)}
            </span>
          </span>
          <span className="w-px h-4 bg-border" />
          <span className="text-muted-foreground">
            Grand Total:{' '}
            <span className="font-bold text-foreground tabular-nums">
              {fmt(totals.total)}
            </span>
          </span>
        </div>
      </div>

      {/* Table */}
      <div className="flex-1 overflow-auto scrollbar-thin">
        <table className="w-full text-sm border-collapse min-w-[1100px]">
          <thead className="sticky top-0 bg-muted/80 backdrop-blur-sm z-10">
            <tr className="border-b border-border">
              <ColHeader col="date" label="Date" />
              <ColHeader col="parlorCode" label="Parlor Code" />
              <ColHeader col="parlorName" label="Parlor Name" />
              <th className="px-3 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide text-left">
                Type
              </th>
              <ColHeader col="routeCode" label="Route" />
              <ColHeader col="agentName" label="Collector" />
              <ColHeader col="supervisorName" label="Supervisor" />
              <ColHeader col="cashAmount" label="Cash (₹)" align="right" />
              <ColHeader col="couponAmount" label="Coupons (₹)" align="right" />
              <ColHeader col="ccAmount" label="Card (₹)" align="right" />
              <ColHeader col="total" label="Total (₹)" align="right" />
              <th className="px-3 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide text-left">
                Status
              </th>
            </tr>
          </thead>
          <tbody>
            {paginated.map((row, idx) => (
              <tr
                key={row.id}
                className={`
                  border-b border-border hover:bg-muted/40 transition-colors
                  ${idx % 2 === 0 ? '' : 'bg-muted/10'}
                `}
              >
                <td className="px-3 py-3 text-sm text-foreground whitespace-nowrap">
                  {row.date}
                </td>
                <td className="px-3 py-3 text-xs font-mono text-muted-foreground">
                  {row.parlorCode}
                </td>
                <td className="px-3 py-3 text-sm text-foreground max-w-[200px] truncate">
                  {row.parlorName}
                </td>
                <td className="px-3 py-3">
                  <span
                    className={`text-[11px] px-1.5 py-0.5 rounded font-medium ${
                      PARLOR_TYPE_COLORS[row.parlorType]
                    }`}
                  >
                    {row.parlorType}
                  </span>
                </td>
                <td className="px-3 py-3 text-xs font-mono text-muted-foreground">
                  {row.routeCode}
                </td>
                <td className="px-3 py-3 text-sm text-foreground whitespace-nowrap">
                  <div>{row.agentName}</div>
                  <div className="text-[11px] text-muted-foreground font-mono">
                    {row.agentCode}
                  </div>
                </td>
                <td className="px-3 py-3 text-sm text-foreground whitespace-nowrap">
                  <div>{row.supervisorName}</div>
                  <div className="text-[11px] text-muted-foreground font-mono">
                    {row.supervisorCode}
                  </div>
                </td>
                <td className="px-3 py-3 text-right text-sm font-semibold text-emerald-700 tabular-nums">
                  {fmt(row.cashAmount)}
                </td>
                <td className="px-3 py-3 text-right text-sm font-semibold text-blue-700 tabular-nums">
                  {fmt(row.couponAmount)}
                </td>
                <td className="px-3 py-3 text-right text-sm font-semibold text-purple-700 tabular-nums">
                  {fmt(row.ccAmount)}
                </td>
                <td className="px-3 py-3 text-right text-sm font-bold text-foreground tabular-nums">
                  {fmt(row.total)}
                </td>
                <td className="px-3 py-3">
                  <StatusBadge status={row.status} size="sm" />
                </td>
              </tr>
            ))}

            {/* Totals Row */}
            <tr className="border-t-2 border-border bg-muted/60 font-semibold sticky bottom-0">
              <td className="px-3 py-3 text-xs font-bold text-foreground uppercase tracking-wide" colSpan={7}>
                Totals ({filtered.length} records)
              </td>
              <td className="px-3 py-3 text-right text-sm font-bold text-emerald-700 tabular-nums">
                {fmt(totals.cash)}
              </td>
              <td className="px-3 py-3 text-right text-sm font-bold text-blue-700 tabular-nums">
                {fmt(totals.coupon)}
              </td>
              <td className="px-3 py-3 text-right text-sm font-bold text-purple-700 tabular-nums">
                {fmt(totals.cc)}
              </td>
              <td className="px-3 py-3 text-right text-sm font-bold text-foreground tabular-nums">
                {fmt(totals.total)}
              </td>
              <td className="px-3 py-3" />
            </tr>
          </tbody>
        </table>

        {paginated.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <FileTextIcon className="text-muted-foreground/30 mb-3" size={40} />
            <p className="text-base font-medium text-muted-foreground">
              No collection records found
            </p>
            <p className="text-sm text-muted-foreground/70 mt-1">
              Adjust the date range or filters to see collection data
            </p>
          </div>
        )}
      </div>

      {/* Pagination */}
      {filtered.length > 0 && (
        <div className="flex items-center justify-between px-6 py-3 border-t border-border bg-card shrink-0">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <span>Rows per page:</span>
            <select
              value={perPage}
              onChange={(e) => {
                setPerPage(Number(e.target.value));
                setPage(1);
              }}
              className="h-7 px-2 rounded border border-input bg-card text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            >
              {[10, 25, 50].map((n) => (
                <option key={`perpage-${n}`} value={n}>
                  {n}
                </option>
              ))}
            </select>
            <span>
              {(page - 1) * perPage + 1}–
              {Math.min(page * perPage, filtered.length)} of {filtered.length}
            </span>
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="h-7 w-7 rounded border border-border flex items-center justify-center text-muted-foreground hover:bg-muted hover:text-foreground disabled:opacity-40 disabled:cursor-not-allowed transition-all duration-150"
            >
              ‹
            </button>
            {Array.from({ length: totalPages }).map((_, i) => (
              <button
                key={`page-${i + 1}`}
                onClick={() => setPage(i + 1)}
                className={`h-7 w-7 rounded border text-sm font-medium transition-all duration-150 ${
                  page === i + 1
                    ? 'bg-primary text-primary-foreground border-primary'
                    : 'border-border text-muted-foreground hover:bg-muted hover:text-foreground'
                }`}
              >
                {i + 1}
              </button>
            ))}
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="h-7 w-7 rounded border border-border flex items-center justify-center text-muted-foreground hover:bg-muted hover:text-foreground disabled:opacity-40 disabled:cursor-not-allowed transition-all duration-150"
            >
              ›
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function FileTextIcon({ size, className }: { size: number; className?: string }) {
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