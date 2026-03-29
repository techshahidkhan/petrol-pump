"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Play, Square, List, FileSpreadsheet, BarChart3 } from "lucide-react";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/lib/i18n/useLanguage";
import { getCurrentUser } from "@/lib/store/data";
import type { Employee } from "@/lib/store/types";

const employeeNav = [
  { href: "/dashboard", icon: LayoutDashboard, label: "dashboard" },
  { href: "/shift/start", icon: Play, label: "start_shift" },
  { href: "/shift/end", icon: Square, label: "end_shift" },
];

const adminNav = [
  { href: "/dashboard", icon: LayoutDashboard, label: "dashboard" },
  { href: "/collections", icon: FileSpreadsheet, label: "daily_summary" },
  { href: "/shifts", icon: List, label: "shifts" },
  { href: "/reports", icon: BarChart3, label: "reports" },
];

export default function BottomNav() {
  const [user, setUser] = useState<Employee | null>(null);
  const pathname = usePathname();
  const { t } = useLanguage();

  useEffect(() => {
    setUser(getCurrentUser());
  }, []);

  const items = user?.role === "admin" ? adminNav : employeeNav;

  return (
    <nav className="fixed bottom-3 left-3 right-3 md:hidden z-40">
      <div className="backdrop-blur-xl bg-white/75 border border-white/40 shadow-lg shadow-black/5 rounded-2xl px-2 py-1.5 pb-safe">
        <div className="flex justify-around items-center">
          {items.map(item => {
            const active = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex flex-col items-center gap-0.5 px-3 py-2 rounded-xl min-w-[60px] transition-all",
                  active ? "text-orange-600" : "text-gray-400 active:scale-95"
                )}
              >
                <div className={cn(
                  "w-9 h-9 rounded-xl flex items-center justify-center transition-all",
                  active
                    ? "bg-gradient-to-br from-orange-500 to-amber-500 shadow-md shadow-orange-200/50"
                    : "bg-transparent"
                )}>
                  <item.icon className={cn("w-5 h-5", active ? "text-white" : "text-gray-400")} />
                </div>
                <span className={cn(
                  "text-[10px] font-medium",
                  active ? "text-orange-600 font-semibold" : "text-gray-400"
                )}>
                  {t(item.label)}
                </span>
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
