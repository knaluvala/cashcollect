'use client';
import React, { useMemo, useState } from 'react';
import { BarChart2, FileText, Download, Filter, X } from 'lucide-react';
import DetailedReport from './DetailedReport';
import SummaryReport from './SummaryReport';
import { COLLECTORS, PARLORS_FILTER, SUMMARY_REPORT_DATA } from './reportsMockData';
import Icon from '@/components/ui/AppIcon';
import { useAuth } from '@/context/AuthContext';


type ReportTab = 'detailed' | 'summary';

export interface ReportFilters {
  dateFrom: string;
  dateTo: string;
  agentCode: string;
  parlorCode: string;
  status: string;
}

export default function ReportsContent() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<ReportTab>('detailed');
  const [filters, setFilters] = useState<ReportFilters>({
    dateFrom: '2026-05-06',
    dateTo: '2026-05-08',
    agentCode: '',
    parlorCode: '',
    status: '',
  });
  const [showFilters, setShowFilters] = useState(true);

  const scopeAgentCodes = useMemo<string[] | null>(() => {
    if (!user || user.role === 'superadmin') return null;
    if (user.role === 'agent' && user.agentCode) return [user.agentCode];
    if (user.role === 'supervisor' && user.supervisorCode) {
      return SUMMARY_REPORT_DATA
        .filter((r) => r.supervisorCode === user.supervisorCode)
        .map((r) => r.agentCode);
    }
    return null;
  }, [user]);

  const scopedCollectors = useMemo(() => {
    if (!scopeAgentCodes) return COLLECTORS;
    return COLLECTORS.filter((c) => scopeAgentCodes.includes(c.code));
  }, [scopeAgentCodes]);

  const headerSubtitle = useMemo(() => {
    if (!user || user.role === 'superadmin') return 'Collection data across all routes and parlors';
    if (user.role === 'agent') return 'Your personal collection history';
    if (user.role === 'supervisor') return 'Collections from agents assigned to you';
    return 'Collection data across all routes and parlors';
  }, [user]);

  const handleFilterChange = (key: keyof ReportFilters, value: string) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  const clearFilters = () => {
    setFilters({
      dateFrom: '2026-05-06',
      dateTo: '2026-05-08',
      agentCode: '',
      parlorCode: '',
      status: '',
    });
  };

  const activeFilterCount = [
    filters.agentCode,
    filters.parlorCode,
    filters.status,
  ].filter(Boolean).length;

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-border bg-card shrink-0">
        <div>
          <h1 className="text-xl font-semibold text-foreground">Reports</h1>
          <p className="text-sm text-muted-foreground mt-0.5">{headerSubtitle}</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowFilters((v) => !v)}
            className={`
              flex items-center gap-1.5 px-3 py-1.5 rounded-md border text-sm font-medium
              transition-all duration-150
              ${
                showFilters
                  ? 'bg-primary/10 text-primary border-primary/30' :'bg-card text-muted-foreground border-border hover:bg-muted hover:text-foreground'
              }
            `}
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
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-md border border-border bg-card text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground transition-all duration-150"
            // BACKEND INTEGRATION POINT: GET /api/reports/export?tab=activeTab&...filters → returns CSV
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
            {/* Date From */}
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1">
                Date From
              </label>
              <input
                type="date"
                value={filters.dateFrom}
                onChange={(e) => handleFilterChange('dateFrom', e.target.value)}
                className="h-8 px-2 rounded-md border border-input bg-card text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>

            {/* Date To */}
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1">
                Date To
              </label>
              <input
                type="date"
                value={filters.dateTo}
                onChange={(e) => handleFilterChange('dateTo', e.target.value)}
                className="h-8 px-2 rounded-md border border-input bg-card text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>

            {/* Collector — hidden for agents (they only have their own data) */}
            {user?.role !== 'agent' && (
              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1">
                  Collector
                </label>
                <select
                  value={filters.agentCode}
                  onChange={(e) => handleFilterChange('agentCode', e.target.value)}
                  className="h-8 px-2 rounded-md border border-input bg-card text-sm focus:outline-none focus:ring-2 focus:ring-ring min-w-[160px]"
                >
                  <option value="">{user?.role === 'supervisor' ? 'All My Agents' : 'All Collectors'}</option>
                  {scopedCollectors.map((c) => (
                    <option key={`filter-collector-${c.code}`} value={c.code}>
                      {c.name} ({c.code})
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Parlor */}
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1">
                Parlor
              </label>
              <select
                value={filters.parlorCode}
                onChange={(e) => handleFilterChange('parlorCode', e.target.value)}
                className="h-8 px-2 rounded-md border border-input bg-card text-sm focus:outline-none focus:ring-2 focus:ring-ring min-w-[180px]"
              >
                <option value="">All Parlors</option>
                {PARLORS_FILTER.map((p) => (
                  <option key={`filter-parlor-${p.code}`} value={p.code}>
                    {p.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Status */}
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1">
                Status
              </label>
              <select
                value={filters.status}
                onChange={(e) => handleFilterChange('status', e.target.value)}
                className="h-8 px-2 rounded-md border border-input bg-card text-sm focus:outline-none focus:ring-2 focus:ring-ring min-w-[140px]"
              >
                <option value="">All Statuses</option>
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
          { key: 'detailed' as ReportTab, label: 'Detailed Report', icon: FileText },
          { key: 'summary' as ReportTab, label: 'Summary Report', icon: BarChart2 },
        ].map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={`report-tab-${tab.key}`}
              onClick={() => setActiveTab(tab.key)}
              className={`
                flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 -mb-px
                transition-all duration-150
                ${
                  activeTab === tab.key
                    ? 'border-primary text-primary' :'border-transparent text-muted-foreground hover:text-foreground hover:border-border'
                }
              `}
            >
              <Icon size={14} />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Report Content */}
      <div className="flex-1 overflow-hidden">
        {activeTab === 'detailed' ? (
          <DetailedReport filters={filters} scopeAgentCodes={scopeAgentCodes} />
        ) : (
          <SummaryReport filters={filters} scopeAgentCodes={scopeAgentCodes} />
        )}
      </div>
    </div>
  );
}