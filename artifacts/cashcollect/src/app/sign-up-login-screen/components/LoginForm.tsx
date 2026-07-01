"use client";
import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { useLocation } from "wouter";
import {
  Eye,
  EyeOff,
  Copy,
  Check,
  IceCream,
  TrendingUp,
  Shield,
} from "lucide-react";
import AppLogo from "@/components/ui/AppLogo";
import Icon from "@/components/ui/AppIcon";
import { useAuth } from "@/context/AuthContext";

type Role = "agent" | "supervisor" | "superadmin";

interface LoginFormValues {
  userCode: string;
  password: string;
  remember: boolean;
}

interface DemoCredential {
  role: string;
  userCode: string;
  password: string;
  roleKey: Role;
}

const DEMO_CREDENTIALS: DemoCredential[] = [
  {
    role: "Collection Agent",
    userCode: "AGT-042",
    password: "Agent@2026",
    roleKey: "agent",
  },
  {
    role: "Supervisor",
    userCode: "SUP-012",
    password: "Super@2026",
    roleKey: "supervisor",
  },
  {
    role: "Super Admin",
    userCode: "ADM-001",
    password: "Admin@2026",
    roleKey: "superadmin",
  },
];

const ROLE_TABS: { key: Role; label: string; icon: React.ElementType }[] = [
  { key: "agent", label: "Collection Agent", icon: IceCream },
  { key: "supervisor", label: "Supervisor", icon: TrendingUp },
  { key: "superadmin", label: "Super Admin", icon: Shield },
];

const DEMO_NAMES: Record<string, string> = {
  "rajan.kumar@cashcollect.in": "Rajan Kumar",
  "meena.sharma@cashcollect.in": "Meena Sharma",
  "admin@cashcollect.in": "Super Admin",
};

const DEMO_CODES: Record<
  string,
  { id: number; agentCode?: string; supervisorCode?: string }
> = {
  "rajan.kumar@cashcollect.in": {
    id: 2,
    agentCode: "AGT-042",
    supervisorCode: "SUP-012",
  },
  "meena.sharma@cashcollect.in": { id: 3, supervisorCode: "SUP-012" },
  "admin@cashcollect.in": { id: 6 },
};

