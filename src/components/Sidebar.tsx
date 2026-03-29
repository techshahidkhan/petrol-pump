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

  return (
    <>
      {/* Mobile hamburger */}
      <button
        onClick={() => setOpen(true)}
        className="fixed top-3 left-3 z-50 md:hidden bg-white shadow-lg rounded-xl p-2.5"
      >
        <Menu className="w-6 h-6 text-gray-700" />
      </button>

      {/* Overlay */}
      {open && (
        <div className="fixed inset-0 bg-black/40 z-40 md:hidden" onClick={() => setOpen(false)} />
      )}

      {/* Sidebar */}
      <aside className={cn(
        "fixed top-0 left-0 h-full bg-white shadow-xl z-50 transition-transform duration-300 w-64",
        "md:translate-x-0 md:static md:z-auto",
        open ? "translate-x-0" : "-translate-x-full"
      )}>
        <div className="flex items-center justify-between p-4 border-b">
          <div className="flex items-center gap-2">
            <Fuel className="w-7 h-7 text-orange-500" />
            <span className="font-bold text-lg text-gray-800">{t("app_name")}</span>
          </div>
          <button onClick={() => setOpen(false)} className="md:hidden">
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <nav className="p-3 space-y-1">
          {navItems.map(item => {
            const active = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setOpen(false)}
                className={cn(
                  "flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all",
                  active
                    ? "bg-orange-50 text-orange-600 shadow-sm"
                    : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                )}
              >
                <item.icon className={cn("w-5 h-5", active ? "text-orange-500" : "text-gray-400")} />
                {t(item.label)}
              </Link>
            );
          })}
        </nav>
      </aside>
    </>
  );
}
