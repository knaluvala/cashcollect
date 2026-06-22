'use client';
import React, { useState, useEffect } from 'react';
import { User, Bell, Shield, Palette, Save, Eye, EyeOff, Loader2, AlertCircle, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@/context/AuthContext';

type SettingsTab = 'profile' | 'notifications' | 'security' | 'appearance';

interface DbUser {
  id: number;
  name: string;
  email: string;
  role: string;
  routeCode: string;
  agentCode: string;
  status: string;
  mobile: string;
  department: string;
  profilePhoto: string;
  lastLogin: string | null;
  createdAt: string;
  updatedAt: string;
}

const TABS: { key: SettingsTab; label: string; icon: React.ElementType }[] = [
  { key: 'profile', label: 'Profile', icon: User },
  { key: 'notifications', label: 'Notifications', icon: Bell },
  { key: 'security', label: 'Security', icon: Shield },
  { key: 'appearance', label: 'Appearance', icon: Palette },
];

function SectionCard({ title, description, children }: { title: string; description?: string; children: React.ReactNode }) {
  return (
    <div className="bg-card border border-border rounded-xl p-5">
      <div className="mb-4">
        <h3 className="text-sm font-semibold text-foreground">{title}</h3>
        {description && <p className="text-xs text-muted-foreground mt-0.5">{description}</p>}
      </div>
      {children}
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">{label}</label>
      {children}
    </div>
  );
}

function Toggle({ checked, onChange, label }: { checked: boolean; onChange: (v: boolean) => void; label: string }) {
  return (
    <div className="flex items-center justify-between py-2.5 border-b border-border last:border-0">
      <span className="text-sm text-foreground">{label}</span>
      <button
        onClick={() => onChange(!checked)}
        className={`relative w-9 h-5 rounded-full transition-colors duration-200 focus:outline-none ${checked ? 'bg-primary' : 'bg-muted-foreground/30'}`}
      >
        <span className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform duration-200 ${checked ? 'translate-x-4' : ''}`} />
      </button>
    </div>
  );
}

function RoleBadge({ role }: { role: string }) {
  const colors: Record<string, string> = {
    agent: 'bg-blue-50 text-blue-700 border-blue-200',
    supervisor: 'bg-amber-50 text-amber-700 border-amber-200',
    superadmin: 'bg-purple-50 text-purple-700 border-purple-200',
  };
  const labels: Record<string, string> = {
    agent: 'Collection Agent',
    supervisor: 'Supervisor',
    superadmin: 'Super Admin',
  };
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${colors[role] || colors.agent}`}>
      {labels[role] || role}
    </span>
  );
}

function StatusBadge({ status }: { status: string }) {
  return status === 'active' ? (
    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium text-emerald-700 bg-emerald-50 border border-emerald-200">
      Active
    </span>
  ) : (
    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium text-red-700 bg-red-50 border border-red-200">
      Inactive
    </span>
  );
}