export default function LoginForm() {
  const [, setLocation] = useLocation();
  const { login: authLogin } = useAuth();
  const [activeRole, setActiveRole] = useState<Role>("agent");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [loginError, setLoginError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<LoginFormValues>({
    defaultValues: { userCode: "", password: "", remember: false },
  });

  const handleCopy = async (text: string, field: string) => {
    await navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 1500);
  };

  const loginWithCredentials = async (userCode: string, password: string) => {
    setIsLoading(true);
    setLoginError(null);

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userCode, password }),
      });

      if (!response.ok) {
        setLoginError("Invalid user code or password.");
        setIsLoading(false);
        return;
      }

      const result = await response.json();

      authLogin(result.user, result.token);
      setIsLoading(false);
      setLocation("/daily-collection-entry");
    } catch {
      setLoginError("Cannot reach server. Please try again.");
      setIsLoading(false);
    }
  };

  const handleAutofill = (cred: DemoCredential) => {
    setValue("userCode", cred.userCode);
    setValue("password", cred.password);
    setActiveRole(cred.roleKey);
    setLoginError(null);
    loginWithCredentials(cred.userCode, cred.password);
  };

  const onSubmit = async (data: LoginFormValues) => {
    loginWithCredentials(data.userCode, data.password);
  };

  return (
    <div className="min-h-screen flex">
      {/* Left Brand Panel */}
      <div className="hidden lg:flex lg:w-[480px] xl:w-[520px] flex-col justify-between bg-primary p-10 relative overflow-hidden">
        <div className="blob-primary absolute inset-0 opacity-40" />
        <div className="blob-accent absolute bottom-0 right-0 w-64 h-64 opacity-20" />

        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-12">
            <AppLogo size={44} />
            <span className="text-white font-semibold text-xl tracking-tight">
              CashCollect
            </span>
          </div>

          <h1 className="text-3xl font-bold text-white leading-tight mb-4">
            Ice Cream Parlor
            <br />
            Cash Collection
            <br />
            <span className="text-orange-300">Made Simple</span>
          </h1>
          <p className="text-blue-200 text-base leading-relaxed max-w-sm">
            Record daily collections from every parlor on your route — cash,
            coupons, and card transactions — and submit for supervisor
            acknowledgment in seconds.
          </p>
        </div>

        <div className="relative z-10 space-y-3">
          {[
            { icon: "🏪", text: "Track collections across 200+ parlors" },
            { icon: "✅", text: "Real-time supervisor acknowledgment" },
            { icon: "📊", text: "Instant collector-wise reports" },
          ].map((item) => (
            <div
              key={`feature-${item.icon}`}
              className="flex items-center gap-3 text-blue-100 text-sm"
            >
              <span className="text-lg">{item.icon}</span>
              <span>{item.text}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Right Form Panel */}
      <div className="flex-1 flex items-center justify-center p-6 bg-background">
        <div className="w-full max-w-md">
          {/* Mobile Logo */}
          <div className="flex items-center gap-2 mb-8 lg:hidden">
            <AppLogo size={36} />
            <span className="font-semibold text-lg text-foreground">
              CashCollect
            </span>
          </div>

          <div className="mb-7">
            <h2 className="text-2xl font-semibold text-foreground mb-1">
              Sign in
            </h2>
            <p className="text-muted-foreground text-sm">
              Select your role and enter your credentials
            </p>
          </div>

          {/* Role Tabs */}
          <div className="flex rounded-lg border border-border bg-muted p-1 mb-6 gap-1">
            {ROLE_TABS.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={`role-tab-${tab.key}`}
                  onClick={() => {
                    setActiveRole(tab.key);
                    setLoginError(null);
                  }}
                  className={`
                    flex-1 flex items-center justify-center gap-1.5 py-2 px-2 rounded-md text-xs font-medium
                    transition-all duration-150
                    ${
                      activeRole === tab.key
                        ? "bg-card text-primary shadow-sm border border-border"
                        : "text-muted-foreground hover:text-foreground"
                    }
                  `}
                >
                  <Icon size={13} />
                  <span className="hidden sm:inline">{tab.label}</span>
                  <span className="sm:hidden">
                    {tab.key === "agent"
                      ? "Agent"
                      : tab.key === "supervisor"
                        ? "Supervisor"
                        : "Admin"}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Form */}
          <form
            onSubmit={handleSubmit(onSubmit)}
            className="space-y-4"
            noValidate
          >
            {/* Email */}
            <div>
              <label
                htmlFor="userCode"
                className="block text-sm font-medium text-foreground mb-1.5"
              >
                User Code
              </label>
              <input
                id="userCode"
                type="text"
                autoComplete="username"
                placeholder="e.g. ADM-001"
                className={`
                  w-full h-10 px-3 rounded-md border text-sm bg-card
                  focus:outline-none focus:ring-2 focus:ring-ring focus:border-ring
                  transition-all duration-150
                  ${errors.userCode ? "border-red-400 focus:ring-red-400" : "border-input"}
                `}
                {...register("userCode", {
                  required: "User code is required",
                })}
              />
              {errors.userCode && (
                <p className="mt-1 text-xs text-red-500 flex items-center gap-1">
                  {errors.userCode.message}
                </p>
              )}
            </div>

            {/* Password */}
            <div>
              <label
                htmlFor="password"
                className="block text-sm font-medium text-foreground mb-1.5"
              >
                Password
              </label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  placeholder="Enter your password"
                  className={`
                    w-full h-10 px-3 pr-10 rounded-md border text-sm bg-card
                    focus:outline-none focus:ring-2 focus:ring-ring focus:border-ring
                    transition-all duration-150
                    ${errors.password ? "border-red-400 focus:ring-red-400" : "border-input"}
                  `}
                  {...register("password", {
                    required: "Password is required",
                    minLength: {
                      value: 6,
                      message: "Password must be at least 6 characters",
                    },
                  })}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              {errors.password && (
                <p className="mt-1 text-xs text-red-500">
                  {errors.password.message}
                </p>
              )}
            </div>

            {/* Remember me + forgot */}
            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 text-sm text-muted-foreground cursor-pointer select-none">
                <input
                  type="checkbox"
                  className="w-4 h-4 rounded border-input accent-primary"
                  {...register("remember")}
                />
                Remember me
              </label>
              <button
                type="button"
                className="text-sm text-primary hover:underline font-medium"
              >
                Forgot password?
              </button>
            </div>

            {/* Login Error */}
            {loginError && (
              <div className="rounded-md bg-red-50 border border-red-200 px-3 py-2.5 text-sm text-red-700">
                {loginError}
              </div>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={isLoading}
              className="
                w-full h-10 rounded-md bg-primary text-primary-foreground text-sm font-semibold
                hover:bg-primary/90 active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed
                transition-all duration-150 flex items-center justify-center gap-2
              "
            >
              {isLoading ? (
                <>
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Signing in…
                </>
              ) : (
                "Sign in"
              )}
            </button>
          </form>

          {/* Demo Credentials */}
          <div className="mt-6 rounded-lg border border-border bg-muted/50 overflow-hidden">
            <div className="px-4 py-2.5 border-b border-border bg-muted">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                Demo Accounts — Click to autofill
              </p>
            </div>
            <div className="divide-y divide-border">
              {DEMO_CREDENTIALS.map((cred) => (
                <div
                  key={`demo-${cred.roleKey}`}
                  className="px-4 py-3 flex items-center gap-3 hover:bg-muted/80 transition-colors cursor-pointer"
                  onClick={() => handleAutofill(cred)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => e.key === "Enter" && handleAutofill(cred)}
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-foreground">
                      {cred.role}
                    </p>
                    <p className="text-[11px] text-muted-foreground truncate">
                      {cred.userCode}
                    </p>
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleCopy(cred.userCode, `userCode-${cred.roleKey}`);
                      }}
                      className="p-1 rounded text-muted-foreground hover:text-foreground hover:bg-border transition-colors"
                      title="Copy email"
                    >
                      {copiedField === `userCode-${cred.roleKey}` ? (
                        <Check size={12} className="text-emerald-500" />
                      ) : (
                        <Copy size={12} />
                      )}
                    </button>
                    <span className="text-[10px] font-mono text-muted-foreground bg-border px-1.5 py-0.5 rounded">
                      {cred.password}
                    </span>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleCopy(cred.password, `pwd-${cred.roleKey}`);
                      }}
                      className="p-1 rounded text-muted-foreground hover:text-foreground hover:bg-border transition-colors"
                      title="Copy password"
                    >
                      {copiedField === `pwd-${cred.roleKey}` ? (
                        <Check size={12} className="text-emerald-500" />
                      ) : (
                        <Copy size={12} />
                      )}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <p className="mt-4 text-center text-xs text-muted-foreground">
            By signing in you agree to the{" "}
            <span className="text-primary hover:underline cursor-pointer">
              Terms of Service
            </span>{" "}
            and{" "}
            <span className="text-primary hover:underline cursor-pointer">
              Privacy Policy
            </span>
          </p>
        </div>
      </div>
    </div>
  );
}
