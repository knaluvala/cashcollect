"use client";
import React, { useState, useMemo, useEffect } from "react";
import {
  Calendar,
  RefreshCw,
  Users,
  CheckSquare,
  AlertCircle,
  Plus,
  ArrowLeft,
} from "lucide-react";
import { toast } from "sonner";
import ParlorList from "./ParlorList";
import CollectionEntryForm from "./CollectionEntryForm";
import SupervisorAcknowledgePanel from "./SupervisorAcknowledgePanel";
import NewEntryModal from "./NewEntryModal";
import { ParlorEntry, CollectionStatus } from "./types";
import { useAuth } from "@/context/AuthContext";

import { API_BASE } from "@/lib/apiBase";

function todayStr() {
  return new Date().toISOString().split("T")[0];
}

function fmtDBDate(s: string) {
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

function numVal(v: string | number | null) {
  if (v === null || v === undefined) return null;
  const n = typeof v === "string" ? parseFloat(v) : v;
  return Number.isNaN(n) ? null : n;
}

type ViewMode = "agent" | "supervisor";

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
  status: CollectionStatus;
  submittedAt: string | null;
  acknowledgedAt: string | null;
  acknowledgedBy: string | null;
}

export default function DailyCollectionContent() {
  const { user } = useAuth();

  const role = user?.role ?? "agent";
  const agentCode = user?.agentCode;
  const supervisorCode =
    role === "supervisor" ? user?.agentCode : user?.supervisorCode;

  const [viewMode, setViewMode] = useState<ViewMode>(
    role === "supervisor" ? "supervisor" : "agent",
  );
  const [selectedDate, setSelectedDate] = useState(todayStr());
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [newEntryOpen, setNewEntryOpen] = useState(false);

  // Mobile navigation state to toggle between list and details view
  const [mobileShowDetails, setMobileShowDetails] = useState(false);

  // Base parlors (static from mockData)
  const [baseParlors, setBaseParlors] = useState<ParlorEntry[]>([]);

  useEffect(() => {
    async function loadAssignedParlors() {
      try {
        const res = await fetch(`${API_BASE}/routes`);
        const data = await res.json();

        const routes = data.routes ?? [];

        const scopedRoutes = routes.filter((r: any) => {
          if (role === "agent") return r.agentCode === agentCode;
          if (role === "supervisor") return r.supervisorCode === supervisorCode;
          return true;
        });

        const parlorRes = await fetch(`${API_BASE}/parlors`);
        const parlorData = await parlorRes.json();
        const allParlors = parlorData.parlors ?? [];

        const mapped: ParlorEntry[] = scopedRoutes.flatMap((route: any) =>
          route.parlors.map((rp: any) => {
            const master = allParlors.find(
              (p: any) => p.parlorCode === rp.code,
            );

            return {
              id: `${route.routeCode}-${rp.code}`,
              parlorCode: rp.code,
              parlorName: master?.parlorName ?? rp.code,
              parlorType: master?.parlorType ?? "Standalone",
              routeCode: route.routeCode,
              agentCode: route.agentCode,
              agentName: route.assignedAgent,
              supervisorCode: route.supervisorCode,
              supervisorName: route.supervisorName,
              status: "pending",
              cashAmount: null,
              couponAmount: null,
              ccAmount: null,
              notes: "",
              submittedAt: null,
              acknowledgedAt: null,
              acknowledgedBy: null,
            };
          }),
        );

        setBaseParlors(mapped);
      } catch (e) {
        console.error(e);
        toast.error("Failed to load assigned parlors");
        setBaseParlors([]);
      }
    }

    loadAssignedParlors();
  }, [role, agentCode, supervisorCode]);

  const [parlors, setParlors] = useState<ParlorEntry[]>([]);
  const [activeParlorId, setActiveParlorId] = useState<string>("");
  const selectedParlor =
    parlors.find((p) => p.id === activeParlorId) ?? parlors[0];

  const refreshData = async () => {
    setIsRefreshing(true);
    try {
      const params = new URLSearchParams();
      params.set("date", selectedDate);
      if (role === "agent" && agentCode) {
        params.set("agentCode", agentCode);
      }
      const res = await fetch(
        `${API_BASE}/collections/list?${params.toString()}`,
      );
      if (!res.ok) {
        throw new Error(`HTTP ${res.status}`);
      }
      const data = await res.json();
      const collections: DBCollection[] = data.collections ?? [];

      const collMap = new Map(collections.map((c) => [c.parlorCode, c]));

      const merged: ParlorEntry[] = baseParlors
        .filter((p) => collMap.has(p.parlorCode))
        .map((p) => {
          const c = collMap.get(p.parlorCode)!;
          return {
            ...p,
            status: c.status,
            cashAmount: numVal(c.cashAmount),
            couponAmount: numVal(c.couponAmount),
            ccAmount: numVal(c.ccAmount),
            notes: c.notes,
            submittedAt: c.submittedAt ? fmtDBDate(c.submittedAt) : null,
            acknowledgedAt: c.acknowledgedAt
              ? fmtDBDate(c.acknowledgedAt)
              : null,
            acknowledgedBy: c.acknowledgedBy,
          };
        });
      setParlors(merged);
      toast.success(
        `Refreshed ${collections.length} collections for ${selectedDate}`,
      );
    } catch (e) {
      toast.error("Failed to refresh data");
      console.error(e);
    } finally {
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    if (baseParlors.length > 0) {
      refreshData();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedDate, baseParlors.length]);

  useEffect(() => {
    if (parlors.length > 0 && !activeParlorId) {
      setActiveParlorId(parlors[0].id);
    }
  }, [parlors, activeParlorId]);

  const headerSubtitle = useMemo(() => {
    if (!user) return "";
    if (role === "agent" && agentCode) {
      const route = parlors[0]?.routeCode ?? "";
      return `Route ${route} · Agent: ${user.name} (${agentCode})`;
    }
    if (role === "supervisor" && supervisorCode) {
      const routes = [...new Set(baseParlors.map((p) => p.routeCode))].join(
        ", ",
      );
      return `Supervisor: ${user.name} (${supervisorCode}) · Routes ${routes || "—"}`;
    }
    return `All Routes · Super Admin View`;
  }, [user, role, agentCode, supervisorCode, parlors, baseParlors]);

  const stats = {
    total: parlors.length,
    pending: parlors.filter((p) => p.status === "pending").length,
    entered: parlors.filter((p) => p.status === "entered").length,
    submitted: parlors.filter((p) => p.status === "submitted").length,
    acknowledged: parlors.filter((p) => p.status === "acknowledged").length,
  };

  const handleSaveEntry = (
    id: string,
    data: {
      cashAmount: number;
      couponAmount: number;
      ccAmount: number;
      notes: string;
    },
  ) => {
    setParlors((prev) =>
      prev.map((p) =>
        p.id === id
          ? { ...p, ...data, status: "entered" as CollectionStatus }
          : p,
      ),
    );
  };

  const handleSubmitEntry = (id: string) => {
    setParlors((prev) =>
      prev.map((p) =>
        p.id === id
          ? {
              ...p,
              status: "submitted" as CollectionStatus,
              submittedAt: fmtDBDate(new Date().toISOString()),
            }
          : p,
      ),
    );
  };

  const handleRefresh = async () => {
    await refreshData();
  };

  const canSeeAgentView = true;
  const canSeeSupervisorView = role !== "agent";

  const handleSelectParlor = (id: string) => {
    setActiveParlorId(id);
    setMobileShowDetails(true);
  };

  return (
    <div className="flex flex-col min-h-screen md:h-full md:overflow-hidden bg-background w-full">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between px-4 sm:px-6 py-3 border-b border-border bg-card shrink-0 gap-3">
        <div>
          <h1 className="text-lg sm:text-xl font-semibold text-foreground">
            Daily Collection Entry
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
            {headerSubtitle}
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {canSeeAgentView && canSeeSupervisorView && (
            <div className="flex rounded-lg border border-border bg-muted p-0.5 gap-0.5">
              {(["agent", "supervisor"] as ViewMode[]).map((mode) => (
                <button
                  key={`view-${mode}`}
                  onClick={() => setViewMode(mode)}
                  className={`
                    flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-md text-xs font-medium
                    transition-all duration-150
                    ${
                      viewMode === mode
                        ? "bg-card text-foreground shadow-sm border border-border"
                        : "text-muted-foreground hover:text-foreground"
                    }
                  `}
                >
                  {mode === "agent" ? (
                    <CheckSquare size={13} />
                  ) : (
                    <Users size={13} />
                  )}
                  {mode === "agent" ? "Agent View" : "Supervisor View"}
                </button>
              ))}
            </div>
          )}

          <div className="flex items-center gap-2 border border-border rounded-md px-2.5 sm:px-3 py-1.5 bg-card text-xs sm:text-sm">
            <Calendar size={14} className="text-muted-foreground shrink-0" />
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="bg-transparent text-xs sm:text-sm text-foreground focus:outline-none"
            />
          </div>

          <button
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-md border border-border bg-card text-xs sm:text-sm text-muted-foreground hover:text-foreground hover:bg-muted transition-all duration-150 disabled:opacity-50"
          >
            <RefreshCw
              size={14}
              className={isRefreshing ? "animate-spin" : ""}
            />
            Refresh
          </button>

          {viewMode === "agent" && (
            <button
              onClick={() => setNewEntryOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-primary text-primary-foreground text-xs sm:text-sm font-medium hover:bg-primary/90 transition-all duration-150"
            >
              <Plus size={14} />
              New Entry
            </button>
          )}
        </div>
      </div>

      {/* Stats Bar */}
      {viewMode === "agent" && (
        <div className="flex items-center gap-3 sm:gap-4 px-4 sm:px-6 py-2.5 border-b border-border bg-muted/40 shrink-0 overflow-x-auto whitespace-nowrap scrollbar-none">
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground shrink-0">
            <span className="font-semibold text-foreground">{stats.total}</span>
            Parlors Assigned
          </div>
          <div className="w-px h-4 bg-border shrink-0" />
          <div className="flex items-center gap-1.5 text-xs shrink-0">
            <span className="w-2 h-2 rounded-full bg-amber-400" />
            <span className="font-semibold text-amber-700">
              {stats.pending}
            </span>
            <span className="text-muted-foreground">Pending</span>
          </div>
          <div className="flex items-center gap-1.5 text-xs shrink-0">
            <span className="w-2 h-2 rounded-full bg-blue-400" />
            <span className="font-semibold text-blue-700">{stats.entered}</span>
            <span className="text-muted-foreground">Entered</span>
          </div>
          <div className="flex items-center gap-1.5 text-xs shrink-0">
            <span className="w-2 h-2 rounded-full bg-purple-400" />
            <span className="font-semibold text-purple-700">
              {stats.submitted}
            </span>
            <span className="text-muted-foreground">Submitted</span>
          </div>
          <div className="flex items-center gap-1.5 text-xs shrink-0">
            <span className="w-2 h-2 rounded-full bg-emerald-400" />
            <span className="font-semibold text-emerald-700">
              {stats.acknowledged}
            </span>
            <span className="text-muted-foreground">Acknowledged</span>
          </div>

          {stats.pending > 0 && (
            <>
              <div className="w-px h-4 bg-border shrink-0" />
              <div className="flex items-center gap-1.5 text-xs text-red-600 shrink-0">
                <AlertCircle size={13} />
                <span className="font-medium">
                  {stats.pending} parlor{stats.pending > 1 ? "s" : ""} not yet
                  collected
                </span>
              </div>
            </>
          )}
        </div>
      )}

      {/* New Entry Modal */}
      {newEntryOpen && (
        <NewEntryModal
          parlors={baseParlors}
          defaultDate={selectedDate}
          onClose={() => setNewEntryOpen(false)}
          onSaved={() => {
            refreshData();
          }}
        />
      )}

      {/* Main Content Area */}
      {viewMode === "agent" ? (
        <div className="flex flex-col md:flex-row flex-1 overflow-hidden w-full relative">
          {/* Parlor List - Full width on mobile when details view is hidden */}
          <div
            className={`w-full md:w-80 shrink-0 border-r-0 md:border-r border-border bg-card ${
              mobileShowDetails ? "hidden md:block" : "block"
            }`}
          >
            <ParlorList
              parlors={parlors}
              selectedId={activeParlorId}
              onSelect={handleSelectParlor}
            />
          </div>

          {/* Details Form Area - Full width on mobile when details view is active */}
          <div
            className={`w-full flex-1 overflow-y-auto bg-background p-4 sm:p-6 ${
              mobileShowDetails ? "block" : "hidden md:block"
            }`}
          >
            {/* Back Button for mobile */}
            <button
              onClick={() => setMobileShowDetails(false)}
              className="md:hidden flex items-center gap-2 mb-4 text-xs font-medium text-primary hover:underline"
            >
              <ArrowLeft size={16} />
              Back to Parlor List
            </button>

            {selectedParlor ? (
              <CollectionEntryForm
                parlor={selectedParlor}
                date={selectedDate}
                onSave={handleSaveEntry}
                onSubmit={handleSubmitEntry}
              />
            ) : (
              <div className="p-8 text-center text-xs text-muted-foreground">
                Select a parlor to view collection details.
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="flex-1 overflow-x-auto md:overflow-y-auto p-4 sm:p-6 w-full">
          <SupervisorAcknowledgePanel
            supervisorCode={supervisorCode}
            supervisorName={user?.name}
            selectedDate={selectedDate}
            onCreateNew={() => setNewEntryOpen(true)}
          />
        </div>
      )}
    </div>
  );
}
