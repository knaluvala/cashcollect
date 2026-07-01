"use client";
import React, { useState, useRef, useEffect } from "react";
import {
  Plus,
  Upload,
  Search,
  X,
  User,
  Mail,
  Route,
  Shield,
  CheckCircle,
  XCircle,
  MoreHorizontal,
  Download,
  Pencil,
  Trash2,
  ChevronUp,
  ChevronDown,
  Users,
  Loader2,
  KeyRound,
} from "lucide-react";
import { toast } from "sonner";
import * as XLSX from "@e965/xlsx";

const API_BASE = "/api";

type UserRole = "agent" | "supervisor";
type UserStatus = "active" | "inactive";

interface AppUser {
  id: number;
  name: string;
  email: string;
  role: UserRole;
  routeCode: string;
  agentCode: string;
  status: UserStatus;
  createdAt: string;
}

interface NewUserForm {
  name: string;
  email: string;
  role: UserRole;
  routeCode: string;
  agentCode: string;
}

const EMPTY_FORM: NewUserForm = {
  name: "",
  email: "",
  role: "agent",
  routeCode: "",
  agentCode: "",
};

type SortKey = "name" | "role" | "routeCode" | "status" | "createdAt";

function formatDate(dateStr: string): string {
  const d = new Date(dateStr);
  return d.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export default function UserManagementContent() {
  const [users, setUsers] = useState<AppUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterRole, setFilterRole] = useState<"all" | UserRole>("all");
  const [filterStatus, setFilterStatus] = useState<"all" | UserStatus>("all");
  const [sortKey, setSortKey] = useState<SortKey>("name");
  const [sortAsc, setSortAsc] = useState(true);

  const [modalOpen, setModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<AppUser | null>(null);
  const [form, setForm] = useState<NewUserForm>(EMPTY_FORM);
  const [formErrors, setFormErrors] = useState<Partial<NewUserForm>>({});
  const [isSaving, setIsSaving] = useState(false);
  const [resetUser, setResetUser] = useState<AppUser | null>(null);
  const [resetPassword, setResetPassword] = useState("");
  const [resetConfirmPassword, setResetConfirmPassword] = useState("");
  const [isResettingPassword, setIsResettingPassword] = useState(false);

  const [menuOpenId, setMenuOpenId] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  // Fetch users on mount
  useEffect(() => {
    let cancelled = false;
    async function load() {
      setIsLoading(true);
      try {
        const res = await fetch(
          `${API_BASE}/users?search=${encodeURIComponent(search)}`,
        );
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        if (!cancelled) setUsers(data.users ?? []);
      } catch {
        if (!cancelled) {
          toast.error("Failed to load users from server");
          setUsers([]);
        }
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [search]);

  const filtered = users
    .filter((u) => {
      const q = search.toLowerCase();
      return (
        u.name.toLowerCase().includes(q) ||
        u.email.toLowerCase().includes(q) ||
        u.agentCode.toLowerCase().includes(q) ||
        u.routeCode.toLowerCase().includes(q)
      );
    })
    .filter((u) => filterRole === "all" || u.role === filterRole)
    .filter((u) => filterStatus === "all" || u.status === filterStatus)
    .sort((a, b) => {
      const va = a[sortKey] ?? "";
      const vb = b[sortKey] ?? "";
      return sortAsc ? va.localeCompare(vb) : vb.localeCompare(va);
    });

  function toggleSort(key: SortKey) {
    if (sortKey === key) setSortAsc((v) => !v);
    else {
      setSortKey(key);
      setSortAsc(true);
    }
  }

  function openCreate() {
    setEditingUser(null);
    setForm(EMPTY_FORM);
    setFormErrors({});
    setModalOpen(true);
  }

  function openEdit(u: AppUser) {
    setEditingUser(u);
    setForm({
      name: u.name,
      email: u.email,
      role: u.role,
      routeCode: u.routeCode,
      agentCode: u.agentCode,
    });
    setFormErrors({});
    setMenuOpenId(null);
    setModalOpen(true);
  }

  function validate(): boolean {
    const errs: Partial<NewUserForm> = {};
    if (!form.name.trim()) errs.name = "Name is required";
    if (!form.email.trim()) errs.email = "Email is required";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email))
      errs.email = "Enter a valid email";
    if (!form.routeCode.trim()) errs.routeCode = "Route code is required";
    if (!form.agentCode.trim()) errs.agentCode = "User code is required";
    setFormErrors(errs);
    return Object.keys(errs).length === 0;
  }

  async function handleSave() {
    if (!validate()) return;
    setIsSaving(true);

    if (editingUser) {
      try {
        const res = await fetch(`${API_BASE}/users/${editingUser.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(form),
        });
        const result = await res.json();
        if (!res.ok) {
          toast.error(
            result.error?.[0]?.message ?? result.error ?? "Update failed",
          );
          setIsSaving(false);
          return;
        }
        setUsers((prev) =>
          prev.map((u) =>
            u.id === editingUser.id
              ? { ...u, ...form, updatedAt: result.updatedAt }
              : u,
          ),
        );
        toast.success(`Updated ${form.name}`);
      } catch {
        toast.error("Network error: could not update user");
        setIsSaving(false);
        return;
      }
    } else {
      try {
        const res = await fetch(`${API_BASE}/users`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ...form, status: "active" }),
        });
        const result = await res.json();
        if (!res.ok) {
          toast.error(
            result.error?.[0]?.message ?? result.error ?? "Create failed",
          );
          setIsSaving(false);
          return;
        }
        const newUser: AppUser = {
          id: result.id,
          ...form,
          status: "active",
          createdAt: result.createdAt,
        };
        setUsers((prev) => [newUser, ...prev]);
        toast.success(`Created user ${form.name}`);
      } catch {
        toast.error("Network error: could not create user");
        setIsSaving(false);
        return;
      }
    }

    setIsSaving(false);
    setModalOpen(false);
  }

  async function handleDelete(u: AppUser) {
    setMenuOpenId(null);
    try {
      const res = await fetch(`${API_BASE}/users/${u.id}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        const data = await res.json();
        toast.error(data.error ?? "Delete failed");
        return;
      }
      setUsers((prev) => prev.filter((x) => x.id !== u.id));
      toast.success(`Deleted ${u.name}`);
    } catch {
      toast.error("Network error: could not delete user");
    }
  }

  function openResetPassword(u: AppUser) {
    setResetUser(u);
    setResetPassword("");
    setResetConfirmPassword("");
  }

  async function handleResetPassword() {
    if (!resetUser) return;

    if (resetPassword.length < 8) {
      toast.error("Password must be at least 8 characters");
      return;
    }

    if (resetPassword !== resetConfirmPassword) {
      toast.error("Passwords do not match");
      return;
    }

    setIsResettingPassword(true);

    try {
      const res = await fetch(
        `${API_BASE}/users/${resetUser.id}/reset-password`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ newPassword: resetPassword }),
        },
      );

      const result = await res.json();

      if (!res.ok) {
        toast.error(result.error ?? "Password reset failed");
        return;
      }

      toast.success(`Password reset for ${resetUser.name}`);
      setResetUser(null);
      setResetPassword("");
      setResetConfirmPassword("");
    } catch {
      toast.error("Network error: could not reset password");
    } finally {
      setIsResettingPassword(false);
    }
  }

  async function toggleStatus(u: AppUser) {
    setMenuOpenId(null);
    const newStatus = u.status === "active" ? "inactive" : "active";
    try {
      const res = await fetch(`${API_BASE}/users/${u.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      const result = await res.json();
      if (!res.ok) {
        toast.error(
          result.error?.[0]?.message ?? result.error ?? "Update failed",
        );
        return;
      }
      setUsers((prev) =>
        prev.map((x) => (x.id === u.id ? { ...x, status: newStatus } : x)),
      );
      toast.success(`${u.name} marked as ${newStatus}`);
    } catch {
      toast.error("Network error: could not update status");
    }
  }

  async function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (ev) => {
      try {
        const data = new Uint8Array(ev.target?.result as ArrayBuffer);
        const wb = XLSX.read(data, { type: "array" });
        const ws = wb.Sheets[wb.SheetNames[0]];
        const rows: Record<string, string>[] = XLSX.utils.sheet_to_json(ws, {
          defval: "",
        });
        const imported: Omit<AppUser, "id" | "createdAt">[] = rows
          .map((row) => ({
            name: row["Name"] || row["name"] || "",
            email: row["Email"] || row["email"] || "",
            role: (
              row["Role"] ||
              row["role"] ||
              "agent"
            ).toLowerCase() as UserRole,
            routeCode:
              row["Route Code"] || row["routeCode"] || row["route"] || "",
            agentCode:
              row["User Code"] || row["agentCode"] || row["code"] || "",
            status: "active" as UserStatus,
          }))
          .filter((u) => u.name && u.email && u.agentCode);

        if (imported.length === 0) {
          toast.error(
            "No valid rows found. Check columns: Name, Email, Role, Route Code, User Code",
          );
          return;
        }

        let created = 0;
        let failed = 0;
        for (const u of imported) {
          try {
            const res = await fetch(`${API_BASE}/users`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(u),
            });
            if (res.ok) {
              const result = await res.json();
              setUsers((prev) => [
                { ...u, id: result.id, createdAt: result.createdAt } as AppUser,
                ...prev,
              ]);
              created++;
            } else {
              failed++;
            }
          } catch {
            failed++;
          }
        }

        if (created > 0)
          toast.success(`Imported ${created} user${created > 1 ? "s" : ""}`);
        if (failed > 0)
          toast.error(
            `${failed} row${failed > 1 ? "s" : ""} failed (duplicate email/code?)`,
          );
      } catch {
        toast.error("Failed to read file. Use .xlsx or .csv format.");
      }
    };
    reader.readAsArrayBuffer(file);
    e.target.value = "";
  }

  function downloadTemplate() {
    const ws = XLSX.utils.aoa_to_sheet([
      ["Name", "Email", "Role", "Route Code", "User Code"],
      ["Rajan Kumar", "rajan@cashcollect.in", "agent", "RT-04", "AGT-001"],
      [
        "Meena Sharma",
        "meena@cashcollect.in",
        "supervisor",
        "RT-04 & RT-05",
        "SUP-001",
      ],
    ]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Users");
    XLSX.writeFile(wb, "cashcollect_users_template.xlsx");
    toast.success("Template downloaded");
  }

  const SortIcon = ({ k }: { k: SortKey }) =>
    sortKey === k ? (
      sortAsc ? (
        <ChevronUp size={12} className="text-primary" />
      ) : (
        <ChevronDown size={12} className="text-primary" />
      )
    ) : (
      <ChevronDown size={12} className="text-muted-foreground/40" />
    );

  const stats = {
    total: users.length,
    agents: users.filter((u) => u.role === "agent").length,
    supervisors: users.filter((u) => u.role === "supervisor").length,
    active: users.filter((u) => u.status === "active").length,
  };

  return (
    <div className="flex flex-col h-full">
      {/* Page Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-border shrink-0">
        <div>
          <h1 className="text-xl font-semibold text-foreground">
            User Management
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Create and manage agent and supervisor accounts
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
            Upload Users
          </button>
          <input
            ref={fileRef}
            type="file"
            accept=".xlsx,.xls,.csv"
            className="hidden"
            onChange={handleFileUpload}
          />
          <button
            onClick={openCreate}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-md bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 active:scale-[0.98] transition-all duration-150"
          >
            <Plus size={14} />
            New User
          </button>
        </div>
      </div>

      {/* Stats Strip */}
      <div className="flex items-center gap-6 px-6 py-3 border-b border-border bg-muted/40 shrink-0">
        {[
          {
            label: "Total Users",
            value: stats.total,
            color: "text-foreground",
          },
          { label: "Agents", value: stats.agents, color: "text-blue-700" },
          {
            label: "Supervisors",
            value: stats.supervisors,
            color: "text-purple-700",
          },
          { label: "Active", value: stats.active, color: "text-emerald-700" },
        ].map((s, i) => (
          <React.Fragment key={s.label}>
            {i > 0 && <div className="w-px h-4 bg-border" />}
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <span className={`text-sm font-semibold ${s.color}`}>
                {s.value}
              </span>
              {s.label}
            </div>
          </React.Fragment>
        ))}
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3 px-6 py-3 border-b border-border shrink-0">
        <div className="flex items-center gap-2 flex-1 max-w-xs border border-border rounded-md px-2.5 py-1.5 bg-card">
          <Search size={13} className="text-muted-foreground shrink-0" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name, email, code..."
            className="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground focus:outline-none"
          />
          {search && (
            <button onClick={() => setSearch("")}>
              <X
                size={12}
                className="text-muted-foreground hover:text-foreground"
              />
            </button>
          )}
        </div>

        <div className="flex items-center gap-1 rounded-lg border border-border bg-muted p-0.5">
          {(["all", "agent", "supervisor"] as const).map((r) => (
            <button
              key={r}
              onClick={() => setFilterRole(r)}
              className={`px-3 py-1 rounded-md text-xs font-medium transition-all duration-150 ${
                filterRole === r
                  ? "bg-card text-foreground shadow-sm border border-border"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {r === "all"
                ? "All Roles"
                : r === "agent"
                  ? "Agents"
                  : "Supervisors"}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-1 rounded-lg border border-border bg-muted p-0.5">
          {(["all", "active", "inactive"] as const).map((s) => (
            <button
              key={s}
              onClick={() => setFilterStatus(s)}
              className={`px-3 py-1 rounded-md text-xs font-medium transition-all duration-150 ${
                filterStatus === s
                  ? "bg-card text-foreground shadow-sm border border-border"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {s === "all"
                ? "All Status"
                : s.charAt(0).toUpperCase() + s.slice(1)}
            </button>
          ))}
        </div>

        <span className="text-xs text-muted-foreground ml-auto">
          {filtered.length} of {users.length} user
          {users.length !== 1 ? "s" : ""}
        </span>
      </div>

      {/* Table */}
      <div className="flex-1 overflow-y-auto scrollbar-thin">
        {isLoading ? (
          <div className="flex items-center justify-center h-64 gap-2 text-muted-foreground">
            <Loader2 size={18} className="animate-spin" />
            <span className="text-sm">Loading users…</span>
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 gap-3">
            <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center">
              <Users size={20} className="text-muted-foreground" />
            </div>
            <p className="text-sm font-medium text-muted-foreground">
              No users found
            </p>
            <button
              onClick={openCreate}
              className="text-sm text-primary hover:underline"
            >
              Create your first user
            </button>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="sticky top-0 bg-muted/80 backdrop-blur-sm border-b border-border z-10">
              <tr>
                {(
                  [
                    { key: "name", label: "Name" },
                    { key: "role", label: "Role" },
                    { key: "routeCode", label: "Route" },
                    { key: "status", label: "Status" },
                    { key: "createdAt", label: "Created" },
                  ] as { key: SortKey; label: string }[]
                ).map((col) => (
                  <th
                    key={col.key}
                    onClick={() => toggleSort(col.key)}
                    className="text-left px-4 py-2.5 text-xs font-semibold text-muted-foreground uppercase tracking-wide cursor-pointer select-none hover:text-foreground transition-colors"
                  >
                    <span className="flex items-center gap-1">
                      {col.label}
                      <SortIcon k={col.key} />
                    </span>
                  </th>
                ))}
                <th className="px-4 py-2.5 w-10" />
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filtered.map((u) => (
                <tr
                  key={u.id}
                  className="hover:bg-muted/40 transition-colors group"
                >
                  {/* Name + email */}
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2.5">
                      <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center text-primary text-xs font-semibold shrink-0">
                        {u.name
                          .split(" ")
                          .map((n) => n[0])
                          .join("")
                          .slice(0, 2)
                          .toUpperCase()}
                      </div>
                      <div>
                        <p className="font-medium text-foreground">{u.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {u.email}
                        </p>
                      </div>
                    </div>
                  </td>
                  {/* Role */}
                  <td className="px-4 py-3">
                    <span
                      className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full ${
                        u.role === "supervisor"
                          ? "bg-purple-100 text-purple-700"
                          : "bg-blue-100 text-blue-700"
                      }`}
                    >
                      <Shield size={10} />
                      {u.role === "supervisor" ? "Supervisor" : "Agent"}
                    </span>
                  </td>
                  {/* Route */}
                  <td className="px-4 py-3">
                    <div>
                      <span className="font-mono text-xs text-foreground">
                        {u.routeCode}
                      </span>
                      <p className="text-[11px] text-muted-foreground mt-0.5">
                        {u.agentCode}
                      </p>
                    </div>
                  </td>
                  {/* Status */}
                  <td className="px-4 py-3">
                    <span
                      className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full ${
                        u.status === "active"
                          ? "bg-emerald-100 text-emerald-700"
                          : "bg-slate-100 text-slate-600"
                      }`}
                    >
                      {u.status === "active" ? (
                        <CheckCircle size={10} />
                      ) : (
                        <XCircle size={10} />
                      )}
                      {u.status === "active" ? "Active" : "Inactive"}
                    </span>
                  </td>
                  {/* Created */}
                  <td className="px-4 py-3 text-muted-foreground text-xs">
                    {formatDate(u.createdAt)}
                  </td>
                  {/* Actions */}
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => openEdit(u)}
                        className="flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-muted border border-transparent hover:border-border transition-all duration-150"
                        title="Edit user"
                      >
                        <Pencil size={12} />
                        Edit
                      </button>  
                      <button
                        onClick={() => openResetPassword(u)}
                        className="flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-muted border border-transparent hover:border-border transition-all duration-150"
                        title="Reset password"
                      >
                        <KeyRound size={12} />
                        Reset Password
                      </button>
                      <button
                        onClick={() => toggleStatus(u)}
                        className={`flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium border transition-all duration-150 ${
                          u.status === "active"
                            ? "text-amber-700 bg-amber-50 border-amber-200 hover:bg-amber-100"
                            : "text-emerald-700 bg-emerald-50 border-emerald-200 hover:bg-emerald-100"
                        }`}
                        title={
                          u.status === "active"
                            ? "Mark as inactive"
                            : "Mark as active"
                        }
                      >
                        {u.status === "active" ? (
                          <>
                            <XCircle size={12} /> Deactivate
                          </>
                        ) : (
                          <>
                            <CheckCircle size={12} /> Activate
                          </>
                        )}
                      </button>
                      <button
                        onClick={() => handleDelete(u)}
                        className="flex items-center justify-center w-7 h-7 rounded-md text-muted-foreground hover:text-red-600 hover:bg-red-50 border border-transparent hover:border-red-200 transition-all duration-150"
                        title="Delete user"
                      >
                        <Trash2 size={12} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Create / Edit Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-foreground/40 backdrop-blur-sm">
          <div className="w-full max-w-md bg-card rounded-2xl border border-border shadow-2xl">
            {/* Modal Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-border">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                  <User size={15} className="text-primary" />
                </div>
                <div>
                  <h2 className="text-sm font-semibold text-foreground">
                    {editingUser ? "Edit User" : "Create New User"}
                  </h2>
                  <p className="text-xs text-muted-foreground">
                    {editingUser
                      ? "Update user details and role"
                      : "Add a new agent or supervisor account"}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setModalOpen(false)}
                className="w-7 h-7 rounded-md flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
              >
                <X size={15} />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-5 space-y-4">
              {/* Role Selector */}
              <div>
                <label className="block text-xs font-medium text-foreground mb-1.5">
                  Role <span className="text-red-500">*</span>
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {(["agent", "supervisor"] as UserRole[]).map((r) => (
                    <button
                      key={r}
                      type="button"
                      onClick={() => setForm((f) => ({ ...f, role: r }))}
                      className={`flex items-center gap-2 px-3 py-2.5 rounded-lg border text-sm font-medium transition-all duration-150 ${
                        form.role === r
                          ? r === "agent"
                            ? "border-blue-400 bg-blue-50 text-blue-700"
                            : "border-purple-400 bg-purple-50 text-purple-700"
                          : "border-border text-muted-foreground hover:border-ring/50 hover:text-foreground"
                      }`}
                    >
                      <Shield size={14} />
                      {r === "agent" ? "Collection Agent" : "Supervisor"}
                    </button>
                  ))}
                </div>
              </div>

              {/* Name */}
              <div>
                <label className="block text-xs font-medium text-foreground mb-1">
                  Full Name <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <User
                    size={13}
                    className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground"
                  />
                  <input
                    value={form.name}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, name: e.target.value }))
                    }
                    placeholder="e.g. Rajan Kumar"
                    className={`w-full h-9 pl-7 pr-3 rounded-md border text-sm bg-card focus:outline-none focus:ring-2 focus:ring-ring focus:border-ring transition-all duration-150 ${formErrors.name ? "border-red-400" : "border-input"}`}
                  />
                </div>
                {formErrors.name && (
                  <p className="mt-0.5 text-[11px] text-red-500">
                    {formErrors.name}
                  </p>
                )}
              </div>

              {/* Email */}
              <div>
                <label className="block text-xs font-medium text-foreground mb-1">
                  Email Address <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <Mail
                    size={13}
                    className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground"
                  />
                  <input
                    type="email"
                    value={form.email}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, email: e.target.value }))
                    }
                    placeholder="e.g. rajan@cashcollect.in"
                    className={`w-full h-9 pl-7 pr-3 rounded-md border text-sm bg-card focus:outline-none focus:ring-2 focus:ring-ring focus:border-ring transition-all duration-150 ${formErrors.email ? "border-red-400" : "border-input"}`}
                  />
                </div>
                {formErrors.email && (
                  <p className="mt-0.5 text-[11px] text-red-500">
                    {formErrors.email}
                  </p>
                )}
              </div>

              {/* Route Code + User Code */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-foreground mb-1">
                    Route Code <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <Route
                      size={13}
                      className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground"
                    />
                    <input
                      value={form.routeCode}
                      onChange={(e) =>
                        setForm((f) => ({ ...f, routeCode: e.target.value }))
                      }
                      placeholder="RT-04"
                      className={`w-full h-9 pl-7 pr-3 rounded-md border text-sm bg-card focus:outline-none focus:ring-2 focus:ring-ring focus:border-ring transition-all duration-150 ${formErrors.routeCode ? "border-red-400" : "border-input"}`}
                    />
                  </div>
                  {formErrors.routeCode && (
                    <p className="mt-0.5 text-[11px] text-red-500">
                      {formErrors.routeCode}
                    </p>
                  )}
                </div>
                <div>
                  <label className="block text-xs font-medium text-foreground mb-1">
                    User Code <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <Shield
                      size={13}
                      className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground"
                    />
                    <input
                      value={form.agentCode}
                      onChange={(e) =>
                        setForm((f) => ({ ...f, agentCode: e.target.value }))
                      }
                      placeholder={
                        form.role === "agent" ? "AGT-001" : "SUP-001"
                      }
                      className={`w-full h-9 pl-7 pr-3 rounded-md border text-sm bg-card focus:outline-none focus:ring-2 focus:ring-ring focus:border-ring transition-all duration-150 ${formErrors.agentCode ? "border-red-400" : "border-input"}`}
                    />
                  </div>
                  {formErrors.agentCode && (
                    <p className="mt-0.5 text-[11px] text-red-500">
                      {formErrors.agentCode}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="flex items-center justify-end gap-2 px-5 py-4 border-t border-border">
              <button
                onClick={() => setModalOpen(false)}
                className="px-4 py-2 rounded-md border border-border bg-card text-sm font-medium text-foreground hover:bg-muted transition-all duration-150"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={isSaving}
                className="flex items-center gap-1.5 px-4 py-2 rounded-md bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 disabled:opacity-60 active:scale-[0.98] transition-all duration-150"
              >
                {isSaving && (
                  <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                )}
                {isSaving
                  ? "Saving…"
                  : editingUser
                    ? "Save Changes"
                    : "Create User"}
              </button>
            </div>
          </div>
        </div>
      )}
      {resetUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-foreground/40 backdrop-blur-sm">
          <div className="w-full max-w-md bg-card rounded-2xl border border-border shadow-2xl">
            <div className="flex items-center justify-between px-5 py-4 border-b border-border">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                  <KeyRound size={15} className="text-primary" />
                </div>
                <div>
                  <h2 className="text-sm font-semibold text-foreground">
                    Reset Password
                  </h2>
                  <p className="text-xs text-muted-foreground">
                    Set a new password for {resetUser.name}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setResetUser(null)}
                className="w-7 h-7 rounded-md flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
              >
                <X size={15} />
              </button>
            </div>

            <div className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-medium text-foreground mb-1">
                  New Password
                </label>
                <input
                  type="password"
                  value={resetPassword}
                  onChange={(e) => setResetPassword(e.target.value)}
                  placeholder="At least 8 characters"
                  className="w-full h-9 px-3 rounded-md border border-input bg-card text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-foreground mb-1">
                  Confirm New Password
                </label>
                <input
                  type="password"
                  value={resetConfirmPassword}
                  onChange={(e) => setResetConfirmPassword(e.target.value)}
                  placeholder="Re-enter new password"
                  className="w-full h-9 px-3 rounded-md border border-input bg-card text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 px-5 py-4 border-t border-border">
              <button
                onClick={() => setResetUser(null)}
                className="px-4 py-2 rounded-md border border-border bg-card text-sm font-medium text-foreground hover:bg-muted transition-all duration-150"
              >
                Cancel
              </button>
              <button
                onClick={handleResetPassword}
                disabled={isResettingPassword}
                className="flex items-center gap-1.5 px-4 py-2 rounded-md bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 disabled:opacity-60 active:scale-[0.98] transition-all duration-150"
              >
                {isResettingPassword && (
                  <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                )}
                {isResettingPassword ? "Resetting…" : "Reset Password"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
