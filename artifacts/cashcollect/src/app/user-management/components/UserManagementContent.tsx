'use client';
import React, { useState, useRef } from 'react';
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
} from 'lucide-react';
import { toast } from 'sonner';
import * as XLSX from 'xlsx';

type UserRole = 'agent' | 'supervisor';
type UserStatus = 'active' | 'inactive';

interface AppUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  routeCode: string;
  agentCode: string;
  status: UserStatus;
  createdAt: string;
}

const MOCK_USERS: AppUser[] = [
  { id: 'u1', name: 'Rajan Kumar', email: 'rajan.kumar@cashcollect.in', role: 'agent', routeCode: 'RT-04', agentCode: 'AGT-042', status: 'active', createdAt: '01 Jan 2026' },
  { id: 'u2', name: 'Priya Nair', email: 'priya.nair@cashcollect.in', role: 'agent', routeCode: 'RT-05', agentCode: 'AGT-017', status: 'active', createdAt: '15 Jan 2026' },
  { id: 'u3', name: 'Arjun Mehta', email: 'arjun.mehta@cashcollect.in', role: 'agent', routeCode: 'RT-06', agentCode: 'AGT-033', status: 'inactive', createdAt: '20 Feb 2026' },
  { id: 'u4', name: 'Meena Sharma', email: 'meena.sharma@cashcollect.in', role: 'supervisor', routeCode: 'RT-04 & RT-05', agentCode: 'SUP-012', status: 'active', createdAt: '01 Jan 2026' },
  { id: 'u5', name: 'Vikram Patel', email: 'vikram.patel@cashcollect.in', role: 'supervisor', routeCode: 'RT-06 & RT-07', agentCode: 'SUP-008', status: 'active', createdAt: '10 Mar 2026' },
  { id: 'u6', name: 'Deepa Rao', email: 'deepa.rao@cashcollect.in', role: 'agent', routeCode: 'RT-07', agentCode: 'AGT-055', status: 'active', createdAt: '05 Apr 2026' },
];

interface NewUserForm {
  name: string;
  email: string;
  role: UserRole;
  routeCode: string;
  agentCode: string;
}

const EMPTY_FORM: NewUserForm = { name: '', email: '', role: 'agent', routeCode: '', agentCode: '' };

type SortKey = 'name' | 'role' | 'routeCode' | 'status' | 'createdAt';

