import React, { useState, useRef, useEffect, useCallback } from "react";
import * as XLSX from "@e965/xlsx";
import { toast } from "sonner";
import {
  Map,
  Plus,
  Trash2,
  Download,
  Upload,
  X,
  Search,
  ChevronRight,
  Store,
  Users,
  Shield,
  Loader2,
} from "lucide-react";

const API_BASE = "/api";

interface Parlor {
  code: string;
  name: string;
  type: "Mall" | "Standalone" | "Event" | "Kiosk" | "Cart";
}

interface RouteApi {
  id: number;
  routeCode: string;
  description: string;
  assignedAgent: string;
  agentCode: string;
  supervisorName: string;
  supervisorCode: string;
  parlors: { code: string }[];
}

interface UserLov {
  id: number;
  name: string;
  role: "agent" | "supervisor" | "superadmin";
  agentCode: string;
  status: string;
}

const TYPE_COLORS: Record<string, string> = {
  Mall: "bg-blue-100 text-blue-700",
  Standalone: "bg-slate-100 text-slate-600",
  Event: "bg-orange-100 text-orange-700",
  Kiosk: "bg-purple-100 text-purple-700",
  Cart: "bg-pink-100 text-pink-700",
};

export default function RouteMasterContent() {
  const [routes, setRoutes] = useState<RouteApi[]>([]);
  const [parlors, setParlors] = useState<Parlor[]>([]);
  const [agents, setAgents] = useState<UserLov[]>([]);
  const [supervisors, setSupervisors] = useState<UserLov[]>([]);
  const [selectedRouteId, setSelectedRouteId] = useState<number | null>(null);
  const [routeToDelete, setRouteToDelete] = useState<RouteApi | null>(null);
  const [addParlorOpen, setAddParlorOpen] = useState(false);
  const [newRouteOpen, setNewRouteOpen] = useState(false);
  const [parlorSearch, setParlorSearch] = useState("");
  const [routeSearch, setRouteSearch] = useState("");
  const [newRoute, setNewRoute] = useState({
    routeCode: "",
    description: "",
    assignedAgent: "",
    agentCode: "",
    supervisorName: "",
    supervisorCode: "",
  });
  const [loading, setLoading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const fetchRoutes = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(
        `${API_BASE}/routes?search=${encodeURIComponent(routeSearch)}`,
      );
      const data = await res.json();
      const routeList = data.routes || [];
      setRoutes(routeList);
      if (routeList.length > 0 && !selectedRouteId) {
        setSelectedRouteId(routeList[0].id);
      }
    } catch {
      toast.error("Failed to load routes");
    } finally {
      setLoading(false);
    }
  }, [routeSearch, selectedRouteId]);

  const fetchParlors = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE}/parlors`);
      const data = await res.json();
      const parlorList = (data.parlors || []).map((p: any) => ({
        code: p.parlorCode,
        name: p.parlorName,
        type: p.parlorType as Parlor["type"],
      }));
      setParlors(parlorList);
    } catch {
      // Silently ignore
    }
  }, []);

  const fetchUsersForLov = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE}/users`);
      const data = await res.json();
      const users: UserLov[] = data.users || [];

      setAgents(
        users.filter((u) => u.role === "agent" && u.status === "active"),
      );
      setSupervisors(
        users.filter((u) => u.role === "supervisor" && u.status === "active"),
      );
    } catch {
      toast.error("Failed to load users for route assignment");
    }
  }, []);

  useEffect(() => {
    fetchRoutes();
  }, [fetchRoutes]);

  useEffect(() => {
    fetchParlors();
  }, [fetchParlors]);

  useEffect(() => {
    fetchUsersForLov();
  }, [fetchUsersForLov]);

  const selectedRoute =
    routes.find((r) => r.id === selectedRouteId) ?? routes[0];

  const assignedParlorCodes = new Set(
    selectedRoute?.parlors.map((p) => p.code) ?? [],
  );

  const availableParlors = parlors.filter(
    (p) =>
      !assignedParlorCodes.has(p.code) &&
      (parlorSearch === "" ||
        p.code.toLowerCase().includes(parlorSearch.toLowerCase()) ||
        p.name.toLowerCase().includes(parlorSearch.toLowerCase())),
  );

  const filteredRoutes = routes.filter(
    (r) =>
      routeSearch === "" ||
      r.routeCode.toLowerCase().includes(routeSearch.toLowerCase()) ||
      r.description.toLowerCase().includes(routeSearch.toLowerCase()),
  );

  async function addParlorToRoute(parlor: Parlor) {
    if (!selectedRoute) return;
    try {
      const res = await fetch(
        `${API_BASE}/routes/${selectedRoute.id}/parlors`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ parlorCode: parlor.code }),
        },
      );
      if (res.ok) {
        toast.success(`${parlor.code} added to ${selectedRoute.routeCode}`);
        await fetchRoutes();
      } else {
        const data = await res.json();
        toast.error(data.error || "Failed to add parlor");
      }
    } catch {
      toast.error("Failed to add parlor");
    }
  }

  async function removeParlorFromRoute(parlorCode: string) {
    if (!selectedRoute) return;
    try {
      const res = await fetch(
        `${API_BASE}/routes/${selectedRoute.id}/parlors/${parlorCode}`,
        {
          method: "DELETE",
        },
      );
      if (res.ok) {
        toast.success(`${parlorCode} removed from ${selectedRoute.routeCode}`);
        await fetchRoutes();
      } else {
        toast.error("Failed to remove parlor");
      }
    } catch {
      toast.error("Failed to remove parlor");
    }
  }

  async function handleCreateRoute() {
    if (!newRoute.routeCode.trim()) {
      toast.error("Route code is required");
      return;
    }
    try {
      const res = await fetch(`${API_BASE}/routes`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          routeCode: newRoute.routeCode.trim().toUpperCase(),
          description: newRoute.description.trim() || "—",
          assignedAgent: newRoute.assignedAgent.trim() || "—",
          agentCode: newRoute.agentCode.trim() || "—",
          supervisorName: newRoute.supervisorName.trim() || "—",
          supervisorCode: newRoute.supervisorCode.trim() || "—",
        }),
      });
      if (res.ok) {
        const created = await res.json();
        toast.success(`Route ${created.routeCode} created`);
        setSelectedRouteId(created.id);
        setNewRouteOpen(false);
        setNewRoute({
          routeCode: "",
          description: "",
          assignedAgent: "",
          agentCode: "",
          supervisorName: "",
          supervisorCode: "",
        });
        await fetchRoutes();
      } else {
        const data = await res.json();
        toast.error(data.error || "Failed to create route");
      }
    } catch {
      toast.error("Failed to create route");
    }
  }

  async function handleDeleteRoute(id: number) {
    try {
      const res = await fetch(`${API_BASE}/routes/${id}`, {
        method: "DELETE",
        headers: { "X-Route-Delete-Confirmed": "true" },
      });
      if (res.ok) {
        toast.success("Route deleted");
        await fetchRoutes();
      } else {
        toast.error("Failed to delete route");
      }
    } catch {
      toast.error("Failed to delete route");
    }
  }

  function downloadTemplate() {
    const ws = XLSX.utils.aoa_to_sheet([
      ["Route Code", "Parlor Code", "Parlor Name", "Type"],
      ["RT-04", "PRL-001", "Nexus Mall — Koramangala", "Mall"],
      ["RT-04", "PRL-007", "Forum Value Mall", "Mall"],
      ["RT-05", "PRL-044", "Koramangala 5th Block Kiosk", "Kiosk"],
    ]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Route Master");
    XLSX.writeFile(wb, "cashcollect_route_master_template.xlsx");
    toast.success("Template downloaded");
  }

  async function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (ev) => {
      try {
        const wb = XLSX.read(ev.target?.result, { type: "binary" });
        const ws = wb.Sheets[wb.SheetNames[0]];
        const rows = XLSX.utils.sheet_to_json<Record<string, string>>(ws, {
          defval: "",
        });
        for (const row of rows) {
          const rc = String(row["Route Code"] || "")
            .trim()
            .toUpperCase();
          const pc = String(row["Parlor Code"] || "")
            .trim()
            .toUpperCase();
          if (!rc || !pc) continue;
          // Ensure route exists
          const routesRes = await fetch(`${API_BASE}/routes`);
          const routesData = await routesRes.json();
          const route = (routesData.routes || []).find(
            (r: any) => r.routeCode === rc,
          );
          let routeId: number;
          if (!route) {
            const createRes = await fetch(`${API_BASE}/routes`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                routeCode: rc,
                description: "—",
                assignedAgent: "—",
                agentCode: "—",
                supervisorName: "—",
                supervisorCode: "—",
              }),
            });
            const created = await createRes.json();
            routeId = created.id;
          } else {
            routeId = route.id;
          }
          // Add parlor to route
          await fetch(`${API_BASE}/routes/${routeId}/parlors`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ parlorCode: pc }),
          });
        }
        toast.success(`Upload complete — ${rows.length} rows processed`);
        await fetchRoutes();
      } catch {
        toast.error("Failed to read file — check the format");
      }
    };
    reader.readAsBinaryString(file);
    e.target.value = "";
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-border shrink-0">
        <div>
          <h1 className="text-xl font-semibold text-foreground">
            Route Master
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Manage route codes and their assigned parlors
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={downloadTemplate}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-md border border-border bg-card text-sm text-muted-foreground hover:text-foreground hover:bg-muted transition-all duration-150"
          >
            <Download size={14} />
            Template
          </button>
          <button
            onClick={() => fileRef.current?.click()}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-md border border-border bg-card text-sm text-muted-foreground hover:text-foreground hover:bg-muted transition-all duration-150"
          >
            <Upload size={14} />
            Upload
          </button>
          <input
            ref={fileRef}
            type="file"
            accept=".xlsx,.xls,.csv"
            className="hidden"
            onChange={handleFileUpload}
          />
          <button
            onClick={() => setNewRouteOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-all duration-150"
          >
            <Plus size={14} />
            New Route
          </button>
        </div>
      </div>

      {/* Stats strip */}
      <div className="flex items-stretch border-b border-border shrink-0">
        {[
          {
            label: "Total Routes",
            value: routes.length,
            icon: Map,
            color: "text-primary",
            bg: "bg-primary/5",
          },
          {
            label: "Total Parlors",
            value: routes.reduce((s, r) => s + r.parlors.length, 0),
            icon: Store,
            color: "text-accent",
            bg: "bg-accent/5",
          },
          {
            label: "Avg Parlors / Route",
            value: routes.length
              ? (
                  routes.reduce((s, r) => s + r.parlors.length, 0) /
                  routes.length
                ).toFixed(1)
              : "0",
            icon: null,
            color: "text-foreground",
            bg: "bg-muted/30",
          },
          {
            label: "Unassigned Parlors",
            value: parlors.filter(
              (p) =>
                !routes.some((r) => r.parlors.some((rp) => rp.code === p.code)),
            ).length,
            icon: null,
            color: "text-amber-600",
            bg: "bg-amber-50",
          },
        ].map((s) => {
          const Icon = s.icon;
          return (
            <div
              key={s.label}
              className={`flex-1 px-5 py-3 border-r border-border last:border-r-0 ${s.bg}`}
            >
              <div className="flex items-center gap-1.5 mb-0.5">
                {Icon && <Icon size={12} className={s.color} />}
                <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wide">
                  {s.label}
                </p>
              </div>
              <p className={`text-xl font-bold tabular-nums ${s.color}`}>
                {s.value}
              </p>
            </div>
          );
        })}
      </div>

      {/* Split Panel */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left: Route List */}
        <aside className="w-72 shrink-0 border-r border-border flex flex-col overflow-hidden">
          <div className="p-3 border-b border-border">
            <div className="relative">
              <Search
                size={13}
                className="absolute left-2.5 top-2 text-muted-foreground"
              />
              <input
                value={routeSearch}
                onChange={(e) => setRouteSearch(e.target.value)}
                placeholder="Search routes…"
                className="w-full pl-7 pr-3 py-1.5 text-sm border border-border rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
            </div>
          </div>
          <ul className="flex-1 overflow-y-auto scrollbar-thin py-1">
            {loading && (
              <li className="flex items-center justify-center py-8">
                <Loader2
                  size={18}
                  className="animate-spin text-muted-foreground"
                />
              </li>
            )}
            {filteredRoutes.map((route) => (
              <li key={route.id}>
                <div
                  onClick={() => setSelectedRouteId(route.id)}
                  className={`w-full text-left px-4 py-3 transition-colors border-b border-border/60 last:border-0 cursor-pointer ${
                    selectedRouteId === route.id
                      ? "bg-primary/10 border-l-2 border-l-primary"
                      : "hover:bg-muted/40 border-l-2 border-l-transparent"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span
                      className={`text-sm font-bold font-mono ${selectedRouteId === route.id ? "text-primary" : "text-foreground"}`}
                    >
                      {route.routeCode}
                    </span>
                    <div className="flex items-center gap-1">
                      <span className="text-[11px] font-medium bg-muted text-muted-foreground px-1.5 py-0.5 rounded-full">
                        {route.parlors.length} parlors
                      </span>
                      <ChevronRight
                        size={12}
                        className={
                          selectedRouteId === route.id
                            ? "text-primary"
                            : "text-muted-foreground"
                        }
                      />
                    </div>
                  </div>
                  <p className="text-[11px] text-muted-foreground mt-0.5 truncate">
                    {route.description}
                  </p>
                  <p className="text-[11px] text-muted-foreground mt-0.5">
                    <span className="font-medium">{route.assignedAgent}</span>
                    {" · "}
                    <span>{route.supervisorName}</span>
                  </p>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setRouteToDelete(route);
                    }}
                    className="mt-1 text-[11px] text-red-500 hover:text-red-700 transition-colors"
                  >
                    Delete route
                  </button>
                </div>
              </li>
            ))}
            {!loading && filteredRoutes.length === 0 && (
              <li className="px-4 py-8 text-center text-sm text-muted-foreground">
                {routeSearch ? "No routes match" : "No routes yet"}
              </li>
            )}
          </ul>
        </aside>

        {/* Right: Route Detail */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {selectedRoute && (
            <>
              {/* Route Info Header */}
              <div className="px-6 py-4 border-b border-border bg-muted/20 shrink-0">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-lg font-bold font-mono text-primary">
                        {selectedRoute.routeCode}
                      </span>
                      <span className="text-sm text-muted-foreground">
                        {selectedRoute.description}
                      </span>
                    </div>
                    <div className="flex items-center gap-4 mt-1.5">
                      <span className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Users size={11} />
                        Agent:{" "}
                        <span className="font-medium text-foreground ml-0.5">
                          {selectedRoute.assignedAgent}
                        </span>
                        <span className="font-mono text-[11px]">
                          ({selectedRoute.agentCode})
                        </span>
                      </span>
                      <span className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Shield size={11} />
                        Supervisor:{" "}
                        <span className="font-medium text-foreground ml-0.5">
                          {selectedRoute.supervisorName}
                        </span>
                        <span className="font-mono text-[11px]">
                          ({selectedRoute.supervisorCode})
                        </span>
                      </span>
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      setParlorSearch("");
                      setAddParlorOpen(true);
                    }}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-all duration-150"
                  >
                    <Plus size={13} />
                    Add Parlor
                  </button>
                </div>
              </div>

              {/* Parlors Table */}
              <div className="flex-1 overflow-y-auto scrollbar-thin">
                {selectedRoute.parlors.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-48 gap-3">
                    <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
                      <Store size={18} className="text-muted-foreground" />
                    </div>
                    <p className="text-sm text-muted-foreground">
                      No parlors assigned to this route
                    </p>
                    <button
                      onClick={() => setAddParlorOpen(true)}
                      className="text-sm text-primary hover:underline"
                    >
                      Add the first parlor
                    </button>
                  </div>
                ) : (
                  <table className="w-full text-sm">
                    <thead className="sticky top-0 bg-muted/80 backdrop-blur-sm border-b border-border z-10">
                      <tr>
                        <th className="text-left px-5 py-2.5 text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                          #
                        </th>
                        <th className="text-left px-5 py-2.5 text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                          Parlor Code
                        </th>
                        <th className="text-left px-5 py-2.5 text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                          Parlor Name
                        </th>
                        <th className="text-left px-5 py-2.5 text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                          Type
                        </th>
                        <th className="px-5 py-2.5 w-16" />
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {selectedRoute.parlors.map((parlor, idx) => {
                        const parlorInfo = parlors.find(
                          (p) => p.code === parlor.code,
                        );
                        return (
                          <tr
                            key={parlor.code}
                            className="hover:bg-muted/30 transition-colors group"
                          >
                            <td className="px-5 py-3 text-xs text-muted-foreground tabular-nums">
                              {idx + 1}
                            </td>
                            <td className="px-5 py-3">
                              <span className="font-mono text-xs font-semibold text-foreground bg-muted px-2 py-0.5 rounded">
                                {parlor.code}
                              </span>
                            </td>
                            <td className="px-5 py-3 text-sm text-foreground">
                              {parlorInfo?.name || parlor.code}
                            </td>
                            <td className="px-5 py-3">
                              <span
                                className={`text-[11px] font-medium px-2 py-0.5 rounded-full ${TYPE_COLORS[parlorInfo?.type || "Standalone"]}`}
                              >
                                {parlorInfo?.type || "Standalone"}
                              </span>
                            </td>
                            <td className="px-5 py-3">
                              <button
                                onClick={() =>
                                  removeParlorFromRoute(parlor.code)
                                }
                                className="opacity-0 group-hover:opacity-100 flex items-center gap-1 px-2 py-1 rounded-md text-xs text-red-600 hover:bg-red-50 border border-transparent hover:border-red-200 transition-all"
                              >
                                <Trash2 size={11} />
                                Remove
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                )}
              </div>

              {/* Footer count */}
              {selectedRoute.parlors.length > 0 && (
                <div className="px-5 py-2.5 border-t border-border bg-muted/20 shrink-0">
                  <p className="text-xs text-muted-foreground">
                    <span className="font-semibold text-foreground">
                      {selectedRoute.parlors.length}
                    </span>{" "}
                    parlors assigned to {selectedRoute.routeCode}
                  </p>
                </div>
              )}
            </>
          )}
          {!selectedRoute && !loading && (
            <div className="flex flex-col items-center justify-center h-full gap-3">
              <p className="text-sm text-muted-foreground">No route selected</p>
              <button
                onClick={() => setNewRouteOpen(true)}
                className="text-sm text-primary hover:underline"
              >
                Create a new route
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Add Parlor Modal */}
      {addParlorOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-foreground/40 backdrop-blur-sm">
          <div className="bg-card rounded-xl shadow-xl w-full max-w-md border border-border flex flex-col max-h-[70vh]">
            <div className="flex items-center justify-between px-5 py-4 border-b border-border shrink-0">
              <div>
                <h2 className="text-base font-semibold text-foreground">
                  Add Parlor to {selectedRoute?.routeCode}
                </h2>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Select a parlor to assign to this route
                </p>
              </div>
              <button
                onClick={() => setAddParlorOpen(false)}
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                <X size={18} />
              </button>
            </div>
            <div className="px-4 py-3 border-b border-border shrink-0">
              <div className="relative">
                <Search
                  size={13}
                  className="absolute left-2.5 top-2 text-muted-foreground"
                />
                <input
                  autoFocus
                  value={parlorSearch}
                  onChange={(e) => setParlorSearch(e.target.value)}
                  placeholder="Search by code or name…"
                  className="w-full pl-7 pr-3 py-1.5 text-sm border border-border rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-primary/30"
                />
              </div>
            </div>
            <div className="flex-1 overflow-y-auto scrollbar-thin">
              {parlors.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-10 gap-2">
                  <p className="text-sm text-muted-foreground">
                    No parlors found in Parlor Master.
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Add parlors in the Parlor Master first.
                  </p>
                </div>
              ) : (
                <ul className="divide-y divide-border">
                  {parlors
                    .filter(
                      (p) =>
                        parlorSearch === "" ||
                        p.code
                          .toLowerCase()
                          .includes(parlorSearch.toLowerCase()) ||
                        p.name
                          .toLowerCase()
                          .includes(parlorSearch.toLowerCase()),
                    )
                    .map((p) => {
                      const alreadyAssigned = assignedParlorCodes.has(p.code);
                      return (
                        <li key={p.code}>
                          <button
                            disabled={alreadyAssigned}
                            onClick={() => {
                              if (alreadyAssigned) return;
                              addParlorToRoute(p);
                              setAddParlorOpen(false);
                              setParlorSearch("");
                            }}
                            className={`w-full text-left flex items-center justify-between px-5 py-3 transition-colors ${
                              alreadyAssigned
                                ? "bg-muted/30 cursor-not-allowed opacity-60"
                                : "hover:bg-muted/40"
                            }`}
                          >
                            <div className="flex items-center gap-2">
                              <span className="font-mono text-xs font-semibold text-muted-foreground">
                                {p.code}
                              </span>
                              <span
                                className={`text-sm ${alreadyAssigned ? "text-muted-foreground" : "text-foreground"}`}
                              >
                                {p.name}
                              </span>
                              {alreadyAssigned && (
                                <span className="text-[10px] font-medium bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded-full">
                                  Already assigned
                                </span>
                              )}
                            </div>
                            <span
                              className={`text-[11px] font-medium px-2 py-0.5 rounded-full ${TYPE_COLORS[p.type]}`}
                            >
                              {p.type}
                            </span>
                          </button>
                        </li>
                      );
                    })}
                </ul>
              )}
            </div>
          </div>
        </div>
      )}

      {/* New Route Modal */}
      {newRouteOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-foreground/40 backdrop-blur-sm">
          <div className="bg-card rounded-xl shadow-xl w-full max-w-md border border-border">
            <div className="flex items-center justify-between px-5 py-4 border-b border-border">
              <h2 className="text-base font-semibold text-foreground">
                Create New Route
              </h2>
              <button
                onClick={() => setNewRouteOpen(false)}
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                <X size={18} />
              </button>
            </div>
            <div className="px-5 py-4 space-y-3">
              {[
                {
                  label: "Route Code *",
                  key: "routeCode",
                  placeholder: "e.g. RT-08",
                },
                {
                  label: "Description",
                  key: "description",
                  placeholder: "e.g. West Bengaluru — Rajajinagar",
                },
              ].map(({ label, key, placeholder }) => (
                <div key={key} className="flex flex-col gap-1">
                  <label className="text-xs font-medium text-muted-foreground">
                    {label}
                  </label>
                  <input
                    value={newRoute[key as keyof typeof newRoute]}
                    onChange={(e) =>
                      setNewRoute((prev) => ({
                        ...prev,
                        [key]: e.target.value,
                      }))
                    }
                    placeholder={placeholder}
                    className="px-3 py-2 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                  />
                </div>
              ))}

              <div className="flex flex-col gap-1">
                <label className="text-xs font-medium text-muted-foreground">
                  Assigned Agent *
                </label>
                <select
                  value={newRoute.agentCode}
                  onChange={(e) => {
                    const selected = agents.find(
                      (a) => a.agentCode === e.target.value,
                    );
                    setNewRoute((prev) => ({
                      ...prev,
                      agentCode: selected?.agentCode ?? "",
                      assignedAgent: selected?.name ?? "",
                    }));
                  }}
                  className="px-3 py-2 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                >
                  <option value="">Select agent</option>
                  {agents.map((agent) => (
                    <option key={agent.id} value={agent.agentCode}>
                      {agent.name} ({agent.agentCode})
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-xs font-medium text-muted-foreground">
                  Supervisor *
                </label>
                <select
                  value={newRoute.supervisorCode}
                  onChange={(e) => {
                    const selected = supervisors.find(
                      (s) => s.agentCode === e.target.value,
                    );
                    setNewRoute((prev) => ({
                      ...prev,
                      supervisorCode: selected?.agentCode ?? "",
                      supervisorName: selected?.name ?? "",
                    }));
                  }}
                  className="px-3 py-2 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                >
                  <option value="">Select supervisor</option>
                  {supervisors.map((supervisor) => (
                    <option key={supervisor.id} value={supervisor.agentCode}>
                      {supervisor.name} ({supervisor.agentCode})
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div className="flex items-center justify-end gap-2 px-5 py-4 border-t border-border">
              <button
                onClick={() => setNewRouteOpen(false)}
                className="px-4 py-2 rounded-lg text-sm text-muted-foreground hover:bg-muted border border-border transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateRoute}
                className="px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors"
              >
                Create Route
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Route Confirmation */}
      {routeToDelete && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-foreground/40 backdrop-blur-sm"
          role="presentation"
        >
          <div
            className="bg-card rounded-xl shadow-xl w-full max-w-md border border-border"
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="delete-route-title"
            aria-describedby="delete-route-description"
          >
            <div className="px-5 py-4 border-b border-border">
              <h2
                id="delete-route-title"
                className="text-base font-semibold text-foreground"
              >
                Delete route?
              </h2>
            </div>
            <div className="px-5 py-4">
              <p
                id="delete-route-description"
                className="text-sm text-muted-foreground"
              >
                Delete route{" "}
                <span className="font-semibold text-foreground">
                  {routeToDelete.routeCode}
                </span>
                ? This action cannot be undone.
              </p>
            </div>
            <div className="flex items-center justify-end gap-2 px-5 py-4 border-t border-border">
              <button
                onClick={() => setRouteToDelete(null)}
                className="px-4 py-2 rounded-lg text-sm text-muted-foreground hover:bg-muted border border-border transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={async () => {
                  const routeId = routeToDelete.id;
                  setRouteToDelete(null);
                  await handleDeleteRoute(routeId);
                }}
                className="px-4 py-2 rounded-lg bg-destructive text-destructive-foreground text-sm font-medium hover:bg-destructive/90 transition-colors"
              >
                Delete route
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
