'use client';
import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useLocation } from 'wouter';
import { Eye, EyeOff, Copy, Check, IceCream, TrendingUp, Shield } from 'lucide-react';
import AppLogo from '@/components/ui/AppLogo';
import Icon from '@/components/ui/AppIcon';


type Role = 'agent' | 'supervisor' | 'superadmin';

interface LoginFormValues {
  email: string;
  password: string;
  remember: boolean;
}

interface DemoCredential {
  role: string;
  email: string;
  password: string;
  roleKey: Role;
}

const DEMO_CREDENTIALS: DemoCredential[] = [
  {
    role: 'Collection Agent',
    email: 'rajan.kumar@cashcollect.in',
    password: 'Agent@2026',
    roleKey: 'agent',
  },
  {
    role: 'Supervisor',
    email: 'meena.sharma@cashcollect.in',
    password: 'Super@2026',
    roleKey: 'supervisor',
  },
  {
    role: 'Super Admin',
    email: 'admin@cashcollect.in',
    password: 'Admin@2026',
    roleKey: 'superadmin',
  },
];

const ROLE_TABS: { key: Role; label: string; icon: React.ElementType }[] = [
  { key: 'agent', label: 'Collection Agent', icon: IceCream },
  { key: 'supervisor', label: 'Supervisor', icon: TrendingUp },
  { key: 'superadmin', label: 'Super Admin', icon: Shield },
];

export default function LoginForm() {
  const [, setLocation] = useLocation();
  const [activeRole, setActiveRole] = useState<Role>('agent');
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
    defaultValues: { email: '', password: '', remember: false },
  });

  const handleCopy = async (text: string, field: string) => {
    await navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 1500);
  };

  const handleAutofill = (cred: DemoCredential) => {
    setValue('email', cred.email);
    setValue('password', cred.password);
    setActiveRole(cred.roleKey);
    setLoginError(null);
  };

  const onSubmit = async (data: LoginFormValues) => {
    setIsLoading(true);
    setLoginError(null);

    // BACKEND INTEGRATION POINT: POST /api/auth/login with { email, password, role: activeRole }
    await new Promise((r) => setTimeout(r, 1200));

    const match = DEMO_CREDENTIALS.find(
      (c) => c.email === data.email && c.password === data.password
    );

    if (!match) {
      setLoginError(
        'Invalid credentials — use the demo accounts below to sign in.'
      );
      setIsLoading(false);
      return;
    }

    setIsLoading(false);
    setLocation('/daily-collection-entry');
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
            { icon: '🏪', text: 'Track collections across 200+ parlors' },
            { icon: '✅', text: 'Real-time supervisor acknowledgment' },
            { icon: '📊', text: 'Instant collector-wise reports' },
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
                        ? 'bg-card text-primary shadow-sm border border-border'
                        : 'text-muted-foreground hover:text-foreground'
                    }
                  `}
                >
                  <Icon size={13} />
                  <span className="hidden sm:inline">{tab.label}</span>
                  <span className="sm:hidden">
                    {tab.key === 'agent' ?'Agent'
                      : tab.key === 'supervisor' ?'Supervisor' :'Admin'}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
            {/* Email */}
            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium text-foreground mb-1.5"
              >
                Email address
              </label>
              <input
                id="email"
                type="email"
                autoComplete="email"
                placeholder="yourname@cashcollect.in"
                className={`
                  w-full h-10 px-3 rounded-md border text-sm bg-card
                  focus:outline-none focus:ring-2 focus:ring-ring focus:border-ring
                  transition-all duration-150
                  ${errors.email ? 'border-red-400 focus:ring-red-400' : 'border-input'}
                `}
                {...register('email', {
                  required: 'Email address is required',
                  pattern: {
                    value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                    message: 'Enter a valid email address',
                  },
                })}
              />
              {errors.email && (
                <p className="mt-1 text-xs text-red-500 flex items-center gap-1">
                  {errors.email.message}
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
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  placeholder="Enter your password"
                  className={`
                    w-full h-10 px-3 pr-10 rounded-md border text-sm bg-card
                    focus:outline-none focus:ring-2 focus:ring-ring focus:border-ring
                    transition-all duration-150
                    ${errors.password ? 'border-red-400 focus:ring-red-400' : 'border-input'}
                  `}
                  {...register('password', {
                    required: 'Password is required',
                    minLength: {
                      value: 6,
                      message: 'Password must be at least 6 characters',
                    },
                  })}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
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
                  {...register('remember')}
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
                'Sign in'
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
                  onKeyDown={(e) => e.key === 'Enter' && handleAutofill(cred)}
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-foreground">
                      {cred.role}
                    </p>
                    <p className="text-[11px] text-muted-foreground truncate">
                      {cred.email}
                    </p>
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleCopy(cred.email, `email-${cred.roleKey}`);
                      }}
                      className="p-1 rounded text-muted-foreground hover:text-foreground hover:bg-border transition-colors"
                      title="Copy email"
                    >
                      {copiedField === `email-${cred.roleKey}` ? (
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
            By signing in you agree to the{' '}
            <span className="text-primary hover:underline cursor-pointer">
              Terms of Service
            </span>{' '}
            and{' '}
            <span className="text-primary hover:underline cursor-pointer">
              Privacy Policy
            </span>
          </p>
        </div>
      </div>
    </div>
  );
}