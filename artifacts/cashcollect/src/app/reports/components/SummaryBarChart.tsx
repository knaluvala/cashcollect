'use client';
import React from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
interface Props {
  data: { agentName: string; totalCash: number; totalCoupon: number; totalCC: number }[];
}

interface CustomTooltipProps {
  active?: boolean;
  payload?: { name: string; value: number; color: string }[];
  label?: string;
}

function CustomTooltip({ active, payload, label }: CustomTooltipProps) {
  if (!active || !payload || payload.length === 0) return null;
  const fmt = (n: number) =>
    '₹' + n.toLocaleString('en-IN', { minimumFractionDigits: 0 });

  return (
    <div className="bg-card border border-border rounded-lg shadow-lg px-3 py-2.5 text-sm min-w-[180px]">
      <p className="font-semibold text-foreground mb-1.5 text-xs">{label}</p>
      {payload.map((p) => (
        <div
          key={`tooltip-${p.name}`}
          className="flex items-center justify-between gap-4 text-xs"
        >
          <span className="flex items-center gap-1.5 text-muted-foreground">
            <span
              className="w-2 h-2 rounded-sm"
              style={{ backgroundColor: p.color }}
            />
            {p.name}
          </span>
          <span className="font-semibold tabular-nums" style={{ color: p.color }}>
            {fmt(p.value)}
          </span>
        </div>
      ))}
    </div>
  );
}

export default function SummaryBarChart({ data }: Props) {
  const chartData = data.map((row) => ({
    name: row.agentName.split(' ')[0],
    Cash: row.totalCash,
    Coupons: row.totalCoupon,
    Card: row.totalCC,
  }));

  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart
        data={chartData}
        margin={{ top: 4, right: 8, left: 0, bottom: 0 }}
        barCategoryGap="30%"
        barGap={2}
      >
        <defs>
          <linearGradient id="gradCash" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#059669" stopOpacity={0.9} />
            <stop offset="100%" stopColor="#10b981" stopOpacity={0.7} />
          </linearGradient>
          <linearGradient id="gradCoupon" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#2563eb" stopOpacity={0.9} />
            <stop offset="100%" stopColor="#3b82f6" stopOpacity={0.7} />
          </linearGradient>
          <linearGradient id="gradCC" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#7c3aed" stopOpacity={0.9} />
            <stop offset="100%" stopColor="#8b5cf6" stopOpacity={0.7} />
          </linearGradient>
        </defs>
        <CartesianGrid
          strokeDasharray="3 3"
          stroke="var(--border)"
          vertical={false}
        />
        <XAxis
          dataKey="name"
          tick={{ fontSize: 11, fill: 'var(--muted-foreground)' }}
          axisLine={false}
          tickLine={false}
        />
        <YAxis
          tick={{ fontSize: 10, fill: 'var(--muted-foreground)' }}
          axisLine={false}
          tickLine={false}
          tickFormatter={(v) => '₹' + (v / 1000).toFixed(0) + 'k'}
          width={48}
        />
        <Tooltip content={<CustomTooltip />} cursor={{ fill: 'var(--muted)', opacity: 0.5 }} />
        <Legend
          wrapperStyle={{ fontSize: 11, paddingTop: 4 }}
          iconType="square"
          iconSize={8}
        />
        <Bar dataKey="Cash" fill="url(#gradCash)" radius={[3, 3, 0, 0]} />
        <Bar dataKey="Coupons" fill="url(#gradCoupon)" radius={[3, 3, 0, 0]} />
        <Bar dataKey="Card" fill="url(#gradCC)" radius={[3, 3, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}