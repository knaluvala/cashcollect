'use client';
import React, { useState } from 'react';
import { Link, useLocation } from 'wouter';
import AppLogo from '@/components/ui/AppLogo';
import { ClipboardList, BarChart2, Users, Store, ChevronLeft, ChevronRight, LogOut, Settings, Bell,  } from 'lucide-react';
import Icon from '@/components/ui/AppIcon';
import { useAuth } from '@/context/AuthContext';


interface SidebarProps {
  collapsed: boolean;
  onToggle: () => void;
}

const NAV_GROUPS = [
  {
    label: 'Operations',
    items: [
      {
        key: 'nav-collection',
        href: '/daily-collection-entry',
        icon: ClipboardList,
        label: 'Daily Collection',
        badge: 3,
      },
      {
        key: 'nav-reports',
        href: '/reports',
        icon: BarChart2,
        label: 'Reports',
        badge: null,
      },
    ],
  },
  {
    label: 'Administration',
    items: [
      {
        key: 'nav-users',
        href: '/user-management',
        icon: Users,
        label: 'User Management',
        badge: null,
      },
      {
        key: 'nav-parlors',
        href: '/super-admin/parlor-master',
        icon: Store,
        label: 'Parlor Master',
        badge: null,
      },
      {
        key: 'nav-settings',
        href: '#',
        icon: Settings,
        label: 'Settings',
        badge: null,
      },
    ],
  },
];

export default function Sidebar({ collapsed, onToggle }: SidebarProps) {
  const [pathname, setLocation] = useLocation();
  const { user, logout } = useAuth();
  const isSuperAdmin = user?.role === 'superadmin';

  return (
    <aside
      className="relative flex flex-col bg-card border-r border-border sidebar-transition shrink-0"
      style={{ width: collapsed ? 64 : 240 }}
    >
      {/* Logo */}
      <div
        className={`flex items-center h-16 px-3 border-b border-border ${
          collapsed ? 'justify-center' : 'gap-3'
        }`}
      >
        <AppLogo size={36} />
        {!collapsed && (
          <span className="font-semibold text-base text-foreground tracking-tight whitespace-nowrap">
            CashCollect
          </span>
        )}
      </div>

      {/* Nav Groups */}
      <nav className="flex-1 overflow-y-auto scrollbar-thin py-3 px-2 space-y-4">
        {NAV_GROUPS.map((group) => {
          const visibleItems = group.items.filter((item) => {
            if (item.key === 'nav-users') return isSuperAdmin;
            return true;
          });
          if (visibleItems.length === 0) return null;
          return (
          <div key={`group-${group.label}`}>
            {!collapsed && (
              <p className="text-[11px] font-600 uppercase tracking-widest text-muted-foreground px-2 mb-1">
                {group.label}
              </p>
            )}
            <ul className="space-y-0.5">
              {visibleItems.map((item) => {
                const Icon = item.icon;
                const isActive =
                  item.href !== '#' && pathname === item.href;
                return (
                  <li key={item.key}>
                    <Link
                      href={item.href}
                      title={collapsed ? item.label : undefined}
                      className={`
                        group flex items-center gap-3 px-2 py-2 rounded-md text-sm font-medium
                        transition-all duration-150
                        ${
                          isActive
                            ? 'bg-primary/10 text-primary' :'text-secondary-foreground hover:bg-muted hover:text-foreground'
                        }
                        ${collapsed ? 'justify-center' : ''}
                      `}
                    >
                      <Icon
                        size={18}
                        className={`shrink-0 ${
                          isActive ? 'text-primary' : 'text-muted-foreground group-hover:text-foreground'
                        }`}
                      />
                      {!collapsed && (
                        <span className="flex-1 whitespace-nowrap">
                          {item.label}
                        </span>
                      )}
                      {!collapsed && item.badge !== null && (
                        <span className="text-[11px] font-semibold bg-accent text-accent-foreground rounded-full px-1.5 py-0.5 leading-none">
                          {item.badge}
                        </span>
                      )}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
          );
        })}
      </nav>

      {/* User Footer */}
      <div className="border-t border-border p-2 space-y-1">
        <Link
          href="/notifications"
          className={`w-full flex items-center gap-3 px-2 py-2 rounded-md text-sm font-medium transition-all duration-150 ${
            pathname === '/notifications'
              ? 'bg-primary/10 text-primary'
              : 'text-muted-foreground hover:bg-muted hover:text-foreground'
          } ${collapsed ? 'justify-center' : ''}`}
          title={collapsed ? 'Notifications' : undefined}
        >
          <Bell size={18} className={`shrink-0 ${pathname === '/notifications' ? 'text-primary' : ''}`} />
          {!collapsed && <span>Notifications</span>}
          {!collapsed && (
            <span className="ml-auto text-[11px] font-semibold bg-red-100 text-red-600 rounded-full px-1.5 py-0.5 leading-none">
              2
            </span>
          )}
        </Link>

        {!collapsed && (
          <div className="flex items-center gap-2 px-2 py-2 rounded-md bg-muted">
            <div className="w-7 h-7 rounded-full bg-primary flex items-center justify-center text-primary-foreground text-xs font-semibold shrink-0">
              {user?.name ? user.name.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase() : 'U'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-foreground truncate">
                {user?.name ?? 'User'}
              </p>
              <p className="text-[11px] text-muted-foreground truncate capitalize">
                {user?.role === 'superadmin' ? 'Super Admin' : user?.role ?? ''}
              </p>
            </div>
            <button
              onClick={() => { logout(); setLocation('/'); }}
              className="text-muted-foreground hover:text-red-500 transition-colors"
              title="Sign out"
            >
              <LogOut size={15} />
            </button>
          </div>
        )}

        {collapsed && (
          <button
            onClick={() => { logout(); setLocation('/'); }}
            className="w-full flex items-center justify-center px-2 py-2 rounded-md text-muted-foreground hover:bg-muted hover:text-red-500 transition-all duration-150"
            title="Sign out"
          >
            <LogOut size={18} />
          </button>
        )}
      </div>

      {/* Toggle Button */}
      <button
        onClick={onToggle}
        className="absolute -right-3 top-[72px] z-10 w-6 h-6 rounded-full bg-card border border-border flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted shadow-sm transition-all duration-150"
        title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
      >
        {collapsed ? <ChevronRight size={12} /> : <ChevronLeft size={12} />}
      </button>
    </aside>
  );
}