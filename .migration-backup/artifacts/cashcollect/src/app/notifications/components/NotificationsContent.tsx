import React, { useState } from 'react';
import { Bell, CheckCircle, AlertCircle, Info, Clock, Trash2, CheckCheck } from 'lucide-react';

type NotifType = 'acknowledgment' | 'alert' | 'info' | 'reminder';

interface Notification {
  id: string;
  type: NotifType;
  title: string;
  body: string;
  time: string;
  read: boolean;
  parlor?: string;
}

const MOCK_NOTIFICATIONS: Notification[] = [
  {
    id: 'n1',
    type: 'acknowledgment',
    title: 'Collection Acknowledged',
    body: 'Meena Sharma acknowledged your collection for Nexus Mall — Koramangala.',
    time: '2 hours ago',
    read: false,
    parlor: 'Nexus Mall — Koramangala',
  },
  {
    id: 'n2',
    type: 'reminder',
    title: 'Pending Collections',
    body: '7 parlors on Route RT-04 have not been collected today. Please update before 6:00 PM.',
    time: '3 hours ago',
    read: false,
  },
  {
    id: 'n3',
    type: 'alert',
    title: 'Collection Mismatch Flagged',
    body: 'Cash amount for Forum Value Mall (PRL-007) differs from expected by ₹450. Supervisor review required.',
    time: '5 hours ago',
    read: false,
    parlor: 'Forum Value Mall',
  },
  {
    id: 'n4',
    type: 'acknowledgment',
    title: 'Collection Acknowledged',
    body: 'Meena Sharma acknowledged your collection for Indiranagar 100ft Road.',
    time: 'Yesterday, 4:12 PM',
    read: true,
    parlor: 'Indiranagar 100ft Road',
  },
  {
    id: 'n5',
    type: 'info',
    title: 'Parlor Master Updated',
    body: '3 new parlors have been added to your route (RT-04) by the administrator.',
    time: 'Yesterday, 11:00 AM',
    read: true,
  },
  {
    id: 'n6',
    type: 'reminder',
    title: 'Weekly Summary Ready',
    body: 'Your weekly collection summary for 12–18 May 2026 is ready to view in Reports.',
    time: '2 days ago',
    read: true,
  },
  {
    id: 'n7',
    type: 'acknowledgment',
    title: 'Collection Acknowledged',
    body: 'Meena Sharma acknowledged your collection for Phoenix Marketcity.',
    time: '3 days ago',
    read: true,
    parlor: 'Phoenix Marketcity',
  },
];

const TYPE_CONFIG: Record<NotifType, { icon: React.ElementType; bg: string; iconColor: string }> = {
  acknowledgment: { icon: CheckCircle, bg: 'bg-emerald-50', iconColor: 'text-emerald-600' },
  alert: { icon: AlertCircle, bg: 'bg-red-50', iconColor: 'text-red-500' },
  info: { icon: Info, bg: 'bg-blue-50', iconColor: 'text-blue-500' },
  reminder: { icon: Clock, bg: 'bg-amber-50', iconColor: 'text-amber-500' },
};

export default function NotificationsContent() {
  const [notifications, setNotifications] = useState<Notification[]>(MOCK_NOTIFICATIONS);
  const [filter, setFilter] = useState<'all' | 'unread'>('all');

  const unreadCount = notifications.filter((n) => !n.read).length;
  const visible = filter === 'unread' ? notifications.filter((n) => !n.read) : notifications;

  function markAllRead() {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  }

  function markRead(id: string) {
    setNotifications((prev) => prev.map((n) => n.id === id ? { ...n, read: true } : n));
  }

  function dismiss(id: string) {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-border shrink-0">
        <div className="flex items-center gap-2">
          <h1 className="text-xl font-semibold text-foreground">Notifications</h1>
          {unreadCount > 0 && (
            <span className="text-xs font-semibold bg-red-100 text-red-600 rounded-full px-2 py-0.5">
              {unreadCount} new
            </span>
          )}
        </div>
        {unreadCount > 0 && (
          <button
            onClick={markAllRead}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-md border border-border bg-card text-sm text-muted-foreground hover:text-foreground hover:bg-muted transition-all duration-150"
          >
            <CheckCheck size={14} />
            Mark all read
          </button>
        )}
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-1 px-6 py-3 border-b border-border shrink-0">
        <div className="flex items-center gap-1 rounded-lg border border-border bg-muted p-0.5">
          {(['all', 'unread'] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3 py-1 rounded-md text-xs font-medium transition-all duration-150 ${
                filter === f
                  ? 'bg-card text-foreground shadow-sm border border-border'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              {f === 'all' ? `All (${notifications.length})` : `Unread (${unreadCount})`}
            </button>
          ))}
        </div>
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto scrollbar-thin">
        {visible.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 gap-3">
            <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center">
              <Bell size={20} className="text-muted-foreground" />
            </div>
            <p className="text-sm font-medium text-muted-foreground">
              {filter === 'unread' ? 'All caught up!' : 'No notifications'}
            </p>
            {filter === 'unread' && (
              <button
                onClick={() => setFilter('all')}
                className="text-sm text-primary hover:underline"
              >
                View all notifications
              </button>
            )}
          </div>
        ) : (
          <ul className="divide-y divide-border">
            {visible.map((n) => {
              const cfg = TYPE_CONFIG[n.type];
              const Icon = cfg.icon;
              return (
                <li
                  key={n.id}
                  onClick={() => markRead(n.id)}
                  className={`flex items-start gap-3 px-6 py-4 cursor-pointer transition-colors hover:bg-muted/40 ${
                    !n.read ? 'bg-primary/[0.03]' : ''
                  }`}
                >
                  {/* Icon */}
                  <div className={`mt-0.5 w-8 h-8 rounded-full ${cfg.bg} flex items-center justify-center shrink-0`}>
                    <Icon size={15} className={cfg.iconColor} />
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <p className={`text-sm ${!n.read ? 'font-semibold text-foreground' : 'font-medium text-foreground'}`}>
                        {n.title}
                      </p>
                      <div className="flex items-center gap-1.5 shrink-0">
                        <span className="text-xs text-muted-foreground whitespace-nowrap">{n.time}</span>
                        <button
                          onClick={(e) => { e.stopPropagation(); dismiss(n.id); }}
                          className="text-muted-foreground hover:text-red-500 transition-colors p-0.5 rounded"
                          title="Dismiss"
                        >
                          <Trash2 size={12} />
                        </button>
                      </div>
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">{n.body}</p>
                    {n.parlor && (
                      <span className="inline-block mt-1.5 text-[11px] font-medium text-primary bg-primary/10 px-2 py-0.5 rounded-full">
                        {n.parlor}
                      </span>
                    )}
                  </div>

                  {/* Unread dot */}
                  {!n.read && (
                    <div className="mt-2 w-2 h-2 rounded-full bg-primary shrink-0" />
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}
