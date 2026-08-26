"use client";
import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { useLocation } from "wouter";
import {
  Eye,
  EyeOff,
} from "lucide-react";
import AppLogo from "@/components/ui/AppLogo";
import { useAuth } from "@/context/AuthContext";
import { API_BASE } from "@/lib/apiBase";

interface LoginFormValues {
  identifier: string;
  password: string;
  remember: boolean;
}

export default function LoginForm() {
  const [, setLocation] = useLocation();
  const { login: authLogin } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);
  const [showRecovery, setShowRecovery] = useState(false);
  const [recoveryToken, setRecoveryToken] = useState("");
  const [recoveryError, setRecoveryError] = useState<string | null>(null);
  const [recoverySuccess, setRecoverySuccess] = useState<string | null>(null);
  const [isRecovering, setIsRecovering] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<LoginFormValues>({
    defaultValues: { identifier: "", password: "", remember: false },
  });

  const loginWithCredentials = async (identifier: string, password: string) => {
    setIsLoading(true);
    setLoginError(null);

    try {
      const response = await fetch(`${API_BASE}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ identifier, password }),
      });

      if (!response.ok) {
        setLoginError("Invalid user code, email address, or password.");
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

  const onSubmit = async (data: LoginFormValues) => {
    loginWithCredentials(data.identifier, data.password);
  };

  const recoverInitialAdmin = async () => {
    if (!recoveryToken.trim()) {
      setRecoveryError("Enter the administrator recovery token.");
      return;
    }

    setIsRecovering(true);
    setRecoveryError(null);
    setRecoverySuccess(null);
    try {
      const response = await fetch(`${API_BASE}/auth/recover-initial-admin`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ recoveryToken }),
      });
      const result = await response.json();
      if (!response.ok) {
        setRecoveryError(result.error || "Administrator recovery could not be completed.");
        return;
      }
      setRecoveryToken("");
      setRecoverySuccess(result.message || "Administrator password reset.");
    } catch {
      setRecoveryError("Cannot reach server. Please try again.");
    } finally {
      setIsRecovering(false);
    }
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
              Sign in with the user code and password assigned to your account
            </p>
          </div>

          {/* Form */}
          <form
            onSubmit={handleSubmit(onSubmit)}
            className="space-y-4"
            noValidate
          >
            <div>
              <label
                htmlFor="identifier"
                className="block text-sm font-medium text-foreground mb-1.5"
              >
                User Code or Email Address
              </label>
              <input
                id="identifier"
                type="text"
                autoComplete="username"
                placeholder="Enter your user code or email address"
                className={`
                  w-full h-10 px-3 rounded-md border text-sm bg-card
                  focus:outline-none focus:ring-2 focus:ring-ring focus:border-ring
                  transition-all duration-150
                  ${errors.identifier ? "border-red-400 focus:ring-red-400" : "border-input"}
                `}
                {...register("identifier", {
                  required: "User code or email address is required",
                })}
              />
              {errors.identifier && (
                <p className="mt-1 text-xs text-red-500 flex items-center gap-1">
                  {errors.identifier.message}
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
                onClick={() => {
                  setShowRecovery((visible) => !visible);
                  setRecoveryError(null);
                  setRecoverySuccess(null);
                }}
                className="text-sm text-primary hover:underline font-medium"
              >
                Administrator recovery
              </button>
            </div>

            {showRecovery && (
              <div className="rounded-md border border-amber-200 bg-amber-50 p-3 space-y-2.5">
                <p className="text-xs leading-relaxed text-amber-900">
                  Use this only to restore the initial administrator account. Enter the one-time recovery token stored in Replit Secrets.
                </p>
                <label htmlFor="recovery-token" className="sr-only">
                  Administrator recovery token
                </label>
                <input
                  id="recovery-token"
                  type="password"
                  autoComplete="off"
                  value={recoveryToken}
                  onChange={(event) => setRecoveryToken(event.target.value)}
                  placeholder="Recovery token"
                  className="w-full h-9 px-3 rounded-md border border-amber-300 bg-background text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
                />
                {recoveryError && (
                  <p className="text-xs text-red-700">{recoveryError}</p>
                )}
                {recoverySuccess && (
                  <p className="text-xs text-emerald-700">{recoverySuccess}</p>
                )}
                <button
                  type="button"
                  onClick={recoverInitialAdmin}
                  disabled={isRecovering}
                  className="h-8 px-3 rounded-md border border-amber-400 text-xs font-semibold text-amber-900 hover:bg-amber-100 disabled:opacity-60"
                >
                  {isRecovering ? "Resetting…" : "Reset initial administrator"}
                </button>
              </div>
            )}

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
