'use client';
import React, { useState } from 'react';
import { Calendar, RefreshCw, Users, CheckSquare, AlertCircle, Plus } from 'lucide-react';
import ParlorList from './ParlorList';
import CollectionEntryForm from './CollectionEntryForm';
import SupervisorAcknowledgePanel from './SupervisorAcknowledgePanel';
import NewEntryModal from './NewEntryModal';
import {
  MOCK_PARLORS,
  ParlorEntry,
  CollectionStatus,
} from './mockData';

type ViewMode = 'agent' | 'supervisor';

export default function DailyCollectionContent() {
  const [viewMode, setViewMode] = useState<ViewMode>('agent');
  const [selectedDate, setSelectedDate] = useState('2026-05-08');
  const [parlors, setParlors] = useState<ParlorEntry[]>(MOCK_PARLORS);
  const [selectedParlorId, setSelectedParlorId] = useState<string>(
    MOCK_PARLORS[0].id
  );
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [newEntryOpen, setNewEntryOpen] = useState(false);

  const selectedParlor = parlors.find((p) => p.id === selectedParlorId)!;

  const stats = {
    total: parlors.length,
    pending: parlors.filter((p) => p.status === 'pending').length,
    entered: parlors.filter((p) => p.status === 'entered').length,
    submitted: parlors.filter((p) => p.status === 'submitted').length,
    acknowledged: parlors.filter((p) => p.status === 'acknowledged').length,
  };

  const handleSaveEntry = (
    id: string,
    data: {
      cashAmount: number;
      couponAmount: number;
      ccAmount: number;
      notes: string;
    }
  ) => {
    setParlors((prev) =>
      prev.map((p) =>
        p.id === id
          ? { ...p, ...data, status: 'entered' as CollectionStatus }
          : p
      )
    );
  };

  const handleSubmitEntry = (id: string) => {
    setParlors((prev) =>
      prev.map((p) =>
        p.id === id
          ? {
              ...p,
              status: 'submitted' as CollectionStatus,
              submittedAt: '08/05/2026 12:28',
            }
          : p
      )
    );
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    // BACKEND INTEGRATION POINT: GET /api/collections?agentId=AGT-042&date=selectedDate
    await new Promise((r) => setTimeout(r, 800));
    setIsRefreshing(false);
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-border bg-card shrink-0">
        <div>
          <h1 className="text-xl font-semibold text-foreground">
            Daily Collection Entry
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Route RT-04 · Agent: Rajan Kumar (AGT-042)
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* View Mode Toggle */}
          <div className="flex rounded-lg border border-border bg-muted p-0.5 gap-0.5">
            {(['agent', 'supervisor'] as ViewMode[]).map((mode) => (
              <button
                key={`view-${mode}`}
                onClick={() => setViewMode(mode)}
                className={`
                  flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium
                  transition-all duration-150
                  ${
                    viewMode === mode
                      ? 'bg-card text-foreground shadow-sm border border-border'
                      : 'text-muted-foreground hover:text-foreground'
                  }
                `}
              >
                {mode === 'agent' ? (
                  <CheckSquare size={13} />
                ) : (
                  <Users size={13} />
                )}
                {mode === 'agent' ? 'Agent View' : 'Supervisor View'}
              </button>
            ))}
          </div>

          {/* Date Picker */}
          <div className="flex items-center gap-2 border border-border rounded-md px-3 py-1.5 bg-card text-sm">
            <Calendar size={14} className="text-muted-foreground" />
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="bg-transparent text-sm text-foreground focus:outline-none"
            />
          </div>

          <button
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-md border border-border bg-card text-sm text-muted-foreground hover:text-foreground hover:bg-muted transition-all duration-150 disabled:opacity-50"
          >
            <RefreshCw
              size={14}
              className={isRefreshing ? 'animate-spin' : ''}
            />
            Refresh
          </button>

          <button
            onClick={() => setNewEntryOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 active:scale-[0.98] transition-all duration-150"
          >
            <Plus size={14} />
            New Entry
          </button>
        </div>
      </div>

      {/* Stats Bar */}
      <div className="flex items-center gap-4 px-6 py-3 border-b border-border bg-muted/40 shrink-0">
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <span className="font-semibold text-foreground">{stats.total}</span>
          Parlors Assigned
        </div>
        <div className="w-px h-4 bg-border" />
        <div className="flex items-center gap-1.5 text-xs">
          <span className="w-2 h-2 rounded-full bg-amber-400" />
          <span className="font-semibold text-amber-700">{stats.pending}</span>
          <span className="text-muted-foreground">Pending</span>
        </div>
        <div className="flex items-center gap-1.5 text-xs">
          <span className="w-2 h-2 rounded-full bg-blue-400" />
          <span className="font-semibold text-blue-700">{stats.entered}</span>
          <span className="text-muted-foreground">Entered</span>
        </div>
        <div className="flex items-center gap-1.5 text-xs">
          <span className="w-2 h-2 rounded-full bg-purple-400" />
          <span className="font-semibold text-purple-700">{stats.submitted}</span>
          <span className="text-muted-foreground">Submitted</span>
        </div>
        <div className="flex items-center gap-1.5 text-xs">
          <span className="w-2 h-2 rounded-full bg-emerald-400" />
          <span className="font-semibold text-emerald-700">{stats.acknowledged}</span>
          <span className="text-muted-foreground">Acknowledged</span>
        </div>

        {stats.pending > 0 && (
          <>
            <div className="w-px h-4 bg-border" />
            <div className="flex items-center gap-1.5 text-xs text-red-600">
              <AlertCircle size={13} />
              <span className="font-medium">
                {stats.pending} parlor{stats.pending > 1 ? 's' : ''} not yet collected
              </span>
            </div>
          </>
        )}
      </div>

      {/* New Entry Modal */}
      {newEntryOpen && (
        <NewEntryModal
          parlors={parlors}
          onClose={() => setNewEntryOpen(false)}
          onSaved={(id, data) => {
            setParlors((prev) =>
              prev.map((p) =>
                p.id === id ? { ...p, ...data, status: 'entered' as CollectionStatus } : p
              )
            );
          }}
          onSubmitted={(id) => {
            setParlors((prev) =>
              prev.map((p) =>
                p.id === id
                  ? { ...p, status: 'submitted' as CollectionStatus, submittedAt: '08/05/2026 12:28' }
                  : p
              )
            );
          }}
        />
      )}

      {/* Main Content */}
      {viewMode === 'agent' ? (
        <div className="flex flex-1 overflow-hidden">
          <ParlorList
            parlors={parlors}
            selectedId={selectedParlorId}
            onSelect={setSelectedParlorId}
          />
          <div className="flex-1 overflow-y-auto scrollbar-thin bg-background">
            <CollectionEntryForm
              parlor={selectedParlor}
              onSave={handleSaveEntry}
              onSubmit={handleSubmitEntry}
            />
          </div>
        </div>
      ) : (
        <div className="flex-1 overflow-y-auto scrollbar-thin">
          <SupervisorAcknowledgePanel />
        </div>
      )}
    </div>
  );
}