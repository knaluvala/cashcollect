import React from 'react';

type StatusType =
  | 'pending' |'entered' |'submitted' |'acknowledged' |'overdue' |'active' |'inactive';

interface StatusBadgeProps {
  status: StatusType;
  label?: string;
  size?: 'sm' | 'md';
}

const STATUS_CONFIG: Record<
  StatusType,
  { label: string; className: string }
> = {
  pending: {
    label: 'Pending',
    className: 'bg-amber-50 text-amber-700 border border-amber-200',
  },
  entered: {
    label: 'Entered',
    className: 'bg-blue-50 text-blue-700 border border-blue-200',
  },
  submitted: {
    label: 'Submitted',
    className: 'bg-purple-50 text-purple-700 border border-purple-200',
  },
  acknowledged: {
    label: 'Acknowledged',
    className: 'bg-emerald-50 text-emerald-700 border border-emerald-200',
  },
  overdue: {
    label: 'Overdue',
    className: 'bg-red-50 text-red-700 border border-red-200',
  },
  active: {
    label: 'Active',
    className: 'bg-emerald-50 text-emerald-700 border border-emerald-200',
  },
  inactive: {
    label: 'Inactive',
    className: 'bg-slate-100 text-slate-500 border border-slate-200',
  },
};

export default function StatusBadge({
  status,
  label,
  size = 'md',
}: StatusBadgeProps) {
  const config = STATUS_CONFIG[status];
  const displayLabel = label ?? config.label;
  const sizeClass =
    size === 'sm' ?'text-[11px] px-1.5 py-0.5' :'text-xs px-2 py-0.5';

  return (
    <span
      className={`inline-flex items-center rounded-full font-medium ${sizeClass} ${config.className}`}
    >
      {displayLabel}
    </span>
  );
}