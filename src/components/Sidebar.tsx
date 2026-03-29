"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard, Play, Square, List, Droplets, BarChart3,
  Users, CreditCard, Settings, Menu, X, Fuel, FileSpreadsheet, Gauge
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/lib/i18n/useLanguage";
import { getCurrentUser } from "@/lib/store/data";
import type { Employee } from "@/lib/store/types";

const allNavItems = [
  { href: "/dashboard", icon: LayoutDashboard, label: "dashboard", roles: ["admin", "employee"] },
  { href: "/collections", icon: FileSpreadsheet, label: "daily_summary", roles: ["admin"] },
  { href: "/shift/start", icon: Play, label: "start_shift", roles: ["admin", "employee"] },
  { href: "/shift/end", icon: Square, label: "end_shift", roles: ["admin", "employee"] },
  { href: "/nozzles", icon: Gauge, label: "nozzle_readings", roles: ["admin"] },
  { href: "/shifts", icon: List, label: "shifts", roles: ["admin"] },
  { href: "/tanks", icon: Droplets, label: "tanks", roles: ["admin"] },
  { href: "/reports", icon: BarChart3, label: "reports", roles: ["admin"] },
  { href: "/employees", icon: Users, label: "employees", roles: ["admin"] },
  { href: "/credits", icon: CreditCard, label: "credits", roles: ["admin"] },
  { href: "/settings", icon: Settings, label: "settings", roles: ["admin"] },
];

export default function Sidebar() {
  const [open, setOpen] = useState(false);
  const [user, setUser] = useState<Employee | null>(null);
  const pathname = usePathname();
  const { t } = useLanguage();

  useEffect(() => {
    setUser(getCurrentUser());
  }, []);

  const navItems = allNavItems.filter(item => user && item.roles.includes(user.role));
  const initials = user?.name ? user.name.charAt(0).toUpperCase() : "?";

  return (
    <>
      {/* Mobile hamburger */}
      <button
        onClick={() => setOpen(true)}
        className="fixed top-3 left-3 z-50 md:hidden bg-gradient-to-br from-orange-500 to-amber-500 shadow-lg shadow-orange-200/50 rounded-xl p-2.5 active:scale-95 transition-transform"
      >
        <Menu className="w-5 h-5 text-white" />
      </button>

      {/* Overlay */}
      {open && (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm z-40 md:hidden" onClick={() => setOpen(false)} />
      )}

      {/* Sidebar */}
      <aside className={cn(
        "fixed top-0 left-0 h-full z-50 transition-transform duration-300 w-[260px]",
        "bg-gradient-to-b from-white via-white to-orange-50/30 border-r border-gray-100/80 shadow-xl shadow-black/5",
        "md:translate-x-0 md:static md:z-auto",
        open ? "translate-x-0" : "-translate-x-full"
      )}>
        {/* Logo */}
        <div className="flex items-center justify-between p-4 pb-5 border-b border-gray-100/80">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-orange-500 to-amber-500 flex items-center justify-center shadow-lg shadow-orange-200/50">
              <Fuel className="w-5 h-5 text-white" />
            </div>
            <div>
              <span className="font-bold text-base text-gray-800 leading-tight block">{t("app_name")}</span>
              <span className="text-[10px] text-gray-400 font-medium">Shift Manager</span>
            </div>
          </div>
          <button onClick={() => setOpen(false)} className="md:hidden p-1 hover:bg-gray-100 rounded-lg">
            <X className="w-5 h-5 text-gray-400" />
          </button>
        </div>

        {/* Nav */}
        <nav className="p-3 space-y-0.5 flex-1 overflow-y-auto">
          {navItems.map(item => {
            const active = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setOpen(false)}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-xl text-[13px] font-medium transition-all relative",
                  active
                    ? "bg-gradient-to-r from-orange-500/10 to-amber-500/5 text-orange-700 font-semibold"
                    : "text-gray-500 hover:bg-gray-50/80 hover:text-gray-800"
                )}
              >
                {active && (
                  <div className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 rounded-r-full bg-gradient-to-b from-orange-500 to-amber-500" />
                )}
                <div className={cn(
                  "w-8 h-8 rounded-lg flex items-center justify-center transition-all",
                  active
                    ? "bg-gradient-to-br from-orange-500 to-amber-500 shadow-sm shadow-orange-200/50"
                    : "bg-gray-100/80"
                )}>
                  <item.icon className={cn("w-4 h-4", active ? "text-white" : "text-gray-400")} />
                </div>
                {t(item.label)}
              </Link>
            );
          })}
        </nav>

        {/* User info at bottom */}
        {user && (
          <div className="p-3 border-t border-gray-100/80 mt-auto">
            <div className="flex items-center gap-2.5 px-3 py-2.5 bg-gray-50/80 rounded-xl">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-orange-400 to-amber-500 flex items-center justify-center shadow-sm">
                <span className="text-xs font-bold text-white">{initials}</span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-gray-700 truncate">{user.name}</p>
                <p className="text-[10px] text-gray-400 font-medium uppercase">{t(user.role)}</p>
              </div>
            </div>
          </div>
        )}
      </aside>
    </>
  );
}
