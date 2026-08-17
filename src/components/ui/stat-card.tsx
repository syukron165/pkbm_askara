import React from "react";
import { LucideIcon } from "lucide-react";

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: LucideIcon;
  trend?: {
    value: string;
    isPositive?: boolean;
  };
  colorTheme?: "emerald" | "blue" | "amber" | "indigo" | "rose" | "purple";
}

const COLOR_MAP = {
  emerald: {
    bg: "bg-emerald-50 text-emerald-700",
    border: "border-emerald-100",
    iconBg: "bg-emerald-500 text-white",
  },
  blue: {
    bg: "bg-blue-50 text-blue-700",
    border: "border-blue-100",
    iconBg: "bg-blue-600 text-white",
  },
  amber: {
    bg: "bg-amber-50 text-amber-700",
    border: "border-amber-100",
    iconBg: "bg-amber-500 text-white",
  },
  indigo: {
    bg: "bg-indigo-50 text-indigo-700",
    border: "border-indigo-100",
    iconBg: "bg-indigo-600 text-white",
  },
  rose: {
    bg: "bg-rose-50 text-rose-700",
    border: "border-rose-100",
    iconBg: "bg-rose-500 text-white",
  },
  purple: {
    bg: "bg-purple-50 text-purple-700",
    border: "border-purple-100",
    iconBg: "bg-purple-600 text-white",
  },
};

export function StatCard({
  title,
  value,
  subtitle,
  icon: Icon,
  trend,
  colorTheme = "emerald",
}: StatCardProps) {
  const theme = COLOR_MAP[colorTheme] || COLOR_MAP.emerald;

  return (
    <div className="bg-white rounded-xl border border-slate-200/80 p-5 shadow-soft hover-lift">
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
          {title}
        </span>
        <div className={`p-2.5 rounded-lg ${theme.iconBg} shadow-sm`}>
          <Icon className="w-5 h-5" />
        </div>
      </div>

      <div className="mt-3">
        <div className="text-2xl font-bold text-slate-800 tracking-tight">{value}</div>
        {subtitle && <p className="text-xs text-slate-500 mt-1">{subtitle}</p>}
      </div>

      {trend && (
        <div className="mt-3 pt-3 border-t border-slate-100 flex items-center text-xs">
          <span
            className={`font-semibold ${
              trend.isPositive ? "text-emerald-600" : "text-rose-600"
            }`}
          >
            {trend.value}
          </span>
          <span className="text-slate-400 ml-1.5">dibandingkan bulan lalu</span>
        </div>
      )}
    </div>
  );
}
