"use client";
import React, { useState, useEffect } from "react";
import {
  User,
  Bell,
  Shield,
  Palette,
  Save,
  Eye,
  EyeOff,
  Loader2,
  AlertCircle,
  RefreshCw,
  Database,
} from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/context/AuthContext";
import { API_BASE } from "@/lib/apiBase";

type SettingsTab =
  | "profile"
  | "notifications"
  | "security"
  | "appearance"
  | "external";

interface DbUser {
  id: number;
  name: string;
  email: string;
  role: string;
  routeCode: string;
  agentCode: string;
  status: string;
  mobile: string;
  profilePhoto: string;
  lastLogin: string | null;
  createdAt: string;
  updatedAt: string;
}

const TABS: { key: SettingsTab; label: string; icon: React.ElementType }[] = [
  { key: "profile", label: "Profile", icon: User },
  { key: "notifications", label: "Notifications", icon: Bell },
  { key: "security", label: "Security", icon: Shield },
  { key: "appearance", label: "Appearance", icon: Palette },
  { key: "external", label: "External Amounts", icon: Database },
];

function SectionCard({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="bg-card border border-border rounded-xl p-4 sm:p-5 w-full">
      <div className="mb-4">
        <h3 className="text-sm font-semibold text-foreground">{title}</h3>
        {description && (
          <p className="text-xs text-muted-foreground mt-0.5">{description}</p>
        )}
      </div>
      {children}
    </div>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1.5 w-full">
      <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
        {label}
      </label>
      {children}
    </div>
  );
}

function Toggle({
  checked,
  onChange,
  label,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  label: string;
}) {
  return (
    <div className="flex items-center justify-between py-2.5 border-b border-border last:border-0 gap-2">
      <span className="text-sm text-foreground">{label}</span>
      <button
        onClick={() => onChange(!checked)}
        className={`relative w-9 h-5 rounded-full shrink-0 transition-colors duration-200 focus:outline-none ${checked ? "bg-primary" : "bg-muted-foreground/30"}`}
      >
        <span
          className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform duration-200 ${checked ? "translate-x-4" : ""}`}
        />
      </button>
    </div>
  );
}

function RoleBadge({ role }: { role: string }) {
  const colors: Record<string, string> = {
    agent: "bg-blue-50 text-blue-700 border-blue-200",
    supervisor: "bg-amber-50 text-amber-700 border-amber-200",
    superadmin: "bg-purple-50 text-purple-700 border-purple-200",
  };
  const labels: Record<string, string> = {
    agent: "Collection Agent",
    supervisor: "Supervisor",
    superadmin: "Super Admin",
  };
  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${colors[role] || colors.agent}`}
    >
      {labels[role] || role}
    </span>
  );
}