export default function SettingsContent() {
  const { user } = useAuth();
  const [tab, setTab] = useState<SettingsTab>('profile');

  const [dbUser, setDbUser] = useState<DbUser | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [profile, setProfile] = useState({ name: '', email: '', phone: '' });
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [passwords, setPasswords] = useState({ current: '', newPass: '', confirm: '' });

  const [notifPrefs, setNotifPrefs] = useState({
    acknowledgments: true,
    reminders: true,
    mismatches: true,
    weeklyReport: false,
    parlorUpdates: true,
  });

  const [appearance, setAppearance] = useState({ language: 'en', dateFormat: 'DD/MM/YYYY', currency: 'INR' });

  async function fetchUser() {
    if (!user?.email) {
      setError('No authenticated user found. Please log in again.');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/users/me?email=${encodeURIComponent(user.email)}`);
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Failed to load user profile');
        return;
      }
      const u = data.user as DbUser;
      setDbUser(u);
      setProfile({ name: u.name, email: u.email, phone: u.mobile || '' });
    } catch (e) {
      setError('Network error. Please check your connection.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchUser();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.email]);

  function saveProfile() {
    toast.success('Profile updated successfully');
  }

  function changePassword() {
    if (!passwords.current) return toast.error('Enter your current password');
    if (passwords.newPass.length < 8) return toast.error('New password must be at least 8 characters');
    if (passwords.newPass !== passwords.confirm) return toast.error('Passwords do not match');
    toast.success('Password changed successfully');
    setPasswords({ current: '', newPass: '', confirm: '' });
  }

  function saveAppearance() {
    toast.success('Preferences saved');
  }

  const role = user?.role ?? 'agent';

  // Loading state
  if (loading && !dbUser) {
    return (
      <div className="flex flex-col h-full">
        <div className="flex items-center justify-between px-6 py-4 border-b border-border shrink-0">
          <div>
            <h1 className="text-xl font-semibold text-foreground">Settings</h1>
            <p className="text-sm text-muted-foreground mt-0.5">Manage your account and preferences</p>
          </div>
        </div>
        <div className="flex flex-1 items-center justify-center">
          <div className="flex flex-col items-center gap-3 text-muted-foreground">
            <Loader2 size={28} className="animate-spin" />
            <p className="text-sm">Loading your profile...</p>
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (error && !dbUser) {
    return (
      <div className="flex flex-col h-full">
        <div className="flex items-center justify-between px-6 py-4 border-b border-border shrink-0">
          <div>
            <h1 className="text-xl font-semibold text-foreground">Settings</h1>
            <p className="text-sm text-muted-foreground mt-0.5">Manage your account and preferences</p>
          </div>
        </div>
        <div className="flex flex-1 items-center justify-center">
          <div className="flex flex-col items-center gap-3 max-w-sm text-center">
            <div className="w-12 h-12 rounded-full bg-red-50 flex items-center justify-center">
              <AlertCircle size={24} className="text-red-500" />
            </div>
            <p className="text-sm text-red-600 font-medium">{error}</p>
            <button
              onClick={fetchUser}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors"
            >
              <RefreshCw size={14} />
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-border shrink-0">
        <div>
          <h1 className="text-xl font-semibold text-foreground">Settings</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Manage your account and preferences</p>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar Tabs */}
        <aside className="w-52 shrink-0 border-r border-border p-3 space-y-0.5 overflow-y-auto">
          {TABS.map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              onClick={() => setTab(key)}
              className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-md text-sm font-medium transition-all duration-150 ${
                tab === key
                  ? 'bg-primary/10 text-primary'
                  : 'text-muted-foreground hover:bg-muted hover:text-foreground'
              }`}
            >
              <Icon size={15} className={tab === key ? 'text-primary' : 'text-muted-foreground'} />
              {label}
            </button>
          ))}
        </aside>

        {/* Content */}
        <div className="flex-1 overflow-y-auto scrollbar-thin p-6 space-y-4">

          {/* Profile */}
          {tab === 'profile' && (
            <>
              {/* Identity Banner */}
              <SectionCard title="Account Identity" description="Your role and current status in the system">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary font-semibold text-lg">
                    {dbUser?.name?.charAt(0).toUpperCase() ?? user?.name?.charAt(0).toUpperCase() ?? '?'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h4 className="text-sm font-semibold text-foreground">{user?.name ?? 'User'}</h4>
                      <RoleBadge role={user?.role ?? role} />
                      <StatusBadge status={dbUser?.status ?? 'active'} />
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">{user?.email ?? 'N/A'}</p>
                  </div>
                </div>
              </SectionCard>

              <SectionCard title="Personal Information" description="Update your name and contact details">
                <div className="grid grid-cols-2 gap-4">
                  <Field label="Full Name">
                    <input
                      value={profile.name}
                      onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                      className="px-3 py-2 rounded-lg border border-border bg-background text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
                    />
                  </Field>
                  <Field label="Email Address">
                    <input
                      value={profile.email}
                      readOnly
                      className="px-3 py-2 rounded-lg border border-border bg-muted text-sm text-muted-foreground cursor-not-allowed"
                    />
                  </Field>
                  <Field label="Phone Number">
                    <input
                      value={profile.phone}
                      onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
                      className="px-3 py-2 rounded-lg border border-border bg-background text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
                    />
                  </Field>
                  <Field label="Department">
                    <input
                      value={dbUser?.department || 'Operations'}
                      readOnly
                      className="px-3 py-2 rounded-lg border border-border bg-muted text-sm text-muted-foreground cursor-not-allowed"
                    />
                  </Field>
                </div>
              </SectionCard>

              {/* Role-specific cards */}
              {role === 'agent' && (
                <SectionCard title="Route & Agent Details" description="Read-only — managed by your administrator">
                  <div className="grid grid-cols-2 gap-4">
                    <Field label="Route Code">
                      <input value={dbUser?.routeCode || 'N/A'} readOnly className="px-3 py-2 rounded-lg border border-border bg-muted text-sm text-muted-foreground cursor-not-allowed" />
                    </Field>
                    <Field label="Agent Code">
                      <input value={user?.agentCode || 'N/A'} readOnly className="px-3 py-2 rounded-lg border border-border bg-muted text-sm text-muted-foreground cursor-not-allowed" />
                    </Field>
                    <Field label="Supervisor Code">
                      <input value={user?.supervisorCode || 'N/A'} readOnly className="px-3 py-2 rounded-lg border border-border bg-muted text-sm text-muted-foreground cursor-not-allowed" />
                    </Field>
                  </div>
                </SectionCard>
              )}

              {role === 'supervisor' && (
                <SectionCard title="Supervisor Details" description="Read-only — managed by your administrator">
                  <div className="grid grid-cols-2 gap-4">
                    <Field label="Supervisor Code">
                      <input value={user?.agentCode || 'N/A'} readOnly className="px-3 py-2 rounded-lg border border-border bg-muted text-sm text-muted-foreground cursor-not-allowed" />
                    </Field>
                    <Field label="Assigned Routes">
                      <input value={dbUser?.routeCode || 'N/A'} readOnly className="px-3 py-2 rounded-lg border border-border bg-muted text-sm text-muted-foreground cursor-not-allowed" />
                    </Field>
                  </div>
                </SectionCard>
              )}

              {role === 'superadmin' && (
                <SectionCard title="Admin Details" description="Read-only — system administrator privileges">
                  <div className="grid grid-cols-2 gap-4">
                    <Field label="Admin Code">
                      <input value={user?.agentCode || 'N/A'} readOnly className="px-3 py-2 rounded-lg border border-border bg-muted text-sm text-muted-foreground cursor-not-allowed" />
                    </Field>
                    <Field label="Access Scope">
                      <input value={dbUser?.routeCode || 'ALL'} readOnly className="px-3 py-2 rounded-lg border border-border bg-muted text-sm text-muted-foreground cursor-not-allowed" />
                    </Field>
                    <Field label="Department">
                      <input value={dbUser?.department || 'IT Administration'} readOnly className="px-3 py-2 rounded-lg border border-border bg-muted text-sm text-muted-foreground cursor-not-allowed" />
                    </Field>
                  </div>
                </SectionCard>
              )}

              <SectionCard title="Account Metadata" description="Account creation and activity timestamps">
                <div className="grid grid-cols-2 gap-4">
                  <Field label="Account Created">
                    <input
                      value={dbUser?.createdAt ? new Date(dbUser.createdAt).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' }) : 'N/A'}
                      readOnly
                      className="px-3 py-2 rounded-lg border border-border bg-muted text-sm text-muted-foreground cursor-not-allowed"
                    />
                  </Field>
                  <Field label="Last Login">
                    <input
                      value={dbUser?.lastLogin ? new Date(dbUser.lastLogin).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' }) : 'N/A'}
                      readOnly
                      className="px-3 py-2 rounded-lg border border-border bg-muted text-sm text-muted-foreground cursor-not-allowed"
                    />
                  </Field>
                  <Field label="User ID">
                    <input value={dbUser?.id ?? user?.id ?? 'N/A'} readOnly className="px-3 py-2 rounded-lg border border-border bg-muted text-sm text-muted-foreground cursor-not-allowed" />
                  </Field>
                </div>
              </SectionCard>

              <div className="flex justify-end">
                <button
                  onClick={saveProfile}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors"
                >
                  <Save size={14} />
                  Save Changes
                </button>
              </div>
            </>
          )}

          {/* Notifications */}
          {tab === 'notifications' && (
            <SectionCard title="Notification Preferences" description="Choose what you want to be notified about">
              <Toggle label="Collection acknowledgments" checked={notifPrefs.acknowledgments} onChange={(v) => { setNotifPrefs({ ...notifPrefs, acknowledgments: v }); toast.success(v ? 'Acknowledgment alerts enabled' : 'Acknowledgment alerts disabled'); }} />
              <Toggle label="Pending collection reminders" checked={notifPrefs.reminders} onChange={(v) => { setNotifPrefs({ ...notifPrefs, reminders: v }); toast.success(v ? 'Reminders enabled' : 'Reminders disabled'); }} />
              <Toggle label="Collection mismatch alerts" checked={notifPrefs.mismatches} onChange={(v) => { setNotifPrefs({ ...notifPrefs, mismatches: v }); toast.success(v ? 'Mismatch alerts enabled' : 'Mismatch alerts disabled'); }} />
              <Toggle label="Weekly summary reports" checked={notifPrefs.weeklyReport} onChange={(v) => { setNotifPrefs({ ...notifPrefs, weeklyReport: v }); toast.success(v ? 'Weekly reports enabled' : 'Weekly reports disabled'); }} />
              <Toggle label="Parlor master updates" checked={notifPrefs.parlorUpdates} onChange={(v) => { setNotifPrefs({ ...notifPrefs, parlorUpdates: v }); toast.success(v ? 'Parlor updates enabled' : 'Parlor updates disabled'); }} />
            </SectionCard>
          )}

          {/* Security */}
          {tab === 'security' && (
            <>
              <SectionCard title="Change Password" description="Choose a strong password with at least 8 characters">
                <div className="space-y-3">
                  <Field label="Current Password">
                    <div className="relative">
                      <input
                        type={showCurrent ? 'text' : 'password'}
                        value={passwords.current}
                        onChange={(e) => setPasswords({ ...passwords, current: e.target.value })}
                        placeholder="Enter current password"
                        className="w-full px-3 py-2 pr-9 rounded-lg border border-border bg-background text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
                      />
                      <button onClick={() => setShowCurrent(!showCurrent)} className="absolute right-2.5 top-2.5 text-muted-foreground hover:text-foreground">
                        {showCurrent ? <EyeOff size={14} /> : <Eye size={14} />}
                      </button>
                    </div>
                  </Field>
                  <Field label="New Password">
                    <div className="relative">
                      <input
                        type={showNew ? 'text' : 'password'}
                        value={passwords.newPass}
                        onChange={(e) => setPasswords({ ...passwords, newPass: e.target.value })}
                        placeholder="At least 8 characters"
                        className="w-full px-3 py-2 pr-9 rounded-lg border border-border bg-background text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
                      />
                      <button onClick={() => setShowNew(!showNew)} className="absolute right-2.5 top-2.5 text-muted-foreground hover:text-foreground">
                        {showNew ? <EyeOff size={14} /> : <Eye size={14} />}
                      </button>
                    </div>
                  </Field>
                  <Field label="Confirm New Password">
                    <input
                      type="password"
                      value={passwords.confirm}
                      onChange={(e) => setPasswords({ ...passwords, confirm: e.target.value })}
                      placeholder="Re-enter new password"
                      className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
                    />
                  </Field>
                  <div className="flex justify-end pt-1">
                    <button
                      onClick={changePassword}
                      className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors"
                    >
                      <Shield size={14} />
                      Update Password
                    </button>
                  </div>
                </div>
              </SectionCard>

              <SectionCard title="Active Sessions" description="Devices currently signed in to your account">
                <div className="space-y-3">
                  {[
                    { device: 'Chrome on Windows', location: 'Bengaluru, IN', time: 'Now — Current session', active: true },
                    { device: 'CashCollect Mobile (Android)', location: 'Bengaluru, IN', time: '2 hours ago', active: false },
                  ].map((s) => (
                    <div key={s.device} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                      <div>
                        <p className="text-sm font-medium text-foreground">{s.device}</p>
                        <p className="text-xs text-muted-foreground">{s.location} · {s.time}</p>
                      </div>
                      {s.active
                        ? <span className="text-xs font-medium text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">Active</span>
                        : <button onClick={() => toast.success('Session revoked')} className="text-xs text-red-600 hover:underline">Revoke</button>}
                    </div>
                  ))}
                </div>
              </SectionCard>
            </>
          )}

          {/* Appearance */}
          {tab === 'appearance' && (
            <>
              <SectionCard title="Regional Preferences" description="Language, date format, and currency display">
                <div className="grid grid-cols-2 gap-4">
                  <Field label="Language">
                    <select value={appearance.language} onChange={(e) => setAppearance({ ...appearance, language: e.target.value })} className="px-3 py-2 rounded-lg border border-border bg-background text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30">
                      <option value="en">English</option>
                      <option value="hi">Hindi</option>
                      <option value="kn">Kannada</option>
                    </select>
                  </Field>
                  <Field label="Date Format">
                    <select value={appearance.dateFormat} onChange={(e) => setAppearance({ ...appearance, dateFormat: e.target.value })} className="px-3 py-2 rounded-lg border border-border bg-background text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30">
                      <option value="DD/MM/YYYY">DD/MM/YYYY</option>
                      <option value="MM/DD/YYYY">MM/DD/YYYY</option>
                      <option value="YYYY-MM-DD">YYYY-MM-DD</option>
                    </select>
                  </Field>
                  <Field label="Currency">
                    <select value={appearance.currency} onChange={(e) => setAppearance({ ...appearance, currency: e.target.value })} className="px-3 py-2 rounded-lg border border-border bg-background text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30">
                      <option value="INR">INR (₹)</option>
                      <option value="USD">USD ($)</option>
                    </select>
                  </Field>
                </div>
              </SectionCard>

              <SectionCard title="Display" description="Application theme and interface options">
                <div className="flex items-center justify-between py-2">
                  <div>
                    <p className="text-sm font-medium text-foreground">Theme</p>
                    <p className="text-xs text-muted-foreground">Light theme is currently active</p>
                  </div>
                  <div className="flex items-center gap-2">
                    {(['Light', 'Dark', 'System'] as const).map((t) => (
                      <button
                        key={t}
                        className={`px-3 py-1.5 rounded-md text-xs font-medium border transition-all ${t === 'Light' ? 'bg-card border-primary text-primary' : 'border-border text-muted-foreground hover:text-foreground hover:bg-muted'}`}
                        onClick={() => t !== 'Light' && toast.info('Dark mode coming soon')}
                      >
                        {t}
                      </button>
                    ))}
                  </div>
                </div>
              </SectionCard>

              <div className="flex justify-end">
                <button
                  onClick={saveAppearance}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors"
                >
                  <Save size={14} />
                  Save Preferences
                </button>
              </div>
            </>
          )}

        </div>
      </div>
    </div>
  );
}
