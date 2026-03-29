"use client";
import { cn } from "@/lib/utils";
import type { LucideIcon } from "lucide-react";

interface KPICardProps {
  title: string;
  value: string;
  icon: LucideIcon;
  color: "orange" | "green" | "red" | "blue";
  subtitle?: string;
}

const colorMap = {
  orange: {
    card: "border-orange-100/50",
    iconBg: "bg-gradient-to-br from-orange-400 to-amber-500 shadow-orange-200/60",
    value: "text-gray-800",
  },
  green: {
    card: "border-emerald-100/50",
    iconBg: "bg-gradient-to-br from-emerald-400 to-green-500 shadow-emerald-200/60",
    value: "text-gray-800",
  },
  red: {
    card: "border-red-100/50",
    iconBg: "bg-gradient-to-br from-red-400 to-rose-500 shadow-red-200/60",
    value: "text-gray-800",
  },
  blue: {
    card: "border-blue-100/50",
    iconBg: "bg-gradient-to-br from-blue-400 to-indigo-500 shadow-blue-200/60",
    value: "text-gray-800",
  },
};

export default function KPICard({ title, value, icon: Icon, color, subtitle }: KPICardProps) {
  const c = colorMap[color];
  return (
    <div className={cn(
      "glass-card rounded-2xl p-4 hover-lift cursor-default",
      c.card
    )}>
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <p className="text-xs font-medium text-gray-400 uppercase tracking-wide">{title}</p>
          <p className={cn("text-2xl font-extrabold tracking-tight", c.value)}>{value}</p>
          {subtitle && <p className="text-xs text-gray-400 mt-0.5">{subtitle}</p>}
        </div>
        <div className={cn("p-2.5 rounded-xl shadow-lg", c.iconBg)}>
          <Icon className="w-5 h-5 text-white" />
        </div>
      </div>
    </div>
  );
}
