'use client';
import React, { useMemo, useState } from 'react';
import { ArrowUpDown, ArrowUp, ArrowDown, TrendingUp, Users, Store } from 'lucide-react';
import { SUMMARY_REPORT_DATA, SummaryReportRow } from './reportsMockData';
import { ReportFilters } from './ReportsContent';
import Icon from '@/components/ui/AppIcon';
import SummaryBarChart from './SummaryBarChart';

interface Props {
  filters: ReportFilters;
}

type SortKey = keyof SummaryReportRow;
type SortDir = 'asc' | 'desc';

export default function SummaryReport({ filters }: Props) {
  const [sortKey, setSortKey] = useState<SortKey>('grandTotal');
  const [sortDir, setSortDir] = useState<SortDir>('desc');

  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortKey(key);
      setSortDir('desc');
    }
  };

  const filtered = useMemo(() => {
    // BACKEND INTEGRATION POINT: GET /api/reports/summary with filter params
    return SUMMARY_REPORT_DATA.filter((row) => {
      if (filters.agentCode && row.agentCode !== filters.agentCode) return false;
      return true;
    });
  }, [filters]);

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

  const grandTotals = {
    cash: filtered.reduce((s, r) => s + r.totalCash, 0),
    coupon: filtered.reduce((s, r) => s + r.totalCoupon, 0),
    cc: filtered.reduce((s, r) => s + r.totalCC, 0),
    total: filtered.reduce((s, r) => s + r.grandTotal, 0),
    parlors: filtered.reduce((s, r) => s + r.parlorCount, 0),
    acknowledged: filtered.reduce((s, r) => s + r.acknowledgedCount, 0),
    pending: filtered.reduce((s, r) => s + r.pendingCount, 0),
  };

  const fmt = (n: number) =>
    '₹' + n.toLocaleString('en-IN', { minimumFractionDigits: 0 });

  const SortIcon = ({ col }: { col: SortKey }) => {
    if (sortKey !== col)
      return <ArrowUpDown size={12} className="text-muted-foreground/50" />;
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
    align?: 'left' | 'right' | 'center';
  }) => (
    <th
      className={`px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide cursor-pointer hover:text-foreground whitespace-nowrap ${
        align === 'right' ?'text-right'
          : align === 'center' ?'text-center' :'text-left'
      }`}
      onClick={() => handleSort(col)}
    >
      <span
        className={`flex items-center gap-1 ${
          align === 'right' ?'justify-end'
            : align === 'center' ?'justify-center' :''
        }`}
      >
        {label}
        <SortIcon col={col} />
      </span>
    </th>
  );

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* KPI Strip */}
      <div className="flex items-stretch gap-0 border-b border-border bg-card shrink-0">
        {[
          {
            key: 'kpi-collectors',
            label: 'Active Collectors',
            value: filtered.length.toString(),
            icon: Users,
            color: 'text-primary',
            bg: 'bg-primary/5',
          },
          {
            key: 'kpi-parlors',
            label: 'Total Parlors',
            value: grandTotals.parlors.toString(),
            icon: Store,
            color: 'text-accent',
            bg: 'bg-accent/5',
          },
          {
            key: 'kpi-cash',
            label: 'Total Cash',
            value: fmt(grandTotals.cash),
            icon: null,
            color: 'text-emerald-700',
            bg: 'bg-emerald-50',
          },
          {
            key: 'kpi-coupon',
            label: 'Total Coupons',
            value: fmt(grandTotals.coupon),
            icon: null,
            color: 'text-blue-700',
            bg: 'bg-blue-50',
          },
          {
            key: 'kpi-cc',
            label: 'Total Card',
            value: fmt(grandTotals.cc),
            icon: null,
            color: 'text-purple-700',
            bg: 'bg-purple-50',
          },
          {
            key: 'kpi-grand',
            label: 'Grand Total',
            value: fmt(grandTotals.total),
            icon: TrendingUp,
            color: 'text-foreground',
            bg: 'bg-muted/60',
          },
        ].map((kpi) => {
          const Icon = kpi.icon;
          return (
            <div
              key={kpi.key}
              className={`flex-1 px-5 py-4 border-r border-border last:border-r-0 ${kpi.bg}`}
            >
              <div className="flex items-center gap-1.5 mb-1">
                {Icon && <Icon size={13} className={kpi.color} />}
                <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wide">
                  {kpi.label}
                </p>
              </div>
              <p
                className={`text-xl font-bold tabular-nums ${kpi.color}`}
              >
                {kpi.value}
              </p>
            </div>
          );
        })}
      </div>

      {/* Chart + Table split */}
      <div className="flex flex-col flex-1 overflow-hidden">
        {/* Chart */}
        <div className="h-52 border-b border-border shrink-0 px-4 py-3 bg-card">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">
            Collector-wise Collection Breakdown
          </p>
          <SummaryBarChart data={sorted} />
        </div>

        {/* Table */}
        <div className="flex-1 overflow-auto scrollbar-thin">
          <table className="w-full text-sm border-collapse min-w-[900px]">
            <thead className="sticky top-0 bg-muted/80 backdrop-blur-sm z-10">
              <tr className="border-b border-border">
                <ColHeader col="agentCode" label="Agent Code" />
                <ColHeader col="agentName" label="Collector Name" />
                <ColHeader col="routeCode" label="Route" />
                <ColHeader col="supervisorName" label="Supervisor" />
                <ColHeader col="parlorCount" label="Parlors" align="center" />
                <ColHeader col="totalCash" label="Cash (₹)" align="right" />
                <ColHeader col="totalCoupon" label="Coupons (₹)" align="right" />
                <ColHeader col="totalCC" label="Card (₹)" align="right" />
                <ColHeader col="grandTotal" label="Grand Total (₹)" align="right" />
                <ColHeader col="acknowledgedCount" label="Ack'd" align="center" />
                <ColHeader col="pendingCount" label="Pending" align="center" />
              </tr>
            </thead>
            <tbody>
              {sorted.map((row, idx) => (
                <tr
                  key={row.id}
                  className={`
                    border-b border-border hover:bg-muted/40 transition-colors
                    ${idx % 2 === 0 ? '' : 'bg-muted/10'}
                  `}
                >
                  <td className="px-4 py-3 text-xs font-mono text-muted-foreground">
                    {row.agentCode}
                  </td>
                  <td className="px-4 py-3 text-sm font-medium text-foreground whitespace-nowrap">
                    {row.agentName}
                  </td>
                  <td className="px-4 py-3 text-xs font-mono text-muted-foreground">
                    {row.routeCode}
                  </td>
                  <td className="px-4 py-3 text-sm text-foreground whitespace-nowrap">
                    <div>{row.supervisorName}</div>
                    <div className="text-[11px] text-muted-foreground font-mono">
                      {row.supervisorCode}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-center text-sm font-semibold text-foreground">
                    {row.parlorCount}
                  </td>
                  <td className="px-4 py-3 text-right text-sm font-semibold text-emerald-700 tabular-nums">
                    {fmt(row.totalCash)}
                  </td>
                  <td className="px-4 py-3 text-right text-sm font-semibold text-blue-700 tabular-nums">
                    {fmt(row.totalCoupon)}
                  </td>
                  <td className="px-4 py-3 text-right text-sm font-semibold text-purple-700 tabular-nums">
                    {fmt(row.totalCC)}
                  </td>
                  <td className="px-4 py-3 text-right text-sm font-bold text-foreground tabular-nums">
                    {fmt(row.grandTotal)}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span className="text-sm font-semibold text-emerald-700">
                      {row.acknowledgedCount}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center">
                    {row.pendingCount > 0 ? (
                      <span className="text-sm font-semibold text-amber-600">
                        {row.pendingCount}
                      </span>
                    ) : (
                      <span className="text-sm text-muted-foreground">—</span>
                    )}
                  </td>
                </tr>
              ))}

              {/* Grand totals row */}
              <tr className="border-t-2 border-border bg-muted/60 font-semibold sticky bottom-0">
                <td
                  className="px-4 py-3 text-xs font-bold text-foreground uppercase tracking-wide"
                  colSpan={4}
                >
                  Grand Total ({filtered.length} collectors)
                </td>
                <td className="px-4 py-3 text-center text-sm font-bold text-foreground">
                  {grandTotals.parlors}
                </td>
                <td className="px-4 py-3 text-right text-sm font-bold text-emerald-700 tabular-nums">
                  {fmt(grandTotals.cash)}
                </td>
                <td className="px-4 py-3 text-right text-sm font-bold text-blue-700 tabular-nums">
                  {fmt(grandTotals.coupon)}
                </td>
                <td className="px-4 py-3 text-right text-sm font-bold text-purple-700 tabular-nums">
                  {fmt(grandTotals.cc)}
                </td>
                <td className="px-4 py-3 text-right text-sm font-bold text-foreground tabular-nums">
                  {fmt(grandTotals.total)}
                </td>
                <td className="px-4 py-3 text-center text-sm font-bold text-emerald-700">
                  {grandTotals.acknowledged}
                </td>
                <td className="px-4 py-3 text-center text-sm font-bold text-amber-600">
                  {grandTotals.pending > 0 ? grandTotals.pending : '—'}
                </td>
              </tr>
            </tbody>
          </table>

          {sorted.length === 0 && (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <Users size={40} className="text-muted-foreground/30 mb-3" />
              <p className="text-base font-medium text-muted-foreground">
                No collector data found
              </p>
              <p className="text-sm text-muted-foreground/70 mt-1">
                Adjust the date range or collector filter to see summary data
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}