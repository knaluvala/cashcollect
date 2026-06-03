'use client';
import React, { useMemo, useState, useEffect } from 'react';
import { BarChart2, FileText, Download, Filter, X, RefreshCw } from 'lucide-react';
import DetailedReport from './DetailedReport';
import SummaryReport from './SummaryReport';
import { COLLECTORS, PARLORS_FILTER, getAgentSupervisor } from './reportsMockData';
import { useAuth } from '@/context/AuthContext';
import { toast } from 'sonner';

const API_BASE = '/api';

export interface ReportFilters {
  dateFrom: string;
  dateTo: string;
  agentCode: string;
  parlorCode: string;
  status: string;
}

export interface DBCollection {
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
  status: 'entered' | 'submitted' | 'acknowledged';
  submittedAt: string | null;
  acknowledgedAt: string | null;
  acknowledgedBy: string | null;
}

function todayStr() {
  return new Date().toISOString().split('T')[0];
}
function thirtyDaysAgoStr() {
  const d = new Date();
  d.setDate(d.getDate() - 30);
  return d.toISOString().split('T')[0];
}

export default function ReportsContent() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'detailed' | 'summary'>('detailed');
  const [filters, setFilters] = useState<ReportFilters>({
    dateFrom: thirtyDaysAgoStr(),
    dateTo: todayStr(),
    agentCode: '',
    parlorCode: '',
    status: '',
  });
  const [showFilters, setShowFilters] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [data, setData] = useState<DBCollection[]>([]);

  const scopeAgentCodes = useMemo<string[] | null>(() => {
    if (!user || user.role === 'superadmin') return null;
    if (user.role === 'agent' && user.agentCode) return [user.agentCode];
    if (user.role === 'supervisor' && user.supervisorCode) {
      const sup = user.supervisorCode;
      return COLLECTORS
        .filter((c) => getAgentSupervisor(c.code).code === sup)
        .map((c) => c.code);
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
      dateFrom: thirtyDaysAgoStr(),
      dateTo: todayStr(),
      agentCode: '',
      parlorCode: '',
      status: '',
    });
  };

  const activeFilterCount = [filters.agentCode, filters.parlorCode, filters.status].filter(Boolean).length;

  const fetchData = async () => {
    setIsRefreshing(true);
    try {
      const params = new URLSearchParams();
      params.set('dateFrom', filters.dateFrom);
      params.set('dateTo', filters.dateTo);
      if (filters.agentCode) params.set('agentCode', filters.agentCode);
      if (filters.parlorCode) params.set('parlorCode', filters.parlorCode);
      if (filters.status) params.set('status', filters.status);
      const res = await fetch(`${API_BASE}/collections/reports?${params.toString()}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const result = await res.json();
      const collections: DBCollection[] = result.collections ?? [];
      setData(collections);
    } catch (e) {
      console.error(e);
      toast.error('Failed to load reports');
    } finally {
      setIsRefreshing(false);
    }
  };

  // Fetch on filter change and initial load
  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters]);

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
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md border text-sm font-medium transition-all duration-150 ${
              showFilters
                ? 'bg-primary/10 text-primary border-primary/30'
                : 'bg-card text-muted-foreground border-border hover:bg-muted hover:text-foreground'
            }`}
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
            onClick={fetchData}
            disabled={isRefreshing}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-md border border-border bg-card text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground transition-all duration-150 disabled:opacity-50"
          >
            <RefreshCw size={14} className={isRefreshing ? 'animate-spin' : ''} />
            Refresh
          </button>
          <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-md border border-border bg-card text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground transition-all duration-150">
            <Download size={14} />
            Export CSV
          </button>
        </div>
      </div>

      {/* Filters Panel */}
      {showFilters && (
        <div className="px-6 py-4 border-b border-border bg-muted/30 shrink-0">
          <div className="flex flex-wrap items-end gap-4">
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1">Date From</label>
              <input
                type="date"
                value={filters.dateFrom}
                onChange={(e) => handleFilterChange('dateFrom', e.target.value)}
                className="h-8 px-2 rounded-md border border-input bg-card text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1">Date To</label>
              <input
                type="date"
                value={filters.dateTo}
                onChange={(e) => handleFilterChange('dateTo', e.target.value)}
                className="h-8 px-2 rounded-md border border-input bg-card text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
            {user?.role !== 'agent' && (
              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1">Collector</label>
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
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1">Parlor</label>
              <select
                value={filters.parlorCode}
                onChange={(e) => handleFilterChange('parlorCode', e.target.value)}
                className="h-8 px-2 rounded-md border border-input bg-card text-sm focus:outline-none focus:ring-2 focus:ring-ring min-w-[180px]"
              >
                <option value="">All Parlors</option>
                {PARLORS_FILTER.map((p) => (
                  <option key={`filter-parlor-${p.code}`} value={p.code}>{p.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1">Status</label>
              <select
                value={filters.status}
                onChange={(e) => handleFilterChange('status', e.target.value)}
                className="h-8 px-2 rounded-md border border-input bg-card text-sm focus:outline-none focus:ring-2 focus:ring-ring min-w-[140px]"
              >
                <option value="">All Statuses</option>
                <option value="entered">Entered</option>
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
          { key: 'detailed' as const, label: 'Detailed Report', icon: FileText },
          { key: 'summary' as const, label: 'Summary Report', icon: BarChart2 },
        ].map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={`report-tab-${tab.key}`}
              onClick={() => setActiveTab(tab.key)}
              className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition-all duration-150 ${
                activeTab === tab.key
                  ? 'border-primary text-primary'
                  : 'border-transparent text-muted-foreground hover:text-foreground hover:border-border'
              }`}
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
          <DetailedReport data={data} isLoading={isRefreshing} />
        ) : (
          <SummaryReport data={data} isLoading={isRefreshing} />
        )}
      </div>
    </div>
  );
}