function StatusBadge({ status }: { status: string }) {
  return status === "active" ? (
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
  const [tab, setTab] = useState<SettingsTab>("profile");

  const [dbUser, setDbUser] = useState<DbUser | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [profile, setProfile] = useState({ name: "", email: "", phone: "" });
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [passwords, setPasswords] = useState({
    current: "",
    newPass: "",
    confirm: "",
  });

  const [notifPrefs, setNotifPrefs] = useState({
    acknowledgments: true,
    reminders: true,
    mismatches: true,
    weeklyReport: false,
    parlorUpdates: true,
  });

  const [appearance, setAppearance] = useState({
    language: "en",
    dateFormat: "DD/MM/YYYY",
    currency: "INR",
  });
  const [externalConfig, setExternalConfig] = useState({
    enabled: false,
    endpoint: "",
    sourceLabel: "External System",
    parlorCodeParameter: "parlorCode",
    dateParameter: "date",
    cashAmountPath: "cashAmount",
    couponAmountPath: "couponAmount",
    ccAmountPath: "ccAmount",
  });
  const [externalConfigLoading, setExternalConfigLoading] = useState(false);
  const [externalConfigSaving, setExternalConfigSaving] = useState(false);
  const [credentialConfigured, setCredentialConfigured] = useState(false);

  async function fetchUser() {
    if (!user?.email) {
      setError("No authenticated user found. Please log in again.");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(
        `${API_BASE}/users/me?email=${encodeURIComponent(user.email)}`,
      );
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Failed to load user profile");
        return;
      }
      const u = data.user as DbUser;
      setDbUser(u);
      setProfile({ name: u.name, email: u.email, phone: u.mobile || "" });
    } catch (e) {
      setError("Network error. Please check your connection.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchUser();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.email]);

  useEffect(() => {
    if (user?.role !== "superadmin" || !user) return;
    const token = localStorage.getItem("@cashcollect_web_token");
    setExternalConfigLoading(true);
    fetch(`${API_BASE}/external/collection-config`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    })
      .then(async (res) => {
        const data = await res.json();
        if (!res.ok) throw new Error(data.error);
        setExternalConfig(data.config);
        setCredentialConfigured(Boolean(data.credentialConfigured));
      })
      .catch(() => toast.error("Could not load external amount settings"))
      .finally(() => setExternalConfigLoading(false));
  }, [user]);

  function saveProfile() {
    toast.success("Profile updated successfully");
  }

  async function changePassword() {
    if (!passwords.current) return toast.error("Enter your current password");

    if (passwords.newPass.length < 8) {
      return toast.error("New password must be at least 8 characters");
    }

    if (passwords.newPass !== passwords.confirm) {
      return toast.error("Passwords do not match");
    }

    try {
      const token = localStorage.getItem("@cashcollect_web_token");

      const res = await fetch(`${API_BASE}/auth/change-password`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          currentPassword: passwords.current,
          newPassword: passwords.newPass,
        }),
      });

      const result = await res.json();

      if (!res.ok) {
        toast.error(result.error ?? "Password change failed");
        return;
      }

      toast.success("Password changed successfully");
      setPasswords({ current: "", newPass: "", confirm: "" });
    } catch {
      toast.error("Network error: could not change password");
    }
  }

  function saveAppearance() {
    toast.success("Preferences saved");
  }

  async function saveExternalConfig() {
    if (externalConfig.enabled && !externalConfig.endpoint) {
      toast.error("Enter an external API endpoint before enabling the source");
      return;
    }
    const token = localStorage.getItem("@cashcollect_web_token");
    setExternalConfigSaving(true);
    try {
      const res = await fetch(`${API_BASE}/external/collection-config`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(externalConfig),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || "Could not save external amount settings");
        return;
      }
      setExternalConfig(data.config);
      setCredentialConfigured(Boolean(data.credentialConfigured));
      toast.success("External amount settings saved");
    } catch {
      toast.error("Network error: could not save external amount settings");
    } finally {
      setExternalConfigSaving(false);
    }
  }

  const role = user?.role ?? "agent";

  // Loading state
  if (loading && !dbUser) {
    return (
      <div className="flex flex-col min-h-screen md:h-full w-full bg-background">
        <div className="flex items-center justify-between px-4 sm:px-6 py-4 border-b border-border shrink-0">
          <div>
            <h1 className="text-lg sm:text-xl font-semibold text-foreground">
              Settings
            </h1>
            <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
              Manage your account and preferences
            </p>
          </div>
        </div>
        <div className="flex flex-1 items-center justify-center p-6">
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
      <div className="flex flex-col min-h-screen md:h-full w-full bg-background">
        <div className="flex items-center justify-between px-4 sm:px-6 py-4 border-b border-border shrink-0">
          <div>
            <h1 className="text-lg sm:text-xl font-semibold text-foreground">
              Settings
            </h1>
            <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
              Manage your account and preferences
            </p>
          </div>
        </div>
        <div className="flex flex-1 items-center justify-center p-6">
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
    <div className="flex flex-col min-h-screen md:h-full md:overflow-hidden bg-background w-full">
      {/* Header */}
      <div className="flex items-center justify-between px-4 sm:px-6 py-4 border-b border-border shrink-0">
        <div>
          <h1 className="text-lg sm:text-xl font-semibold text-foreground">
            Settings
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
            Manage your account and preferences
          </p>
        </div>
      </div>

      <div className="flex flex-col md:flex-row flex-1 overflow-hidden w-full">
        {/* Navigation Tabs (Horizontal Scroll on Mobile, Vertical Sidebar on Desktop) */}
        <aside className="w-full md:w-52 shrink-0 border-b md:border-b-0 md:border-r border-border p-2 sm:p-3 flex flex-row md:flex-col overflow-x-auto md:overflow-y-auto scrollbar-none gap-1 bg-card">
          {TABS.filter(
            (item) => item.key !== "external" || role === "superadmin",
          ).map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              onClick={() => setTab(key)}
              className={`flex items-center gap-2.5 px-3 py-2 rounded-md text-xs sm:text-sm font-medium whitespace-nowrap transition-all duration-150 ${
                tab === key
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              }`}
            >
              <Icon
                size={15}
                className={
                  tab === key
                    ? "text-primary shrink-0"
                    : "text-muted-foreground shrink-0"
                }
              />
              {label}
            </button>
          ))}
        </aside>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto scrollbar-thin p-4 sm:p-6 space-y-4 bg-background w-full">
          {/* Profile */}
          {tab === "profile" && (
            <>
              {/* Identity Banner */}
              <SectionCard
                title="Account Identity"
                description="Your role and current status in the system"
              >
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary font-semibold text-lg shrink-0">
                    {user?.name?.charAt(0).toUpperCase() ?? "?"}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h4 className="text-sm font-semibold text-foreground">
                        {user?.name ?? "User"}
                      </h4>
                      <RoleBadge role={user?.role ?? role} />
                      <StatusBadge status={dbUser?.status ?? "active"} />
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5 truncate">
                      {user?.email ?? "N/A"}
                    </p>
                  </div>
                </div>
              </SectionCard>

              <SectionCard
                title="Personal Information"
                description="Update your name and contact details"
              >
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Field label="Full Name">
                    <input
                      value={profile.name}
                      onChange={(e) =>
                        setProfile({ ...profile, name: e.target.value })
                      }
                      className="px-3 py-2 rounded-lg border border-border bg-background text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 w-full"
                    />
                  </Field>
                  <Field label="Email Address">
                    <input
                      value={profile.email}
                      readOnly
                      className="px-3 py-2 rounded-lg border border-border bg-muted text-sm text-muted-foreground cursor-not-allowed w-full"
                    />
                  </Field>
                  <Field label="Phone Number">
                    <input
                      value={profile.phone}
                      onChange={(e) =>
                        setProfile({ ...profile, phone: e.target.value })
                      }
                      className="px-3 py-2 rounded-lg border border-border bg-background text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 w-full"
                    />
                  </Field>
                </div>
              </SectionCard>

              {/* Role-specific cards */}
              {role === "agent" && (
                <SectionCard
                  title="Route & Agent Details"
                  description="Read-only — managed by your administrator"
                >
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <Field label="Route Code">
                      <input
                        value={dbUser?.routeCode || "N/A"}
                        readOnly
                        className="px-3 py-2 rounded-lg border border-border bg-muted text-sm text-muted-foreground cursor-not-allowed w-full"
                      />
                    </Field>
                    <Field label="Agent Code">
                      <input
                        value={user?.agentCode || "N/A"}
                        readOnly
                        className="px-3 py-2 rounded-lg border border-border bg-muted text-sm text-muted-foreground cursor-not-allowed w-full"
                      />
                    </Field>
                    <Field label="Supervisor Code">
                      <input
                        value={user?.supervisorCode || "N/A"}
                        readOnly
                        className="px-3 py-2 rounded-lg border border-border bg-muted text-sm text-muted-foreground cursor-not-allowed w-full"
                      />
                    </Field>
                  </div>
                </SectionCard>
              )}

              {role === "supervisor" && (
                <SectionCard
                  title="Supervisor Details"
                  description="Read-only — managed by your administrator"
                >
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <Field label="Supervisor Code">
                      <input
                        value={user?.agentCode || "N/A"}
                        readOnly
                        className="px-3 py-2 rounded-lg border border-border bg-muted text-sm text-muted-foreground cursor-not-allowed w-full"
                      />
                    </Field>
                    <Field label="Assigned Routes">
                      <input
                        value={dbUser?.routeCode || "N/A"}
                        readOnly
                        className="px-3 py-2 rounded-lg border border-border bg-muted text-sm text-muted-foreground cursor-not-allowed w-full"
                      />
                    </Field>
                  </div>
                </SectionCard>
              )}

              {role === "superadmin" && (
                <SectionCard
                  title="Admin Details"
                  description="Read-only — system administrator privileges"
                >
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <Field label="Admin Code">
                      <input
                        value={user?.agentCode || "N/A"}
                        readOnly
                        className="px-3 py-2 rounded-lg border border-border bg-muted text-sm text-muted-foreground cursor-not-allowed w-full"
                      />
                    </Field>
                    <Field label="Access Scope">
                      <input
                        value={dbUser?.routeCode || "ALL"}
                        readOnly
                        className="px-3 py-2 rounded-lg border border-border bg-muted text-sm text-muted-foreground cursor-not-allowed w-full"
                      />
                    </Field>
                  </div>
                </SectionCard>
              )}

              <SectionCard
                title="Account Metadata"
                description="Account creation and activity timestamps"
              >
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Field label="Account Created">
                    <input
                      value={
                        dbUser?.createdAt
                          ? new Date(dbUser.createdAt).toLocaleString("en-IN", {
                              dateStyle: "medium",
                              timeStyle: "short",
                            })
                          : "N/A"
                      }
                      readOnly
                      className="px-3 py-2 rounded-lg border border-border bg-muted text-sm text-muted-foreground cursor-not-allowed w-full"
                    />
                  </Field>
                  <Field label="Last Login">
                    <input
                      value={
                        dbUser?.lastLogin
                          ? new Date(dbUser.lastLogin).toLocaleString("en-IN", {
                              dateStyle: "medium",
                              timeStyle: "short",
                            })
                          : "N/A"
                      }
                      readOnly
                      className="px-3 py-2 rounded-lg border border-border bg-muted text-sm text-muted-foreground cursor-not-allowed w-full"
                    />
                  </Field>
                  <Field label="User ID">
                    <input
                      value={dbUser?.id ?? user?.id ?? "N/A"}
                      readOnly
                      className="px-3 py-2 rounded-lg border border-border bg-muted text-sm text-muted-foreground cursor-not-allowed w-full"
                    />
                  </Field>
                </div>
              </SectionCard>

              <div className="flex justify-end pt-2">
                <button
                  onClick={saveProfile}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors w-full sm:w-auto justify-center"
                >
                  <Save size={14} />
                  Save Changes
                </button>
              </div>
            </>
          )}

          {/* Notifications */}
          {tab === "notifications" && (
            <SectionCard
              title="Notification Preferences"
              description="Choose what you want to be notified about"
            >
              <Toggle
                label="Collection acknowledgments"
                checked={notifPrefs.acknowledgments}
                onChange={(v) => {
                  setNotifPrefs({ ...notifPrefs, acknowledgments: v });
                  toast.success(
                    v
                      ? "Acknowledgment alerts enabled"
                      : "Acknowledgment alerts disabled",
                  );
                }}
              />
              <Toggle
                label="Pending collection reminders"
                checked={notifPrefs.reminders}
                onChange={(v) => {
                  setNotifPrefs({ ...notifPrefs, reminders: v });
                  toast.success(v ? "Reminders enabled" : "Reminders disabled");
                }}
              />
              <Toggle
                label="Collection mismatch alerts"
                checked={notifPrefs.mismatches}
                onChange={(v) => {
                  setNotifPrefs({ ...notifPrefs, mismatches: v });
                  toast.success(
                    v ? "Mismatch alerts enabled" : "Mismatch alerts disabled",
                  );
                }}
              />
              <Toggle
                label="Weekly summary reports"
                checked={notifPrefs.weeklyReport}
                onChange={(v) => {
                  setNotifPrefs({ ...notifPrefs, weeklyReport: v });
                  toast.success(
                    v ? "Weekly reports enabled" : "Weekly reports disabled",
                  );
                }}
              />
              <Toggle
                label="Parlor master updates"
                checked={notifPrefs.parlorUpdates}
                onChange={(v) => {
                  setNotifPrefs({ ...notifPrefs, parlorUpdates: v });
                  toast.success(
                    v ? "Parlor updates enabled" : "Parlor updates disabled",
                  );
                }}
              />
            </SectionCard>
          )}

          {/* Security */}
          {tab === "security" && (
            <>
              <SectionCard
                title="Change Password"
                description="Choose a strong password with at least 8 characters"
              >
                <div className="space-y-3">
                  <Field label="Current Password">
                    <div className="relative w-full">
                      <input
                        type={showCurrent ? "text" : "password"}
                        value={passwords.current}
                        onChange={(e) =>
                          setPasswords({
                            ...passwords,
                            current: e.target.value,
                          })
                        }
                        placeholder="Enter current password"
                        className="w-full px-3 py-2 pr-9 rounded-lg border border-border bg-background text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
                      />
                      <button
                        onClick={() => setShowCurrent(!showCurrent)}
                        className="absolute right-2.5 top-2.5 text-muted-foreground hover:text-foreground"
                      >
                        {showCurrent ? <EyeOff size={14} /> : <Eye size={14} />}
                      </button>
                    </div>
                  </Field>
                  <Field label="New Password">
                    <div className="relative w-full">
                      <input
                        type={showNew ? "text" : "password"}
                        value={passwords.newPass}
                        onChange={(e) =>
                          setPasswords({
                            ...passwords,
                            newPass: e.target.value,
                          })
                        }
                        placeholder="At least 8 characters"
                        className="w-full px-3 py-2 pr-9 rounded-lg border border-border bg-background text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
                      />
                      <button
                        onClick={() => setShowNew(!showNew)}
                        className="absolute right-2.5 top-2.5 text-muted-foreground hover:text-foreground"
                      >
                        {showNew ? <EyeOff size={14} /> : <Eye size={14} />}
                      </button>
                    </div>
                  </Field>
                  <Field label="Confirm New Password">
                    <input
                      type="password"
                      value={passwords.confirm}
                      onChange={(e) =>
                        setPasswords({ ...passwords, confirm: e.target.value })
                      }
                      placeholder="Re-enter new password"
                      className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
                    />
                  </Field>
                  <div className="flex justify-end pt-1">
                    <button
                      onClick={changePassword}
                      className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors w-full sm:w-auto justify-center"
                    >
                      <Shield size={14} />
                      Update Password
                    </button>
                  </div>
                </div>
              </SectionCard>

              <SectionCard
                title="Active Sessions"
                description="Devices currently signed in to your account"
              >
                <div className="space-y-3">
                  {[
                    {
                      device: "Chrome on Windows",
                      location: "Bengaluru, IN",
                      time: "Now — Current session",
                      active: true,
                    },
                    {
                      device: "CashCollect Mobile (Android)",
                      location: "Bengaluru, IN",
                      time: "2 hours ago",
                      active: false,
                    },
                  ].map((s) => (
                    <div
                      key={s.device}
                      className="flex items-center justify-between py-2 border-b border-border last:border-0 gap-2"
                    >
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium text-foreground truncate">
                          {s.device}
                        </p>
                        <p className="text-xs text-muted-foreground truncate">
                          {s.location} · {s.time}
                        </p>
                      </div>
                      {s.active ? (
                        <span className="text-xs font-medium text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200 shrink-0">
                          Active
                        </span>
                      ) : (
                        <button
                          onClick={() => toast.success("Session revoked")}
                          className="text-xs text-red-600 hover:underline shrink-0"
                        >
                          Revoke
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </SectionCard>
            </>
          )}

          {/* Appearance */}
          {tab === "appearance" && (
            <>
              <SectionCard
                title="Regional Preferences"
                description="Language, date format, and currency display"
              >
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Field label="Language">
                    <select
                      value={appearance.language}
                      onChange={(e) =>
                        setAppearance({
                          ...appearance,
                          language: e.target.value,
                        })
                      }
                      className="px-3 py-2 rounded-lg border border-border bg-background text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 w-full"
                    >
                      <option value="en">English</option>
                      <option value="hi">Hindi</option>
                      <option value="kn">Kannada</option>
                    </select>
                  </Field>
                  <Field label="Date Format">
                    <select
                      value={appearance.dateFormat}
                      onChange={(e) =>
                        setAppearance({
                          ...appearance,
                          dateFormat: e.target.value,
                        })
                      }
                      className="px-3 py-2 rounded-lg border border-border bg-background text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 w-full"
                    >
                      <option value="DD/MM/YYYY">DD/MM/YYYY</option>
                      <option value="MM/DD/YYYY">MM/DD/YYYY</option>
                      <option value="YYYY-MM-DD">YYYY-MM-DD</option>
                    </select>
                  </Field>
                  <Field label="Currency">
                    <select
                      value={appearance.currency}
                      onChange={(e) =>
                        setAppearance({
                          ...appearance,
                          currency: e.target.value,
                        })
                      }
                      className="px-3 py-2 rounded-lg border border-border bg-background text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 w-full"
                    >
                      <option value="INR">INR (₹)</option>
                      <option value="USD">USD ($)</option>
                    </select>
                  </Field>
                </div>
              </SectionCard>

              <SectionCard
                title="Display"
                description="Application theme and interface options"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between py-2 gap-3">
                  <div>
                    <p className="text-sm font-medium text-foreground">Theme</p>
                    <p className="text-xs text-muted-foreground">
                      Light theme is currently active
                    </p>
                  </div>
                  <div className="flex items-center gap-2 flex-wrap">
                    {(["Light", "Dark", "System"] as const).map((t) => (
                      <button
                        key={t}
                        className={`px-3 py-1.5 rounded-md text-xs font-medium border transition-all ${t === "Light" ? "bg-card border-primary text-primary" : "border-border text-muted-foreground hover:text-foreground hover:bg-muted"}`}
                        onClick={() =>
                          t !== "Light" && toast.info("Dark mode coming soon")
                        }
                      >
                        {t}
                      </button>
                    ))}
                  </div>
                </div>
              </SectionCard>

              <div className="flex justify-end pt-2">
                <button
                  onClick={saveAppearance}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors w-full sm:w-auto justify-center"
                >
                  <Save size={14} />
                  Save Preferences
                </button>
              </div>
            </>
          )}

          {tab === "external" && role === "superadmin" && (
            <>
              <SectionCard
                title="External Collection Amounts"
                description="Configure the read-only API used to show Cash, Coupon, and Credit Card totals. Credentials remain in Replit Secrets."
              >
                {externalConfigLoading ? (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Loader2 size={16} className="animate-spin" />
                    Loading external amount settings…
                  </div>
                ) : (
                  <div className="space-y-4">
                    <Toggle
                      label="Use external source for displayed amounts"
                      checked={externalConfig.enabled}
                      onChange={(enabled) =>
                        setExternalConfig({ ...externalConfig, enabled })
                      }
                    />
                    <Field label="Source Label">
                      <input
                        value={externalConfig.sourceLabel}
                        onChange={(e) =>
                          setExternalConfig({
                            ...externalConfig,
                            sourceLabel: e.target.value,
                          })
                        }
                        placeholder="e.g. Retail POS"
                        className="px-3 py-2 rounded-lg border border-border bg-background text-sm w-full"
                      />
                    </Field>
                    <Field label="External API Endpoint">
                      <input
                        type="url"
                        value={externalConfig.endpoint}
                        onChange={(e) =>
                          setExternalConfig({
                            ...externalConfig,
                            endpoint: e.target.value,
                          })
                        }
                        placeholder="https://example.com/api/collection-summary"
                        className="px-3 py-2 rounded-lg border border-border bg-background text-sm w-full"
                      />
                    </Field>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <Field label="Parlor Code Parameter">
                        <input
                          value={externalConfig.parlorCodeParameter}
                          onChange={(e) =>
                            setExternalConfig({
                              ...externalConfig,
                              parlorCodeParameter: e.target.value,
                            })
                          }
                          className="px-3 py-2 rounded-lg border border-border bg-background text-sm w-full"
                        />
                      </Field>
                      <Field label="Date Parameter">
                        <input
                          value={externalConfig.dateParameter}
                          onChange={(e) =>
                            setExternalConfig({
                              ...externalConfig,
                              dateParameter: e.target.value,
                            })
                          }
                          className="px-3 py-2 rounded-lg border border-border bg-background text-sm w-full"
                        />
                      </Field>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <Field label="Cash JSON Path">
                        <input
                          value={externalConfig.cashAmountPath}
                          onChange={(e) =>
                            setExternalConfig({
                              ...externalConfig,
                              cashAmountPath: e.target.value,
                            })
                          }
                          placeholder="data.cash"
                          className="px-3 py-2 rounded-lg border border-border bg-background text-sm w-full"
                        />
                      </Field>
                      <Field label="Coupon JSON Path">
                        <input
                          value={externalConfig.couponAmountPath}
                          onChange={(e) =>
                            setExternalConfig({
                              ...externalConfig,
                              couponAmountPath: e.target.value,
                            })
                          }
                          placeholder="data.coupons"
                          className="px-3 py-2 rounded-lg border border-border bg-background text-sm w-full"
                        />
                      </Field>
                      <Field label="Card JSON Path">
                        <input
                          value={externalConfig.ccAmountPath}
                          onChange={(e) =>
                            setExternalConfig({
                              ...externalConfig,
                              ccAmountPath: e.target.value,
                            })
                          }
                          placeholder="data.creditCard"
                          className="px-3 py-2 rounded-lg border border-border bg-background text-sm w-full"
                        />
                      </Field>
                    </div>
                    <div className="rounded-lg border border-border bg-muted/40 px-3 py-2 text-xs text-muted-foreground">
                      API credential:{" "}
                      {credentialConfigured
                        ? "Configured securely"
                        : "Not configured"}
                      . Set <code>EXTERNAL_COLLECTIONS_API_TOKEN</code> in
                      Replit Secrets when the provider requires a bearer token.
                    </div>
                    <div className="flex justify-end pt-2">
                      <button
                        onClick={saveExternalConfig}
                        disabled={externalConfigSaving}
                        className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium disabled:opacity-60 w-full sm:w-auto justify-center"
                      >
                        {externalConfigSaving && (
                          <Loader2 size={14} className="animate-spin" />
                        )}
                        Save External Settings
                      </button>
                    </div>
                  </div>
                )}
              </SectionCard>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