export default function UserManagementContent() {
  const [users, setUsers] = useState<AppUser[]>(MOCK_USERS);
  const [search, setSearch] = useState('');
  const [filterRole, setFilterRole] = useState<'all' | UserRole>('all');
  const [filterStatus, setFilterStatus] = useState<'all' | UserStatus>('all');
  const [sortKey, setSortKey] = useState<SortKey>('name');
  const [sortAsc, setSortAsc] = useState(true);

  const [modalOpen, setModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<AppUser | null>(null);
  const [form, setForm] = useState<NewUserForm>(EMPTY_FORM);
  const [formErrors, setFormErrors] = useState<Partial<NewUserForm>>({});
  const [isSaving, setIsSaving] = useState(false);

  const [menuOpenId, setMenuOpenId] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

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
    .filter((u) => filterRole === 'all' || u.role === filterRole)
    .filter((u) => filterStatus === 'all' || u.status === filterStatus)
    .sort((a, b) => {
      const va = a[sortKey] ?? '';
      const vb = b[sortKey] ?? '';
      return sortAsc ? va.localeCompare(vb) : vb.localeCompare(va);
    });

  function toggleSort(key: SortKey) {
    if (sortKey === key) setSortAsc((v) => !v);
    else { setSortKey(key); setSortAsc(true); }
  }

  function openCreate() {
    setEditingUser(null);
    setForm(EMPTY_FORM);
    setFormErrors({});
    setModalOpen(true);
  }

  function openEdit(u: AppUser) {
    setEditingUser(u);
    setForm({ name: u.name, email: u.email, role: u.role, routeCode: u.routeCode, agentCode: u.agentCode });
    setFormErrors({});
    setMenuOpenId(null);
    setModalOpen(true);
  }

  function validate(): boolean {
    const errs: Partial<NewUserForm> = {};
    if (!form.name.trim()) errs.name = 'Name is required';
    if (!form.email.trim()) errs.email = 'Email is required';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) errs.email = 'Enter a valid email';
    if (!form.routeCode.trim()) errs.routeCode = 'Route code is required';
    if (!form.agentCode.trim()) errs.agentCode = 'User code is required';
    setFormErrors(errs);
    return Object.keys(errs).length === 0;
  }

  async function handleSave() {
    if (!validate()) return;
    setIsSaving(true);
    await new Promise((r) => setTimeout(r, 600));

    if (editingUser) {
      setUsers((prev) =>
        prev.map((u) =>
          u.id === editingUser.id ? { ...u, ...form } : u
        )
      );
      toast.success(`Updated ${form.name}`);
    } else {
      const newUser: AppUser = {
        id: `u${Date.now()}`,
        ...form,
        status: 'active',
        createdAt: new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
      };
      setUsers((prev) => [newUser, ...prev]);
      toast.success(`Created user ${form.name}`);
    }

    setIsSaving(false);
    setModalOpen(false);
  }

  function handleDelete(u: AppUser) {
    setMenuOpenId(null);
    setUsers((prev) => prev.filter((x) => x.id !== u.id));
    toast.success(`Deleted ${u.name}`);
  }

  function toggleStatus(u: AppUser) {
    setMenuOpenId(null);
    setUsers((prev) =>
      prev.map((x) =>
        x.id === u.id ? { ...x, status: x.status === 'active' ? 'inactive' : 'active' } : x
      )
    );
    toast.success(`${u.name} marked as ${u.status === 'active' ? 'inactive' : 'active'}`);
  }

  function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const data = new Uint8Array(ev.target?.result as ArrayBuffer);
        const wb = XLSX.read(data, { type: 'array' });
        const ws = wb.Sheets[wb.SheetNames[0]];
        const rows: Record<string, string>[] = XLSX.utils.sheet_to_json(ws, { defval: '' });
        const imported: AppUser[] = rows.map((row, i) => ({
          id: `import-${Date.now()}-${i}`,
          name: row['Name'] || row['name'] || '',
          email: row['Email'] || row['email'] || '',
          role: ((row['Role'] || row['role'] || 'agent').toLowerCase() as UserRole),
          routeCode: row['Route Code'] || row['routeCode'] || row['route'] || '',
          agentCode: row['User Code'] || row['agentCode'] || row['code'] || '',
          status: 'active' as UserStatus,
          createdAt: new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
        })).filter((u) => u.name && u.email);
        if (imported.length === 0) {
          toast.error('No valid rows found. Check columns: Name, Email, Role, Route Code, User Code');
        } else {
          setUsers((prev) => [...imported, ...prev]);
          toast.success(`Imported ${imported.length} user${imported.length > 1 ? 's' : ''}`);
        }
      } catch {
        toast.error('Failed to read file. Use .xlsx or .csv format.');
      }
    };
    reader.readAsArrayBuffer(file);
    e.target.value = '';
  }

  function downloadTemplate() {
    const ws = XLSX.utils.aoa_to_sheet([
      ['Name', 'Email', 'Role', 'Route Code', 'User Code'],
      ['Rajan Kumar', 'rajan@cashcollect.in', 'agent', 'RT-04', 'AGT-001'],
      ['Meena Sharma', 'meena@cashcollect.in', 'supervisor', 'RT-04 & RT-05', 'SUP-001'],
    ]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Users');
    XLSX.writeFile(wb, 'cashcollect_users_template.xlsx');
    toast.success('Template downloaded');
  }

  const SortIcon = ({ k }: { k: SortKey }) =>
    sortKey === k ? (
      sortAsc ? <ChevronUp size={12} className="text-primary" /> : <ChevronDown size={12} className="text-primary" />
    ) : (
      <ChevronDown size={12} className="text-muted-foreground/40" />
    );

  const stats = {
    total: users.length,
    agents: users.filter((u) => u.role === 'agent').length,
    supervisors: users.filter((u) => u.role === 'supervisor').length,
    active: users.filter((u) => u.status === 'active').length,
  };

  return (
    <div className="flex flex-col h-full">
      {/* Page Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-border shrink-0">
        <div>
          <h1 className="text-xl font-semibold text-foreground">User Management</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Create and manage agent and supervisor accounts</p>
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
          { label: 'Total Users', value: stats.total, color: 'text-foreground' },
          { label: 'Agents', value: stats.agents, color: 'text-blue-700' },
          { label: 'Supervisors', value: stats.supervisors, color: 'text-purple-700' },
          { label: 'Active', value: stats.active, color: 'text-emerald-700' },
        ].map((s, i) => (
          <React.Fragment key={s.label}>
            {i > 0 && <div className="w-px h-4 bg-border" />}
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <span className={`text-sm font-semibold ${s.color}`}>{s.value}</span>
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
            <button onClick={() => setSearch('')}>
              <X size={12} className="text-muted-foreground hover:text-foreground" />
            </button>
          )}
        </div>

        <div className="flex items-center gap-1 rounded-lg border border-border bg-muted p-0.5">
          {(['all', 'agent', 'supervisor'] as const).map((r) => (
            <button
              key={r}
              onClick={() => setFilterRole(r)}
              className={`px-3 py-1 rounded-md text-xs font-medium transition-all duration-150 ${
                filterRole === r ? 'bg-card text-foreground shadow-sm border border-border' : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              {r === 'all' ? 'All Roles' : r === 'agent' ? 'Agents' : 'Supervisors'}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-1 rounded-lg border border-border bg-muted p-0.5">
          {(['all', 'active', 'inactive'] as const).map((s) => (
            <button
              key={s}
              onClick={() => setFilterStatus(s)}
              className={`px-3 py-1 rounded-md text-xs font-medium transition-all duration-150 ${
                filterStatus === s ? 'bg-card text-foreground shadow-sm border border-border' : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              {s === 'all' ? 'All Status' : s.charAt(0).toUpperCase() + s.slice(1)}
            </button>
          ))}
        </div>

        <span className="text-xs text-muted-foreground ml-auto">
          {filtered.length} of {users.length} user{users.length !== 1 ? 's' : ''}
        </span>
      </div>

      {/* Table */}
      <div className="flex-1 overflow-y-auto scrollbar-thin">
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 gap-3">
            <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center">
              <Users size={20} className="text-muted-foreground" />
            </div>
            <p className="text-sm font-medium text-muted-foreground">No users found</p>
            <button onClick={openCreate} className="text-sm text-primary hover:underline">
              Create your first user
            </button>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="sticky top-0 bg-muted/80 backdrop-blur-sm border-b border-border z-10">
              <tr>
                {([
                  { key: 'name', label: 'Name' },
                  { key: 'role', label: 'Role' },
                  { key: 'routeCode', label: 'Route' },
                  { key: 'status', label: 'Status' },
                  { key: 'createdAt', label: 'Created' },
                ] as { key: SortKey; label: string }[]).map((col) => (
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
                <tr key={u.id} className="hover:bg-muted/40 transition-colors group">
                  {/* Name + email */}
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2.5">
                      <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center text-primary text-xs font-semibold shrink-0">
                        {u.name.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase()}
                      </div>
                      <div>
                        <p className="font-medium text-foreground">{u.name}</p>
                        <p className="text-xs text-muted-foreground">{u.email}</p>
                      </div>
                    </div>
                  </td>
                  {/* Role */}
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full ${
                      u.role === 'supervisor'
                        ? 'bg-purple-100 text-purple-700'
                        : 'bg-blue-100 text-blue-700'
                    }`}>
                      <Shield size={10} />
                      {u.role === 'supervisor' ? 'Supervisor' : 'Agent'}
                    </span>
                  </td>
                  {/* Route */}
                  <td className="px-4 py-3">
                    <div>
                      <span className="font-mono text-xs text-foreground">{u.routeCode}</span>
                      <p className="text-[11px] text-muted-foreground mt-0.5">{u.agentCode}</p>
                    </div>
                  </td>
                  {/* Status */}
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full ${
                      u.status === 'active'
                        ? 'bg-emerald-100 text-emerald-700'
                        : 'bg-slate-100 text-slate-600'
                    }`}>
                      {u.status === 'active'
                        ? <CheckCircle size={10} />
                        : <XCircle size={10} />}
                      {u.status === 'active' ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  {/* Created */}
                  <td className="px-4 py-3 text-muted-foreground text-xs">{u.createdAt}</td>
                  {/* Actions */}
                  <td className="px-4 py-3 relative">
                    <div className="relative inline-block">
                      <button
                        onClick={() => setMenuOpenId(menuOpenId === u.id ? null : u.id)}
                        className="w-7 h-7 rounded-md flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted opacity-0 group-hover:opacity-100 transition-all duration-150"
                      >
                        <MoreHorizontal size={15} />
                      </button>
                      {menuOpenId === u.id && (
                        <div
                          className="absolute right-0 top-8 z-20 w-44 bg-card border border-border rounded-lg shadow-lg overflow-hidden"
                          onMouseLeave={() => setMenuOpenId(null)}
                        >
                          <button
                            onClick={() => openEdit(u)}
                            className="w-full text-left flex items-center gap-2 px-3 py-2 text-sm text-foreground hover:bg-muted transition-colors"
                          >
                            <Pencil size={13} className="text-muted-foreground" />
                            Edit user
                          </button>
                          <button
                            onClick={() => toggleStatus(u)}
                            className="w-full text-left flex items-center gap-2 px-3 py-2 text-sm text-foreground hover:bg-muted transition-colors"
                          >
                            {u.status === 'active'
                              ? <XCircle size={13} className="text-amber-500" />
                              : <CheckCircle size={13} className="text-emerald-500" />}
                            Mark as {u.status === 'active' ? 'inactive' : 'active'}
                          </button>
                          <div className="border-t border-border" />
                          <button
                            onClick={() => handleDelete(u)}
                            className="w-full text-left flex items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
                          >
                            <Trash2 size={13} />
                            Delete user
                          </button>
                        </div>
                      )}
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
                    {editingUser ? 'Edit User' : 'Create New User'}
                  </h2>
                  <p className="text-xs text-muted-foreground">
                    {editingUser ? 'Update user details and role' : 'Add a new agent or supervisor account'}
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
                <label className="block text-xs font-medium text-foreground mb-1.5">Role <span className="text-red-500">*</span></label>
                <div className="grid grid-cols-2 gap-2">
                  {(['agent', 'supervisor'] as UserRole[]).map((r) => (
                    <button
                      key={r}
                      type="button"
                      onClick={() => setForm((f) => ({ ...f, role: r }))}
                      className={`flex items-center gap-2 px-3 py-2.5 rounded-lg border text-sm font-medium transition-all duration-150 ${
                        form.role === r
                          ? r === 'agent'
                            ? 'border-blue-400 bg-blue-50 text-blue-700'
                            : 'border-purple-400 bg-purple-50 text-purple-700'
                          : 'border-border text-muted-foreground hover:border-ring/50 hover:text-foreground'
                      }`}
                    >
                      <Shield size={14} />
                      {r === 'agent' ? 'Collection Agent' : 'Supervisor'}
                    </button>
                  ))}
                </div>
              </div>

              {/* Name */}
              <div>
                <label className="block text-xs font-medium text-foreground mb-1">Full Name <span className="text-red-500">*</span></label>
                <div className="relative">
                  <User size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
                  <input
                    value={form.name}
                    onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                    placeholder="e.g. Rajan Kumar"
                    className={`w-full h-9 pl-7 pr-3 rounded-md border text-sm bg-card focus:outline-none focus:ring-2 focus:ring-ring focus:border-ring transition-all duration-150 ${formErrors.name ? 'border-red-400' : 'border-input'}`}
                  />
                </div>
                {formErrors.name && <p className="mt-0.5 text-[11px] text-red-500">{formErrors.name}</p>}
              </div>

              {/* Email */}
              <div>
                <label className="block text-xs font-medium text-foreground mb-1">Email Address <span className="text-red-500">*</span></label>
                <div className="relative">
                  <Mail size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
                  <input
                    type="email"
                    value={form.email}
                    onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                    placeholder="name@cashcollect.in"
                    className={`w-full h-9 pl-7 pr-3 rounded-md border text-sm bg-card focus:outline-none focus:ring-2 focus:ring-ring focus:border-ring transition-all duration-150 ${formErrors.email ? 'border-red-400' : 'border-input'}`}
                  />
                </div>
                {formErrors.email && <p className="mt-0.5 text-[11px] text-red-500">{formErrors.email}</p>}
              </div>

              {/* Route + Code */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-foreground mb-1">Route Code <span className="text-red-500">*</span></label>
                  <div className="relative">
                    <Route size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
                    <input
                      value={form.routeCode}
                      onChange={(e) => setForm((f) => ({ ...f, routeCode: e.target.value }))}
                      placeholder="RT-04"
                      className={`w-full h-9 pl-7 pr-3 rounded-md border text-sm bg-card focus:outline-none focus:ring-2 focus:ring-ring focus:border-ring transition-all duration-150 ${formErrors.routeCode ? 'border-red-400' : 'border-input'}`}
                    />
                  </div>
                  {formErrors.routeCode && <p className="mt-0.5 text-[11px] text-red-500">{formErrors.routeCode}</p>}
                </div>
                <div>
                  <label className="block text-xs font-medium text-foreground mb-1">User Code <span className="text-red-500">*</span></label>
                  <div className="relative">
                    <Shield size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
                    <input
                      value={form.agentCode}
                      onChange={(e) => setForm((f) => ({ ...f, agentCode: e.target.value }))}
                      placeholder={form.role === 'agent' ? 'AGT-001' : 'SUP-001'}
                      className={`w-full h-9 pl-7 pr-3 rounded-md border text-sm bg-card focus:outline-none focus:ring-2 focus:ring-ring focus:border-ring transition-all duration-150 ${formErrors.agentCode ? 'border-red-400' : 'border-input'}`}
                    />
                  </div>
                  {formErrors.agentCode && <p className="mt-0.5 text-[11px] text-red-500">{formErrors.agentCode}</p>}
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
                {isSaving && <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
                {isSaving ? 'Saving…' : editingUser ? 'Save Changes' : 'Create User'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
