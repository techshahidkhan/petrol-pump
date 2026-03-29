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
  orange: { bg: "bg-orange-50", icon: "text-orange-500", border: "border-orange-100" },
  green: { bg: "bg-green-50", icon: "text-green-500", border: "border-green-100" },
  red: { bg: "bg-red-50", icon: "text-red-500", border: "border-red-100" },
  blue: { bg: "bg-blue-50", icon: "text-blue-500", border: "border-blue-100" },
};

export default function KPICard({ title, value, icon: Icon, color, subtitle }: KPICardProps) {
  const c = colorMap[color];
  return (
    <div className={cn("rounded-2xl border p-4 shadow-sm", c.bg, c.border)}>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-gray-500 font-medium">{title}</p>
          <p className="text-2xl font-bold text-gray-800 mt-1">{value}</p>
          {subtitle && <p className="text-xs text-gray-400 mt-1">{subtitle}</p>}
        </div>
        <div className={cn("p-2.5 rounded-xl", c.bg)}>
          <Icon className={cn("w-6 h-6", c.icon)} />
        </div>
      </div>
    </div>
  );
}
